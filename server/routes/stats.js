// ============================================
// ROUTES STATISTIQUES
// ============================================
// Gère l'enregistrement et l'affichage des statistiques

import express from 'express';
import { getDatabase } from '../database.js';

const router = express.Router();
const db = getDatabase();

// Middleware pour vérifier si l'utilisateur est connecté ET producteur
function requireAuth(req, res, next) {
  if (!req.session || !req.session.utilisateurId) {
    return res.status(401).json({ error: 'Non autorisé - Session manquante' });
  }
  
  // Vérifier que l'utilisateur est producteur
  const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(req.session.utilisateurId);
  
  if (!producteur) {
    return res.status(403).json({ error: 'Accès réservé aux producteurs' });
  }
  
  // Ajouter producteurId à la requête pour faciliter l'utilisation
  req.producteurId = producteur.id;
  next();
}

// Fonction utilitaire pour obtenir le plan d'abonnement
function getSubscriptionPlan(producerId) {
  const subscription = db.prepare(`
    SELECT plan, status, current_period_end, cancel_at_period_end, stripe_subscription_id
    FROM subscriptions 
    WHERE producer_id = ?
  `).get(producerId);
  
  if (!subscription) {
    return 'free';
  }
  
  // Vérifier si la période n'est pas expirée
  // Même si le plan est 'free' ou status 'canceled', si la période n'est pas expirée ET qu'il y a un stripe_subscription_id,
  // l'utilisateur garde l'accès Pro jusqu'à la fin de la période payée
  if (subscription.current_period_end) {
    const periodEnd = new Date(subscription.current_period_end);
    const now = new Date();
    const isNotExpired = periodEnd > now;
    
    // Si la période n'est pas expirée ET (plan = 'pro' OU il y a un stripe_subscription_id)
    if (isNotExpired && (subscription.plan === 'pro' || subscription.stripe_subscription_id)) {
      console.log('🔍 getSubscriptionPlan pour producteur', producerId, {
        plan: subscription.plan,
        status: subscription.status,
        periodEnd: subscription.current_period_end,
        periodEndDate: periodEnd.toISOString(),
        now: now.toISOString(),
        isNotExpired,
        hasStripeId: !!subscription.stripe_subscription_id,
        result: 'pro'
      });
      return 'pro';
    }
  } else {
    // Si pas de date de fin, considérer comme actif si status = active et plan = pro
    if (subscription.status === 'active' && subscription.plan === 'pro') {
      console.log('🔍 getSubscriptionPlan: pas de date de fin, status active et plan pro -> pro');
      return 'pro';
    }
  }
  
  console.log('🔍 getSubscriptionPlan: retourne free pour producteur', producerId, {
    plan: subscription.plan,
    status: subscription.status,
    hasPeriodEnd: !!subscription.current_period_end,
    hasStripeId: !!subscription.stripe_subscription_id
  });
  
  return 'free';
}

// Fonction utilitaire pour calculer les dates de période
function getPeriodDates(periode) {
  const now = new Date();
  let startDate = new Date(now);
  let endDate = now;
  let previousStartDate = null;
  let previousEndDate = null;

  if (periode === 'semaine' || periode === '7 jours') {
    // 7 jours
    startDate.setDate(startDate.getDate() - 7);
    previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - 7);
    previousEndDate = new Date(startDate);
  } else if (periode === 'mois' || periode === '1 mois') {
    // 30 jours
    startDate.setDate(startDate.getDate() - 30);
    previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - 30);
    previousEndDate = new Date(startDate);
  } else if (periode === '3mois' || periode === '3 mois') {
    // 90 jours
    startDate.setDate(startDate.getDate() - 90);
    previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - 90);
    previousEndDate = new Date(startDate);
  } else if (periode === 'annee' || periode === '1 an') {
    // 365 jours
    startDate.setDate(startDate.getDate() - 365);
    previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - 365);
    previousEndDate = new Date(startDate);
  } else {
    // Par défaut: 7 jours
    startDate.setDate(startDate.getDate() - 7);
  }

  return { startDate, endDate, previousStartDate, previousEndDate };
}

// Route pour enregistrer une vue (quand un utilisateur clique sur un producteur)
router.post('/vue/:producteurId', (req, res) => {
  try {
    const { producteurId } = req.params;
    
    // ANTI-TRICHE : Si l'utilisateur connecté est producteur et clique sur sa propre ferme, ne pas compter
    let producteurIdConnecte = null;
    if (req.session.utilisateurId) {
      const producteurConnecte = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(req.session.utilisateurId);
      producteurIdConnecte = producteurConnecte?.id || null;
    }
    
    if (producteurIdConnecte && parseInt(producteurId) === parseInt(producteurIdConnecte)) {
      return res.json({ success: true, skipped: true, reason: 'producteur_connecte' });
    }
    
    // Vérifier que le producteur existe
    const producteurExiste = db.prepare('SELECT id FROM producteurs WHERE id = ?').get(producteurId);
    const producteurIdStr = String(producteurId);
    if (!producteurExiste && !producteurIdStr.startsWith('place_')) {
      return res.status(404).json({ error: 'Producteur non trouvé' });
    }

    // Enregistrer uniquement si c'est un producteur enregistré (pas Places API)
    if (!producteurIdStr.startsWith('place_')) {
      // Enregistrer avec l'utilisateur_id si connecté (pour les tranches d'âge)
      const utilisateurId = req.session?.utilisateurId || null;
      
      // Enregistrer dans l'ancienne table (compatibilité)
      db.prepare('INSERT INTO statistiques (producteur_id, type_stat, utilisateur_id) VALUES (?, ?, ?)')
        .run(producteurId, 'vue', utilisateurId);
      
      // Enregistrer dans analytics_events (nouvelle architecture)
      db.prepare('INSERT INTO analytics_events (producer_id, user_id, event_type, created_at) VALUES (?, ?, ?, ?)')
        .run(producteurId, utilisateurId, 'view', new Date().toISOString());
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur enregistrement vue:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
});

// Route pour enregistrer un clic sur "Y aller"
router.post('/clic-y-aller/:producteurId', (req, res) => {
  try {
    const { producteurId } = req.params;
    
    // ANTI-TRICHE : Si l'utilisateur connecté est producteur et clique sur sa propre ferme, ne pas compter
    let producteurIdConnecte = null;
    if (req.session.utilisateurId) {
      const producteurConnecte = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(req.session.utilisateurId);
      producteurIdConnecte = producteurConnecte?.id || null;
    }
    
    if (producteurIdConnecte && parseInt(producteurId) === parseInt(producteurIdConnecte)) {
      return res.json({ success: true, skipped: true, reason: 'producteur_connecte' });
    }
    
    const producteurExiste = db.prepare('SELECT id FROM producteurs WHERE id = ?').get(producteurId);
    const producteurIdStr = String(producteurId);
    if (!producteurExiste && !producteurIdStr.startsWith('place_')) {
      return res.status(404).json({ error: 'Producteur non trouvé' });
    }

    // Enregistrer uniquement si c'est un producteur enregistré
    if (!producteurIdStr.startsWith('place_')) {
      // Enregistrer avec l'utilisateur_id si connecté (pour les tranches d'âge)
      const utilisateurId = req.session?.utilisateurId || null;
      
      // Enregistrer dans l'ancienne table (compatibilité)
      db.prepare('INSERT INTO statistiques (producteur_id, type_stat, utilisateur_id) VALUES (?, ?, ?)')
        .run(producteurId, 'clic_y_aller', utilisateurId);
      
      // Enregistrer dans analytics_events (nouvelle architecture)
      db.prepare('INSERT INTO analytics_events (producer_id, user_id, event_type, created_at) VALUES (?, ?, ?, ?)')
        .run(producteurId, utilisateurId, 'go', new Date().toISOString());
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur enregistrement clic:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
});

// Route pour obtenir les tranches d'âge des visiteurs (DOIT être avant /producteur/:producteurId)
router.get('/producteur/:producteurId/tranches-age', requireAuth, (req, res) => {
  try {
    const { producteurId } = req.params;
    const { periode } = req.query;

    // Vérifier que le producteur connecté demande ses propres stats
    if (parseInt(producteurId) !== req.producteurId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Utiliser la fonction utilitaire pour obtenir les dates
    const { startDate, endDate } = getPeriodDates(periode);
    let dateFilter = '';
    if (periode !== 'tous') {
      dateFilter = `AND e.created_at >= '${startDate.toISOString()}' AND e.created_at <= '${endDate.toISOString()}'`;
    }

    // Récupérer toutes les statistiques avec les dates de naissance des utilisateurs depuis analytics_events
    const stats = db.prepare(`
      SELECT DISTINCT e.user_id, u.date_naissance
      FROM analytics_events e
      LEFT JOIN utilisateurs u ON e.user_id = u.id
      WHERE e.producer_id = ? AND e.user_id IS NOT NULL ${dateFilter}
    `).all(producteurId);

    // Fonction pour calculer l'âge
    const calculerAge = (dateNaissance) => {
      if (!dateNaissance) return null;
      const today = new Date();
      const naissance = new Date(dateNaissance);
      let age = today.getFullYear() - naissance.getFullYear();
      const moisDiff = today.getMonth() - naissance.getMonth();
      if (moisDiff < 0 || (moisDiff === 0 && today.getDate() < naissance.getDate())) {
        age--;
      }
      return age;
    };

    // Fonction pour classer dans une tranche
    const classerTranche = (age) => {
      if (!age || age < 13) return null;
      if (age <= 17) return '13-17';
      if (age <= 24) return '18-24';
      if (age <= 34) return '25-34';
      if (age <= 44) return '35-44';
      if (age <= 54) return '45-54';
      if (age <= 64) return '55-64';
      return '65+';
    };

    // Compter par tranche d'âge
    const tranches = {
      '13-17': 0,
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45-54': 0,
      '55-64': 0,
      '65+': 0
    };

    stats.forEach(stat => {
      if (stat.date_naissance) {
        const age = calculerAge(stat.date_naissance);
        const tranche = classerTranche(age);
        if (tranche) {
          tranches[tranche]++;
        }
      }
    });

    // Calculer le total
    const total = Object.values(tranches).reduce((sum, count) => sum + count, 0);

    // Calculer les pourcentages
    const tranchesAvecPourcentage = Object.entries(tranches).map(([tranche, count]) => ({
      tranche,
      count,
      pourcentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));

    res.json({
      tranches: tranchesAvecPourcentage,
      total
    });
  } catch (error) {
    console.error('Erreur récupération tranches d\'âge:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Route pour obtenir les statistiques d'un producteur (nécessite connexion)
// Utilise analytics_events pour calculs à la demande
router.get('/producteur/:producteurId', requireAuth, (req, res) => {
  try {
    const { producteurId } = req.params;
    const { periode } = req.query || 'tous';

    // Vérifier que le producteur connecté demande ses propres stats
    if (parseInt(producteurId) !== req.producteurId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Obtenir le plan d'abonnement
    const plan = getSubscriptionPlan(producteurId);
    
    // Pour le plan gratuit, toujours limiter à 7 derniers jours (peu importe la période demandée)
    let actualStartDate;
    let actualEndDate = new Date();
    
    if (plan === 'free') {
      actualStartDate = new Date();
      actualStartDate.setDate(actualStartDate.getDate() - 7);
    } else {
      // Pour les plans payants, utiliser la période demandée
      const dates = getPeriodDates(periode);
      actualStartDate = dates.startDate;
      actualEndDate = dates.endDate;
    }
    
    // Construire le filtre de date
    let dateFilter = '';
    if (actualStartDate.getTime() > 0) {
      // SQLite accepte les dates ISO directement sans datetime()
      dateFilter = `AND created_at >= '${actualStartDate.toISOString()}' AND created_at <= '${actualEndDate.toISOString()}'`;
    }

    // Calculer les stats à la demande depuis analytics_events
    const vues = db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events 
      WHERE producer_id = ? AND event_type = 'view' ${dateFilter}
    `).get(producteurId);

    const clicsYAller = db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events 
      WHERE producer_id = ? AND event_type = 'go' ${dateFilter}
    `).get(producteurId);

    const totalVisites = db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events 
      WHERE producer_id = ? ${dateFilter}
    `).get(producteurId);

    // Récupérer le nom de la ferme
    const producteur = db.prepare('SELECT nom FROM producteurs WHERE id = ?').get(producteurId);

    res.json({
      nomFerme: producteur?.nom || 'Non disponible',
      nombreVues: vues?.count || 0,
      nombreClicsYAller: clicsYAller?.count || 0,
      nombreTotalVisites: totalVisites?.count || 0,
      periode: periode || 'tous',
      plan: plan
    });
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Route pour obtenir les visiteurs par jour (7 derniers jours par défaut)
router.get('/producteur/:producteurId/visiteurs-jour', requireAuth, (req, res) => {
  try {
    const { producteurId } = req.params;
    const { periode } = req.query || 'mois';

    if (parseInt(producteurId) !== req.producteurId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const plan = getSubscriptionPlan(producteurId);
    const { startDate, endDate } = getPeriodDates(periode);

    // Pour le plan gratuit, limiter à 7 jours maximum
    let actualStartDate = startDate;
    if (plan === 'free') {
      const freeLimitDate = new Date();
      freeLimitDate.setDate(freeLimitDate.getDate() - 7);
      if (startDate < freeLimitDate) {
        actualStartDate = freeLimitDate;
      }
    }

    // Grouper par jour
    const events = db.prepare(`
      SELECT 
        DATE(created_at) as jour,
        COUNT(*) as count
      FROM analytics_events
      WHERE producer_id = ? 
        AND created_at >= '${actualStartDate.toISOString()}' 
        AND created_at <= '${endDate.toISOString()}'
      GROUP BY DATE(created_at)
      ORDER BY jour DESC
      LIMIT 7
    `).all(producteurId);

    // Formater pour le graphique
    const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const data = events.map(event => {
      const date = new Date(event.jour);
      return {
        day: jours[date.getDay()],
        count: event.count
      };
    }).reverse(); // Plus ancien au plus récent

    res.json({ data });
  } catch (error) {
    console.error('Erreur visiteurs par jour:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Route pour obtenir les top heures de visite
router.get('/producteur/:producteurId/top-heures', requireAuth, (req, res) => {
  try {
    const { producteurId } = req.params;
    const { periode } = req.query || 'mois';

    if (parseInt(producteurId) !== req.producteurId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const plan = getSubscriptionPlan(producteurId);
    
    // Pour le plan gratuit, toujours limiter à 7 derniers jours
    let actualStartDate;
    let actualEndDate = new Date();
    
    if (plan === 'free') {
      actualStartDate = new Date();
      actualStartDate.setDate(actualStartDate.getDate() - 7);
    } else {
      const dates = getPeriodDates(periode);
      actualStartDate = dates.startDate.getTime() > 0 ? dates.startDate : new Date(0);
      actualEndDate = dates.endDate;
    }

    // Extraire l'heure et compter
    const events = db.prepare(`
      SELECT 
        CAST(strftime('%H', created_at) AS INTEGER) as heure,
        COUNT(*) as count
      FROM analytics_events
      WHERE producer_id = ? 
        AND created_at >= '${actualStartDate.toISOString()}' 
        AND created_at <= '${actualEndDate.toISOString()}'
      GROUP BY strftime('%H', created_at)
      ORDER BY heure
    `).all(producteurId);

    // Définir les plages horaires
    const plages = [
      { plage: '6h–9h', min: 6, max: 8 },
      { plage: '9h–12h', min: 9, max: 11 },
      { plage: '12h–15h', min: 12, max: 14 },
      { plage: '15h–18h', min: 15, max: 17 },
      { plage: '18h–21h', min: 18, max: 20 },
      { plage: '21h–00h', min: 21, max: 23 }
    ];

    // Créer un map des heures
    const heuresMap = {};
    events.forEach(event => {
      heuresMap[event.heure] = event.count;
    });

    // Compter par plage
    let total = 0;
    const plagesAvecCount = plages.map(plage => {
      let count = 0;
      for (let h = plage.min; h <= plage.max; h++) {
        count += heuresMap[h] || 0;
      }
      total += count;
      return { ...plage, count };
    });

    // Calculer les pourcentages
    const plagesAvecPourcentage = plagesAvecCount.map(plage => ({
      plage: plage.plage,
      count: plage.count,
      pourcentage: total > 0 ? Math.round((plage.count / total) * 100) : 0
    }));

    res.json({ plages: plagesAvecPourcentage, total });
  } catch (error) {
    console.error('Erreur top heures:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Route pour obtenir la comparaison avec la période précédente
router.get('/producteur/:producteurId/comparaison', requireAuth, (req, res) => {
  try {
    const { producteurId } = req.params;
    const { periode } = req.query || 'mois';

    if (parseInt(producteurId) !== req.producteurId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const plan = getSubscriptionPlan(producteurId);

    // Pour le plan gratuit, retourner null (fonctionnalité réservée)
    if (plan === 'free') {
      return res.json({
        vues: { current: 0, previous: null },
        clics: { current: 0, previous: null }
      });
    }
    
    const { startDate, endDate, previousStartDate, previousEndDate } = getPeriodDates(periode);

    if (!previousStartDate || !previousEndDate) {
      return res.json({
        vues: { current: 0, previous: null },
        clics: { current: 0, previous: null }
      });
    }

    // Stats période actuelle
    const vuesCurrent = db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events 
      WHERE producer_id = ? AND event_type = 'view'
        AND created_at >= '${startDate.toISOString()}' 
        AND created_at <= '${endDate.toISOString()}'
    `).get(producteurId);

    const clicsCurrent = db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events 
      WHERE producer_id = ? AND event_type = 'go'
        AND created_at >= '${startDate.toISOString()}' 
        AND created_at <= '${endDate.toISOString()}'
    `).get(producteurId);

    // Stats période précédente
    const vuesPrevious = db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events 
      WHERE producer_id = ? AND event_type = 'view'
        AND created_at >= '${previousStartDate.toISOString()}' 
        AND created_at <= '${previousEndDate.toISOString()}'
    `).get(producteurId);

    const clicsPrevious = db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events 
      WHERE producer_id = ? AND event_type = 'go'
        AND created_at >= '${previousStartDate.toISOString()}' 
        AND created_at <= '${previousEndDate.toISOString()}'
    `).get(producteurId);

    res.json({
      vues: {
        current: vuesCurrent?.count || 0,
        previous: vuesPrevious?.count || 0
      },
      clics: {
        current: clicsCurrent?.count || 0,
        previous: clicsPrevious?.count || 0
      }
    });
  } catch (error) {
    console.error('Erreur comparaison:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

export { router as statsRoutes };


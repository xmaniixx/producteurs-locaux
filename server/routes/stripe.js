// ============================================
// ROUTES STRIPE - Paiements et Abonnements
// ============================================
// Gère les paiements Stripe Checkout avec Apple Pay et Google Pay

import express from 'express';
import Stripe from 'stripe';
import { getDatabase } from '../database.js';

const router = express.Router();
const db = getDatabase();

// Initialiser Stripe avec la clé secrète
// IMPORTANT: Cette initialisation se fait au chargement du module
// Assurez-vous que dotenv.config() est appelé AVANT l'import de ce fichier
let stripe = null;
let stripeInitialized = false;

function initializeStripe() {
  // Ne pas réinitialiser si déjà fait et fonctionnel
  if (stripeInitialized && stripe) {
    return stripe;
  }
  
  // Réinitialiser si nécessaire
  if (stripeInitialized && !stripe) {
    stripeInitialized = false;
  }
  
  stripeInitialized = true;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  // Vérifier la présence de la clé
  if (!stripeSecretKey || stripeSecretKey.trim() === '') {
    console.warn('⚠️  STRIPE_SECRET_KEY non configurée dans .env');
    stripe = null;
    return null;
  }
  
  // Vérifier le format de la clé
  const isValidFormat = stripeSecretKey.startsWith('sk_test_') || 
                        stripeSecretKey.startsWith('sk_live_') || 
                        stripeSecretKey.startsWith('mk_');
  
  if (!isValidFormat) {
    console.error('❌ STRIPE_SECRET_KEY format invalide');
    stripe = null;
    return null;
  }
  
  // Initialiser Stripe
  try {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });
    
    const mode = stripeSecretKey.startsWith('sk_live_') ? 'PRODUCTION' : 'TEST';
    console.log('✅ Stripe initialisé (mode: ' + mode + ')');
    
    return stripe;
  } catch (error) {
    console.error('❌ Erreur initialisation Stripe:', error.message);
    stripe = null;
    return null;
  }
}

// Initialiser Stripe au chargement du module
initializeStripe();

// Middleware pour vérifier l'authentification
function requireAuth(req, res, next) {
  if (!req.session || !req.session.utilisateurId) {
    return res.status(401).json({ error: 'Non autorisé - Session manquante' });
  }
  next();
}

// Endpoint pour créer une session Stripe Checkout
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  // Réessayer d'initialiser Stripe si nécessaire
  if (!stripe) {
    initializeStripe();
  }
  
  if (!stripe) {
    return res.status(503).json({ 
      error: 'Le paiement n\'est pas encore configuré. Veuillez réessayer plus tard.',
      code: 'STRIPE_NOT_CONFIGURED'
    });
  }
  
  try {
    const utilisateurId = req.session.utilisateurId;
    
    // Vérifier que l'utilisateur est producteur
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(utilisateurId);
    
    if (!producteur) {
      return res.status(403).json({ error: 'Accès réservé aux producteurs' });
    }
    
    const producteurId = producteur.id;
    
    // Vérifier si l'utilisateur a déjà un abonnement actif
    const existingSubscription = db.prepare(`
      SELECT stripe_subscription_id, status, current_period_end, plan
      FROM subscriptions 
      WHERE producer_id = ?
    `).get(producteurId);
    
    // Vérifier si l'abonnement est vraiment actif (status = 'active' ET période non expirée)
    if (existingSubscription) {
      const isActive = existingSubscription.status === 'active';
      let isExpired = false;
      
      if (existingSubscription.current_period_end) {
        const periodEnd = new Date(existingSubscription.current_period_end);
        const now = new Date();
        isExpired = periodEnd < now;
      }
      
      // Si l'abonnement est actif et non expiré
      if (isActive && !isExpired && existingSubscription.plan === 'pro') {
        // En mode test, permettre de créer une nouvelle session même avec un abonnement actif
        // (pour faciliter les tests)
        const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
        
        if (isTestMode) {
          // En mode test, permettre de réabonner (utile pour les tests)
          console.log('Mode TEST: Permettre la création d\'une nouvelle session malgré l\'abonnement actif');
          // Continuer le processus (ne pas retourner d'erreur)
        } else {
          // En production, bloquer si abonnement actif
          return res.status(400).json({ 
            error: 'Vous avez déjà un abonnement actif',
            code: 'SUBSCRIPTION_ALREADY_ACTIVE'
          });
        }
      } else {
        // Si l'abonnement est expiré ou inactif, on peut créer une nouvelle session
        console.log('Abonnement existant mais inactif/expiré, création d\'une nouvelle session');
      }
    }
    
    // Récupérer ou créer le customer Stripe
    let stripeCustomerId;
    const existingCustomer = db.prepare('SELECT stripe_customer_id FROM subscriptions WHERE producer_id = ?').get(producteurId);
    
    if (existingCustomer?.stripe_customer_id) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
    } else {
      // Récupérer l'email de l'utilisateur
      const utilisateur = db.prepare('SELECT email FROM utilisateurs WHERE id = ?').get(utilisateurId);
      
      // Créer un nouveau customer Stripe
      const customer = await stripe.customers.create({
        email: utilisateur?.email || undefined,
        metadata: {
          producteur_id: producteurId.toString(),
          utilisateur_id: utilisateurId.toString(),
        },
      });
      
      stripeCustomerId = customer.id;
      
      // Mettre à jour ou créer l'entrée subscription
      const existingSub = db.prepare('SELECT id FROM subscriptions WHERE producer_id = ?').get(producteurId);
      if (existingSub) {
        db.prepare('UPDATE subscriptions SET stripe_customer_id = ? WHERE producer_id = ?')
          .run(stripeCustomerId, producteurId);
      } else {
        db.prepare(`
          INSERT INTO subscriptions (producer_id, plan, stripe_customer_id)
          VALUES (?, 'free', ?)
        `).run(producteurId, stripeCustomerId);
      }
    }
    
    // Créer la session Checkout
    // IMPORTANT: Le price_id doit être configuré dans Stripe Dashboard
    const priceId = process.env.STRIPE_PRICE_ID_PRO;
    
    if (!priceId || priceId.trim() === '' || !priceId.startsWith('price_')) {
      console.error('❌ STRIPE_PRICE_ID_PRO non configuré ou invalide');
      return res.status(503).json({ 
        error: 'Le paiement n\'est pas encore configuré. Veuillez réessayer plus tard.',
        code: 'STRIPE_PRICE_NOT_CONFIGURED'
      });
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/producteur/dashboard`,
      allow_promotion_codes: true,
      metadata: {
        producteur_id: producteurId.toString(),
        utilisateur_id: utilisateurId.toString(),
      },
    });
    
    console.log('✅ Session Stripe créée:', session.id);
    console.log('   URL:', session.url);
    
    if (!session.url) {
      console.error('❌ Session créée mais URL manquante');
      return res.status(500).json({ 
        error: 'Erreur lors de la création de la session de paiement',
        code: 'STRIPE_ERROR'
      });
    }
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Erreur création session Stripe:', error.message);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la session de paiement',
      code: 'STRIPE_ERROR'
    });
  }
});

// Route pour vérifier et activer l'abonnement après paiement (mode test)
router.post('/verify-session', requireAuth, async (req, res) => {
  // Réessayer d'initialiser Stripe si nécessaire
  if (!stripe) {
    initializeStripe();
  }
  
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe non configuré' });
  }
  
  try {
    const { session_id } = req.body;
    
    if (!session_id) {
      return res.status(400).json({ error: 'session_id requis' });
    }
    
    // Récupérer la session depuis Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Paiement non complété' });
    }
    
    // Récupérer les métadonnées
    const producteurId = parseInt(session.metadata?.producteur_id);
    const utilisateurId = parseInt(session.metadata?.utilisateur_id);
    
    if (!producteurId) {
      return res.status(400).json({ error: 'producteur_id manquant' });
    }
    
    // Vérifier que c'est bien le producteur connecté
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(req.session.utilisateurId);
    if (!producteur || producteur.id !== producteurId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Récupérer la subscription depuis Stripe
    const subscriptionId = session.subscription;
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID manquant' });
    }
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price?.id;
    
    // Mettre à jour la base de données
    const now = new Date().toISOString();
    const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    
    db.prepare(`
      UPDATE subscriptions 
      SET 
        plan = 'pro',
        stripe_subscription_id = ?,
        stripe_price_id = ?,
        status = ?,
        current_period_start = ?,
        current_period_end = ?,
        updated_at = ?
      WHERE producer_id = ?
    `).run(
      subscriptionId,
      priceId,
      subscription.status,
      periodStart,
      periodEnd,
      now,
      producteurId
    );
    
    console.log(`✅ Abonnement Pro activé pour producteur ${producteurId}`);
    
    res.json({ success: true, message: 'Abonnement activé avec succès' });
  } catch (error) {
    console.error('Erreur vérification session:', error.message);
    res.status(500).json({ error: 'Erreur lors de la vérification: ' + error.message });
  }
});

// Route alternative pour activer manuellement l'abonnement (mode test uniquement)
router.post('/activate-subscription', requireAuth, async (req, res) => {
  try {
    const utilisateurId = req.session.utilisateurId;
    
    // Vérifier que l'utilisateur est producteur
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(utilisateurId);
    
    if (!producteur) {
      return res.status(403).json({ error: 'Accès réservé aux producteurs' });
    }
    
    const producteurId = producteur.id;
    
    // Vérifier si on est en mode test
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
    if (!isTestMode) {
      return res.status(403).json({ error: 'Cette route est uniquement disponible en mode test' });
    }
    
    // Activer l'abonnement Pro manuellement (pour les tests)
    const now = new Date().toISOString();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 mois à partir de maintenant
    
    // Vérifier si une entrée existe déjà
    const existing = db.prepare('SELECT id FROM subscriptions WHERE producer_id = ?').get(producteurId);
    
    if (existing) {
      db.prepare(`
        UPDATE subscriptions 
        SET 
          plan = 'pro',
          status = 'active',
          current_period_start = ?,
          current_period_end = ?,
          updated_at = ?
        WHERE producer_id = ?
      `).run(now, periodEnd.toISOString(), now, producteurId);
    } else {
      db.prepare(`
        INSERT INTO subscriptions (producer_id, plan, status, current_period_start, current_period_end, updated_at)
        VALUES (?, 'pro', 'active', ?, ?, ?)
      `).run(producteurId, now, periodEnd.toISOString(), now);
    }
    
    console.log(`✅ Abonnement Pro activé manuellement pour producteur ${producteurId} (mode test)`);
    
    res.json({ success: true, message: 'Abonnement Pro activé avec succès' });
  } catch (error) {
    console.error('Erreur activation manuelle:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'activation: ' + error.message });
  }
});

// Route pour récupérer les informations de l'abonnement
router.get('/subscription', requireAuth, async (req, res) => {
  console.log('\n========================================');
  console.log('📥 GET /SUBSCRIPTION');
  console.log('========================================\n');
  
  // Réessayer d'initialiser Stripe si nécessaire (pour récupérer les infos depuis Stripe)
  if (!stripe) {
    initializeStripe();
  }
  
  try {
    const utilisateurId = req.session.utilisateurId;
    console.log('👤 User ID:', utilisateurId);
    
    // Vérifier que l'utilisateur est producteur
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(utilisateurId);
    
    if (!producteur) {
      console.log('❌ Utilisateur n\'est pas producteur');
      console.log('========================================\n');
      return res.status(403).json({ error: 'Accès réservé aux producteurs' });
    }
    
    const producteurId = producteur.id;
    console.log('📊 Producteur ID:', producteurId);
    console.log('');
    
    // Récupérer l'abonnement depuis la base de données
    const subscription = db.prepare(`
      SELECT 
        plan,
        status,
        stripe_subscription_id,
        stripe_customer_id,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        updated_at
      FROM subscriptions 
      WHERE producer_id = ?
    `).get(producteurId);
    
    if (!subscription) {
      console.log('ℹ️ Aucun abonnement trouvé dans la DB');
      console.log('========================================\n');
      return res.json({
        plan: 'free',
        status: 'none',
        hasSubscription: false
      });
    }
    
    console.log('📊 ABONNEMENT DB:');
    console.log('   - stripe_subscription_id:', subscription.stripe_subscription_id);
    console.log('   - cancel_at_period_end (DB):', subscription.cancel_at_period_end);
    console.log('   - status (DB):', subscription.status);
    console.log('');
    
    // Si on a un stripe_subscription_id, récupérer les infos depuis Stripe (SOURCE DE VÉRITÉ)
    let stripeSubscription = null;
    if (subscription.stripe_subscription_id && stripe) {
      try {
        console.log('📥 Récupération depuis Stripe...');
        stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        console.log('\n📊 ÉTAT LU DEPUIS STRIPE:');
        console.log('   - ID:', stripeSubscription.id);
        console.log('   - Status:', stripeSubscription.status);
        console.log('   - cancel_at_period_end:', stripeSubscription.cancel_at_period_end);
        console.log('   - Type cancel_at_period_end:', typeof stripeSubscription.cancel_at_period_end);
        console.log('   - current_period_end:', new Date(stripeSubscription.current_period_end * 1000).toISOString());
        console.log('');
      } catch (error) {
        console.error('❌ Erreur récupération subscription Stripe:', error.message);
        console.log('========================================\n');
        // Continuer avec les données de la base
      }
    }
    
    // Formater les dates
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };
    
    const formatDateTime = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return date.toLocaleString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // Calculer le prochain renouvellement et les jours restants
    let periodEndDate = null;
    if (subscription.current_period_end) {
      periodEndDate = new Date(subscription.current_period_end);
    } else if (stripeSubscription?.current_period_end) {
      periodEndDate = new Date(stripeSubscription.current_period_end * 1000);
    }
    
    let nextRenewal = null;
    let daysRemaining = null;
    if (periodEndDate) {
      nextRenewal = formatDate(periodEndDate.toISOString());
      const now = new Date();
      const diffTime = periodEndDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemaining = diffDays > 0 ? diffDays : 0;
    }
    
    // Vérifier si l'abonnement est actif (même si annulé, tant que la période n'est pas expirée)
    const now = new Date();
    const periodNotExpired = periodEndDate && periodEndDate > now;
    // L'utilisateur a accès Pro tant que la période n'est pas expirée
    // Même si le plan est 'free' ou status 'canceled' dans la base, si la période n'est pas expirée, l'accès Pro est conservé
    // On vérifie aussi s'il y a un stripe_subscription_id (preuve qu'il y a eu un abonnement)
    const hasActiveSubscription = subscription.stripe_subscription_id && periodNotExpired;
    const isActive = hasActiveSubscription || (subscription.plan === 'pro' && periodNotExpired);
    
    // ✅ CRITIQUE : Utiliser UNIQUEMENT Stripe comme source de vérité
    // Si on a Stripe, on utilise Stripe. Sinon, on utilise la DB (mais on devrait toujours avoir Stripe)
    let cancelAtPeriodEnd;
    let isCanceling;
    let finalStatus;
    
    if (stripeSubscription) {
      // ✅ UTILISER STRIPE UNIQUEMENT - PAS DE FALLBACK SUR LA DB
      cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end === true;
      isCanceling = cancelAtPeriodEnd;
      finalStatus = stripeSubscription.status;
      
      console.log('🔄 ÉTAT CALCULÉ DEPUIS STRIPE (SOURCE DE VÉRITÉ):');
      console.log('   - cancelAtPeriodEnd (Stripe):', cancelAtPeriodEnd);
      console.log('   - Valeur brute Stripe:', stripeSubscription.cancel_at_period_end);
      console.log('   - Type:', typeof stripeSubscription.cancel_at_period_end);
      console.log('   - isCanceling:', isCanceling);
      console.log('   - status (Stripe):', finalStatus);
      console.log('   - isActive:', isActive);
      console.log('   - daysRemaining:', daysRemaining);
      console.log('');
    } else {
      // Fallback sur la DB si pas de Stripe (ne devrait pas arriver)
      console.log('⚠️ Pas de Stripe, utilisation de la DB (fallback)');
      cancelAtPeriodEnd = subscription.cancel_at_period_end === 1;
      isCanceling = cancelAtPeriodEnd;
      finalStatus = subscription.status || 'none';
      
      console.log('🔄 ÉTAT CALCULÉ DEPUIS DB (FALLBACK):');
      console.log('   - cancelAtPeriodEnd (DB):', cancelAtPeriodEnd);
      console.log('   - isCanceling:', isCanceling);
      console.log('');
    }
    
    // Log pour déboguer
    console.log('🔍 Vérification abonnement producteur', producteurId, {
      plan: subscription.plan,
      status: subscription.status,
      periodEnd: subscription.current_period_end,
      periodEndDate: periodEndDate?.toISOString(),
      now: now.toISOString(),
      periodNotExpired,
      hasStripeId: !!subscription.stripe_subscription_id,
      hasActiveSubscription,
      isActive,
      daysRemaining
    });
    
    // 5. SYNCHRONISER LA DB si les valeurs diffèrent (si on a Stripe)
    if (stripeSubscription) {
      const dbCancelAtPeriodEnd = subscription.cancel_at_period_end === 1;
      if (dbCancelAtPeriodEnd !== cancelAtPeriodEnd || subscription.status !== stripeSubscription.status) {
        console.log('🔄 SYNCHRONISATION DB NÉCESSAIRE:');
        console.log('   - DB cancel_at_period_end:', dbCancelAtPeriodEnd);
        console.log('   - Stripe cancel_at_period_end:', cancelAtPeriodEnd);
        console.log('   - DB status:', subscription.status);
        console.log('   - Stripe status:', stripeSubscription.status);
        console.log('');

        // Utiliser les dates de Stripe si disponibles
        const periodStart = stripeSubscription.current_period_start 
          ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
          : subscription.current_period_start;
        const periodEnd = stripeSubscription.current_period_end 
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
          : subscription.current_period_end;

        db.prepare(`
          UPDATE subscriptions 
          SET cancel_at_period_end = ?,
              status = ?,
              current_period_start = ?,
              current_period_end = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE producer_id = ?
        `).run(
          cancelAtPeriodEnd ? 1 : 0,
          stripeSubscription.status,
          periodStart,
          periodEnd,
          producteurId
        );

        console.log('✅ DB SYNCHRONISÉE AVEC STRIPE');
        console.log('   - cancel_at_period_end mis à jour:', cancelAtPeriodEnd ? 1 : 0);
        console.log('   - status mis à jour:', stripeSubscription.status);
        console.log('');
      } else {
        console.log('ℹ️ DB déjà synchronisée avec Stripe');
        console.log('');
      }
    }
    
    const responseData = {
      // Si isActive est true, retourner 'pro' même si dans la base c'est 'free'
      plan: isActive ? 'pro' : (subscription.plan || 'free'),
      status: finalStatus, // Utiliser le status de Stripe
      hasSubscription: true,
      isActive: isActive, // S'assurer que c'est bien un booléen
      isCanceling: isCanceling, // Calculé depuis Stripe uniquement
      currentPeriodStart: formatDate(stripeSubscription?.current_period_start ? new Date(stripeSubscription.current_period_start * 1000).toISOString() : subscription.current_period_start),
      currentPeriodEnd: formatDate(stripeSubscription?.current_period_end ? new Date(stripeSubscription.current_period_end * 1000).toISOString() : subscription.current_period_end),
      nextRenewal,
      daysRemaining,
      cancelAtPeriodEnd: cancelAtPeriodEnd, // ✅ Valeur depuis Stripe uniquement
      stripeSubscriptionId: subscription.stripe_subscription_id,
      updatedAt: formatDateTime(new Date()) // Toujours retourner la date actuelle
    };
    
    // Log pour déboguer
    console.log('🔍 État annulation:', {
      cancelAtPeriodEnd,
      isCanceling,
      dbCancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeCancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end,
      status: subscription.status,
      stripeStatus: stripeSubscription?.status
    });
    
    console.log('📤 RÉPONSE ENVOYÉE AU FRONTEND:');
    console.log('   - cancelAtPeriodEnd:', responseData.cancelAtPeriodEnd);
    console.log('   - isCanceling:', responseData.isCanceling);
    console.log('   - isActive:', responseData.isActive);
    console.log('   - status:', responseData.status);
    console.log('========================================\n');
    
    res.json(responseData);
  } catch (error) {
    console.error('\n❌ ERREUR GET /SUBSCRIPTION:');
    console.error('   - Message:', error.message);
    console.error('   - Stack:', error.stack);
    console.log('========================================\n');
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'abonnement' });
  }
});

// Route pour annuler l'abonnement (conforme aux normes françaises)
router.post('/cancel-subscription', requireAuth, async (req, res) => {
  // Réessayer d'initialiser Stripe si nécessaire
  if (!stripe) {
    initializeStripe();
  }
  
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe non configuré' });
  }
  
  try {
    const utilisateurId = req.session.utilisateurId;
    // L'annulation se fait toujours à la fin de la période pour conserver l'accès
    
    // Vérifier que l'utilisateur est producteur
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(utilisateurId);
    
    if (!producteur) {
      return res.status(403).json({ error: 'Accès réservé aux producteurs' });
    }
    
    const producteurId = producteur.id;
    
    // Récupérer l'abonnement
    const subscription = db.prepare(`
      SELECT stripe_subscription_id, status, plan, current_period_end
      FROM subscriptions 
      WHERE producer_id = ?
    `).get(producteurId);
    
    if (!subscription || !subscription.stripe_subscription_id) {
      return res.status(404).json({ error: 'Aucun abonnement trouvé' });
    }
    
    // Vérifier si la période n'est pas expirée (même si le plan est 'free' ou status 'canceled')
    // L'utilisateur peut annuler tant que la période payée n'est pas expirée
    let canCancel = false;
    if (subscription.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end);
      const now = new Date();
      canCancel = periodEnd > now;
      console.log('🔍 Vérification annulation:', {
        periodEnd: subscription.current_period_end,
        periodEndDate: periodEnd.toISOString(),
        now: now.toISOString(),
        canCancel,
        plan: subscription.plan,
        status: subscription.status
      });
    } else {
      // Si pas de date de fin, vérifier le status et plan classique
      canCancel = subscription.plan === 'pro' && subscription.status === 'active';
      console.log('🔍 Vérification annulation (sans date):', {
        plan: subscription.plan,
        status: subscription.status,
        canCancel
      });
    }
    
    if (!canCancel) {
      console.log('❌ Annulation refusée:', {
        plan: subscription.plan,
        status: subscription.status,
        periodEnd: subscription.current_period_end
      });
      return res.status(400).json({ error: 'Aucun abonnement actif à annuler. Votre période d\'abonnement est déjà expirée.' });
    }
    
    // Vérifier le statut de l'abonnement Stripe avant de le modifier
    let stripeSubscription;
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      console.log('📋 Statut abonnement Stripe:', {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString()
      });
    } catch (error) {
      console.error('❌ Erreur récupération abonnement Stripe:', error.message);
      return res.status(500).json({ error: 'Erreur lors de la vérification de l\'abonnement' });
    }
    
    // SCÉNARIO 1 : Annulation d'un abonnement actif
    // Si l'abonnement est déjà annulé (canceled), on ne peut pas l'annuler à nouveau
    if (stripeSubscription.status === 'canceled') {
      console.log('⚠️ Abonnement déjà annulé dans Stripe');
      return res.status(400).json({ 
        error: 'Votre abonnement est déjà annulé. Pour réactiver, veuillez souscrire à nouveau.',
        requiresCheckout: true
      });
    }
    
    // Si l'abonnement est déjà programmé pour être annulé, on ne fait rien
    if (stripeSubscription.cancel_at_period_end === true) {
      console.log('ℹ️ Abonnement déjà programmé pour annulation à la fin de la période');
      return res.json({ 
        success: true,
        message: 'Votre abonnement est déjà programmé pour être annulé à la fin de la période.',
        isCanceling: true,
        cancelAtPeriodEnd: true
      });
    }
    
    // Si l'abonnement est actif, on programme l'annulation à la fin de la période
    if (stripeSubscription.status === 'active') {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true
        });
        
        // Mettre à jour la base de données
        db.prepare(`
          UPDATE subscriptions 
          SET 
            cancel_at_period_end = 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE producer_id = ?
        `).run(producteurId);
        
        console.log(`✅ Annulation programmée pour producteur ${producteurId} (fin de période)`);
        
        return res.json({ 
          success: true, 
          message: 'Votre abonnement sera annulé à la fin de la période en cours. Vous conservez l\'accès jusqu\'à cette date.',
          isCanceling: true,
          cancelAtPeriodEnd: true
        });
      } catch (error) {
        console.error('❌ Erreur modification abonnement Stripe:', error.message);
        throw error;
      }
    }
    
    // Cas non géré
    return res.status(400).json({ 
      error: `Impossible d'annuler l'abonnement. Statut: ${stripeSubscription.status}` 
    });
    
    console.log(`✅ Annulation programmée pour producteur ${producteurId} (fin de période)`);
    
    res.json({ 
      success: true, 
      message: 'Votre abonnement sera annulé à la fin de la période en cours. Vous conservez l\'accès jusqu\'à cette date.',
      canceled: false,
      cancelAtPeriodEnd: true
    });
  } catch (error) {
    console.error('Erreur annulation abonnement:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'annulation de l\'abonnement: ' + error.message });
  }
});

// Route pour réactiver l'abonnement (annuler l'annulation programmée)
router.post('/reactivate-subscription', requireAuth, async (req, res) => {
  console.log('\n========================================');
  console.log('🔄 DÉBUT RÉACTIVATION');
  console.log('========================================\n');
  
  // Réessayer d'initialiser Stripe si nécessaire
  if (!stripe) {
    initializeStripe();
  }
  
  if (!stripe) {
    console.log('❌ Stripe non configuré');
    console.log('========================================\n');
    return res.status(503).json({ error: 'Stripe non configuré' });
  }
  
  try {
    const utilisateurId = req.session.utilisateurId;
    console.log('👤 User ID:', utilisateurId);
    
    // Vérifier que l'utilisateur est producteur
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(utilisateurId);
    
    if (!producteur) {
      console.log('❌ Utilisateur n\'est pas producteur');
      return res.status(403).json({ error: 'Accès réservé aux producteurs' });
    }
    
    const producteurId = producteur.id;
    console.log('📊 Producteur ID:', producteurId);
    console.log('');
    
    // 1. Récupérer l'abonnement depuis la DB
    const subscription = db.prepare(`
      SELECT stripe_subscription_id, status, plan, cancel_at_period_end, stripe_customer_id
      FROM subscriptions 
      WHERE producer_id = ?
    `).get(producteurId);
    
    if (!subscription || !subscription.stripe_subscription_id) {
      console.log('❌ Aucun abonnement trouvé dans la DB');
      console.log('========================================\n');
      return res.status(404).json({ error: 'Aucun abonnement trouvé' });
    }
    
    console.log('📊 ABONNEMENT DB:');
    console.log('   - stripe_subscription_id:', subscription.stripe_subscription_id);
    console.log('   - cancel_at_period_end (DB):', subscription.cancel_at_period_end);
    console.log('   - status (DB):', subscription.status);
    console.log('');
    
    // 2. Récupérer l'abonnement depuis Stripe
    let stripeSubscription;
    try {
      console.log('📥 Récupération depuis Stripe...');
      stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    } catch (error) {
      console.error('❌ Erreur récupération abonnement Stripe:', error.message);
      console.log('========================================\n');
      return res.status(500).json({ error: 'Erreur lors de la vérification de l\'abonnement' });
    }
    
    console.log('📊 ÉTAT STRIPE AVANT MISE À JOUR:');
    console.log('   - ID:', stripeSubscription.id);
    console.log('   - Status:', stripeSubscription.status);
    console.log('   - cancel_at_period_end:', stripeSubscription.cancel_at_period_end);
    console.log('   - Type cancel_at_period_end:', typeof stripeSubscription.cancel_at_period_end);
    console.log('   - current_period_end:', new Date(stripeSubscription.current_period_end * 1000).toISOString());
    console.log('');
    
    // 3. VÉRIFICATION CRITIQUE : Si cancel_at_period_end = true, on DOIT réactiver
    console.log('🔍 Vérification condition:');
    console.log('   - stripeSubscription.cancel_at_period_end === true ?', stripeSubscription.cancel_at_period_end === true);
    console.log('   - Valeur brute:', stripeSubscription.cancel_at_period_end);
    console.log('');
    
    if (stripeSubscription.cancel_at_period_end === true) {
      console.log('✅ CONDITION VRAIE - On va réactiver\n');
      
      try {
        // MISE À JOUR STRIPE
        console.log('🔄 Mise à jour Stripe...');
        const updatedSubscription = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          { 
            cancel_at_period_end: false
          }
        );

        console.log('\n✅ STRIPE MIS À JOUR:');
        console.log('   - ID:', updatedSubscription.id);
        console.log('   - Status:', updatedSubscription.status);
        console.log('   - cancel_at_period_end:', updatedSubscription.cancel_at_period_end);
        console.log('   - Type:', typeof updatedSubscription.cancel_at_period_end);
        console.log('');

        // MISE À JOUR BASE DE DONNÉES
        console.log('🔄 Mise à jour base de données...');
        db.prepare(`
          UPDATE subscriptions 
          SET cancel_at_period_end = 0,
              status = 'active',
              updated_at = CURRENT_TIMESTAMP
          WHERE producer_id = ?
        `).run(producteurId);

        console.log('✅ BASE DE DONNÉES MISE À JOUR');
        console.log('   - cancel_at_period_end = 0');
        console.log('   - status = active');
        console.log('');
        console.log('========================================');
        console.log('✅ FIN RÉACTIVATION - SUCCÈS');
        console.log('========================================\n');

        // RETOUR AU FRONTEND
        return res.json({
          success: true,
          message: 'Votre abonnement a été réactivé. Le renouvellement automatique est à nouveau actif.',
          subscription: {
            status: updatedSubscription.status,
            cancelAtPeriodEnd: false,
            isCanceling: false,
            currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString()
          }
        });
      } catch (error) {
        console.error('\n❌ ERREUR LORS DE LA MISE À JOUR STRIPE:');
        console.error('   - Message:', error.message);
        console.error('   - Code:', error.code);
        console.log('========================================\n');
        return res.status(500).json({ error: 'Erreur lors de la réactivation de l\'abonnement: ' + error.message });
      }
    }
    
    // 4. Si l'abonnement est actif ET cancel_at_period_end = false
    if (stripeSubscription.status === 'active' && stripeSubscription.cancel_at_period_end === false) {
      console.log('⚠️ CONDITION FAUSSE - cancel_at_period_end est déjà false');
      console.log('   - Status:', stripeSubscription.status);
      console.log('   - cancel_at_period_end:', stripeSubscription.cancel_at_period_end);
      console.log('========================================\n');
      return res.json({ 
        success: true,
        message: 'Votre abonnement est déjà actif et renouvelé automatiquement.',
        subscription: {
          status: stripeSubscription.status,
          cancelAtPeriodEnd: false,
          isCanceling: false
        }
      });
    }
    
    // 5. Si l'abonnement est vraiment canceled
    if (stripeSubscription.status === 'canceled') {
      console.log('ℹ️ L\'abonnement est annulé, checkout requis');
      
      // Vérifier que la période n'est pas expirée
      const periodEnd = new Date(stripeSubscription.current_period_end * 1000);
      const now = new Date();
      
      if (periodEnd <= now) {
        return res.status(400).json({ 
          error: 'Votre abonnement a expiré. Veuillez souscrire à un nouvel abonnement via le bouton "Plan Pro".',
          requiresCheckout: true,
          status: 'expired'
        });
      }
      
      return res.json({ 
        requiresCheckout: true,
        message: 'Pour réactiver votre abonnement, veuillez souscrire à nouveau via le bouton "Plan Pro".'
      });
    }
    
    // 6. Cas non géré
    console.log('⚠️ État d\'abonnement non géré:', {
      status: stripeSubscription.status,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end
    });
    return res.status(400).json({ 
      error: 'État d\'abonnement invalide',
      status: stripeSubscription.status,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end
    });
  } catch (error) {
    console.error('❌ Erreur réactivation:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de la réactivation'
    });
  }
});

// Route pour récupérer la méthode de paiement
router.get('/payment-method', requireAuth, async (req, res) => {
  // Réessayer d'initialiser Stripe si nécessaire
  if (!stripe) {
    initializeStripe();
  }
  
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe non configuré' });
  }
  
  try {
    const utilisateurId = req.session.utilisateurId;
    
    // Récupérer le producteur
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(utilisateurId);
    
    if (!producteur) {
      return res.status(403).json({ error: 'Accès réservé aux producteurs' });
    }
    
    const producteurId = producteur.id;
    
    // Récupérer l'abonnement
    const subscription = db.prepare(`
      SELECT stripe_subscription_id, stripe_customer_id 
      FROM subscriptions 
      WHERE producer_id = ? 
      ORDER BY id DESC 
      LIMIT 1
    `).get(producteurId);
    
    if (!subscription?.stripe_subscription_id) {
      return res.json(null);
    }
    
    // Récupérer depuis Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );
    
    if (!stripeSubscription.default_payment_method) {
      return res.json(null);
    }
    
    // Récupérer les détails de la carte
    const paymentMethod = await stripe.paymentMethods.retrieve(
      stripeSubscription.default_payment_method
    );
    
    if (!paymentMethod.card) {
      return res.json(null);
    }
    
    res.json({
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      exp_month: paymentMethod.card.exp_month,
      exp_year: paymentMethod.card.exp_year
    });
    
  } catch (error) {
    console.error('Erreur récupération méthode paiement:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour créer une session de portail client (mise à jour carte + factures)
router.post('/create-portal-session', requireAuth, async (req, res) => {
  // Réessayer d'initialiser Stripe si nécessaire
  if (!stripe) {
    initializeStripe();
  }
  
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe non configuré' });
  }
  
  try {
    const utilisateurId = req.session.utilisateurId;
    
    console.log('\n========================================');
    console.log('🔐 CRÉATION SESSION PORTAIL CLIENT');
    console.log('========================================\n');
    console.log('👤 User ID:', utilisateurId);
    
    // Récupérer l'utilisateur
    const user = db.prepare('SELECT * FROM utilisateurs WHERE id = ?').get(utilisateurId);
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    console.log('✅ Utilisateur trouvé:', user.email);
    
    // Récupérer le producteur
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(utilisateurId);
    
    if (!producteur) {
      return res.status(403).json({ error: 'Accès réservé aux producteurs' });
    }
    
    const producteurId = producteur.id;
    console.log('📊 Producteur ID:', producteurId);
    
    // Récupérer le stripe_customer_id depuis l'abonnement
    const subscription = db.prepare(`
      SELECT stripe_customer_id 
      FROM subscriptions 
      WHERE producer_id = ? 
      ORDER BY id DESC 
      LIMIT 1
    `).get(producteurId);
    
    console.log('📊 stripe_customer_id:', subscription?.stripe_customer_id);
    
    if (!subscription?.stripe_customer_id) {
      console.log('❌ Aucun stripe_customer_id');
      return res.status(404).json({ 
        error: 'Aucun compte client Stripe trouvé. Veuillez contacter le support.' 
      });
    }
    
    // Créer la session de portail client
    console.log('🔄 Création de la session portail...');
    
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173'}/producteur/dashboard?tab=subscription`,
    });
    
    console.log('✅ Session créée:', session.url);
    console.log('========================================\n');
    
    res.json({ url: session.url });
    
  } catch (error) {
    console.error('\n❌ ERREUR CRÉATION SESSION PORTAIL:', error);
    console.error('Type:', error.type);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.log('========================================\n');
    
    res.status(500).json({ 
      error: 'Erreur lors de l\'ouverture du portail de paiement',
      details: error.message 
    });
  }
});

// Route TEMPORAIRE pour réinitialiser un compte (À SUPPRIMER APRÈS TEST)
router.post('/admin/reset-subscription', async (req, res) => {
  // Réessayer d'initialiser Stripe si nécessaire
  if (!stripe) {
    initializeStripe();
  }
  
  try {
    const { email } = req.body;

    // Vérification de sécurité
    if (email !== 'xmaniixx@gmail.com') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    console.log('🔄 Réinitialisation du compte:', email);

    // 1. Trouver l'utilisateur
    const user = db.prepare('SELECT * FROM utilisateurs WHERE email = ?').get(email);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    console.log('✅ Utilisateur trouvé:', user.id);

    // 2. Trouver le producteur
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(user.id);
    
    if (!producteur) {
      return res.status(404).json({ error: 'Producteur non trouvé' });
    }

    const producteurId = producteur.id;

    // 3. Trouver l'abonnement (CORRECTION : pas de ORDER BY created_at)
    const subscription = db.prepare(`
      SELECT * FROM subscriptions 
      WHERE producer_id = ? 
      LIMIT 1
    `).get(producteurId);

    if (subscription?.stripe_subscription_id && stripe) {
      console.log('🗑️ Annulation de l\'abonnement Stripe:', subscription.stripe_subscription_id);
      
      // Annuler l'abonnement dans Stripe IMMÉDIATEMENT
      try {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        console.log('✅ Abonnement Stripe annulé');
      } catch (stripeError) {
        console.log('⚠️ Erreur Stripe (probablement déjà annulé):', stripeError.message);
      }
    }

    // Supprimer de la DB
    if (subscription) {
      db.prepare('DELETE FROM subscriptions WHERE id = ?').run(subscription.id);
      console.log('✅ Abonnement supprimé de la DB');
    }

    // 4. Réinitialiser le plan utilisateur (si la table users a une colonne plan)
    try {
      db.prepare('UPDATE utilisateurs SET plan = ? WHERE id = ?').run('free', user.id);
      console.log('✅ Plan utilisateur réinitialisé');
    } catch (e) {
      // La colonne plan n'existe peut-être pas dans utilisateurs, on ignore
      console.log('⚠️ Pas de colonne plan dans utilisateurs');
    }

    // 5. Réinitialiser le plan producteur (si la table producteurs a une colonne plan)
    try {
      db.prepare('UPDATE producteurs SET plan = ? WHERE utilisateur_id = ?').run('free', user.id);
      console.log('✅ Plan producteur réinitialisé');
    } catch (e) {
      // La colonne plan n'existe peut-être pas dans producteurs, on ignore
      console.log('⚠️ Pas de colonne plan dans producteurs');
    }
    
    console.log('✅ Compte réinitialisé');

    res.json({ 
      success: true, 
      message: 'Compte réinitialisé. Vous pouvez tester un nouveau paiement.',
      user: { 
        email: user.email, 
        plan: 'free' 
      }
    });

  } catch (error) {
    console.error('❌ Erreur réinitialisation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route de diagnostic (TEMPORAIRE)
router.get('/admin/check-stripe-config', async (req, res) => {
  // Réessayer d'initialiser Stripe si nécessaire
  if (!stripe) {
    initializeStripe();
  }
  
  if (!stripe) {
    return res.status(500).json({
      stripeConfigured: false,
      error: 'Stripe non configuré'
    });
  }
  
  try {
    // Vérifier la clé API
    const balance = await stripe.balance.retrieve();
    
    res.json({
      stripeConfigured: true,
      testMode: stripe.apiKey.includes('test'),
      balanceAvailable: balance.available,
      message: 'Configuration Stripe OK'
    });
  } catch (error) {
    res.status(500).json({
      stripeConfigured: false,
      error: error.message
    });
  }
});

// Webhook Stripe - DOIT être avant express.json() dans index.js
// Cette route sera montée séparément dans index.js avec express.raw()
const stripeWebhookRouter = express.Router();

stripeWebhookRouter.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    console.error('Stripe non initialisé pour le webhook');
    return res.status(503).json({ error: 'Stripe non configuré' });
  }
  
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret || webhookSecret.trim() === '') {
    console.error('STRIPE_WEBHOOK_SECRET non configuré');
    return res.status(503).json({ error: 'Webhook secret non configuré' });
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Erreur vérification signature webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Gérer les événements Stripe
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      
      // Récupérer les métadonnées
      const producteurId = parseInt(session.metadata?.producteur_id);
      
      if (!producteurId) {
        console.error('producteur_id manquant dans les métadonnées');
        break;
      }
      
      // Récupérer la subscription depuis Stripe
      const subscriptionId = session.subscription;
      if (!subscriptionId) {
        console.error('subscription_id manquant dans la session');
        break;
      }
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price?.id;
      
      // Mettre à jour la base de données
      const now = new Date().toISOString();
      const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
      const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      db.prepare(`
        UPDATE subscriptions 
        SET 
          plan = 'pro',
          stripe_subscription_id = ?,
          stripe_price_id = ?,
          status = ?,
          current_period_start = ?,
          current_period_end = ?,
          updated_at = ?
        WHERE producer_id = ?
      `).run(
        subscriptionId,
        priceId,
        subscription.status,
        periodStart,
        periodEnd,
        now,
        producteurId
      );
      
      console.log(`✅ Abonnement Pro activé pour producteur ${producteurId}`);
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      
      if (!subscriptionId) break;
      
      // Récupérer depuis la subscription en base
      const sub = db.prepare('SELECT producer_id FROM subscriptions WHERE stripe_subscription_id = ?').get(subscriptionId);
      if (!sub) break;
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const prodId = sub.producer_id;
      
      // Mettre à jour les dates de période
      const periodStart = subscription.current_period_start 
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null;
      const periodEnd = subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      
      db.prepare(`
        UPDATE subscriptions 
        SET 
          status = ?,
          current_period_start = ?,
          current_period_end = ?,
          updated_at = ?
        WHERE producer_id = ?
      `).run(subscription.status, periodStart, periodEnd, new Date().toISOString(), prodId);
      
      break;
    }
    
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const subscriptionId = subscription.id;
      
      // Récupérer le producteur depuis la base
      const sub = db.prepare('SELECT producer_id FROM subscriptions WHERE stripe_subscription_id = ?').get(subscriptionId);
      
      if (!sub) break;
      
      const producteurId = sub.producer_id;
      const status = subscription.status;
      
      // Si l'abonnement est annulé, remettre en free
      if (status === 'canceled' || status === 'unpaid') {
        db.prepare(`
          UPDATE subscriptions 
          SET 
            plan = 'free',
            status = ?,
            updated_at = ?
          WHERE producer_id = ?
        `).run(status, new Date().toISOString(), producteurId);
        
        console.log(`⚠️ Abonnement annulé pour producteur ${producteurId}`);
      } else {
        // Mettre à jour le statut
        db.prepare(`
          UPDATE subscriptions 
          SET 
            plan = ?,
            status = ?,
            cancel_at_period_end = ?,
            updated_at = ?
          WHERE producer_id = ?
        `).run(
          subscription.status === 'active' ? 'pro' : 'free',
          subscription.status,
          subscription.cancel_at_period_end ? 1 : 0,
          new Date().toISOString(),
          producteurId
        );
      }
      
      break;
    }
    
    default:
      console.log(`Événement non géré: ${event.type}`);
  }
  
  res.json({ received: true });
});

export { router as stripeRoutes, stripeWebhookRouter };

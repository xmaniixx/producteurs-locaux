// Route pour réinitialiser l'abonnement en mode test
// Utile pour les tests de développement

import express from 'express';
import { getDatabase } from '../database.js';

const router = express.Router();
const db = getDatabase();

// Middleware pour vérifier l'authentification
function requireAuth(req, res, next) {
  if (!req.session || !req.session.utilisateurId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
}

// Route pour réinitialiser l'abonnement (mode test uniquement)
router.post('/reset', requireAuth, (req, res) => {
  const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
  
  if (!isTestMode) {
    return res.status(403).json({ error: 'Cette route est disponible uniquement en mode test' });
  }
  
  try {
    const utilisateurId = req.session.utilisateurId;
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(utilisateurId);
    
    if (!producteur) {
      return res.status(403).json({ error: 'Accès réservé aux producteurs' });
    }
    
    const producteurId = producteur.id;
    
    // Réinitialiser l'abonnement
    db.prepare(`
      UPDATE subscriptions 
      SET 
        plan = 'free',
        status = 'canceled',
        stripe_subscription_id = NULL,
        current_period_end = NULL
      WHERE producer_id = ?
    `).run(producteurId);
    
    res.json({ success: true, message: 'Abonnement réinitialisé' });
  } catch (error) {
    console.error('Erreur réinitialisation abonnement:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
});

export default router;



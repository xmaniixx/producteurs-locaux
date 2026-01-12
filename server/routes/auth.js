// ============================================
// ROUTES AUTHENTIFICATION
// ============================================
// Gère l'inscription et la connexion des producteurs

import express from 'express';
import bcrypt from 'bcrypt';
import { getDatabase } from '../database.js';

const router = express.Router();
const db = getDatabase();

// Route d'inscription d'un producteur
router.post('/inscription', async (req, res) => {
  try {
    const { nom, type, adresse, ville, latitude, longitude, email, mot_de_passe } = req.body;

    // Vérifier que tous les champs sont remplis
    if (!nom || !type || !adresse || !ville || !latitude || !longitude || !email || !mot_de_passe) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier si l'email existe déjà (dans producteurs OU utilisateurs)
    const existingProducteur = db.prepare('SELECT id FROM producteurs WHERE email = ?').get(email);
    const existingUtilisateur = db.prepare('SELECT id FROM utilisateurs WHERE email = ?').get(email);
    
    if (existingProducteur || existingUtilisateur) {
      return res.status(400).json({ 
        error: 'Cet email est déjà utilisé. Si vous avez un compte utilisateur, utilisez la fonctionnalité "Devenir producteur" depuis votre compte.' 
      });
    }

    // Hasher le mot de passe pour la sécurité
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Insérer le nouveau producteur
    const result = db.prepare(`
      INSERT INTO producteurs (nom, type, adresse, ville, latitude, longitude, email, mot_de_passe)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(nom, type, adresse, ville, latitude, longitude, email, hashedPassword);

    // Créer la session pour garder l'utilisateur connecté
    req.session.producteurId = result.lastInsertRowid;
    req.session.producteurEmail = email;

    res.json({ 
      success: true,
      producteur: {
        id: result.lastInsertRowid,
        nom,
        email
      }
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Route de connexion
router.post('/connexion', async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Chercher le producteur dans la base de données
    const producteur = db.prepare('SELECT * FROM producteurs WHERE email = ?').get(email);
    
    if (!producteur) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(mot_de_passe, producteur.mot_de_passe);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Créer la session
    req.session.producteurId = producteur.id;
    req.session.producteurEmail = producteur.email;

    res.json({ 
      success: true,
      producteur: {
        id: producteur.id,
        nom: producteur.nom,
        email: producteur.email
      }
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Route pour vérifier si un utilisateur est connecté
router.get('/verifier', (req, res) => {
  if (req.session.producteurId) {
    const producteur = db.prepare('SELECT id, nom, email FROM producteurs WHERE id = ?').get(req.session.producteurId);
    res.json({ connected: true, producteur });
  } else {
    res.json({ connected: false });
  }
});

// Route de déconnexion
router.post('/deconnexion', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

export { router as authRoutes };


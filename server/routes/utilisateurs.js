// ============================================
// ROUTES UTILISATEURS
// ============================================
// Gère l'inscription, la connexion et la gestion des utilisateurs

import express from 'express';
import bcrypt from 'bcrypt';
import { getDatabase } from '../database.js';

const router = express.Router();
const db = getDatabase();

// Route pour vérifier si un email existe (utilisateur ou producteur)
router.get('/verifier-email/:email', (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    // Vérifier dans utilisateurs
    const utilisateur = db.prepare('SELECT id, email FROM utilisateurs WHERE email = ?').get(email);
    // Vérifier dans producteurs
    const producteur = db.prepare('SELECT id, email FROM producteurs WHERE email = ?').get(email);

    const existe = !!(utilisateur || producteur);
    const typeCompte = utilisateur ? 'utilisateur' : (producteur ? 'producteur' : null);

    res.json({
      existe,
      type: typeCompte,
      message: existe 
        ? `Cet email est déjà utilisé comme compte ${typeCompte}. Connectez-vous ou utilisez un autre email.`
        : 'Email disponible'
    });
  } catch (error) {
    console.error('Erreur vérification email:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

// Route d'inscription d'un utilisateur
router.post('/inscription', async (req, res) => {
  try {
    const { email, telephone, mot_de_passe, date_naissance } = req.body;

    // Vérifier que tous les champs sont remplis
    if (!email || !telephone || !mot_de_passe || !date_naissance) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier si l'email existe déjà (utilisateur OU producteur)
    const existingUser = db.prepare('SELECT id FROM utilisateurs WHERE email = ?').get(email);
    const existingProducteur = db.prepare('SELECT id FROM producteurs WHERE email = ?').get(email);
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Cet email est déjà utilisé comme compte utilisateur. Connectez-vous ou utilisez un autre email.' 
      });
    }
    
    if (existingProducteur) {
      return res.status(400).json({ 
        error: 'Cet email est déjà utilisé comme compte producteur. Si c\'est votre compte producteur, utilisez la connexion producteur. Sinon, utilisez un autre email.' 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Insérer le nouvel utilisateur
    const result = db.prepare(`
      INSERT INTO utilisateurs (email, telephone, mot_de_passe, date_naissance)
      VALUES (?, ?, ?, ?)
    `).run(email, telephone, hashedPassword, date_naissance);

    // Créer la session
    req.session.utilisateurId = result.lastInsertRowid;
    req.session.utilisateurEmail = email;

    res.json({ 
      success: true,
      utilisateur: {
        id: result.lastInsertRowid,
        email
      }
    });
  } catch (error) {
    console.error('Erreur inscription utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Route de connexion utilisateur
router.post('/connexion', async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    console.log('🔐 Tentative de connexion pour:', email);

    if (!email || !mot_de_passe) {
      console.log('❌ Email ou mot de passe manquant');
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Chercher l'utilisateur dans la base de données
    const utilisateur = db.prepare('SELECT * FROM utilisateurs WHERE email = ?').get(email);
    console.log('👤 Utilisateur trouvé:', utilisateur ? 'Oui' : 'Non');
    
    // Chercher aussi dans les producteurs (pour gérer le cas où l'email existe dans les deux)
    const producteurAvecEmail = db.prepare('SELECT * FROM producteurs WHERE email = ?').get(email);
    
    // Si l'email n'existe ni en utilisateur ni en producteur
    if (!utilisateur && !producteurAvecEmail) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Si l'email existe en producteur mais pas en utilisateur
    if (!utilisateur && producteurAvecEmail) {
      // Vérifier le mot de passe producteur
      const passwordMatch = await bcrypt.compare(mot_de_passe, producteurAvecEmail.mot_de_passe);
      if (!passwordMatch) {
        return res.status(401).json({ 
          error: 'Email ou mot de passe incorrect',
          suggestion: 'Cet email correspond à un compte producteur. Utilisez-vous la connexion producteur ?'
        });
      }
      // Si le mot de passe correspond, proposer de créer un compte utilisateur ou se connecter comme producteur
      return res.status(400).json({ 
        error: 'Cet email correspond à un compte producteur',
        type_compte: 'producteur',
        message: 'Veuillez utiliser la connexion producteur ou créer un compte utilisateur avec un autre email.'
      });
    }

    // Si l'email existe en utilisateur
    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    console.log('🔑 Mot de passe correct:', passwordMatch ? 'Oui' : 'Non');
    
    if (!passwordMatch) {
      console.log('❌ Mot de passe incorrect pour:', email);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Créer la session (pour compatibilité)
    req.session.utilisateurId = utilisateur.id;
    req.session.utilisateurEmail = utilisateur.email;
    console.log('✅ Session créée pour utilisateur ID:', utilisateur.id);
    console.log('🔍 [connexion] Session ID:', req.sessionID);
    console.log('🔍 [connexion] Session sauvegardée:', {
      utilisateurId: req.session.utilisateurId,
      utilisateurEmail: req.session.utilisateurEmail
    });
    
    // Sauvegarder explicitement la session
    req.session.save((err) => {
      if (err) {
        console.error('❌ [connexion] Erreur sauvegarde session:', err);
      } else {
        console.log('✅ [connexion] Session sauvegardée avec succès');
      }
    });

    // Générer un token JWT
    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise_changez_en_production';
    const token = jwt.default.sign(
      { userId: utilisateur.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Vérifier si c'est aussi un producteur (lié ou avec même email)
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ? OR email = ?').get(utilisateur.id, utilisateur.email);

    res.json({ 
      success: true,
      token: token, // Ajouter le token JWT
      utilisateur: {
        id: utilisateur.id,
        email: utilisateur.email,
        est_producteur: utilisateur.est_producteur === 1 || !!producteur
      }
    });
  } catch (error) {
    console.error('Erreur connexion utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Route pour vérifier si un utilisateur est connecté
router.get('/verifier', (req, res) => {
  if (req.session.utilisateurId) {
    const utilisateur = db.prepare('SELECT id, email, est_producteur FROM utilisateurs WHERE id = ?').get(req.session.utilisateurId);
    if (utilisateur) {
      // Vérifier si c'est aussi un producteur
      const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(utilisateur.id);
      res.json({ 
        connected: true, 
        utilisateur: {
          ...utilisateur,
          est_producteur: utilisateur.est_producteur === 1 || !!producteur
        }
      });
    } else {
      res.json({ connected: false });
    }
  } else {
    res.json({ connected: false });
  }
});

// Route pour obtenir les informations de l'utilisateur connecté
router.get('/moi', (req, res) => {
  try {
    if (!req.session.utilisateurId) {
      return res.status(401).json({ error: 'Non connecté' });
    }

    const utilisateur = db.prepare('SELECT id, email, telephone, date_naissance, est_producteur FROM utilisateurs WHERE id = ?').get(req.session.utilisateurId);
    
    if (!utilisateur) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si c'est aussi un producteur
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(utilisateur.id);

    res.json({
      ...utilisateur,
      est_producteur: utilisateur.est_producteur === 1 || !!producteur
    });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Route pour mettre à jour les informations de l'utilisateur
router.put('/moi', async (req, res) => {
  try {
    if (!req.session.utilisateurId) {
      return res.status(401).json({ error: 'Non connecté' });
    }

    const { email, telephone, date_naissance, mot_de_passe, nouveau_mot_de_passe } = req.body;
    const utilisateurId = req.session.utilisateurId;

    // Vérifier que l'utilisateur existe
    const utilisateur = db.prepare('SELECT id FROM utilisateurs WHERE id = ?').get(utilisateurId);
    if (!utilisateur) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Si changement de mot de passe
    if (nouveau_mot_de_passe) {
      // Vérifier l'ancien mot de passe
      const currentUser = db.prepare('SELECT mot_de_passe FROM utilisateurs WHERE id = ?').get(utilisateurId);
      const passwordMatch = await bcrypt.compare(mot_de_passe, currentUser.mot_de_passe);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);
      db.prepare('UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?').run(hashedPassword, utilisateurId);
    }

    // Mettre à jour les autres informations
    db.prepare(`
      UPDATE utilisateurs 
      SET email = ?, telephone = ?, date_naissance = ?
      WHERE id = ?
    `).run(email, telephone, date_naissance, utilisateurId);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur modification utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// Route pour déconnexion
router.post('/deconnexion', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Route pour demander une réinitialisation de mot de passe
router.post('/reset-password/request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    // Vérifier si l'email existe (utilisateur ou producteur)
    const utilisateur = db.prepare('SELECT id, email FROM utilisateurs WHERE email = ?').get(email);
    const producteur = db.prepare('SELECT id, email FROM producteurs WHERE email = ?').get(email);

    if (!utilisateur && !producteur) {
      // Ne pas révéler si l'email existe ou non pour la sécurité
      return res.json({ 
        success: true, 
        message: 'Si cet email existe, un lien de réinitialisation vous a été envoyé.' 
      });
    }

    // Générer un token sécurisé
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token valide 1 heure

    const typeCompte = utilisateur ? 'utilisateur' : 'producteur';

    // Supprimer les anciens tokens non utilisés pour cet email
    db.prepare('DELETE FROM reset_tokens WHERE email = ? AND used = 0').run(email);

    // Insérer le nouveau token
    db.prepare(`
      INSERT INTO reset_tokens (email, token, type_compte, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(email, token, typeCompte, expiresAt.toISOString());

    // TODO: Envoyer l'email avec le lien de réinitialisation
    // Pour l'instant, on retourne le token (à supprimer en production)
    const resetLink = `http://localhost:5173/reset-password?token=${token}`;
    
    console.log(`🔑 Lien de réinitialisation pour ${email}: ${resetLink}`);
    
    // TODO: Utiliser un service d'email (nodemailer, SendGrid, etc.)
    // await sendResetEmail(email, resetLink);

    res.json({ 
      success: true, 
      message: 'Si cet email existe, un lien de réinitialisation vous a été envoyé.',
      // À supprimer en production :
      dev_link: resetLink 
    });
  } catch (error) {
    console.error('Erreur demande reset:', error);
    res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation' });
  }
});

// Route pour réinitialiser le mot de passe avec un token
router.post('/reset-password/confirm', async (req, res) => {
  try {
    const { token, nouveau_mot_de_passe } = req.body;

    if (!token || !nouveau_mot_de_passe) {
      return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
    }

    if (nouveau_mot_de_passe.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    // Vérifier le token
    const tokenData = db.prepare(`
      SELECT email, type_compte, expires_at, used 
      FROM reset_tokens 
      WHERE token = ?
    `).get(token);

    if (!tokenData) {
      return res.status(400).json({ error: 'Token invalide' });
    }

    if (tokenData.used === 1) {
      return res.status(400).json({ error: 'Ce lien a déjà été utilisé' });
    }

    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return res.status(400).json({ error: 'Ce lien a expiré. Veuillez faire une nouvelle demande.' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);

    // Mettre à jour le mot de passe selon le type de compte
    if (tokenData.type_compte === 'utilisateur') {
      db.prepare('UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?').run(hashedPassword, tokenData.email);
    } else {
      db.prepare('UPDATE producteurs SET mot_de_passe = ? WHERE email = ?').run(hashedPassword, tokenData.email);
    }

    // Marquer le token comme utilisé
    db.prepare('UPDATE reset_tokens SET used = 1 WHERE token = ?').run(token);

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
});

// Route pour créer une demande pour devenir producteur
router.post('/devenir-producteur', async (req, res) => {
  try {
    if (!req.session.utilisateurId) {
      return res.status(401).json({ error: 'Non connecté' });
    }

    const { nom_ferme, type_production, adresse, ville, latitude, longitude, numero_siret, justificatif } = req.body;

    // Vérifier que tous les champs requis sont remplis
    if (!nom_ferme || !type_production || !adresse || !ville || !latitude || !longitude) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const utilisateurId = req.session.utilisateurId;

    // Vérifier si une demande est déjà en cours
    const demandeExistante = db.prepare(`
      SELECT id, statut FROM demandes_producteur 
      WHERE utilisateur_id = ? AND statut IN ('en_attente', 'validee')
    `).get(utilisateurId);

    if (demandeExistante) {
      if (demandeExistante.statut === 'en_attente') {
        return res.status(400).json({ error: 'Vous avez déjà une demande en attente' });
      }
      if (demandeExistante.statut === 'validee') {
        return res.status(400).json({ error: 'Vous êtes déjà producteur' });
      }
    }

    // Créer la demande (pour l'instant, auto-valider si numéro SIRET fourni)
    const statut = numero_siret ? 'validee' : 'en_attente';
    const dateValidation = numero_siret ? new Date().toISOString() : null;

    const demandeResult = db.prepare(`
      INSERT INTO demandes_producteur 
      (utilisateur_id, nom_ferme, type_production, adresse, ville, latitude, longitude, numero_siret, justificatif, statut, date_validation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(utilisateurId, nom_ferme, type_production, adresse, ville, latitude, longitude, numero_siret || null, justificatif || null, statut, dateValidation);

    // Si auto-validée (avec SIRET), créer directement le compte producteur
    if (statut === 'validee') {
      // Récupérer le mot de passe de l'utilisateur pour le producteur (même mot de passe)
      const utilisateur = db.prepare('SELECT mot_de_passe FROM utilisateurs WHERE id = ?').get(utilisateurId);
      
      const producteurResult = db.prepare(`
        INSERT INTO producteurs 
        (nom, type, adresse, ville, latitude, longitude, email, mot_de_passe, utilisateur_id)
        VALUES (?, ?, ?, ?, ?, ?, 
          (SELECT email FROM utilisateurs WHERE id = ?), 
          ?, ?)
      `).run(
        nom_ferme, 
        type_production, 
        adresse, 
        ville, 
        latitude, 
        longitude, 
        utilisateurId, 
        utilisateur.mot_de_passe, 
        utilisateurId
      );

      // Mettre à jour l'utilisateur pour indiquer qu'il est producteur
      db.prepare('UPDATE utilisateurs SET est_producteur = 1 WHERE id = ?').run(utilisateurId);
    }

    res.json({ 
      success: true,
      demande_id: demandeResult.lastInsertRowid,
      statut,
      message: statut === 'validee' ? 'Votre demande a été validée automatiquement. Vous êtes maintenant producteur !' : 'Votre demande a été envoyée et est en attente de validation.'
    });
  } catch (error) {
    console.error('Erreur demande producteur:', error);
    res.status(500).json({ error: 'Erreur lors de la demande' });
  }
});

// Route pour supprimer son propre compte (utilisateur connecté)
router.delete('/mon-compte', async (req, res) => {
  try {
    if (!req.session.utilisateurId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const utilisateurId = req.session.utilisateurId;
    
    // Récupérer les informations de l'utilisateur
    const utilisateur = db.prepare('SELECT id, email FROM utilisateurs WHERE id = ?').get(utilisateurId);
    
    if (!utilisateur) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Supprimer les données producteur si elles existent
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(utilisateurId);
    
    if (producteur) {
      // Supprimer les statistiques du producteur
      db.prepare('DELETE FROM statistiques WHERE producteur_id = ?').run(producteur.id);
      // Supprimer les photos du producteur
      db.prepare('DELETE FROM photos_producteurs WHERE producteur_id = ?').run(producteur.id);
      // Supprimer le producteur
      db.prepare('DELETE FROM producteurs WHERE id = ?').run(producteur.id);
    }
    
    // Supprimer les favoris de l'utilisateur
    db.prepare('DELETE FROM favoris WHERE utilisateur_id = ?').run(utilisateurId);
    
    // Supprimer les demandes producteur
    db.prepare('DELETE FROM demandes_producteur WHERE utilisateur_id = ?').run(utilisateurId);
    
    // Supprimer les tokens de reset
    try {
      db.prepare('DELETE FROM reset_tokens WHERE email = ?').run(utilisateur.email);
    } catch (e) {
      // Ignorer si la table n'existe pas
    }
    
    // Supprimer l'utilisateur
    db.prepare('DELETE FROM utilisateurs WHERE id = ?').run(utilisateurId);
    
    // Détruire la session et renvoyer la réponse
    req.session.destroy((err) => {
      if (err) {
        console.error('Erreur destruction session:', err);
        return res.status(500).json({ error: 'Erreur lors de la suppression' });
      }
      res.json({ success: true, message: 'Compte supprimé avec succès' });
    });
  } catch (error) {
    console.error('Erreur suppression compte:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Route ADMIN pour supprimer un compte (à utiliser avec précaution)
router.delete('/supprimer/:email', async (req, res) => {
  try {
    // ⚠️ ATTENTION: Cette route devrait être protégée en production
    // Pour l'instant, on l'active pour faciliter le développement
    
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    // Vérifier si l'utilisateur existe
    const utilisateur = db.prepare('SELECT * FROM utilisateurs WHERE email = ?').get(email);
    
    if (!utilisateur) {
      // Vérifier si c'est un producteur
      const producteur = db.prepare('SELECT * FROM producteurs WHERE email = ?').get(email);
      
      if (!producteur) {
        return res.status(404).json({ error: 'Aucun compte trouvé avec cet email' });
      }
      
      // Supprimer le producteur
      db.prepare('DELETE FROM statistiques WHERE producteur_id = ?').run(producteur.id);
      db.prepare('DELETE FROM photos_producteurs WHERE producteur_id = ?').run(producteur.id);
      db.prepare('DELETE FROM demandes_producteur WHERE utilisateur_id = ?').run(producteur.utilisateur_id || 0);
      db.prepare('DELETE FROM producteurs WHERE id = ?').run(producteur.id);
      
      if (producteur.utilisateur_id) {
        db.prepare('DELETE FROM reset_tokens WHERE email = ?').run(email);
        db.prepare('DELETE FROM utilisateurs WHERE id = ?').run(producteur.utilisateur_id);
      }
      
      return res.json({ success: true, message: 'Compte producteur supprimé' });
    }
    
    // Supprimer les données producteur si elles existent
    const producteur = db.prepare('SELECT * FROM producteurs WHERE utilisateur_id = ? OR email = ?').get(utilisateur.id, email);
    
    if (producteur) {
      db.prepare('DELETE FROM statistiques WHERE producteur_id = ?').run(producteur.id);
      db.prepare('DELETE FROM photos_producteurs WHERE producteur_id = ?').run(producteur.id);
      db.prepare('DELETE FROM producteurs WHERE id = ?').run(producteur.id);
    }
    
    // Supprimer les données associées
    db.prepare('DELETE FROM demandes_producteur WHERE utilisateur_id = ?').run(utilisateur.id);
    db.prepare('DELETE FROM reset_tokens WHERE email = ?').run(email);
    db.prepare('DELETE FROM utilisateurs WHERE id = ?').run(utilisateur.id);
    
    res.json({ success: true, message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression compte:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Route pour vérifier le statut de la demande producteur
// Routes pour gérer les favoris
// GET /api/utilisateur/favoris - Récupérer tous les favoris de l'utilisateur
router.get('/favoris', (req, res) => {
  try {
    if (!req.session.utilisateurId) {
      return res.status(401).json({ error: 'Non connecté' });
    }

    const favoris = db.prepare(`
      SELECT 
        f.id,
        f.date_ajout,
        p.id as producteur_id,
        p.nom,
        p.type,
        p.adresse,
        p.ville,
        p.latitude,
        p.longitude
      FROM favoris f
      JOIN producteurs p ON f.producteur_id = p.id
      WHERE f.utilisateur_id = ?
      ORDER BY f.date_ajout DESC
    `).all(req.session.utilisateurId);

    res.json({ favoris });
  } catch (error) {
    console.error('Erreur récupération favoris:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des favoris' });
  }
});

// GET /api/utilisateur/favoris/:producteurId - Vérifier si un producteur est en favori
router.get('/favoris/:producteurId', (req, res) => {
  try {
    if (!req.session.utilisateurId) {
      return res.status(401).json({ error: 'Non connecté' });
    }

    const { producteurId } = req.params;
    const favori = db.prepare(`
      SELECT id FROM favoris 
      WHERE utilisateur_id = ? AND producteur_id = ?
    `).get(req.session.utilisateurId, producteurId);

    res.json({ estFavori: !!favori });
  } catch (error) {
    console.error('Erreur vérification favori:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

// POST /api/utilisateur/favoris - Ajouter un producteur aux favoris
router.post('/favoris', (req, res) => {
  try {
    if (!req.session.utilisateurId) {
      return res.status(401).json({ error: 'Non connecté' });
    }

    const { producteur_id } = req.body;

    if (!producteur_id) {
      return res.status(400).json({ error: 'ID producteur requis' });
    }

    // Vérifier que le producteur existe
    const producteur = db.prepare('SELECT id FROM producteurs WHERE id = ?').get(producteur_id);
    if (!producteur) {
      return res.status(404).json({ error: 'Producteur non trouvé' });
    }

    // Vérifier si déjà en favori
    const existing = db.prepare(`
      SELECT id FROM favoris 
      WHERE utilisateur_id = ? AND producteur_id = ?
    `).get(req.session.utilisateurId, producteur_id);

    if (existing) {
      return res.status(400).json({ error: 'Déjà en favori' });
    }

    // Ajouter aux favoris
    db.prepare(`
      INSERT INTO favoris (utilisateur_id, producteur_id)
      VALUES (?, ?)
    `).run(req.session.utilisateurId, producteur_id);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur ajout favori:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout aux favoris' });
  }
});

// DELETE /api/utilisateur/favoris/:producteurId - Retirer un producteur des favoris
router.delete('/favoris/:producteurId', (req, res) => {
  try {
    if (!req.session.utilisateurId) {
      return res.status(401).json({ error: 'Non connecté' });
    }

    const { producteurId } = req.params;

    db.prepare(`
      DELETE FROM favoris 
      WHERE utilisateur_id = ? AND producteur_id = ?
    `).run(req.session.utilisateurId, producteurId);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur retrait favori:', error);
    res.status(500).json({ error: 'Erreur lors du retrait des favoris' });
  }
});

router.get('/statut-producteur', (req, res) => {
  try {
    // Logs de débogage
    console.log('🔍 [statut-producteur] Session ID:', req.sessionID);
    console.log('🔍 [statut-producteur] Session utilisateurId:', req.session?.utilisateurId);
    console.log('🔍 [statut-producteur] Cookies reçus:', req.headers.cookie);
    console.log('🔍 [statut-producteur] Origin:', req.headers.origin);
    
    if (!req.session.utilisateurId) {
      console.log('❌ [statut-producteur] Pas d\'utilisateurId dans la session - 401');
      return res.status(401).json({ error: 'Non connecté' });
    }

    const utilisateurId = req.session.utilisateurId;
    console.log('✅ [statut-producteur] Utilisateur ID trouvé:', utilisateurId);

    // Vérifier si l'utilisateur est déjà producteur
    const producteur = db.prepare('SELECT id FROM producteurs WHERE utilisateur_id = ?').get(utilisateurId);
    
    if (producteur) {
      return res.json({ est_producteur: true, producteur_id: producteur.id });
    }

    // Vérifier s'il y a une demande en cours
    const demande = db.prepare(`
      SELECT id, statut, date_demande 
      FROM demandes_producteur 
      WHERE utilisateur_id = ? 
      ORDER BY date_demande DESC 
      LIMIT 1
    `).get(utilisateurId);

    if (demande) {
      return res.json({ 
        est_producteur: false, 
        demande_en_cours: true,
        statut: demande.statut
      });
    }

    res.json({ est_producteur: false, demande_en_cours: false });
  } catch (error) {
    console.error('Erreur vérification statut:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

export { router as utilisateurRoutes };


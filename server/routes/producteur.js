// ============================================
// ROUTES PRODUCTEUR - Gestion du compte
// ============================================
// Permet aux producteurs de modifier leur compte, ajouter des photos, etc.

import express from 'express';
import bcrypt from 'bcrypt';
import { getDatabase } from '../database.js';

const router = express.Router();
const db = getDatabase();

// Middleware pour vérifier si l'utilisateur est connecté
function requireAuth(req, res, next) {
  console.log('\n🔐 Middleware requireAuth');
  console.log('   - Session ID:', req.sessionID);
  console.log('   - Session producteurId:', req.session.producteurId);
  console.log('   - Session complète:', req.session);
  
  if (!req.session.producteurId) {
    console.log('❌ Pas de producteurId dans la session - 401');
    return res.status(401).json({ error: 'Non autorisé - Session manquante' });
  }
  
  console.log('✅ Session valide');
  next();
}

// Route pour obtenir les informations du producteur connecté
router.get('/moi', requireAuth, (req, res) => {
  try {
    const producteurId = req.session.producteurId;
    
    // Récupérer les informations du producteur
    const producteur = db.prepare(`
      SELECT id, nom, type, adresse, ville, latitude, longitude, email, horaires, description, telephone
      FROM producteurs 
      WHERE id = ?
    `).get(producteurId);

    if (!producteur) {
      console.log('❌ Producteur non trouvé');
      return res.status(404).json({ error: 'Producteur non trouvé' });
    }

    console.log('✅ Producteur trouvé:', producteur.nom);

    // Récupérer les photos (max 4)
    const photos = db.prepare(`
      SELECT id, url_photo, ordre 
      FROM photos_producteurs 
      WHERE producteur_id = ? 
      ORDER BY ordre ASC
    `).all(producteurId);

    console.log('📸 Photos:', photos.length);

    res.json({
      ...producteur,
      photos: photos || []
    });
  } catch (error) {
    console.error('❌ Erreur récupération producteur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Route pour modifier les informations du producteur
router.put('/moi', requireAuth, async (req, res) => {
  try {
    const producteurId = req.session.producteurId;
    const { nom, type, adresse, ville, latitude, longitude, horaires, description, telephone, email } = req.body;

    console.log('\n📝 PUT /producteur/moi');
    console.log('   - producteurId:', producteurId);
    console.log('   - nom:', nom);
    console.log('   - adresse:', adresse);
    console.log('   - latitude:', latitude);
    console.log('   - longitude:', longitude);

    // Vérifier que le producteur existe
    const producteur = db.prepare('SELECT id FROM producteurs WHERE id = ?').get(producteurId);
    if (!producteur) {
      return res.status(404).json({ error: 'Producteur non trouvé' });
    }

    // Valider les coordonnées
    const lat = latitude ? parseFloat(latitude) : null;
    const lng = longitude ? parseFloat(longitude) : null;

    // Construire la requête UPDATE dynamiquement selon les colonnes disponibles
    const updates = [];
    const values = [];

    if (nom !== undefined) { updates.push('nom = ?'); values.push(nom); }
    if (type !== undefined) { updates.push('type = ?'); values.push(type); }
    if (adresse !== undefined) { updates.push('adresse = ?'); values.push(adresse); }
    if (ville !== undefined) { updates.push('ville = ?'); values.push(ville); }
    if (lat !== null && lat !== undefined) { updates.push('latitude = ?'); values.push(lat); }
    if (lng !== null && lng !== undefined) { updates.push('longitude = ?'); values.push(lng); }
    if (horaires !== undefined) { updates.push('horaires = ?'); values.push(horaires || null); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description || null); }
    if (telephone !== undefined) { updates.push('telephone = ?'); values.push(telephone || null); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email || null); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    values.push(producteurId);

    // Mettre à jour les informations
    const query = `UPDATE producteurs SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    console.log('✅ Producteur mis à jour');

    // Récupérer le producteur mis à jour
    const updated = db.prepare(`
      SELECT id, nom, type, type_production, adresse, ville, latitude, longitude, email, horaires, description, telephone, photos
      FROM producteurs 
      WHERE id = ?
    `).get(producteurId);

    // Récupérer les photos
    const photos = db.prepare(`
      SELECT id, url_photo, ordre 
      FROM photos_producteurs 
      WHERE producteur_id = ? 
      ORDER BY ordre ASC
    `).all(producteurId);

    res.json({
      ...updated,
      photos: photos || []
    });
  } catch (error) {
    console.error('❌ Erreur modification producteur:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la modification' });
  }
});

// Route pour modifier le mot de passe
router.put('/moi/mot-de-passe', requireAuth, async (req, res) => {
  try {
    const producteurId = req.session.producteurId;
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

    if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
      return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    }

    // Vérifier l'ancien mot de passe
    const producteur = db.prepare('SELECT mot_de_passe FROM producteurs WHERE id = ?').get(producteurId);
    if (!producteur) {
      return res.status(404).json({ error: 'Producteur non trouvé' });
    }

    const passwordMatch = await bcrypt.compare(ancien_mot_de_passe, producteur.mot_de_passe);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
    }

    // Hasher et mettre à jour le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);
    db.prepare('UPDATE producteurs SET mot_de_passe = ? WHERE id = ?').run(hashedPassword, producteurId);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur modification mot de passe:', error);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// Route pour ajouter une photo (URL pour l'instant, on pourrait ajouter upload de fichier plus tard)
router.post('/moi/photos', requireAuth, (req, res) => {
  try {
    const producteurId = req.session.producteurId;
    const { url_photo } = req.body;

    if (!url_photo) {
      return res.status(400).json({ error: 'URL de la photo requise' });
    }

    // Compter les photos existantes
    const countPhotos = db.prepare('SELECT COUNT(*) as count FROM photos_producteurs WHERE producteur_id = ?').get(producteurId);
    
    if (countPhotos.count >= 4) {
      return res.status(400).json({ error: 'Maximum 4 photos autorisées' });
    }

    // Ajouter la photo
    const result = db.prepare(`
      INSERT INTO photos_producteurs (producteur_id, url_photo, ordre)
      VALUES (?, ?, ?)
    `).run(producteurId, url_photo, countPhotos.count);

    res.json({ success: true, photo_id: result.lastInsertRowid });
  } catch (error) {
    console.error('Erreur ajout photo:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la photo' });
  }
});

// Route pour supprimer une photo
router.delete('/moi/photos/:photoId', requireAuth, (req, res) => {
  try {
    const producteurId = req.session.producteurId;
    const { photoId } = req.params;

    // Vérifier que la photo appartient au producteur
    const photo = db.prepare('SELECT producteur_id FROM photos_producteurs WHERE id = ?').get(photoId);
    if (!photo || photo.producteur_id !== producteurId) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    db.prepare('DELETE FROM photos_producteurs WHERE id = ?').run(photoId);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression photo:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Route pour réordonner les photos
router.put('/moi/photos/ordre', requireAuth, (req, res) => {
  try {
    const producteurId = req.session.producteurId;
    const { photos } = req.body; // Array of { id, ordre }

    if (!Array.isArray(photos)) {
      return res.status(400).json({ error: 'Format invalide' });
    }

    // Mettre à jour l'ordre de chaque photo
    const updateStmt = db.prepare('UPDATE photos_producteurs SET ordre = ? WHERE id = ? AND producteur_id = ?');
    
    for (const photo of photos) {
      updateStmt.run(photo.ordre, photo.id, producteurId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur réordonnancement photos:', error);
    res.status(500).json({ error: 'Erreur lors du réordonnancement' });
  }
});

export { router as producteurRoutes };


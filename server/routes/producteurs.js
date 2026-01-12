// ============================================
// ROUTES PRODUCTEURS
// ============================================
// Gère la recherche et l'affichage des producteurs

import express from 'express';
import fetch from 'node-fetch';
import { getDatabase } from '../database.js';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const router = express.Router();
let db;
try {
  db = getDatabase();
} catch (error) {
  console.error('❌ Erreur initialisation DB dans producteurs.js:', error);
  db = null;
}
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;

// Configuration multer pour upload photos
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = join(process.cwd(), 'uploads');

console.log('📂 Configuration multer:');
console.log('   - Dossier uploads:', uploadsDir);

// CRÉER le dossier s'il n'existe pas
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Dossier uploads/ créé');
  } catch (err) {
    console.error('❌ Erreur création dossier:', err);
  }
} else {
  console.log('✅ Dossier uploads/ existe déjà');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('📂 Tentative création dossier:', uploadsDir);
    
    // CRÉER le dossier s'il n'existe pas (double vérification)
    if (!fs.existsSync(uploadsDir)) {
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✅ Dossier uploads/ créé');
      } catch (err) {
        console.error('❌ Erreur création dossier:', err);
        return cb(err);
      }
    } else {
      console.log('✅ Dossier uploads/ existe déjà');
    }
    
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    console.log('📝 Nom fichier généré:', uniqueName);
    cb(null, uniqueName);
  }
});

// Filtre pour les types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  console.log('🔍 Vérification fichier:', {
    filename: file.originalname,
    mimetype: file.mimetype,
    extname: path.extname(file.originalname),
    allowed: extname && mimetype
  });
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  
  cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG ou GIF.'));
};

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter
});

// Vérifier que la clé API est disponible
if (!GOOGLE_API_KEY) {
  console.error('⚠️ ATTENTION: GOOGLE_MAPS_API_KEY non définie dans les variables d\'environnement');
}

// Fonction pour calculer la distance entre deux points (en km)
function calculerDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Fonction pour obtenir les coordonnées d'une ville (géocodage)
async function geocoderVille(nomVille) {
  try {
    if (!nomVille || nomVille.trim() === '') {
      console.error('❌ Ville vide');
      return null;
    }

    if (!GOOGLE_API_KEY) {
      console.error('❌ Clé API Google Maps non configurée');
      return null;
    }

    const ville = nomVille.trim();
    console.log(`🔍 Recherche géocodage pour: "${ville}"`);
    
    // Essayer d'abord avec "France" pour avoir de meilleurs résultats
    let query = ville.toLowerCase().includes('france') ? ville : `${ville}, France`;
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&language=fr&region=fr`;
    console.log(`📡 Appel API: ${url.replace(GOOGLE_API_KEY, '***')}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Erreur HTTP géocodage: ${response.status}`);
      const text = await response.text();
      console.error('Réponse:', text.substring(0, 200));
      return null;
    }
    
    const data = await response.json();
    
    // Vérifier le statut de la réponse
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log(`✅ Ville trouvée: ${ville} -> ${location.lat}, ${location.lng}`);
      return { lat: location.lat, lng: location.lng };
    }
    
    // Si pas de résultat avec "France", essayer sans
    if (!ville.toLowerCase().includes('france')) {
      const url2 = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(ville)}&key=${GOOGLE_API_KEY}&language=fr&region=fr`;
      const response2 = await fetch(url2);
      
      if (response2.ok) {
        const data2 = await response2.json();
        
        if (data2.status === 'OK' && data2.results && data2.results.length > 0) {
          const location = data2.results[0].geometry.location;
          console.log(`✅ Ville trouvée (sans France): ${ville} -> ${location.lat}, ${location.lng}`);
          return { lat: location.lat, lng: location.lng };
        }
      }
    }
    
    console.error(`❌ Ville non trouvée: ${ville}, statut: ${data.status}`);
    if (data.error_message) {
      console.error(`Message d'erreur: ${data.error_message}`);
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur géocodage:', error.message);
    return null;
  }
}

// Fonction pour chercher des producteurs via Google Places API
async function chercherProducteursPlaces(lat, lng, rayonKm) {
  try {
    // Rechercher des fermes, exploitations agricoles autour de la ville
    const query = 'farm OR agricultural OR local producer OR ferme OR producteur local';
    const radius = rayonKm * 1000; // Convertir en mètres
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&key=${GOOGLE_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Prendre les 5 premiers résultats
      return data.results.slice(0, 5).map(place => ({
        id: `place_${place.place_id}`,
        nom: place.name,
        type: 'Producteur local',
        adresse: place.formatted_address || place.vicinity || 'Adresse non disponible',
        ville: place.formatted_address ? place.formatted_address.split(',').slice(-2)[0].trim() : 'Ville inconnue',
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        source: 'google_places'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Erreur recherche Places:', error);
    return [];
  }
}

// Route pour obtenir tous les producteurs (pour la vue France complète)
router.get('/tous', (req, res) => {
  try {
    // Vérifier que la base de données est bien initialisée
    if (!db) {
      console.error('❌ Base de données non initialisée, tentative de réinitialisation...');
      try {
        db = getDatabase();
      } catch (dbError) {
        console.error('❌ Impossible de réinitialiser la DB:', dbError);
        return res.status(500).json({ error: 'Base de données non disponible' });
      }
    }

    // Vérifier d'abord si la table producteurs existe
    let tableExists = false;
    try {
      const tableCheck = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='producteurs'
      `).get();
      tableExists = !!tableCheck;
    } catch (checkError) {
      console.error('❌ Erreur lors de la vérification de la table:', checkError);
    }

    let producteursDB = [];
    if (tableExists) {
      try {
        producteursDB = db.prepare(`
          SELECT id, nom, type, type_production, adresse, ville, latitude, longitude, horaires, description, telephone, email, photos, 'database' as source
          FROM producteurs
        `).all();
      } catch (sqlError) {
        console.error('❌ Erreur SQL lors de la récupération des producteurs:', sqlError);
        console.error('Stack:', sqlError.stack);
        // Retourner un tableau vide plutôt que de faire planter l'API
        producteursDB = [];
      }
    } else {
      console.log('ℹ️ Table producteurs n\'existe pas encore, retour d\'un tableau vide');
      return res.json({ producteurs: [] });
    }

    // Ajouter les photos pour chaque producteur (avec gestion d'erreur si la table n'existe pas)
    const producteursAvecPhotos = producteursDB.map(p => {
      try {
        let photos = [];
        try {
          // Vérifier si la table photos_producteurs existe
          const tableExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='photos_producteurs'
          `).get();
          
          if (tableExists) {
            const photosResult = db.prepare(`
              SELECT id, url_photo, ordre 
              FROM photos_producteurs 
              WHERE producteur_id = ? 
              ORDER BY ordre ASC
            `).all(p.id);
            photos = photosResult || [];
          }
        } catch (tableError) {
          // Si la table n'existe pas, continuer sans photos
          photos = [];
        }
        
        // Parser les photos si elles sont en JSON string
        let photosFinal = photos;
        if (!photos || photos.length === 0) {
          try {
            const photosParsed = JSON.parse(p.photos || '[]');
            if (Array.isArray(photosParsed) && photosParsed.length > 0) {
              photosFinal = photosParsed.map((url, index) => ({ id: index, url_photo: url, ordre: index }));
            }
          } catch (e) {
            // Ignorer si parsing échoue
          }
        }
        
        // S'assurer que les coordonnées sont des nombres
        return { 
          ...p, 
          photos: photosFinal, 
          horaires: p.horaires || null,
          latitude: parseFloat(p.latitude) || 0,
          longitude: parseFloat(p.longitude) || 0
        };
      } catch (photoError) {
        console.error(`Erreur récupération photos pour producteur ${p.id}:`, photoError);
        return { 
          ...p, 
          photos: [], 
          horaires: p.horaires || null,
          latitude: parseFloat(p.latitude) || 0,
          longitude: parseFloat(p.longitude) || 0
        };
      }
    });

    res.json({
      producteurs: producteursAvecPhotos || []
    });
  } catch (error) {
    console.error('Erreur récupération producteurs:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Erreur lors de la récupération: ' + error.message });
  }
});

// Route principale pour rechercher des producteurs
router.get('/rechercher', async (req, res) => {
  try {
    const { ville, rayon } = req.query;

    if (!ville) {
      return res.status(400).json({ error: 'Ville requise' });
    }

    const rayonKm = parseInt(rayon) || 50;

    // Obtenir les coordonnées de la ville
    const coordsVille = await geocoderVille(ville);
    
    if (!coordsVille) {
      return res.status(400).json({ error: 'Ville non trouvée' });
    }

           // Vérifier que la base de données est bien initialisée
           if (!db) {
             console.error('❌ Base de données non initialisée');
             return res.status(500).json({ error: 'Base de données non disponible' });
           }

           // Chercher les producteurs dans la base de données
           const producteursDB = db.prepare(`
             SELECT id, nom, type, type_production, adresse, ville, latitude, longitude, horaires, description, telephone, email, photos, 'database' as source
             FROM producteurs
           `).all();
           
           // Ajouter les photos pour chaque producteur (avec gestion d'erreur si la table n'existe pas)
           const producteursAvecPhotos = producteursDB.map(p => {
             try {
               // Vérifier si la table photos_producteurs existe
               const tableExists = db.prepare(`
                 SELECT name FROM sqlite_master 
                 WHERE type='table' AND name='photos_producteurs'
               `).get();
               
               let photos = [];
               if (tableExists) {
                 photos = db.prepare(`
                   SELECT id, url_photo, ordre 
                   FROM photos_producteurs 
                   WHERE producteur_id = ? 
                   ORDER BY ordre ASC
                 `).all(p.id) || [];
               }
               
               // Parser les photos si elles sont en JSON string
               let photosFinal = photos;
               if (!photos || photos.length === 0) {
                 try {
                   const photosParsed = JSON.parse(p.photos || '[]');
                   if (Array.isArray(photosParsed) && photosParsed.length > 0) {
                     photosFinal = photosParsed.map((url, index) => ({ id: index, url_photo: url, ordre: index }));
                   }
                 } catch (e) {
                   // Ignorer si parsing échoue
                 }
               }
               
               return { ...p, photos: photosFinal, horaires: p.horaires || null };
             } catch (photoError) {
               console.error(`Erreur récupération photos pour producteur ${p.id}:`, photoError);
               return { ...p, photos: [], horaires: p.horaires || null };
             }
           });

    // Filtrer par distance et rayon - SEULEMENT les producteurs enregistrés
    let producteurs = producteursAvecPhotos
      .map(p => {
        // S'assurer que tous les champs sont préservés, y compris horaires
        return {
          ...p,
          horaires: p.horaires || null, // Préserver les horaires même si null
          distance: calculerDistance(coordsVille.lat, coordsVille.lng, p.latitude, p.longitude)
        };
      })
      .filter(p => p.distance <= rayonKm)
      .sort((a, b) => a.distance - b.distance);

    // NE PLUS utiliser Google Places API - afficher seulement les vrais producteurs enregistrés

    res.json({
      ville,
      coordsVille,
      rayonKm,
      producteurs
    });
  } catch (error) {
    console.error('Erreur recherche producteurs:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

// ============================================
// ROUTES PRODUCTEUR - Gestion du compte (JWT)
// ============================================
// Routes pour gérer le compte producteur avec authentification JWT
// IMPORTANT: Ces routes doivent être AVANT /:id pour éviter les conflits

// GET /me - Récupérer les infos du producteur connecté
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log('\n📥 GET /producteurs/me');
    console.log('   - userId:', userId);
    console.log('   - db existe ?', !!db);

    if (!db) {
      console.error('❌ Base de données non initialisée');
      return res.status(500).json({ error: 'Base de données non initialisée' });
    }

    // VÉRIFIER si l'utilisateur existe d'abord
    const user = db.prepare('SELECT id, email FROM utilisateurs WHERE id = ?').get(userId);
    console.log('   - Utilisateur existe ?', !!user);
    if (user) {
      console.log('   - Email utilisateur:', user.email);
    } else {
      console.log('   ❌ Utilisateur non trouvé dans la table utilisateurs');
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Chercher le producteur
    const producteur = db.prepare('SELECT * FROM producteurs WHERE utilisateur_id = ?').get(userId);
    console.log('   - Producteur trouvé ?', !!producteur);

    // SI AUCUN PRODUCTEUR, LE CRÉER AUTOMATIQUEMENT
    if (!producteur) {
      console.log('⚠️ Aucun producteur trouvé, création automatique...');
      
      // CRÉER LE PROFIL PRODUCTEUR
      const horairesDefault = JSON.stringify({
        lundi: { ouvert: false, debut: '08:00', fin: '18:00' },
        mardi: { ouvert: false, debut: '08:00', fin: '18:00' },
        mercredi: { ouvert: false, debut: '08:00', fin: '18:00' },
        jeudi: { ouvert: false, debut: '08:00', fin: '18:00' },
        vendredi: { ouvert: false, debut: '08:00', fin: '18:00' },
        samedi: { ouvert: false, debut: '08:00', fin: '18:00' },
        dimanche: { ouvert: false, debut: '08:00', fin: '18:00' }
      });
      
      const result = db.prepare(`
        INSERT INTO producteurs (utilisateur_id, nom, email, photos, horaires, plan) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        'Ma Ferme',
        user.email,
        '[]',
        horairesDefault,
        'free'
      );
      
      console.log('✅ Profil producteur créé automatiquement, ID:', result.lastInsertRowid);
      
      producteur = db.prepare('SELECT * FROM producteurs WHERE id = ?').get(result.lastInsertRowid);
    }

    console.log('✅ Producteur trouvé:', producteur.nom);
    console.log('   - Photos (raw):', producteur.photos);
    console.log('   - Type photos:', typeof producteur.photos);

    // PARSER LES PHOTOS AVANT D'ENVOYER AU FRONTEND
    let photos = [];
    if (producteur.photos) {
      try {
        if (typeof producteur.photos === 'string') {
          photos = JSON.parse(producteur.photos);
          console.log('   - Photos parsées:', photos);
        } else if (Array.isArray(producteur.photos)) {
          // Si c'est un array d'objets avec url_photo, extraire les URLs
          photos = producteur.photos.map(p => {
            if (typeof p === 'string') {
              return p;
            } else if (p && p.url_photo) {
              return p.url_photo;
            } else {
              return p;
            }
          }).filter(Boolean);
          console.log('   - Photos déjà en array:', photos);
        }
      } catch (e) {
        console.error('   - Erreur parse photos:', e);
        photos = [];
      }
    }

    // PARSER LES HORAIRES
    let horaires = {};
    if (producteur.horaires) {
      try {
        if (typeof producteur.horaires === 'string') {
          horaires = JSON.parse(producteur.horaires);
        } else {
          horaires = producteur.horaires;
        }
      } catch (e) {
        console.error('   - Erreur parse horaires:', e);
      }
    }

    console.log('   - Photos finales (count):', photos.length);

    // RETOURNER LES DONNÉES AVEC PHOTOS PARSÉES
    res.json({
      ...producteur,
      photos,      // ← ARRAY au lieu de STRING
      horaires     // ← OBJECT au lieu de STRING
    });
  } catch (error) {
    console.error('❌ Erreur GET /me:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// PUT /me - Mettre à jour les infos du producteur
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { nom, description, adresse, telephone, email, type_production, photos, horaires, ville, latitude, longitude, type } = req.body;

    console.log('\n📝 PUT /producteurs/me');
    console.log('   - userId:', userId);
    console.log('   - nom:', nom);
    console.log('   - description:', description);
    console.log('   - adresse:', adresse);
    console.log('   - telephone:', telephone);
    console.log('   - email:', email);
    console.log('   - type_production:', type_production);
    console.log('   - photos (type):', typeof photos, '(length:', photos?.length || 0, ')');
    console.log('   - horaires (type):', typeof horaires);
    console.log('   - ville:', ville);
    console.log('   - latitude:', latitude);
    console.log('   - longitude:', longitude);

    // Vérifier que le producteur existe
    let producteur = db.prepare('SELECT * FROM producteurs WHERE utilisateur_id = ?').get(userId);

    if (!producteur) {
      console.log('❌ Producteur non trouvé, création...');
      
      // Récupérer l'email de l'utilisateur
      const user = db.prepare('SELECT email FROM utilisateurs WHERE id = ?').get(userId);
      
      if (!user) {
        console.log('❌ Utilisateur non trouvé');
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      // Préparer les horaires
      const horairesStr = typeof horaires === 'string' ? horaires : JSON.stringify(horaires || {
        lundi: { ouvert: false, debut: '08:00', fin: '18:00' },
        mardi: { ouvert: false, debut: '08:00', fin: '18:00' },
        mercredi: { ouvert: false, debut: '08:00', fin: '18:00' },
        jeudi: { ouvert: false, debut: '08:00', fin: '18:00' },
        vendredi: { ouvert: false, debut: '08:00', fin: '18:00' },
        samedi: { ouvert: false, debut: '08:00', fin: '18:00' },
        dimanche: { ouvert: false, debut: '08:00', fin: '18:00' }
      });
      
      // Préparer les photos
      const photosStr = typeof photos === 'string' ? photos : JSON.stringify(photos || []);
      
      // Créer le producteur
      const result = db.prepare(`
        INSERT INTO producteurs (utilisateur_id, nom, description, adresse, telephone, email, type_production, photos, horaires, ville, latitude, longitude, plan) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        nom || 'Ma Ferme',
        description || '',
        adresse || '',
        telephone || '',
        email || user.email,
        type_production || type || '',
        photosStr,
        horairesStr,
        ville || '',
        latitude || null,
        longitude || null,
        'free'
      );
      
      console.log('✅ Producteur créé, ID:', result.lastInsertRowid);
      
      producteur = db.prepare('SELECT * FROM producteurs WHERE id = ?').get(result.lastInsertRowid);
    }

    console.log('📊 Producteur trouvé, ID:', producteur.id);

    // Préparer les valeurs pour l'UPDATE (utiliser les valeurs reçues ou conserver les existantes)
    const typeValue = type_production || type || producteur.type_production || producteur.type || '';
    
    // Préparer horaires (string JSON)
    let horairesStr;
    if (horaires !== undefined) {
      horairesStr = typeof horaires === 'string' ? horaires : JSON.stringify(horaires);
    } else {
      horairesStr = producteur.horaires || '{}';
    }
    
    // Préparer photos (string JSON)
    let photosStr;
    if (photos !== undefined) {
      photosStr = typeof photos === 'string' ? photos : JSON.stringify(photos || []);
    } else {
      photosStr = producteur.photos || '[]';
    }

    // Mettre à jour TOUTES les colonnes
    db.prepare(`
      UPDATE producteurs 
      SET nom = ?,
          description = ?,
          adresse = ?,
          telephone = ?,
          email = ?,
          type_production = ?,
          type = ?,
          photos = ?,
          horaires = ?,
          ville = ?,
          latitude = ?,
          longitude = ?
      WHERE utilisateur_id = ?
    `).run(
      nom !== undefined ? nom : (producteur.nom || ''),
      description !== undefined ? description : (producteur.description || ''),
      adresse !== undefined ? adresse : (producteur.adresse || ''),
      telephone !== undefined ? telephone : (producteur.telephone || ''),
      email !== undefined ? email : (producteur.email || ''),
      typeValue,
      typeValue, // Compatibilité avec colonne 'type'
      photosStr,
      horairesStr,
      ville !== undefined ? ville : (producteur.ville || ''),
      latitude !== undefined && latitude !== null ? parseFloat(latitude) : (producteur.latitude || null),
      longitude !== undefined && longitude !== null ? parseFloat(longitude) : (producteur.longitude || null),
      userId
    );

    console.log('✅ UPDATE exécuté');

    // Géocodage si adresse changée et pas de coordonnées
    if (adresse && adresse !== producteur.adresse && (!latitude || !longitude)) {
      console.log('🗺️ Géocodage de la nouvelle adresse...');
      
      const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;
      
      if (GOOGLE_MAPS_API_KEY) {
        try {
          const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(adresse)}&key=${GOOGLE_MAPS_API_KEY}`
          );
          const geocodeData = await geocodeResponse.json();
          
          if (geocodeData.status === 'OK' && geocodeData.results[0]) {
            const location = geocodeData.results[0].geometry.location;
            
            db.prepare('UPDATE producteurs SET latitude = ?, longitude = ? WHERE utilisateur_id = ?').run(
              location.lat, location.lng, userId
            );
            
            console.log('✅ Coordonnées GPS mises à jour:', location.lat, location.lng);
          } else {
            console.log('⚠️ Géocodage échoué:', geocodeData.status);
          }
        } catch (geocodeError) {
          console.error('⚠️ Erreur géocodage:', geocodeError);
        }
      } else {
        console.log('⚠️ GOOGLE_MAPS_API_KEY non configurée');
      }
    }

    // Récupérer les données mises à jour
    const updated = db.prepare('SELECT * FROM producteurs WHERE utilisateur_id = ?').get(userId);

    console.log('✅ Producteur mis à jour:');
    console.log('   - nom:', updated.nom);
    console.log('   - description:', updated.description);
    console.log('   - adresse:', updated.adresse);
    console.log('   - telephone:', updated.telephone);
    console.log('   - email:', updated.email);
    console.log('   - type_production:', updated.type_production);
    console.log('   - photos:', updated.photos);
    console.log('   - horaires:', updated.horaires);
    console.log('   - latitude:', updated.latitude);
    console.log('   - longitude:', updated.longitude);
    console.log('   - ville:', updated.ville);

    // Récupérer les photos depuis la table photos_producteurs si elle existe
    let photosList = [];
    try {
      photosList = db.prepare(`
        SELECT id, url_photo, ordre 
        FROM photos_producteurs 
        WHERE producteur_id = ? 
        ORDER BY ordre ASC
      `).all(updated.id);
    } catch (e) {
      // Table n'existe peut-être pas, utiliser photos de la colonne
      try {
        const photosParsed = JSON.parse(updated.photos || '[]');
        if (Array.isArray(photosParsed)) {
          photosList = photosParsed.map((url, index) => ({ id: index, url_photo: url, ordre: index }));
        }
      } catch (parseError) {
        console.log('⚠️ Erreur parsing photos:', parseError);
      }
    }

    res.json({
      ...updated,
      photos: photosList || []
    });

  } catch (error) {
    console.error('❌ Erreur PUT /me:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Route pour obtenir les détails d'un producteur (DOIT être APRÈS /me pour éviter les conflits)
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const producteurIdStr = String(id);

    // Si c'est un producteur de Places API, on ne peut pas le récupérer en base
    if (producteurIdStr.startsWith('place_')) {
      return res.status(404).json({ error: 'Producteur de Places API, détails non disponibles' });
    }

    const producteur = db.prepare(`
      SELECT id, nom, type, type_production, adresse, ville, latitude, longitude, horaires, description, telephone, email, photos
      FROM producteurs 
      WHERE id = ?
    `).get(id);
    
    if (!producteur) {
      return res.status(404).json({ error: 'Producteur non trouvé' });
    }

    // Récupérer les photos (max 4)
    let photos = [];
    try {
      photos = db.prepare(`
        SELECT id, url_photo, ordre 
        FROM photos_producteurs 
        WHERE producteur_id = ? 
        ORDER BY ordre ASC
      `).all(id);
    } catch (e) {
      // Si la table n'existe pas, parser depuis la colonne photos
      try {
        const photosParsed = JSON.parse(producteur.photos || '[]');
        if (Array.isArray(photosParsed)) {
          photos = photosParsed.map((url, index) => ({ id: index, url_photo: url, ordre: index }));
        }
      } catch (parseError) {
        // Ignorer
      }
    }

    res.json({
      ...producteur,
      photos: photos || []
    });
  } catch (error) {
    console.error('Erreur récupération producteur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// POST /upload-photo - Upload d'une photo
router.post('/upload-photo', authenticateToken, (req, res, next) => {
  console.log('\n📤 POST /producteurs/upload-photo');
  console.log('   - userId:', req.userId);
  console.log('   - Headers:', req.headers['content-type']);
  
  upload.single('photo')(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur multer:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Le fichier est trop volumineux (max 5 MB)' });
        }
        return res.status(400).json({ error: `Erreur upload: ${err.message}` });
      }
      
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      console.error('❌ Aucun fichier reçu');
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }
    
    const photoUrl = `/uploads/${req.file.filename}`;
    console.log('✅ Photo uploadée:', photoUrl);
    console.log('   - Chemin complet:', req.file.path);
    console.log('   - Taille:', req.file.size, 'bytes');
    
    res.json({ url: photoUrl });
  });
});

export { router as producteurRoutes };


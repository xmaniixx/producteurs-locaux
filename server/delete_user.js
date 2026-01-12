// Script pour supprimer un compte utilisateur
// Usage: node server/delete_user.js <email>

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'database.db');

const email = process.argv[2];

if (!email) {
  console.log('Usage: node server/delete_user.js <email>');
  console.log('Exemple: node server/delete_user.js test@example.com');
  process.exit(1);
}

try {
  const db = new Database(dbPath);

  console.log(`\n🔍 Recherche du compte avec l'email: ${email}\n`);

  // Vérifier si l'utilisateur existe
  const utilisateur = db.prepare('SELECT * FROM utilisateurs WHERE email = ?').get(email);
  
  if (!utilisateur) {
    // Vérifier si c'est un producteur
    const producteur = db.prepare('SELECT * FROM producteurs WHERE email = ?').get(email);
    
    if (!producteur) {
      console.log('❌ Aucun compte trouvé avec cet email.');
      process.exit(1);
    }
    
    console.log('📋 Producteur trouvé:');
    console.log(`   ID: ${producteur.id}`);
    console.log(`   Nom: ${producteur.nom}`);
    console.log(`   Email: ${producteur.email}`);
    
    // Supprimer le producteur et ses statistiques/photos associées
    db.prepare('DELETE FROM statistiques WHERE producteur_id = ?').run(producteur.id);
    db.prepare('DELETE FROM photos_producteurs WHERE producteur_id = ?').run(producteur.id);
    db.prepare('DELETE FROM demandes_producteur WHERE utilisateur_id = ?').run(producteur.utilisateur_id || 0);
    db.prepare('DELETE FROM producteurs WHERE id = ?').run(producteur.id);
    
      if (producteur.utilisateur_id) {
        // Supprimer les tokens de reset si la table existe
        try {
          db.prepare('DELETE FROM reset_tokens WHERE email = ?').run(email);
        } catch (e) {
          // La table n'existe pas encore, on ignore
        }
        db.prepare('DELETE FROM utilisateurs WHERE id = ?').run(producteur.utilisateur_id);
      }
    
    console.log('✅ Compte producteur supprimé avec succès !\n');
  } else {
    console.log('📋 Utilisateur trouvé:');
    console.log(`   ID: ${utilisateur.id}`);
    console.log(`   Email: ${utilisateur.email}`);
    console.log(`   Téléphone: ${utilisateur.telephone || 'Non renseigné'}`);
    
    // Vérifier s'il est aussi producteur
    const producteur = db.prepare('SELECT * FROM producteurs WHERE utilisateur_id = ? OR email = ?').get(utilisateur.id, email);
    
    if (producteur) {
      console.log(`\n⚠️  Ce compte est aussi producteur (ID: ${producteur.id})`);
      // Supprimer le producteur et ses données associées
      db.prepare('DELETE FROM statistiques WHERE producteur_id = ?').run(producteur.id);
      db.prepare('DELETE FROM photos_producteurs WHERE producteur_id = ?').run(producteur.id);
      db.prepare('DELETE FROM producteurs WHERE id = ?').run(producteur.id);
      console.log('   → Données producteur supprimées');
    }
    
    // Supprimer les demandes de producteur
    db.prepare('DELETE FROM demandes_producteur WHERE utilisateur_id = ?').run(utilisateur.id);
    
    // Supprimer les tokens de reset si la table existe
    try {
      db.prepare('DELETE FROM reset_tokens WHERE email = ?').run(email);
    } catch (e) {
      // La table n'existe pas encore, on ignore
    }
    
    // Supprimer l'utilisateur
    db.prepare('DELETE FROM utilisateurs WHERE id = ?').run(utilisateur.id);
    
    console.log('✅ Compte utilisateur supprimé avec succès !\n');
  }

  db.close();
  console.log('✅ Opération terminée.\n');
  
} catch (error) {
  console.error('❌ Erreur lors de la suppression:', error);
  process.exit(1);
}


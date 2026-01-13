// Script pour lister tous les utilisateurs et producteurs
// Usage: node server/list_users.js

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'database.db');

try {
  const db = new Database(dbPath);

  console.log('\n📋 LISTE DES UTILISATEURS\n');
  console.log('═'.repeat(60));

  // Lister les utilisateurs
  const utilisateurs = db.prepare('SELECT id, email, telephone, date_creation FROM utilisateurs ORDER BY id').all();
  
  if (utilisateurs.length === 0) {
    console.log('Aucun utilisateur trouvé.\n');
  } else {
    utilisateurs.forEach((u, index) => {
      console.log(`\n${index + 1}. Utilisateur #${u.id}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Téléphone: ${u.telephone || 'Non renseigné'}`);
      console.log(`   Date création: ${u.date_creation || 'Non renseignée'}`);
      
      // Vérifier si c'est aussi un producteur
      const producteur = db.prepare('SELECT id, nom FROM producteurs WHERE utilisateur_id = ? OR email = ?').get(u.id, u.email);
      if (producteur) {
        console.log(`   → Également producteur (ID: ${producteur.id}, Nom: ${producteur.nom})`);
      }
    });
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📋 LISTE DES PRODUCTEURS\n');
  console.log('═'.repeat(60));

  // Lister les producteurs
  const producteurs = db.prepare('SELECT id, nom, email, ville, date_creation FROM producteurs ORDER BY id').all();
  
  if (producteurs.length === 0) {
    console.log('Aucun producteur trouvé.\n');
  } else {
    producteurs.forEach((p, index) => {
      console.log(`\n${index + 1}. Producteur #${p.id}`);
      console.log(`   Nom: ${p.nom}`);
      console.log(`   Email: ${p.email}`);
      console.log(`   Ville: ${p.ville || 'Non renseignée'}`);
      console.log(`   Date création: ${p.date_creation || 'Non renseignée'}`);
    });
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n💡 Pour supprimer un compte, utilisez:');
  console.log('   node server/delete_user.js <email>\n');

  db.close();
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}





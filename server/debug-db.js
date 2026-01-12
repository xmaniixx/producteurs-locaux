// ============================================
// SCRIPT DE DIAGNOSTIC BASE DE DONNÉES
// ============================================
// Diagnostic complet de la structure de la base de données

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Le fichier database.db est dans le dossier parent (racine du projet)
const dbPath = join(__dirname, '..', 'database.db');

console.log('\n========================================');
console.log('🔍 DIAGNOSTIC BASE DE DONNÉES');
console.log('========================================\n');
console.log('📁 Chemin DB:', dbPath);

try {
  const db = new Database(dbPath);

  // 1. Vérifier la structure de la table producteurs
  console.log('\n📊 COLONNES DE LA TABLE PRODUCTEURS:');
  try {
    const columns = db.prepare("PRAGMA table_info(producteurs)").all();
    if (columns.length === 0) {
      console.log('   ❌ TABLE PRODUCTEURS N\'EXISTE PAS !');
    } else {
      columns.forEach(col => {
        console.log(`   - ${col.name} (${col.type}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''})`);
      });
    }
  } catch (err) {
    console.error('   ❌ Erreur lecture table producteurs:', err.message);
  }

  // 2. Lister les producteurs
  console.log('\n👥 PRODUCTEURS DANS LA DB:');
  try {
    const rows = db.prepare("SELECT * FROM producteurs").all();
    if (rows.length === 0) {
      console.log('   ⚠️ AUCUN PRODUCTEUR TROUVÉ');
    } else {
      rows.forEach(row => {
        console.log('\n   Producteur ID:', row.id);
        console.log('   - utilisateur_id:', row.utilisateur_id);
        console.log('   - user_id:', row.user_id || 'NON DÉFINI');
        console.log('   - nom:', row.nom || 'NON DÉFINI');
        console.log('   - email:', row.email || 'NON DÉFINI');
        console.log('   - adresse:', row.adresse || 'NON DÉFINI');
        console.log('   - photos:', row.photos ? (row.photos.length > 50 ? row.photos.substring(0, 50) + '...' : row.photos) : 'NULL');
        console.log('   - horaires:', row.horaires ? (row.horaires.length > 50 ? row.horaires.substring(0, 50) + '...' : row.horaires) : 'NULL');
        console.log('   - type_production:', row.type_production || 'NON DÉFINI');
        console.log('   - latitude:', row.latitude || 'NULL');
        console.log('   - longitude:', row.longitude || 'NULL');
      });
    }
  } catch (err) {
    console.error('   ❌ Erreur lecture producteurs:', err.message);
  }

  // 3. Vérifier les utilisateurs
  console.log('\n👤 UTILISATEURS DANS LA DB:');
  try {
    const users = db.prepare("SELECT id, email FROM utilisateurs").all();
    if (users.length === 0) {
      console.log('   ⚠️ AUCUN UTILISATEUR TROUVÉ');
    } else {
      users.forEach(user => {
        console.log(`   - ID ${user.id}: ${user.email}`);
        
        // Vérifier si un producteur existe pour cet utilisateur
        const producteur = db.prepare("SELECT id, nom FROM producteurs WHERE utilisateur_id = ?").get(user.id);
        if (producteur) {
          console.log(`      ✅ Producteur associé: ID ${producteur.id} - ${producteur.nom}`);
        } else {
          console.log(`      ❌ AUCUN PRODUCTEUR ASSOCIÉ`);
        }
      });
    }
  } catch (err) {
    console.error('   ❌ Erreur lecture utilisateurs:', err.message);
  }

  // 4. Vérifier la table users (si elle existe)
  console.log('\n👤 TABLE USERS (si existe):');
  try {
    const usersTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (usersTable) {
      const users = db.prepare("SELECT id, email FROM users LIMIT 10").all();
      users.forEach(user => {
        console.log(`   - ID ${user.id}: ${user.email}`);
      });
    } else {
      console.log('   ℹ️ Table "users" n\'existe pas (utilise "utilisateurs")');
    }
  } catch (err) {
    console.log('   ℹ️ Table "users" n\'existe pas ou erreur:', err.message);
  }

  // 5. Lister toutes les tables
  console.log('\n📋 TOUTES LES TABLES DANS LA DB:');
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    tables.forEach(table => {
      console.log(`   - ${table.name}`);
    });
  } catch (err) {
    console.error('   ❌ Erreur lecture tables:', err.message);
  }

  console.log('\n========================================\n');
  db.close();
} catch (error) {
  console.error('❌ ERREUR CRITIQUE:', error.message);
  console.error('   Détails:', error);
}


// ============================================
// BASE DE DONNÉES - Gestion SQLite
// ============================================
// Ce fichier crée et gère la base de données
// Il crée automatiquement les tables nécessaires au démarrage

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'database.db');

let db;

// Fonction pour initialiser la base de données
export function initDatabase() {
  db = new Database(dbPath);
  
  // Table des producteurs
  // Stocke les informations des producteurs inscrits
  db.exec(`
    CREATE TABLE IF NOT EXISTS producteurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      type TEXT NOT NULL,
      adresse TEXT NOT NULL,
      ville TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mot_de_passe TEXT NOT NULL,
      horaires TEXT,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Migration robuste : Ajouter les colonnes manquantes avec vérification PRAGMA
  const producteursTableInfo = db.prepare("PRAGMA table_info(producteurs)").all();
  const producteursColumns = producteursTableInfo.map(col => col.name);
  
  const producteursMigrations = [
    { name: 'horaires', sql: `ALTER TABLE producteurs ADD COLUMN horaires TEXT DEFAULT '{}'` },
    { name: 'description', sql: `ALTER TABLE producteurs ADD COLUMN description TEXT` },
    { name: 'telephone', sql: `ALTER TABLE producteurs ADD COLUMN telephone TEXT` },
    { name: 'type_production', sql: `ALTER TABLE producteurs ADD COLUMN type_production TEXT` },
    { name: 'photos', sql: `ALTER TABLE producteurs ADD COLUMN photos TEXT DEFAULT '[]'` },
    { name: 'plan', sql: `ALTER TABLE producteurs ADD COLUMN plan TEXT DEFAULT 'free'` },
    { name: 'created_at', sql: `ALTER TABLE producteurs ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` },
    { name: 'updated_at', sql: `ALTER TABLE producteurs ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` },
    { name: 'latitude', sql: `ALTER TABLE producteurs ADD COLUMN latitude REAL` },
    { name: 'longitude', sql: `ALTER TABLE producteurs ADD COLUMN longitude REAL` },
    { name: 'ville', sql: `ALTER TABLE producteurs ADD COLUMN ville TEXT` }
  ];
  
  for (const migration of producteursMigrations) {
    if (!producteursColumns.includes(migration.name)) {
      try {
        db.exec(migration.sql);
        console.log(`✅ Colonne ${migration.name} ajoutée à producteurs`);
      } catch (e) {
        // Ignorer les erreurs silencieusement (colonne peut déjà exister)
        if (!e.message.includes('duplicate column')) {
          console.log(`⚠️ Erreur ajout colonne ${migration.name}:`, e.message);
        }
      }
    }
  }
  
  // S'assurer que utilisateur_id existe et créer l'index
  if (!producteursColumns.includes('utilisateur_id')) {
    try {
      db.exec(`ALTER TABLE producteurs ADD COLUMN utilisateur_id INTEGER`);
      console.log('✅ Colonne utilisateur_id ajoutée à producteurs');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('⚠️ Erreur ajout utilisateur_id:', e.message);
      }
    }
  }
  
  // Vérifier que toutes les colonnes nécessaires existent
  const producteursColumnsUpdated = db.prepare("PRAGMA table_info(producteurs)").all();
  const producteursColumnsNames = producteursColumnsUpdated.map(col => col.name);
  
  const requiredColumns = [
    { name: 'description', sql: `ALTER TABLE producteurs ADD COLUMN description TEXT` },
    { name: 'telephone', sql: `ALTER TABLE producteurs ADD COLUMN telephone TEXT` },
    { name: 'email', sql: `ALTER TABLE producteurs ADD COLUMN email TEXT` },
    { name: 'type_production', sql: `ALTER TABLE producteurs ADD COLUMN type_production TEXT` },
    { name: 'photos', sql: `ALTER TABLE producteurs ADD COLUMN photos TEXT DEFAULT '[]'` },
    { name: 'horaires', sql: `ALTER TABLE producteurs ADD COLUMN horaires TEXT DEFAULT '{}'` },
    { name: 'latitude', sql: `ALTER TABLE producteurs ADD COLUMN latitude REAL` },
    { name: 'longitude', sql: `ALTER TABLE producteurs ADD COLUMN longitude REAL` },
    { name: 'ville', sql: `ALTER TABLE producteurs ADD COLUMN ville TEXT` },
    { name: 'plan', sql: `ALTER TABLE producteurs ADD COLUMN plan TEXT DEFAULT 'free'` }
  ];
  
  for (const col of requiredColumns) {
    if (!producteursColumnsNames.includes(col.name)) {
      try {
        db.exec(col.sql);
        console.log(`✅ Colonne ${col.name} ajoutée à producteurs`);
      } catch (e) {
        if (!e.message.includes('duplicate column')) {
          console.log(`⚠️ Erreur ajout colonne ${col.name}:`, e.message);
        }
      }
    }
  }
  
  // Créer l'index pour utilisateur_id
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_producteur_utilisateur ON producteurs(utilisateur_id)`);
  } catch (e) {
    // Index peut déjà exister
  }

  // Table des statistiques
  // Enregistre les vues, clics et visites pour chaque producteur
  db.exec(`
    CREATE TABLE IF NOT EXISTS statistiques (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producteur_id INTEGER NOT NULL,
      type_stat TEXT NOT NULL,
      date_action DATETIME DEFAULT CURRENT_TIMESTAMP,
      utilisateur_id INTEGER,
      FOREIGN KEY (producteur_id) REFERENCES producteurs(id),
      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
    )
  `);
  
  // Ajouter la colonne utilisateur_id si elle n'existe pas (migration)
  try {
    db.exec(`ALTER TABLE statistiques ADD COLUMN utilisateur_id INTEGER`);
  } catch (e) {
    // La colonne existe déjà, on ignore l'erreur
  }
  
  // Table des photos des producteurs
  // Permet de stocker jusqu'à 4 photos par producteur
  db.exec(`
    CREATE TABLE IF NOT EXISTS photos_producteurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producteur_id INTEGER NOT NULL,
      url_photo TEXT NOT NULL,
      ordre INTEGER NOT NULL DEFAULT 0,
      date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (producteur_id) REFERENCES producteurs(id) ON DELETE CASCADE,
      UNIQUE(producteur_id, ordre)
    )
  `);

  // Table des utilisateurs
  // Comptes utilisateurs principaux
  db.exec(`
    CREATE TABLE IF NOT EXISTS utilisateurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      telephone TEXT NOT NULL,
      mot_de_passe TEXT NOT NULL,
      date_naissance DATE NOT NULL,
      est_producteur BOOLEAN DEFAULT 0,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des demandes pour devenir producteur
  // Stocke les demandes avec les informations de vérification
  db.exec(`
    CREATE TABLE IF NOT EXISTS demandes_producteur (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utilisateur_id INTEGER NOT NULL,
      nom_ferme TEXT NOT NULL,
      type_production TEXT NOT NULL,
      adresse TEXT NOT NULL,
      ville TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      numero_siret TEXT,
      justificatif TEXT,
      statut TEXT DEFAULT 'en_attente',
      date_demande DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_validation DATETIME,
      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
    )
  `);

  // Table pour les tokens de réinitialisation de mot de passe
  db.exec(`
    CREATE TABLE IF NOT EXISTS reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      type_compte TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT 0,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Lier les producteurs aux utilisateurs (si un utilisateur devient producteur)
  // Ajouter colonne utilisateur_id à producteurs si elle n'existe pas
  try {
    db.exec(`ALTER TABLE producteurs ADD COLUMN utilisateur_id INTEGER`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_producteur_utilisateur ON producteurs(utilisateur_id)`);
  } catch (e) {
    // La colonne existe déjà, on ignore l'erreur
  }

  // Table des favoris
  // Permet aux utilisateurs d'ajouter des producteurs à leurs favoris
  db.exec(`
    CREATE TABLE IF NOT EXISTS favoris (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utilisateur_id INTEGER NOT NULL,
      producteur_id INTEGER NOT NULL,
      date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
      FOREIGN KEY (producteur_id) REFERENCES producteurs(id) ON DELETE CASCADE,
      UNIQUE(utilisateur_id, producteur_id)
    )
  `);

  // Créer index pour améliorer les performances
  db.exec(`CREATE INDEX IF NOT EXISTS idx_favoris_utilisateur ON favoris(utilisateur_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_favoris_producteur ON favoris(producteur_id)`);

  // Table analytics_events - Événements horodatés pour statistiques
  // Architecture basée sur des événements pour calculs à la demande
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producer_id INTEGER NOT NULL,
      user_id INTEGER,
      event_type TEXT NOT NULL CHECK(event_type IN ('view', 'click', 'go')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (producer_id) REFERENCES producteurs(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
    )
  `);

  // Index pour performances
  db.exec(`CREATE INDEX IF NOT EXISTS idx_analytics_producer ON analytics_events(producer_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_analytics_producer_created ON analytics_events(producer_id, created_at)`);

  // Table des abonnements (SaaS) - Liée aux utilisateurs via producteur_id
  // Migration SAFE : Vérifier l'existence de la table et des colonnes
  const tableInfo = db.prepare("PRAGMA table_info(subscriptions)").all();
  const tableExists = tableInfo.length > 0;
  const columns = tableExists ? tableInfo.map(col => col.name) : [];
  
  if (!tableExists) {
    // Créer la table avec toutes les colonnes nécessaires
    db.exec(`
      CREATE TABLE subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producer_id INTEGER NOT NULL UNIQUE,
        plan TEXT NOT NULL DEFAULT 'free',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        stripe_price_id TEXT,
        status TEXT DEFAULT 'active',
        current_period_start DATETIME,
        current_period_end DATETIME,
        cancel_at_period_end BOOLEAN DEFAULT 0,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producer_id) REFERENCES producteurs(id) ON DELETE CASCADE
      )
    `);
    
    db.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_producer ON subscriptions(producer_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id)`);
  } else {
    // Migration : Ajouter les colonnes manquantes une par une
    const migrations = [
      { name: 'stripe_customer_id', sql: 'ALTER TABLE subscriptions ADD COLUMN stripe_customer_id TEXT' },
      { name: 'stripe_subscription_id', sql: 'ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id TEXT' },
      { name: 'stripe_price_id', sql: 'ALTER TABLE subscriptions ADD COLUMN stripe_price_id TEXT' },
      { name: 'status', sql: 'ALTER TABLE subscriptions ADD COLUMN status TEXT DEFAULT \'active\'' },
      { name: 'current_period_start', sql: 'ALTER TABLE subscriptions ADD COLUMN current_period_start DATETIME' },
      { name: 'current_period_end', sql: 'ALTER TABLE subscriptions ADD COLUMN current_period_end DATETIME' },
      { name: 'cancel_at_period_end', sql: 'ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT 0' },
      { name: 'updated_at', sql: 'ALTER TABLE subscriptions ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP' }
    ];
    
    for (const migration of migrations) {
      if (!columns.includes(migration.name)) {
        try {
          db.exec(migration.sql);
        } catch (e) {
          // Ignorer les erreurs silencieusement (colonne peut déjà exister)
        }
      }
    }
    
    // Créer les index s'ils n'existent pas
    db.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_producer ON subscriptions(producer_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id)`);
  }

  // Migrer les données existantes de statistiques vers analytics_events (une seule fois)
  try {
    const existingStats = db.prepare('SELECT COUNT(*) as count FROM analytics_events').get();
    if (existingStats.count === 0) {
      // Migrer les données de l'ancienne table statistiques
      const statsToMigrate = db.prepare(`
        SELECT producteur_id, utilisateur_id, type_stat, date_action
        FROM statistiques
      `).all();
      
      const insertEvent = db.prepare(`
        INSERT INTO analytics_events (producer_id, user_id, event_type, created_at)
        VALUES (?, ?, ?, ?)
      `);
      
      const migrateTransaction = db.transaction((stats) => {
        for (const stat of stats) {
          let eventType = 'view';
          if (stat.type_stat === 'clic_y_aller') {
            eventType = 'go';
          } else if (stat.type_stat === 'vue') {
            eventType = 'view';
          }
          
          insertEvent.run(
            stat.producteur_id,
            stat.utilisateur_id || null,
            eventType,
            stat.date_action || new Date().toISOString()
          );
        }
      });
      
      migrateTransaction(statsToMigrate);
      console.log(`✅ Migration: ${statsToMigrate.length} événements migrés vers analytics_events`);
    }
  } catch (e) {
    // Migration déjà faite ou erreur, on continue
    console.log('⚠️ Migration analytics_events:', e.message);
  }

  // Par défaut, tous les producteurs ont le plan 'free'
  // Les abonnements payants seront ajoutés manuellement ou via paiement

  return db;
}

// Fonction pour obtenir la connexion à la base de données
export function getDatabase() {
  if (!db) {
    db = new Database(dbPath);
  }
  return db;
}


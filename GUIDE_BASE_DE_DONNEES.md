# Guide de la Base de Données

## 📊 État Actuel

Votre application utilise **SQLite** avec `better-sqlite3`. La base de données est automatiquement initialisée au démarrage du serveur.

### Fichier de base de données
- **Emplacement** : `/database.db` (à la racine du projet)
- **Type** : SQLite (fichier local)
- **Initialisation** : Automatique au démarrage du serveur

## ✅ Vérification de la Connexion

### 1. Vérifier que la base de données est initialisée

Au démarrage du serveur, vous devriez voir :
```
✅ Base de données initialisée
```

### 2. Tables créées automatiquement

La base de données crée automatiquement les tables suivantes :

- ✅ `utilisateurs` - Comptes utilisateurs
- ✅ `producteurs` - Informations des producteurs
- ✅ `statistiques` - Ancienne table de stats (compatibilité)
- ✅ `analytics_events` - Nouvelle table d'événements (utilisée pour les stats)
- ✅ `favoris` - Favoris des utilisateurs
- ✅ `subscriptions` - Abonnements Stripe
- ✅ `demandes_producteur` - Demandes pour devenir producteur
- ✅ `reset_tokens` - Tokens de réinitialisation de mot de passe
- ✅ `photos_producteurs` - Photos des producteurs

### 3. Vérifier que les routes utilisent la base de données

Toutes les routes utilisent `getDatabase()` pour accéder à la base :

```javascript
import { getDatabase } from '../database.js';
const db = getDatabase();
```

**Routes connectées à la base de données :**
- ✅ `/api/auth` - Authentification
- ✅ `/api/utilisateur` - Gestion utilisateurs
- ✅ `/api/producteurs` - Liste des producteurs
- ✅ `/api/producteur` - Gestion compte producteur
- ✅ `/api/stats` - Statistiques
- ✅ `/api/stripe` - Abonnements Stripe

## 🔍 Vérification Rapide

### Tester la connexion à la base de données

1. **Démarrer le serveur** :
```bash
cd server
npm run dev
```

2. **Vérifier les logs** :
   - Vous devriez voir : `✅ Base de données initialisée`
   - Si vous voyez des erreurs, vérifiez les permissions du dossier

3. **Tester une route** :
```bash
curl http://localhost:3001/api/test
```

## 📝 Structure de la Base de Données

### Table `analytics_events` (Statistiques)
```sql
CREATE TABLE analytics_events (
  id INTEGER PRIMARY KEY,
  producer_id INTEGER NOT NULL,
  user_id INTEGER,
  event_type TEXT NOT NULL, -- 'view', 'go'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Utilisée pour :**
- Enregistrer les vues (clics sur les pins)
- Enregistrer les clics "Y aller"
- Calculer les statistiques par période

### Table `producteurs`
```sql
CREATE TABLE producteurs (
  id INTEGER PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  utilisateur_id INTEGER,
  photos TEXT DEFAULT '[]',
  horaires TEXT DEFAULT '{}',
  -- ... autres colonnes
);
```

### Table `utilisateurs`
```sql
CREATE TABLE utilisateurs (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  mot_de_passe TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  est_producteur BOOLEAN DEFAULT 0
);
```

## 🔧 Migration vers PostgreSQL (Optionnel)

Si vous souhaitez migrer vers PostgreSQL pour la production :

### 1. Installer les dépendances
```bash
npm install pg
```

### 2. Modifier `server/database.js`
Remplacer `better-sqlite3` par `pg` (PostgreSQL)

### 3. Variables d'environnement
Ajouter dans `server/.env` :
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## 🛠️ Commandes Utiles

### Voir le contenu de la base de données
```bash
sqlite3 database.db
.tables
SELECT * FROM analytics_events LIMIT 10;
```

### Sauvegarder la base de données
```bash
cp database.db database.db.backup
```

### Restaurer la base de données
```bash
cp database.db.backup database.db
```

## ⚠️ Important

1. **Sauvegardes** : Faites des sauvegardes régulières de `database.db`
2. **Permissions** : Assurez-vous que le serveur peut écrire dans le dossier
3. **Performance** : SQLite est parfait pour le développement, mais pour la production avec beaucoup d'utilisateurs, considérez PostgreSQL ou MySQL

## 📊 Vérification des Données

### Vérifier que les vues sont enregistrées
```sql
SELECT COUNT(*) FROM analytics_events WHERE event_type = 'view';
```

### Vérifier les producteurs
```sql
SELECT id, nom, email FROM producteurs;
```

### Vérifier les utilisateurs
```sql
SELECT id, email, est_producteur FROM utilisateurs;
```

## ✅ Checklist de Vérification

- [ ] Le serveur démarre sans erreur
- [ ] Le message "✅ Base de données initialisée" apparaît
- [ ] Les routes API fonctionnent
- [ ] Les vues sont enregistrées dans `analytics_events`
- [ ] Les producteurs peuvent se connecter
- [ ] Les statistiques s'affichent dans le dashboard
- [ ] Les photos sont sauvegardées
- [ ] Les abonnements Stripe sont enregistrés

## 🆘 Problèmes Courants

### Erreur "database.db is locked"
- **Cause** : Plusieurs processus accèdent à la base
- **Solution** : Fermer les autres instances du serveur

### Erreur "no such table"
- **Cause** : Base de données non initialisée
- **Solution** : Redémarrer le serveur pour créer les tables

### Données non sauvegardées
- **Cause** : Problème de permissions
- **Solution** : Vérifier les permissions du fichier `database.db`



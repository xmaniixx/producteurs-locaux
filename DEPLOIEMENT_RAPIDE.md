# ⚡ Déploiement Rapide - Guide Étape par Étape

## 🎯 Option Recommandée : Railway (Tout-en-un)

Railway est la solution la plus simple pour déployer votre application complète.

### 📋 Étape 1 : Préparer le Code

1. **Assurez-vous que tout est commité sur GitHub** :
```bash
git add .
git commit -m "Préparation pour déploiement"
git push
```

### 📋 Étape 2 : Créer un Compte Railway

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur "Start a New Project"
3. Connectez-vous avec GitHub
4. Autorisez Railway à accéder à vos repositories

### 📋 Étape 3 : Déployer le Projet

1. Dans Railway, cliquez sur "New Project"
2. Sélectionnez "Deploy from GitHub repo"
3. Choisissez votre repository `app`
4. Railway va automatiquement détecter le projet

### 📋 Étape 4 : Configurer les Variables d'Environnement

Dans Railway, allez dans votre projet > "Variables" et ajoutez :

```env
NODE_ENV=production
PORT=3001
SESSION_SECRET=votre_cle_secrete_aleatoire_ici
VITE_GOOGLE_MAPS_API_KEY=votre_cle_google_maps
GOOGLE_MAPS_API_KEY=votre_cle_google_maps
FRONTEND_URL=https://votre-domaine.railway.app
```

**Pour générer un SESSION_SECRET sécurisé :**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 📋 Étape 5 : Ajouter une Base de Données PostgreSQL

1. Dans Railway, cliquez sur "New" > "Database" > "PostgreSQL"
2. Railway créera automatiquement la variable `DATABASE_URL`
3. **Note** : Vous devrez modifier le code pour utiliser PostgreSQL (voir section suivante)

### 📋 Étape 6 : Configurer le Domaine

1. Dans Railway, allez dans "Settings" > "Domains"
2. Cliquez sur "Generate Domain" pour obtenir une URL publique
3. Ou ajoutez votre propre domaine personnalisé

### 📋 Étape 7 : Déployer

Railway déploiera automatiquement. Attendez quelques minutes.

### 📋 Étape 8 : Tester

1. Ouvrez l'URL fournie par Railway
2. Testez l'application
3. Vérifiez les logs dans Railway si nécessaire

---

## 🔄 Alternative : Vercel (Frontend) + Railway (Backend)

Si vous préférez séparer frontend et backend :

### Backend sur Railway

Suivez les étapes 1-8 ci-dessus, mais configurez seulement le backend.

### Frontend sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Importez votre repository GitHub
3. Configurez :
   - **Root Directory** : `client`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
4. Variables d'environnement :
   ```
   VITE_GOOGLE_MAPS_API_KEY=votre_cle
   VITE_API_URL=https://votre-backend.railway.app
   ```
5. Déployez !

---

## ⚠️ Important : Migration PostgreSQL

Railway utilise PostgreSQL, pas SQLite. Vous devrez :

1. **Option A** : Modifier `server/database.js` pour utiliser PostgreSQL
2. **Option B** : Utiliser SQLite en production (non recommandé mais possible)

Pour l'option A, contactez-moi et je vous aiderai à migrer.

---

## ✅ Checklist Finale

- [ ] Code commité sur GitHub
- [ ] Compte Railway créé
- [ ] Projet déployé sur Railway
- [ ] Variables d'environnement configurées
- [ ] Base de données PostgreSQL ajoutée
- [ ] Domaine configuré
- [ ] Application testée
- [ ] Clés API Google Maps restreintes à votre domaine

---

## 🎉 C'est Fait !

Votre application est maintenant publique et accessible sur Internet !

**URL de production** : `https://votre-projet.railway.app`



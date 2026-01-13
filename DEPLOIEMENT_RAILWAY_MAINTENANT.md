# 🚀 Déployer sur Railway - Maintenant !

## ✅ Votre code est sur GitHub !

Votre repository `producteurs-locaux` est prêt. Passons au déploiement sur Railway.

---

## 📋 Étapes à Suivre

### Étape 1 : Aller sur Railway

1. **Allez sur** : https://railway.app
2. **Connectez-vous** avec votre compte GitHub (si ce n'est pas déjà fait)

---

### Étape 2 : Créer un Nouveau Projet

1. **Cliquez sur le bouton "New Project"** (en haut à droite ou au centre de la page)

2. **Sélectionnez "Deploy from GitHub repo"** ou **"GitHub"**

---

### Étape 3 : Autoriser Railway (si nécessaire)

Si c'est la première fois :
1. Railway vous demandera d'autoriser l'accès à GitHub
2. **Cliquez sur "Configure GitHub App"** ou **"Authorize Railway"**
3. **Autorisez Railway** à accéder à vos repositories
4. Vous pouvez autoriser **tous les repositories** ou seulement `producteurs-locaux`

---

### Étape 4 : Sélectionner votre Repository

1. **Cherchez `producteurs-locaux`** dans la liste des repositories
2. **Cliquez dessus**

Railway va automatiquement :
- Détecter que c'est un projet Node.js
- Commencer le déploiement
- Installer les dépendances
- Builder l'application
- La démarrer

---

### Étape 5 : Attendre le Déploiement

Vous verrez un écran avec des logs qui défilent :
- ✅ "Installing dependencies..."
- ✅ "Building application..."
- ✅ "Deploying..."

⏱️ **Le premier déploiement prend 5-10 minutes.** Soyez patient !

---

### Étape 6 : Obtenir l'URL Publique

Une fois le déploiement terminé :

1. **Railway vous donnera une URL** comme :
   - `https://producteurs-locaux-production.up.railway.app`
   - ou `https://votre-projet.railway.app`

2. **Cliquez sur cette URL** ou sur le bouton "View" pour voir votre application

---

## ⚙️ Configuration des Variables d'Environnement

Railway va probablement vous demander de configurer des variables d'environnement.

### Variables à Ajouter :

1. **Dans Railway, allez dans votre projet** → **Variables**

2. **Ajoutez ces variables** :

```
NODE_ENV=production
PORT=3001
SESSION_SECRET=votre_secret_session_aleatoire_ici
VITE_GOOGLE_MAPS_API_KEY=votre_cle_api_google_maps
```

**Pour `SESSION_SECRET`** : Générez un secret aléatoire (ex: `openssl rand -hex 32`)

**Pour `VITE_GOOGLE_MAPS_API_KEY`** : Utilisez votre clé API Google Maps

---

## 🔧 Si Railway ne Détecte pas Automatiquement

Si Railway vous demande de configurer manuellement :

1. **Root Directory** : Laissez vide (ou `/`)

2. **Build Command** : 
   ```
   npm install && cd client && npm install && npm run build
   ```

3. **Start Command** :
   ```
   node server/index.js
   ```

**Note** : Vous avez déjà un fichier `railway.json` qui devrait être détecté automatiquement.

---

## 🆘 Problèmes Courants

### ❌ "No repositories found"

**Solution :**
- Vérifiez que vous avez autorisé Railway à accéder à GitHub
- Cliquez sur "Configure GitHub App" et autorisez les repositories

### ❌ Erreur de build

**Solution :**
- Regardez les logs dans Railway
- Vérifiez que toutes les variables d'environnement sont configurées

### ❌ L'application ne démarre pas

**Solution :**
- Vérifiez les logs dans Railway
- Assurez-vous que le port est configuré (Railway utilise `PORT` automatiquement)
- Vérifiez que `server/index.js` existe

---

## ✅ Vérification

Une fois déployé :

1. **Testez l'URL** que Railway vous a donnée
2. **Vérifiez que l'application fonctionne**
3. **Testez la connexion** et les fonctionnalités principales

---

## 🎯 Action Immédiate

1. **Allez sur** : https://railway.app
2. **Cliquez sur "New Project"**
3. **Sélectionnez "Deploy from GitHub repo"**
4. **Choisissez `producteurs-locaux`**
5. **Attendez que ça se déploie !**

---

**Dites-moi ce que vous voyez sur Railway et je vous aiderai pour la suite ! 🚀**


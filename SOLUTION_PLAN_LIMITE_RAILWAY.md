# 🚨 Solution : Plan Limité sur Railway

## ❌ Problème

Railway affiche : **"Limited Access - Your account is on a limited plan and can only deploy databases"**

Cela signifie que votre plan Railway gratuit ne permet que les bases de données, pas les applications web.

---

## ✅ Solutions

### Option 1 : Mettre à Niveau Railway (Payant)

1. **Cliquez sur "Upgrade your plan"** dans Railway
2. **Choisissez un plan** (à partir de ~5$/mois)
3. **Votre application pourra être déployée**

**Avantages :**
- ✅ Solution simple
- ✅ Railway est très performant
- ✅ Support excellent

**Inconvénients :**
- ❌ Coûte de l'argent

---

### Option 2 : Utiliser Render (Gratuit) ⭐ RECOMMANDÉ

Render offre un plan gratuit pour les applications web.

#### Étapes :

1. **Allez sur** : https://render.com
2. **Créez un compte** (gratuit)
3. **Connectez votre GitHub**
4. **Cliquez sur "New +"** → **"Web Service"**
5. **Sélectionnez votre repository** `producteurs-locaux`
6. **Configurez** :
   - **Name** : `producteurs-locaux`
   - **Environment** : `Node`
   - **Build Command** : `npm install && cd client && npm install && npm run build`
   - **Start Command** : `node server/index.js`
   - **Plan** : **Free** (gratuit)
7. **Ajoutez les variables d'environnement** :
   - `NODE_ENV=production`
   - `PORT=10000` (Render utilise le port 10000)
   - `SESSION_SECRET=votre_secret_aleatoire`
   - `VITE_GOOGLE_MAPS_API_KEY=votre_cle_google`
8. **Cliquez sur "Create Web Service"**

**Avantages :**
- ✅ Gratuit
- ✅ Facile à utiliser
- ✅ Supporte Node.js

**Inconvénients :**
- ⚠️ L'application se met en veille après 15 minutes d'inactivité (sur le plan gratuit)
- ⚠️ Le premier démarrage peut être lent

---

### Option 3 : Utiliser Fly.io (Gratuit avec Limites)

Fly.io offre un plan gratuit généreux.

#### Étapes :

1. **Allez sur** : https://fly.io
2. **Installez Fly CLI** :
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
3. **Créez un compte** : `fly auth signup`
4. **Déployez** :
   ```bash
   fly launch
   ```
5. **Suivez les instructions**

**Avantages :**
- ✅ Plan gratuit généreux
- ✅ Très performant
- ✅ Global CDN

**Inconvénients :**
- ⚠️ Nécessite la ligne de commande
- ⚠️ Configuration plus complexe

---

### Option 4 : Utiliser Vercel (Frontend) + Render (Backend)

Séparer le frontend et le backend.

#### Frontend sur Vercel :

1. **Allez sur** : https://vercel.com
2. **Importez votre repository GitHub**
3. **Configurez** :
   - **Framework Preset** : Vite
   - **Root Directory** : `client`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
4. **Ajoutez les variables d'environnement** :
   - `VITE_API_URL=https://votre-backend.render.com`
   - `VITE_GOOGLE_MAPS_API_KEY=votre_cle`

#### Backend sur Render :

1. **Déployez le backend sur Render** (voir Option 2)
2. **Utilisez l'URL du backend** dans les variables Vercel

**Avantages :**
- ✅ Frontend très rapide (Vercel)
- ✅ Backend gratuit (Render)
- ✅ Séparation claire

**Inconvénients :**
- ⚠️ Configuration plus complexe
- ⚠️ Nécessite de modifier les URLs API

---

## 🎯 Ma Recommandation

**Pour commencer rapidement et gratuitement :**

👉 **Utilisez Render (Option 2)** - C'est le plus simple et gratuit !

---

## 📋 Guide Détaillé pour Render

### Étape 1 : Créer un Compte

1. Allez sur : https://render.com
2. Cliquez sur "Get Started for Free"
3. Connectez-vous avec GitHub

### Étape 2 : Créer un Web Service

1. Cliquez sur "New +" → "Web Service"
2. Sélectionnez votre repository `producteurs-locaux`
3. Cliquez sur "Connect"

### Étape 3 : Configurer

**Remplissez le formulaire :**

- **Name** : `producteurs-locaux`
- **Environment** : `Node`
- **Region** : Choisissez le plus proche (ex: Frankfurt)
- **Branch** : `main`
- **Root Directory** : Laissez vide
- **Build Command** : 
  ```
  npm install && cd client && npm install && npm run build
  ```
- **Start Command** : 
  ```
  node server/index.js
  ```
- **Plan** : **Free**

### Étape 4 : Variables d'Environnement

Cliquez sur "Advanced" → "Add Environment Variable" et ajoutez :

```
NODE_ENV=production
PORT=10000
SESSION_SECRET=un_secret_aleatoire_ici_changez_moi
VITE_GOOGLE_MAPS_API_KEY=votre_cle_api_google_maps
```

**Pour générer un SESSION_SECRET** :
```bash
openssl rand -hex 32
```

### Étape 5 : Déployer

1. Cliquez sur "Create Web Service"
2. Attendez le déploiement (5-10 minutes)
3. Render vous donnera une URL : `https://producteurs-locaux.onrender.com`

---

## 🔧 Modifications Nécessaires pour Render

### Modifier le Port dans server/index.js

Render utilise le port défini par la variable d'environnement `PORT`. Vérifiez que votre code utilise :

```javascript
const PORT = process.env.PORT || 3001;
```

---

## ✅ Après le Déploiement

1. **Testez l'URL** que Render vous donne
2. **Vérifiez que tout fonctionne**
3. **Note** : Sur le plan gratuit, l'app se met en veille après 15 min d'inactivité
   - Le premier chargement après veille peut prendre 30-60 secondes

---

## 🆘 Problèmes Courants

### L'application ne démarre pas

- Vérifiez que `PORT=10000` est dans les variables d'environnement
- Vérifiez les logs dans Render

### Erreur de build

- Vérifiez que toutes les dépendances sont dans `package.json`
- Vérifiez les logs de build dans Render

---

**Je recommande Render pour commencer ! C'est gratuit et simple. 🚀**


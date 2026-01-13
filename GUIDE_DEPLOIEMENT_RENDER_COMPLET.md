# 🚀 Guide Complet de Déploiement sur Render

## 📋 Table des Matières
1. [Problèmes Identifiés et Corrigés](#problèmes-identifiés)
2. [Configuration Render](#configuration-render)
3. [Variables d'Environnement](#variables-denvironnement)
4. [Vérification Post-Déploiement](#vérification)
5. [Dépannage](#dépannage)

---

## 🔧 Problèmes Identifiés et Corrigés

### ✅ Problème 1 : Page Blanche Après Connexion
**Cause** : Le composant `ProtectedRoute` retournait `null` quand l'utilisateur n'était pas authentifié, causant une page blanche.

**Solution** : Modifié pour toujours afficher un loader ou rediriger, jamais `null`.

### ✅ Problème 2 : Gestion d'Erreur JSON
**Cause** : Tentative de parser JSON même si la réponse HTTP n'était pas OK.

**Solution** : Ajout de vérification `response.ok` avant de parser JSON.

### ✅ Problème 3 : URLs en Dur
**Cause** : `config.js` utilisait `localhost:3001` même en production.

**Solution** : Utilisation d'URLs relatives (`''`) en production puisque frontend et backend sont sur le même domaine.

---

## ⚙️ Configuration Render

### Étape 1 : Créer un Nouveau Service Web

1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Cliquez sur **"New +"** > **"Web Service"**
3. Connectez votre dépôt GitHub
4. Sélectionnez le dépôt `producteurs-locaux`

### Étape 2 : Configuration du Service

**Nom du service** : `producteurs-locaux`

**Environnement** : `Node`

**Build Command** :
```bash
npm install && cd client && npm install --include=dev && npm run build
```

**Start Command** :
```bash
node server/index.js
```

**Root Directory** : (laissez vide - racine du projet)

---

## 🔐 Variables d'Environnement

### Variables OBLIGATOIRES

Ajoutez ces variables dans **"Environment"** de votre service Render :

#### 1. Configuration Serveur
```bash
NODE_ENV=production
PORT=10000
```

#### 2. Sécurité
```bash
SESSION_SECRET=votre_cle_secrete_aleatoire_ici
JWT_SECRET=votre_cle_secrete_jwt_aleatoire_ici
```
⚠️ **IMPORTANT** : 
- Remplacez `votre_cle_secrete_aleatoire_ici` par une chaîne aléatoire de 32+ caractères pour `SESSION_SECRET`
- Remplacez `votre_cle_secrete_jwt_aleatoire_ici` par une autre chaîne aléatoire de 32+ caractères pour `JWT_SECRET`
- Utilisez des valeurs **différentes** pour chaque variable

**Générer une clé secrète** :
```bash
# Sur Mac/Linux
openssl rand -base64 32

# Ou utilisez un générateur en ligne
# https://randomkeygen.com/
```

#### 3. Google Maps API
```bash
VITE_GOOGLE_MAPS_API_KEY=votre_cle_google_maps_ici
GOOGLE_MAPS_API_KEY=votre_cle_google_maps_ici
```
⚠️ Utilisez la **même clé** pour les deux variables.

#### 4. Frontend URL (Optionnel mais Recommandé)
```bash
FRONTEND_URL=https://producteurs-locaux.onrender.com
```

### Variables OPTIONNELLES (Stripe)

Si vous utilisez Stripe pour les paiements :

```bash
STRIPE_SECRET_KEY=sk_live_votre_cle_stripe
STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_stripe
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook
```

---

## 📝 Liste Complète des Variables

### Variables Backend (server/.env)
| Variable | Description | Exemple | Obligatoire |
|----------|-------------|---------|-------------|
| `NODE_ENV` | Environnement | `production` | ✅ Oui |
| `PORT` | Port du serveur | `10000` | ✅ Oui |
| `SESSION_SECRET` | Clé secrète pour les sessions | `ma_cle_32_caracteres` | ✅ Oui |
| `JWT_SECRET` | Clé secrète pour les tokens JWT | `ma_cle_jwt_32_caracteres` | ✅ Oui |
| `GOOGLE_MAPS_API_KEY` | Clé API Google Maps | `AIzaSy...` | ✅ Oui |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | `sk_live_...` | ❌ Non |
| `STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | `pk_live_...` | ❌ Non |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | `whsec_...` | ❌ Non |
| `FRONTEND_URL` | URL du frontend | `https://producteurs-locaux.onrender.com` | ⚠️ Recommandé |

### Variables Frontend (client/.env)
| Variable | Description | Exemple | Obligatoire |
|----------|-------------|---------|-------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Clé API Google Maps | `AIzaSy...` | ✅ Oui |

⚠️ **Note** : Les variables `VITE_*` doivent être définies dans Render pour être accessibles au build frontend.

---

## ✅ Vérification Post-Déploiement

### 1. Vérifier que le Build a Réussi
- Allez dans **"Logs"** de votre service Render
- Vérifiez qu'il n'y a pas d'erreurs
- Le build doit se terminer par : `✓ built in X.XXs`

### 2. Tester l'Application
1. Allez sur votre URL Render : `https://producteurs-locaux.onrender.com`
2. Vérifiez que la page de connexion s'affiche
3. Testez l'inscription d'un nouveau compte
4. Testez la connexion
5. Vérifiez que vous êtes bien redirigé vers la page d'accueil (pas de page blanche)

### 3. Vérifier les Routes
- `/connexion` → Page de connexion
- `/` → Page d'accueil (doit rediriger vers `/connexion` si non connecté)
- `/mon-compte` → Page compte utilisateur (doit rediriger si non connecté)

### 4. Vérifier la Console du Navigateur
1. Ouvrez la Console (F12)
2. Vérifiez qu'il n'y a pas d'erreurs en rouge
3. Vérifiez que les fichiers JS/CSS se chargent (onglet Network)

---

## 🐛 Dépannage

### Problème : Page Blanche Après Connexion

**Symptômes** :
- La connexion semble réussir
- Redirection vers une page blanche
- Pas d'erreurs dans la console

**Solutions** :

1. **Vérifier les Variables d'Environnement**
   ```bash
   # Dans Render Dashboard > Environment
   # Vérifiez que SESSION_SECRET est bien défini
   ```

2. **Vérifier les Logs Render**
   - Allez dans **"Logs"** de votre service
   - Cherchez les erreurs liées à l'authentification
   - Vérifiez que le serveur démarre correctement

3. **Vérifier le localStorage**
   - Ouvrez la Console (F12)
   - Tapez : `localStorage.getItem('token')`
   - Si un token existe, supprimez-le : `localStorage.clear()`
   - Rechargez la page

4. **Vérifier les Cookies**
   - Ouvrez la Console (F12) > Onglet Application > Cookies
   - Vérifiez qu'un cookie `sessionId` existe
   - Si non, vérifiez `SESSION_SECRET` dans Render

### Problème : Erreur CORS

**Symptômes** :
- `Error: Not allowed by CORS`
- Les requêtes API échouent

**Solution** :
- Vérifiez que `FRONTEND_URL` est bien défini dans Render
- Vérifiez que l'URL correspond à votre domaine Render

### Problème : Erreur 401 (Non Autorisé)

**Symptômes** :
- Redirection vers `/connexion` même après connexion
- Erreur 401 dans la console

**Solutions** :

1. **Vérifier SESSION_SECRET**
   ```bash
   # Dans Render Dashboard > Environment
   # SESSION_SECRET doit être défini et non vide
   ```

2. **Vérifier les Cookies**
   - Les cookies doivent être `httpOnly: true` et `sameSite: 'lax'`
   - Vérifiez dans la Console > Application > Cookies

3. **Vérifier le Token JWT**
   - Ouvrez la Console
   - Tapez : `localStorage.getItem('token')`
   - Si le token existe, l'authentification devrait fonctionner

### Problème : Build Échoue

**Symptômes** :
- Le build échoue avec `vite: not found`
- Erreur `Cannot find package 'vite'`

**Solution** :
- Vérifiez que le build command inclut `--include=dev` :
  ```bash
  npm install && cd client && npm install --include=dev && npm run build
  ```

### Problème : Fichiers Statiques Non Servis

**Symptômes** :
- Erreur 404 pour les fichiers JS/CSS
- Page blanche sans erreurs

**Solution** :
- Vérifiez que le build produit bien des fichiers dans `client/dist`
- Vérifiez les logs Render pour voir si `dist` existe

---

## 📚 Fichiers de Configuration

### render.yaml (Déjà Créé)
Le fichier `render.yaml` est déjà configuré dans votre projet. Vous pouvez l'utiliser pour déployer automatiquement, ou configurer manuellement dans le Dashboard Render.

### Structure du Projet
```
app/
├── client/          # Frontend React
│   ├── src/
│   ├── dist/        # Build de production (généré)
│   └── package.json
├── server/          # Backend Node.js
│   ├── index.js     # Serveur principal
│   ├── routes/      # Routes API
│   └── .env         # Variables d'environnement (local uniquement)
├── render.yaml      # Configuration Render
└── package.json
```

---

## 🎯 Checklist de Déploiement

- [ ] Service créé sur Render
- [ ] Dépôt GitHub connecté
- [ ] Build Command configuré
- [ ] Start Command configuré
- [ ] Variables d'environnement ajoutées :
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] `SESSION_SECRET` (généré)
  - [ ] `VITE_GOOGLE_MAPS_API_KEY`
  - [ ] `GOOGLE_MAPS_API_KEY`
  - [ ] `FRONTEND_URL` (optionnel)
- [ ] Build réussi
- [ ] Application accessible
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Pas de page blanche après connexion
- [ ] Routes protégées fonctionnent

---

## 🔄 Mise à Jour du Code

Après avoir corrigé les problèmes, poussez les changements :

```bash
git add .
git commit -m "Fix: Corriger page blanche après connexion et configuration Render"
git push origin main
```

Render redéploiera automatiquement.

---

## 📞 Support

Si vous rencontrez toujours des problèmes :

1. Vérifiez les **Logs Render** pour les erreurs serveur
2. Vérifiez la **Console du Navigateur** (F12) pour les erreurs client
3. Vérifiez que toutes les **variables d'environnement** sont bien définies
4. Vérifiez que le **build** s'est bien terminé

---

## ✅ Résumé des Corrections Apportées

1. ✅ **App.jsx** : `ProtectedRoute` ne retourne plus `null`, affiche toujours un loader
2. ✅ **App.jsx** : Gestion d'erreur améliorée avec vérification `response.ok`
3. ✅ **config.js** : Utilisation d'URLs relatives en production
4. ✅ **Guide complet** : Documentation détaillée pour Render

Votre application devrait maintenant fonctionner correctement sur Render ! 🎉


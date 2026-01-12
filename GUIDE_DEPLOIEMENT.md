# 🚀 Guide de Déploiement en Production

Ce guide vous explique comment rendre votre application publique et accessible sur Internet.

## 📋 Prérequis

- ✅ Compte GitHub (pour héberger le code)
- ✅ Compte sur une plateforme de déploiement (Vercel, Railway, Render, etc.)
- ✅ Clé API Google Maps configurée
- ✅ Clés Stripe (si vous utilisez les paiements)

## 🎯 Options de Déploiement

### Option 1 : Vercel (Recommandé pour le Frontend) + Railway (Backend)

**Avantages :**
- ✅ Gratuit pour commencer
- ✅ Déploiement automatique depuis GitHub
- ✅ HTTPS automatique
- ✅ CDN global pour le frontend

### Option 2 : Railway (Full Stack)

**Avantages :**
- ✅ Simple à utiliser
- ✅ Base de données PostgreSQL incluse
- ✅ Déploiement automatique
- ✅ $5/mois pour commencer

### Option 3 : Render (Full Stack)

**Avantages :**
- ✅ Plan gratuit disponible
- ✅ PostgreSQL gratuit
- ✅ Déploiement automatique

---

## 🚀 Déploiement avec Railway (Recommandé - Full Stack)

### Étape 1 : Préparer le code

1. **Créer un fichier `railway.json`** (déjà créé dans le projet)
2. **Créer un fichier `Procfile`** pour Railway
3. **Modifier les variables d'environnement** pour la production

### Étape 2 : Créer un compte Railway

1. Allez sur [railway.app](https://railway.app)
2. Créez un compte avec GitHub
3. Cliquez sur "New Project"
4. Sélectionnez "Deploy from GitHub repo"
5. Choisissez votre repository

### Étape 3 : Configurer les variables d'environnement

Dans Railway, allez dans "Variables" et ajoutez :

```
NODE_ENV=production
PORT=3001
SESSION_SECRET=votre_cle_secrete_aleatoire_longue
VITE_GOOGLE_MAPS_API_KEY=votre_cle_google_maps
GOOGLE_MAPS_API_KEY=votre_cle_google_maps
STRIPE_SECRET_KEY=votre_cle_stripe_secrete
STRIPE_PUBLISHABLE_KEY=votre_cle_stripe_publique
STRIPE_WEBHOOK_SECRET=votre_webhook_secret_stripe
```

### Étape 4 : Ajouter une base de données PostgreSQL

1. Dans Railway, cliquez sur "New" > "Database" > "PostgreSQL"
2. Railway créera automatiquement une variable `DATABASE_URL`
3. **Important** : Vous devrez migrer de SQLite vers PostgreSQL (voir section Migration)

### Étape 5 : Configurer le domaine

1. Dans Railway, allez dans "Settings" > "Domains"
2. Cliquez sur "Generate Domain" pour obtenir une URL publique
3. Ou ajoutez votre propre domaine personnalisé

### Étape 6 : Déployer

Railway déploiera automatiquement à chaque push sur GitHub.

---

## 🌐 Déploiement avec Vercel (Frontend) + Railway (Backend)

### Partie 1 : Déployer le Backend sur Railway

Suivez les étapes 1-5 ci-dessus pour déployer le backend.

### Partie 2 : Déployer le Frontend sur Vercel

1. **Créer un compte Vercel** : [vercel.com](https://vercel.com)
2. **Importer votre projet** depuis GitHub
3. **Configurer le projet** :
   - Root Directory : `client`
   - Build Command : `npm run build`
   - Output Directory : `dist`
   - Install Command : `npm install`

4. **Variables d'environnement** dans Vercel :
   ```
   VITE_GOOGLE_MAPS_API_KEY=votre_cle_google_maps
   VITE_API_URL=https://votre-backend.railway.app
   ```

5. **Modifier le code** pour utiliser l'URL du backend en production :
   - Créer un fichier `client/src/config.js` avec l'URL de l'API

---

## 🔧 Modifications Nécessaires pour la Production

### 1. CORS - Autoriser votre domaine

Modifier `server/index.js` :

```javascript
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL, 'https://votre-domaine.vercel.app']
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

### 2. Sessions - Activer HTTPS

Modifier `server/index.js` :

```javascript
cookie: { 
  secure: process.env.NODE_ENV === 'production', // true en production
  sameSite: 'none',
  maxAge: 30 * 24 * 60 * 60 * 1000
}
```

### 3. Variables d'environnement

Créer un fichier `.env.production` avec toutes les variables nécessaires.

---

## 🗄️ Migration vers PostgreSQL (Recommandé pour la Production)

SQLite est parfait pour le développement, mais PostgreSQL est recommandé pour la production.

### Option A : Utiliser Railway PostgreSQL

Railway fournit PostgreSQL automatiquement. Il suffit de :
1. Ajouter une base PostgreSQL dans Railway
2. Railway créera automatiquement `DATABASE_URL`
3. Modifier `server/database.js` pour utiliser PostgreSQL au lieu de SQLite

### Option B : Utiliser Supabase (Gratuit)

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Récupérez la connection string
4. Utilisez-la comme `DATABASE_URL`

---

## 📝 Checklist de Déploiement

Avant de rendre l'application publique :

- [ ] Variables d'environnement configurées
- [ ] CORS configuré pour votre domaine
- [ ] HTTPS activé (automatique sur Vercel/Railway)
- [ ] Sessions sécurisées (secure: true)
- [ ] Base de données migrée vers PostgreSQL (optionnel mais recommandé)
- [ ] Clés API Google Maps restreintes à votre domaine
- [ ] Clés Stripe configurées (si vous utilisez les paiements)
- [ ] Tests effectués en production
- [ ] Backup de la base de données configuré

---

## 🔒 Sécurité en Production

### 1. Clés API Google Maps

Dans Google Cloud Console :
- Restreignez votre clé API à votre domaine de production
- Limitez aux APIs nécessaires (Maps, Places, Geocoding)

### 2. Session Secret

Utilisez une clé secrète longue et aléatoire :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Variables d'environnement

Ne jamais commiter les fichiers `.env` dans Git !

---

## 🐛 Dépannage

### Erreur CORS

Vérifiez que l'URL du frontend est dans la liste des origines autorisées.

### Erreur de session

Vérifiez que `secure: true` est activé et que vous utilisez HTTPS.

### Base de données non accessible

Vérifiez la variable `DATABASE_URL` et les permissions.

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Railway/Vercel
2. Vérifiez les variables d'environnement
3. Testez localement avec les mêmes variables

---

## 🎉 Une fois déployé

Votre application sera accessible publiquement sur :
- Frontend : `https://votre-app.vercel.app` (ou votre domaine)
- Backend : `https://votre-backend.railway.app`

Félicitations ! 🎊


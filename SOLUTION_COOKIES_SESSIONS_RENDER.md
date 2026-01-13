# 🔧 Solution : Cookies et Sessions Non Transmis sur Render

## 🔍 Problème Identifié

**Symptôme** : Les cookies et la session ne sont pas transmis du frontend au backend.
- Logs montrent : `Cookies reçus: undefined`
- Logs montrent : `Origin: undefined`
- Logs montrent : `Session utilisateurId: undefined`

**Cause** : Configuration CORS et cookies incorrecte pour un monorepo sur Render.

## ✅ Structure Actuelle

✅ **Monorepo** : Frontend et backend dans le même repo
✅ **Backend sert le frontend** : `server/index.js` sert `client/dist`
✅ **Un seul service Render** : Web Service (pas Static Site)
✅ **Même domaine** : Frontend et backend sur `https://producteurs-locaux.onrender.com`

## ✅ Corrections Appliquées

### 1. **Configuration CORS Améliorée** (`server/index.js`)

✅ Autorisation de toutes les requêtes du même domaine (Render)
✅ `credentials: true` pour autoriser les cookies
✅ `exposedHeaders: ['Set-Cookie']` pour exposer les headers de cookies
✅ Logs détaillés pour déboguer

```javascript
app.use(cors({
  origin: (origin, callback) => {
    // En production sur Render, frontend et backend sont sur le même domaine
    if (isProduction) {
      // Autoriser les requêtes sans origine (même domaine)
      if (!origin) {
        return callback(null, true);
      }
      // Autoriser toutes les origines Render
      if (origin.includes('onrender.com')) {
        return callback(null, true);
      }
      callback(null, true); // Autoriser par défaut
    } else {
      callback(null, true); // Développement
    }
  },
  credentials: true, // CRITIQUE
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));
```

### 2. **Configuration des Cookies** (`server/index.js`)

✅ `path: '/'` pour que le cookie soit disponible sur toutes les routes
✅ `domain: undefined` (non spécifié) pour le même domaine
✅ `sameSite: 'lax'` (correct pour le même domaine)
✅ `secure: true` en production (HTTPS)

```javascript
cookie: { 
  secure: isProduction,
  sameSite: 'lax',
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/' // CRITIQUE : disponible sur toutes les routes
}
```

### 3. **Middleware de Débogage** (`server/index.js`)

✅ Logs détaillés pour TOUTES les requêtes :
- Method et path
- Session ID
- UtilisateurId dans la session
- Cookies reçus
- Origin
- Referer
- Host

## 🔍 Vérifications à Faire

### 1. **Variables d'Environnement sur Render**

Vérifiez que ces variables sont bien définies :
```bash
SESSION_SECRET=votre_cle_secrete_aleatoire
JWT_SECRET=votre_cle_jwt_aleatoire
NODE_ENV=production
PORT=10000
```

⚠️ **NE PAS définir** `FRONTEND_URL` car frontend et backend sont sur le même domaine.

### 2. **Build Command sur Render**

Vérifiez que le Build Command est :
```bash
npm install && cd client && npm install --include=dev && npm run build
```

### 3. **Start Command sur Render**

Vérifiez que le Start Command est :
```bash
node server/index.js
```

### 4. **Type de Service sur Render**

Vérifiez que c'est un **Web Service** (pas Static Site).

## 📋 Logs à Observer

### ✅ Après Connexion (Route `/api/utilisateur/connexion`)

```
🔍 [REQUEST DEBUG] {
  method: 'POST',
  path: '/api/utilisateur/connexion',
  sessionID: 'abc123...',
  cookies: 'sessionId=abc123...',
  origin: 'https://producteurs-locaux.onrender.com'
}
✅ Session créée pour utilisateur ID: 123
🔍 [connexion] Session ID: abc123...
✅ [connexion] Session sauvegardée avec succès
```

### ✅ Lors de l'Appel statut-producteur

```
🔍 [REQUEST DEBUG] {
  method: 'GET',
  path: '/api/utilisateur/statut-producteur',
  sessionID: 'abc123...',
  utilisateurId: 123,
  cookies: 'sessionId=abc123...',
  origin: 'https://producteurs-locaux.onrender.com'
}
🔍 [statut-producteur] Session ID: abc123...
🔍 [statut-producteur] Session utilisateurId: 123
✅ [statut-producteur] Utilisateur ID trouvé: 123
```

### ❌ Si Problème Persiste

Si vous voyez toujours :
```
🔍 [REQUEST DEBUG] {
  cookies: 'AUCUN COOKIE',
  origin: 'AUCUNE ORIGINE'
}
```

**Causes possibles** :
1. Les requêtes fetch n'incluent pas `credentials: 'include'`
2. Le cookie n'est pas créé lors de la connexion
3. Le navigateur bloque les cookies (vérifier les paramètres)

## 🐛 Dépannage

### Problème : Cookies toujours undefined

**Solution** :
1. Vérifiez que toutes les requêtes fetch incluent `credentials: 'include'`
2. Vérifiez les cookies dans le navigateur (F12 > Application > Cookies)
3. Vérifiez que le cookie `sessionId` existe et a les bonnes propriétés

### Problème : Origin undefined

**Cause** : Requête du même domaine (normal).

**Solution** : C'est normal si `origin` est undefined pour les requêtes du même domaine. Les cookies fonctionnent quand même.

### Problème : Session ID différent entre requêtes

**Cause** : La session n'est pas correctement sauvegardée.

**Solution** :
1. Vérifiez que `SESSION_SECRET` est bien défini
2. Vérifiez les logs de connexion pour voir si `req.session.save()` réussit
3. Vérifiez que le cookie est bien créé dans le navigateur

## 📝 Checklist

- [ ] Variables d'environnement configurées sur Render
- [ ] `SESSION_SECRET` défini et non vide
- [ ] `JWT_SECRET` défini et non vide
- [ ] `FRONTEND_URL` **NON défini** (même domaine)
- [ ] Build Command correct
- [ ] Start Command correct
- [ ] Service Render est un **Web Service** (pas Static Site)
- [ ] Toutes les requêtes fetch incluent `credentials: 'include'`
- [ ] Cookie `sessionId` présent dans le navigateur
- [ ] Logs serveur vérifiés après connexion
- [ ] Logs serveur vérifiés lors de l'appel statut-producteur

## 🚀 Prochaines Étapes

1. **Pousser les changements** vers GitHub
2. **Attendre le redéploiement** sur Render
3. **Tester la connexion** et observer les logs
4. **Vérifier les cookies** dans le navigateur
5. **Tester l'appel à statut-producteur** et observer les logs

---

## 📝 Notes Importantes

- Sur Render avec monorepo, frontend et backend sont sur le **même domaine**
- Les cookies fonctionnent automatiquement sur le même domaine
- `sameSite: 'lax'` est correct pour le même domaine
- `path: '/'` est **CRITIQUE** pour que le cookie soit disponible partout
- Les logs détaillés vous diront exactement où le problème se situe

Les corrections devraient résoudre le problème ! 🎯


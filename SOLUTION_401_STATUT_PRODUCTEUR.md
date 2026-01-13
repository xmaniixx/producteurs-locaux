# 🔧 Solution : Erreur 401 sur /api/utilisateur/statut-producteur

## 🔍 Problème Identifié

**Symptôme** : Erreur 401 sur l'endpoint `/api/utilisateur/statut-producteur` après connexion, alors que l'utilisateur est bien connecté côté frontend.

**Cause** : Problème de cookies/session entre frontend et backend sur Render. La session n'est pas correctement transmise ou reçue.

## ✅ Corrections Appliquées

### 1. **Configuration des Cookies de Session** (`server/index.js`)

✅ Ajout de `domain: undefined` pour que le cookie fonctionne sur le même domaine
✅ Configuration `sameSite: 'lax'` (correct pour Render où frontend et backend sont sur le même domaine)
✅ Configuration `secure: true` en production (HTTPS requis)

### 2. **Middleware de Débogage** (`server/index.js`)

✅ Ajout d'un middleware de débogage pour tracer les sessions :
```javascript
if (process.env.DEBUG_SESSION === 'true' || !isProduction) {
  app.use((req, res, next) => {
    console.log('🔍 [SESSION DEBUG]', {
      sessionID: req.sessionID,
      utilisateurId: req.session?.utilisateurId,
      cookies: req.headers.cookie,
      origin: req.headers.origin
    });
    next();
  });
}
```

### 3. **Logs dans la Route de Connexion** (`server/routes/utilisateurs.js`)

✅ Ajout de logs pour vérifier que la session est bien créée :
```javascript
console.log('✅ Session créée pour utilisateur ID:', utilisateur.id);
console.log('🔍 [connexion] Session ID:', req.sessionID);
console.log('🔍 [connexion] Session sauvegardée:', {...});

// Sauvegarder explicitement la session
req.session.save((err) => {
  if (err) {
    console.error('❌ [connexion] Erreur sauvegarde session:', err);
  } else {
    console.log('✅ [connexion] Session sauvegardée avec succès');
  }
});
```

### 4. **Logs dans la Route statut-producteur** (`server/routes/utilisateurs.js`)

✅ Ajout de logs détaillés pour déboguer :
```javascript
console.log('🔍 [statut-producteur] Session ID:', req.sessionID);
console.log('🔍 [statut-producteur] Session utilisateurId:', req.session?.utilisateurId);
console.log('🔍 [statut-producteur] Cookies reçus:', req.headers.cookie);
console.log('🔍 [statut-producteur] Origin:', req.headers.origin);
```

## 🔍 Vérifications à Faire

### 1. **Variables d'Environnement sur Render**

Vérifiez que ces variables sont bien définies :
```bash
SESSION_SECRET=votre_cle_secrete_aleatoire
JWT_SECRET=votre_cle_jwt_aleatoire
NODE_ENV=production
DEBUG_SESSION=true  # Optionnel : pour activer les logs de débogage
```

### 2. **Logs Serveur**

Après connexion, vérifiez les logs Render pour voir :
```
✅ Session créée pour utilisateur ID: 123
🔍 [connexion] Session ID: abc123...
🔍 [connexion] Session sauvegardée avec succès
```

Lors de l'appel à `/api/utilisateur/statut-producteur`, vérifiez :
```
🔍 [statut-producteur] Session ID: abc123...
🔍 [statut-producteur] Session utilisateurId: 123
🔍 [statut-producteur] Cookies reçus: sessionId=abc123...
```

### 3. **Cookies dans le Navigateur**

1. Ouvrez la Console (F12)
2. Allez dans **Application** > **Cookies** > `https://producteurs-locaux.onrender.com`
3. Vérifiez qu'un cookie `sessionId` existe
4. Vérifiez que :
   - **Secure** : ✅ (coché en production)
   - **HttpOnly** : ✅ (coché)
   - **SameSite** : `Lax`

## 🐛 Dépannage

### Problème : Session ID différent entre connexion et statut-producteur

**Cause** : Les cookies ne sont pas correctement transmis.

**Solution** :
1. Vérifiez que `credentials: 'include'` est présent dans toutes les requêtes fetch
2. Vérifiez que CORS autorise les credentials
3. Vérifiez que le cookie `sessionId` est bien présent dans le navigateur

### Problème : Session ID existe mais utilisateurId est undefined

**Cause** : La session n'est pas correctement sauvegardée lors de la connexion.

**Solution** :
1. Vérifiez les logs de connexion pour voir si `req.session.save()` réussit
2. Vérifiez que `SESSION_SECRET` est bien défini sur Render
3. Vérifiez que le store de session fonctionne (MemoryStore en développement, devrait être Redis en production)

### Problème : Cookies non envoyés

**Cause** : Configuration CORS ou cookies incorrecte.

**Solution** :
1. Vérifiez que `credentials: true` est dans la configuration CORS
2. Vérifiez que `credentials: 'include'` est dans toutes les requêtes fetch
3. Vérifiez que `sameSite` est correctement configuré

## 📋 Checklist

- [ ] Variables d'environnement configurées sur Render
- [ ] `SESSION_SECRET` défini et non vide
- [ ] `JWT_SECRET` défini et non vide
- [ ] Cookie `sessionId` présent dans le navigateur
- [ ] Toutes les requêtes fetch incluent `credentials: 'include'`
- [ ] CORS configuré avec `credentials: true`
- [ ] Logs serveur vérifiés après connexion
- [ ] Logs serveur vérifiés lors de l'appel statut-producteur

## 🚀 Prochaines Étapes

1. **Pousser les changements** vers GitHub
2. **Attendre le redéploiement** sur Render
3. **Tester la connexion** et observer les logs
4. **Tester l'appel à statut-producteur** et observer les logs
5. **Vérifier les cookies** dans le navigateur

---

## 📝 Notes Importantes

- Sur Render, frontend et backend sont sur le **même domaine**, donc `sameSite: 'lax'` est correct
- Le cookie doit être `secure: true` en production (HTTPS requis)
- Le cookie doit être `httpOnly: true` pour la sécurité
- `domain: undefined` permet au cookie de fonctionner sur le même domaine

Les logs vous diront exactement où le problème se situe ! 🎯


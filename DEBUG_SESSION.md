# 🔍 Déboguer le Problème de Session

## ❌ Problème

Vous êtes redirigé vers la page de connexion après avoir essayé de vous connecter.

---

## 🔍 Vérifications à Faire

### 1. Vérifier que SESSION_SECRET est Configuré dans Render

1. **Allez dans Render** → Votre service → **Environment**
2. **Vérifiez que `SESSION_SECRET` existe** et a une valeur
3. **Si elle n'existe pas, ajoutez-la** :
   - **Key** : `SESSION_SECRET`
   - **Value** : (générez avec `openssl rand -hex 32`)

---

### 2. Vérifier les Cookies dans le Navigateur

1. **Ouvrez votre site** : https://producteurs-locaux.onrender.com
2. **Ouvrez la Console du Navigateur** (F12)
3. **Allez dans l'onglet "Application"** (Chrome) ou **"Storage"** (Firefox)
4. **Cliquez sur "Cookies"** → `https://producteurs-locaux.onrender.com`
5. **Vérifiez si vous voyez un cookie nommé `sessionId`** après la connexion
6. **Si le cookie n'existe pas**, les sessions ne fonctionnent pas

---

### 3. Vérifier les Logs Render

Dans les logs Render, vérifiez :
- Si `SESSION_SECRET` est utilisé (vous ne devriez PAS voir "changez_cette_cle_secrete")
- S'il y a des erreurs lors de la connexion

---

### 4. Test Direct de la Connexion

1. **Ouvrez la Console du Navigateur** (F12)
2. **Allez dans l'onglet "Network"**
3. **Essayez de vous connecter**
4. **Regardez la requête POST vers `/api/utilisateur/connexion`**
5. **Vérifiez la réponse** :
   - Si vous voyez `{ success: true, token: ... }`, la connexion fonctionne
   - Si vous voyez une erreur, notez le message

---

### 5. Test Direct de la Vérification

1. **Ouvrez la Console du Navigateur** (F12)
2. **Dans l'onglet "Console"**, exécutez :

```javascript
fetch('/api/utilisateur/verifier', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => console.log('Vérification:', data))
  .catch(err => console.error('Erreur:', err));
```

3. **Vérifiez la réponse** :
   - Si vous voyez `{ connected: true }`, la session fonctionne
   - Si vous voyez `{ connected: false }`, la session ne fonctionne pas

---

## ✅ Correction Appliquée

J'ai corrigé la configuration des cookies de session pour utiliser `sameSite: 'lax'` au lieu de `'none'` car le frontend et le backend sont sur le même domaine (producteurs-locaux.onrender.com).

---

## 📋 Checklist

- [ ] SESSION_SECRET configuré dans Render
- [ ] Cookie `sessionId` présent dans le navigateur après connexion
- [ ] Requête de connexion retourne `{ success: true }`
- [ ] Requête de vérification retourne `{ connected: true }`
- [ ] Variables d'environnement redéployées

---

**Vérifiez ces points et dites-moi ce que vous voyez ! 🔍**


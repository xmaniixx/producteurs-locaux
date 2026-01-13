# 🔧 Guide : Remplacer Tous les fetch() par fetchAPI

## ✅ Fichier API Wrapper Créé

Le fichier `client/src/api/api.js` a été créé avec une fonction `fetchAPI` qui garantit que `credentials: 'include'` est toujours inclus.

## 📋 Fichiers Déjà Corrigés

- ✅ `client/src/pages/HomePage.jsx` - Partiellement corrigé
- ✅ `client/src/pages/UserAuth.jsx` - Partiellement corrigé
- ✅ `client/src/App.jsx` - Corrigé
- ✅ `client/src/components/ProducteurCard.jsx` - Corrigé
- ✅ `client/src/components/UiLayer.jsx` - Corrigé
- ✅ `client/src/components/Header.jsx` - Corrigé
- ✅ `client/src/pages/UserAccount.jsx` - Partiellement corrigé
- ✅ `client/src/pages/ProducteurDashboard.jsx` - Partiellement corrigé

## 📝 Fichiers Restants à Corriger

Les fichiers suivants contiennent encore des `fetch()` qui doivent être remplacés :

1. `client/src/pages/HomePage.jsx` - 1 fetch() restant
2. `client/src/pages/UserAccount.jsx` - 1 fetch() restant
3. `client/src/pages/ProducteurDashboard.jsx` - 1 fetch() restant
4. `client/src/pages/EditFarmPage.jsx` - Plusieurs fetch()
5. `client/src/pages/BecomeProducer.jsx` - Plusieurs fetch()
6. `client/src/pages/UserFavorites.jsx` - Plusieurs fetch()
7. `client/src/pages/ForgotPassword.jsx` - Plusieurs fetch()
8. `client/src/pages/ProducteurModifier.jsx` - Plusieurs fetch()
9. `client/src/pages/Success.jsx` - Plusieurs fetch()
10. `client/src/components/SubscriptionManagement.jsx` - Plusieurs fetch()

## 🔧 Comment Remplacer

### Étape 1 : Importer fetchAPI

En haut du fichier, ajoutez :
```javascript
import { fetchAPI, get, post, put, del } from '../api/api';
```

### Étape 2 : Remplacer les fetch()

#### GET simple :
```javascript
// AVANT
const response = await fetch('/api/producteurs/tous');

// APRÈS
const response = await fetchAPI('/api/producteurs/tous');
// OU
const response = await get('/api/producteurs/tous');
```

#### POST avec body :
```javascript
// AVANT
const response = await fetch('/api/utilisateur/connexion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email, mot_de_passe })
});

// APRÈS
const response = await post('/api/utilisateur/connexion', {
  email,
  mot_de_passe
});
```

#### PUT avec body :
```javascript
// AVANT
const response = await fetch('/api/utilisateur/moi', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(data)
});

// APRÈS
const response = await put('/api/utilisateur/moi', data);
```

#### DELETE :
```javascript
// AVANT
const response = await fetch('/api/utilisateur/mon-compte', {
  method: 'DELETE',
  credentials: 'include'
});

// APRÈS
const response = await del('/api/utilisateur/mon-compte');
```

## ⚠️ Important

- **TOUS** les appels API doivent utiliser `fetchAPI` ou les helpers (`get`, `post`, `put`, `del`)
- **NE JAMAIS** utiliser `fetch()` directement
- `fetchAPI` garantit que `credentials: 'include'` est toujours inclus

## 🚀 Prochaines Étapes

1. Corriger tous les fichiers restants
2. Tester que tous les appels API fonctionnent
3. Vérifier que les cookies sont transmis dans les logs


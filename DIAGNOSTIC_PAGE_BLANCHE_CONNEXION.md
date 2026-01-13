# Diagnostic Page Blanche - Page de Connexion

## Problème
Page blanche sur `/connexion` sans erreurs dans la console.

## Modifications apportées
✅ Déplacé `verifierConnexion` à l'intérieur du `useEffect` pour éviter les problèmes de dépendances
✅ Ajouté `navigate` dans les dépendances du `useEffect`
✅ Supprimé les `console.log` qui pourraient masquer des erreurs

## À vérifier

### 1. Console du Navigateur
Ouvrez la Console du Navigateur (F12) et vérifiez :
- **Onglet Console** : Y a-t-il des erreurs en rouge ?
- **Onglet Network** : Les fichiers JS/CSS se chargent-ils correctement ?
- **Onglet Sources** : Le code source est-il accessible ?

### 2. Réseau
Dans l'onglet **Network** de la console :
- Vérifiez si `/api/utilisateur/verifier` est appelé
- Vérifiez le statut de la réponse (200, 401, 500, etc.)
- Vérifiez si les fichiers statiques (`index-*.js`, `index-*.css`) se chargent

### 3. LocalStorage
Dans la Console, tapez :
```javascript
localStorage.clear()
localStorage.getItem('token')
```
Si un token existe, supprimez-le et rechargez la page.

### 4. Test Direct
Essayez d'accéder directement à :
- `https://producteurs-locaux.onrender.com/connexion`
- `https://producteurs-locaux.onrender.com/` (doit rediriger vers `/connexion`)

### 5. Navigation Privée
Ouvrez une fenêtre de navigation privée (Cmd+Shift+N sur Mac) et testez :
- Allez sur `https://producteurs-locaux.onrender.com/connexion`
- Dites-moi si la page s'affiche

### 6. Vérification du Code
Dans la Console, tapez :
```javascript
document.getElementById('root')
```
Cela devrait retourner l'élément `<div id="root">`. Si c'est `null`, React ne se monte pas.

### 7. Vérification React
Dans la Console, tapez :
```javascript
window.React
```
Cela devrait retourner un objet. Si c'est `undefined`, React n'est pas chargé.

## Solutions possibles

### Solution 1 : Problème de build
Si les fichiers JS/CSS ne se chargent pas :
1. Vérifiez les logs Render pour voir si le build a réussi
2. Vérifiez que le build produit bien des fichiers dans `client/dist`

### Solution 2 : Problème de routing
Si React ne se monte pas :
1. Vérifiez que `index.html` contient bien `<div id="root"></div>`
2. Vérifiez que `main.jsx` monte bien l'application

### Solution 3 : Problème d'API
Si l'API `/api/utilisateur/verifier` bloque le rendu :
1. Le composant devrait toujours se rendre, même si l'API échoue
2. Vérifiez les logs Render pour voir les erreurs du serveur

### Solution 4 : Problème de service worker
Si le service worker cache une ancienne version :
1. Désactivez le service worker dans la Console :
   ```javascript
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(registration => registration.unregister());
   });
   ```
2. Rechargez la page

## Prochaines étapes
1. Vérifiez les points ci-dessus
2. Partagez les résultats avec moi
3. Je pourrai alors identifier et corriger le problème


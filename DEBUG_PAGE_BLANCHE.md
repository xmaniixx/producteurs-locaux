# 🔍 Déboguer la Page Blanche

## ❌ Problème

Page blanche - même la page de connexion ne s'affiche plus.

---

## 🔍 Vérifications à Faire

### 1. Vérifier la Console du Navigateur

1. **Ouvrez la Console du Navigateur** (F12)
2. **Regardez les erreurs** dans l'onglet "Console"
3. **Notez toutes les erreurs** que vous voyez (particulièrement les erreurs rouges)
4. **Dites-moi quelles erreurs vous voyez**

---

### 2. Vérifier l'Onglet Network

1. **Ouvrez la Console du Navigateur** (F12)
2. **Allez dans l'onglet "Network"**
3. **Rechargez la page** (F5 ou Cmd+R)
4. **Vérifiez si les fichiers JS/CSS se chargent** :
   - `index-B8g8Z_89.js` ou similaire
   - `index-uMmaLacZ.css` ou similaire
5. **Si certains fichiers ne se chargent pas** (erreur 404 ou 500), notez lesquels

---

### 3. Vérifier le localStorage

Dans la Console du Navigateur, exécutez :

```javascript
localStorage.getItem('token')
```

Si cela retourne `null`, c'est normal (pas de token).
Si cela retourne une erreur, il y a un problème.

---

### 4. Vider le Cache

1. **Ouvrez la Console du Navigateur** (F12)
2. **Clic droit sur le bouton de rechargement** (ou F5)
3. **Sélectionnez "Vider le cache et forcer le rechargement"** (ou "Hard Reload")
4. **Rechargez la page**

---

## 🆘 Solution Temporaire : Vider le localStorage

Si le problème persiste, videz le localStorage :

Dans la Console du Navigateur, exécutez :

```javascript
localStorage.clear()
```

Puis rechargez la page.

---

**Dites-moi quelles erreurs vous voyez dans la console du navigateur ! 🔍**

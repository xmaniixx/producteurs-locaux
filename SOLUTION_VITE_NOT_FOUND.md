# 🔧 Solution : Erreur "Cannot find package 'vite'"

## ❌ Problème

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite'
```

Le problème est que `vite` est dans les `devDependencies` et n'est pas installé lors du build sur Render.

---

## ✅ Solution : Modifier la Commande de Build dans Render

### Dans Render :

1. **Allez dans votre service** sur Render
2. **Cliquez sur "Settings"**
3. **Trouvez "Build Command"**
4. **Remplacez** :
   ```
   npm install && cd client && npm install && npm run build
   ```
   
   **Par** :
   ```
   npm install && cd client && npm install --include=dev && npm run build
   ```

   Le `--include=dev` force l'installation des devDependencies (où se trouve vite).

5. **Cliquez sur "Save Changes"**
6. **Render va automatiquement redéployer**

---

## ✅ Solution Alternative : Utiliser NODE_ENV

Si la première solution ne fonctionne pas :

1. **Dans Render, allez dans "Environment"**
2. **Ajoutez une variable d'environnement** :
   - **Key** : `NODE_ENV`
   - **Value** : `development` (temporairement, juste pour le build)

3. **Modifiez la Build Command** :
   ```
   NODE_ENV=development npm install && cd client && NODE_ENV=development npm install && npm run build
   ```

4. **Après le build, remettez** `NODE_ENV=production` dans les variables d'environnement

---

## ✅ Solution Alternative 2 : Déplacer vite dans dependencies

Si rien ne fonctionne, on peut déplacer vite dans dependencies (mais ce n'est pas idéal) :

1. **Modifiez `client/package.json`** :
   - Déplacez `vite` et `@vitejs/plugin-react` de `devDependencies` vers `dependencies`

2. **Commitez et poussez** :
   ```bash
   git add client/package.json
   git commit -m "Move vite to dependencies for Render build"
   git push origin main
   ```

---

## 🎯 Solution Recommandée

**Utilisez la Solution 1** : Modifier la Build Command dans Render pour inclure `--include=dev`.

C'est la solution la plus propre et la plus simple.

---

## 📝 Étapes Détaillées pour Render

1. **Connectez-vous sur Render** : https://render.com
2. **Sélectionnez votre service** `producteurs-locaux`
3. **Cliquez sur "Settings"** (dans le menu de gauche)
4. **Faites défiler jusqu'à "Build & Deploy"**
5. **Trouvez "Build Command"**
6. **Remplacez la commande par** :
   ```
   npm install && cd client && npm install --include=dev && npm run build
   ```
7. **Cliquez sur "Save Changes"** (en bas de la page)
8. **Render va automatiquement redéployer**

---

## ✅ Vérification

Après avoir modifié la commande, attendez le redéploiement (5-10 minutes).

Dans les logs, vous devriez voir :
```
✓ built in Xs
```

Au lieu de l'erreur `Cannot find package 'vite'`.

---

## 🆘 Si ça ne fonctionne toujours pas

### Vérifier que vite est bien dans package.json

```bash
cat client/package.json | grep vite
```

Vous devriez voir :
```json
"vite": "^5.0.8"
```

### Vérifier les logs complets

Dans Render, regardez les logs complets pour voir exactement où ça échoue.

---

**Modifiez la Build Command dans Render avec `--include=dev` et ça devrait fonctionner ! 🚀**


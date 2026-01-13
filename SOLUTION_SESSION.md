# 🔐 Solution : Problème de Session (Redirection vers Connexion)

## ❌ Problème

Après l'inscription ou la connexion, vous êtes redirigé vers la page de connexion au lieu de rester connecté.

---

## ✅ Solution : Configurer SESSION_SECRET dans Render

Le problème est que la variable d'environnement `SESSION_SECRET` n'est pas définie dans Render, donc les sessions ne fonctionnent pas correctement.

---

## 📋 Étapes pour Configurer

### 1. Générer un SESSION_SECRET

Sur votre Mac, ouvrez un terminal et exécutez :

```bash
openssl rand -hex 32
```

Cela générera un secret aléatoire (ex: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`)

---

### 2. Ajouter les Variables dans Render

1. **Allez sur Render** : https://render.com
2. **Sélectionnez votre service** `producteurs-locaux`
3. **Cliquez sur "Environment"** (dans le menu de gauche)
4. **Cliquez sur "Add Environment Variable"**
5. **Ajoutez ces variables** :

   **Variable 1 :**
   - **Key** : `NODE_ENV`
   - **Value** : `production`

   **Variable 2 :**
   - **Key** : `PORT`
   - **Value** : `10000`

   **Variable 3 :**
   - **Key** : `SESSION_SECRET`
   - **Value** : (collez le secret que vous avez généré à l'étape 1)

   **Variable 4 :**
   - **Key** : `VITE_GOOGLE_MAPS_API_KEY`
   - **Value** : `AIzaSyBdv8rn-Nn_2_LRCC8BG5G4ymbHU0Dvg7Y`

   **Variable 5 :**
   - **Key** : `GOOGLE_MAPS_API_KEY`
   - **Value** : `AIzaSyBdv8rn-Nn_2_LRCC8BG5G4ymbHU0Dvg7Y`

6. **Cliquez sur "Save Changes"**

---

### 3. Redéployer

Render va automatiquement redéployer votre application avec les nouvelles variables.

Attendez 5-10 minutes que le redéploiement se termine.

---

### 4. Tester la Connexion

1. **Allez sur** : https://producteurs-locaux.onrender.com
2. **Essayez de vous connecter** avec votre compte
3. **Vous devriez maintenant rester connecté** au lieu d'être redirigé vers la page de connexion

---

## 📧 Note sur l'Email de Confirmation

L'email de confirmation est **simulé** dans le code actuel (pas de service d'email réel configuré). Vous pouvez vous connecter directement après l'inscription, même sans confirmer l'email.

---

## ✅ Checklist

- [ ] SESSION_SECRET généré
- [ ] Variables d'environnement ajoutées dans Render
- [ ] Redéploiement terminé
- [ ] Connexion testée et fonctionnelle

---

**Après avoir configuré SESSION_SECRET, la connexion devrait fonctionner ! 🚀**


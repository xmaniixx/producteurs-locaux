# 🔍 Déboguer l'Erreur 401 lors de la Connexion

## ❌ Problème

Erreur 401 lors de la tentative de connexion.

---

## 🔍 Causes Possibles

1. **Email ou mot de passe incorrect**
2. **L'utilisateur n'existe pas dans la base de données**
3. **Problème avec le hashage du mot de passe**
4. **Problème avec la base de données**

---

## ✅ Vérifications

### 1. Vérifier les Logs Render

Après le redéploiement, dans les logs Render, vous devriez voir :
- `🔐 Tentative de connexion pour: votre_email@example.com`
- `👤 Utilisateur trouvé: Oui` ou `Non`
- `🔑 Mot de passe correct: Oui` ou `Non`
- `✅ Session créée pour utilisateur ID: X` (si la connexion réussit)

---

### 2. Vérifier que l'Email Existe

Si vous voyez `👤 Utilisateur trouvé: Non`, cela signifie que :
- L'email n'existe pas dans la base de données
- Vous avez peut-être créé le compte avec un autre email
- Le compte n'a pas été créé correctement

**Solution :** Créez un nouveau compte ou vérifiez l'email utilisé.

---

### 3. Vérifier le Mot de Passe

Si vous voyez `🔑 Mot de passe correct: Non`, cela signifie que :
- Le mot de passe est incorrect
- Il y a un problème avec le hashage du mot de passe

**Solution :** Vérifiez que vous utilisez le bon mot de passe.

---

### 4. Vérifier la Console du Navigateur

1. **Ouvrez la Console du Navigateur** (F12)
2. **Allez dans l'onglet "Network"**
3. **Essayez de vous connecter**
4. **Cliquez sur la requête POST vers `/api/utilisateur/connexion`**
5. **Regardez la réponse** :
   - Si vous voyez `{ error: "Email ou mot de passe incorrect" }`, c'est un problème d'authentification
   - Si vous voyez une autre erreur, notez le message

---

## 🆘 Solutions

### Si l'utilisateur n'existe pas

1. **Créez un nouveau compte** avec un email différent
2. **Ou vérifiez l'email** que vous avez utilisé lors de l'inscription

### Si le mot de passe est incorrect

1. **Vérifiez que vous utilisez le bon mot de passe**
2. **Essayez de réinitialiser le mot de passe** (si la fonctionnalité existe)

### Si la base de données est vide

La base de données sur Render est probablement différente de celle en local. Vous devez créer un nouveau compte sur le site en production.

---

## 📋 Checklist

- [ ] Logs Render vérifiés
- [ ] Email utilisé pour la connexion vérifié
- [ ] Mot de passe vérifié
- [ ] Nouveau compte créé si nécessaire

---

**Vérifiez les logs Render après le redéploiement et dites-moi ce que vous voyez ! 🔍**


# 🔐 Résoudre l'Erreur d'Authentification GitHub

## ❌ Problème

```
fatal: Authentication failed for 'https://github.com/xmaniixx/producteurs-locaux.git/'
```

GitHub ne permet plus d'utiliser votre mot de passe pour les push. Il faut utiliser un **Personal Access Token**.

---

## ✅ Solution : Créer un Personal Access Token

### Étape 1 : Créer le Token sur GitHub

1. **Allez sur GitHub** : https://github.com/settings/tokens
   - Ou : GitHub → Votre profil (en haut à droite) → **Settings** → **Developer settings** (en bas à gauche) → **Personal access tokens** → **Tokens (classic)**

2. **Cliquez sur "Generate new token"** → **"Generate new token (classic)"**

3. **Configurez le token** :
   - **Note** : Donnez-lui un nom (ex: "Railway Deployment" ou "Mon App")
   - **Expiration** : Choisissez une durée (90 jours, 1 an, ou "No expiration")
   - **Scopes** : Cochez au minimum :
     - ✅ **`repo`** (accès complet aux repositories)
     - ✅ **`workflow`** (si vous utilisez GitHub Actions)

4. **Cliquez sur "Generate token"** (en bas de la page)

5. **⚠️ IMPORTANT : COPIEZ LE TOKEN IMMÉDIATEMENT !**
   - Il ressemble à : `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Vous ne pourrez plus le voir après** si vous fermez la page
   - Gardez-le dans un endroit sûr (temporairement)

---

## ✅ Solution 1 : Utiliser le Token Directement (Recommandé)

### Option A : Utiliser le Token comme Mot de Passe

Quand Git vous demande vos identifiants :

```bash
git push -u origin main
```

**Quand il demande :**
- **Username** : `xmaniixx` (votre nom d'utilisateur GitHub)
- **Password** : Collez votre **Personal Access Token** (pas votre mot de passe GitHub !)

---

### Option B : Stocker le Token dans Git (Plus Pratique)

Pour éviter de retaper le token à chaque fois :

#### Sur macOS (avec Keychain) :

```bash
# Configurer Git pour utiliser le credential helper
git config --global credential.helper osxkeychain

# Essayer le push (il vous demandera le token une fois)
git push -u origin main
```

**Quand il demande :**
- **Username** : `xmaniixx`
- **Password** : Votre **Personal Access Token**

Le token sera sauvegardé dans le Keychain macOS et réutilisé automatiquement.

---

### Option C : Mettre le Token dans l'URL (Temporaire)

⚠️ **Attention** : Cette méthode expose le token dans l'historique Git. Utilisez-la seulement pour tester, puis changez-la.

```bash
# Remplacez YOUR_TOKEN par votre token
git remote set-url origin https://YOUR_TOKEN@github.com/xmaniixx/producteurs-locaux.git

# Puis poussez
git push -u origin main
```

**Après le push, changez l'URL pour enlever le token :**

```bash
git remote set-url origin https://github.com/xmaniixx/producteurs-locaux.git
git config --global credential.helper osxkeychain
```

---

## ✅ Solution 2 : Utiliser SSH (Alternative)

Si vous préférez utiliser SSH au lieu de HTTPS :

### 1. Générer une Clé SSH (si vous n'en avez pas)

```bash
ssh-keygen -t ed25519 -C "votre_email@example.com"
```

Appuyez sur Entrée pour accepter l'emplacement par défaut.

### 2. Ajouter la Clé à l'Agent SSH

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### 3. Copier la Clé Publique

```bash
cat ~/.ssh/id_ed25519.pub
```

Copiez tout le contenu affiché.

### 4. Ajouter la Clé sur GitHub

1. Allez sur : https://github.com/settings/keys
2. Cliquez sur **"New SSH key"**
3. **Title** : Donnez un nom (ex: "Mon MacBook")
4. **Key** : Collez la clé publique que vous venez de copier
5. Cliquez sur **"Add SSH key"**

### 5. Changer l'URL du Remote

```bash
git remote set-url origin git@github.com:xmaniixx/producteurs-locaux.git
```

### 6. Tester la Connexion

```bash
ssh -T git@github.com
```

Vous devriez voir : `Hi xmaniixx! You've successfully authenticated...`

### 7. Pousser le Code

```bash
git push -u origin main
```

---

## 🎯 Méthode Recommandée (La Plus Simple)

**Pour la plupart des utilisateurs, je recommande la Solution 1 - Option B** :

```bash
# 1. Configurer le credential helper
git config --global credential.helper osxkeychain

# 2. Essayer le push
git push -u origin main

# 3. Quand il demande :
#    Username: xmaniixx
#    Password: [collez votre Personal Access Token ici]
```

Le token sera sauvegardé et vous n'aurez plus besoin de le retaper.

---

## 🆘 Vérifications

### Vérifier que le Remote est Correct

```bash
git remote -v
```

Vous devriez voir :
```
origin  https://github.com/xmaniixx/producteurs-locaux.git (fetch)
origin  https://github.com/xmaniixx/producteurs-locaux.git (push)
```

### Vérifier la Configuration Git

```bash
git config --global --list
```

---

## ✅ Une Fois le Push Réussi

1. **Allez sur votre repository GitHub** : https://github.com/xmaniixx/producteurs-locaux
2. **Vérifiez que tous vos fichiers sont présents**
3. **Retournez sur Railway** : https://railway.app
4. **Cliquez sur "New Project"**
5. **Sélectionnez "Deploy from GitHub repo"**
6. **Vous devriez voir votre repository dans la liste !**

---

## 🔒 Sécurité

- **Ne partagez jamais votre Personal Access Token**
- **Ne le commitez pas dans votre code**
- **Si vous l'exposez accidentellement, révoquez-le immédiatement** sur GitHub
- **Utilisez des tokens avec des permissions minimales nécessaires**

---

**Essayez la Solution 1 - Option B, c'est la plus simple ! 🚀**


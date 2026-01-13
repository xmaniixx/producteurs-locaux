# 📦 Créer un Repository GitHub - Guide Étape par Étape

## 🎯 Objectif

Créer un repository GitHub et y pousser votre code pour pouvoir le déployer sur Railway.

---

## 📋 Étape 1 : Créer le Repository sur GitHub

### Sur le site GitHub :

1. **Allez sur [github.com](https://github.com)** et connectez-vous

2. **Cliquez sur le bouton "+"** en haut à droite
   - Ou allez directement sur : https://github.com/new

3. **Remplissez le formulaire** :
   - **Repository name** : `producteurs-locaux` (ou un autre nom)
   - **Description** (optionnel) : "Application pour trouver des producteurs locaux"
   - **Visibilité** : 
     - ✅ **Public** (recommandé pour commencer - gratuit)
     - ⚠️ **Private** (si vous voulez garder le code privé)
   - **NE COCHEZ PAS** :
     - ❌ "Add a README file" (vous avez déjà votre code)
     - ❌ "Add .gitignore" (déjà créé)
     - ❌ "Choose a license" (optionnel)
   
4. **Cliquez sur "Create repository"**

5. **GitHub va vous montrer des instructions** - **NE LES SUIVEZ PAS ENCORE** ! On va faire ça différemment.

---

## 📋 Étape 2 : Initialiser Git dans votre Projet (si pas déjà fait)

### Ouvrez un terminal dans votre projet :

```bash
cd /Users/thomas.s/Desktop/app
```

### Vérifiez si Git est déjà initialisé :

```bash
git status
```

**Si vous voyez une erreur "not a git repository"**, continuez avec les étapes ci-dessous.

**Si Git est déjà initialisé**, passez directement à l'Étape 3.

### Initialiser Git (si nécessaire) :

```bash
git init
```

---

## 📋 Étape 3 : Ajouter tous les Fichiers

```bash
git add .
```

Cette commande ajoute tous vos fichiers au staging.

---

## 📋 Étape 4 : Faire le Premier Commit

```bash
git commit -m "Initial commit - Application Producteurs Locaux"
```

---

## 📋 Étape 5 : Lier votre Projet au Repository GitHub

**Remplacez `xmaniixx` par votre nom d'utilisateur GitHub** et `producteurs-locaux` par le nom de votre repository :

```bash
git remote add origin https://github.com/xmaniixx/producteurs-locaux.git
```

**Pour trouver votre URL exacte :**
1. Allez sur votre repository GitHub (celui que vous venez de créer)
2. Cliquez sur le bouton vert "Code"
3. Copiez l'URL HTTPS
4. Utilisez-la dans la commande ci-dessus

---

## 📋 Étape 6 : Pousser le Code sur GitHub

```bash
git branch -M main
git push -u origin main
```

**Si GitHub vous demande vos identifiants :**
- **Username** : Votre nom d'utilisateur GitHub
- **Password** : Utilisez un **Personal Access Token** (pas votre mot de passe)

### Créer un Personal Access Token (si nécessaire) :

1. Allez sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Cliquez sur "Generate new token (classic)"
3. Donnez-lui un nom (ex: "Railway Deployment")
4. Cochez "repo" (accès complet aux repositories)
5. Cliquez sur "Generate token"
6. **COPIEZ LE TOKEN** (vous ne le reverrez plus !)
7. Utilisez ce token comme mot de passe lors du `git push`

---

## ✅ Vérification

Une fois le push terminé :

1. **Allez sur votre repository GitHub**
2. **Vous devriez voir tous vos fichiers** :
   - `package.json`
   - `client/`
   - `server/`
   - `database.db` (si présent)
   - etc.

---

## 🚀 Retour sur Railway

Maintenant que votre code est sur GitHub :

1. **Retournez sur Railway** : https://railway.app
2. **Cliquez sur "New Project"**
3. **Sélectionnez "Deploy from GitHub repo"**
4. **Vous devriez maintenant voir votre repository** `producteurs-locaux` dans la liste !
5. **Cliquez dessus** pour déployer

---

## 🆘 Problèmes Courants

### Erreur "remote origin already exists"

**Solution :**
```bash
git remote remove origin
git remote add origin https://github.com/xmaniixx/producteurs-locaux.git
```

### Erreur "authentication failed"

**Solution :**
- Utilisez un Personal Access Token au lieu de votre mot de passe
- Voir l'Étape 6 ci-dessus

### Erreur "repository not found"

**Solution :**
- Vérifiez que le nom du repository est correct
- Vérifiez que vous avez les droits d'accès
- Vérifiez l'URL dans `git remote -v`

---

## 📝 Commandes Rapides (Résumé)

```bash
# 1. Aller dans le projet
cd /Users/thomas.s/Desktop/app

# 2. Initialiser Git (si pas déjà fait)
git init

# 3. Ajouter tous les fichiers
git add .

# 4. Faire le commit
git commit -m "Initial commit"

# 5. Lier au repository GitHub (remplacez l'URL par la vôtre)
git remote add origin https://github.com/xmaniixx/producteurs-locaux.git

# 6. Pousser sur GitHub
git branch -M main
git push -u origin main
```

---

**Une fois votre code sur GitHub, revenez sur Railway et vous pourrez déployer ! 🚀**



# 💻 Guide : Utiliser le Terminal dans Cursor

Ce guide vous explique comment utiliser le terminal zsh dans Cursor et lancer l'application.

---

## 🎯 Ouvrir le Terminal dans Cursor

### Méthode 1 : Raccourci clavier
- Appuyez sur **`` Ctrl + ` ``** (Ctrl + Backtick/Accent grave)
- Le terminal s'ouvre en bas de l'écran

### Méthode 2 : Menu
- Allez dans **"Terminal"** > **"New Terminal"** (ou "Nouveau Terminal")
- Le terminal s'ouvre en bas

### Méthode 3 : Palette de commandes
- Appuyez sur **Cmd + Shift + P** (Mac)
- Tapez "Terminal" et sélectionnez **"Terminal: Create New Terminal"**

---

## ✅ Vérifier que vous êtes dans le bon dossier

Dans le terminal, vous devriez voir quelque chose comme :
```
thomas@MacBook-Pro app %
```

Si vous voyez `app` à la fin, vous êtes au bon endroit ! ✅

**Si vous n'êtes pas dans le bon dossier**, tapez :
```bash
cd /Users/thomas.s/Desktop/app
```

---

## 📦 Étape 1 : Installer les dépendances (OBLIGATOIRE)

**Avant de lancer l'application, vous DEVEZ installer les dépendances.**

Dans le terminal, tapez cette commande (copiez-collez) :
```bash
npm run install:all
```

Appuyez sur **Entrée**.

**⏱️ Cela peut prendre 2-5 minutes** la première fois. Vous verrez beaucoup de texte défiler, c'est normal !

Attendez que vous voyiez à nouveau le prompt (`app %`) avant de continuer.

---

## 🚀 Étape 2 : Lancer l'application

Une fois les dépendances installées, tapez :
```bash
npm run dev
```

**⚠️ IMPORTANT :** C'est bien **`npm`** (pas `pm`, pas `nmp`, pas `npm run`) !

Appuyez sur **Entrée**.

---

## ✅ Si ça fonctionne

Vous devriez voir quelque chose comme :
```
🚀 Serveur démarré sur http://localhost:3001
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

**Parfait !** 🎉 L'application est lancée !

Ouvrez votre navigateur et allez sur : **http://localhost:5173**

---

## ❌ Problèmes Courants et Solutions

### ❌ Erreur : "command not found: npm"

**Cela signifie que Node.js n'est pas installé.**

**Solution :**
1. Allez sur https://nodejs.org/
2. Téléchargez la version "LTS" (Long Term Support)
3. Installez le fichier .pkg téléchargé
4. Redémarrez Cursor
5. Réessayez

### ❌ Erreur : "npm: command not found" après installation

**Solution :**
1. Fermez complètement Cursor
2. Rouvrez Cursor
3. Réessayez dans un nouveau terminal

### ❌ Erreur : "Cannot find module"

**Solution :**
Les dépendances ne sont pas installées. Lancez :
```bash
npm run install:all
```

### ❌ Erreur : "Port 3001 already in use"

**Cela signifie qu'un autre programme utilise déjà le port.**

**Solution :**
1. Arrêtez l'application en cours (Ctrl + C dans le terminal)
2. Changez le port dans le fichier `.env` :
   ```
   PORT=3002
   ```
3. Relancez avec `npm run dev`

### ❌ Erreur : "EACCES: permission denied"

**Cela signifie que vous n'avez pas les permissions.**

**Solution :**
Sur Mac, cela arrive rarement, mais si cela arrive :
```bash
sudo npm run install:all
```
(Entrez votre mot de passe Mac quand demandé)

### ❌ Vous avez tapé "pm run dev" au lieu de "npm run dev"

**Solution :**
Tapez bien **`npm`** (avec le "n" au début) :
```bash
npm run dev
```

### ❌ La commande ne s'exécute pas / rien ne se passe

**Vérifications :**
1. Êtes-vous dans le bon dossier ? Tapez `pwd` pour voir où vous êtes
2. Le terminal est-il bien actif ? Cliquez dedans pour vous assurer
3. Avez-vous appuyé sur **Entrée** après avoir tapé la commande ?

---

## 🛑 Arrêter l'application

Pour arrêter l'application quand elle tourne :

1. Cliquez dans le terminal
2. Appuyez sur **Ctrl + C**
3. L'application s'arrête

---

## 📝 Commandes Utiles

### Voir où vous êtes
```bash
pwd
```

### Aller dans le dossier du projet
```bash
cd /Users/thomas.s/Desktop/app
```

### Voir les fichiers du dossier
```bash
ls
```

### Voir les fichiers cachés aussi
```bash
ls -la
```

### Vider l'écran du terminal
```bash
clear
```

---

## 💡 Astuces

1. **Utilisez Tab pour l'autocomplétion** : Tapez quelques lettres et appuyez sur Tab, ça complète automatiquement
2. **Flèches haut/bas** : Pour revenir aux commandes précédentes
3. **Cmd + K** : Vide l'écran du terminal dans Cursor
4. **Copier/Coller** : Cmd + C / Cmd + V fonctionne normalement

---

## ✅ Checklist avant de lancer

- [ ] Node.js est installé (vérifiez avec `node --version`)
- [ ] npm est installé (vérifiez avec `npm --version`)
- [ ] Vous êtes dans le dossier `/Users/thomas.s/Desktop/app`
- [ ] Vous avez installé les dépendances avec `npm run install:all`
- [ ] Le fichier `.env` existe et contient votre clé API (voir GUIDE_CLE_API_GOOGLE.md)
- [ ] Vous tapez bien `npm run dev` (pas `pm run dev`)

Une fois tout cela fait, votre application devrait démarrer ! 🚀





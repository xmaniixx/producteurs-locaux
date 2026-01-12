# 🔑 Guide Complet : Obtenir et Configurer la Clé API Google Maps

Ce guide vous explique **étape par étape** comment obtenir votre clé API Google Maps et la configurer dans l'application.

---

## 📋 Étape 1 : Créer un Compte Google Cloud (si vous n'en avez pas)

1. Allez sur **https://console.cloud.google.com/**
2. Connectez-vous avec votre compte Google (Gmail)
3. Si c'est votre première fois, Google vous demandera de créer un compte de facturation
   - ⚠️ **Ne vous inquiétez pas !** Google offre **200$ de crédits gratuits** par mois
   - Pour notre application, cela ne coûtera **rien** car nous restons dans les limites gratuites
   - Vous pouvez même définir une limite de budget pour éviter toute surprise

---

## 🆕 Étape 2 : Créer un Nouveau Projet

1. Une fois connecté, en haut de la page, cliquez sur le nom du projet actuel (à côté du logo Google Cloud)
2. Cliquez sur **"NOUVEAU PROJET"** (ou "New Project" en anglais)
3. Donnez un nom à votre projet (ex: "Producteurs Locaux" ou "Local Producers")
4. Cliquez sur **"CRÉER"** (ou "Create")
5. Attendez quelques secondes que le projet soit créé
6. Sélectionnez votre nouveau projet en cliquant sur son nom en haut de la page

---

## 🔌 Étape 3 : Activer les APIs Nécessaires

Vous devez activer **3 APIs** pour que l'application fonctionne :

### API 1 : Maps JavaScript API

1. Dans le menu de gauche, allez dans **"APIs et services"** > **"Bibliothèque"** (ou "APIs & Services" > "Library")
2. Dans la barre de recherche, tapez : **"Maps JavaScript API"**
3. Cliquez sur **"Maps JavaScript API"**
4. Cliquez sur le bouton **"ACTIVER"** (ou "Enable")
5. Attendez quelques secondes que l'API soit activée

### API 2 : Places API

1. Retournez dans **"APIs et services"** > **"Bibliothèque"**
2. Recherchez : **"Places API"**
3. Cliquez sur **"Places API"** (pas "Places API (New)" pour l'instant)
4. Cliquez sur **"ACTIVER"**
5. Attendez l'activation

### API 3 : Geocoding API

1. Retournez dans **"APIs et services"** > **"Bibliothèque"**
2. Recherchez : **"Geocoding API"**
3. Cliquez sur **"Geocoding API"**
4. Cliquez sur **"ACTIVER"**
5. Attendez l'activation

✅ **Vérification :** Vous pouvez vérifier que les 3 APIs sont activées en allant dans **"APIs et services"** > **"Tableau de bord"**. Vous devriez voir les 3 APIs listées.

---

## 🎫 Étape 4 : Créer la Clé API

1. Dans le menu de gauche, allez dans **"APIs et services"** > **"Identifiants"** (ou "Credentials")
2. En haut de la page, cliquez sur **"+ CRÉER DES IDENTIFIANTS"** (ou "+ CREATE CREDENTIALS")
3. Dans le menu déroulant, sélectionnez **"Clé API"** (ou "API Key")
4. **🎉 Votre clé API est créée !** Elle apparaît dans une fenêtre popup
5. **⚠️ IMPORTANT :** Copiez cette clé tout de suite ! Elle ressemble à quelque chose comme :
   ```
   AIzaSyD1234567890abcdefghijklmnopqrstuvw
   ```
6. Cliquez sur **"FERMER"** (ou "Close")

---

## 🔒 Étape 5 : Restreindre la Clé API (RECOMMANDÉ - Sécurité)

Pour sécuriser votre clé API, il est recommandé de la restreindre :

1. Dans **"APIs et services"** > **"Identifiants"**, vous verrez votre clé API
2. Cliquez sur le nom de la clé API (ou sur l'icône crayon pour l'éditer)
3. Sous **"Restrictions d'application"**, sélectionnez **"Sites web HTTP"**
4. Cliquez sur **"+ AJOUTER UN ÉLÉMENT"** (ou "+ Add an item")
5. Ajoutez : `http://localhost:5173` (pour le développement local)
   - Si vous déployez l'application plus tard, ajoutez aussi votre domaine (ex: `https://votre-domaine.com`)
6. Sous **"Restrictions d'API"**, sélectionnez **"Limiter la clé"**
7. Cochez uniquement ces 3 APIs :
   - ✅ Maps JavaScript API
   - ✅ Places API
   - ✅ Geocoding API
8. Cliquez sur **"ENREGISTRER"** (ou "Save")

---

## 📝 Étape 6 : Ajouter la Clé API dans l'Application

Maintenant, il faut ajouter cette clé dans votre projet :

1. **Ouvrez votre dossier de projet** dans votre éditeur (VSCode, Cursor, etc.)
2. À la **racine du projet** (dans `/Users/thomas.s/Desktop/app/`), créez un nouveau fichier nommé **`.env`**
   - ⚠️ Le point au début est important : `.env` (pas `env.txt`)
3. **Ouvrez ce fichier** et ajoutez ces lignes :

```
VITE_GOOGLE_MAPS_API_KEY=votre_cle_api_ici
GOOGLE_MAPS_API_KEY=votre_cle_api_ici
PORT=3001
SESSION_SECRET=changez_cette_cle_secrete_en_production
```

4. **Remplacez `votre_cle_api_ici`** par votre vraie clé API (celle que vous avez copiée à l'étape 4)
5. **Remplacez `changez_cette_cle_secrete_en_production`** par une chaîne aléatoire (ex: `ma_super_cle_secrete_123456`)
6. **Sauvegardez le fichier**

**Exemple de fichier `.env` correct :**
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrstuvw
GOOGLE_MAPS_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrstuvw
PORT=3001
SESSION_SECRET=ma_cle_secrete_pour_les_sessions_987654321
```

---

## ✅ Étape 7 : Vérifier que ça Fonctionne

1. **Ouvrez un terminal** dans le dossier de votre projet
2. Lancez l'application :
   ```bash
   npm run dev
   ```
3. Ouvrez votre navigateur et allez sur : **http://localhost:5173**
4. Vous devriez voir la carte Google Maps s'afficher
5. Testez en tapant une ville (ex: "Paris") et en cliquant sur "Rechercher"

---

## 🐛 Problèmes Courants et Solutions

### ❌ "Cette page ne peut pas charger Google Maps correctement"

**Cause :** La clé API n'est pas correctement configurée ou l'API n'est pas activée.

**Solution :**
1. Vérifiez que le fichier `.env` existe bien à la racine du projet
2. Vérifiez que la clé API est correctement copiée (sans espaces avant/après)
3. Redémarrez le serveur (arrêtez avec `Ctrl+C` et relancez `npm run dev`)
4. Vérifiez dans Google Cloud Console que les 3 APIs sont bien activées

### ❌ "Cette clé API n'est pas autorisée pour cette API"

**Cause :** L'API n'est pas activée dans votre projet Google Cloud.

**Solution :**
1. Allez dans Google Cloud Console > APIs et services > Bibliothèque
2. Vérifiez que les 3 APIs sont activées (Maps JavaScript API, Places API, Geocoding API)
3. Si elles ne le sont pas, activez-les

### ❌ "Référence d'erreur pour le propriétaire du site Web : restriction de référent"

**Cause :** La restriction HTTP est trop stricte ou `localhost:5173` n'est pas dans la liste autorisée.

**Solution :**
1. Allez dans Google Cloud Console > APIs et services > Identifiants
2. Cliquez sur votre clé API
3. Vérifiez que `http://localhost:5173` est bien dans les "Sites web HTTP autorisés"
4. Si vous êtes en développement, vous pouvez temporairement retirer toutes les restrictions (mais remettez-les en production !)

### ❌ "Requête refusée en raison des restrictions de la clé API"

**Cause :** La restriction d'API bloque certaines requêtes.

**Solution :**
1. Vérifiez que vous avez bien coché les 3 APIs nécessaires dans les restrictions
2. Ou temporairement, retirez les restrictions d'API pour tester (mais remettez-les ensuite !)

---

## 💰 Coûts et Limites Gratuites

Google Maps offre un **forfait gratuit généreux** :

- **Maps JavaScript API** : 28 000 chargements de carte par mois gratuits
- **Places API** : 17 000 requêtes par mois gratuites
- **Geocoding API** : 40 000 requêtes par mois gratuites

**Pour une application normale, vous ne dépasserez jamais ces limites !**

Si vous voulez être sûr, vous pouvez :
1. Aller dans Google Cloud Console > Facturation
2. Définir une **alerte de budget** (ex: 5€)
3. Vous recevrez un email si vous approchez de la limite

---

## 📞 Aide Supplémentaire

Si vous rencontrez toujours des problèmes :

1. **Vérifiez les logs du terminal** quand vous lancez `npm run dev`
2. **Vérifiez la console du navigateur** (F12 > Console) pour voir les erreurs
3. **Vérifiez dans Google Cloud Console** que :
   - Le projet est bien sélectionné
   - Les 3 APIs sont activées
   - La clé API existe et n'est pas désactivée

---

## ✅ Checklist Finale

Avant de considérer que tout est configuré, vérifiez :

- [ ] Compte Google Cloud créé
- [ ] Projet créé dans Google Cloud Console
- [ ] Maps JavaScript API activée
- [ ] Places API activée
- [ ] Geocoding API activée
- [ ] Clé API créée et copiée
- [ ] Fichier `.env` créé à la racine du projet
- [ ] Clé API ajoutée dans le fichier `.env`
- [ ] L'application démarre sans erreur
- [ ] La carte s'affiche dans le navigateur

Une fois tout cela fait, votre application est prête ! 🎉


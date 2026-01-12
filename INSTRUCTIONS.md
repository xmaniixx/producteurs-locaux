# 📖 Instructions d'Installation et de Configuration

## 🚀 Étape 1 : Installation des dépendances

Dans le terminal, à la racine du projet (`/Users/thomas.s/Desktop/app`), exécutez :

```bash
npm run install:all
```

Cette commande installera toutes les dépendances nécessaires pour le serveur et le client.

## 🔑 Étape 2 : Configuration de l'API Google Maps (OBLIGATOIRE)

### 2.1 Créer un compte Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez la facturation (Google offre des crédits gratuits)

### 2.2 Activer les APIs nécessaires

Activez les APIs suivantes dans votre projet :
- **Maps JavaScript API** (pour afficher la carte)
- **Places API** (pour rechercher des producteurs)
- **Geocoding API** (pour convertir les adresses en coordonnées)

### 2.3 Créer une clé API

1. Allez dans "Identifiants" (Credentials)
2. Cliquez sur "Créer des identifiants" > "Clé API"
3. Copiez la clé générée

### 2.4 Configurer la clé dans le projet

1. À la racine du projet, créez un fichier `.env` (sans extension)
2. Ajoutez-y :

```
VITE_GOOGLE_MAPS_API_KEY=votre_cle_api_ici
GOOGLE_MAPS_API_KEY=votre_cle_api_ici
PORT=3001
SESSION_SECRET=changez_cette_cle_secrete_en_production
```

**⚠️ IMPORTANT :** Remplacez `votre_cle_api_ici` par votre vraie clé API.

### 2.5 Restreindre la clé API (recommandé)

Pour la sécurité, restreignez votre clé API :
- Restrictions d'application : Sites web HTTP (ajoutez `http://localhost:5173`)
- Restrictions d'API : Limitez aux APIs listées ci-dessus

## ▶️ Étape 3 : Lancer l'application

Toujours à la racine du projet, exécutez :

```bash
npm run dev
```

Cette commande démarre :
- Le serveur backend sur `http://localhost:3001`
- Le client frontend sur `http://localhost:5173`

Ouvrez votre navigateur et allez sur : **http://localhost:5173**

## ✅ Vérification

Si tout fonctionne :
1. Vous devriez voir la carte Google Maps
2. Vous pouvez saisir une ville et rechercher des producteurs
3. Les producteurs apparaissent sous forme de pins 🌾 sur la carte
4. En cliquant sur un pin, vous voyez la fiche du producteur
5. Le bouton "Y aller" ouvre Google Maps avec l'itinéraire

## 🐛 Problèmes courants

### "Clé API manquante"
→ Vérifiez que le fichier `.env` existe et contient bien `VITE_GOOGLE_MAPS_API_KEY`

### "Requête refusée par Google Maps"
→ Vérifiez que toutes les APIs sont activées et que votre clé API fonctionne

### "Port déjà utilisé"
→ Changez le `PORT` dans le fichier `.env` (ex: `PORT=3002`)

### Les producteurs ne s'affichent pas
→ Vérifiez votre connexion internet et que l'API Places est bien activée

## 📁 Structure du projet

```
app/
├── client/              # Application React (frontend)
│   └── src/
│       ├── pages/      # Pages de l'application
│       └── components/ # Composants réutilisables
├── server/             # API Node.js (backend)
│   ├── routes/        # Routes API
│   └── database.js    # Gestion base de données
└── database.db         # Base de données SQLite (créée automatiquement)
```

## 🎯 Fonctionnalités principales

- ✅ Carte Google Maps interactive
- ✅ Recherche de producteurs par ville
- ✅ Filtrage par rayon (10, 50, 100 km)
- ✅ Affichage des producteurs enregistrés OU via Google Places
- ✅ Fiche producteur avec bouton "Y aller"
- ✅ Inscription/Connexion producteurs
- ✅ Dashboard avec statistiques

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :
1. Que toutes les dépendances sont installées
2. Que le fichier `.env` est correctement configuré
3. Que les APIs Google Maps sont activées
4. Les logs dans le terminal pour voir les erreurs




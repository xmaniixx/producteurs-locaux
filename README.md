# 🌾 Producteurs Locaux - Application de Recherche

Application web pour trouver des producteurs et fermes locales autour d'une ville.

## 🚀 Installation

1. Installez les dépendances :
```bash
npm run install:all
```

2. Configurez vos clés API Google Maps :
   - **📖 Guide complet :** Consultez `GUIDE_CLE_API_GOOGLE.md` pour un tutoriel détaillé étape par étape
   - Créez un fichier `.env` à la racine avec votre clé API
   - Obtenez une clé API sur [Google Cloud Console](https://console.cloud.google.com/)
   - Activez les APIs suivantes :
     - Maps JavaScript API
     - Places API
     - Geocoding API

3. Lancez l'application :
```bash
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:5173
- Backend : http://localhost:3001

## 📁 Structure du Projet

- `client/` : Application React (frontend)
- `server/` : API Node.js/Express (backend)
- `database.db` : Base de données SQLite (créée automatiquement)

## 🎯 Fonctionnalités

- 🔍 Recherche de producteurs par ville
- 🗺️ Carte interactive avec pins des producteurs
- 📍 Itinéraire Google Maps au clic sur "Y aller"
- 👨‍🌾 Espace producteur avec statistiques
- 🔐 Authentification persistante

## ⚠️ Important

**N'oubliez pas de configurer vos clés API Google Maps !**

👉 **Consultez le guide complet :** `GUIDE_CLE_API_GOOGLE.md` pour obtenir et configurer votre clé API étape par étape.

## 📚 Documentation

- `GUIDE_CLE_API_GOOGLE.md` : Guide détaillé pour obtenir et configurer la clé API Google Maps
- `DEBUT_RAPIDE.md` : Guide de démarrage rapide
- `INSTRUCTIONS.md` : Instructions complètes avec dépannage


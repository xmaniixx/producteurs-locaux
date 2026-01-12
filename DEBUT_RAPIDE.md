# 🚀 Démarrage Rapide

## Installation en 3 étapes

### 1️⃣ Installer les dépendances
```bash
npm run install:all
```

### 2️⃣ Configurer la clé API Google Maps

Créez un fichier `.env` à la racine avec :
```
VITE_GOOGLE_MAPS_API_KEY=votre_cle_api
GOOGLE_MAPS_API_KEY=votre_cle_api
PORT=3001
SESSION_SECRET=ma_cle_secrete
```

**Comment obtenir une clé API ?**
- Allez sur https://console.cloud.google.com/
- Créez un projet
- Activez : Maps JavaScript API, Places API, Geocoding API
- Créez une clé API dans "Identifiants"

### 3️⃣ Lancer l'application
```bash
npm run dev
```

Ouvrez http://localhost:5173 dans votre navigateur.

## ✅ Test rapide

1. **Page d'accueil** : Tapez une ville (ex: "Paris") et cliquez sur "Rechercher"
2. **Carte** : Des pins apparaissent sur la carte
3. **Fiche producteur** : Cliquez sur un pin pour voir les détails
4. **Y aller** : Cliquez sur "Y aller" pour ouvrir Google Maps avec l'itinéraire

## 📖 Documentation complète

Voir `INSTRUCTIONS.md` pour plus de détails.




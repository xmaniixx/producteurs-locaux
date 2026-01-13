# 🔑 Votre Clé Google Maps API

## ✅ Clé Trouvée

Votre clé Google Maps API est :

```
AIzaSyBdv8rn-Nn_2_LRCC8BG5G4ymbHU0Dvg7Y
```

---

## 📍 Où elle se trouve

Elle est actuellement dans le fichier : `client/.env`

```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBdv8rn-Nn_2_LRCC8BG5G4ymbHU0Dvg7Y
```

---

## 🔧 Pour le Déploiement (Render, Railway, etc.)

Quand vous déployez votre application, ajoutez cette variable d'environnement :

```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBdv8rn-Nn_2_LRCC8BG5G4ymbHU0Dvg7Y
GOOGLE_MAPS_API_KEY=AIzaSyBdv8rn-Nn_2_LRCC8BG5G4ymbHU0Dvg7Y
```

**Note :** Utilisez la même clé pour les deux variables (frontend et backend).

---

## 🌐 Pour la Retrouver dans Google Cloud Console

Si vous avez besoin de la retrouver ou de la modifier :

1. **Allez sur** : https://console.cloud.google.com/
2. **Connectez-vous** avec votre compte Google
3. **Sélectionnez votre projet** (en haut de la page)
4. **Menu de gauche** → **"APIs et services"** → **"Identifiants"**
5. **Vous verrez votre clé API** dans la liste
6. **Cliquez dessus** pour voir les détails ou la modifier

---

## 🔒 Sécurité

⚠️ **Important :** Cette clé est sensible. Ne la partagez pas publiquement et ne la commitez pas dans Git (elle est déjà dans `.gitignore`).

---

## ✅ Vérification

Pour vérifier que votre clé fonctionne :

1. Ouvrez votre application en local : http://localhost:5173
2. La carte Google Maps devrait s'afficher
3. Si vous voyez une erreur, vérifiez dans Google Cloud Console que :
   - Les APIs sont activées (Maps JavaScript API, Places API, Geocoding API)
   - La clé n'est pas désactivée
   - Les restrictions HTTP incluent `http://localhost:5173`

---

**Votre clé est prête à être utilisée ! 🚀**


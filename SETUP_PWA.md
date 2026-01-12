# ⚡ Configuration PWA Rapide

Guide rapide pour transformer votre application en PWA (installable sur mobile).

## 🎯 Objectif

Permettre aux utilisateurs d'installer votre application sur leur téléphone directement depuis le navigateur, sans passer par les stores.

## 📋 Étapes

### 1. Créer le Manifest

Créez le fichier `client/public/manifest.json` avec ce contenu :

```json
{
  "name": "Producteurs Locaux",
  "short_name": "Producteurs",
  "description": "Trouvez des producteurs locaux près de chez vous",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#00D47E",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Créer les Icônes

Vous devez créer deux icônes PNG :
- `client/public/icon-192.png` (192x192 pixels)
- `client/public/icon-512.png` (512x512 pixels)

**Comment créer les icônes :**
1. Allez sur https://www.pwabuilder.com/imageGenerator
2. Uploadez votre logo
3. Téléchargez les icônes générées
4. Placez-les dans `client/public/`

### 3. Modifier index.html

Ajoutez ces lignes dans le `<head>` de `client/index.html` :

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#00D47E">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Producteurs Locaux">
<link rel="apple-touch-icon" href="/icon-192.png">
```

### 4. Créer un Service Worker (Optionnel mais Recommandé)

Créez `client/public/sw.js` :

```javascript
const CACHE_NAME = 'producteurs-locaux-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

Enregistrez-le dans `client/src/main.jsx` :

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
```

### 5. Déployer en Production

**Important :** Les PWA nécessitent HTTPS. Assurez-vous que votre application est déployée avec HTTPS.

### 6. Tester

1. Déployez votre application
2. Ouvrez-la sur un téléphone (iOS Safari ou Android Chrome)
3. Utilisez le menu du navigateur :
   - **iOS** : Partage > Ajouter à l'écran d'accueil
   - **Android** : Menu > Installer l'application
4. L'application apparaîtra comme une app native !

## ✅ Résultat

Les utilisateurs pourront :
- ✅ Installer l'app depuis le navigateur
- ✅ L'ouvrir comme une app native
- ✅ L'avoir sur l'écran d'accueil
- ✅ Utiliser l'app hors ligne (avec Service Worker)

## 🎨 Personnalisation

Modifiez dans `manifest.json` :
- `name` : Nom complet de l'application
- `short_name` : Nom court (affiché sous l'icône)
- `theme_color` : Couleur de la barre de statut
- `background_color` : Couleur de fond au démarrage

## 🆘 Problèmes Courants

### L'option "Installer" n'apparaît pas
- Vérifiez que vous êtes en HTTPS
- Vérifiez que le manifest.json est accessible
- Vérifiez que les icônes existent

### L'icône ne s'affiche pas
- Vérifiez que les fichiers icon-192.png et icon-512.png existent
- Vérifiez les chemins dans manifest.json

---

**C'est tout ! Votre application est maintenant installable sur mobile ! 📱**


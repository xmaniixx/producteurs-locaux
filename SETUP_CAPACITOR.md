# 📱 Configuration Capacitor pour les Stores

Guide pour transformer votre application web en application native pour App Store et Google Play.

## 🎯 Objectif

Publier votre application sur l'App Store (iOS) et Google Play (Android) en réutilisant votre code web existant.

## 📋 Prérequis

- ✅ Application web fonctionnelle et déployée
- ✅ Compte développeur Apple ($99/an) pour iOS
- ✅ Compte développeur Google ($25 unique) pour Android
- ✅ Mac avec Xcode (pour iOS)
- ✅ Android Studio installé (pour Android)

## 🚀 Installation

### Étape 1 : Installer Capacitor

```bash
cd client
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
```

### Étape 2 : Initialiser Capacitor

```bash
npx cap init "Producteurs Locaux" "com.producteurs.locaux"
```

Cela créera un fichier `capacitor.config.json`.

### Étape 3 : Modifier capacitor.config.json

```json
{
  "appId": "com.producteurs.locaux",
  "appName": "Producteurs Locaux",
  "webDir": "dist",
  "server": {
    "url": "https://votre-backend.railway.app",
    "cleartext": false
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#00D47E"
    }
  }
}
```

### Étape 4 : Build de l'Application

```bash
npm run build
npx cap sync
```

## 📱 iOS (App Store)

### Étape 1 : Ouvrir dans Xcode

```bash
npx cap open ios
```

### Étape 2 : Configurer dans Xcode

1. **Sélectionnez le projet** dans le navigateur
2. **Général** :
   - Display Name : "Producteurs Locaux"
   - Bundle Identifier : `com.producteurs.locaux`
   - Version : 1.0.0
   - Build : 1

3. **Signing & Capabilities** :
   - Sélectionnez votre équipe de développement
   - Activez "Automatically manage signing"

4. **Icône de l'application** :
   - Glissez vos icônes dans `AppIcon` (1024x1024 pour App Store)

### Étape 3 : Tester

1. Sélectionnez un simulateur ou un appareil
2. Cliquez sur "Run" (▶️)
3. L'application s'ouvrira sur le simulateur/appareil

### Étape 4 : Générer pour App Store

1. **Product > Archive**
2. Attendez la fin de l'archivage
3. **Distribute App**
4. **App Store Connect**
5. **Upload**
6. Suivez les instructions

### Étape 5 : Soumettre sur App Store Connect

1. Allez sur [App Store Connect](https://appstoreconnect.apple.com)
2. Créez une nouvelle app
3. Remplissez les informations :
   - Nom : Producteurs Locaux
   - Bundle ID : com.producteurs.locaux
   - Langue principale : Français
4. Une fois l'upload terminé, soumettez pour review

## 🤖 Android (Google Play)

### Étape 1 : Ouvrir dans Android Studio

```bash
npx cap open android
```

### Étape 2 : Configurer dans Android Studio

1. **Ouvrez `android/app/src/main/AndroidManifest.xml`**
2. Modifiez :
   ```xml
   <application
       android:label="Producteurs Locaux"
       android:icon="@mipmap/ic_launcher"
       ...>
   ```

3. **Icône de l'application** :
   - Remplacez les fichiers dans `android/app/src/main/res/mipmap-*/`
   - Utilisez [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)

### Étape 3 : Générer la Clé de Signature

```bash
cd android/app
keytool -genkey -v -keystore producteurs-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias producteurs
```

### Étape 4 : Configurer le Signing

Créez `android/key.properties` :
```
storePassword=votre_mot_de_passe
keyPassword=votre_mot_de_passe
keyAlias=producteurs
storeFile=../app/producteurs-release-key.jks
```

### Étape 5 : Build AAB (Android App Bundle)

1. Dans Android Studio : **Build > Generate Signed Bundle / APK**
2. Sélectionnez **Android App Bundle**
3. Utilisez votre clé de signature
4. Le fichier `.aab` sera généré

### Étape 6 : Upload sur Google Play

1. Allez sur [Google Play Console](https://play.google.com/console)
2. Créez une nouvelle application
3. Remplissez les informations
4. **Production > Créer une version**
5. Upload le fichier `.aab`
6. Remplissez les détails de la store listing
7. Soumettez pour review

## 🔧 Plugins Utiles

### Géolocalisation

```bash
npm install @capacitor/geolocation
```

```javascript
import { Geolocation } from '@capacitor/geolocation';

const position = await Geolocation.getCurrentPosition();
```

### Caméra

```bash
npm install @capacitor/camera
```

```javascript
import { Camera } from '@capacitor/camera';

const image = await Camera.getPhoto({
  quality: 90,
  source: CameraSource.Camera,
  resultType: CameraResultType.Uri
});
```

### Réseau

```bash
npm install @capacitor/network
```

```javascript
import { Network } from '@capacitor/network';

const status = await Network.getStatus();
```

## 📋 Checklist

### Avant de Soumettre

- [ ] Application testée sur appareils réels
- [ ] Icônes et splash screen configurés
- [ ] Permissions demandées correctement
- [ ] Politique de confidentialité ajoutée
- [ ] Captures d'écran préparées
- [ ] Description de l'app rédigée
- [ ] Mots-clés définis

### iOS Spécifique

- [ ] Compte développeur Apple actif
- [ ] Certificats de distribution configurés
- [ ] Provisioning profiles créés
- [ ] Testé sur différents appareils iOS

### Android Spécifique

- [ ] Compte développeur Google créé
- [ ] Clé de signature générée et sauvegardée
- [ ] Testé sur différents appareils Android
- [ ] AAB généré et testé

## 🎨 Assets Requis

### iOS

- Icône 1024x1024 (App Store)
- Screenshots (toutes les tailles d'iPhone/iPad)
- Description (jusqu'à 4000 caractères)

### Android

- Icône 512x512 (Play Store)
- Feature Graphic 1024x500
- Screenshots (téléphone et tablette)
- Description (jusqu'à 4000 caractères)

## 💡 Conseils

1. **Testez sur de vrais appareils** avant de soumettre
2. **Préparez tous les assets** avant de commencer
3. **Lisez les guidelines** d'Apple et Google
4. **Soyez patient** - la review peut prendre plusieurs jours
5. **Répondez rapidement** aux questions des reviewers

## 🆘 Problèmes Courants

### Erreur de signature iOS
- Vérifiez que votre compte développeur est actif
- Vérifiez les certificats dans Keychain Access

### Erreur de build Android
- Vérifiez que Android SDK est installé
- Vérifiez les versions dans `build.gradle`

### L'app ne se connecte pas au backend
- Vérifiez l'URL dans `capacitor.config.json`
- Vérifiez les permissions réseau dans le manifest

---

**Bon courage pour la publication ! 🚀**



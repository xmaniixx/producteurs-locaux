# ✅ Vérifier et Corriger la Configuration de la Clé API

Si l'application vous dit toujours de configurer la clé API alors que vous pensez l'avoir fait, voici comment résoudre le problème.

---

## 🔍 Étape 1 : Vérifier le Fichier .env

Le fichier `.env` doit être **à la racine du projet** : `/Users/thomas.s/Desktop/app/.env`

### Contenu exact que doit avoir le fichier .env :

```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrstuvw
GOOGLE_MAPS_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrstuvw
PORT=3001
SESSION_SECRET=ma_cle_secrete_aleatoire
```

**⚠️ IMPORTANT :**
- Pas d'espaces avant ou après le `=`
- Pas de guillemets autour de la clé API
- Pas de ligne vide au début du fichier
- Le nom de la variable doit être EXACTEMENT `VITE_GOOGLE_MAPS_API_KEY` (en majuscules)

---

## 🔧 Étape 2 : Vérifier que votre Clé API est Valide

Votre clé API doit ressembler à quelque chose comme :
```
AIzaSyD1234567890abcdefghijklmnopqrstuvw
```

- Commence par `AIza`
- Fait environ 39 caractères
- Pas d'espaces, pas de retours à la ligne

---

## 🔄 Étape 3 : Redémarrer l'Application

**Après avoir modifié le fichier .env, vous DEVEZ redémarrer l'application !**

1. Dans le terminal où l'application tourne, appuyez sur **Ctrl + C** pour l'arrêter
2. Attendez que le terminal revienne au prompt (`app %`)
3. Relancez avec : `npm run dev`
4. Ouvrez à nouveau http://localhost:5173 dans votre navigateur

---

## 🛠️ Étape 4 : Créer/Modifier le Fichier .env Correctement

### Option A : Via le Terminal (RECOMMANDÉ)

1. Ouvrez le terminal dans Cursor (Ctrl + `)
2. Assurez-vous d'être dans le bon dossier :
   ```bash
   cd /Users/thomas.s/Desktop/app
   ```

3. Ouvrez le fichier .env avec TextEdit :
   ```bash
   open -e .env
   ```

4. Dans TextEdit, remplacez TOUT le contenu par :
   ```
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyD_ICI_VOTRE_VRAIE_CLE_API
   GOOGLE_MAPS_API_KEY=AIzaSyD_ICI_VOTRE_VRAIE_CLE_API
   PORT=3001
   SESSION_SECRET=ma_cle_secrete_aleatoire_123456
   ```

5. **Remplacez `AIzaSyD_ICI_VOTRE_VRAIE_CLE_API`** par votre vraie clé API (sans les underscores, juste votre clé)
6. Enregistrez (Cmd + S) et fermez TextEdit

### Option B : Via Cursor/VSCode

1. Dans Cursor, dans le panneau de gauche, vous devriez voir le fichier `.env`
   - Si vous ne le voyez pas, cliquez sur l'icône pour afficher les fichiers cachés (ou utilisez Cmd + Shift + .)

2. Ouvrez le fichier `.env`

3. Le contenu doit être exactement :
   ```
   VITE_GOOGLE_MAPS_API_KEY=votre_cle_api_ici
   GOOGLE_MAPS_API_KEY=votre_cle_api_ici
   PORT=3001
   SESSION_SECRET=ma_cle_secrete
   ```

4. Remplacez `votre_cle_api_ici` par votre vraie clé API
5. Enregistrez (Cmd + S)

---

## ✅ Étape 5 : Vérifier que ça Fonctionne

1. **Arrêtez l'application** (Ctrl + C dans le terminal)
2. **Relancez** avec `npm run dev`
3. **Rafraîchissez votre navigateur** (Cmd + R)
4. La carte devrait s'afficher !

---

## 🐛 Problèmes Courants

### ❌ "Le fichier .env ne s'affiche pas dans Cursor"

Les fichiers qui commencent par un point sont cachés par défaut.

**Solution :**
- Dans Cursor, utilisez Cmd + Shift + P
- Tapez "Toggle Excluded Files" et activez-le
- Ou utilisez la méthode Terminal pour éditer le fichier

### ❌ "J'ai modifié le .env mais ça ne change rien"

**C'est normal !** Vous devez **redémarrer l'application** après chaque modification du .env.

1. Arrêtez l'app (Ctrl + C)
2. Relancez (npm run dev)
3. Rafraîchissez le navigateur

### ❌ "J'ai mis la clé API mais il y a toujours un message d'erreur"

**Vérifiez :**
1. Pas d'espaces autour du `=` : `VITE_GOOGLE_MAPS_API_KEY=ma_cle` (pas `VITE_GOOGLE_MAPS_API_KEY = ma_cle`)
2. Pas de guillemets : `VITE_GOOGLE_MAPS_API_KEY=ma_cle` (pas `VITE_GOOGLE_MAPS_API_KEY="ma_cle"`)
3. Le nom de la variable est exactement `VITE_GOOGLE_MAPS_API_KEY` (en majuscules)
4. Vous avez bien redémarré l'application après modification

### ❌ "Je ne sais pas où trouver ma clé API"

Consultez le guide : `GUIDE_CLE_API_GOOGLE.md`

### ❌ "L'application tourne mais je ne vois pas la carte"

Vérifiez :
1. Que votre clé API est bien dans le fichier `.env`
2. Que vous avez redémarré l'application
3. Ouvrez la console du navigateur (F12 > Console) pour voir les erreurs
4. Vérifiez que votre clé API est bien active dans Google Cloud Console

---

## 🔍 Vérification Rapide

Pour vérifier que votre fichier .env est bien configuré, dans le terminal, tapez :

```bash
cd /Users/thomas.s/Desktop/app
grep VITE_GOOGLE_MAPS_API_KEY .env
```

Vous devriez voir quelque chose comme :
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrstuvw
```

Si vous voyez votre clé, c'est bon ! Il faut juste redémarrer l'application.

---

## 💡 Astuce

**Le fichier .env est sensible**, ne le partagez jamais publiquement (c'est pour ça qu'il est dans .gitignore).

Une fois configuré correctement, vous ne devriez plus voir le message d'erreur ! 🎉





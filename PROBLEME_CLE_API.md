# ⚠️ Problème de Clé API - Restrictions de Référent

## Le Problème

Vous avez cette erreur :
```
API keys with referer restrictions cannot be used with this API.
```

Cela signifie que votre clé API Google Maps a des **restrictions HTTP (référent)** qui empêchent son utilisation côté serveur.

## Solution

Dans Google Cloud Console :

1. Allez dans **APIs et services** > **Identifiants**
2. Cliquez sur votre clé API
3. Sous **"Restrictions d'application"**, vous avez probablement :
   - **Sites web HTTP** avec `http://localhost:5173`

4. **Solution recommandée** :
   - Créez **2 clés API différentes** :
     - **Clé 1** (pour le frontend) : Restrictions HTTP → `http://localhost:5173`
     - **Clé 2** (pour le backend) : **Aucune restriction** (ou restriction par adresse IP si vous avez une IP fixe)
   
5. Utilisez :
   - Clé 1 dans le fichier `.env` comme `VITE_GOOGLE_MAPS_API_KEY` (frontend)
   - Clé 2 dans le fichier `.env` comme `GOOGLE_MAPS_API_KEY` (backend)

**⚠️ Important :** Pour la production, utilisez toujours des restrictions appropriées pour la sécurité !




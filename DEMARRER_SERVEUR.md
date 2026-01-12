# 🚀 Comment Démarrer le Serveur Backend

## ❌ Problème

Vous voyez l'erreur : **"Le serveur backend n'est pas accessible. Vérifiez qu'il est démarré sur le port 3001."**

Cela signifie que le serveur backend n'est pas démarré.

## ✅ Solution : Démarrer le Serveur

### Option 1 : Démarrer les Deux Serveurs (Frontend + Backend)

**Dans un terminal, à la racine du projet :**

```bash
cd /Users/thomas.s/Desktop/app
npm run dev
```

Cette commande démarre :
- ✅ Le serveur backend sur `http://localhost:3001`
- ✅ Le serveur frontend sur `http://localhost:5173`

### Option 2 : Démarrer les Serveurs Séparément

**Terminal 1 - Backend :**
```bash
cd /Users/thomas.s/Desktop/app
npm run dev:server
```

**Terminal 2 - Frontend :**
```bash
cd /Users/thomas.s/Desktop/app
npm run dev:client
```

## 🔍 Vérification

### Comment savoir si le serveur est démarré ?

1. **Vérifiez les logs dans le terminal** :
   - Vous devriez voir : `✅ Base de données initialisée`
   - Vous devriez voir : `Serveur démarré sur le port 3001`

2. **Testez l'API directement** :
   ```bash
   curl http://localhost:3001/api/test
   ```
   Vous devriez recevoir une réponse.

3. **Vérifiez dans le navigateur** :
   - Ouvrez http://localhost:3001/api/test
   - Vous devriez voir une réponse JSON

## ⚠️ Problèmes Courants

### Le port 3001 est déjà utilisé

**Erreur :** `EADDRINUSE: address already in use :::3001`

**Solution :**
1. Trouvez le processus qui utilise le port :
   ```bash
   lsof -ti:3001
   ```
2. Arrêtez-le :
   ```bash
   kill -9 $(lsof -ti:3001)
   ```
3. Redémarrez le serveur

### Le serveur démarre mais l'application ne se connecte pas

**Vérifiez :**
1. Le serveur backend est bien sur le port 3001
2. Le frontend est bien sur le port 5173
3. Aucun firewall ne bloque les connexions
4. Les deux serveurs sont démarrés

### Erreur de base de données

**Si vous voyez :** `❌ Erreur initialisation base de données`

**Solution :**
1. Vérifiez que le fichier `database.db` existe
2. Vérifiez les permissions du dossier
3. Redémarrez le serveur

## 📋 Checklist de Démarrage

Avant d'utiliser l'application :

- [ ] Serveur backend démarré (`npm run dev:server`)
- [ ] Serveur frontend démarré (`npm run dev:client`)
- [ ] Message "✅ Base de données initialisée" visible
- [ ] Message "Serveur démarré sur le port 3001" visible
- [ ] Application accessible sur http://localhost:5173
- [ ] Pas d'erreurs dans la console du navigateur

## 🎯 Commande Rapide

**Pour tout démarrer d'un coup :**

```bash
cd /Users/thomas.s/Desktop/app
npm run dev
```

Puis ouvrez http://localhost:5173 dans votre navigateur.

---

**Une fois le serveur démarré, l'erreur disparaîtra ! ✅**


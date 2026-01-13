# 🔄 Guide de Restauration d'un Backup

Ce guide vous explique comment restaurer une version précédente de l'application si vous rencontrez un problème.

## ⚠️ Quand restaurer un backup ?

- Après une modification qui a cassé l'application
- Pour revenir à une version stable précédente
- Après une erreur de manipulation

## 📋 Étapes de restauration

### 1️⃣ Arrêter l'application

Si l'application est en cours d'exécution, appuyez sur `Ctrl+C` dans le terminal.

### 2️⃣ Identifier le backup à restaurer

Listez les backups disponibles :

```bash
ls -la backups/
```

Choisissez le backup que vous souhaitez restaurer (exemple : `v1.1.0_20251229_192440`)

### 3️⃣ Sauvegarder l'état actuel (optionnel mais recommandé)

Au cas où vous voudriez revenir en arrière :

```bash
mkdir -p backups/avant_restauration_$(date +%Y%m%d_%H%M%S)
cp -r client backups/avant_restauration_$(date +%Y%m%d_%H%M%S)/
cp -r server backups/avant_restauration_$(date +%Y%m%d_%H%M%S)/
cp package.json backups/avant_restauration_$(date +%Y%m%d_%H%M%S)/
```

### 4️⃣ Restaurer les fichiers

**⚠️ Remplacez `v1.1.0_20251229_192440` par le nom de votre backup !**

```bash
# Restaurer le dossier client
rm -rf client/*
cp -r backups/v1.1.0_20251229_192440/client/* client/

# Restaurer le dossier server
rm -rf server/*
cp -r backups/v1.1.0_20251229_192440/server/* server/

# Restaurer les fichiers de configuration
cp backups/v1.1.0_20251229_192440/package.json .
cp backups/v1.1.0_20251229_192440/.env . 2>/dev/null || echo "⚠️ .env non trouvé dans le backup (normal si vous l'avez modifié)"
```

### 5️⃣ Réinstaller les dépendances

```bash
npm run install:all
```

### 6️⃣ Redémarrer l'application

```bash
npm run dev
```

## 🗄️ Restaurer la base de données (optionnel)

Si vous avez sauvegardé la base de données séparément :

```bash
# Sauvegarder la base actuelle
cp server/database.db server/database.db.backup

# Restaurer l'ancienne base
cp backups/v1.1.0_20251229_192440/server/database.db server/database.db
```

**⚠️ Attention** : Restaurer une ancienne base de données effacera toutes les données ajoutées depuis ce backup (producteurs inscrits, statistiques, etc.)

## ✅ Vérification

Après la restauration :

1. ✅ Vérifiez que l'application démarre sans erreur
2. ✅ Testez les fonctionnalités principales
3. ✅ Vérifiez que la version est correcte (`package.json`)

## 🆘 En cas de problème

Si la restauration ne fonctionne pas :

1. Vérifiez que vous avez bien réinstallé les dépendances
2. Vérifiez les logs d'erreur dans le terminal
3. Assurez-vous que le backup est complet (vérifiez `BACKUP_INFO.txt`)
4. Si nécessaire, contactez le support avec les logs d'erreur

## 💡 Bonnes pratiques

- ✅ Testez toujours sur une copie avant de restaurer sur la version de production
- ✅ Gardez plusieurs backups récents
- ✅ Notez les changements importants dans `BACKUP_INFO.txt`





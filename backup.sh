#!/bin/bash
# ============================================
# SCRIPT DE BACKUP DE L'APPLICATION
# ============================================
# Ce script crée une copie de sauvegarde de l'application
# avec la version et la date

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Lire la version depuis package.json
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="v${VERSION}_${DATE}"
BACKUP_DIR="backups/${BACKUP_NAME}"

echo -e "${BLUE}📦 Création du backup: ${BACKUP_NAME}${NC}"

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"

# Copier les fichiers importants (exclure node_modules, backups, .git, etc.)
echo "📁 Copie des fichiers..."

# Copier le dossier client (sans node_modules)
echo "  - Copie du dossier client..."
mkdir -p "$BACKUP_DIR/client"
if command -v rsync &> /dev/null; then
  rsync -av --exclude='node_modules' --exclude='dist' --exclude='.vite' --exclude='.DS_Store' \
    client/ "$BACKUP_DIR/client/" 2>/dev/null
else
  find client -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.vite/*" -not -name ".DS_Store" -exec cp --parents {} "$BACKUP_DIR/" \; 2>/dev/null || \
  (cd client && find . -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.vite/*" -exec sh -c 'mkdir -p "$2/$(dirname "$1")" && cp "$1" "$2/$1"' _ {} "../$BACKUP_DIR/client" \;) 2>/dev/null
fi

# Copier le dossier server (sans node_modules et sans database.db par défaut)
echo "  - Copie du dossier server..."
mkdir -p "$BACKUP_DIR/server"
if command -v rsync &> /dev/null; then
  rsync -av --exclude='node_modules' --exclude='*.db' --exclude='.DS_Store' \
    server/ "$BACKUP_DIR/server/" 2>/dev/null
else
  find server -type f -not -path "*/node_modules/*" -not -name "*.db" -not -name ".DS_Store" -exec cp --parents {} "$BACKUP_DIR/" \; 2>/dev/null || \
  (cd server && find . -type f -not -path "*/node_modules/*" -not -name "*.db" -exec sh -c 'mkdir -p "$2/$(dirname "$1")" && cp "$1" "$2/$1"' _ {} "../$BACKUP_DIR/server" \;) 2>/dev/null
fi

# Copier les fichiers racine importants
echo "  - Copie des fichiers de configuration..."
cp package.json "$BACKUP_DIR/" 2>/dev/null
cp .gitignore "$BACKUP_DIR/" 2>/dev/null
cp README.md "$BACKUP_DIR/" 2>/dev/null
cp .env "$BACKUP_DIR/" 2>/dev/null

# Créer un fichier INFO avec les détails du backup
cat > "$BACKUP_DIR/BACKUP_INFO.txt" << EOF
============================================
BACKUP DE L'APPLICATION
============================================
Date: $(date)
Version: ${VERSION}
Backup: ${BACKUP_NAME}

Description:
Backup complet de l'application producteurs locaux.

Contenu:
- Code source client (React)
- Code source server (Node.js/Express)
- Configuration (package.json, .env)
- Documentation (README.md)

Pour restaurer ce backup:
1. Arrêter l'application
2. Copier le contenu de ce dossier à la racine
3. Réinstaller les dépendances: npm install && cd client && npm install
4. Redémarrer: npm run dev
============================================
EOF

echo -e "${GREEN}✅ Backup créé avec succès dans: ${BACKUP_DIR}${NC}"
echo -e "${BLUE}📄 Informations sauvegardées dans: ${BACKUP_DIR}/BACKUP_INFO.txt${NC}"

# Lister les backups existants
echo ""
echo -e "${BLUE}📚 Backups disponibles:${NC}"
ls -1 backups/ 2>/dev/null | tail -5


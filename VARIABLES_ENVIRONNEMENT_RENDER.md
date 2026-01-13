# 🔐 Variables d'Environnement pour Render

## 📋 Liste Complète

Copiez-collez ces variables dans **Render Dashboard > Environment** :

### ⚠️ OBLIGATOIRES

```bash
NODE_ENV=production
PORT=10000
SESSION_SECRET=GÉNÉREZ_UNE_CLÉ_ALÉATOIRE_32_CARACTÈRES
JWT_SECRET=GÉNÉREZ_UNE_AUTRE_CLÉ_ALÉATOIRE_32_CARACTÈRES
VITE_GOOGLE_MAPS_API_KEY=VOTRE_CLÉ_GOOGLE_MAPS
GOOGLE_MAPS_API_KEY=VOTRE_CLÉ_GOOGLE_MAPS
```

### 📝 Recommandées

```bash
FRONTEND_URL=https://producteurs-locaux.onrender.com
```

### 💳 Optionnelles (Stripe)

```bash
STRIPE_SECRET_KEY=sk_live_VOTRE_CLÉ_STRIPE
STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLÉ_STRIPE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK
```

---

## 🔑 Comment Générer les Clés Secrètes

### Sur Mac/Linux (Terminal)

```bash
# Pour SESSION_SECRET
openssl rand -base64 32

# Pour JWT_SECRET (générez une autre clé différente)
openssl rand -base64 32
```

### En Ligne

- [RandomKeygen.com](https://randomkeygen.com/)
- [Generate Secret Key](https://generate-secret.vercel.app/32)

---

## 📝 Instructions d'Installation

1. **Allez sur Render Dashboard**
   - Ouvrez votre service `producteurs-locaux`
   - Cliquez sur **"Environment"** dans le menu de gauche

2. **Ajoutez chaque variable** :
   - Cliquez sur **"Add Environment Variable"**
   - Entrez le **Key** (ex: `SESSION_SECRET`)
   - Entrez la **Value** (ex: la clé générée)
   - Cliquez sur **"Save Changes"**

3. **Répétez pour toutes les variables**

4. **Redéployez** :
   - Render redéploiera automatiquement après avoir sauvegardé les variables
   - Ou cliquez sur **"Manual Deploy"** > **"Deploy latest commit"**

---

## ✅ Vérification

Après avoir ajouté les variables, vérifiez dans les **Logs Render** :

```
✅ Base de données initialisée
🚀 Serveur démarré sur http://localhost:10000
```

Si vous voyez des erreurs liées à `SESSION_SECRET` ou `JWT_SECRET`, vérifiez que les variables sont bien définies.

---

## ⚠️ Important

- **Ne partagez jamais** vos clés secrètes publiquement
- **Utilisez des valeurs différentes** pour `SESSION_SECRET` et `JWT_SECRET`
- **Générez de nouvelles clés** pour la production (ne réutilisez pas celles du développement)
- Les variables `VITE_*` doivent être définies pour que le build frontend les inclue

---

## 🔄 Mise à Jour

Si vous devez modifier une variable :

1. Allez dans **Environment**
2. Cliquez sur la variable à modifier
3. Modifiez la valeur
4. Cliquez sur **"Save Changes"**
5. Render redéploiera automatiquement


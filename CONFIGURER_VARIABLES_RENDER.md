# 🔧 Configurer les Variables d'Environnement sur Render

## ⚠️ Important

Pour que la connexion fonctionne correctement, vous devez configurer les variables d'environnement dans Render.

---

## 📋 Variables à Configurer

### Dans Render :

1. **Allez dans votre service** `producteurs-locaux`
2. **Cliquez sur "Environment"** (dans le menu de gauche)
3. **Ajoutez ces variables** :

```
NODE_ENV=production
PORT=10000
SESSION_SECRET=votre_secret_aleatoire_ici_changez_moi
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBdv8rn-Nn_2_LRCC8BG5G4ymbHU0Dvg7Y
GOOGLE_MAPS_API_KEY=AIzaSyBdv8rn-Nn_2_LRCC8BG5G4ymbHU0Dvg7Y
```

---

## 🔑 Générer un SESSION_SECRET

### Sur Mac/Linux :

```bash
openssl rand -hex 32
```

### Ou en ligne :

Allez sur : https://randomkeygen.com/ (utilisez "CodeIgniter Encryption Keys")

---

## ✅ Vérification

Après avoir ajouté les variables :

1. **Render va automatiquement redéployer**
2. **Attendez 5-10 minutes**
3. **Essayez de vous connecter à nouveau**

---

## 📧 Note sur l'Email de Confirmation

L'email de confirmation est **simulé** (mock) dans le code actuel. Vous pouvez vous connecter directement après l'inscription, même sans confirmer l'email.

---

**Configurez les variables d'environnement dans Render et redéployez ! 🚀**


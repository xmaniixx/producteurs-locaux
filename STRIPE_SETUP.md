# Configuration Stripe - Plan Pro

## 📋 Prérequis

1. Créer un compte Stripe : https://stripe.com
2. Récupérer vos clés API dans Stripe Dashboard > Developers > API keys
3. Créer un produit et un prix pour le Plan Pro

## 🔧 Configuration

### 1. Variables d'environnement

**IMPORTANT :** Les fichiers `.env` sont dans `.gitignore` et ne doivent JAMAIS être commités.

#### Backend (server/.env)

Créer un fichier `server/.env` en copiant `server/.env.example` :

```bash
# Copier le fichier exemple
cp server/.env.example server/.env

# Éditer server/.env et ajouter vos clés :
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
STRIPE_PRICE_ID_PRO=price_votre_price_id
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret
FRONTEND_URL=http://localhost:5173
```

**⚠️ SÉCURITÉ :** Ne jamais commiter le fichier `server/.env` avec de vraies clés.

### 2. Créer le produit dans Stripe Dashboard

1. Aller dans **Products** > **Add product**
2. Nom : "Plan Pro"
3. **Prix : 9,99 €** (⚠️ Attention : pas 99,99€ !)
4. **Billing period** : Monthly (recurring)
5. Copier le **Price ID** (format: `price_1234567890`)
6. Ajouter ce Price ID dans `server/.env` comme `STRIPE_PRICE_ID_PRO`

### 3. Configurer Apple Pay et Google Pay

#### Apple Pay
1. Aller dans **Settings** > **Payment methods** > **Apple Pay**
2. Ajouter votre domaine
3. Télécharger et héberger le fichier de vérification
4. Apple Pay sera automatiquement disponible dans Checkout

#### Google Pay
- Activé automatiquement par Stripe
- Aucune configuration supplémentaire nécessaire

### 4. Configurer le Webhook

1. Aller dans **Developers** > **Webhooks** > **Add endpoint**
2. URL : `https://votre-domaine.com/api/stripe/webhook`
3. Événements à écouter :
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copier le **Signing secret** (format: `whsec_...`)
5. Ajouter ce secret dans `.env` comme `STRIPE_WEBHOOK_SECRET`

### 5. Installation

```bash
npm install
```

## 🧪 Mode Test

En mode test, utilisez les cartes de test Stripe :
- Carte réussie : `4242 4242 4242 4242`
- Date : n'importe quelle date future
- CVC : n'importe quel 3 chiffres
- Code postal : n'importe quel code postal

## 🚀 Production

1. Passer en mode **Live** dans Stripe Dashboard
2. Récupérer les clés **Live** (sk_live_...)
3. Mettre à jour `.env` avec les clés Live
4. Configurer le webhook avec l'URL de production
5. Vérifier que `FRONTEND_URL` pointe vers votre domaine de production

## 📝 Notes importantes

- **NE JAMAIS** commiter le fichier `.env`
- Le webhook **DOIT** être en HTTPS en production
- Stripe gère automatiquement Apple Pay et Google Pay si configurés
- Les prix sont définis uniquement côté backend (sécurité)

## 🔍 Vérification

1. Tester le paiement avec une carte de test
2. Vérifier dans Stripe Dashboard que l'événement `checkout.session.completed` est reçu
3. Vérifier dans la base de données que `subscriptions.plan = 'pro'`
4. Vérifier que le dashboard affiche les stats premium


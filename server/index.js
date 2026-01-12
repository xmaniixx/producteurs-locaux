// ============================================
// SERVEUR PRINCIPAL - API Backend
// ============================================
// Ce fichier gère toutes les requêtes de l'application
// Il communique avec la base de données et les APIs externes

// IMPORTANT: Charger dotenv EN PREMIER, avant tous les autres imports
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env depuis le dossier server AVANT tous les autres imports
dotenv.config({ path: join(__dirname, '.env') });

// Maintenant on peut importer les autres modules qui utilisent process.env
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { initDatabase } from './database.js';
import { authRoutes } from './routes/auth.js';
import { producteurRoutes } from './routes/producteurs.js';
import { producteurRoutes as producteurAccountRoutes } from './routes/producteur.js';
import { statsRoutes } from './routes/stats.js';
import { utilisateurRoutes } from './routes/utilisateurs.js';
import { stripeRoutes, stripeWebhookRouter } from './routes/stripe.js';
import resetSubscriptionRoutes from './routes/reset-subscription.js';


const app = express();
const PORT = process.env.PORT || 3001;

// Configuration CORS pour permettre au frontend de communiquer avec le backend
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      'https://producteurs-locaux.vercel.app' // Remplacez par votre domaine
    ].filter(Boolean)
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Webhook Stripe - DOIT être AVANT express.json() car Stripe envoie raw body
// Le middleware express.raw() est déjà dans la route stripeWebhookRouter
app.use('/api/stripe/webhook', stripeWebhookRouter);

// Parser JSON pour lire les données envoyées par le frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration des sessions pour garder les utilisateurs connectés
app.use(session({
  secret: process.env.SESSION_SECRET || 'changez_cette_cle_secrete',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // true en production avec HTTPS
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 jours
  }
}));

// Servir les fichiers statiques du dossier uploads
const uploadsPath = join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));
console.log('📁 Dossier uploads servi depuis:', uploadsPath);

// Servir les fichiers statiques du client buildé (production uniquement)
// Vérifier si on est en production OU si le dossier dist existe
const clientDistPath = join(__dirname, '..', 'client', 'dist');
const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === undefined;
const distExists = existsSync(clientDistPath);

if (isProduction || distExists) {
  // Servir les fichiers statiques (CSS, JS, images, etc.)
  // IMPORTANT: Servir AVANT les routes API pour éviter les conflits
  app.use(express.static(clientDistPath, {
    maxAge: '1y', // Cache les fichiers statiques pendant 1 an
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      // Définir les headers appropriés pour les fichiers statiques
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      }
    }
  }));
  console.log('📦 Fichiers statiques du client servis depuis:', clientDistPath);
  console.log('📦 NODE_ENV:', process.env.NODE_ENV || 'non défini');
  console.log('📦 dist existe:', distExists);
}

// Initialiser la base de données avec gestion d'erreur
try {
  const db = initDatabase();
  if (db) {
    console.log('✅ Base de données initialisée');
  }
} catch (error) {
  console.error('❌ Erreur initialisation base de données:', error.message);
  console.error('   Détails:', error);
  process.exit(1);
}

// Vérifier la configuration Stripe au démarrage (message informatif uniquement)
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey || stripeKey.trim() === '') {
  console.log('');
  console.log('ℹ️  INFORMATION: Stripe n\'est pas encore configuré');
  console.log('   Pour activer les paiements:');
  console.log('   1. Copiez server/ENV_TEMPLATE.txt vers server/.env');
  console.log('   2. Ajoutez vos clés Stripe dans server/.env');
  console.log('   3. Redémarrez le serveur');
  console.log('   Voir CONFIGURATION_ENV.md pour plus de détails');
  console.log('');
}

// Routes de l'application
app.use('/api/auth', authRoutes); // Routes producteur (anciennes, à garder pour compatibilité)
app.use('/api/utilisateur', utilisateurRoutes); // Routes utilisateur (nouvelles)
app.use('/api/producteurs', producteurRoutes);
app.use('/api/producteur', producteurAccountRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/stripe', stripeRoutes); // Routes Stripe
app.use('/api/test', resetSubscriptionRoutes); // Routes de test (mode développement)

// Route de test pour vérifier que le serveur fonctionne
app.get('/api/test', (req, res) => {
  res.json({ message: 'Serveur fonctionnel !' });
});

// En production, servir index.html pour toutes les routes qui ne sont pas des routes API
// Cela permet au routing côté client (React Router) de fonctionner
// IMPORTANT: Ce middleware doit être APRÈS les routes API mais AVANT le gestionnaire d'erreur 404
if (isProduction || distExists) {
  app.get('*', (req, res, next) => {
    // Si c'est une route API, passer au gestionnaire d'erreur 404
    if (req.path.startsWith('/api')) {
      return next();
    }
    // Si c'est un fichier statique (assets, manifest, etc.), laisser express.static le gérer
    if (req.path.startsWith('/assets/') || 
        req.path.startsWith('/manifest.json') || 
        req.path.startsWith('/sw.js') ||
        req.path.startsWith('/icon-') ||
        req.path.endsWith('.js') ||
        req.path.endsWith('.css') ||
        req.path.endsWith('.png') ||
        req.path.endsWith('.jpg') ||
        req.path.endsWith('.svg')) {
      return next(); // Laisser express.static gérer ces fichiers
    }
    // Sinon, servir index.html pour le routing côté client
    const indexPath = join(clientDistPath, 'index.html');
    if (existsSync(indexPath)) {
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('❌ Erreur lors de l\'envoi de index.html:', err);
          next(err);
        }
      });
    } else {
      console.error('❌ index.html non trouvé dans:', indexPath);
      next();
    }
  });
}

// Gestion d'erreur globale pour les routes non trouvées (DOIT être après toutes les routes)
app.use((req, res) => {
  // En production, on ne devrait pas arriver ici pour les routes non-API
  // car elles sont gérées par le bloc ci-dessus
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Route API non trouvée' });
  } else {
    res.status(404).json({ error: 'Route non trouvée' });
  }
});

// Gestion d'erreur globale pour les erreurs serveur (DOIT être en dernier)
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Erreur: Le port ${PORT} est déjà utilisé`);
    console.error(`   Arrêtez le processus utilisant ce port ou changez PORT dans .env`);
  } else {
    console.error(`❌ Erreur lors du démarrage du serveur:`, err);
  }
  process.exit(1);
});


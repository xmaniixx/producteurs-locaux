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
// En production sur Render, frontend et backend sont sur le MÊME domaine
// donc on autorise toutes les origines du même domaine
const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === undefined;

app.use(cors({
  origin: (origin, callback) => {
    // En production sur Render, frontend et backend sont sur le même domaine
    // Donc on autorise toutes les requêtes du même domaine
    if (isProduction) {
      // Autoriser les requêtes sans origine (même domaine)
      if (!origin) {
        console.log('🌐 [CORS] Requête sans origine (même domaine - allowed)');
        return callback(null, true);
      }
      
      // Autoriser toutes les origines Render (même domaine)
      if (origin.includes('onrender.com') || origin.includes('render.com')) {
        console.log('✅ [CORS] Origine Render autorisée:', origin);
        return callback(null, true);
      }
      
      // Autoriser aussi les autres origines configurées
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://producteurs-locaux.onrender.com',
        'https://producteurs-locaux.vercel.app'
      ].filter(Boolean);
      
      if (allowedOrigins.includes(origin)) {
        console.log('✅ [CORS] Origine autorisée:', origin);
        return callback(null, true);
      }
      
      console.log('⚠️ [CORS] Origine non reconnue mais autorisée:', origin);
      callback(null, true); // Autoriser par défaut en production (même domaine)
    } else {
      // En développement, autoriser toutes les origines
      console.log('🌐 [CORS] Développement - origine autorisée:', origin || 'sans origine');
      callback(null, true);
    }
  },
  credentials: true, // CRITIQUE : autoriser les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'] // Exposer les headers de cookies
}));

// Webhook Stripe - DOIT être AVANT express.json() car Stripe envoie raw body
// Le middleware express.raw() est déjà dans la route stripeWebhookRouter
app.use('/api/stripe/webhook', stripeWebhookRouter);

// Parser JSON pour lire les données envoyées par le frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration des sessions pour garder les utilisateurs connectés
// En production sur Render, frontend et backend sont sur le même domaine
const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === undefined;
app.use(session({
  secret: process.env.SESSION_SECRET || 'changez_cette_cle_secrete',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Nom du cookie de session
  cookie: { 
    secure: isProduction, // true en production avec HTTPS
    sameSite: isProduction ? 'lax' : 'lax', // 'lax' car frontend et backend sont sur le même domaine
    httpOnly: true, // Empêche l'accès JavaScript au cookie (sécurité)
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
    // NE PAS spécifier domain pour que le cookie fonctionne sur le même domaine
    // path: '/' pour que le cookie soit disponible sur toutes les routes
    path: '/'
  }
}));

// Middleware de débogage pour les sessions (toujours actif pour diagnostiquer)
app.use((req, res, next) => {
  // Logs détaillés pour toutes les requêtes
  console.log('🔍 [REQUEST DEBUG]', {
    method: req.method,
    path: req.path,
    sessionID: req.sessionID,
    utilisateurId: req.session?.utilisateurId,
    cookies: req.headers.cookie || 'AUCUN COOKIE',
    origin: req.headers.origin || 'AUCUNE ORIGINE',
    referer: req.headers.referer || 'AUCUN REFERER',
    host: req.headers.host,
    'user-agent': req.headers['user-agent']?.substring(0, 50)
  });
  next();
});

// Servir les fichiers statiques du dossier uploads
const uploadsPath = join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));
console.log('📁 Dossier uploads servi depuis:', uploadsPath);

// Définir le chemin du client dist (utilisé plus tard)
const clientDistPath = join(__dirname, '..', 'client', 'dist');
const distExists = existsSync(clientDistPath);

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

// Servir les fichiers statiques du client APRÈS les routes API mais AVANT le catch-all
// Cela permet aux routes API d'avoir la priorité
if (isProduction || distExists) {
  console.log('📦 Configuration des fichiers statiques...');
  console.log('📦 Chemin dist:', clientDistPath);
  console.log('📦 NODE_ENV:', process.env.NODE_ENV || 'non défini');
  console.log('📦 dist existe:', distExists);
  
  // Servir les fichiers statiques avec express.static
  // fallthrough: true permet de continuer au middleware suivant si le fichier n'existe pas
  app.use(express.static(clientDistPath, {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    dotfiles: 'ignore',
    index: false, // Ne pas servir index.html automatiquement
    fallthrough: true // Continuer au middleware suivant si le fichier n'existe pas
  }));
  
  console.log('✅ Fichiers statiques configurés');
}

// En production, servir index.html pour toutes les routes qui ne sont pas des routes API
// Cela permet au routing côté client (React Router) de fonctionner
// IMPORTANT: Ce middleware doit être APRÈS les routes API mais AVANT le gestionnaire d'erreur 404
if (isProduction || distExists) {
  app.get('*', (req, res, next) => {
    // Si c'est une route API, passer au gestionnaire d'erreur 404
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    // Si c'est un fichier statique, NE PAS le traiter ici
    // express.static l'a déjà traité s'il existe
    // Si res.headersSent est false, c'est que le fichier n'existe pas - retourner 404
    if (req.path.startsWith('/assets/') || 
        req.path === '/manifest.json' || 
        req.path === '/sw.js' ||
        req.path.startsWith('/icon-') ||
        req.path.endsWith('.js') ||
        req.path.endsWith('.css') ||
        req.path.endsWith('.png') ||
        req.path.endsWith('.jpg') ||
        req.path.endsWith('.svg') ||
        req.path.endsWith('.json')) {
      // Si le fichier statique n'a pas été servi par express.static, retourner 404
      if (!res.headersSent) {
        return res.status(404).send('File not found');
      }
      // Le fichier a été servi, ne rien faire
      return;
    }
    
    // Pour toutes les autres routes (HTML), servir index.html pour le routing côté client
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


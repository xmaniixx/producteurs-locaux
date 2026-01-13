// ============================================
// MIDDLEWARE AUTHENTIFICATION JWT
// ============================================
// Gère l'authentification via JWT tokens

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise_changez_en_production';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('\n🔐 Middleware authenticateToken');
  console.log('   - Authorization header:', authHeader ? 'présent' : 'ABSENT');
  console.log('   - Token:', token ? 'présent' : 'ABSENT');

  if (!token) {
    console.log('❌ Token manquant - 401');
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Token invalide - 403:', err.message);
      return res.status(403).json({ error: 'Token invalide' });
    }

    console.log('✅ Token valide - userId:', user.userId);
    req.userId = user.userId;
    next();
  });
};




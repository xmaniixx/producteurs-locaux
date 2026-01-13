// ============================================
// API WRAPPER - Fonction fetch avec credentials toujours inclus
// ============================================
// Cette fonction garantit que TOUTES les requêtes incluent credentials: 'include'
// pour que les cookies de session soient transmis au backend

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

/**
 * Fonction wrapper pour fetch qui inclut toujours credentials: 'include'
 * @param {string} endpoint - L'endpoint API (ex: '/api/utilisateur/verifier')
 * @param {object} options - Options supplémentaires pour fetch
 * @returns {Promise<Response>} La réponse de fetch
 */
export const fetchAPI = async (endpoint, options = {}) => {
  // Construire l'URL complète
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_URL}${endpoint}`;

  // Configuration par défaut avec credentials toujours inclus
  const config = {
    credentials: 'include', // CRITICAL : toujours inclure les cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
    // S'assurer que credentials n'est pas écrasé
    credentials: 'include',
  };

  console.log('🌐 [fetchAPI]', {
    method: config.method || 'GET',
    url,
    hasCredentials: config.credentials === 'include'
  });

  const response = await fetch(url, config);
  return response;
};

/**
 * Fonction helper pour les requêtes GET
 */
export const get = async (endpoint, options = {}) => {
  return fetchAPI(endpoint, { ...options, method: 'GET' });
};

/**
 * Fonction helper pour les requêtes POST
 */
export const post = async (endpoint, data, options = {}) => {
  return fetchAPI(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Fonction helper pour les requêtes PUT
 */
export const put = async (endpoint, data, options = {}) => {
  return fetchAPI(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Fonction helper pour les requêtes DELETE
 */
export const del = async (endpoint, options = {}) => {
  return fetchAPI(endpoint, { ...options, method: 'DELETE' });
};

export default {
  fetchAPI,
  get,
  post,
  put,
  delete: del
};


// Configuration de l'API selon l'environnement
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// URL de l'API backend
// En production sur Render, frontend et backend sont sur le même domaine
// donc on utilise des URLs relatives
export const API_URL = isProduction
  ? '' // URL relative - même domaine que le frontend
  : 'http://localhost:3001';

// Clé API Google Maps
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default {
  API_URL,
  GOOGLE_MAPS_API_KEY,
  isProduction,
  isDevelopment
};



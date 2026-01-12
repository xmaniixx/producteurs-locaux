// ============================================
// GOOGLE MAPS PROVIDER - Charge l'API une seule fois
// ============================================
// Utilise useJsApiLoader pour charger Google Maps une seule fois
// Fournit un contexte global pour toute l'application

import React, { createContext, useContext } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const GoogleMapsContext = createContext(null);

const LIBRARIES = ['places'];

export function GoogleMapsProvider({ children }) {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Ne charger que si la clé API est configurée et valide
  const shouldLoad = googleMapsApiKey && 
    typeof googleMapsApiKey === 'string' &&
    googleMapsApiKey !== 'votre_cle_api_ici' && 
    googleMapsApiKey.trim() !== '';

  // Toujours appeler le hook (règle des hooks React)
  // Passer une clé valide ou une clé factice (le hook gérera l'échec gracieusement)
  const { isLoaded: loaderIsLoaded, loadError: loaderError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: shouldLoad ? googleMapsApiKey : '',
    libraries: LIBRARIES,
    language: 'fr'
  });

  // Ne considérer comme chargé que si on devait charger ET que le loader a réussi
  const isLoaded = shouldLoad ? (loaderIsLoaded && !loaderError) : false;
  const loadError = shouldLoad ? loaderError : null;

  const value = {
    isLoaded,
    loadError,
    googleMapsApiKey: shouldLoad ? googleMapsApiKey : null
  };

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within GoogleMapsProvider');
  }
  return context;
}


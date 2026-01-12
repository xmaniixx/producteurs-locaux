// Point d'entrée de l'application React
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleMapsProvider } from './contexts/GoogleMapsProvider';
import './index.css';

// Supprimer les warnings WebSocket, CORS et Google Maps en développement (non bloquant)
// Ces erreurs apparaissent quand Vite se reconnecte, quand le serveur backend n'est pas démarré,
// ou quand Google Maps est en cours de chargement
if (import.meta.env.DEV) {
  // Gestionnaire d'erreurs global
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (message.includes('WebSocket') ||
        message.includes('Load failed') ||
        message.includes('access control checks') ||
        message.includes('CORS') ||
        message.includes("Can't find variable: google") ||
        message.includes('google.maps') ||
        message.includes('p.fJ')) {
      event.preventDefault();
      return false;
    }
  });
  
  // Gestionnaire de promesses rejetées
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason?.toString() || '';
    const errorMessage = String(message);
    if (errorMessage.includes('WebSocket') || 
        errorMessage.includes('Load failed') ||
        errorMessage.includes('access control checks') ||
        errorMessage.includes('CORS') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes("Can't find variable: google") ||
        errorMessage.includes('google.maps') ||
        errorMessage.includes('p.fJ') ||
        errorMessage.includes('undefined is not an object')) {
      event.preventDefault();
      return false;
    }
  });
}

// Enregistrer le Service Worker pour la PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker enregistré avec succès:', registration.scope);
      })
      .catch((error) => {
        console.log('Erreur enregistrement Service Worker:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleMapsProvider>
      <App />
    </GoogleMapsProvider>
  </React.StrictMode>
);


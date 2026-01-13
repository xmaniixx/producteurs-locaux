// ============================================
// PAGE D'ACCUEIL - Structure avec MapLayer et UiLayer
// ============================================
// Ne contient PLUS de logique Google Maps ni UI
// Utilise MapLayer.jsx et UiLayer.jsx séparément

import React, { useState, useEffect, useCallback, useRef } from 'react';
import MapLayer from '../components/MapLayer';
import UiLayer from '../components/UiLayer';
import './HomePage.css';

const defaultCenter = {
  lat: 46.6034, // Centre de la France
  lng: 2.2137
};

function HomePage() {
  console.log('🏠 HomePage - Rendu du composant');
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(false);
  // Vérifier si l'animation a déjà été vue pour cet utilisateur dans cette session
  const [showIntro, setShowIntro] = useState(() => {
    const currentUserId = sessionStorage.getItem('currentUserId');
    const lastSeenUserId = sessionStorage.getItem('introAnimationUserId');
    // Si l'utilisateur a changé ou si c'est la première visite, afficher l'animation
    if (!currentUserId || currentUserId !== lastSeenUserId) {
      console.log('🏠 HomePage - Animation intro activée');
      return true;
    }
    console.log('🏠 HomePage - Animation intro désactivée (déjà vue)');
    return false;
  });
  const [ville, setVille] = useState('');
  const [rayon, setRayon] = useState(30);
  const [producteurs, setProducteurs] = useState([]);
  const [centreCarte, setCentreCarte] = useState(defaultCenter);
  const [zoom, setZoom] = useState(6);
  const [currentZoom, setCurrentZoom] = useState(6);
  const [producteurSelectionne, setProducteurSelectionne] = useState(null);
  const [clusterSelectionne, setClusterSelectionne] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [rechercheEffectuee, setRechercheEffectuee] = useState(false);
  const mapRef = useRef(null);
  const boundsChangedTimeout = useRef(null);

  // Fonction pour charger tous les producteurs
  const chargerTousProducteurs = useCallback(async () => {
    setChargement(true);
    setErreur('');
    
    try {
      const response = await fetch('/api/producteurs/tous');
      const data = await response.json();
      
      if (data.error) {
        console.error('Erreur:', data.error);
        setProducteurs([]);
      } else {
        setProducteurs(data.producteurs || []);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      setProducteurs([]);
    } finally {
      setChargement(false);
    }
  }, []);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    console.log('🏠 HomePage - useEffect verifierConnexion déclenché');
    const verifierConnexion = async () => {
      console.log('🏠 HomePage - Début verifierConnexion');
      
      // Vérifier d'abord le token dans localStorage (plus rapide)
      const token = localStorage.getItem('token');
      console.log('🏠 HomePage - Token localStorage:', token ? '✅ Présent' : '❌ Absent');
      
      if (token) {
        console.log('🏠 HomePage - Token trouvé, utilisateur connecté automatiquement');
        setUtilisateurConnecte(true);
        return;
      }
      
      // Pas de token, vérifier la session via API
      try {
        console.log('🏠 HomePage - Pas de token, vérification session API');
        const response = await fetch('/api/utilisateur/verifier', {
          credentials: 'include'
        });
        console.log('🏠 HomePage - Réponse API:', { 
          status: response.status, 
          ok: response.ok 
        });
        
        // Vérifier si la réponse est OK avant de parser JSON
        if (!response.ok) {
          console.log('❌ HomePage - API retourne erreur, utilisateur non connecté');
          setUtilisateurConnecte(false);
          return;
        }
        
        const data = await response.json();
        console.log('🏠 HomePage - Données API:', data);
        const connected = data.connected || false;
        console.log('🏠 HomePage - Utilisateur connecté:', connected);
        setUtilisateurConnecte(connected);
        
        // Si l'utilisateur est connecté, vérifier si c'est un nouvel utilisateur
        if (data.connected && data.utilisateur && data.utilisateur.id) {
          console.log('🏠 HomePage - Utilisateur trouvé:', data.utilisateur.id);
          const currentUserId = String(data.utilisateur.id);
          const lastSeenUserId = sessionStorage.getItem('introAnimationUserId');
          
          // Si c'est un nouvel utilisateur (ID différent), réinitialiser l'animation
          if (currentUserId !== lastSeenUserId) {
            console.log('🏠 HomePage - Nouvel utilisateur détecté, réinitialisation animation');
            sessionStorage.setItem('currentUserId', currentUserId);
            sessionStorage.removeItem('introAnimationSeen');
            setShowIntro(true);
          }
        } else {
          console.log('🏠 HomePage - Pas d\'utilisateur dans la réponse');
        }
      } catch (error) {
        console.error('❌ HomePage - Erreur vérification connexion:', error);
        // En cas d'erreur, vérifier le token comme fallback
        const token = localStorage.getItem('token');
        if (token) {
          console.log('🏠 HomePage - Erreur mais token présent, authentification fallback');
          setUtilisateurConnecte(true);
        } else {
          console.log('❌ HomePage - Erreur et pas de token, utilisateur non connecté');
          setUtilisateurConnecte(false);
        }
      }
    };
    verifierConnexion();
  }, []);

  // Charger tous les producteurs au démarrage
  useEffect(() => {
    if (!utilisateurConnecte || showIntro || !mapLoaded) return;
    chargerTousProducteurs();
  }, [utilisateurConnecte, showIntro, mapLoaded, chargerTousProducteurs]);

  // Recharger les producteurs quand la fenêtre reprend le focus
  useEffect(() => {
    const handleFocus = () => {
      if (!showIntro && mapLoaded && !chargement) {
        chargerTousProducteurs();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [showIntro, mapLoaded, chargement, chargerTousProducteurs]);

  // Fonction pour rechercher les producteurs par ville
  const rechercherProducteurs = useCallback(async () => {
    const villeTrim = ville.trim();
    
    if (!villeTrim) {
      setErreur('Veuillez entrer une ville pour rechercher des producteurs');
      return;
    }

    setChargement(true);
    setErreur('');
    setProducteurSelectionne(null);
    setClusterSelectionne(null);

    try {
      const url = `/api/producteurs/rechercher?ville=${encodeURIComponent(villeTrim)}&rayon=${rayon}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Erreur ${response.status}` }));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        if (data.error.includes('non trouvée')) {
          setErreur(`La ville "${villeTrim}" n'a pas été trouvée. Essayez avec un nom plus spécifique.`);
        } else {
          setErreur(data.error);
        }
        setProducteurs([]);
        setRechercheEffectuee(true);
        return;
      }

      // Mettre à jour le centre de la carte
      if (data.coordsVille) {
        setCentreCarte({
          lat: data.coordsVille.lat,
          lng: data.coordsVille.lng
        });
      }

      const producteursTrouves = data.producteurs || [];
      setProducteurs(producteursTrouves);
      setRechercheEffectuee(true);
      
      if (producteursTrouves.length === 0) {
        setErreur(`Il n'y a pas de producteurs pour le moment dans un rayon de ${rayon} km autour de "${villeTrim}".`);
      } else {
        setErreur('');
        
        // Zoom automatique sur les producteurs trouvés
        setTimeout(() => {
          if (mapRef.current && window.google && window.google.maps && producteursTrouves.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            
            producteursTrouves.forEach(producteur => {
              if (producteur.latitude && producteur.longitude) {
                bounds.extend({
                  lat: parseFloat(producteur.latitude),
                  lng: parseFloat(producteur.longitude)
                });
              }
            });
            
            if (mapRef.current.fitBounds) {
              mapRef.current.fitBounds(bounds);
              
              if (mapRef.current.addListener && window.google.maps.event) {
                const listener = mapRef.current.addListener('bounds_changed', () => {
                  try {
                    if (mapRef.current && mapRef.current.getZoom && mapRef.current.getZoom() > 13 && mapRef.current.setZoom) {
                      mapRef.current.setZoom(13);
                    }
                    if (window.google && window.google.maps && window.google.maps.event && window.google.maps.event.removeListener) {
                      window.google.maps.event.removeListener(listener);
                    }
                  } catch (err) {
                    // Ignorer les erreurs
                  }
                });
              }
            }
          }
        }, 300);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      setErreur(error.message || 'Erreur lors de la recherche. Vérifiez votre connexion.');
      setProducteurs([]);
      setRechercheEffectuee(true);
    } finally {
      setChargement(false);
    }
  }, [ville, rayon]);

  // Fonction pour charger les données à jour d'un producteur
  const chargerProducteurAjour = useCallback(async (producteurId) => {
    try {
      const response = await fetch('/api/producteurs/tous');
      const data = await response.json();
      
      if (data.producteurs) {
        const producteurAjour = data.producteurs.find(p => p.id === producteurId);
        if (producteurAjour) {
          setProducteurs(prevProducteurs => 
            prevProducteurs.map(p => p.id === producteurId ? producteurAjour : p)
          );
          setProducteurSelectionne(producteurAjour);
          return producteurAjour;
        }
      }
    } catch (error) {
      console.error('Erreur chargement producteur à jour:', error);
    }
    return null;
  }, []);

  // Fonction appelée quand un pin est cliqué
  const handleMarkerClick = async (cluster) => {
    if (cluster.count > 1) {
      setClusterSelectionne(cluster);
      if (mapRef.current) {
        mapRef.current.setCenter({ lat: cluster.latitude, lng: cluster.longitude });
        const newZoom = Math.min(currentZoom + 2, 15);
        mapRef.current.setZoom(newZoom);
        setCurrentZoom(newZoom);
      }
    } else {
      const producteur = cluster.producteurs[0];
      const producteurIdStr = String(producteur.id);
      if (!producteurIdStr.startsWith('place_')) {
        const producteurAjour = await chargerProducteurAjour(producteur.id);
        
        try {
          await fetch(`/api/stats/vue/${producteur.id}`, { 
            method: 'POST',
            credentials: 'include'
          });
        } catch (error) {
          console.error('Erreur enregistrement vue:', error);
        }
      } else {
        setProducteurSelectionne(producteur);
      }
    }
  };

  // Fonction pour fermer la fiche producteur
  const fermerFiche = () => {
    setProducteurSelectionne(null);
    setClusterSelectionne(null);
  };

  // Fonction appelée quand l'animation d'intro est terminée
  const handleAnimationComplete = () => {
    setShowIntro(false);
    // Marquer que l'animation a été vue pour cet utilisateur dans cette session
    const currentUserId = sessionStorage.getItem('currentUserId');
    if (currentUserId) {
      sessionStorage.setItem('introAnimationSeen', 'true');
      sessionStorage.setItem('introAnimationUserId', currentUserId);
    }
  };

  // Fonction appelée quand la carte est chargée
  const onMapLoad = (map) => {
    try {
      if (map && map.getBounds && map.setCenter) {
        mapRef.current = map;
        setMapLoaded(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la carte:', error);
      if (map) {
        mapRef.current = map;
        setMapLoaded(true);
      }
    }
  };

  // Fonction appelée quand le zoom change
  const onZoomChanged = () => {
    try {
      if (mapRef.current && mapRef.current.getZoom) {
        const newZoom = mapRef.current.getZoom();
        if (newZoom && typeof newZoom === 'number') {
          setCurrentZoom(newZoom);
          if (boundsChangedTimeout.current) {
            clearTimeout(boundsChangedTimeout.current);
          }
          boundsChangedTimeout.current = setTimeout(() => {
            try {
              if (mapRef.current && mapRef.current.getCenter) {
                const center = mapRef.current.getCenter();
                if (center && typeof center.lat === 'function' && typeof center.lng === 'function') {
                  setCentreCarte({
                    lat: center.lat(),
                    lng: center.lng()
                  });
                }
              }
            } catch (error) {
              // Ignorer les erreurs silencieusement
            }
          }, 200);
        }
      }
    } catch (error) {
      // Ignorer les erreurs silencieusement
    }
  };

  // Fonction appelée quand on clique sur la carte
  const onMapClick = (e) => {
    const target = e?.domEvent?.target || e?.target;
    if (target) {
      const clickedOnMenu = target.closest && (
        target.closest('.dropdown-menu-search') || 
        target.closest('.search-settings-button') ||
        target.closest('.section-recherche') ||
        target.closest('.btn-parametres-search') ||
        target.closest('.recherche-inputs') ||
        target.closest('.recherche-container') ||
        target.closest('#parametres-button') ||
        target.closest('.ui-layer')
      );
      
      if (clickedOnMenu) {
        return;
      }
      
      if (target.id === 'parametres-button' || 
          target.classList?.contains('btn-parametres-search') ||
          target.classList?.contains('dropdown-menu-search') ||
          target.classList?.contains('search-settings-button')) {
        return;
      }
    }
    
    if (producteurSelectionne || clusterSelectionne) {
      fermerFiche();
    }
  };

  // Utiliser onIdle pour détecter quand la carte a fini de bouger
  const onIdle = () => {
    try {
      if (mapRef.current && boundsChangedTimeout.current) {
        clearTimeout(boundsChangedTimeout.current);
      }
      if (mapRef.current && mapRef.current.getCenter && mapRef.current.getZoom) {
        const center = mapRef.current.getCenter();
        const newZoom = mapRef.current.getZoom();
        if (center && typeof center.lat === 'function' && typeof center.lng === 'function') {
          setCentreCarte({
            lat: center.lat(),
            lng: center.lng()
          });
        }
        if (newZoom && typeof newZoom === 'number') {
          setCurrentZoom(newZoom);
        }
      }
    } catch (error) {
      // Ignorer les erreurs silencieusement
    }
  };

  // Fonction pour zoomer sur les producteurs
  const onZoomProducteurs = () => {
    if (producteurs.length > 0 && mapRef.current && window.google && window.google.maps && window.google.maps.LatLngBounds) {
      try {
        const bounds = new window.google.maps.LatLngBounds();
        
        producteurs.forEach(producteur => {
          if (producteur.latitude && producteur.longitude) {
            bounds.extend({
              lat: parseFloat(producteur.latitude),
              lng: parseFloat(producteur.longitude)
            });
          }
        });
        
        if (!bounds.isEmpty()) {
          mapRef.current.fitBounds(bounds);
          
          const listener = mapRef.current.addListener('bounds_changed', () => {
            if (mapRef.current && mapRef.current.getZoom && mapRef.current.getZoom() > 13) {
              mapRef.current.setZoom(13);
            }
            if (window.google && window.google.maps && window.google.maps.event) {
              window.google.maps.event.removeListener(listener);
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors du zoom:', error);
      }
    }
  };

  // Ne rien afficher si l'utilisateur n'est pas connecté
  if (!utilisateurConnecte) {
    console.log('🏠 HomePage - utilisateurConnecte=false, affichage loader');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, var(--vert-tres-clair) 0%, var(--vert-clair) 50%, var(--vert-principal) 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌾</div>
          <div style={{ color: '#114248', fontWeight: '600', fontSize: '24px' }}>⏳ Vérification de l'authentification...</div>
        </div>
      </div>
    );
  }

  console.log('🏠 HomePage - utilisateurConnecte=true, affichage du contenu');

  return (
    <div className="app-root">
      <MapLayer
        producteurs={producteurs}
        centreCarte={centreCarte}
        zoom={zoom}
        showIntro={showIntro}
        onAnimationComplete={handleAnimationComplete}
        onMapLoad={onMapLoad}
        onZoomChanged={onZoomChanged}
        onIdle={onIdle}
        onMapClick={onMapClick}
        onMarkerClick={handleMarkerClick}
        clusterSelectionne={clusterSelectionne}
        onCloseInfoWindow={fermerFiche}
        mapRef={mapRef}
      />
      <UiLayer
        ville={ville}
        rayon={rayon}
        producteurs={producteurs}
        producteurSelectionne={producteurSelectionne}
        clusterSelectionne={clusterSelectionne}
        chargement={chargement}
        erreur={erreur}
        rechercheEffectuee={rechercheEffectuee}
        mapRef={mapRef}
        onVilleChange={setVille}
        onRayonChange={setRayon}
        onRechercher={rechercherProducteurs}
        onFermerFiche={fermerFiche}
        onFermerErreur={() => setErreur('')}
        onZoomProducteurs={onZoomProducteurs}
      />
    </div>
  );
}

export default HomePage;

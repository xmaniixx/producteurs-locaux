// ============================================
// MAPLAYER - Contient UNIQUEMENT Google Maps
// ============================================
// Style : position absolute, z-index 1
// AUCUN bouton UI dedans

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '../contexts/GoogleMapsProvider';
import IntroAnimation from './IntroAnimation';
import './MapLayer.css';

// Configuration de la carte Google Maps
const mapContainerStyle = {
  width: '100%',
  height: '100vh'
};

const defaultCenter = {
  lat: 46.6034, // Centre de la France
  lng: 2.2137
};

// Style carte nature/terroir
const mapOptions = {
  zoomControl: false,
  gestureHandling: 'cooperative',
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  clickableIcons: false,
  keyboardShortcuts: false,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a8d5e2' }, { saturation: 20 }] },
    { featureType: 'water', elementType: 'labels', stylers: [{ visibility: 'on' }, { color: '#00D47E' }, { lightness: 40 }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f5f1eb' }, { lightness: 10 }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8b7355' }, { lightness: -10 }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8e0d4' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f0ebe3' }] },
    { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#f5f1eb' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#e8f5e9' }, { saturation: -20 }, { lightness: 20 }] },
    { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#f1f8e9' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#e8f5e9' }, { saturation: -10 }, { lightness: 15 }] },
    { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }, { lightness: 30 }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#d4e6c4' }, { weight: 0.5 }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#d4e6c4' }, { weight: 0.3 }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
    { featureType: 'all', elementType: 'labels.text.stroke', stylers: [{ visibility: 'off' }] }
  ]
};

// Fonction pour calculer la distance entre deux points (en km)
function calculerDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Fonction pour estimer la distance visible sur la carte selon le zoom (en km)
function distanceVisibleParZoom(zoom, latitude) {
  const latRad = latitude * Math.PI / 180;
  const metresParPixel = 156543.03392 * Math.cos(latRad) / Math.pow(2, zoom);
  const pixelsLargeur = 1280;
  const metresLargeur = metresParPixel * pixelsLargeur;
  return metresLargeur / 1000;
}

// Fonction pour regrouper les producteurs proches (clustering basé sur distance réelle)
function clusterProducteurs(producteurs, distanceVisibleKm) {
  if (!producteurs || producteurs.length === 0) return [];
  
  const producteursValides = producteurs.filter(p => {
    if (!p || !p.latitude || !p.longitude) return false;
    const lat = parseFloat(p.latitude);
    const lng = parseFloat(p.longitude);
    return !isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng) &&
           lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  });
  
  if (producteursValides.length === 0) return [];
  
  const distanceCluster = 50;
  
  if (distanceVisibleKm > distanceCluster) {
    const clusters = [];
    const used = new Set();
    
    producteursValides.forEach((producteur, index) => {
      if (used.has(index)) return;
      
      const lat = parseFloat(producteur.latitude);
      const lng = parseFloat(producteur.longitude);
      
      if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
        return;
      }
      
      const cluster = {
        producteurs: [producteur],
        latitude: lat,
        longitude: lng,
        count: 1,
        ville: producteur.ville || 'Zone'
      };
      
      producteursValides.forEach((p, i) => {
        if (i !== index && !used.has(i)) {
          const pLat = parseFloat(p.latitude);
          const pLng = parseFloat(p.longitude);
          
          if (isNaN(pLat) || isNaN(pLng) || !isFinite(pLat) || !isFinite(pLng)) {
            return;
          }
          
          const distance = calculerDistance(lat, lng, pLat, pLng);
          
          if (distance <= distanceCluster) {
            cluster.producteurs.push(p);
            used.add(i);
            const validProducteurs = cluster.producteurs.filter(prod => {
              const prodLat = parseFloat(prod.latitude);
              const prodLng = parseFloat(prod.longitude);
              return !isNaN(prodLat) && !isNaN(prodLng) && isFinite(prodLat) && isFinite(prodLng);
            });
            
            if (validProducteurs.length > 0) {
              cluster.latitude = validProducteurs.reduce((sum, prod) => sum + parseFloat(prod.latitude), 0) / validProducteurs.length;
              cluster.longitude = validProducteurs.reduce((sum, prod) => sum + parseFloat(prod.longitude), 0) / validProducteurs.length;
              cluster.count = validProducteurs.length;
            }
          }
        }
      });
      
      used.add(index);
      clusters.push(cluster);
    });
    
    return clusters;
  } else {
    const seuilSeparation = distanceVisibleKm < 10 ? 2 : distanceVisibleKm < 20 ? 5 : distanceVisibleKm < 30 ? 10 : 20;
    const clusters = [];
    const used = new Set();
    
    producteursValides.forEach((producteur, index) => {
      if (used.has(index)) return;
      
      const lat = parseFloat(producteur.latitude);
      const lng = parseFloat(producteur.longitude);
      
      if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
        return;
      }
      
      const cluster = {
        producteurs: [producteur],
        latitude: lat,
        longitude: lng,
        count: 1,
        ville: producteur.ville || 'Zone'
      };
      
      producteursValides.forEach((p, i) => {
        if (i !== index && !used.has(i)) {
          const pLat = parseFloat(p.latitude);
          const pLng = parseFloat(p.longitude);
          
          if (isNaN(pLat) || isNaN(pLng) || !isFinite(pLat) || !isFinite(pLng)) {
            return;
          }
          
          const distance = calculerDistance(lat, lng, pLat, pLng);
          
          if (distance <= seuilSeparation) {
            cluster.producteurs.push(p);
            used.add(i);
            
            const validProducteurs = cluster.producteurs.filter(prod => {
              const prodLat = parseFloat(prod.latitude);
              const prodLng = parseFloat(prod.longitude);
              return !isNaN(prodLat) && !isNaN(prodLng) && isFinite(prodLat) && isFinite(prodLng);
            });
            
            if (validProducteurs.length > 0) {
              cluster.latitude = validProducteurs.reduce((sum, prod) => sum + parseFloat(prod.latitude), 0) / validProducteurs.length;
              cluster.longitude = validProducteurs.reduce((sum, prod) => sum + parseFloat(prod.longitude), 0) / validProducteurs.length;
              cluster.count = validProducteurs.length;
            }
          }
        }
      });
      
      used.add(index);
      clusters.push(cluster);
    });
    
    return clusters;
  }
}

// Fonction pour créer l'icône d'un marker style WikiFarm
function creerIconeMarker(count, isCluster, type = null, distanceVisibleKm = null) {
  const afficherIconeType = distanceVisibleKm !== null && distanceVisibleKm < 50 && count === 1 && type;
  
  const size = isCluster && count > 1 ? 56 : 48;
  const radius = isCluster && count > 1 ? 28 : 24;
  
  const getEmojiType = (typeStr) => {
    const typeLower = (typeStr || '').toLowerCase();
    if (typeLower.includes('laitier') || typeLower.includes('lait')) return '🐄';
    if (typeLower.includes('maraîcher') || typeLower.includes('légume')) return '🥕';
    if (typeLower.includes('éleveur') || typeLower.includes('viande')) return '🐷';
    if (typeLower.includes('verger') || typeLower.includes('fruit')) return '🍎';
    if (typeLower.includes('apiculteur') || typeLower.includes('miel')) return '🐝';
    if (typeLower.includes('vin') || typeLower.includes('vignoble')) return '🍇';
    if (typeLower.includes('céréale') || typeLower.includes('blé')) return '🌾';
    return '🌾';
  };
  
  const fillColor = '#114248';
  const strokeColor = '#0a2d32';
  const texteAfficher = afficherIconeType ? getEmojiType(type) : (count > 99 ? '99+' : count);
  const fontSize = afficherIconeType ? '28' : (count > 99 ? '18' : count > 9 ? '20' : '24');
  const textY = afficherIconeType ? size/2 + 16 : size/2 + 14;
  
  const svg = `
    <svg width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2 + 2}" cy="${size/2 + 10}" r="${radius + 2}" fill="rgba(0,0,0,0.2)"/>
      <circle cx="${size/2}" cy="${size/2 + 8}" r="${radius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="3"/>
      <text x="${size/2}" y="${textY}" font-size="${fontSize}" 
            fill="#FFFFFF" text-anchor="middle" font-weight="bold" font-family="Arial, sans-serif" stroke="#FFFFFF" stroke-width="0.5">
        ${texteAfficher}
      </text>
      <path d="M ${size/2 - 6} ${size/2 + 8 + radius} L ${size/2} ${size + 6} L ${size/2 + 6} ${size/2 + 8 + radius} Z" 
            fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
    </svg>
  `;
  
  if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.Size || !window.google.maps.Point) {
    return null;
  }

  try {
    if (!window.google.maps.Size || !window.google.maps.Point) {
      return null;
    }
    
    const scaledSize = new window.google.maps.Size(size, size + 8);
    const anchor = new window.google.maps.Point(size/2, size + 8);
    
    if (!scaledSize || !anchor) {
      return null;
    }
    
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: scaledSize,
      anchor: anchor
    };
  } catch (error) {
    console.error('Erreur création icône marker:', error);
    return null;
  }
}

/**
 * MapLayer - Contient UNIQUEMENT Google Maps
 * 
 * Props:
 * - producteurs: Array des producteurs à afficher
 * - centreCarte: { lat, lng } - Centre de la carte
 * - zoom: Number - Niveau de zoom initial
 * - showIntro: Boolean - Afficher l'animation d'intro
 * - onAnimationComplete: Function - Callback quand l'intro est terminée
 * - onMapLoad: Function(map) - Callback quand la carte est chargée
 * - onZoomChanged: Function() - Callback quand le zoom change
 * - onIdle: Function() - Callback quand la carte est idle
 * - onMapClick: Function(e) - Callback quand on clique sur la carte
 * - onMarkerClick: Function(cluster) - Callback quand on clique sur un marker
 * - clusterSelectionne: Object - Cluster sélectionné pour InfoWindow
 * - onCloseInfoWindow: Function() - Callback pour fermer l'InfoWindow
 * - mapRef: Ref - Référence vers l'instance de la carte
 */
function MapLayer({
  producteurs = [],
  centreCarte = defaultCenter,
  zoom = 6,
  showIntro = false,
  onAnimationComplete,
  onMapLoad,
  onZoomChanged,
  onIdle,
  onMapClick,
  onMarkerClick,
  clusterSelectionne = null,
  onCloseInfoWindow,
  mapRef: externalMapRef
}) {
  const { isLoaded: isGoogleMapsLoaded, googleMapsApiKey, loadError } = useGoogleMaps();
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [clusters, setClusters] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const internalMapRef = useRef(null);
  const boundsChangedTimeout = useRef(null);
  const markerClickedRef = useRef(false);

  const mapRef = externalMapRef || internalMapRef;

  // Mettre à jour les clusters quand les producteurs ou le zoom changent
  useEffect(() => {
    if (producteurs.length > 0 && mapRef.current && !showIntro) {
      const distanceVisible = distanceVisibleParZoom(currentZoom, centreCarte.lat);
      const newClusters = clusterProducteurs(producteurs, distanceVisible);
      const clustersValides = newClusters.filter(c => 
        c && 
        c.latitude != null && 
        c.longitude != null && 
        !isNaN(parseFloat(c.latitude)) && 
        !isNaN(parseFloat(c.longitude)) &&
        c.producteurs && 
        c.producteurs.length > 0
      );
      setClusters(clustersValides);
    } else {
      setClusters([]);
    }
  }, [producteurs, currentZoom, centreCarte.lat, showIntro, mapRef]);


  const handleMapLoad = useCallback((map) => {
    try {
      if (map && map.getBounds && map.setCenter) {
        mapRef.current = map;
        setMapLoaded(true);
        if (onMapLoad) {
          onMapLoad(map);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la carte:', error);
      if (map) {
        mapRef.current = map;
        setMapLoaded(true);
        if (onMapLoad) {
          onMapLoad(map);
        }
      }
    }
  }, [onMapLoad, mapRef]);

  const handleZoomChanged = useCallback(() => {
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
                  // Le centre est géré par le parent
                }
              }
            } catch (error) {
              // Ignorer les erreurs silencieusement
            }
          }, 200);
        }
      }
      if (onZoomChanged) {
        onZoomChanged();
      }
    } catch (error) {
      // Ignorer les erreurs silencieusement
    }
  }, [onZoomChanged, mapRef]);

  const handleIdle = useCallback(() => {
    try {
      if (mapRef.current && boundsChangedTimeout.current) {
        clearTimeout(boundsChangedTimeout.current);
      }
      if (onIdle) {
        onIdle();
      }
    } catch (error) {
      // Ignorer les erreurs silencieusement
    }
  }, [onIdle, mapRef]);

  const handleMapClick = useCallback((e) => {
    if (markerClickedRef.current) {
      return;
    }
    
    if (onMapClick) {
      onMapClick(e);
    }
  }, [onMapClick]);

  const handleMarkerClick = useCallback((cluster) => {
    markerClickedRef.current = true;
    setTimeout(() => {
      markerClickedRef.current = false;
    }, 100);

    if (onMarkerClick) {
      onMarkerClick(cluster);
    }
  }, [onMarkerClick]);

  if (loadError) {
    return (
      <div id="map-layer" className="map-layer erreur-config">
        <h2>⚠️ Erreur de chargement</h2>
        <p>Impossible de charger Google Maps. Vérifiez votre connexion internet.</p>
      </div>
    );
  }

  if (!googleMapsApiKey || googleMapsApiKey === 'votre_cle_api_ici' || googleMapsApiKey.trim() === '') {
    return (
      <div id="map-layer" className="map-layer erreur-config">
        <h2>⚠️ Configuration requise</h2>
        <p>
          Veuillez configurer votre clé API Google Maps dans le fichier <code>.env</code>
        </p>
        <p>
          Ajoutez : <code>VITE_GOOGLE_MAPS_API_KEY=votre_cle</code>
        </p>
      </div>
    );
  }

  const distanceVisibleKm = distanceVisibleParZoom(currentZoom, centreCarte.lat);
  const shouldCluster = distanceVisibleKm > 50;

  const renderMapContent = () => {
    if (!isGoogleMapsLoaded || showIntro) {
      return null;
    }
    
    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      return null;
    }
    
    try {
      if (!window.google.maps.Map || !window.google.maps.Marker || !window.google.maps.Size || !window.google.maps.Point) {
        return null;
      }
    } catch (error) {
      return null;
    }

    return (
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={centreCarte}
        zoom={zoom}
        options={{
          ...mapOptions,
          gestureHandling: 'greedy',
          clickableIcons: false,
          keyboardShortcuts: false
        }}
        onLoad={handleMapLoad}
        onZoomChanged={handleZoomChanged}
        onIdle={handleIdle}
        onClick={handleMapClick}
      >
        {clusters.map((cluster, index) => {
          if (!window.google || !window.google.maps || !window.google.maps.Marker) {
            return null;
          }
          
          if (!cluster || !cluster.latitude || !cluster.longitude) {
            return null;
          }
          
          const lat = parseFloat(cluster.latitude);
          const lng = parseFloat(cluster.longitude);
          
          if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
            return null;
          }
          
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return null;
          }
          
          const type = cluster.count === 1 && cluster.producteurs && cluster.producteurs[0] 
            ? cluster.producteurs[0].type 
            : null;
          
          if (!window.google?.maps?.Size || !window.google?.maps?.Point) {
            return null;
          }
          
          let iconConfig = null;
          try {
            iconConfig = creerIconeMarker(
              cluster.count, 
              shouldCluster, 
              type,
              distanceVisibleKm
            );
          } catch (error) {
            console.error('Erreur création icône marker:', error);
            return null;
          }

          if (!iconConfig || !iconConfig.url) {
            return null;
          }

          if (!iconConfig.scaledSize || !iconConfig.anchor) {
            return null;
          }

          try {
            if (!iconConfig || !iconConfig.url || !iconConfig.scaledSize || !iconConfig.anchor) {
              return null;
            }
            
            if (typeof lat !== 'number' || typeof lng !== 'number' || !isFinite(lat) || !isFinite(lng)) {
              return null;
            }
            
            if (!window.google?.maps?.Marker) {
              return null;
            }
            
            if (typeof iconConfig.scaledSize.width !== 'number' || typeof iconConfig.scaledSize.height !== 'number') {
              return null;
            }
            
            if (typeof iconConfig.anchor.x !== 'number' || typeof iconConfig.anchor.y !== 'number') {
              return null;
            }
            
            return (
              <Marker
                key={`cluster-${index}-${cluster.count}-${type || ''}-${currentZoom}-${lat}-${lng}`}
                position={{
                  lat: lat,
                  lng: lng
                }}
                onClick={() => {
                  try {
                    handleMarkerClick(cluster);
                  } catch (error) {
                    console.error('Erreur handleMarkerClick:', error);
                  }
                }}
                icon={iconConfig}
                options={{
                  optimized: false
                }}
              />
            );
          } catch (error) {
            return null;
          }
        })}

        {clusterSelectionne && clusterSelectionne.count > 1 && (
          <InfoWindow
            position={{
              lat: clusterSelectionne.latitude,
              lng: clusterSelectionne.longitude
            }}
            onCloseClick={onCloseInfoWindow}
          >
            <div style={{ padding: '10px' }}>
              <h3>{clusterSelectionne.count} producteurs</h3>
              <p>Zoomez pour voir les détails individuels</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    );
  };

  // Déterminer si on doit afficher le skeleton
  const isMapReady = !showIntro && isGoogleMapsLoaded && 
    (typeof window !== 'undefined' && window.google && window.google.maps);
  const shouldShowSkeleton = !showIntro && !isMapReady;

  return (
    <div id="map-layer" className="map-layer">
      {showIntro && (
        <IntroAnimation onAnimationComplete={onAnimationComplete} />
      )}
      
      {/* Skeleton pendant le chargement - Style Apple */}
      {shouldShowSkeleton && (
        <div className="map-skeleton" />
      )}
      
      {/* Map avec fade-in */}
      <div className={`map-content ${isMapReady ? 'loaded' : ''}`}>
        {renderMapContent()}
      </div>
    </div>
  );
}

export default MapLayer;


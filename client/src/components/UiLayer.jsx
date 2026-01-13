// ============================================
// UILAYER - Contient TOUS les éléments UI
// ============================================
// Style : position fixed, z-index 9999, pointer-events: none par défaut
// NE CONTIENT PAS la map

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProducteurCard from './ProducteurCard';
import './UiLayer.css';
import '../components/Header.css';

/**
 * UiLayer - Contient TOUS les éléments UI
 * 
 * Props:
 * - ville: String - Ville recherchée
 * - rayon: Number - Rayon de recherche
 * - producteurs: Array - Liste des producteurs
 * - producteurSelectionne: Object - Producteur sélectionné
 * - clusterSelectionne: Object - Cluster sélectionné
 * - chargement: Boolean - État de chargement
 * - erreur: String - Message d'erreur
 * - rechercheEffectuee: Boolean - Recherche effectuée
 * - mapRef: Ref - Référence vers la carte
 * - onVilleChange: Function - Callback changement ville
 * - onRayonChange: Function - Callback changement rayon
 * - onRechercher: Function - Callback recherche
 * - onFermerFiche: Function - Callback fermer fiche
 * - onFermerErreur: Function - Callback fermer erreur
 * - onZoomProducteurs: Function - Callback zoom sur producteurs
 */
function UiLayer({
  ville = '',
  rayon = 30,
  producteurs = [],
  producteurSelectionne = null,
  clusterSelectionne = null,
  chargement = false,
  erreur = '',
  rechercheEffectuee = false,
  mapRef = null,
  onVilleChange,
  onRayonChange,
  onRechercher,
  onFermerFiche,
  onFermerErreur,
  onZoomProducteurs
}) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [estProducteur, setEstProducteur] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const menuJustOpenedRef = useRef(false);
  const [statutChargé, setStatutChargé] = useState(false);

  // Charger le statut producteur
  useEffect(() => {
    let cancelled = false;
    
    const verifierStatutProducteur = async () => {
      try {
        const response = await fetchAPI('/api/utilisateur/statut-producteur');
        
        if (!cancelled) {
          if (response.ok) {
            const data = await response.json();
            setEstProducteur(data.est_producteur || false);
          } else if (response.status === 401 || response.status === 403) {
            setEstProducteur(false);
          }
          setStatutChargé(true);
        }
      } catch (error) {
        if (!cancelled) {
          setEstProducteur(false);
          setStatutChargé(true);
        }
      }
    };
    
    verifierStatutProducteur();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // Bloquer le scroll quand le menu est ouvert
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Gérer la touche ESC pour fermer le menu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    
    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  // Gérer la fermeture du menu au clic extérieur
  useEffect(() => {
    if (!isMenuOpen) {
      menuJustOpenedRef.current = false;
      return;
    }
    
    menuJustOpenedRef.current = true;
    const protectTimeout = setTimeout(() => {
      menuJustOpenedRef.current = false;
    }, 500);
    
    const handleClickOutside = (event) => {
      if (menuJustOpenedRef.current) {
        return;
      }
      
      const target = event.target;
      
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      
      if (target.closest && target.closest('.section-recherche')) {
        return;
      }
      
      if (target.closest && (
        target.closest('.btn-parametres-search') ||
        target.closest('#parametres-button') ||
        target.closest('.dropdown-menu-search') ||
        target.closest('.search-settings-button') ||
        target.closest('.menu-panel')
      )) {
        return;
      }
      
      if (target.id === 'parametres-button' ||
          target.classList?.contains('btn-parametres-search') ||
          target.classList?.contains('dropdown-menu-search') ||
          target.classList?.contains('search-settings-button') ||
          target.classList?.contains('menu-panel')) {
        return;
      }
      
      setIsMenuOpen(false);
    };
    
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 300);
    
    return () => {
      clearTimeout(protectTimeout);
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleDeconnexion = async () => {
    try {
      await post('/api/utilisateur/deconnexion', {});
      // Réinitialiser les flags d'animation lors de la déconnexion
      sessionStorage.removeItem('currentUserId');
      sessionStorage.removeItem('introAnimationSeen');
      sessionStorage.removeItem('introAnimationUserId');
      navigate('/connexion');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      // Réinitialiser les flags même en cas d'erreur
      sessionStorage.removeItem('currentUserId');
      sessionStorage.removeItem('introAnimationSeen');
      sessionStorage.removeItem('introAnimationUserId');
      navigate('/connexion');
    }
  };

  const handleToggleMenu = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div id="ui-layer" className="ui-layer">
      {/* Overlay flou visible */}
      <div 
        className={`menu-overlay ${isMenuOpen ? 'open' : ''}`}
        onClick={handleCloseMenu}
      />
      
      {/* Header avec logo */}
      <div className="app-header-simple">
        <div className="header-content">
          <div className="header-logo" onClick={() => navigate('/')}>
            <span className="logo-icon">🌾</span>
            <span className="logo-text">Producteurs Locaux</span>
          </div>
        </div>
      </div>
      
      {/* Section Recherche */}
      <div className="section-recherche">
        <div className="recherche-container">
          <div className="recherche-inputs">
            <div className="input-groupe">
              <input
                id="ville-input"
                type="text"
                value={ville}
                onChange={(e) => onVilleChange && onVilleChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onRechercher && onRechercher();
                  }
                }}
                placeholder="📍 Rechercher une ville..."
                className="input-ville"
              />
            </div>

            <select
              id="rayon-select"
              value={rayon}
              onChange={(e) => onRayonChange && onRayonChange(parseInt(e.target.value))}
              className="select-rayon"
            >
              <option value={10}>10 km</option>
              <option value={30}>30 km</option>
              <option value={50}>50 km</option>
            </select>

            <button
              onClick={onRechercher}
              disabled={chargement || !ville.trim()}
              className="btn-rechercher"
            >
              {chargement ? '⏳' : '🔍'}
            </button>

            {/* Bouton Espace producteur */}
            <button
              className="btn-producteur"
              onClick={(e) => {
                e.preventDefault();
                // Si producteur → dashboard, sinon → devenir-producteur (qui gère demande en attente)
                if (estProducteur) {
                  navigate('/producteur/dashboard');
                } else {
                  navigate('/devenir-producteur');
                }
              }}
              type="button"
            >
              👨‍🌾
            </button>
          </div>

          {/* Message d'erreur */}
          {erreur && (
            <div className="message-erreur">
              <span className="erreur-icon">⚠️</span>
              <span className="erreur-text">{erreur}</span>
              <button onClick={() => onFermerErreur && onFermerErreur()} className="btn-fermer-erreur">×</button>
            </div>
          )}
        </div>
      </div>
      
      {/* Bouton Paramètres - CRITIQUE : position absolute, top: 16px, right: 16px, z-index: 10000 */}
      <div 
        id="settings-button-container"
        className="settings-button-container" 
        ref={menuRef}
      >
        <button
          ref={buttonRef}
          id="parametres-button"
          className="btn-parametres-search"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation?.();
            handleToggleMenu(e);
          }}
          aria-label="Paramètres"
          type="button"
        >
          ⚙️
        </button>
        
        {/* Menu panel - TOUJOURS dans le DOM */}
        <div 
          className={`menu-panel ${isMenuOpen ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            className="menu-item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCloseMenu();
              navigate('/mon-compte');
            }}
            type="button"
          >
            <span className="menu-icon">👤</span>
            Mon compte
          </button>
          <button
            className="menu-item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCloseMenu();
              navigate('/mes-favoris');
            }}
            type="button"
          >
            <span className="menu-icon">⭐</span>
            Mes favoris
          </button>
          {statutChargé && !estProducteur && (
            <button
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCloseMenu();
                navigate('/devenir-producteur');
              }}
              type="button"
            >
              <span className="menu-icon">🌾</span>
              Devenir producteur
            </button>
          )}
          <div className="menu-divider"></div>
          <button
            className="menu-item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCloseMenu();
              handleDeconnexion();
            }}
            type="button"
          >
            <span className="menu-icon">🚪</span>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Informations sur la carte */}
      {rechercheEffectuee && producteurs.length > 0 && !chargement && (
        <div 
          className={`info-producteurs clickable ${producteurSelectionne ? 'with-card' : ''}`}
          onClick={() => {
            if (onZoomProducteurs) {
              onZoomProducteurs();
            }
          }}
        >
          {producteurs.length} producteur{producteurs.length > 1 ? 's' : ''} trouvé{producteurs.length > 1 ? 's' : ''}
          <span className="info-hint"> 👆 Cliquez pour zoomer</span>
        </div>
      )}

      {/* Fiche producteur */}
      {producteurSelectionne && !clusterSelectionne && (
        <ProducteurCard
          producteur={producteurSelectionne}
          villeRecherchee={ville}
          onFermer={() => onFermerFiche && onFermerFiche()}
        />
      )}
    </div>
  );
}

export default UiLayer;


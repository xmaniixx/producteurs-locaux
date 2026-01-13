// ============================================
// COMPOSANT HEADER
// ============================================
// Header avec logo, bouton paramètres et menu déroulant
// Affiché sur la page d'accueil utilisateur

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI, post } from '../api/api';
import './Header.css';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [estProducteur, setEstProducteur] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est producteur
  useEffect(() => {
    verifierStatutProducteur();
  }, []);

  const verifierStatutProducteur = async () => {
    try {
      const response = await fetchAPI('/api/utilisateur/statut-producteur');
      const data = await response.json();
      setEstProducteur(data.est_producteur || false);
    } catch (error) {
      console.error('Erreur vérification statut producteur:', error);
    }
  };

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Gestion de la déconnexion
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

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Logo */}
        <div className="header-logo" onClick={() => navigate('/')}>
          <span className="logo-icon">🌾</span>
          <span className="logo-text">Producteurs Locaux</span>
        </div>

        {/* Bouton Espace Producteur - Seulement si l'utilisateur est producteur */}
        {estProducteur && (
          <button 
            className="btn-espace-producteur"
            onClick={() => navigate('/producteur/dashboard')}
          >
            Espace Producteur
          </button>
        )}

        {/* Bouton Paramètres avec menu */}
        <div className="header-actions" ref={menuRef}>
          <button
            className="btn-parametres"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Paramètres"
          >
            ⚙️
          </button>

          {/* Menu déroulant */}
          {menuOpen && (
            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => {
                  navigate('/mon-compte');
                  setMenuOpen(false);
                }}
              >
                <span className="dropdown-icon">👤</span>
                Mon compte
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  navigate('/mes-favoris');
                  setMenuOpen(false);
                }}
              >
                <span className="dropdown-icon">⭐</span>
                Mes favoris
              </button>
              {!estProducteur && (
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/devenir-producteur');
                    setMenuOpen(false);
                  }}
                >
                  <span className="dropdown-icon">🌾</span>
                  Devenir producteur
                </button>
              )}
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-item"
                onClick={handleDeconnexion}
              >
                <span className="dropdown-icon">🚪</span>
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;


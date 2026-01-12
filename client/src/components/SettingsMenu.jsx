// ============================================
// MENU PARAMÈTRES - Navigation fluide
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SettingsMenu.css';

// Icônes SVG simples
const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const TractorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12h18M3 12l3-3m-3 3l3 3M21 12l-3-3m3 3l-3 3M12 3v18"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const SettingsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fermer le menu lors de la navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const menuItems = [
    {
      icon: CreditCardIcon,
      label: 'Gérer mon abonnement',
      path: '/producteur/dashboard/subscription',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      hoverColor: 'hover:bg-emerald-100'
    },
    {
      icon: TractorIcon,
      label: 'Modifier ma ferme',
      path: '/producteur/dashboard/edit-profile',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100'
    }
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="settings-menu-container">
      {/* Bouton Paramètres */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`settings-menu-button ${isOpen ? 'settings-menu-button-open' : ''}`}
      >
        <SettingsIcon />
        <span className="settings-menu-button-text">Paramètres</span>
        <ChevronDownIcon />
      </button>

      {/* Menu déroulant */}
      <div className={`settings-menu-dropdown ${isOpen ? 'settings-menu-dropdown-open' : ''}`}>
        {/* Header */}
        <div className="settings-menu-header">
          <div className="settings-menu-header-icon">
            <SettingsIcon />
          </div>
          <div>
            <h3 className="settings-menu-header-title">Paramètres du compte</h3>
            <p className="settings-menu-header-subtitle">Gérez vos préférences</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="settings-menu-items">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={index}
                onClick={() => handleNavigate(item.path)}
                className={`settings-menu-item ${isActive ? 'settings-menu-item-active' : ''} ${item.hoverColor}`}
              >
                <div className={`settings-menu-item-icon ${isActive ? item.bgColor : ''}`}>
                  <Icon />
                </div>
                <div className="settings-menu-item-content">
                  <p className={`settings-menu-item-label ${isActive ? item.color : ''}`}>
                    {item.label}
                  </p>
                </div>
                <div className={`settings-menu-item-arrow ${isActive ? item.color : ''}`}>
                  <ChevronDownIcon />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="settings-menu-footer">
          <p className="settings-menu-footer-text">
            Besoin d'aide ? <a href="/support" className="settings-menu-footer-link">Contactez le support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;



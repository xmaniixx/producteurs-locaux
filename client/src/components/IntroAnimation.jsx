// ============================================
// COMPOSANT ANIMATION D'INTRO
// ============================================
// Animation d'introduction avec tracteur qui roule et swipe vers le haut

import React, { useEffect, useState } from 'react';
import './IntroAnimation.css';

function IntroAnimation({ onAnimationComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const [tractorPosition, setTractorPosition] = useState(100); // Commence à droite (100%)

  useEffect(() => {
    // Animation du tracteur qui roule de droite vers gauche (pas de saut)
    const interval = setInterval(() => {
      setTractorPosition(prev => {
        if (prev <= -20) { // Sortir complètement de l'écran à gauche
          clearInterval(interval);
          // Attendre un peu puis commencer l'animation de swipe vers le haut
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
              onAnimationComplete();
            }, 800);
          }, 300);
          return -20;
        }
        return prev - 1.5; // Déplacer vers la gauche (réduire la valeur)
      });
    }, 40);

    return () => clearInterval(interval);
  }, [onAnimationComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`intro-animation ${!isVisible ? 'fade-out' : ''}`}>
      <div className="intro-background">
        <div className="intro-content">
          <div className="tractor-container">
            <div 
              className="tractor" 
              style={{ left: `${tractorPosition}%` }}
            >
              🚜
            </div>
          </div>
          <div className="intro-text">
            <h1>🌾 Producteurs Locaux</h1>
            <p>Découvrez les fermes près de chez vous</p>
          </div>
        </div>
        
        {/* Lignes du sol animées */}
        <div className="ground-lines">
          <div className="line" style={{ animationDelay: '0s' }}></div>
          <div className="line" style={{ animationDelay: '0.2s' }}></div>
          <div className="line" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}

export default IntroAnimation;


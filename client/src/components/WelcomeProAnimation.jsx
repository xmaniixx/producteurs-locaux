// ============================================
// ANIMATION DE BIENVENUE PLAN PRO
// ============================================
// Animation style Claude.ai après paiement réussi

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomeProAnimation.css';

const WelcomeProAnimation = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Step 0: Fade in (0-500ms)
    const timer1 = setTimeout(() => setStep(1), 500);
    
    // Step 1: Show farmer icon (500-1500ms)
    const timer2 = setTimeout(() => setStep(2), 1500);
    
    // Step 2: Show text (1500-2500ms)
    const timer3 = setTimeout(() => setStep(3), 2500);
    
    // Step 3: Redirect (3000ms)
    const timer4 = setTimeout(() => {
      navigate('/producteur/dashboard?payment_success=true', { replace: true });
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [navigate]);

  return (
    <div className="welcome-pro-container">
      {/* Confettis background */}
      <div className="welcome-confetti-container">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="welcome-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="welcome-content">
        {/* Farmer Icon */}
        <div 
          className={`welcome-icon ${step >= 1 ? 'welcome-icon-visible' : ''}`}
        >
          👨‍🌾
        </div>

        {/* Welcome Text */}
        <div 
          className={`welcome-text ${step >= 2 ? 'welcome-text-visible' : ''}`}
        >
          <h1 className="welcome-title">
            Bienvenue dans le Plan Pro !
          </h1>
          <p className="welcome-subtitle">
            Votre abonnement est maintenant actif
          </p>
        </div>

        {/* Loading dots */}
        <div 
          className={`welcome-loading ${step >= 2 ? 'welcome-loading-visible' : ''}`}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="welcome-dot"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeProAnimation;




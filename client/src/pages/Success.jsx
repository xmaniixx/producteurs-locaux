// ============================================
// PAGE DE SUCCÈS - Retour après paiement Stripe
// ============================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { post } from '../api/api';
import WelcomeProAnimation from '../components/WelcomeProAnimation';
import './Success.css';

function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Vérifier si c'est un nouveau paiement (pas une réactivation)
    if (!sessionId) {
      // Pas de session_id, rediriger directement
      navigate('/producteur/dashboard', { replace: true });
      return;
    }

    // Afficher l'animation pour les nouveaux abonnements
    setShowAnimation(true);
    
    // Activer l'abonnement en arrière-plan
    activateSubscription();
  }, [sessionId, navigate]);

  const activateSubscription = async () => {
    try {
      const response = await post('/api/stripe/verify-session', {
        session_id: sessionId
      });

      if (!response.ok) {
        let errorMessage = 'Erreur lors de l\'activation';
        
        if (response.status === 404) {
          errorMessage = 'Route non trouvée. Le serveur doit être redémarré.';
          console.error('⚠️ Route /api/stripe/verify-session non trouvée. Redémarrez le serveur backend.');
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = `Erreur ${response.status}: ${response.statusText}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Abonnement activé:', data);
      setIsLoading(false);
      
      // Rediriger vers le dashboard avec un paramètre pour indiquer le succès
      setTimeout(() => {
        navigate('/producteur/dashboard?payment_success=true');
      }, 2000);
    } catch (err) {
      console.error('Erreur activation abonnement:', err);
      
      // Si la route verify-session n'existe pas (404), essayer la route alternative
      if (err.message.includes('404') || err.message.includes('Route non trouvée')) {
        console.log('🔄 Tentative d\'activation via route alternative...');
        try {
          const altResponse = await post('/api/stripe/activate-subscription', {});
          
          if (altResponse.ok) {
            const altData = await altResponse.json();
            console.log('✅ Abonnement activé via route alternative:', altData);
            setIsLoading(false);
            setTimeout(() => {
              navigate('/producteur/dashboard?payment_success=true');
            }, 2000);
            return;
          }
        } catch (altErr) {
          console.error('Erreur route alternative:', altErr);
        }
      }
      
      setIsLoading(false);
      
      // Afficher un message d'erreur mais rediriger quand même
      // L'abonnement sera activé via le webhook ou manuellement
      console.warn('⚠️ L\'abonnement sera activé automatiquement sous peu via le webhook Stripe.');
      
      // Rediriger vers le dashboard après 3 secondes
      setTimeout(() => {
        navigate('/producteur/dashboard?payment_success=true');
      }, 3000);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/producteur/dashboard');
  };

  // Afficher l'animation de bienvenue si c'est un nouveau paiement
  if (showAnimation && sessionId) {
    return <WelcomeProAnimation />;
  }

  // Fallback pour les cas sans animation
  return (
    <div className="success-page">
      <div className="success-container">
        {isLoading ? (
          <div className="success-loading">
            <div className="loading-spinner"></div>
            <p>Activation de votre Plan Pro en cours...</p>
          </div>
        ) : (
          <div className="success-content">
            <div className="success-icon">🎉</div>
            <h1 className="success-title">Plan Pro activé !</h1>
            <p className="success-message">
              Votre abonnement au Plan Pro a été activé avec succès.
              <br />
              Vous avez maintenant accès à toutes les statistiques avancées.
            </p>
            {sessionId && (
              <p className="success-session-id">
                Session ID: {sessionId.substring(0, 20)}...
              </p>
            )}
            <button 
              className="success-btn"
              onClick={handleGoToDashboard}
            >
              Accéder au tableau de bord
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Success;


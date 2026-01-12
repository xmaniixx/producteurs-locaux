// ============================================
// GESTION D'ABONNEMENT - Style Claude.ai
// ============================================

import { useState, useEffect } from 'react';
import './SubscriptionManagement.css';

// Icônes SVG simples (remplace lucide-react)
const CreditCardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SubscriptionManagement = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Charger les données
  useEffect(() => {
    fetchSubscriptionData();
    fetchPaymentMethod();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/stripe/subscription', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      
      const data = await response.json();
      setSubscriptionData(data);
    } catch (err) {
      console.error('Erreur chargement abonnement:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchPaymentMethod = async () => {
    try {
      const response = await fetch('/api/stripe/payment-method', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentMethod(data);
      } else {
        // Pas de méthode de paiement ou erreur - ce n'est pas critique
        setPaymentMethod(null);
      }
    } catch (err) {
      console.error('Erreur chargement méthode paiement:', err);
      setPaymentMethod(null);
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'annulation');
      }

      await fetchSubscriptionData();
      setShowCancelModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/reactivate-subscription', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réactivation');
      }

      if (data.requiresCheckout) {
        // Rediriger vers le checkout
        window.location.href = '/tarifs';
        return;
      }

      await fetchSubscriptionData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Erreur lors de l\'ouverture du portail de paiement');
      }
    } catch (err) {
      setError('Erreur lors de l\'ouverture du portail de paiement');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="subscription-loading">
        <div className="subscription-spinner"></div>
      </div>
    );
  }

  if (!subscriptionData || !subscriptionData.hasSubscription) {
    return null; // Ne rien afficher si pas d'abonnement
  }

  return (
    <div className="subscription-management">
      {/* Header */}
      <div className="subscription-header-section">
        <div>
          <h1 className="subscription-title">Gérer mon abonnement</h1>
          <p className="subscription-subtitle">Gérez votre abonnement et vos informations de paiement</p>
        </div>
        
        {/* Status Badge */}
        <div className={`subscription-status-badge ${
          subscriptionData.isCanceling 
            ? 'status-warning' 
            : subscriptionData.isActive
            ? 'status-active'
            : 'status-inactive'
        }`}>
          {subscriptionData.isCanceling 
            ? `Actif jusqu'au ${subscriptionData.currentPeriodEnd || subscriptionData.nextRenewal}` 
            : subscriptionData.isActive
            ? 'Actif'
            : 'Inactif'}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="subscription-error-alert">
          <AlertCircleIcon />
          <div className="subscription-error-content">
            <p className="subscription-error-title">Erreur</p>
            <p className="subscription-error-message">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="subscription-error-close">
            <XIcon />
          </button>
        </div>
      )}

      {/* Subscription Info Card */}
      <div className="subscription-card">
        <div className="subscription-card-header">
          <div className="subscription-card-icon subscription-icon-green">
            <CheckCircleIcon />
          </div>
          <div>
            <h2 className="subscription-card-title">Abonnement</h2>
            <p className="subscription-card-subtitle">Plan Pro</p>
          </div>
        </div>

        <div className="subscription-details-list">
          <div className="subscription-detail-row">
            <span className="subscription-detail-label">Plan actuel</span>
            <span className="subscription-detail-value">Plan Pro</span>
          </div>

          {subscriptionData.isCanceling ? (
            <div className="subscription-detail-row">
              <span className="subscription-detail-label">Jours restants</span>
              <span className="subscription-detail-value">
                {subscriptionData.daysRemaining} jours restants
              </span>
            </div>
          ) : (
            <div className="subscription-detail-row">
              <span className="subscription-detail-label">Prochaine date de renouvellement</span>
              <span className="subscription-detail-value">
                {subscriptionData.nextRenewal || subscriptionData.currentPeriodEnd}
              </span>
            </div>
          )}

          <div className="subscription-detail-row">
            <span className="subscription-detail-label">Prix</span>
            <span className="subscription-detail-value">9,99 € / mois</span>
          </div>
        </div>

        {/* Warning Banner for Cancellation */}
        {subscriptionData.isCanceling && subscriptionData.daysRemaining > 0 && (
          <div className="subscription-warning-banner">
            <AlertCircleIcon />
            <p className="subscription-warning-text">
              Votre abonnement sera annulé le {subscriptionData.currentPeriodEnd} ({subscriptionData.daysRemaining} jours restants)
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="subscription-actions">
          {subscriptionData.isCanceling ? (
            <button
              onClick={handleReactivateSubscription}
              disabled={isLoading}
              className="subscription-btn subscription-btn-primary"
            >
              {isLoading ? 'Chargement...' : 'Réactiver l\'abonnement'}
            </button>
          ) : (
            <button
              onClick={() => setShowCancelModal(true)}
              className="subscription-btn subscription-btn-danger"
            >
              Annuler l'abonnement
            </button>
          )}
        </div>
      </div>

      {/* Payment Method Card */}
      <div className="subscription-card">
        <div className="subscription-card-header">
          <div className="subscription-card-icon subscription-icon-blue">
            <CreditCardIcon />
          </div>
          <div>
            <h2 className="subscription-card-title">Méthode de paiement</h2>
            <p className="subscription-card-subtitle">Gérer vos informations de paiement</p>
          </div>
        </div>

        {paymentMethod ? (
          <div className="subscription-payment-method">
            <div className="subscription-payment-card-preview">
              <div className="subscription-payment-card-brand">
                {paymentMethod.brand?.toUpperCase() || 'CARD'}
              </div>
            </div>
            <div className="subscription-payment-details">
              <p className="subscription-payment-number">
                •••• {paymentMethod.last4}
              </p>
              <p className="subscription-payment-expiry">
                Expire {paymentMethod.exp_month}/{paymentMethod.exp_year}
              </p>
            </div>
          </div>
        ) : (
          <p className="subscription-no-payment">Aucune méthode de paiement enregistrée</p>
        )}

        <div className="subscription-actions">
          <button
            onClick={handleUpdatePaymentMethod}
            disabled={isLoading}
            className="subscription-btn subscription-btn-secondary"
          >
            {isLoading ? 'Chargement...' : 'Mettre à jour la carte'}
          </button>
        </div>
      </div>

      {/* Billing History Card */}
      <div className="subscription-card">
        <div className="subscription-card-header">
          <div className="subscription-card-icon subscription-icon-purple">
            <CalendarIcon />
          </div>
          <div>
            <h2 className="subscription-card-title">Historique de facturation</h2>
            <p className="subscription-card-subtitle">Consultez vos factures</p>
          </div>
        </div>

        <div className="subscription-actions">
          <button
            onClick={handleUpdatePaymentMethod}
            className="subscription-btn subscription-btn-secondary"
          >
            Voir mes factures
          </button>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="subscription-modal-backdrop" onClick={() => setShowCancelModal(false)}>
          <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
            <div className="subscription-modal-header">
              <div className="subscription-modal-icon subscription-icon-red">
                <AlertCircleIcon />
              </div>
              <h3 className="subscription-modal-title">Annuler l'abonnement ?</h3>
            </div>
            
            <p className="subscription-modal-text">
              Êtes-vous sûr de vouloir annuler votre abonnement ? Vous conserverez l'accès au Plan Pro jusqu'au {subscriptionData.currentPeriodEnd || subscriptionData.nextRenewal}.
            </p>

            <div className="subscription-modal-actions">
              <button
                onClick={() => setShowCancelModal(false)}
                className="subscription-btn subscription-btn-secondary"
              >
                Garder mon abonnement
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="subscription-btn subscription-btn-danger"
              >
                {isLoading ? 'Annulation...' : 'Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Notice */}
      <div className="subscription-legal-notice">
        <h3 className="subscription-legal-title">Conformité légale (France) :</h3>
        <ul className="subscription-legal-list">
          <li>Vous pouvez annuler votre abonnement à tout moment</li>
          <li>L'annulation prend effet à la fin de votre période de facturation en cours</li>
          <li>Aucun remboursement n'est effectué pour la période en cours</li>
          <li>Vos données sont conservées conformément au RGPD</li>
        </ul>
      </div>
    </div>
  );
};

export default SubscriptionManagement;



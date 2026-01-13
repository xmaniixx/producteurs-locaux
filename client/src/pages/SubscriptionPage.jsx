// ============================================
// PAGE GÉRER MON ABONNEMENT
// ============================================

import { useNavigate } from 'react-router-dom';
import SubscriptionManagement from '../components/SubscriptionManagement';
import './SubscriptionPage.css';

// Icône SVG simple
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const SubscriptionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="subscription-page">
      {/* Header avec bouton retour */}
      <div className="subscription-page-header">
        <div className="subscription-page-header-content">
          <button
            onClick={() => navigate('/producteur/dashboard')}
            className="subscription-page-back-button"
          >
            <ArrowLeftIcon />
            <span>Retour au dashboard</span>
          </button>
        </div>
      </div>

      {/* Contenu principal avec animation */}
      <div className="subscription-page-content animate-fade-in">
        <SubscriptionManagement />
      </div>
    </div>
  );
};

export default SubscriptionPage;




// ============================================
// COMPOSANT PRINCIPAL - Router de l'application
// ============================================
// Gère la navigation entre les différentes pages

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import UserAuth from './pages/UserAuth';
import UserAccount from './pages/UserAccount';
import UserFavorites from './pages/UserFavorites';
import BecomeProducer from './pages/BecomeProducer';
import ForgotPassword from './pages/ForgotPassword';
import ProducteurDashboard from './pages/ProducteurDashboard';
import ProducteurModifier from './pages/ProducteurModifier';
import SubscriptionPage from './pages/SubscriptionPage';
import EditFarmPage from './pages/EditFarmPage';
import Success from './pages/Success';
import './App.css';

// Composant pour wrapper les pages avec animation
function PageTransition({ children }) {
  return (
    <div className="page-transition">
      {children}
    </div>
  );
}

// Composant pour protéger les routes et rediriger vers /connexion si non connecté
function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier d'abord le JWT dans localStorage (simple et efficace)
        const token = localStorage.getItem('token');
        
        if (token) {
          // Si token présent, on considère l'utilisateur comme authentifié
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        }
        
        // Pas de token, vérifier la session
        const response = await fetch('/api/utilisateur/verifier', {
          credentials: 'include'
        });
        
        // Vérifier si la réponse est OK avant de parser JSON
        if (!response.ok) {
          // Si l'API retourne une erreur, rediriger vers la connexion
          setIsAuthenticated(false);
          setIsChecking(false);
          navigate('/connexion', { replace: true });
          return;
        }
        
        const data = await response.json();
        const connected = data.connected || false;
        setIsAuthenticated(connected);
        
        if (!connected) {
          navigate('/connexion', { replace: true });
        }
      } catch (error) {
        console.error('Erreur vérification authentification:', error);
        // En cas d'erreur, vérifier le token comme fallback
        const token = localStorage.getItem('token');
        if (token) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          navigate('/connexion', { replace: true });
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Afficher un loader pendant la vérification
  if (isChecking) {
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
          <div style={{ color: '#114248', fontWeight: '600' }}>Chargement...</div>
        </div>
      </div>
    );
  }

  // Si authentifié, afficher le contenu protégé
  // Sinon, afficher le loader (ne jamais retourner null pour éviter les pages blanches)
  if (!isAuthenticated) {
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
          <div style={{ color: '#114248', fontWeight: '600' }}>Redirection...</div>
        </div>
      </div>
    );
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  
  return (
    <div className="app">
      <Routes location={location} key={location.pathname}>
        {/* Page de connexion/inscription utilisateur (accessible sans authentification) */}
        <Route path="/connexion" element={
          <PageTransition>
            <UserAuth />
          </PageTransition>
        } />
        <Route path="/reset-password" element={
          <PageTransition>
            <ForgotPassword />
          </PageTransition>
        } />
        
        {/* Page d'accueil avec la carte (protégée - nécessite connexion) */}
        <Route path="/" element={
          <ProtectedRoute>
            <PageTransition>
              <HomePage />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Espace utilisateur (protégé) */}
        <Route path="/mon-compte" element={
          <ProtectedRoute>
            <PageTransition>
              <UserAccount />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/mes-favoris" element={
          <ProtectedRoute>
            <PageTransition>
              <UserFavorites />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/devenir-producteur" element={
          <ProtectedRoute>
            <PageTransition>
              <BecomeProducer />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Dashboard producteur - Vérifie le badge producteur */}
        <Route path="/producteur/dashboard" element={
          <PageTransition>
            <ProducteurDashboard />
          </PageTransition>
        } />
        <Route path="/producteur/dashboard/subscription" element={
          <ProtectedRoute>
            <PageTransition>
              <SubscriptionPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/producteur/dashboard/edit-profile" element={
          <ProtectedRoute>
            <PageTransition>
              <EditFarmPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/producteur/modifier" element={
          <PageTransition>
            <ProducteurModifier />
          </PageTransition>
        } />
        
        {/* Page de succès après paiement Stripe */}
        <Route path="/success" element={
          <ProtectedRoute>
            <PageTransition>
              <Success />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Redirection par défaut vers la page de connexion */}
        <Route path="*" element={<Navigate to="/connexion" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;


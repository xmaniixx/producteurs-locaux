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

  console.log('🔍 ProtectedRoute - Rendu initial', { isChecking, isAuthenticated });

  useEffect(() => {
    console.log('🔍 ProtectedRoute - useEffect déclenché');
    const checkAuth = async () => {
      console.log('🔍 ProtectedRoute - Début checkAuth');
      try {
        // Vérifier d'abord le JWT dans localStorage (simple et efficace)
        const token = localStorage.getItem('token');
        console.log('🔍 ProtectedRoute - Token localStorage:', token ? '✅ Présent' : '❌ Absent');
        
        if (token) {
          // Si token présent, on considère l'utilisateur comme authentifié
          console.log('🔍 ProtectedRoute - Token trouvé, authentification automatique');
          setIsAuthenticated(true);
          setIsChecking(false);
          console.log('🔍 ProtectedRoute - État mis à jour: isAuthenticated=true, isChecking=false');
          return;
        }
        
        // Pas de token, vérifier la session
        console.log('🔍 ProtectedRoute - Pas de token, vérification session API');
        const response = await fetch('/api/utilisateur/verifier', {
          credentials: 'include'
        });
        
        console.log('🔍 ProtectedRoute - Réponse API:', { 
          status: response.status, 
          ok: response.ok,
          statusText: response.statusText 
        });
        
        // Vérifier si la réponse est OK avant de parser JSON
        if (!response.ok) {
          // Si l'API retourne une erreur, rediriger vers la connexion
          console.log('❌ ProtectedRoute - API retourne erreur, redirection vers /connexion');
          setIsAuthenticated(false);
          setIsChecking(false);
          navigate('/connexion', { replace: true });
          return;
        }
        
        const data = await response.json();
        console.log('🔍 ProtectedRoute - Données API:', data);
        const connected = data.connected || false;
        console.log('🔍 ProtectedRoute - Utilisateur connecté:', connected);
        setIsAuthenticated(connected);
        
        if (!connected) {
          console.log('❌ ProtectedRoute - Utilisateur non connecté, redirection vers /connexion');
          navigate('/connexion', { replace: true });
        } else {
          console.log('✅ ProtectedRoute - Utilisateur connecté, authentification OK');
        }
      } catch (error) {
        console.error('❌ ProtectedRoute - Erreur vérification authentification:', error);
        // En cas d'erreur, vérifier le token comme fallback
        const token = localStorage.getItem('token');
        if (token) {
          console.log('🔍 ProtectedRoute - Erreur mais token présent, authentification fallback');
          setIsAuthenticated(true);
        } else {
          console.log('❌ ProtectedRoute - Erreur et pas de token, redirection vers /connexion');
          setIsAuthenticated(false);
          navigate('/connexion', { replace: true });
        }
      } finally {
        console.log('🔍 ProtectedRoute - Fin checkAuth, setIsChecking(false)');
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Afficher un loader pendant la vérification
  if (isChecking) {
    console.log('⏳ ProtectedRoute - Affichage du loader (isChecking=true)');
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
          <div style={{ color: '#114248', fontWeight: '600', fontSize: '24px' }}>⏳ Chargement en cours...</div>
        </div>
      </div>
    );
  }

  // Si authentifié, afficher le contenu protégé
  // Sinon, afficher le loader (ne jamais retourner null pour éviter les pages blanches)
  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute - Pas authentifié, affichage loader redirection');
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
          <div style={{ color: '#114248', fontWeight: '600', fontSize: '24px' }}>🔄 Redirection...</div>
        </div>
      </div>
    );
  }

  console.log('✅ ProtectedRoute - Utilisateur authentifié, affichage children');
  return children;
}

function AppContent() {
  const location = useLocation();
  
  console.log('🌐 AppContent - Rendu, location:', location.pathname);
  
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


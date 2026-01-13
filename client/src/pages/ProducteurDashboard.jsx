// ============================================
// DASHBOARD PRODUCTEUR
// ============================================
// Affiche les statistiques du producteur connecté avec graphiques circulaires et filtres temporels

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchAPI, post } from '../api/api';
import CircularChart from '../components/CircularChart';
import SettingsMenu from '../components/SettingsMenu';
import './ProducteurDashboard.css';

// Icône SVG simple pour ChevronDown
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);


// Composant pour une barre de tranche d'âge
function AgeBar({ tranche, pourcentage, count, delay }) {
  const [animatedPourcentage, setAnimatedPourcentage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPourcentage(pourcentage);
    }, delay);

    return () => clearTimeout(timer);
  }, [pourcentage, delay]);

  // Formater l'affichage de la tranche (13-17 -> "13–17 ans", 65+ -> "65+ ans")
  const formatTranche = (tranche) => {
    if (tranche.includes('+')) {
      return tranche + ' ans';
    }
    return tranche.replace('-', '–') + ' ans';
  };

  return (
    <div className="age-bar-item">
      <div className="age-bar-label">{formatTranche(tranche)}</div>
      <div className="age-bar-wrapper">
        <div 
          className="age-bar-fill"
          style={{ width: `${animatedPourcentage}%` }}
        />
      </div>
      <div className="age-bar-percentage">{pourcentage}%</div>
    </div>
  );
}

// Composant pour une barre d'heure
function HourBar({ plage, pourcentage, delay }) {
  const [animatedPourcentage, setAnimatedPourcentage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPourcentage(pourcentage);
    }, delay);

    return () => clearTimeout(timer);
  }, [pourcentage, delay]);

  return (
    <div className="hour-bar-item">
      <div className="hour-bar-label">{plage}</div>
      <div className="hour-bar-wrapper">
        <div 
          className="hour-bar-fill"
          style={{ width: `${animatedPourcentage}%` }}
        />
      </div>
      <div className="hour-bar-percentage">{pourcentage}%</div>
    </div>
  );
}

// Composant pour la comparaison semaine précédente
function WeekComparison({ label, current, previous, icon }) {
  if (previous === null || previous === undefined) {
    return (
      <div className="comparison-item">
        <div className="comparison-header">
          <span className="comparison-icon">{icon}</span>
          <span className="comparison-label">{label}</span>
        </div>
        <div className="comparison-value">{current}</div>
        <div className="comparison-change neutral">—</div>
      </div>
    );
  }

  const difference = current - previous;
  const percentage = previous > 0 ? Math.round((difference / previous) * 100) : (current > 0 ? 100 : 0);
  const isPositive = difference > 0;
  const isNeutral = difference === 0;

  return (
    <div className="comparison-item">
      <div className="comparison-header">
        <span className="comparison-icon">{icon}</span>
        <span className="comparison-label">{label}</span>
      </div>
      <div className="comparison-value">{current}</div>
      <div className={`comparison-change ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`}>
        {isPositive ? '↑' : isNeutral ? '→' : '↓'} {Math.abs(percentage)}%
      </div>
    </div>
  );
}

// Composant pour le graphique visiteurs par jour
function DailyVisitorsChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>Pas encore de données</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count), 1);
  const chartWidth = 700;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 20, left: 40 };
  const availableWidth = chartWidth - padding.left - padding.right;
  const availableHeight = chartHeight - padding.top - padding.bottom;

  const points = data.map((day, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * availableWidth;
    const y = padding.top + availableHeight - (day.count / maxValue) * availableHeight;
    return { x, y, ...day };
  });

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${points[0].x} ${chartHeight - padding.bottom} Z`;

  return (
    <div className="daily-chart-container">
      <svg className="daily-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00D47E" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00D47E" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Zone remplie sous la courbe */}
        <path
          d={areaPath}
          fill="url(#chartGradient)"
          className="chart-area"
        />
        {/* Ligne */}
        <path
          d={pathData}
          fill="none"
          stroke="#00D47E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="chart-line"
        />
        {/* Points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#00D47E"
            stroke="#ffffff"
            strokeWidth="2"
            className="chart-point"
          />
        ))}
      </svg>
      <div className="chart-labels">
        {data.map((day, index) => (
          <div key={index} className="chart-label">
            <span className="chart-label-day">{day.day}</span>
            <span className="chart-label-count">{day.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Fonction pour générer des données placeholder réalistes
function getPlaceholderData(type, periode) {
  if (type === 'visiteurs-jour') {
    const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return jours.map((jour, index) => ({
      day: jour,
      count: 15 + Math.floor(Math.random() * 10) // Valeurs entre 15 et 25
    }));
  }
  
  if (type === 'top-heures') {
    return {
      plages: [
        { plage: '6h–9h', count: 12, pourcentage: 8 },
        { plage: '9h–12h', count: 35, pourcentage: 23 },
        { plage: '12h–15h', count: 42, pourcentage: 28 },
        { plage: '15h–18h', count: 32, pourcentage: 21 },
        { plage: '18h–21h', count: 24, pourcentage: 16 },
        { plage: '21h–00h', count: 5, pourcentage: 4 }
      ],
      total: 150
    };
  }
  
  if (type === 'comparaison') {
    return {
      vues: { current: 0, previous: null },
      clics: { current: 0, previous: null }
    };
  }
  
  if (type === 'tranches-age') {
    return {
      tranches: [
        { tranche: '13-17', count: 5, pourcentage: 8 },
        { tranche: '18-24', count: 15, pourcentage: 25 },
        { tranche: '25-34', count: 20, pourcentage: 33 },
        { tranche: '35-44', count: 12, pourcentage: 20 },
        { tranche: '45-54', count: 5, pourcentage: 8 },
        { tranche: '55-64', count: 2, pourcentage: 3 },
        { tranche: '65+', count: 1, pourcentage: 2 }
      ],
      total: 60
    };
  }
  
  return null;
}

// Composant Paywall Modal
function PaywallModal({ isOpen, onClose, firstName }) {
  const [isLoading, setIsLoading] = useState(false);
  
  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    
    try {
      const response = await post('/api/stripe/create-checkout-session', {});
      
      if (!response.ok) {
        const error = await response.json();
        let userMessage = error.error || 'Erreur lors de la création de la session de paiement';
        
        if (error.code === 'STRIPE_NOT_CONFIGURED' || error.code === 'STRIPE_PRICE_NOT_CONFIGURED') {
          userMessage = 'Le paiement n\'est pas encore configuré. Veuillez réessayer plus tard.';
        } else if (error.code === 'SUBSCRIPTION_ALREADY_ACTIVE') {
          userMessage = 'Vous avez déjà un abonnement actif. Si vous souhaitez le renouveler, veuillez d\'abord annuler l\'abonnement actuel.';
        }
        
        alert(userMessage);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      
      console.log('Réponse API:', data);
      
      if (data.url) {
        console.log('Redirection vers Stripe:', data.url);
        window.location.href = data.url;
      } else {
        console.error('URL manquante dans la réponse:', data);
        alert('Erreur: URL de paiement manquante');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Erreur création session Stripe:', error);
      alert('Erreur lors de la création de la session de paiement');
      setIsLoading(false);
    }
  };

  return (
    <div className="paywall-backdrop" onClick={onClose}>
      <div 
        className="paywall-modal" 
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={(e) => {
          if (!isOpen && e.target.classList.contains('paywall-modal')) {
            // Animation de fermeture terminée
          }
        }}
      >
        <div className="paywall-content">
          <h2 className="paywall-title">Débloque ton potentiel 🚀</h2>
          <p className="paywall-subtitle">Accède aux statistiques avancées et fais grandir ta ferme.</p>
          
          <div className="paywall-offer">
            <div className="paywall-plan-name">Plan Pro</div>
            <div className="paywall-price">9,99 € / mois</div>
            <ul className="paywall-features">
              <li>✔ Statistiques complètes</li>
              <li>✔ Comparaison des périodes</li>
              <li>✔ Top heures & tendances</li>
            </ul>
          </div>

          <button 
            className="paywall-btn-primary" 
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? 'Redirection...' : 'Passer au Plan Pro'}
          </button>
          <button className="paywall-btn-secondary" onClick={onClose}>
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

function ProducteurDashboard() {
  const [producteur, setProducteur] = useState(null);
  const [stats, setStats] = useState(null);
  const [tranchesAge, setTranchesAge] = useState(null);
  const [topHeures, setTopHeures] = useState(null);
  const [comparaisonSemaine, setComparaisonSemaine] = useState(null);
  const [visiteursParJour, setVisiteursParJour] = useState(null);
  const [userPlan, setUserPlan] = useState('free');
  const [userFirstName, setUserFirstName] = useState('');
  const [chargement, setChargement] = useState(true);
  const [periode, setPeriode] = useState('semaine'); // 'semaine', 'mois', '3mois', 'annee'
  const [showPaywall, setShowPaywall] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const navigate = useNavigate();

  // Variable centrale : isPro
  // Utiliser subscriptionInfo.isActive si disponible, sinon userPlan
  // IMPORTANT: Vérifier explicitement === true car isActive peut être undefined
  const isPro = (subscriptionInfo?.isActive === true) || (userPlan === 'pro');
  
  // Log pour déboguer (seulement si subscriptionInfo existe)
  useEffect(() => {
    if (subscriptionInfo) {
      console.log('🔓 Calcul isPro:', {
        subscriptionInfoIsActive: subscriptionInfo.isActive,
        subscriptionInfoPlan: subscriptionInfo.plan,
        userPlan,
        isPro
      });
    }
  }, [subscriptionInfo, userPlan, isPro]);

  // Mapping des périodes
  const periodeMapping = {
    'semaine': '7 jours',
    'mois': '1 mois',
    '3mois': '3 mois',
    'annee': '1 an'
  };

  // Recharger toutes les données quand la période change
  useEffect(() => {
    chargerDonnees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periode]);

  // Recharger les données quand on revient de la page Success (après paiement)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success') === 'true') {
      // Recharger les données après un délai pour laisser le temps à l'activation
      setTimeout(() => {
        chargerDonnees();
      }, 1000);
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chargerDonnees = async () => {
    try {
      // Vérifier la connexion utilisateur
      const responseAuth = await fetchAPI('/api/utilisateur/verifier');
      const dataAuth = await responseAuth.json();

      if (!dataAuth.connected) {
        // Pas connecté → rediriger vers connexion
        navigate('/connexion');
        return;
      }

      // Vérifier le badge producteur (statut producteur)
      const responseStatut = await fetchAPI('/api/utilisateur/statut-producteur');
      const dataStatut = await responseStatut.json();

      if (!dataStatut.est_producteur) {
        // Pas producteur → rediriger vers devenir-producteur
        navigate('/devenir-producteur');
        return;
      }

      // Producteur confirmé - récupérer l'ID producteur
      const producteurId = dataStatut.producteur_id;

      if (!producteurId) {
        console.error('Producteur ID non trouvé');
        navigate('/devenir-producteur');
        return;
      }

      // Récupérer les infos producteur
      const responseProducteur = await fetchAPI(`/api/producteurs/${producteurId}`);
      
      if (!responseProducteur.ok) {
        console.error('Erreur récupération producteur');
        navigate('/devenir-producteur');
        return;
      }

      const dataProducteur = await responseProducteur.json();
      setProducteur({ id: producteurId, ...dataProducteur });

      // Récupérer le prénom de l'utilisateur pour personnaliser le message
      try {
        const responseUser = await fetchAPI('/api/utilisateur/verifier');
        if (responseUser.ok) {
          const userData = await responseUser.json();
          // Extraire le prénom depuis l'email ou utiliser une valeur par défaut
          if (userData.email) {
            const emailName = userData.email.split('@')[0];
            // Extraire le prénom si format "prenom.nom" ou utiliser tout
            const nameParts = emailName.split('.');
            const firstName = nameParts[0] || emailName;
            setUserFirstName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
          }
        }
      } catch (error) {
        // Erreur silencieuse, utiliser valeur par défaut
        setUserFirstName('Producteur');
      }

      // Charger les informations d'abonnement AVANT les stats pour déterminer le plan
      let currentPlan = 'free';
      let subscriptionData = null; // Stocker les données pour les utiliser plus tard
      try {
        const responseSub = await fetchAPI('/api/stripe/subscription');
        if (responseSub.ok) {
          const subData = await responseSub.json();
          console.log('📊 Subscription Info RAW:', JSON.stringify(subData, null, 2));
          subscriptionData = subData; // Stocker pour utilisation immédiate
          setSubscriptionInfo(subData); // Mettre à jour le state pour l'affichage
          
          // Log détaillé pour déboguer
          console.log('📊 Subscription Info:', {
            plan: subData.plan,
            status: subData.status,
            isActive: subData.isActive,
            isCanceling: subData.isCanceling,
            cancelAtPeriodEnd: subData.cancelAtPeriodEnd,
            daysRemaining: subData.daysRemaining,
            nextRenewal: subData.nextRenewal
          });
          
          // Utiliser isActive pour déterminer le plan (même si annulé, tant que la période n'est pas expirée)
          if (subData.isActive === true) {
            currentPlan = 'pro';
            console.log('✅ Plan déterminé comme Pro via subscriptionInfo.isActive');
          } else {
            console.log('⚠️ subscriptionInfo.isActive est false ou undefined');
          }
        } else {
          console.error('❌ Erreur récupération subscription:', responseSub.status, responseSub.statusText);
        }
      } catch (error) {
        console.error('Erreur chargement abonnement:', error);
      }
      
      // IMPORTANT: Utiliser subscriptionInfo.isActive pour déterminer le plan, pas seulement dataStats.plan

      // Charger les statistiques avec la période sélectionnée
      const url = `/api/stats/producteur/${producteurId}?periode=${periode}`;
      try {
        const responseStats = await fetchAPI(url);

        if (responseStats.status === 403) {
          // Ne pas écraser currentPlan si on a déjà déterminé qu'il est Pro via subscriptionInfo.isActive
          if (currentPlan !== 'pro') {
            currentPlan = 'free';
          }
          setStats({
            nomFerme: dataProducteur.nom || 'Non disponible',
            nombreVues: 0,
            nombreClicsYAller: 0,
            nombreTotalVisites: 0,
            periode: periode,
            plan: 'free'
          });
        } else {
          const dataStats = await responseStats.json();
          if (dataStats.error) {
            // Ne pas écraser currentPlan si on a déjà déterminé qu'il est Pro via subscriptionInfo.isActive
            if (currentPlan !== 'pro') {
              currentPlan = 'free';
            }
            setStats({
              nomFerme: dataProducteur.nom || 'Non disponible',
              nombreVues: 0,
              nombreClicsYAller: 0,
              nombreTotalVisites: 0,
              periode: periode
            });
          } else {
            setStats(dataStats);
            // Ne pas écraser currentPlan si on a déjà déterminé qu'il est Pro via subscriptionInfo.isActive
            // Utiliser le plan des stats seulement si on n'a pas encore de plan Pro
            if (currentPlan !== 'pro') {
              currentPlan = dataStats.plan || 'free';
            }
          }
        }
      } catch (error) {
        // Erreur silencieuse, utiliser des données par défaut
        // Ne pas écraser currentPlan si on a déjà déterminé qu'il est Pro via subscriptionInfo.isActive
        if (currentPlan !== 'pro') {
          currentPlan = 'free';
        }
        setStats({
          nomFerme: dataProducteur.nom || 'Non disponible',
          nombreVues: 0,
          nombreClicsYAller: 0,
          nombreTotalVisites: 0,
          periode: periode
        });
      }

      // Mettre à jour le plan utilisateur
      // IMPORTANT: Si subscriptionData.isActive est true, forcer currentPlan à 'pro'
      // Utiliser subscriptionData (variable locale) au lieu de subscriptionInfo (state React)
      if (subscriptionData?.isActive === true && currentPlan !== 'pro') {
        console.log('🔄 Correction: currentPlan forcé à pro car subscriptionData.isActive est true');
        currentPlan = 'pro';
      }
      
      setUserPlan(currentPlan);
      console.log('🎯 Plan final déterminé:', currentPlan, {
        subscriptionDataIsActive: subscriptionData?.isActive,
        subscriptionDataPlan: subscriptionData?.plan,
        currentPlan
      });

      // BLOQUER TOUS LES FETCH PREMIUM SI !isPro
      // Utiliser subscriptionData.isActive en priorité (variable locale, pas le state)
      const isProNow = (subscriptionData?.isActive === true) || (currentPlan === 'pro');
      console.log('🔓 isProNow:', isProNow, {
        subscriptionDataIsActive: subscriptionData?.isActive,
        currentPlan
      });
      
      if (!isProNow) {
        // Plan gratuit - NE PAS appeler les APIs premium
        // Utiliser des placeholder data pour que les stats soient toujours visibles
        setTranchesAge(getPlaceholderData('tranches-age', periode));
        setTopHeures(getPlaceholderData('top-heures', periode));
        setComparaisonSemaine(getPlaceholderData('comparaison', periode));
        setVisiteursParJour(getPlaceholderData('visiteurs-jour', periode));
        setChargement(false);
        return; // ARRÊTER ICI - AUCUN FETCH PREMIUM
      }

      // Charger les tranches d'âge (UNIQUEMENT si plan Pro)
      try {
        const urlTranches = `/api/stats/producteur/${producteurId}/tranches-age?periode=${periode}`;
        const responseTranches = await fetchAPI(urlTranches);
        
        if (responseTranches.ok) {
          const dataTranches = await responseTranches.json();
          if (dataTranches.error) {
            setTranchesAge(null);
          } else {
            setTranchesAge(dataTranches);
          }
        } else {
          setTranchesAge(null);
        }
      } catch (error) {
        // Erreur silencieuse
        setTranchesAge(null);
      }

      // Charger les top heures depuis l'API (UNIQUEMENT si plan Pro)
      try {
        const urlTopHeures = `/api/stats/producteur/${producteurId}/top-heures?periode=${periode}`;
        const responseTopHeures = await fetchAPI(urlTopHeures);
        
        if (responseTopHeures.ok) {
          const dataTopHeures = await responseTopHeures.json();
          if (dataTopHeures.error) {
            setTopHeures(getPlaceholderData('top-heures', periode));
          } else {
            setTopHeures(dataTopHeures);
          }
        } else {
          setTopHeures(getPlaceholderData('top-heures', periode));
        }
      } catch (error) {
        // Erreur silencieuse, utiliser placeholder
        setTopHeures(getPlaceholderData('top-heures', periode));
      }

      // Charger la comparaison période précédente depuis l'API (UNIQUEMENT si plan Pro)
      try {
        const urlComparaison = `/api/stats/producteur/${producteurId}/comparaison?periode=${periode}`;
        const responseComparaison = await fetchAPI(urlComparaison);
        
        if (responseComparaison.ok) {
          const dataComparaison = await responseComparaison.json();
          if (dataComparaison.error) {
            setComparaisonSemaine(getPlaceholderData('comparaison', periode));
          } else {
            setComparaisonSemaine(dataComparaison);
          }
        } else {
          setComparaisonSemaine(getPlaceholderData('comparaison', periode));
        }
      } catch (error) {
        // Erreur silencieuse, utiliser placeholder
        setComparaisonSemaine(getPlaceholderData('comparaison', periode));
      }

      // Charger les visiteurs par jour depuis l'API (UNIQUEMENT si plan Pro)
      try {
        const urlVisiteursJour = `/api/stats/producteur/${producteurId}/visiteurs-jour?periode=${periode}`;
        const responseVisiteursJour = await fetchAPI(urlVisiteursJour);
        
        if (responseVisiteursJour.ok) {
          const dataVisiteursJour = await responseVisiteursJour.json();
          if (dataVisiteursJour.error) {
            setVisiteursParJour(getPlaceholderData('visiteurs-jour', periode));
          } else {
            setVisiteursParJour(dataVisiteursJour.data);
          }
        } else {
          setVisiteursParJour(getPlaceholderData('visiteurs-jour', periode));
        }
      } catch (error) {
        // Erreur silencieuse, utiliser placeholder
        setVisiteursParJour(getPlaceholderData('visiteurs-jour', periode));
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      navigate('/devenir-producteur');
    } finally {
      setChargement(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await post('/api/stripe/cancel-subscription', {
        immediate: false
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Erreur annulation:', error);
        alert(error.error || 'Erreur lors de l\'annulation');
        return;
      }

      const data = await response.json();
      console.log('✅ Annulation réussie:', data);
      alert(data.message || 'Votre abonnement a été annulé. L\'accès sera maintenu jusqu\'à la fin de la période payée.');
      
      // Fermer le modal
      setShowCancelModal(false);
      
      // Recharger les informations d'abonnement
      const responseSub = await fetchAPI('/api/stripe/subscription');
      if (responseSub.ok) {
        const subData = await responseSub.json();
        setSubscriptionInfo(subData);
        if (!subData.isActive) {
          setUserPlan('free');
        }
      }
      
      setShowCancelModal(false);
    } catch (error) {
      console.error('Erreur annulation:', error);
      alert('Erreur lors de l\'annulation de l\'abonnement');
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      console.log('🔄 Tentative de réactivation de l\'abonnement...');
      console.log('📊 État actuel subscriptionInfo:', {
        isActive: subscriptionInfo?.isActive,
        isCanceling: subscriptionInfo?.isCanceling,
        cancelAtPeriodEnd: subscriptionInfo?.cancelAtPeriodEnd,
        status: subscriptionInfo?.status,
        daysRemaining: subscriptionInfo?.daysRemaining
      });
      
      const response = await post('/api/stripe/reactivate-subscription', {});

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Erreur réactivation:', error);
        
        // SCÉNARIO 3 : Si la réactivation nécessite un passage par le checkout (abonnement expiré)
        if (error.requiresCheckout) {
          const confirmMessage = error.message || error.error || 'Pour réactiver votre abonnement, veuillez souscrire à nouveau via le bouton "Plan Pro".';
          if (window.confirm(confirmMessage + '\n\nSouhaitez-vous être redirigé vers le checkout ?')) {
            // Ouvrir le paywall pour permettre la souscription
            setShowPaywall(true);
          }
        } else {
          alert(error.error || 'Erreur lors de la réactivation');
        }
        return;
      }

      const data = await response.json();
      console.log('✅ Réactivation réussie:', data);
      console.log('📥 Réponse complète:', JSON.stringify(data, null, 2));
      
      if (data.requiresCheckout) {
        // Ouvrir le paywall pour permettre la souscription
        setShowPaywall(true);
        return;
      }
      
      // SUCCESS - Attendre un peu pour que Stripe et la DB soient synchronisés
      console.log('⏳ Attente de 1 seconde pour synchronisation Stripe/DB...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recharger les données d'abonnement
      console.log('🔄 Rechargement des données d\'abonnement...');
      try {
        const responseSub = await fetchAPI('/api/stripe/subscription');
        if (responseSub.ok) {
          const subData = await responseSub.json();
          console.log('📊 Nouvelles données abonnement reçues:', {
            plan: subData.plan,
            status: subData.status,
            isActive: subData.isActive,
            isCanceling: subData.isCanceling,
            cancelAtPeriodEnd: subData.cancelAtPeriodEnd,
            daysRemaining: subData.daysRemaining
          });
          setSubscriptionInfo(subData);
        }
      } catch (error) {
        console.error('❌ Erreur rechargement abonnement:', error);
      }
      
      // Recharger toutes les données
      console.log('🔄 Rechargement complet des données...');
      await chargerDonnees();
      
      console.log('✅ Données rechargées, interface devrait être mise à jour');
      alert(data.message || 'Votre abonnement a été réactivé. Le renouvellement automatique est à nouveau actif.');
    } catch (error) {
      console.error('Erreur réactivation:', error);
      alert('Erreur lors de la réactivation de l\'abonnement');
    }
  };

  const handleDeconnexion = async () => {
    try {
      await post('/api/auth/deconnexion', {});
      navigate('/');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  if (chargement) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="chargement">Chargement...</div>
        </div>
      </div>
    );
  }

  // Calculer le maximum pour les graphiques (le plus grand des trois)
  const maxValue = stats ? Math.max(stats.nombreVues || 0, stats.nombreClicsYAller || 0, stats.nombreTotalVisites || 0, 1) : 1;

  return (
    <div className="dashboard-page">
      {/* Paywall Modal - affiché si l'utilisateur n'est pas Pro */}
      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)}
        firstName={userFirstName}
      />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>🌾 Tableau de bord</h1>
          <div className="dashboard-actions">
            {!isPro && (
              <button 
                onClick={() => setShowPaywall(true)} 
                className="btn-pro"
              >
                🚀 Plan Pro
              </button>
            )}
            <SettingsMenu />
            <Link to="/" className="btn-secondary">
              🗺️ Voir la carte
            </Link>
            <button onClick={handleDeconnexion} className="btn-deconnexion">
              Déconnexion
            </button>
          </div>
        </div>

        {producteur && (
          <div className="dashboard-welcome">
            <h2>Bienvenue, {producteur.nom} !</h2>
            <p>Voici vos statistiques de visibilité</p>
          </div>
        )}




        {/* Filtres temporels */}
        <div className="stats-filters">
          <h3>📅 Période</h3>
          <div className="filters-buttons">
            <button 
              className={periode === 'semaine' ? 'active' : ''}
              onClick={() => {
                setChargement(true);
                setPeriode('semaine');
              }}
              disabled={chargement && periode !== 'semaine'}
            >
              {chargement && periode === 'semaine' ? '⏳' : '7 jours'}
            </button>
            <button 
              className={periode === 'mois' ? 'active' : ''}
              onClick={() => {
                setChargement(true);
                setPeriode('mois');
              }}
              disabled={chargement && periode !== 'mois'}
            >
              {chargement && periode === 'mois' ? '⏳' : '1 mois'}
            </button>
            <button 
              className={periode === '3mois' ? 'active' : ''}
              onClick={() => {
                setChargement(true);
                setPeriode('3mois');
              }}
              disabled={chargement && periode !== '3mois'}
            >
              {chargement && periode === '3mois' ? '⏳' : '3 mois'}
            </button>
            <button 
              className={periode === 'annee' ? 'active' : ''}
              onClick={() => {
                setChargement(true);
                setPeriode('annee');
              }}
              disabled={chargement && periode !== 'annee'}
            >
              {chargement && periode === 'annee' ? '⏳' : '1 an'}
            </button>
          </div>
        </div>

        {/* Graphiques circulaires */}
        {stats && (
          <div className="stats-circular-grid">
            <div className="stat-card-circular">
              <div className="stat-header">
                <div className="stat-icon">📊</div>
                <div className="stat-label">Vues</div>
              </div>
              <CircularChart 
                value={stats.nombreVues || 0} 
                max={maxValue}
                color="#00D47E"
                size={140}
              />
              <div className="stat-description">
                Consultations de votre fiche
              </div>
            </div>

            <div className="stat-card-circular">
              <div className="stat-header">
                <div className="stat-icon">🧭</div>
                <div className="stat-label">Clics "Y aller"</div>
              </div>
              <CircularChart 
                value={stats.nombreClicsYAller || 0} 
                max={maxValue}
                color="#114248"
                size={140}
              />
              <div className="stat-description">
                Demandes d'itinéraire
              </div>
            </div>

            <div className="stat-card-circular stat-card-featured">
              <div className="stat-header">
                <div className="stat-icon">👥</div>
                <div className="stat-label">Total visites</div>
              </div>
              <CircularChart 
                value={stats.nombreTotalVisites || 0} 
                max={maxValue}
                color="#4AE3A8"
                size={160}
              />
              <div className="stat-description">
                Toutes interactions
              </div>
            </div>
          </div>
        )}

        {/* Section Tranches d'âge des visiteurs - TOUJOURS affichée */}
        {tranchesAge && (
          <div className="age-demographics-section stats-container">
            <div className={`stats-content ${!isPro ? 'blurred' : ''}`}>
              <h3>👥 Tranches d'âge des visiteurs</h3>
              {tranchesAge.total === 0 ? (
                <p className="no-data-message">Pas encore assez de données</p>
              ) : (
                <div className="age-bars-container">
                  {tranchesAge.tranches.map((item, index) => (
                    <AgeBar
                      key={item.tranche}
                      tranche={item.tranche}
                      pourcentage={item.pourcentage}
                      count={item.count}
                      delay={index * 50}
                    />
                  ))}
                </div>
              )}
            </div>
            {!isPro && (
              <div className="stats-premium-cta">
                <button className="btn-premium-open" onClick={() => setShowPaywall(true)}>
                  🔒 Débloquer avec le Plan Pro
                </button>
              </div>
            )}
          </div>
        )}

        {/* Section Top heures de visite - TOUJOURS affichée */}
        {topHeures && (
          <div className="top-hours-section stats-container">
            <div className={`stats-content ${!isPro ? 'blurred' : ''}`}>
              <h3>⏰ Top heures de visite</h3>
              {topHeures.total === 0 ? (
                <p className="no-data-message">Données insuffisantes pour le moment</p>
              ) : (
                <div className="hour-bars-container">
                  {topHeures.plages.map((item, index) => (
                    <HourBar
                      key={item.plage}
                      plage={item.plage}
                      pourcentage={item.pourcentage}
                      delay={index * 50}
                    />
                  ))}
                </div>
              )}
            </div>
            {!isPro && (
              <div className="stats-premium-cta">
                <button className="btn-premium-open" onClick={() => setShowPaywall(true)}>
                  🔒 Débloquer avec le Plan Pro
                </button>
              </div>
            )}
          </div>
        )}

        {/* Section Comparaison semaine précédente - TOUJOURS affichée */}
        {comparaisonSemaine && (
          <div className="week-comparison-section stats-container">
            <div className={`stats-content ${!isPro ? 'blurred' : ''}`}>
              <h3>📈 Comparaison avec la période précédente</h3>
              <div className="comparison-grid">
                <WeekComparison
                  label="Vues"
                  current={comparaisonSemaine.vues.current}
                  previous={comparaisonSemaine.vues.previous}
                  icon="📊"
                />
                <WeekComparison
                  label="Clics 'Y aller'"
                  current={comparaisonSemaine.clics.current}
                  previous={comparaisonSemaine.clics.previous}
                  icon="🧭"
                />
              </div>
            </div>
            {!isPro && (
              <div className="stats-premium-cta">
                <button className="btn-premium-open" onClick={() => setShowPaywall(true)}>
                  🔒 Débloquer avec le Plan Pro
                </button>
              </div>
            )}
          </div>
        )}

        {/* Section Graphique visiteurs par jour - TOUJOURS affichée */}
        {visiteursParJour && (
          <div className="daily-visitors-section stats-container">
            <div className={`stats-content ${!isPro ? 'blurred' : ''}`}>
              <h3>📅 Visiteurs par jour</h3>
              <DailyVisitorsChart data={visiteursParJour} />
            </div>
            {!isPro && (
              <div className="stats-premium-cta">
                <button className="btn-premium-open" onClick={() => setShowPaywall(true)}>
                  🔒 Débloquer avec le Plan Pro
                </button>
              </div>
            )}
          </div>
        )}

        <div className="dashboard-info">
          <h3>💡 Comment ça fonctionne ?</h3>
          <ul>
            <li>
              <strong>Vues :</strong> Quand un utilisateur clique sur votre pin sur la carte
            </li>
            <li>
              <strong>Clics "Y aller" :</strong> Quand un utilisateur demande l'itinéraire vers votre ferme
            </li>
            <li>
              <strong>Visites :</strong> Le total de toutes vos interactions
            </li>
          </ul>
          <p className="info-note">
            Les statistiques sont mises à jour en temps réel. Changez la période pour voir les données filtrées.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProducteurDashboard;


// ============================================
// PAGE DEVENIR PRODUCTEUR
// ============================================
// Permet à un utilisateur de demander à devenir producteur

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Autocomplete } from '@react-google-maps/api';
import { useGoogleMaps } from '../contexts/GoogleMapsProvider';
import Header from '../components/Header';
import './BecomeProducer.css';

function BecomeProducer() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom_ferme: '',
    type_production: '',
    adresse: '',
    ville: '',
    latitude: '',
    longitude: '',
    numero_siret: '',
    justificatif: ''
  });
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [success, setSuccess] = useState(false);
  const [statut, setStatut] = useState(null); // null, 'en_attente', 'validee', 'producteur'
  const autocompleteRef = React.useRef(null);
  const { isLoaded: isGoogleMapsLoaded } = useGoogleMaps();

  const TYPES_PRODUCTION = [
    'Producteur laitier',
    'Maraîcher',
    'Éleveur bovin',
    'Éleveur porcin',
    'Éleveur ovin',
    'Apiculteur',
    'Vergers / Fruits',
    'Vigneron',
    'Céréalier',
    'Producteur de volaille',
    'Autre'
  ];

  // ============================================
  // 🔍 FONCTION UTILITAIRE - Visualiser les demandes stockées
  // ============================================
  // Utiliser dans la console : window.getDemandesProducteur()
  useEffect(() => {
    window.getDemandesProducteur = () => {
      const demandes = JSON.parse(localStorage.getItem('demandes_producteur') || '[]');
      console.table(demandes);
      return demandes;
    };
    
    window.clearDemandesProducteur = () => {
      localStorage.removeItem('demandes_producteur');
      console.log('🗑️ Toutes les demandes ont été supprimées du localStorage');
    };
    
    return () => {
      delete window.getDemandesProducteur;
      delete window.clearDemandesProducteur;
    };
  }, []);

  // Vérifier le statut au chargement
  useEffect(() => {
    verifierStatut();
  }, []);


  const verifierStatut = async () => {
    try {
      const response = await fetchAPI('/api/utilisateur/statut-producteur');
      const data = await response.json();

      if (data.est_producteur) {
        setStatut('producteur');
      } else if (data.demande_en_cours) {
        setStatut(data.statut);
      } else {
        setStatut(null);
      }
    } catch (error) {
      console.error('Erreur vérification statut:', error);
    }
  };

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        setFormData({
          ...formData,
          adresse: place.formatted_address || place.name,
          ville: place.address_components?.find(c => c.types.includes('locality'))?.long_name || '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    setSuccess(false);
    setChargement(true);

    // ============================================
    // 📩 STOCKAGE TEMPORAIRE (LOCAL)
    // ============================================
    
    // 1. Console.log des données
    console.log('📋 Données du formulaire "Devenir Producteur":', {
      ...formData,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString('fr-FR')
    });

    // 2. Stockage dans localStorage
    const demandeData = {
      ...formData,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString('fr-FR'),
      statut: 'en_attente'
    };

    // Récupérer les demandes existantes
    const demandesExistantes = JSON.parse(localStorage.getItem('demandes_producteur') || '[]');
    demandesExistantes.push(demandeData);
    localStorage.setItem('demandes_producteur', JSON.stringify(demandesExistantes));
    
    console.log('💾 Données sauvegardées dans localStorage:', demandeData);
    console.log(`📊 Total des demandes stockées: ${demandesExistantes.length}`);

    // ============================================
    // 🔄 MODE MOCK (TEMPORAIRE)
    // ============================================
    // Simuler une réponse du serveur
    const USE_MOCK_MODE = true; // Passer à false pour activer l'envoi backend
    
    if (USE_MOCK_MODE) {
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuler une réponse réussie
      const mockResponse = {
        success: true,
        statut: 'en_attente', // ou 'validee' si SIRET valide
        message: 'Demande enregistrée avec succès (mode mock)'
      };
      
      console.log('✅ Réponse mock:', mockResponse);
      
      setSuccess(true);
      setStatut(mockResponse.statut);
      
      if (mockResponse.statut === 'validee') {
        setTimeout(() => {
          navigate('/producteur/dashboard');
        }, 3000);
      }
      
      setChargement(false);
      return;
    }

    // ============================================
    // 🚀 ENVOI BACKEND (FUTUR)
    // ============================================
    // Code prêt pour l'activation future
    // Décommenter et désactiver USE_MOCK_MODE pour utiliser
    
    try {
      const response = await post('/api/utilisateur/devenir-producteur', formData);

      const data = await response.json();

      if (data.error) {
        setErreur(data.error);
      } else if (data.success) {
        setSuccess(true);
        setStatut(data.statut);
        
        // Mettre à jour le localStorage avec la réponse du serveur
        const derniereDemande = demandesExistantes[demandesExistantes.length - 1];
        derniereDemande.statut = data.statut;
        derniereDemande.reponse_serveur = data;
        localStorage.setItem('demandes_producteur', JSON.stringify(demandesExistantes));
        
        if (data.statut === 'validee' || mockResponse.statut === 'validee') {
          setTimeout(() => {
            navigate('/producteur/dashboard');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('❌ Erreur demande:', error);
      setErreur('Erreur lors de la demande. Réessayez.');
    } finally {
      setChargement(false);
    }
  };

  // Si déjà producteur, afficher un message
  if (statut === 'producteur') {
    return (
      <div className="become-producer-page">
        <Header />
        <div className="already-producer">
          <div className="success-icon">✅</div>
          <h2>Vous êtes déjà producteur !</h2>
          <p>Vous pouvez accéder à votre espace producteur pour gérer votre profil.</p>
          <button className="btn-primary" onClick={() => navigate('/producteur/dashboard')}>
            Accéder à mon espace producteur
          </button>
        </div>
      </div>
    );
  }

  // Si demande en attente
  if (statut === 'en_attente') {
    return (
      <div className="become-producer-page">
        <Header />
        <div className="already-producer">
          <div className="waiting-icon">⏳</div>
          <h2>Demande en attente</h2>
          <p>Votre demande pour devenir producteur est en cours de validation. Vous serez notifié une fois validée.</p>
          <button className="btn-secondary" onClick={() => navigate('/')}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="become-producer-page">
        <Header />
        
        <div className="become-producer-container">
          <div className="become-producer-header">
            <button className="btn-back" onClick={() => navigate('/')}>
              ← Retour
            </button>
            <h1>🌾 Devenir Producteur</h1>
            <p>Remplissez ce formulaire pour demander à devenir producteur sur notre plateforme</p>
          </div>

          {erreur && (
            <div className="message-erreur">
              {erreur}
            </div>
          )}

          {success && (
            <div className="message-succes">
              ✅ {statut === 'validee' 
                ? 'Votre demande a été validée automatiquement ! Vous êtes maintenant producteur.' 
                : 'Votre demande a été envoyée avec succès. Vous serez notifié une fois validée.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="become-producer-form">
            <div className="form-group">
              <label htmlFor="nom_ferme">Nom de la ferme / exploitation *</label>
              <input
                id="nom_ferme"
                type="text"
                value={formData.nom_ferme}
                onChange={(e) => setFormData({ ...formData, nom_ferme: e.target.value })}
                required
                placeholder="Ex: Ferme de la Vallée"
              />
            </div>

            <div className="form-group">
              <label htmlFor="type_production">Type de production *</label>
              <select
                id="type_production"
                value={formData.type_production}
                onChange={(e) => setFormData({ ...formData, type_production: e.target.value })}
                required
              >
                <option value="">Sélectionnez un type</option>
                {TYPES_PRODUCTION.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="adresse">Adresse complète *</label>
              {isGoogleMapsLoaded && window.google && window.google.maps && window.google.maps.places ? (
                <Autocomplete
                  onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                  onPlaceChanged={handlePlaceSelect}
                  options={{ types: ['address'], componentRestrictions: { country: 'fr' } }}
                >
                  <input
                    id="adresse"
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    placeholder="Rechercher une adresse..."
                    required
                  />
                </Autocomplete>
              ) : (
                <input
                  id="adresse"
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Chargement de l'autocomplétion..."
                  disabled
                />
              )}
            </div>

            <div className="form-group">
              <label htmlFor="numero_siret">Numéro SIRET (optionnel mais recommandé)</label>
              <input
                id="numero_siret"
                type="text"
                value={formData.numero_siret}
                onChange={(e) => setFormData({ ...formData, numero_siret: e.target.value })}
                placeholder="Ex: 12345678901234"
              />
              <small>Le numéro SIRET permet une validation automatique de votre demande</small>
            </div>

            <div className="form-group">
              <label htmlFor="justificatif">Justificatif / Informations supplémentaires (optionnel)</label>
              <textarea
                id="justificatif"
                value={formData.justificatif}
                onChange={(e) => setFormData({ ...formData, justificatif: e.target.value })}
                placeholder="Ajoutez des informations qui pourraient aider à valider votre demande..."
                rows="4"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={chargement}>
              {chargement ? 'Envoi en cours...' : 'Envoyer ma demande'}
            </button>
          </form>
        </div>
      </div>
  );
}

export default BecomeProducer;


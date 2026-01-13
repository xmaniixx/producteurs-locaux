// ============================================
// PAGE MODIFIER MON COMPTE PRODUCTEUR
// ============================================
// Permet aux producteurs de modifier leurs informations

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Autocomplete } from '@react-google-maps/api';
import { useGoogleMaps } from '../contexts/GoogleMapsProvider';
import './ProducteurAuth.css';

// Types de producteurs disponibles
const TYPES_PRODUCTEURS = [
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

const JOURS_SEMAINE = [
  { id: 'lundi', label: 'Lundi' },
  { id: 'mardi', label: 'Mardi' },
  { id: 'mercredi', label: 'Mercredi' },
  { id: 'jeudi', label: 'Jeudi' },
  { id: 'vendredi', label: 'Vendredi' },
  { id: 'samedi', label: 'Samedi' },
  { id: 'dimanche', label: 'Dimanche' }
];

function ProducteurModifier() {
  const [producteur, setProducteur] = useState(null);
  const [producteurId, setProducteurId] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    type: '',
    adresse: '',
    ville: '',
    latitude: '',
    longitude: '',
  });
  const [horaires, setHoraires] = useState({
    lundi: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' },
    mardi: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' },
    mercredi: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' },
    jeudi: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' },
    vendredi: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' },
    samedi: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' },
    dimanche: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' }
  });
  const [photos, setPhotos] = useState([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [horairesExpanded, setHorairesExpanded] = useState(true); // État pour l'accordéon des horaires
  const navigate = useNavigate();
  const autocompleteRef = useRef(null);
  const { isLoaded: isGoogleMapsLoaded } = useGoogleMaps();

  // TOUS LES HOOKS DOIVENT ÊTRE DÉCLARÉS ICI, AVANT LES FONCTIONS UTILITAIRES

  // Parser les horaires depuis le format stocké en base
  const parserHoraires = (horairesStr) => {
    const defaultHoraires = {
      lundi: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' },
      mardi: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' },
      mercredi: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' },
      jeudi: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' },
      vendredi: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' },
      samedi: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' },
      dimanche: { ouvert: false, heureOuverture: '09', heureFermeture: '18', minutesOuverture: '00', minutesFermeture: '00' }
    };

    if (!horairesStr) return defaultHoraires;

    try {
      const parsed = JSON.parse(horairesStr);
      // Normaliser les horaires pour chaque jour
      Object.keys(defaultHoraires).forEach(jour => {
        if (parsed[jour] && typeof parsed[jour] === 'object') {
          // Corriger le champ 'ouvert' s'il contient une valeur incorrecte (comme "09")
          let ouvertValue = parsed[jour].ouvert;
          // Si ouvert contient une valeur qui ressemble à une heure, c'est une erreur de données
          if (typeof ouvertValue === 'string' && (ouvertValue.match(/^\d{2}$/) || ouvertValue.match(/^\d{1,2}$/))) {
            console.warn(`⚠️ Correction: ${jour}.ouvert contenait "${ouvertValue}" au lieu d'un booléen`);
            ouvertValue = false; // Réinitialiser à false si c'est une valeur incorrecte
          }
          
          // S'assurer que ouvert est un booléen
          const estOuvert = (
            ouvertValue === true || 
            ouvertValue === 'true' || 
            ouvertValue === 1 || 
            ouvertValue === '1'
          );
          
          parsed[jour] = {
            ...defaultHoraires[jour],
            ...parsed[jour],
            ouvert: estOuvert, // Forcer à être un booléen
            heureOuverture: parsed[jour].heureOuverture || defaultHoraires[jour].heureOuverture,
            heureFermeture: parsed[jour].heureFermeture || defaultHoraires[jour].heureFermeture,
            minutesOuverture: parsed[jour].minutesOuverture || '00',
            minutesFermeture: parsed[jour].minutesFermeture || '00'
          };
        }
      });
      return parsed;
    } catch {
      return defaultHoraires;
    }
  };

  // Formater les horaires pour la base de données
  const formaterHoraires = () => {
    // Normaliser les horaires avant sauvegarde (s'assurer que ouvert est toujours un booléen)
    const horairesNormalises = {};
    Object.keys(horaires).forEach(jour => {
      const h = horaires[jour];
      
      // Détecter et corriger les erreurs où 'ouvert' contient une valeur incorrecte (comme "09")
      let ouvertValue = h.ouvert;
      if (typeof ouvertValue === 'string' && ouvertValue.match(/^\d{1,2}$/)) {
        // Si ouvert contient un nombre (probablement une erreur), réinitialiser
        ouvertValue = false;
      }
      
      // S'assurer que 'ouvert' est toujours un booléen
      const estOuvert = (
        ouvertValue === true || 
        ouvertValue === 'true' || 
        ouvertValue === 1 || 
        ouvertValue === '1'
      );
      
      horairesNormalises[jour] = {
        ouvert: estOuvert, // Toujours un booléen
        heureOuverture: h.heureOuverture || '',
        heureFermeture: h.heureFermeture || '',
        minutesOuverture: h.minutesOuverture || '00',
        minutesFermeture: h.minutesFermeture || '00'
      };
    });
    
    const joursOuverts = Object.keys(horairesNormalises).filter(jour => horairesNormalises[jour].ouvert);
    
    if (joursOuverts.length === 0) {
      return null;
    }

    return JSON.stringify(horairesNormalises);
  };

  // Fonction pour charger les données du producteur
  const chargerDonnees = async () => {
    try {
      // Vérifier la connexion utilisateur
      const responseAuth = await fetchAPI('/api/utilisateur/verifier');
      const dataAuth = await responseAuth.json();

      if (!dataAuth.connected) {
        // Pas connecté → rediriger vers connexion
        navigate('/connexion');
        setChargement(false);
        return;
      }

      // Vérifier le badge producteur
      const responseStatut = await fetchAPI('/api/utilisateur/statut-producteur');
      const dataStatut = await responseStatut.json();

      if (!dataStatut.est_producteur) {
        // Pas producteur → rediriger vers devenir-producteur
        navigate('/devenir-producteur');
        setChargement(false);
        return;
      }

      // Récupérer les données du producteur via l'ID
      const producteurId = dataStatut.producteur_id;
      const response = await fetchAPI(`/api/producteurs/${producteurId}`);

      if (!response.ok) {
        setErreur('Erreur lors du chargement des données');
        setChargement(false);
        return;
      }

      const data = await response.json();
      if (data.error) {
        setErreur(data.error);
        setChargement(false);
        return;
      }

      setProducteur({ id: producteurId, ...data });
      setFormData({
        nom: data.nom || '',
        type: data.type || '',
        adresse: data.adresse || '',
        ville: data.ville || '',
        latitude: data.latitude || '',
        longitude: data.longitude || '',
      });
      setHoraires(parserHoraires(data.horaires));
      setPhotos(data.photos || []);
      
      // Stocker producteurId pour les autres appels API
      setProducteurId(producteurId);
    } catch (error) {
      console.error('Erreur chargement:', error);
      setErreur('Erreur lors du chargement des données');
    } finally {
      setChargement(false);
    }
  };

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      
      if (place) {
        // Extraire l'adresse complète
        const adresseComplete = place.formatted_address || '';
        
        // Extraire la ville
        let ville = '';
        place.address_components?.forEach(component => {
          if (component.types.includes('locality')) {
            ville = component.long_name;
          } else if (component.types.includes('administrative_area_level_2') && !ville) {
            ville = component.long_name;
          }
        });

        // Extraire les coordonnées
        const lat = place.geometry?.location?.lat() || '';
        const lng = place.geometry?.location?.lng() || '';

        setFormData({
          ...formData,
          adresse: adresseComplete,
          ville: ville,
          latitude: lat.toString(),
          longitude: lng.toString()
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    setSauvegarde(true);

    try {
      if (!producteurId) {
        setErreur('ID producteur manquant');
        setSauvegarde(false);
        return;
      }

      const horairesFormates = formaterHoraires();
      
      const response = await put(`/api/producteurs/${producteurId}`, {
        ...formData,
        horaires: horairesFormates
      });

      const data = await response.json();

      if (data.error) {
        setErreur(data.error);
      } else {
        // Afficher le popup de succès
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
        
        // Recharger les données
        await chargerDonnees();
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setErreur('Erreur lors de la sauvegarde');
    } finally {
      setSauvegarde(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!newPhotoUrl.trim()) {
      setErreur('Veuillez entrer une URL de photo');
      return;
    }

    if (photos.length >= 4) {
      setErreur('Maximum 4 photos autorisées');
      return;
    }

    try {
      if (!producteurId) {
        setErreur('ID producteur manquant');
        return;
      }

      const response = await fetch(`/api/producteurs/${producteurId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ url_photo: newPhotoUrl })
      });

      const data = await response.json();

      if (data.error) {
        setErreur(data.error);
      } else {
        setNewPhotoUrl('');
        await chargerDonnees();
      }
    } catch (error) {
      console.error('Erreur ajout photo:', error);
      setErreur('Erreur lors de l\'ajout de la photo');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Supprimer cette photo ?')) return;

    try {
      if (!producteurId) {
        setErreur('ID producteur manquant');
        return;
      }

      const response = await del(`/api/producteurs/${producteurId}/photos/${photoId}`);

      const data = await response.json();

      if (data.error) {
        setErreur(data.error);
      } else {
        await chargerDonnees();
      }
    } catch (error) {
      console.error('Erreur suppression photo:', error);
      setErreur('Erreur lors de la suppression');
    }
  };

  const handleHoraireChange = (jour, field, value) => {
    setHoraires(prev => {
      // Si c'est le champ 'ouvert', traiter comme booléen
      if (field === 'ouvert') {
        return {
          ...prev,
          [jour]: {
            ...prev[jour],
            ouvert: value // value est déjà un booléen depuis e.target.checked
          }
        };
      }
      // Sinon, pour les heures et minutes
      return {
        ...prev,
        [jour]: {
          ...prev[jour],
          [field]: value || (field.includes('minutes') ? '00' : '09')
        }
      };
    });
  };

  // Charger les données au montage du composant
  useEffect(() => {
    chargerDonnees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (chargement) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="chargement">Chargement...</div>
        </div>
      </div>
    );
  }

  const content = (
    <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>✏️ Modifier mon compte</h1>
            <Link to="/producteur/dashboard" className="link-back">
              ← Retour au dashboard
            </Link>
          </div>

          {erreur && (
            <div className="message-erreur">
              {erreur}
            </div>
          )}

          {/* Popup de succès */}
          {showSuccess && (
            <div className="success-popup">
              <div className="success-icon">✅</div>
              <div className="success-text">Informations mises à jour avec succès !</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="nom">Nom de la ferme *</label>
              <input
                id="nom"
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Type de producteur *</label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="">Sélectionnez un type</option>
                {TYPES_PRODUCTEURS.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="adresse">Adresse complète *</label>
              {isGoogleMapsLoaded && typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places ? (
                <Autocomplete
                  onLoad={(autocomplete) => {
                    if (autocomplete) {
                      autocompleteRef.current = autocomplete;
                    }
                  }}
                  onPlaceChanged={handlePlaceSelect}
                  options={{
                    types: ['address'],
                    componentRestrictions: { country: 'fr' }
                  }}
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
                  required
                  disabled
                />
              )}
            </div>

            {/* Section Horaires avec accordéon */}
            <div className="horaires-section">
              <div className="horaires-header" onClick={() => setHorairesExpanded(!horairesExpanded)}>
                <h3>🕐 Horaires d'ouverture</h3>
                <span className="accordion-icon">{horairesExpanded ? '▼' : '▶'}</span>
              </div>
              
              {horairesExpanded && (
                <div className="horaires-list">
                  {JOURS_SEMAINE.map(jour => (
                    <div key={jour.id} className="horaire-item">
                      <label className="horaire-day">
                        <input
                          type="checkbox"
                          checked={horaires[jour.id]?.ouvert || false}
                          onChange={(e) => handleHoraireChange(jour.id, 'ouvert', e.target.checked)}
                        />
                        <span>{jour.label}</span>
                      </label>
                      
                      {horaires[jour.id]?.ouvert && (
                        <div className="horaire-times">
                          {/* Menu déroulant style iPhone pour l'heure d'ouverture */}
                          <select
                            value={horaires[jour.id].heureOuverture || '09'}
                            onChange={(e) => handleHoraireChange(jour.id, 'heureOuverture', e.target.value)}
                            className="horaire-select heure-select"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          <span>h</span>
                          <select
                            value={horaires[jour.id].minutesOuverture || '00'}
                            onChange={(e) => handleHoraireChange(jour.id, 'minutesOuverture', e.target.value)}
                            className="horaire-select minutes-select"
                          >
                            {Array.from({ length: 60 }, (_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          <span> - </span>
                          {/* Menu déroulant style iPhone pour l'heure de fermeture */}
                          <select
                            value={horaires[jour.id].heureFermeture || '18'}
                            onChange={(e) => handleHoraireChange(jour.id, 'heureFermeture', e.target.value)}
                            className="horaire-select heure-select"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          <span>h</span>
                          <select
                            value={horaires[jour.id].minutesFermeture || '00'}
                            onChange={(e) => handleHoraireChange(jour.id, 'minutesFermeture', e.target.value)}
                            className="horaire-select minutes-select"
                          >
                            {Array.from({ length: 60 }, (_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={sauvegarde} className="btn-primary">
              {sauvegarde ? '⏳ Sauvegarde...' : '💾 Enregistrer les modifications'}
            </button>
          </form>

          {/* Section Photos */}
          <div className="photos-section">
            <h2>📷 Photos de la ferme (max 4)</h2>
            
            <div className="photos-grid">
              {photos.map((photo) => (
                <div key={photo.id} className="photo-item-admin">
                  <img src={photo.url_photo} alt={`Photo ${photo.ordre + 1}`} />
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="btn-delete-photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {photos.length < 4 && (
              <div className="add-photo-form">
                <input
                  type="url"
                  placeholder="URL de la photo"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                />
                <button type="button" onClick={handleAddPhoto} className="btn-secondary">
                  + Ajouter une photo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
  );

  // Retourner le contenu directement - Google Maps est chargé via le provider
  return content;
}

export default ProducteurModifier;

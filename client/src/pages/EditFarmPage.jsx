// ============================================
// PAGE MODIFIER MA FERME - Version complète
// ============================================

import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { useGoogleMaps } from '../contexts/GoogleMapsProvider';
import { fetchAPI, put, post } from '../api/api';
import './EditFarmPage.css';

// Icônes SVG simples (remplace lucide-react)
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const TractorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12h18M3 12l3-3m-3 3l3 3M21 12l-3-3m3 3l-3 3M12 3v18"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const EditFarmPage = () => {
  const navigate = useNavigate();
  const { isLoaded: isGoogleMapsLoaded } = useGoogleMaps();
  const autocompleteRef = useRef(null);
  const [producteur, setProducteur] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    adresse: '',
    ville: '',
    latitude: null,
    longitude: null,
    telephone: '',
    email: '',
    type_production: '',
    photos: [],
    horaires: {
      lundi: { ouvert: false, debut: '08:00', fin: '18:00' },
      mardi: { ouvert: false, debut: '08:00', fin: '18:00' },
      mercredi: { ouvert: false, debut: '08:00', fin: '18:00' },
      jeudi: { ouvert: false, debut: '08:00', fin: '18:00' },
      vendredi: { ouvert: false, debut: '08:00', fin: '18:00' },
      samedi: { ouvert: false, debut: '08:00', fin: '18:00' },
      dimanche: { ouvert: false, debut: '08:00', fin: '18:00' }
    }
  });

  const joursOrdreFR = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  const typesProduction = [
    'Maraîchage',
    'Élevage',
    'Arboriculture',
    'Viticulture',
    'Apiculture',
    'Produits laitiers',
    'Céréales',
    'Autre'
  ];

  useEffect(() => {
    console.log('🔄 EditFarmPage mounted');
    fetchProducteurData();
  }, []);

  useEffect(() => {
    console.log('🔄 FormData updated:', {
      photos: formData.photos,
      count: formData.photos?.length || 0
    });
  }, [formData.photos]);

  const fetchProducteurData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('🔑 Token présent ?', !!token);
      console.log('📥 Appel GET /api/producteurs/me');
      
      const response = await fetchAPI('/api/producteurs/me', {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📊 Status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur:', errorData);
        throw new Error(errorData.error || 'Erreur chargement');
      }

      const data = await response.json();
      
      console.log('✅ Données reçues:', data);
      console.log('📸 Photos:', data.photos, 'Type:', typeof data.photos, 'Length:', data.photos?.length);

      // Les photos arrivent déjà parsées du backend
      const photosArray = Array.isArray(data.photos) ? data.photos : [];
      const horairesObj = typeof data.horaires === 'object' && data.horaires !== null ? data.horaires : {
        lundi: { ouvert: false, debut: '08:00', fin: '18:00' },
        mardi: { ouvert: false, debut: '08:00', fin: '18:00' },
        mercredi: { ouvert: false, debut: '08:00', fin: '18:00' },
        jeudi: { ouvert: false, debut: '08:00', fin: '18:00' },
        vendredi: { ouvert: false, debut: '08:00', fin: '18:00' },
        samedi: { ouvert: false, debut: '08:00', fin: '18:00' },
        dimanche: { ouvert: false, debut: '08:00', fin: '18:00' }
      };

      console.log('📊 Photos finales:', photosArray, 'Count:', photosArray.length);

      setFormData({
        nom: data.nom || '',
        description: data.description || '',
        adresse: data.adresse || '',
        ville: data.ville || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        telephone: data.telephone || '',
        email: data.email || '',
        type_production: data.type_production || '',
        photos: photosArray,
        horaires: horairesObj
      });

      setProducteur(data);
      
      // Réinitialiser l'index de la photo si nécessaire
      if (photosArray.length > 0 && currentPhotoIndex >= photosArray.length) {
        setCurrentPhotoIndex(0);
      } else if (photosArray.length === 0) {
        setCurrentPhotoIndex(0);
      }
    } catch (error) {
      setError('Impossible de charger vos informations');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleHoraireToggle = (jour) => {
    setFormData(prev => ({
      ...prev,
      horaires: {
        ...prev.horaires,
        [jour]: { ...prev.horaires[jour], ouvert: !prev.horaires[jour].ouvert }
      }
    }));
  };

  const handleHoraireChange = (jour, type, value) => {
    setFormData(prev => ({
      ...prev,
      horaires: {
        ...prev.horaires,
        [jour]: { ...prev.horaires[jour], [type]: value }
      }
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadingPhoto) return; // Empêcher upload double
    
    if (formData.photos && formData.photos.length >= 4) {
      alert('Maximum 4 photos');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo trop volumineuse (max 5 MB)');
      e.target.value = '';
      return;
    }

    setUploadingPhoto(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('photo', file);

      const token = localStorage.getItem('token');
      
      const response = await fetchAPI('/api/producteurs/upload-photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });

      if (!response.ok) throw new Error('Erreur upload');

      const data = await response.json();

      // Ajouter au state
      const newPhotos = [...(formData.photos || []), data.url];
      setFormData(prev => ({
        ...prev,
        photos: newPhotos
      }));

      // Sauvegarder automatiquement
      await savePhotos(newPhotos);

      e.target.value = '';

    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'upload');
      e.target.value = '';
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Fonction pour sauvegarder les photos automatiquement
  const savePhotos = async (photos) => {
    try {
      const token = localStorage.getItem('token');
      
      await fetchAPI('/api/producteurs/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nom: formData.nom,
          description: formData.description,
          adresse: formData.adresse,
          telephone: formData.telephone,
          email: formData.email,
          type_production: formData.type_production,
          ville: formData.ville,
          latitude: formData.latitude,
          longitude: formData.longitude,
          photos: JSON.stringify(photos),
          horaires: JSON.stringify(formData.horaires)
        })
      });
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === formData.photos.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === 0 ? formData.photos.length - 1 : prev - 1
    );
  };

  const handleRemovePhoto = (indexToRemove) => {
    console.log('🗑️ Suppression photo index:', indexToRemove);
    
    setFormData(prev => {
      const newPhotos = prev.photos.filter((_, i) => i !== indexToRemove);
      console.log('📊 Photos restantes:', newPhotos);
      return {
        ...prev,
        photos: newPhotos
      };
    });

    // Ajuster l'index si nécessaire
    if (currentPhotoIndex >= formData.photos.length - 1) {
      setCurrentPhotoIndex(Math.max(0, formData.photos.length - 2));
    }
  };

  // Fonction Annuler
  const handleCancel = () => {
    // Recharger la page pour annuler toutes les modifications
    window.location.reload();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('💾 Enregistrement...');
    console.log('📊 FormData actuel:', formData);
    console.log('📸 Photos à sauvegarder:', formData.photos);
    console.log('📸 Nombre de photos:', formData.photos?.length || 0);

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      // Préparer les données à envoyer
      const dataToSend = {
        nom: formData.nom,
        description: formData.description,
        adresse: formData.adresse,
        telephone: formData.telephone,
        email: formData.email,
        type_production: formData.type_production,
        ville: formData.ville || formData.adresse.split(',').pop()?.trim() || '',
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        // IMPORTANT : Envoyer TOUTES les photos en JSON
        photos: JSON.stringify(formData.photos || []),
        horaires: JSON.stringify(formData.horaires || {})
      };

      console.log('📤 Données envoyées au serveur:', dataToSend);
      console.log('📸 Photos (string):', dataToSend.photos);

      const response = await fetch('/api/producteurs/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      console.log('📊 Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      const data = await response.json();
      console.log('✅ Sauvegarde réussie:', data);
      console.log('📸 Photos sauvegardées:', data.photos);

      setSuccessMessage('✅ Modifications enregistrées avec succès !');
      
      // Recharger les données pour vérifier
      await fetchProducteurData();
      
      setTimeout(() => {
        navigate('/producteur/dashboard');
      }, 2000);

    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      setError(error.message);
      alert('❌ Erreur lors de la sauvegarde : ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-farm-page">
      {/* Header */}
      <div className="edit-farm-header">
        <div className="edit-farm-header-content">
          <button
            onClick={() => navigate('/producteur/dashboard')}
            className="edit-farm-back-button"
          >
            <ArrowLeftIcon />
            <span>Retour au dashboard</span>
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="edit-farm-content animate-fade-in">
        {/* Messages */}
        {successMessage && (
          <div className="edit-farm-message edit-farm-message-success">
            <div className="edit-farm-message-icon">
              <span>✓</span>
            </div>
            <p>{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="edit-farm-message edit-farm-message-error">
            <XIcon />
            <div className="edit-farm-message-content">
              <p className="edit-farm-message-title">Erreur</p>
              <p className="edit-farm-message-text">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="edit-farm-message-close">
              <XIcon />
            </button>
          </div>
        )}

        {/* Header page */}
        <div className="edit-farm-page-header">
          <div className="edit-farm-page-header-icon">
            <TractorIcon />
          </div>
          <div>
            <h1 className="edit-farm-page-title">Modifier ma ferme</h1>
            <p className="edit-farm-page-subtitle">Mettez à jour les informations de votre exploitation</p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="edit-farm-form">
          {/* Infos générales */}
          <div className="edit-farm-section">
            <h2 className="edit-farm-section-title">
              <MapPinIcon />
              Informations générales
            </h2>
            
            <div className="edit-farm-fields">
              <div className="edit-farm-field">
                <label className="edit-farm-label">
                  Nom de la ferme *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => handleInputChange('nom', e.target.value)}
                  className="edit-farm-input"
                  placeholder="Ex: Ferme des Vallées"
                  required
                />
              </div>

              <div className="edit-farm-field">
                <label className="edit-farm-label">
                  Type de production *
                </label>
                <select
                  value={formData.type_production}
                  onChange={(e) => handleInputChange('type_production', e.target.value)}
                  className="edit-farm-input"
                  required
                >
                  <option value="">Sélectionnez un type</option>
                  {typesProduction.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="edit-farm-field">
                <label className="edit-farm-label">
                  Description
                </label>
                <textarea
                  rows="4"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="edit-farm-textarea"
                  placeholder="Décrivez votre exploitation..."
                />
              </div>

              <div className="edit-farm-field">
                <label className="edit-farm-label">
                  Adresse complète *
                </label>
                {isGoogleMapsLoaded && typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places ? (
                  <Autocomplete
                    onLoad={(autocomplete) => {
                      if (autocomplete) {
                        autocompleteRef.current = autocomplete;
                      }
                    }}
                    onPlaceChanged={() => {
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
                          const lat = place.geometry?.location?.lat() || null;
                          const lng = place.geometry?.location?.lng() || null;

                          setFormData(prev => ({
                            ...prev,
                            adresse: adresseComplete,
                            ville: ville || prev.ville,
                            latitude: lat ? lat.toString() : prev.latitude,
                            longitude: lng ? lng.toString() : prev.longitude
                          }));
                        }
                      }
                    }}
                    options={{
                      types: ['address'],
                      componentRestrictions: { country: 'fr' }
                    }}
                  >
                    <input
                      type="text"
                      value={formData.adresse}
                      onChange={(e) => handleInputChange('adresse', e.target.value)}
                      className="edit-farm-input"
                      placeholder="Rechercher une adresse..."
                      required
                    />
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => handleInputChange('adresse', e.target.value)}
                    className="edit-farm-input"
                    placeholder="Chargement de l'autocomplétion..."
                    required
                    disabled
                  />
                )}
                <p className="edit-farm-hint">
                  Cette adresse sera utilisée pour vous localiser sur la carte
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="edit-farm-section">
            <h2 className="edit-farm-section-title">
              <PhoneIcon />
              Contact
            </h2>
            
            <div className="edit-farm-grid">
              <div className="edit-farm-field">
                <label className="edit-farm-label">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9\s\-\+\(\)]*"
                  value={formData.telephone}
                  onChange={(e) => handleInputChange('telephone', e.target.value)}
                  className="edit-farm-input"
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>

              <div className="edit-farm-field">
                <label className="edit-farm-label">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="edit-farm-input"
                  placeholder="contact@ferme.fr"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section Photos */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: '8px' 
            }}>
              Photos de la ferme
            </label>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280', 
              marginBottom: '16px' 
            }}>
              Ajoutez jusqu'à 4 photos ({formData.photos?.length || 0}/4)
            </p>

            {formData.photos && formData.photos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Photo principale - HAUTEUR FIXE 300px, LARGEUR max-w-2xl */}
                <div style={{ 
                  position: 'relative', 
                  width: '100%', 
                  maxWidth: '672px', 
                  height: '300px' 
                }}>
                  <div style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    backgroundColor: '#f3f4f6',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} className="group">
                    <img
                      src={formData.photos[currentPhotoIndex] || formData.photos[0]}
                      alt="Photo"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />

                    {/* Overlay */}
                    <div 
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0)'}
                    />
                    
                    {/* Bouton supprimer - TOUJOURS VISIBLE */}
                    <button
                      type="button"
                      onClick={() => {
                        const idx = currentPhotoIndex || 0;
                        const newPhotos = formData.photos.filter((_, i) => i !== idx);
                        setFormData(prev => ({ ...prev, photos: newPhotos }));
                        if (idx > 0) setCurrentPhotoIndex(idx - 1);
                      }}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(4px)',
                        color: '#dc2626',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#fee2e2';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      <XIcon />
                    </button>

                    {/* Navigation */}
                    {formData.photos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const total = formData.photos.length;
                            setCurrentPhotoIndex((currentPhotoIndex - 1 + total) % total);
                          }}
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(4px)',
                            borderRadius: '50%',
                            padding: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.opacity = '1';
                            e.target.style.backgroundColor = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.opacity = '0';
                          }}
                        >
                          <ChevronLeftIcon />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPhotoIndex((currentPhotoIndex + 1) % formData.photos.length);
                          }}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(4px)',
                            borderRadius: '50%',
                            padding: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.opacity = '1';
                            e.target.style.backgroundColor = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.opacity = '0';
                          }}
                        >
                          <ChevronRightIcon />
                        </button>

                        {/* Indicateurs */}
                        <div style={{
                          position: 'absolute',
                          bottom: '16px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: '6px'
                        }}>
                          {formData.photos.map((_, i) => (
                            <div
                              key={i}
                              style={{
                                height: '6px',
                                borderRadius: '9999px',
                                transition: 'all 0.2s',
                                backgroundColor: i === currentPhotoIndex ? 'white' : 'rgba(255, 255, 255, 0.6)',
                                width: i === currentPhotoIndex ? '24px' : '6px'
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Miniatures */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '8px',
                  maxWidth: '672px'
                }}>
                  {formData.photos.map((photo, i) => (
                    <div
                      key={`photo-${i}-${photo}`}
                      style={{
                        position: 'relative',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: i === currentPhotoIndex ? '2px solid #10b981' : '2px solid transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setCurrentPhotoIndex(i)}
                        style={{
                          width: '100%',
                          height: '100%',
                          padding: 0,
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          opacity: i === currentPhotoIndex ? 1 : 0.7,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (i !== currentPhotoIndex) e.target.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          if (i !== currentPhotoIndex) e.target.style.opacity = '0.7';
                        }}
                      >
                        <img 
                          src={photo} 
                          alt={`Mini ${i + 1}`} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      </button>
                      {/* Croix pour supprimer sur chaque miniature */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newPhotos = formData.photos.filter((_, idx) => idx !== i);
                          setFormData(prev => ({ ...prev, photos: newPhotos }));
                          if (i === currentPhotoIndex && currentPhotoIndex > 0) {
                            setCurrentPhotoIndex(currentPhotoIndex - 1);
                          } else if (i === currentPhotoIndex && currentPhotoIndex === 0 && newPhotos.length > 0) {
                            setCurrentPhotoIndex(0);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(220, 38, 38, 0.9)',
                          color: 'white',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          zIndex: 10,
                          padding: 0
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#dc2626';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.9)';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Bouton ajouter */}
                  {formData.photos.length < 4 && (
                    <label style={{
                      height: '80px',
                      borderRadius: '8px',
                      border: '2px dashed #d1d5db',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#10b981';
                      e.target.style.backgroundColor = '#d1fae5';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = 'transparent';
                    }}
                    >
                      {uploadingPhoto ? (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>...</div>
                      ) : (
                        <UploadIcon />
                      )}
                      <input 
                        type="file" 
                        style={{ display: 'none' }}
                        accept="image/*" 
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </label>
                  )}
                </div>
              </div>
            ) : (
              /* Pas de photos */
              <label style={{ 
                display: 'block', 
                width: '100%', 
                maxWidth: '672px', 
                borderRadius: '12px', 
                border: '2px dashed #d1d5db', 
                cursor: 'pointer', 
                backgroundColor: '#f9fafb',
                transition: 'all 0.2s',
                height: '300px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.borderColor = '#10b981';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f9fafb';
                e.target.style.borderColor = '#d1d5db';
              }}
              >
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '32px' 
                }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    backgroundColor: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    transition: 'background-color 0.2s'
                  }}>
                    <ImageIcon />
                  </div>
                  <p style={{ 
                    fontSize: '16px', 
                    fontWeight: '500', 
                    color: '#374151', 
                    marginBottom: '4px',
                    margin: 0
                  }}>
                    Ajoutez vos photos
                  </p>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#6b7280',
                    margin: 0
                  }}>
                    JPG ou PNG • Max 5 MB
                  </p>
                </div>
                <input 
                  type="file" 
                  style={{ display: 'none' }}
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
              </label>
            )}
          </div>

          {/* Horaires */}
          <div className="edit-farm-section">
            <h2 className="edit-farm-section-title">
              <ClockIcon />
              Horaires d'ouverture
            </h2>

            <div className="edit-farm-horaires">
              {joursOrdreFR.map(jour => (
                <div key={jour} className="edit-farm-horaire-item">
                  <label className="edit-farm-horaire-label">
                    <input
                      type="checkbox"
                      checked={formData.horaires[jour].ouvert}
                      onChange={() => handleHoraireToggle(jour)}
                      className="edit-farm-checkbox"
                    />
                    <span className="edit-farm-horaire-jour">{jour}</span>
                  </label>

                  {formData.horaires[jour].ouvert && (
                    <div className="edit-farm-horaire-times">
                      <input
                        type="time"
                        inputMode="numeric"
                        value={formData.horaires[jour].debut}
                        onChange={(e) => handleHoraireChange(jour, 'debut', e.target.value)}
                        className="edit-farm-time-input"
                      />
                      <span className="edit-farm-horaire-separator">à</span>
                      <input
                        type="time"
                        inputMode="numeric"
                        value={formData.horaires[jour].fin}
                        onChange={(e) => handleHoraireChange(jour, 'fin', e.target.value)}
                        className="edit-farm-time-input"
                      />
                    </div>
                  )}

                  {!formData.horaires[jour].ouvert && (
                    <span className="edit-farm-horaire-closed">Fermé</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Boutons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '16px', 
            paddingTop: '24px', 
            borderTop: '1px solid #e5e7eb',
            marginTop: '32px'
          }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '12px 24px',
                color: '#374151',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            >
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: isLoading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isLoading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.target.style.backgroundColor = '#059669';
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.target.style.backgroundColor = '#10b981';
              }}
            >
              {isLoading ? (
                <>
                  <div className="edit-farm-spinner-small"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  Enregistrer les modifications
                  <ArrowLeftIcon />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFarmPage;

// ============================================
// COMPOSANT FICHE PRODUCTEUR
// ============================================
// Affiche les informations d'un producteur en bas de l'écran
// avec photo, informations et bouton "Y aller"

import React, { useMemo, useState, useEffect } from 'react';
import './ProducteurCard.css';

function ProducteurCard({ producteur, villeRecherchee, onFermer }) {
  const [estFavori, setEstFavori] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [showHorairesModal, setShowHorairesModal] = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);

  // Vérifier si le producteur est dans les favoris
  useEffect(() => {
    verifierFavori();
  }, [producteur.id]);

  // Réinitialiser l'index de photo quand le producteur change
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [producteur.id]);

  // Réinitialiser showAllHours quand le producteur change
  useEffect(() => {
    setShowAllHours(false);
  }, [producteur.id]);

  // Suivre la largeur de la fenêtre pour l'adaptation responsive
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const verifierFavori = async () => {
    try {
      const response = await fetchAPI(`/api/utilisateur/favoris/${producteur.id}`);
      if (response.ok) {
        const data = await response.json();
        setEstFavori(data.estFavori || false);
      }
    } catch (error) {
      console.error('Erreur vérification favori:', error);
    }
  };

  // Ajouter/retirer des favoris
  const toggleFavori = async () => {
    try {
      if (estFavori) {
        // Retirer des favoris
        const response = await del(`/api/utilisateur/favoris/${producteur.id}`);
        if (response.ok) {
          setEstFavori(false);
        }
      } else {
        // Ajouter aux favoris
        const response = await post('/api/utilisateur/favoris', {
          producteur_id: producteur.id
        });
        if (response.ok) {
          setEstFavori(true);
        }
      }
    } catch (error) {
      console.error('Erreur toggle favori:', error);
    }
  };
  // Fonction pour ouvrir Google Maps avec l'itinéraire
  const ouvrirGoogleMaps = async () => {
    try {
      // Enregistrer le clic sur "Y aller" si c'est un producteur enregistré
      const producteurIdStr = String(producteur.id);
      if (!producteurIdStr.startsWith('place_')) {
        await fetchAPI(`/api/stats/clic-y-aller/${producteur.id}`, {
          method: 'POST'
        });
      }

      // Construire l'URL Google Maps avec l'itinéraire
      const url = `https://www.google.com/maps/dir/?api=1&destination=${producteur.latitude},${producteur.longitude}`;
      
      // Ouvrir dans un nouvel onglet
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erreur ouverture Google Maps:', error);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${producteur.latitude},${producteur.longitude}`;
      window.open(url, '_blank');
    }
  };

  // Formater la distance
  const formaterDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  // Parser les horaires avec useMemo
  const horairesAffiches = useMemo(() => {
    // Vérifier si les horaires existent
    if (!producteur.horaires || producteur.horaires === 'null' || producteur.horaires === null || producteur.horaires === '') {
      return [];
    }

    try {
      // Parser les horaires
      let horairesParsed;
      if (typeof producteur.horaires === 'string') {
        try {
          horairesParsed = JSON.parse(producteur.horaires);
        } catch (parseError) {
          horairesParsed = producteur.horaires;
        }
      } else {
        horairesParsed = producteur.horaires;
      }
      
      // Vérifier si c'est un objet avec des jours
      if (typeof horairesParsed === 'object' && horairesParsed !== null && !Array.isArray(horairesParsed)) {
        const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        const labels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        const result = [];
        
        for (let idx = 0; idx < jours.length; idx++) {
          const jour = jours[idx];
          const h = horairesParsed[jour];
          
          if (!h || typeof h !== 'object') {
            continue;
          }
          
          let ouvertValue = h.ouvert;
          if (typeof ouvertValue === 'string' && ouvertValue.match(/^\d{1,2}$/)) {
            ouvertValue = false;
          }
          
          const estOuvert = (
            ouvertValue === true || 
            ouvertValue === 'true' || 
            String(ouvertValue) === 'true' ||
            ouvertValue === 1 || 
            ouvertValue === '1' ||
            String(ouvertValue) === '1'
          );
          
          if (!estOuvert) {
            continue;
          }
          
          const heureOuvStr = String(h.heureOuverture || h.debut || '').trim();
          const heureFermStr = String(h.heureFermeture || h.fin || '').trim();
          
          if (!heureOuvStr || heureOuvStr === '' || !heureFermStr || heureFermStr === '') {
            continue;
          }
          
          const minutesOuv = (h.minutesOuverture && h.minutesOuverture !== '00' && h.minutesOuverture !== '' && h.minutesOuverture !== 0 && h.minutesOuverture !== '0') 
            ? String(h.minutesOuverture).padStart(2, '0')
            : null;
          const minutesFerm = (h.minutesFermeture && h.minutesFermeture !== '00' && h.minutesFermeture !== '' && h.minutesFermeture !== 0 && h.minutesFermeture !== '0') 
            ? String(h.minutesFermeture).padStart(2, '0')
            : null;
          
          const heureOuv = minutesOuv 
            ? `${heureOuvStr}h${minutesOuv}` 
            : `${heureOuvStr}h`;
          const heureFerm = minutesFerm 
            ? `${heureFermStr}h${minutesFerm}` 
            : `${heureFermStr}h`;
          
          result.push({
            jour: labels[idx],
            heures: `${heureOuv} - ${heureFerm}`,
            ordre: idx
          });
        }
        
        return result;
      }
    } catch (e) {
      console.error('Erreur parsing horaires:', e);
    }
    
    return [];
  }, [producteur.horaires]);

  // Obtenir l'emoji selon le type pour l'image placeholder
  const getEmojiType = (type) => {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('laitier') || typeLower.includes('lait')) return '🐄';
    if (typeLower.includes('maraîcher') || typeLower.includes('légume')) return '🥕';
    if (typeLower.includes('éleveur') || typeLower.includes('viande')) return '🐷';
    if (typeLower.includes('verger') || typeLower.includes('fruit')) return '🍎';
    if (typeLower.includes('apiculteur') || typeLower.includes('miel')) return '🐝';
    if (typeLower.includes('vin') || typeLower.includes('vignoble')) return '🍇';
    if (typeLower.includes('céréale') || typeLower.includes('blé')) return '🌾';
    return '🌾';
  };

  return (
    <div className="producteur-card-bottom">
      {/* Bouton fermer */}
      <button className="btn-fermer-card" onClick={onFermer}>
        ×
      </button>

      {/* Photos de la ferme - Style Airbnb */}
      <div style={{ 
        width: '100%', 
        marginBottom: '24px',
        padding: '0 16px',
        marginTop: '16px'
      }}>
        {(() => {
          // Parser les photos si nécessaire
          let photosArray = [];
          if (producteur.photos) {
            if (typeof producteur.photos === 'string') {
              try {
                photosArray = JSON.parse(producteur.photos);
              } catch (e) {
                photosArray = [];
              }
            } else if (Array.isArray(producteur.photos)) {
              photosArray = producteur.photos;
            }
          }

          // Extraire les URLs des photos
          const photoUrls = photosArray.map(p => {
            if (typeof p === 'string') {
              return p;
            } else if (p && p.url_photo) {
              return p.url_photo;
            } else {
              return p;
            }
          }).filter(Boolean);

          if (photoUrls.length > 0) {
            // Style Airbnb - Photo avec slider (hauteur réduite pour permettre le scroll)
            const photoHeight = windowWidth <= 768 ? '200px' : windowWidth <= 1024 ? '220px' : '250px';
            return (
              <div style={{ 
                width: '100%', 
                height: photoHeight, 
                borderRadius: '12px', 
                overflow: 'hidden', 
                marginBottom: '0',
                backgroundColor: '#f3f4f6',
                position: 'relative',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}>
                <img 
                  src={photoUrls[currentPhotoIndex] || photoUrls[0]} 
                  alt={`${producteur.nom} - Photo ${currentPhotoIndex + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                />
                {/* Placeholder si erreur */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '64px',
                  backgroundColor: '#f3f4f6'
                }}>
                  📷
                </div>

                {/* Navigation slider - seulement si plusieurs photos */}
                {photoUrls.length > 1 && (
                  <>
                    {/* Flèche gauche */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex((prev) => (prev - 1 + photoUrls.length) % photoUrls.length);
                      }}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        transition: 'all 0.2s',
                        zIndex: 10,
                        padding: 0,
                        margin: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'block', margin: '0 auto', padding: 0 }}>
                        <polyline points="15 18 9 12 15 6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {/* Flèche droite */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex((prev) => (prev + 1) % photoUrls.length);
                      }}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        transition: 'all 0.2s',
                        zIndex: 10,
                        padding: 0,
                        margin: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'block', margin: '0 auto', padding: 0 }}>
                        <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {/* Indicateurs de position */}
                    <div style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '8px',
                      zIndex: 10
                    }}>
                      {photoUrls.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPhotoIndex(index);
                          }}
                          style={{
                            width: index === currentPhotoIndex ? '24px' : '8px',
                            height: '8px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: index === currentPhotoIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            padding: 0
                          }}
                          onMouseEnter={(e) => {
                            if (index !== currentPhotoIndex) {
                              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (index !== currentPhotoIndex) {
                              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                            }
                          }}
                        />
                      ))}
                    </div>

                    {/* Compteur de photos */}
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      zIndex: 10
                    }}>
                      {currentPhotoIndex + 1} / {photoUrls.length}
                    </div>
                  </>
                )}
              </div>
            );
          } else {
            const photoHeight = windowWidth <= 480 ? '180px' : windowWidth <= 768 ? '200px' : windowWidth <= 1024 ? '220px' : '250px';
            return (
              <div style={{ 
                width: '100%', 
                height: photoHeight, 
                borderRadius: '12px', 
                overflow: 'hidden', 
                marginBottom: '0',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '64px'
              }}>
                📷
              </div>
            );
          }
        })()}
      </div>

      {/* Contenu */}
      <div className="producteur-content">
        <div className="producteur-header" style={{ padding: '0 8px 8px 8px' }}>
          {/* En-tête */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: '1.2' }}>
              {producteur.nom || 'Producteur'}
            </h3>
            {producteur.type_production && (
              <span style={{
                background: '#10b981',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                marginLeft: '8px'
              }}>
                {producteur.type_production}
              </span>
            )}
            <button
              className={`btn-favori ${estFavori ? 'active' : ''}`}
              onClick={toggleFavori}
              aria-label={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              style={{ marginLeft: '8px' }}
            >
              {estFavori ? '❤️' : '🤍'}
            </button>
          </div>


          {/* Description */}
          {producteur.description && (
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 16px' }}>
              {producteur.description}
            </p>
          )}

          {/* Séparateur */}
          <div style={{ height: '1px', background: '#e2e8f0', margin: '16px 0' }}></div>

          {/* Infos contact */}
          <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
            {producteur.adresse && (
              <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                <span style={{ fontSize: '16px', lineHeight: '1.4' }}>📍</span>
                <span style={{ fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>
                  {producteur.adresse}
                </span>
              </div>
            )}

            {producteur.telephone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📞</span>
                <a href={`tel:${producteur.telephone}`} style={{
                  fontSize: '14px',
                  color: '#10b981',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}>
                  {producteur.telephone}
                </a>
              </div>
            )}

            {producteur.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>✉️</span>
                <a href={`mailto:${producteur.email}`} style={{
                  fontSize: '14px',
                  color: '#10b981',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}>
                  {producteur.email}
                </a>
              </div>
            )}
          </div>
          
          {/* Affichage des horaires */}
          {horairesAffiches.length > 0 && (
            <div style={{ background: 'var(--vert-tres-clair)', padding: '12px', borderRadius: '10px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--texte-fonce)', margin: 0 }}>
                  🕐 Horaires
                </p>
                {horairesAffiches.length > 3 && (
                  <button
                    onClick={() => setShowAllHours(!showAllHours)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      margin: 0,
                      fontSize: '12px',
                      color: 'var(--vert-principal)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--vert-tres-clair)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'none';
                    }}
                  >
                    {showAllHours ? 'Voir moins ↑' : 'Voir tout →'}
                  </button>
                )}
              </div>
              {(showAllHours ? horairesAffiches : horairesAffiches.slice(0, 3)).map((horaire, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500', color: 'var(--texte-fonce)' }}>{horaire.jour}</span>
                  <span style={{ color: 'var(--texte-gris)' }}>{horaire.heures}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton itinéraire style Dolores Park */}
        <button
          onClick={ouvrirGoogleMaps}
          style={{
            width: '100%',
            background: 'var(--vert-principal)',
            color: 'var(--blanc)',
            border: 'none',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: '700',
            marginTop: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'var(--vert-fonce)'}
          onMouseLeave={(e) => e.target.style.background = 'var(--vert-principal)'}
        >
          <span style={{ fontSize: '18px' }}>🧭</span>
          Itinéraire
        </button>
      </div>

      {/* Modal des horaires */}
      {showHorairesModal && (() => {
        // Parser les horaires pour la modal
        let horairesModal = [];
        try {
          let horairesParsed;
          if (typeof producteur.horaires === 'string') {
            horairesParsed = JSON.parse(producteur.horaires);
          } else {
            horairesParsed = producteur.horaires;
          }
          
          if (horairesParsed && typeof horairesParsed === 'object') {
            const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
            const labels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
            
            jours.forEach((jour, idx) => {
              const h = horairesParsed[jour];
              if (h && typeof h === 'object') {
                const estOuvert = h.ouvert === true || h.ouvert === 'true' || h.ouvert === 1 || String(h.ouvert) === 'true' || String(h.ouvert) === '1';
                if (estOuvert) {
                  const debut = h.debut || h.heureOuverture || '';
                  const fin = h.fin || h.heureFermeture || '';
                  if (debut && fin) {
                    horairesModal.push({
                      jour: labels[idx],
                      heures: `${debut} - ${fin}`
                    });
                  }
                } else {
                  horairesModal.push({
                    jour: labels[idx],
                    heures: 'Fermé'
                  });
                }
              }
            });
          }
        } catch (e) {
          console.error('Erreur parsing horaires pour modal:', e);
        }

        return (
          <div className="modal-overlay" onClick={() => setShowHorairesModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">🕐 Horaires d'ouverture</h2>
                <button className="modal-close" onClick={() => setShowHorairesModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                {horairesModal.length > 0 ? (
                  <div className="horaires-list-modal">
                    {horairesModal.map((horaire, index) => (
                      <div key={index} className="horaire-item-modal">
                        <span className="horaire-jour-modal">{horaire.jour}</span>
                        <span className={`horaire-heures-modal ${horaire.heures === 'Fermé' ? 'ferme' : ''}`}>
                          {horaire.heures}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--texte-gris)', textAlign: 'center', padding: 'var(--espacement-lg)' }}>
                    Aucun horaire renseigné
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default ProducteurCard;

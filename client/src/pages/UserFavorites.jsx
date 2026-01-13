// ============================================
// PAGE MES FAVORIS
// ============================================
// Affiche la liste des producteurs favoris de l'utilisateur

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './UserFavorites.css';

function UserFavorites() {
  const [favoris, setFavoris] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const navigate = useNavigate();

  // Charger les favoris
  useEffect(() => {
    chargerFavoris();
  }, []);

  const chargerFavoris = async () => {
    try {
      setChargement(true);
      const response = await fetchAPI('/api/utilisateur/favoris');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des favoris');
      }

      const data = await response.json();

      if (data.error) {
        setErreur(data.error);
      } else {
        setFavoris(data.favoris || []);
      }
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
      setErreur('Erreur lors du chargement des favoris');
    } finally {
      setChargement(false);
    }
  };

  // Retirer des favoris
  const handleRetirerFavori = async (producteurId) => {
    try {
      const response = await del(`/api/utilisateur/favoris/${producteurId}`);

      if (response.ok) {
        setFavoris(prev => prev.filter(f => f.producteur_id !== producteurId));
      } else {
        setErreur('Erreur lors de la suppression du favori');
      }
    } catch (error) {
      console.error('Erreur retrait favori:', error);
      setErreur('Erreur lors de la suppression du favori');
    }
  };

  // Ouvrir Google Maps avec itinéraire
  const ouvrirGoogleMaps = (producteur) => {
    if (producteur.latitude && producteur.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${producteur.latitude},${producteur.longitude}`;
      window.open(url, '_blank');
    } else {
      // Fallback sur l'adresse si pas de coordonnées
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(producteur.adresse + ', ' + producteur.ville)}`;
      window.open(url, '_blank');
    }
  };

  // Obtenir l'emoji selon le type
  const getEmojiType = (type) => {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('laitier') || typeLower.includes('lait')) return '🐄';
    if (typeLower.includes('maraîcher') || typeLower.includes('légume')) return '🥕';
    if (typeLower.includes('éleveur') || typeLower.includes('viande')) return '🐷';
    if (typeLower.includes('verger') || typeLower.includes('fruit')) return '🍎';
    if (typeLower.includes('apiculteur') || typeLower.includes('miel')) return '🐝';
    if (typeLower.includes('vin') || typeLower.includes('vignoble')) return '🍇';
    return '🌾';
  };

  // Formater la distance
  const formaterDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  if (chargement) {
    return (
      <div className="user-favorites-page">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement de vos favoris...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-favorites-page">
      <Header />
      
      <div className="favorites-container">
        <div className="favorites-header">
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Retour
          </button>
          <h1>Mes favoris ⭐</h1>
        </div>

        {erreur && (
          <div className="message-erreur">
            {erreur}
          </div>
        )}

        {favoris.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⭐</div>
            <h2>Aucun favori pour le moment</h2>
            <p>Ajoutez des producteurs à vos favoris en cliquant sur ❤️ sur leur fiche</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Découvrir les producteurs
            </button>
          </div>
        ) : (
          <div className="favorites-list">
            {favoris.map((favori) => (
              <div key={favori.id} className="favorite-card">
                <div className="favorite-card-header">
                  <div className="favorite-emoji">{getEmojiType(favori.type)}</div>
                  <div className="favorite-info">
                    <h3>{favori.nom}</h3>
                    <p className="favorite-type">{favori.type}</p>
                  </div>
                  <button
                    className="btn-remove-favorite"
                    onClick={() => handleRetirerFavori(favori.producteur_id)}
                    aria-label="Retirer des favoris"
                  >
                    ❤️
                  </button>
                </div>

                <div className="favorite-card-body">
                  <div className="favorite-address">
                    <span>📍</span>
                    <span>{favori.adresse}, {favori.ville}</span>
                  </div>
                </div>

                <div className="favorite-card-actions">
                  <button
                    className="btn-y-aller"
                    onClick={() => ouvrirGoogleMaps(favori)}
                  >
                    Y aller
                  </button>
                  <button
                    className="btn-retirer"
                    onClick={() => handleRetirerFavori(favori.producteur_id)}
                  >
                    Retirer des favoris
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserFavorites;


// ============================================
// PAGE MON COMPTE UTILISATEUR
// ============================================
// Permet à l'utilisateur de voir et modifier ses informations

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI, put, del } from '../api/api';
import Header from '../components/Header';
import './UserAccount.css';

function UserAccount() {
  const [utilisateur, setUtilisateur] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    telephone: '',
    date_naissance: '',
    jour_naissance: '',
    mois_naissance: '',
    annee_naissance: '',
    mot_de_passe: '',
    nouveau_mot_de_passe: '',
    confirmer_mot_de_passe: ''
  });
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const navigate = useNavigate();

  // Vérifier si c'est la première visite de la session
  useEffect(() => {
    const hasAnimated = sessionStorage.getItem('accountPageAnimated');
    if (!hasAnimated) {
      setShowAnimation(true);
      sessionStorage.setItem('accountPageAnimated', 'true');
    }
  }, []);

  // Charger les données de l'utilisateur
  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      setChargement(true);
      const response = await fetchAPI('/api/utilisateur/moi');
      
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/connexion');
          return;
        }
        throw new Error('Erreur lors du chargement');
      }
      
      const data = await response.json();

      if (data.error) {
        setErreur(data.error);
        if (data.error.includes('non connecté')) {
          navigate('/connexion');
        }
      } else {
        setUtilisateur(data);
        // Parser la date de naissance pour extraire jour, mois, année
        let jour = '', mois = '', annee = '';
        if (data.date_naissance) {
          const dateParts = data.date_naissance.split('-');
          if (dateParts.length === 3) {
            annee = dateParts[0];
            mois = dateParts[1];
            jour = dateParts[2];
          }
        }
        setFormData({
          email: data.email || '',
          telephone: data.telephone || '',
          date_naissance: data.date_naissance || '',
          jour_naissance: jour,
          mois_naissance: mois,
          annee_naissance: annee,
          mot_de_passe: '',
          nouveau_mot_de_passe: '',
          confirmer_mot_de_passe: ''
        });
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setErreur('Erreur lors du chargement des données');
    } finally {
      setChargement(false);
    }
  };

  // Sauvegarder les modifications
  const handleSauvegarder = async (e) => {
    e.preventDefault();
    setErreur('');
    setSuccess(false);

    // Validation de la date de naissance
    if (!formData.jour_naissance || !formData.mois_naissance || !formData.annee_naissance) {
      setErreur('Veuillez sélectionner une date de naissance complète');
      return;
    }

    // Validation du mot de passe si modifié
    if (formData.nouveau_mot_de_passe) {
      if (formData.nouveau_mot_de_passe.length < 8) {
        setErreur('Le nouveau mot de passe doit contenir au moins 8 caractères');
        return;
      }
      if (formData.nouveau_mot_de_passe !== formData.confirmer_mot_de_passe) {
        setErreur('Les mots de passe ne correspondent pas');
        return;
      }
    }

    try {
      setSauvegarde(true);
      
      const response = await put('/api/utilisateur/moi', {
        email: formData.email,
        telephone: formData.telephone,
          date_naissance: formData.date_naissance,
          mot_de_passe: formData.mot_de_passe || undefined,
          nouveau_mot_de_passe: formData.nouveau_mot_de_passe || undefined
        })
      });

      const data = await response.json();

      if (data.error) {
        setErreur(data.error);
        return;
      }

      setSuccess(true);
      setFormData(prev => ({
        ...prev,
        mot_de_passe: '',
        nouveau_mot_de_passe: '',
        confirmer_mot_de_passe: ''
      }));

      // Recharger les données
      await chargerDonnees();

      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setErreur('Erreur lors de la sauvegarde');
    } finally {
      setSauvegarde(false);
    }
  };

  // Convertir jour/mois/année en format date_naissance
  const convertirDateNaissance = (jour, mois, annee) => {
    if (!jour || !mois || !annee) return '';
    const jourPad = jour.padStart(2, '0');
    const moisPad = mois.padStart(2, '0');
    return `${annee}-${moisPad}-${jourPad}`;
  };

  // Mettre à jour date_naissance quand jour/mois/année changent
  const handleDateChange = (type, value) => {
    const newFormData = { ...formData };
    if (type === 'jour') newFormData.jour_naissance = value;
    if (type === 'mois') newFormData.mois_naissance = value;
    if (type === 'annee') newFormData.annee_naissance = value;
    
    // Reconstruire date_naissance
    const dateNaissance = convertirDateNaissance(
      newFormData.jour_naissance,
      newFormData.mois_naissance,
      newFormData.annee_naissance
    );
    newFormData.date_naissance = dateNaissance;
    
    setFormData(newFormData);
  };

  // Calculer la tranche d'âge
  const calculerTrancheAge = (dateNaissance) => {
    if (!dateNaissance) return null;
    const age = new Date().getFullYear() - new Date(dateNaissance).getFullYear();
    if (age >= 18 && age <= 24) return '18-24';
    if (age >= 25 && age <= 34) return '25-34';
    if (age >= 35 && age <= 44) return '35-44';
    if (age >= 45 && age <= 54) return '45-54';
    if (age >= 55) return '55+';
    return null;
  };

  // Générer les options pour les jours (1-31)
  const genererJours = () => {
    const jours = [];
    for (let i = 1; i <= 31; i++) {
      jours.push(i);
    }
    return jours;
  };

  // Générer les options pour les mois
  const mois = [
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];

  // Générer les options pour les années (année actuelle - 100 jusqu'à année actuelle)
  const genererAnnees = () => {
    const annees = [];
    const anneeActuelle = new Date().getFullYear();
    const anneeMin = anneeActuelle - 100;
    for (let i = anneeActuelle; i >= anneeMin; i--) {
      annees.push(i);
    }
    return annees;
  };

  // Gérer la suppression du compte
  const handleSupprimerCompte = async () => {
    try {
      setSuppressionEnCours(true);
      
      const response = await del('/api/utilisateur/mon-compte');

      const data = await response.json();

      if (data.error) {
        setErreur(data.error);
        setSuppressionEnCours(false);
        setShowDeleteConfirm(false);
      } else if (data.success) {
        // Rediriger vers la page de connexion
        navigate('/connexion', { replace: true });
      }
    } catch (error) {
      console.error('Erreur suppression compte:', error);
      setErreur('Erreur lors de la suppression du compte');
      setSuppressionEnCours(false);
      setShowDeleteConfirm(false);
    }
  };

  if (chargement) {
    return (
      <div className="user-account-page">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-account-page">
      <Header />
      
      <div className={`account-container ${showAnimation ? 'animate-on-load' : ''}`}>
        <div className="account-header">
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Retour
          </button>
          <h1>Mon compte</h1>
        </div>

        {erreur && (
          <div className="message-erreur">
            {erreur}
          </div>
        )}

        {success && (
          <div className="message-succes">
            ✅ Vos informations ont été mises à jour avec succès
          </div>
        )}

        <form onSubmit={handleSauvegarder} className="account-form">
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {/* Téléphone */}
          <div className="form-group">
            <label htmlFor="telephone">Numéro de téléphone *</label>
            <input
              id="telephone"
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              required
              placeholder="06 12 34 56 78"
            />
          </div>

          {/* Date de naissance - Sélecteur moderne */}
          <div className="form-group">
            <label>Date de naissance *</label>
            <div className="date-selector-modern">
              <select
                id="jour_naissance"
                value={formData.jour_naissance}
                onChange={(e) => handleDateChange('jour', e.target.value)}
                required
                className="date-select"
              >
                <option value="">Jour</option>
                {genererJours().map((jour) => (
                  <option key={jour} value={jour.toString().padStart(2, '0')}>
                    {jour}
                  </option>
                ))}
              </select>
              
              <select
                id="mois_naissance"
                value={formData.mois_naissance}
                onChange={(e) => handleDateChange('mois', e.target.value)}
                required
                className="date-select"
              >
                <option value="">Mois</option>
                {mois.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              
              <select
                id="annee_naissance"
                value={formData.annee_naissance}
                onChange={(e) => handleDateChange('annee', e.target.value)}
                required
                className="date-select"
              >
                <option value="">Année</option>
                {genererAnnees().map((annee) => (
                  <option key={annee} value={annee.toString()}>
                    {annee}
                  </option>
                ))}
              </select>
            </div>
            {formData.date_naissance && (
              <small>
                Tranche d'âge : {calculerTrancheAge(formData.date_naissance) || 'Non déterminée'}
                <br />
                (Utilisée uniquement pour des statistiques anonymes)
              </small>
            )}
          </div>

          {/* Modification du mot de passe */}
          <div className="password-section">
            <h3>Modifier mon mot de passe</h3>
            <p className="section-description">Laissez vide si vous ne souhaitez pas changer votre mot de passe</p>

            <div className="form-group">
              <label htmlFor="mot_de_passe">Mot de passe actuel</label>
              <input
                id="mot_de_passe"
                type="password"
                value={formData.mot_de_passe}
                onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label htmlFor="nouveau_mot_de_passe">Nouveau mot de passe</label>
              <input
                id="nouveau_mot_de_passe"
                type="password"
                value={formData.nouveau_mot_de_passe}
                onChange={(e) => setFormData({ ...formData, nouveau_mot_de_passe: e.target.value })}
                placeholder="Au moins 8 caractères"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmer_mot_de_passe">Confirmer le nouveau mot de passe</label>
              <input
                id="confirmer_mot_de_passe"
                type="password"
                value={formData.confirmer_mot_de_passe}
                onChange={(e) => setFormData({ ...formData, confirmer_mot_de_passe: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={sauvegarde}>
            {sauvegarde ? 'Sauvegarde...' : 'Mettre à jour mes informations'}
          </button>
        </form>

        {/* Bouton Supprimer le compte */}
        <div style={{ marginTop: 'var(--espacement-xl)', textAlign: 'center' }}>
          <button
            type="button"
            className="btn-delete-account"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={suppressionEnCours}
          >
            Supprimer mon compte
          </button>
        </div>
      </div>

      {/* Popup de confirmation style Apple */}
      {showDeleteConfirm && (
        <>
          {/* Overlay */}
          <div 
            className="delete-confirm-overlay"
            onClick={() => !suppressionEnCours && setShowDeleteConfirm(false)}
          />
          
          {/* Modal */}
          <div className="delete-confirm-modal">
            <div className="delete-confirm-icon">⚠️</div>
            <h2>Supprimer votre compte</h2>
            <p>
              Cette action est définitive et irréversible.<br />
              Toutes vos données seront définitivement supprimées.
            </p>
            <div className="delete-confirm-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={suppressionEnCours}
              >
                Annuler
              </button>
              <button
                className="btn-confirm-delete"
                onClick={handleSupprimerCompte}
                disabled={suppressionEnCours}
              >
                {suppressionEnCours ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default UserAccount;


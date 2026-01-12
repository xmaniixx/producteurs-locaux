// ============================================
// PAGE MOT DE PASSE OUBLIÉ
// ============================================
// Permet de demander une réinitialisation de mot de passe

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ForgotPassword.css';

function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmerMotDePasse, setConfirmerMotDePasse] = useState('');
  const [etape, setEtape] = useState(token ? 'reset' : 'request'); // 'request' ou 'reset'
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [success, setSuccess] = useState(false);

  // Demander un lien de réinitialisation
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setErreur('');
    setChargement(true);

    try {
      const response = await fetch('/api/utilisateur/reset-password/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.error) {
        setErreur(data.error);
      } else {
        setSuccess(true);
        // Afficher le lien en développement (à supprimer en production)
        if (data.dev_link) {
          console.log('🔑 Lien de réinitialisation (développement):', data.dev_link);
        }
      }
    } catch (error) {
      console.error('Erreur demande reset:', error);
      setErreur('Erreur lors de la demande. Réessayez.');
    } finally {
      setChargement(false);
    }
  };

  // Réinitialiser le mot de passe avec le token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErreur('');

    if (nouveauMotDePasse !== confirmerMotDePasse) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }

    if (nouveauMotDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setChargement(true);

    try {
      const response = await fetch('/api/utilisateur/reset-password/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          token,
          nouveau_mot_de_passe: nouveauMotDePasse
        })
      });

      const data = await response.json();

      if (data.error) {
        setErreur(data.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/connexion');
        }, 2000);
      }
    } catch (error) {
      console.error('Erreur reset password:', error);
      setErreur('Erreur lors de la réinitialisation. Réessayez.');
    } finally {
      setChargement(false);
    }
  };

  if (etape === 'reset') {
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-container">
          <div className="forgot-password-header">
            <h1>🔑 Nouveau mot de passe</h1>
            <p>Entrez votre nouveau mot de passe</p>
          </div>

          {erreur && (
            <div className="message-erreur">
              {erreur}
            </div>
          )}

          {success && (
            <div className="message-succes">
              ✅ Mot de passe réinitialisé avec succès ! Redirection vers la connexion...
            </div>
          )}

          {!success && (
            <form onSubmit={handleResetPassword} className="forgot-password-form">
              <div className="form-group">
                <label htmlFor="nouveau-mot-de-passe">Nouveau mot de passe *</label>
                <input
                  id="nouveau-mot-de-passe"
                  type="password"
                  value={nouveauMotDePasse}
                  onChange={(e) => setNouveauMotDePasse(e.target.value)}
                  required
                  minLength="8"
                  placeholder="Au moins 8 caractères"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmer-mot-de-passe">Confirmer le mot de passe *</label>
                <input
                  id="confirmer-mot-de-passe"
                  type="password"
                  value={confirmerMotDePasse}
                  onChange={(e) => setConfirmerMotDePasse(e.target.value)}
                  required
                  minLength="8"
                  placeholder="Retapez le mot de passe"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={chargement}>
                {chargement ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          )}

          <div className="forgot-password-footer">
            <button className="link-back" onClick={() => navigate('/connexion')}>
              ← Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <h1>🔑 Mot de passe oublié ?</h1>
          <p>Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe</p>
        </div>

        {erreur && (
          <div className="message-erreur">
            {erreur}
          </div>
        )}

        {success && (
          <div className="message-succes">
            ✅ {process.env.NODE_ENV === 'development' 
              ? 'Un lien de réinitialisation a été généré (voir console pour le lien en développement)' 
              : 'Un email avec le lien de réinitialisation vous a été envoyé. Vérifiez votre boîte mail.'}
            <br />
            <button className="link-back" onClick={() => navigate('/connexion')}>
              Retour à la connexion
            </button>
          </div>
        )}

        {!success && (
          <form onSubmit={handleRequestReset} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={chargement}>
              {chargement ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>
        )}

        <div className="forgot-password-footer">
          <button className="link-back" onClick={() => navigate('/connexion')}>
            ← Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;




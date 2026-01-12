// ============================================
// PAGE AUTHENTIFICATION UTILISATEUR
// ============================================
// Page de connexion/inscription utilisateur
// S'affiche au lancement si l'utilisateur n'est pas connecté

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserAuth.css';

function UserAuth() {
  const [activeTab, setActiveTab] = useState('connexion'); // 'connexion' ou 'inscription'
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmerMotDePasse, setConfirmerMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [telephone, setTelephone] = useState('');
  const [jourNaissance, setJourNaissance] = useState('');
  const [moisNaissance, setMoisNaissance] = useState('');
  const [anneeNaissance, setAnneeNaissance] = useState('');
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [emailExists, setEmailExists] = useState(null); // null, true, false
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-4 pour l'indicateur de sécurité
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const navigate = useNavigate();
  const recaptchaRef = React.useRef(null);
  const emailCheckTimeoutRef = React.useRef(null);

  // Nettoyer le timeout au démontage du composant
  useEffect(() => {
    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, []);

  // Charger Google reCAPTCHA quand on est sur l'onglet inscription
  useEffect(() => {
    if (activeTab !== 'inscription') return;

    // Vérifier si le script est déjà chargé
    const existingScript = document.querySelector('script[src*="recaptcha"]');
    
    if (existingScript && window.grecaptcha) {
      // Le script est déjà chargé, attendre un peu pour que le DOM soit prêt
      setTimeout(() => {
        renderRecaptcha();
      }, 100);
      return;
    }

    // Créer le callback global
    window.onloadRecaptchaCallback = () => {
      renderRecaptcha();
    };

    // Charger le script reCAPTCHA
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onloadRecaptchaCallback&render=explicit';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('Erreur lors du chargement de reCAPTCHA');
    };
    
    document.body.appendChild(script);
    
    function renderRecaptcha() {
      // Attendre un peu pour s'assurer que le DOM est prêt
      setTimeout(() => {
        const container = document.getElementById('recaptcha-container');
        if (!container) {
          console.warn('Conteneur reCAPTCHA non trouvé');
          return;
        }
        
        // Vérifier si un widget existe déjà
        if (container.hasChildNodes()) {
          return;
        }
        
        if (window.grecaptcha && window.grecaptcha.render) {
          try {
            // Utiliser la clé de test Google par défaut si aucune clé n'est configurée
            const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
            
            const widgetId = window.grecaptcha.render('recaptcha-container', {
              'sitekey': siteKey,
              'callback': (token) => {
                setRecaptchaToken(token);
                setCaptchaChecked(true);
              },
              'expired-callback': () => {
                setRecaptchaToken(null);
                setCaptchaChecked(false);
              },
              'error-callback': () => {
                setRecaptchaToken(null);
                setCaptchaChecked(false);
              }
            });
            
            // Stocker l'ID du widget pour pouvoir le réinitialiser
            if (widgetId !== undefined) {
              container.setAttribute('data-widget-id', widgetId);
            }
          } catch (error) {
            console.error('Erreur lors du rendu de reCAPTCHA:', error);
          }
        } else {
          console.warn('grecaptcha n\'est pas disponible');
        }
      }, 200);
    }
    
    return () => {
      // Nettoyage : réinitialiser le widget si on change d'onglet
      if (window.grecaptcha) {
        try {
          const container = document.getElementById('recaptcha-container');
          if (container && container.hasChildNodes()) {
            const widgetId = container.getAttribute('data-widget-id');
            if (widgetId) {
              window.grecaptcha.reset(widgetId);
            } else {
              // Si pas de widget-id, vider le conteneur
              container.innerHTML = '';
            }
          }
        } catch (e) {
          // Ignorer les erreurs de nettoyage
        }
      }
    };
  }, [activeTab]);

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const verifierConnexion = async () => {
      try {
        const response = await fetch('/api/utilisateur/verifier', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          // Si l'API n'est pas disponible, rester sur la page de connexion
          return;
        }
        
        const data = await response.json();
        
        if (data.connected) {
          navigate('/');
        }
      } catch (error) {
        // Si l'API n'existe pas encore, on reste sur la page de connexion
        // Ne pas bloquer le rendu en cas d'erreur
      }
    };
    
    verifierConnexion();
  }, [navigate]);

  // Calculer la force du mot de passe
  useEffect(() => {
    if (!motDePasse) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (motDePasse.length >= 8) strength++;
    if (motDePasse.match(/[a-z]/) && motDePasse.match(/[A-Z]/)) strength++;
    if (motDePasse.match(/\d/)) strength++;
    if (motDePasse.match(/[^a-zA-Z\d]/)) strength++;
    
    setPasswordStrength(strength);
  }, [motDePasse]);

  // Gestion de la connexion
  const handleConnexion = async (e) => {
    e.preventDefault();
    setErreur('');
    setChargement(true);

    try {
      const response = await fetch('/api/utilisateur/connexion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, mot_de_passe: motDePasse })
      });

      if (!response.ok) {
        // Si le serveur ne répond pas (ECONNREFUSED)
        if (response.status === 0 || response.status >= 500) {
          setErreur('Le serveur backend n\'est pas accessible. Vérifiez qu\'il est démarré sur le port 3001.');
          setChargement(false);
          return;
        }
      }

      const data = await response.json();

      if (data.error) {
        setErreur(data.error);
      } else if (data.success) {
        // Stocker le token JWT dans localStorage
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('✅ Token JWT stocké');
        }
        // Rediriger vers l'accueil
        navigate('/');
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      // Détecter spécifiquement les erreurs de connexion réseau
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED'))) {
        setErreur('❌ Le serveur backend n\'est pas accessible. Assurez-vous que le serveur est démarré avec "npm run dev:server" ou "npm run dev".');
      } else {
        setErreur('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
      }
    } finally {
      setChargement(false);
    }
  };

  // ============================================
  // 📧 FONCTION - Simuler l'envoi d'email de confirmation
  // ============================================
  const sendConfirmationEmail = async (userEmail) => {
    // Générer un token de confirmation (simulé)
    const confirmationToken = `conf_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const confirmationLink = `${window.location.origin}/confirmer-email?token=${confirmationToken}`;

    // Contenu de l'email (simulé)
    const emailContent = {
      to: userEmail,
      subject: 'Confirmez votre adresse email - Producteurs Locaux',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00D47E 0%, #114248 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #00D47E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌾 Bienvenue sur Producteurs Locaux !</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Merci de vous être inscrit sur Producteurs Locaux !</p>
              <p>Pour finaliser votre inscription, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
              <div style="text-align: center;">
                <a href="${confirmationLink}" class="button">Confirmer mon email</a>
              </div>
              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #666;">${confirmationLink}</p>
              <p>Ce lien expirera dans 24 heures.</p>
              <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Producteurs Locaux - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Bienvenue sur Producteurs Locaux !

Merci de vous être inscrit. Pour finaliser votre inscription, veuillez confirmer votre adresse email en visitant ce lien :

${confirmationLink}

Ce lien expirera dans 24 heures.

Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.

© ${new Date().getFullYear()} Producteurs Locaux
      `
    };

    // ============================================
    // 🔄 MODE MOCK (LOCAL) - Simuler l'envoi
    // ============================================
    const USE_MOCK_EMAIL = true; // Passer à false pour activer l'envoi réel
    
    if (USE_MOCK_EMAIL) {
      // Logger le contenu de l'email dans la console
      console.log('📧 ============================================');
      console.log('📧 EMAIL DE CONFIRMATION (SIMULÉ)');
      console.log('📧 ============================================');
      console.log('To:', emailContent.to);
      console.log('Subject:', emailContent.subject);
      console.log('Token:', confirmationToken);
      console.log('Link:', confirmationLink);
      console.log('\n📧 CONTENU HTML:');
      console.log(emailContent.html);
      console.log('\n📧 CONTENU TEXTE:');
      console.log(emailContent.text);
      console.log('📧 ============================================');
      
      // Stocker le token dans localStorage pour référence (simulation)
      localStorage.setItem('email_confirmation_token', JSON.stringify({
        email: userEmail,
        token: confirmationToken,
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
      }));
      
      return { success: true, mock: true };
    }

    // ============================================
    // 🚀 ENVOI RÉEL (FUTUR)
    // ============================================
    // Code prêt pour l'intégration d'un vrai service email
    // Exemples : SendGrid, Mailgun, AWS SES, etc.
    
    try {
      const response = await fetch('/api/utilisateur/envoyer-email-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: userEmail,
          token: confirmationToken,
          confirmationLink
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Email de confirmation envoyé avec succès à:', userEmail);
        return { success: true, mock: false };
      } else {
        console.warn('⚠️ Échec de l\'envoi d\'email:', result.error);
        // Ne pas bloquer l'inscription si l'email échoue
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
      // Ne pas bloquer l'inscription si l'email échoue
      return { success: false, error: error.message };
    }
  };

  // Gestion de l'inscription
  const handleInscription = async (e) => {
    e.preventDefault();
    setErreur('');

    // Validations
    if (!recaptchaToken) {
      setErreur('Veuillez compléter la vérification reCAPTCHA');
      return;
    }

    if (emailExists === true) {
      setErreur('Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.');
      return;
    }

    if (passwordStrength < 2) {
      setErreur('Le mot de passe est trop faible. Utilisez au moins 8 caractères avec lettres et chiffres.');
      return;
    }

    if (motDePasse !== confirmerMotDePasse) {
      setErreur('Les mots de passe ne correspondent pas.');
      return;
    }

    // Vérifier que la date de naissance est complète et valide
    if (!jourNaissance || !moisNaissance || !anneeNaissance) {
      setErreur('Veuillez remplir complètement la date de naissance (jour, mois et année).');
      return;
    }

    const jour = parseInt(jourNaissance);
    const mois = parseInt(moisNaissance);
    const annee = parseInt(anneeNaissance);
    
    // Vérifier que la date est valide
    const dateObj = new Date(annee, mois - 1, jour);
    if (dateObj.getDate() !== jour || dateObj.getMonth() !== mois - 1 || dateObj.getFullYear() !== annee) {
      setErreur('Date de naissance invalide. Vérifiez le jour, le mois et l\'année.');
      return;
    }

    // Vérifier que la personne a au moins 13 ans
    const today = new Date();
    const age = today.getFullYear() - annee - (today.getMonth() < mois - 1 || (today.getMonth() === mois - 1 && today.getDate() < jour) ? 1 : 0);
    if (age < 13) {
      setErreur('Vous devez avoir au moins 13 ans pour créer un compte.');
      return;
    }

    setChargement(true);

    try {
      const response = await fetch('/api/utilisateur/inscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          telephone,
          mot_de_passe: motDePasse,
          date_naissance: `${anneeNaissance}-${moisNaissance.padStart(2, '0')}-${jourNaissance.padStart(2, '0')}`
        })
      });

      const data = await response.json();

      if (data.error) {
        setErreur(data.error);
      } else if (data.success) {
        // ============================================
        // 📧 ENVOI EMAIL DE CONFIRMATION
        // ============================================
        await sendConfirmationEmail(email);
        setEmailConfirmationSent(true);
        
        // Rediriger vers l'accueil après un court délai pour que l'utilisateur voie le message
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      setErreur('Erreur lors de l\'inscription. Vérifiez votre connexion internet et réessayez.');
    } finally {
      setChargement(false);
    }
  };

  // Obtenir la couleur de l'indicateur de sécurité
  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'transparent';
    if (passwordStrength <= 1) return '#ff5252'; // Rouge
    if (passwordStrength === 2) return '#ffa726'; // Orange
    if (passwordStrength === 3) return '#66bb6a'; // Vert clair
    return '#00D47E'; // Vert principal
  };

  // Obtenir le texte de l'indicateur
  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 1) return 'Faible';
    if (passwordStrength === 2) return 'Moyen';
    if (passwordStrength === 3) return 'Bon';
    return 'Fort';
  };

  return (
    <div className="user-auth-page">
      <div className="user-auth-container">
        {/* Logo et titre */}
        <div className="user-auth-header">
          <div className="logo-placeholder">🌾</div>
          <h1>Bienvenue</h1>
          <p>Trouvez des producteurs locaux près de chez vous</p>
        </div>

        {/* Onglets Connexion / Inscription */}
        <div className="auth-tabs">
          <button
            className={`tab-button ${activeTab === 'connexion' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('connexion');
              setErreur('');
            }}
          >
            Connexion
          </button>
          <button
            className={`tab-button ${activeTab === 'inscription' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('inscription');
              setErreur('');
            }}
          >
            Inscription
          </button>
        </div>

        {/* Message d'erreur */}
        {erreur && (
          <div className="auth-erreur">
            {erreur}
          </div>
        )}

        {/* Message de confirmation email */}
        {emailConfirmationSent && (
          <div className="auth-succes" style={{ 
            background: '#e8f5e9', 
            color: '#2e7d32', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '15px',
            border: '1px solid #66bb6a'
          }}>
            ✉️ Un email de confirmation vous a été envoyé.<br />
            Veuillez confirmer votre adresse pour continuer.
          </div>
        )}

        {/* Formulaire de connexion */}
        {activeTab === 'connexion' && (
          <form onSubmit={handleConnexion} className="auth-form">
            <div className="form-groupe">
              <label htmlFor="email-connexion">Email *</label>
              <input
                id="email-connexion"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
              />
            </div>

            <div className="form-groupe">
              <label htmlFor="mot-de-passe-connexion">Mot de passe *</label>
              <div className="password-input-wrapper">
                <input
                  id="mot-de-passe-connexion"
                  type={showPassword ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-auth" disabled={chargement}>
              {chargement ? 'Connexion...' : 'Se connecter'}
            </button>

            <div className="auth-footer">
              <button
                type="button"
                className="link-forgot-password"
                onClick={() => navigate('/reset-password')}
              >
                Mot de passe oublié ?
              </button>
              <p>Pas encore de compte ?</p>
              <button
                type="button"
                className="lien-switch"
                onClick={() => {
                  setActiveTab('inscription');
                  setErreur('');
                  setEmailExists(null);
                }}
              >
                Créer un compte
              </button>
            </div>
          </form>
        )}

        {/* Formulaire d'inscription */}
        {activeTab === 'inscription' && (
          <form onSubmit={handleInscription} className="auth-form">
            <div className="form-groupe">
              <label htmlFor="email-inscription">Email *</label>
              <input
                id="email-inscription"
                type="email"
                value={email}
                onChange={(e) => {
                  const newEmail = e.target.value;
                  setEmail(newEmail);
                  
                  // Réinitialiser l'état
                  setEmailExists(null);
                  setErreur('');
                  
                  // Annuler la vérification précédente
                  if (emailCheckTimeoutRef.current) {
                    clearTimeout(emailCheckTimeoutRef.current);
                  }
                  
                  // Vérifier si l'email existe déjà (avec debounce de 800ms)
                  // Seulement si l'email semble complet (contient @ et au moins 8 caractères)
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  
                  if (newEmail.length >= 8 && emailRegex.test(newEmail)) {
                    emailCheckTimeoutRef.current = setTimeout(async () => {
                      try {
                        const response = await fetch(`/api/utilisateur/verifier-email/${encodeURIComponent(newEmail)}`);
                        
                        if (!response.ok) {
                          // Si 404, ignorer silencieusement (email probablement disponible)
                          if (response.status === 404) {
                            setEmailExists(false);
                            return;
                          }
                          throw new Error('Erreur de vérification');
                        }
                        
                        const data = await response.json();
                        setEmailExists(data.existe);
                        if (data.existe) {
                          setErreur(data.message);
                        } else {
                          setErreur('');
                        }
                      } catch (error) {
                        // Ignorer silencieusement les erreurs de vérification
                        setEmailExists(null);
                      }
                    }, 800); // Attendre 800ms après la dernière frappe
                  } else if (newEmail.length === 0) {
                    setEmailExists(null);
                    setErreur('');
                  }
                }}
                required
                placeholder="votre@email.com"
                style={{
                  borderColor: emailExists === true ? '#c62828' : (emailExists === false ? '#2e7d32' : undefined)
                }}
              />
              {emailExists === true && (
                <small style={{ color: '#c62828' }}>
                  ⚠️ Cet email est déjà utilisé. {email.includes('@') && 'Connectez-vous ou utilisez un autre email.'}
                </small>
              )}
              {emailExists === false && (
                <small style={{ color: '#2e7d32' }}>
                  ✅ Email disponible
                </small>
              )}
            </div>

            <div className="form-groupe">
              <label htmlFor="telephone">Numéro de téléphone *</label>
              <input
                id="telephone"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                required
                placeholder="06 12 34 56 78"
              />
            </div>

            <div className="form-groupe">
              <label>Date de naissance *</label>
              <div className="date-input-wrapper">
                <div className="date-input-field">
                  <label htmlFor="jour-naissance" className="date-label">Jour</label>
                  <input
                    id="jour-naissance"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={jourNaissance}
                    onKeyPress={(e) => {
                      // Ne permettre que les chiffres
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
                        setJourNaissance(value);
                      }
                    }}
                    placeholder="JJ"
                    maxLength="2"
                    required
                    className="date-input"
                  />
                </div>
                <div className="date-separator">/</div>
                <div className="date-input-field">
                  <label htmlFor="mois-naissance" className="date-label">Mois</label>
                  <input
                    id="mois-naissance"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={moisNaissance}
                    onKeyPress={(e) => {
                      // Ne permettre que les chiffres
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                        setMoisNaissance(value);
                      }
                    }}
                    placeholder="MM"
                    maxLength="2"
                    required
                    className="date-input"
                  />
                </div>
                <div className="date-separator">/</div>
                <div className="date-input-field year-field">
                  <label htmlFor="annee-naissance" className="date-label">Année</label>
                  <input
                    id="annee-naissance"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={anneeNaissance}
                    onKeyPress={(e) => {
                      // Ne permettre que les chiffres
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      const currentYear = new Date().getFullYear();
                      const minYear = currentYear - 100;
                      if (value === '' || (parseInt(value) >= minYear && parseInt(value) <= currentYear)) {
                        setAnneeNaissance(value);
                      }
                    }}
                    placeholder="AAAA"
                    maxLength="4"
                    required
                    className="date-input"
                  />
                </div>
              </div>
              <small>Utilisé uniquement pour des statistiques anonymes par tranche d'âge (18-24, 25-34, etc.)</small>
            </div>

            <div className="form-groupe">
              <label htmlFor="mot-de-passe-inscription">Mot de passe *</label>
              <div className="password-input-wrapper">
                <input
                  id="mot-de-passe-inscription"
                  type={showPassword ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  placeholder="Au moins 8 caractères"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {/* Indicateur de sécurité du mot de passe */}
              {motDePasse && (
                <div className="password-strength">
                  <div className="password-strength-bars">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`strength-bar ${passwordStrength >= level ? 'filled' : ''}`}
                        style={{
                          backgroundColor: passwordStrength >= level 
                            ? getPasswordStrengthColor() 
                            : '#e0e0e0'
                        }}
                      />
                    ))}
                  </div>
                  <span 
                    className="strength-text"
                    style={{ color: getPasswordStrengthColor() }}
                  >
                    {getPasswordStrengthText()}
                  </span>
                </div>
              )}
            </div>

            <div className="form-groupe">
              <label htmlFor="confirmer-mot-de-passe">Confirmer le mot de passe *</label>
              <div className="password-input-wrapper">
                <input
                  id="confirmer-mot-de-passe"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmerMotDePasse}
                  onChange={(e) => setConfirmerMotDePasse(e.target.value)}
                  required
                  placeholder="Retapez le mot de passe"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {confirmerMotDePasse && motDePasse !== confirmerMotDePasse && (
                <small style={{ color: '#c62828' }}>
                  ⚠️ Les mots de passe ne correspondent pas
                </small>
              )}
              {confirmerMotDePasse && motDePasse === confirmerMotDePasse && motDePasse.length > 0 && (
                <small style={{ color: '#2e7d32' }}>
                  ✅ Les mots de passe correspondent
                </small>
              )}
            </div>

            {/* Google reCAPTCHA v2 */}
            <div className="form-groupe">
              <label>Vérification de sécurité *</label>
              <div 
                id="recaptcha-container"
                className="recaptcha-container"
              ></div>
              {!recaptchaToken && (
                <small style={{ color: '#c62828', display: 'block', marginTop: '8px' }}>
                  ⚠️ Veuillez compléter la vérification reCAPTCHA ci-dessus
                </small>
              )}
            </div>

            <div className="info-securite">
              <p>🔒 Vos données sont sécurisées</p>
              <p>📊 Usage uniquement statistique et anonyme</p>
            </div>

            <button type="submit" className="btn-auth" disabled={chargement || !recaptchaToken || emailExists === true}>
              {chargement ? 'Création...' : 'Créer mon compte'}
            </button>

            <div className="auth-footer">
              <p>Déjà un compte ?</p>
              <button
                type="button"
                className="lien-switch"
                onClick={() => {
                  setActiveTab('connexion');
                  setErreur('');
                }}
              >
                Se connecter
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

export default UserAuth;


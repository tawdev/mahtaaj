import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './LoginRegister.css';

export default function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isAutoLoginAttempted, setIsAutoLoginAttempted] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer l'URL de retour depuis les paramètres
  const returnUrl = location.state?.returnUrl || '/';

  // Auto-login and autofill logic
  useEffect(() => {
    const attemptAutoLogin = async () => {
      if (isAutoLoginAttempted) return;
      setIsAutoLoginAttempted(true);

      try {
        // Check for saved email first
        const savedEmail = localStorage.getItem('remembered_email');
        if (savedEmail) {
          setFormData(prev => ({ ...prev, email: savedEmail }));
          setRememberMe(true);
        }

        // Check for Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session && !error) {
          // Session is valid, auto-login
          const user = session.user;
          localStorage.setItem('user_data', JSON.stringify({
            id: user.id,
            name: user.user_metadata?.name || user.email,
            email: user.email
          }));
              localStorage.setItem('user', JSON.stringify({ 
            id: user.id, 
            name: user.user_metadata?.name || user.email, 
            email: user.email 
              }));
              
              setSuccess('تسجيل دخول تلقائي ناجح!');
              setTimeout(() => {
                navigate(returnUrl);
              }, 1000);
              return;
          }
          
        // No valid session, clean up old Laravel tokens if any
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('user');
      } catch (error) {
        console.log('Auto-login failed:', error);
        // Clean up invalid tokens
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user');
      }
    };

    if (isLogin) {
      attemptAutoLogin();
    }
  }, [isLogin, navigate, returnUrl, isAutoLoginAttempted]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer les messages d'erreur lors de la saisie
    if (error) setError('');
    if (success) setSuccess('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Fonction de validation d'email améliorée
  const isValidEmail = (email) => {
    // Regex plus strict pour valider l'email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Vérifier le format de base
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Vérifier que le domaine a au moins 2 caractères après le point
    const parts = email.split('@');
    if (parts.length !== 2) {
      return false;
    }
    
    const domain = parts[1];
    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      return false;
    }
    
    // Vérifier que le TLD (top-level domain) a au moins 2 caractères
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return false;
    }
    
    // Vérifier qu'il n'y a pas de caractères invalides
    if (email.includes('..') || email.includes('@@')) {
      return false;
    }
    
    // Vérifier que le domaine n'est pas vide ou trop court
    const domainName = domainParts[0];
    if (!domainName || domainName.length < 2) {
      return false;
    }
    
    // Liste des TLDs communs (optionnel, pour validation supplémentaire)
    const commonTlds = ['com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'uk', 'fr', 'de', 'es', 'it', 'nl', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi', 'pl', 'cz', 'gr', 'pt', 'ie', 'au', 'ca', 'nz', 'jp', 'cn', 'in', 'br', 'mx', 'ar', 'za', 'ae', 'sa', 'eg', 'ma', 'dz', 'tn', 'ly', 'sd', 'ye', 'iq', 'jo', 'lb', 'sy', 'ps', 'kw', 'qa', 'bh', 'om'];
    
    // Vérifier que le TLD est valide (au moins 2 caractères et alphabétique)
    if (!/^[a-zA-Z]{2,}$/.test(tld)) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation de l'email pour login et register
      if (!formData.email || !formData.email.trim()) {
        setError('Veuillez entrer votre adresse email');
        return;
      }

      const trimmedEmail = formData.email.trim().toLowerCase();
      
      // Validation de l'email
      const emailIsValid = isValidEmail(trimmedEmail);
      console.log('Email validation:', { email: trimmedEmail, isValid: emailIsValid });
      
      if (!emailIsValid) {
        setError('Adresse email invalide. Veuillez vérifier votre email.\nExemples valides: nom@gmail.com, nom@yahoo.com, nom@example.com');
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        // Connexion avec Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
            password: formData.password
        });

        if (error) {
          setError(error.message || 'Erreur de connexion');
          return;
        }

        if (data.user) {
          // Clean up old Laravel tokens
          try {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
          } catch (_) {}

          // Save user data
          const userData = {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email,
            email: data.user.email
          };
          
          localStorage.setItem('user_data', JSON.stringify(userData));
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Save email for "Remember Me" functionality
          if (rememberMe) {
            localStorage.setItem('remembered_email', trimmedEmail);
          } else {
            localStorage.removeItem('remembered_email');
          }
          
          setSuccess('Connexion réussie !');
          setTimeout(() => {
            navigate(returnUrl);
          }, 1500);
        }
      } else {
        // Inscription avec Supabase
        // Validation
        if (!formData.name || formData.name.trim().length < 2) {
          setError('Le nom doit contenir au moins 2 caractères');
          return;
        }

        if (formData.password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères');
          return;
        }

        if (formData.password !== formData.password_confirmation) {
          setError('Les mots de passe ne correspondent pas');
          return;
        }

        // Log des données avant l'envoi
        console.log('Attempting signup with:', {
          email: trimmedEmail,
          emailLength: trimmedEmail.length,
          passwordLength: formData.password.length,
          name: formData.name.trim()
        });

        // Essayer sans emailRedirectTo d'abord
        const signUpOptions = {
          email: trimmedEmail,
          password: formData.password,
          options: {
            data: {
              name: formData.name.trim()
            }
          }
        };

        // Ajouter emailRedirectTo seulement si Site URL est configuré
        if (window.location.origin) {
          signUpOptions.options.emailRedirectTo = window.location.origin;
        }

        const { data, error } = await supabase.auth.signUp(signUpOptions);

        if (error) {
          console.error('Supabase signup error:', error);
          console.error('Error details:', {
            message: error.message,
            status: error.status,
            email: trimmedEmail
          });
          
          // Traduire les messages d'erreur courants
          let errorMessage = error.message;
          if (error.message?.includes('already registered') || error.message?.includes('already exists') || error.message?.includes('User already registered')) {
            errorMessage = 'Cet email est déjà enregistré. Veuillez vous connecter.';
          } else if (error.message?.includes('Invalid email') || error.message?.includes('invalid') || error.message?.includes('Email address')) {
            errorMessage = '❌ Adresse email invalide.\n\nSi votre email semble correct (ex: simo@gmail.com), vérifiez:\n\n1. Dans Supabase Dashboard:\n   • Authentication → Providers → Email (doit être activé)\n   • Authentication → Settings → Site URL (doit être http://localhost:3000)\n   • Authentication → URL Configuration → Redirect URLs (ajoutez http://localhost:3000)\n\n2. Vérifiez la console (F12) pour plus de détails\n\n3. Essayez un autre email pour tester';
          } else if (error.message?.includes('Password') || error.message?.includes('password')) {
            errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
          } else if (error.message?.includes('rate limit')) {
            errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
          } else {
            errorMessage = error.message || 'Erreur d\'inscription. Veuillez réessayer.';
          }
          setError(errorMessage);
          setIsLoading(false);
          return;
        }

        if (data.user) {
          // Save user data
          const userData = {
            id: data.user.id,
            name: formData.name.trim(),
            email: data.user.email
          };
          
          localStorage.setItem('user_data', JSON.stringify(userData));
          localStorage.setItem('user', JSON.stringify(userData));
            
            // Save email for "Remember Me" functionality
            if (rememberMe) {
            localStorage.setItem('remembered_email', trimmedEmail);
            } else {
              localStorage.removeItem('remembered_email');
            }
            
          // Vérifier si l'email confirmation est requise
          if (data.session) {
            // L'utilisateur est connecté directement
            setSuccess('Inscription réussie ! Vous êtes maintenant connecté.');
            setTimeout(() => {
              navigate(returnUrl);
            }, 1500);
          } else {
            // Email confirmation requise
            setSuccess('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.');
            setIsLogin(true);
          }
          
          setFormData({
            name: '',
            email: '',
            password: '',
            password_confirmation: ''
          });
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: ''
    });
    setRememberMe(false);
    setIsAutoLoginAttempted(false);
  };

  // Safe logout function - removes token but keeps email
  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Remove authentication data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_data');
      sessionStorage.removeItem('user');
      
      // Keep remembered_email for easy re-login
      // localStorage.removeItem('remembered_email'); // Commented out to keep email
      
      setSuccess('تم تسجيل الخروج بنجاح');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="login-register-page">
      <div className="login-register-container">
        <div className="form-header">
          <h1 className="form-title">
            {isLogin ? '🔐 Connexion' : '📝 Inscription'}
          </h1>
          
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name" className="form-label">Nom complet</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                required={!isLogin}
                placeholder="Votre nom complet"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              required
              placeholder="votre@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Mot de passe</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input password-input"
                required
                placeholder="Votre mot de passe"
                minLength="6"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                tabIndex="-1"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  // Eye (open)
                  <svg className="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  // Eye (closed)
                  <svg className="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.05"/>
                    <path d="M1 1l22 22"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="password_confirmation" className="form-label">Confirmer le mot de passe</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="password_confirmation"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  className="form-input password-input"
                  required={!isLogin}
                  placeholder="Confirmez votre mot de passe"
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={toggleConfirmPasswordVisibility}
                  tabIndex="-1"
                  aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showConfirmPassword ? (
                    // Eye (open)
                    <svg className="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    // Eye (closed)
                    <svg className="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.05"/>
                      <path d="M1 1l22 22"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {success}
            </div>
          )}

          <div className="remember-row">
            <label className="remember-label" htmlFor="rememberMe">
              <input
                id="rememberMe"
                type="checkbox"
                className="remember-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="remember-text">تذكرني</span>
            </label>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              isLogin ? 'Se connecter' : 'S\'inscrire'
            )}
          </button>

        </form>

        <div className="form-footer">
          <p className="toggle-text">
            {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
          </p>
          <button
            type="button"
            onClick={toggleMode}
            className="toggle-button"
          >
            {isLogin ? 'Créer un compte' : 'Se connecter'}
          </button>
        </div>

        <div className="back-to-shop">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="back-button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            🏠 Retour à l'accueil
          </button>
        </div>

        
      </div>
    </div>
  );
}

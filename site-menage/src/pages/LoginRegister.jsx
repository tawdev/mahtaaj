import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import AuthService from '../lib/authService';
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Récupérer l'URL de retour depuis les paramètres
  const returnUrl = location.state?.returnUrl || '/';

  // Store returnUrl in localStorage for the global auth listener (App.jsx)
  // This ensures redirect works even after page refreshes or from email confirmations
  useEffect(() => {
    // Only set if we have a non-default returnUrl or nothing is stored yet
    const existing = localStorage.getItem('auth_return_url');

    // Logic: 
    // - If current returnUrl from state is NOT '/' (meaning it's specific), use it.
    // - OR If nothing exists in localStorage yet, use current returnUrl (even if it's '/').
    // - DO NOT overwrite a specific existing URL with a generic '/'.
    if (returnUrl !== '/' || !existing || existing === '/') {
      console.log('[LoginRegister] Storing auth_return_url:', returnUrl);
      localStorage.setItem('auth_return_url', returnUrl);
    } else {
      console.log('[LoginRegister] Preserving existing auth_return_url:', existing);
    }
  }, [returnUrl]);

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

          // We disable auto-redirect so the user can see they are on the login page
          // navigate(returnUrl);
          // return;
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
        setError(t('auth.errors.email_required', 'Veuillez entrer votre adresse email'));
        return;
      }

      const trimmedEmail = formData.email.trim().toLowerCase();

      // Validation de l'email
      const emailIsValid = isValidEmail(trimmedEmail);
      console.log('Email validation:', { email: trimmedEmail, isValid: emailIsValid });

      if (!emailIsValid) {
        setError(t('auth.errors.invalid_email', 'Adresse email invalide. Veuillez vérifier votre email.\nExemples valides: nom@gmail.com, nom@yahoo.com, nom@example.com'));
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
          setError(error.message || t('auth.errors.server_error', 'Erreur de connexion'));
          return;
        }

        if (data.user) {
          // Check if email is verified
          if (!data.user.email_confirmed_at) {
            await supabase.auth.signOut();
            setError(t('auth.errors.email_unconfirmed', '❌ Votre email n\'est pas encore confirmé. Veuillez vérifier votre boîte de réception.'));
            setIsLoading(false);
            return;
          }

          // Clean up old Laravel tokens
          try {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
          } catch (_) { }

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

          // Update last_login in users table
          try {
            await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', data.user.id);
          } catch (loginUpdateErr) {
            console.error('Error updating last_login:', loginUpdateErr);
            // Don't fail login if this fails
          }

          setSuccess(t('auth.success.login_success', 'Connexion réussie !'));
          // Manual redirect after data synchronization
          setTimeout(() => {
            navigate(returnUrl, { replace: true });
          }, 100);
        }
      } else {
        // Inscription avec Supabase
        // Validation
        if (!formData.name || formData.name.trim().length < 2) {
          setError(t('auth.errors.name_required', 'Le nom doit contenir au moins 2 caractères'));
          return;
        }

        if (formData.password.length < 6) {
          setError(t('auth.errors.password_short', 'Le mot de passe doit contenir au moins 6 caractères'));
          return;
        }

        if (formData.password !== formData.password_confirmation) {
          setError(t('auth.errors.password_mismatch', 'Les mots de passe ne correspondent pas'));
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
            errorMessage = t('auth.errors.already_registered', 'Cet email est déjà enregistré. Veuillez vous connecter.');
          } else if (error.message?.includes('Invalid email') || error.message?.includes('invalid') || error.message?.includes('Email address')) {
            errorMessage = t('auth.errors.invalid_email', '❌ Adresse email invalide.\n\nSi votre email semble correct (ex: simo@gmail.com), vérifiez:\n\n1. Dans Supabase Dashboard:\n   • Authentication → Providers → Email (doit être activé)\n   • Authentication → Settings → Site URL (doit être http://localhost:3000)\n   • Authentication → URL Configuration → Redirect URLs (ajoutez http://localhost:3000)\n\n2. Vérifiez la console (F12) pour plus de détails\n\n3. Essayez un autre email pour tester');
          } else if (error.message?.includes('Password') || error.message?.includes('password')) {
            errorMessage = t('auth.errors.password_short', 'Le mot de passe doit contenir au moins 6 caractères');
          } else if (error.message?.includes('rate limit')) {
            errorMessage = t('auth.errors.rate_limit', 'Trop de tentatives. Veuillez réessayer plus tard.');
          } else {
            errorMessage = error.message || t('auth.errors.generic_error', 'Erreur d\'inscription. Veuillez réessayer.');
          }
          setError(errorMessage);
          setIsLoading(false);
          return;
        }

        if (data.user) {
          // Save user data in localStorage
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

          // Save user data in the users table
          try {
            const { error: userTableError } = await supabase
              .from('users')
              .upsert({
                id: data.user.id,
                full_name: formData.name.trim(),
                email_verified: data.user.email_confirmed_at ? true : false,
                is_active: true,
                language_preference: 'fr' // Default language
              }, {
                onConflict: 'id'
              });

            if (userTableError) {
              console.error('Error saving user to users table:', userTableError);
              // Don't fail the registration if this fails, just log it
              // The trigger should handle it, but we try to save explicitly
            } else {
              console.log('User data saved to users table successfully');
            }
          } catch (userTableErr) {
            console.error('Exception saving user to users table:', userTableErr);
            // Continue with registration even if this fails
          }

          // Vérifier si l'email confirmation est requise
          if (data.session) {
            // L'utilisateur est connecté directement
            setSuccess(t('auth.success.register_success', 'Inscription réussie ! Vous êtes maintenant connecté.'));
            setTimeout(() => {
              navigate(returnUrl, { replace: true });
            }, 500);
          } else {
            // Email confirmation requise
            setSuccess(t('auth.success.register_confirmation', 'Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.'));
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

      setSuccess(t('auth.success.logout_success', 'تم تسجيل الخروج بنجاح'));
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Prioritize existing auth_return_url if it's more specific than '/'
      const existing = localStorage.getItem('auth_return_url');
      const finalReturnUrl = (existing && existing !== '/') ? existing : returnUrl;

      console.log('[LoginRegister] Starting Google Login, returnUrl:', finalReturnUrl);
      localStorage.setItem('auth_return_url', finalReturnUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
      // The user will be redirected to Google
    } catch (error) {
      console.error('Google login error:', error);
      setError(t('auth.errors.google_error', 'Erreur d\'authentification avec Google'));
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-register-page ${isRTL ? 'rtl' : ''}`}>
      {/* Illustration Side */}
      <div className="auth-illustration-side">
        <img src="/galerie/b__A_wide-angle,_high-.png" alt="Auth Illustration" />
        <div className="illustration-overlay">
          <h2>{isLogin ? t('auth.login_welcome') : t('auth.register_welcome')}</h2>
          <p>
            {isLogin
              ? t('auth.login_desc')
              : t('auth.register_desc')}
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side">
        <div className="login-register-container">
          <div className="form-header">
            <img src="/galerie/logooomahtaaj.png" alt="Mahtaaj Logo" className="auth-logo" />
            <h1 className="form-title">
              {isLogin ? t('auth.login_title') : t('auth.register_title')}
            </h1>
            <p className="form-subtitle">
              {isLogin ? t('auth.login_subtitle') : t('auth.register_subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name" className="form-label">{t('auth.fullname_label')}</label>
                <div className="form-input-wrapper">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    required={!isLogin}
                    placeholder={t('auth.fullname_placeholder')}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">{t('auth.email_label')}</label>
              <div className="form-input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder={t('auth.email_placeholder')}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">{t('auth.password_label')}</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder={t('auth.password_placeholder')}
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  tabIndex="-1"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.05" />
                      <path d="M1 1l22 22" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="password_confirmation" className="form-label">{t('auth.confirm_password_label')}</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="password_confirmation"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleInputChange}
                    className="form-input"
                    required={!isLogin}
                    placeholder={t('auth.confirm_password_placeholder')}
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={toggleConfirmPasswordVisibility}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.05" />
                        <path d="M1 1l22 22" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {isLogin && (
              <div className="remember-row">
                <label className="remember-label" htmlFor="rememberMe">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>{t('auth.remember_me')}</span>
                </label>
              </div>
            )}

            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? <div className="loading-spinner"></div> : (isLogin ? t('auth.login_btn') : t('auth.register_btn'))}
            </button>

            <div className="oauth-divider">
              <span className="divider-text">{t('auth.oauth_divider')}</span>
            </div>

            <button type="button" className="google-login-button" onClick={handleGoogleLogin} disabled={isLoading}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              <span>{t('auth.google_btn')}</span>
            </button>
          </form>

          <div className="form-footer">
            <p className="toggle-text">
              {isLogin ? t('auth.no_account') : t('auth.have_account')}
            </p>
            <button type="button" onClick={toggleMode} className="toggle-button">
              {isLogin ? t('auth.create_account_btn') : t('auth.login_btn')}
            </button>
          </div>

          <div className="back-to-shop">
            <button type="button" onClick={() => navigate('/')} className="back-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19L5 12L12 5" />
              </svg>
              {t('auth.back_to_home')}
            </button>
          </div>
        </div>
      </div>

      {success && (
        <div className="success-toast">
          <div className="success-icon">✓</div>
          <div className="success-content">
            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{t('auth.toast.success')}</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{success}</p>
          </div>
          <button className="toast-close" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {error && (
        <div className="error-toast">
          <div className="error-icon-toast">⚠️</div>
          <div className="success-content">
            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{t('auth.toast.error')}</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{error}</p>
          </div>
          <button className="toast-close" onClick={() => setError('')}>×</button>
        </div>
      )}
    </div>
  );
}

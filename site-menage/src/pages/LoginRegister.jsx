import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import AuthService from '../lib/authService';
import { sanitizeInput } from '../utils/sanitize';
import { validateEmail, validateText, validatePassword, validatePasswordConfirmation } from '../utils/validators';
import logger from '../utils/logger';
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
  useEffect(() => {
    const existing = localStorage.getItem('auth_return_url');
    if (returnUrl !== '/' || !existing || existing === '/') {
      localStorage.setItem('auth_return_url', returnUrl);
    }
  }, [returnUrl]);

  // Auto-login and autofill logic
  useEffect(() => {
    const attemptAutoLogin = async () => {
      if (isAutoLoginAttempted) return;
      setIsAutoLoginAttempted(true);

      try {
        const savedEmail = localStorage.getItem('remembered_email');
        if (savedEmail) {
          setFormData(prev => ({ ...prev, email: savedEmail }));
          setRememberMe(true);
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && !error) {
          const user = session.user;
          // Only store minimal, non-sensitive data
          const userData = { id: user.id, name: user.user_metadata?.name || user.email, email: user.email };
          localStorage.setItem('user_data', JSON.stringify(userData));
          localStorage.setItem('user', JSON.stringify(userData));
        }

        localStorage.removeItem('auth_token');
      } catch (_) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user');
      }
    };

    if (isLogin) attemptAutoLogin();
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

  // ✅ SECURITY: Replaced with shared validator from utils/validators.js
  // No more inline regex that could be inconsistent with backend rules

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // ✅ SECURITY: Sanitize inputs before validation/submission
      const trimmedEmail = sanitizeInput(formData.email, 254).toLowerCase();
      const trimmedName = sanitizeInput(formData.name, 100);

      // ✅ SECURITY: Use shared validator (consistent with backend rules)
      const emailErr = validateEmail(trimmedEmail);
      if (emailErr) {
        setError(t('auth.errors.invalid_email', emailErr));
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
            logger.error('Error updating last_login');
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
        // ✅ SECURITY: Validate register fields using shared validators
        const nameErr = validateText(trimmedName, 'Nom complet', { min: 2, max: 100 });
        if (nameErr) {
          setError(t('auth.errors.name_required', nameErr));
          setIsLoading(false);
          return;
        }

        const passwordErr = validatePassword(formData.password, { minLength: 6 });
        if (passwordErr) {
          setError(t('auth.errors.password_short', passwordErr));
          setIsLoading(false);
          return;
        }

        if (formData.password !== formData.password_confirmation) {
          setError(t('auth.errors.password_mismatch', 'Les mots de passe ne correspondent pas'));
          setIsLoading(false);
          return;
        }

        // Log des données avant l'envoi
        logger.log('Attempting signup with:', {
          emailLength: trimmedEmail.length,
          passwordLength: formData.password.length,
        });

        const signUpOptions = {
          email: trimmedEmail,
          password: formData.password,
          options: {
            data: {
              name: trimmedName  // ✅ Use sanitized name
            }
          }
        };

        if (window.location.origin) {
          signUpOptions.options.emailRedirectTo = window.location.origin;
        }

        const { data, error } = await supabase.auth.signUp(signUpOptions);

        if (error) {
          // ✅ SECURITY: logger only outputs in dev, never in production
          logger.error('Signup error code:', error.status);

          let errorMessage = error.message;
          if (error.message?.includes('already registered') || error.message?.includes('already exists') || error.message?.includes('User already registered')) {
            errorMessage = t('auth.errors.already_registered', 'Cet email est déjà enregistré. Veuillez vous connecter.');
          } else if (error.message?.includes('Invalid email') || error.message?.includes('invalid') || error.message?.includes('Email address')) {
            errorMessage = t('auth.errors.invalid_email', 'Adresse email invalide.');
          } else if (error.message?.includes('Password') || error.message?.includes('password')) {
            errorMessage = t('auth.errors.password_short', 'Le mot de passe doit contenir au moins 6 caractères');
          } else if (error.message?.includes('rate limit')) {
            errorMessage = t('auth.errors.rate_limit', 'Trop de tentatives. Veuillez réessayer plus tard.');
          } else {
            errorMessage = t('auth.errors.generic_error', 'Erreur d\'inscription. Veuillez réessayer.');
          }
          setError(errorMessage);
          setIsLoading(false);
          return;
        }

        if (data.user) {
          // ✅ SECURITY: Only store minimal user data
          const userData = {
            id: data.user.id,
            name: trimmedName,  // ✅ Use sanitized name
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

          try {
            await supabase
              .from('users')
              .upsert({
                id: data.user.id,
                full_name: trimmedName,  // ✅ Use sanitized name
                email_verified: !!data.user.email_confirmed_at,
                is_active: true,
                language_preference: 'fr'
              }, { onConflict: 'id' });
          } catch (_) {
            // Don't fail registration if users table insert fails
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
      logger.error('Auth error:', err?.message);
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_data');
      sessionStorage.removeItem('user');
      setSuccess(t('auth.success.logout_success', 'تم تسجيل الخروج بنجاح'));
    } catch (_) {
      // Fail silently
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const existing = localStorage.getItem('auth_return_url');
      const finalReturnUrl = (existing && existing !== '/') ? existing : returnUrl;
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
    } catch (_) {
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
                  {/* ✅ SECURITY: maxLength attr prevents oversized payload at browser level */}
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    required={!isLogin}
                    placeholder={t('auth.fullname_placeholder')}
                    maxLength={100}
                    autoComplete="name"
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
                  maxLength={254}
                  autoComplete="email"
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
                  maxLength={128}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
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

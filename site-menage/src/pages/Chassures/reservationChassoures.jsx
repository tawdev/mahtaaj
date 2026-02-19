import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './reservationChassoures.css';

export default function ReservationChassoures() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    firstname: '',
    phone: '',
    email: '',
    location: '',
    message: '',
    preferred_date: ''
  });

  // Get data from navigation state or sessionStorage (to preserve across login)
  const [initialData, setInitialData] = useState(() => {
    // 1. Try navigation state
    if (location.state?.type) {
      return {
        type: location.state.type,
        serviceType: location.state.serviceType || 'cirage_chaussures'
      };
    }
    // 2. Try sessionStorage
    const saved = sessionStorage.getItem('chaussures_pending_reservation_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        console.error('Error parsing saved state:', e);
      }
    }
    return null;
  });

  const reservationData = initialData?.type || null;
  const serviceType = initialData?.serviceType || 'cirage_chaussures';

  // Determine back navigation based on serviceType
  const getBackRoute = () => {
    if (serviceType === 'cirage_chaussures') {
      return '/cirage-chaussures';
    } else if (serviceType === 'nettoyage_chaussures') {
      return '/nettoyage-chaussures';
    }
    return '/chaussures'; // Default fallback
  };

  const getBackButtonText = () => {
    if (serviceType === 'cirage_chaussures') {
      return t('reservation_chaussures.back_to_cirage', 'Retour');
    } else if (serviceType === 'nettoyage_chaussures') {
      return t('reservation_chaussures.back_to_nettoyage', 'Retour');
    }
    return t('reservation_chaussures.back', 'Retour');
  };

  // Calculate final price for display
  const [displayFinalPrice, setDisplayFinalPrice] = useState(0);
  const [shoeCount, setShoeCount] = useState(0);

  useEffect(() => {
    // Try to get prefill data from localStorage
    try {
      const prefill = localStorage.getItem('booking_prefill');
      if (prefill) {
        const parsed = JSON.parse(prefill);
        setFormData(prev => ({
          ...prev,
          message: parsed.message || '',
          location: parsed.location || ''
        }));
      }
    } catch (err) {
      console.error('Error loading prefill:', err);
    }

    // Calculate and display final price
    if (reservationData) {
      const count = reservationData.shoeCount || 0;
      const basePrice = parseFloat(reservationData.price) || 0;
      const calculatedPrice = basePrice * count;

      setShoeCount(count);
      setDisplayFinalPrice(calculatedPrice);
    }
  }, [reservationData, serviceType]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[ReservationChassoures] No session found, redirecting to login...');
          // Save state to survive redirect
          if (location.state) {
            sessionStorage.setItem('chaussures_pending_reservation_state', JSON.stringify(location.state));
          }
          localStorage.setItem('auth_return_url', location.pathname + location.search);
          console.log('[ReservationChassoures] Saved auth_return_url:', location.pathname + location.search);
          navigate('/login-register');
          return;
        }

        // Session exists, check if we need to clean up sessionStorage
        sessionStorage.removeItem('chaussures_pending_reservation_state');

        // Prefill user data if available
        if (session.user) {
          setFormData(prev => ({
            ...prev,
            firstname: session.user.user_metadata?.first_name || session.user.user_metadata?.full_name || prev.firstname,
            email: session.user.email || prev.email,
            phone: session.user.user_metadata?.phone || prev.phone
          }));
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.firstname.trim()) {
      setError(t('reservation_chaussures.validation.firstname', 'Le prénom est requis'));
      setLoading(false);
      return;
    }
    if (!formData.phone.trim()) {
      setError(t('reservation_chaussures.validation.phone', 'Le numéro de téléphone est requis'));
      setLoading(false);
      return;
    }

    try {
      // Get user if authenticated
      const { data: { user } } = await supabase.auth.getUser();

      // Prepare reservation data
      const reservationPayload = {
        firstname: formData.firstname.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || null,
        location: formData.location?.trim() || null,
        service_type: serviceType, // 'cirage_chaussures' or 'nettoyage_chaussures'
        type_menage_id: reservationData?.id || null,
        menage_id: reservationData?.service_id || reservationData?.menage_id || null,
        item_name: reservationData?.name || null,
        item_description: reservationData?.description || null,
        item_price: reservationData?.price ? parseFloat(reservationData.price) : null,
        item_image: reservationData?.image || null,
        shoe_count: shoeCount || 1,
        final_price: displayFinalPrice || parseFloat(reservationData?.price) || 0,
        preferred_date: formData.preferred_date || null,
        message: formData.message?.trim() || null,
        status: 'pending',
        user_id: user?.id || null
      };

      // Insert reservation
      const { data, error: insertError } = await supabase
        .from('chaussures_reservations')
        .insert([reservationPayload])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Clear localStorage
      localStorage.removeItem('booking_prefill');

      setSuccess(true);
      setTimeout(() => {
        navigate('/chaussures');
      }, 3000);
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError(err.message || t('reservation_chaussures.error.submit', 'Erreur lors de la création de la réservation'));
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return <main className="reservation-chaussures-page"><div className="reservation-chaussures-loading">Vérification de l'authentification...</div></main>;
  }

  if (success) {
    return (
      <main className="reservation-chaussures-page">
        <div className="reservation-chaussures-success">
          <div className="success-icon">✓</div>
          <h2>{t('reservation_chaussures.success_title', 'Réservation créée avec succès!')}</h2>
          <p>{t('reservation_chaussures.success_message', 'Votre demande de réservation a été enregistrée. Nous vous contacterons bientôt.')}</p>
          <p className="redirect-message">{t('reservation_chaussures.redirect', 'Redirection en cours...')}</p>
        </div>
      </main>
    );
  }

  if (!reservationData) {
    return (
      <main className="reservation-chaussures-page">
        <div className="reservation-chaussures-header">
          <button
            onClick={() => navigate(getBackRoute())}
            className="reservation-chaussures-back-btn"
            title={getBackButtonText()}
          >
            ← {getBackButtonText()}
          </button>
        </div>
        <div className="reservation-chaussures-error">
          <p>{t('reservation_chaussures.error.no_data', 'Aucune donnée de service disponible. Veuillez sélectionner un service.')}</p>
        </div>
      </main>
    );
  }

  const { name, description } = reservationData;

  return (
    <main className="reservation-chaussures-page">
      <div className="reservation-chaussures-header">
        <button
          className="reservation-chaussures-back-btn"
          onClick={() => navigate(getBackRoute())}
          title={getBackButtonText()}
        >
          ← {getBackButtonText()}
        </button>
      </div>
      <div className="reservation-chaussures-container">
        <h1 className="reservation-chaussures-title">
          {t('reservation_chaussures.title', 'Réservation - Services Chaussures')}
        </h1>

        {error && (
          <div className="reservation-chaussures-error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="reservation-chaussures-form">
          <div className="form-group">
            <label htmlFor="firstname">
              {t('reservation_chaussures.firstname', 'Prénom')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_chaussures.firstname_placeholder', 'Votre prénom')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              {t('reservation_chaussures.phone', 'Téléphone')} <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_chaussures.phone_placeholder', 'Votre numéro de téléphone')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              {t('reservation_chaussures.email', 'Email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder={t('reservation_chaussures.email_placeholder', 'Votre email (optionnel)')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">
              {t('reservation_chaussures.location', 'Localisation')}
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location || ''}
              onChange={handleInputChange}
              placeholder={t('reservation_chaussures.location_placeholder', 'Votre localisation (optionnel)')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="preferred_date">
              {t('reservation_chaussures.preferred_date', 'Date préférée')}
            </label>
            <input
              type="date"
              id="preferred_date"
              name="preferred_date"
              value={formData.preferred_date}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">
              {t('reservation_chaussures.message', 'Message')}
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message || ''}
              onChange={handleInputChange}
              rows="4"
              placeholder={t('reservation_chaussures.message_placeholder', 'Message supplémentaire (optionnel)')}
            />
          </div>

          {reservationData && (
            <div className="reservation-summary">
              <h3>{t('reservation_chaussures.summary', 'Résumé de la réservation')}</h3>
              <div className="summary-item">
                <span className="summary-label">{t('reservation_chaussures.service', 'Service')}:</span>
                <span className="summary-value">{name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t('reservation_chaussures.service_type', 'Type')}:</span>
                <span className="summary-value">
                  {serviceType === 'cirage_chaussures'
                    ? t('reservation_chaussures.service_type_cirage', 'Cirage des Chaussures')
                    : t('reservation_chaussures.service_type_nettoyage', 'Nettoyage des Chaussures')
                  }
                </span>
              </div>
              {reservationData.price && (
                <div className="summary-item">
                  <span className="summary-label">{t('reservation_chaussures.price_per_pair', 'Prix par paire')}:</span>
                  <span className="summary-value">{parseFloat(reservationData.price).toFixed(2)} DH</span>
                </div>
              )}
              {shoeCount > 0 && (
                <div className="summary-item">
                  <span className="summary-label">{t('reservation_chaussures.shoe_count', 'Nombre de paires')}:</span>
                  <span className="summary-value">{shoeCount}</span>
                </div>
              )}
              {displayFinalPrice > 0 && (
                <div className="summary-item summary-total">
                  <span className="summary-label">{t('reservation_chaussures.total_price', 'Prix total')}:</span>
                  <span className="summary-value summary-total-value">{displayFinalPrice.toFixed(2)} DH</span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="reservation-chaussures-submit-btn"
            disabled={loading}
          >
            {loading
              ? t('reservation_chaussures.submitting', 'Envoi...')
              : t('reservation_chaussures.submit', 'Confirmer la réservation')
            }
          </button>
        </form>
      </div>
    </main>
  );
}


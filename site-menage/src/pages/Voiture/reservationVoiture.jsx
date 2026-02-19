import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './reservationVoiture.css';

export default function ReservationVoiture() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    firstname: '',
    phone: '',
    email: '',
    address: '', // Adresse (required)
    message: '',
    preferred_date: '',
    preferred_time: '' // Optional time preference
  });

  // Get data from navigation state or sessionStorage (to preserve across login)
  const [initialData, setInitialData] = useState(() => {
    // 1. Try navigation state
    if (location.state?.selectedService || location.state?.type) {
      return {
        selectedService: location.state.selectedService,
        type: location.state.type,
        serviceType: location.state.serviceType || 'centre'
      };
    }
    // 2. Try sessionStorage
    const saved = sessionStorage.getItem('voiture_pending_reservation_state');
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

  const reservationData = initialData?.selectedService || initialData?.type || null;
  const serviceType = initialData?.serviceType || 'centre';

  // Determine back navigation based on serviceType
  const getBackRoute = () => {
    if (serviceType === 'centre') {
      return '/lavage-en-centre';
    } else if (serviceType === 'domicile') {
      return '/lavage-a-domicile';
    }
    return '/lavage-de-voiture'; // Default fallback
  };

  const getBackButtonText = () => {
    if (serviceType === 'centre') {
      return t('reservation_voiture.back_to_centre', 'Retour');
    } else if (serviceType === 'domicile') {
      return t('reservation_voiture.back_to_domicile', 'Retour');
    }
    return t('reservation_voiture.back', 'Retour');
  };

  // Calculate final price for display
  const [displayFinalPrice, setDisplayFinalPrice] = useState(0);

  useEffect(() => {
    // Try to get prefill data from localStorage
    try {
      const prefill = localStorage.getItem('booking_prefill');
      if (prefill) {
        const parsed = JSON.parse(prefill);
        setFormData(prev => ({
          ...prev,
          message: parsed.message || '',
          address: parsed.address || ''
        }));
      }
    } catch (err) {
      console.error('Error loading prefill:', err);
    }

    // Calculate and display final price
    if (reservationData) {
      const calculatedPrice = parseFloat(reservationData.price) || 0;
      setDisplayFinalPrice(calculatedPrice);
    }
  }, [reservationData, serviceType]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[ReservationVoiture] No session found, redirecting to login...');
          // Save state to survive redirect
          if (location.state) {
            sessionStorage.setItem('voiture_pending_reservation_state', JSON.stringify(location.state));
          }
          localStorage.setItem('auth_return_url', location.pathname + location.search);
          console.log('[ReservationVoiture] Saved auth_return_url:', location.pathname + location.search);
          navigate('/login-register');
          return;
        }

        // Session exists, check if we need to clean up sessionStorage
        sessionStorage.removeItem('voiture_pending_reservation_state');

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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError(t('reservation_voiture.location_error.not_supported', 'La géolocalisation n\'est pas supportée par votre navigateur'));
      return;
    }

    setGettingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Use OpenStreetMap Nominatim API to reverse geocode
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'HousekeepingApp/1.0'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Failed to get address');
          }

          const data = await response.json();

          if (data && data.display_name) {
            setFormData(prev => ({
              ...prev,
              address: data.display_name
            }));
          } else {
            throw new Error('No address found');
          }
        } catch (err) {
          console.error('Error getting address:', err);
          setError(t('reservation_voiture.location_error.fetch_failed', 'Impossible de récupérer l\'adresse. Veuillez la saisir manuellement.'));
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = t('reservation_voiture.location_error.general', 'Impossible d\'obtenir votre localisation');

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('reservation_voiture.location_error.permission_denied', 'Permission de localisation refusée. Veuillez autoriser l\'accès à votre localisation.');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('reservation_voiture.location_error.position_unavailable', 'Informations de localisation indisponibles.');
            break;
          case error.TIMEOUT:
            errorMessage = t('reservation_voiture.location_error.timeout', 'La demande de localisation a expiré.');
            break;
        }

        setError(errorMessage);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.firstname.trim()) {
      setError(t('reservation_voiture.validation.firstname', 'Le prénom est requis'));
      setLoading(false);
      return;
    }
    if (!formData.phone.trim()) {
      setError(t('reservation_voiture.validation.phone', 'Le numéro de téléphone est requis'));
      setLoading(false);
      return;
    }
    if (!formData.address.trim()) {
      setError(t('reservation_voiture.validation.address', 'L\'adresse est requise'));
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
        address: formData.address.trim(), // Required address field
        service_type: serviceType, // 'centre' or 'domicile'
        type_menage_id: reservationData?.id || null,
        menage_id: reservationData?.service_id || reservationData?.menage_id || null,
        item_name: reservationData?.name || null,
        item_description: reservationData?.description || null,
        item_price: reservationData?.price ? parseFloat(reservationData.price) : null,
        item_image: reservationData?.image || null,
        preferred_date: formData.preferred_date || null,
        preferred_time: formData.preferred_time || null,
        message: formData.message?.trim() || null,
        status: 'pending',
        user_id: user?.id || null
      };

      // Insert reservation
      const { data, error: insertError } = await supabase
        .from('voiture_reservations')
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
        navigate('/lavage-de-voiture');
      }, 3000);
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError(err.message || t('reservation_voiture.error.submit', 'Erreur lors de la création de la réservation'));
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return <main className="reservation-voiture-page"><div className="reservation-voiture-loading">Vérification de l'authentification...</div></main>;
  }

  if (success) {
    return (
      <main className="reservation-voiture-page">
        <div className="reservation-voiture-success">
          <div className="success-icon">✓</div>
          <h2>{t('reservation_voiture.success_title', 'Réservation créée avec succès!')}</h2>
          <p>{t('reservation_voiture.success_message', 'Votre demande de réservation a été enregistrée. Nous vous contacterons bientôt.')}</p>
          <p className="redirect-message">{t('reservation_voiture.redirect', 'Redirection en cours...')}</p>
        </div>
      </main>
    );
  }

  if (!reservationData) {
    return (
      <main className="reservation-voiture-page">
        <div className="reservation-voiture-header">
          <button
            onClick={() => navigate(getBackRoute())}
            className="reservation-voiture-back-btn"
            title={getBackButtonText()}
          >
            ← {getBackButtonText()}
          </button>
        </div>
        <div className="reservation-voiture-error">
          <p>{t('reservation_voiture.error.no_data', 'Aucune donnée de service disponible. Veuillez sélectionner un service.')}</p>
        </div>
      </main>
    );
  }

  const { name, description } = reservationData;

  return (
    <main className="reservation-voiture-page">
      <div className="reservation-voiture-header">
        <button
          className="reservation-voiture-back-btn"
          onClick={() => navigate(getBackRoute())}
          title={getBackButtonText()}
        >
          ← {getBackButtonText()}
        </button>
      </div>
      <div className="reservation-voiture-container">
        <h1 className="reservation-voiture-title">
          {t('reservation_voiture.title', 'Réservation - Lavage de Voiture')}
        </h1>

        {error && (
          <div className="reservation-voiture-error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="reservation-voiture-form">
          <div className="form-group">
            <label htmlFor="firstname">
              {t('reservation_voiture.firstname', 'Prénom')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_voiture.firstname_placeholder', 'Votre prénom')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              {t('reservation_voiture.phone', 'Téléphone')} <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_voiture.phone_placeholder', 'Votre numéro de téléphone')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              {t('reservation_voiture.email', 'Email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder={t('reservation_voiture.email_placeholder', 'Votre email (optionnel)')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">
              {t('reservation_voiture.address', 'Adresse')} <span className="required">*</span>
            </label>
            <div className="address-input-container">
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder={t('reservation_voiture.address_placeholder', 'Votre adresse complète')}
                className="address-input"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className="location-btn"
                title={t('reservation_voiture.get_location', 'Obtenir ma localisation')}
              >
                {gettingLocation ? (
                  <span className="location-btn-loading">⟳</span>
                ) : (
                  <span className="location-btn-icon">📍</span>
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="preferred_date">
              {t('reservation_voiture.preferred_date', 'Date préférée')}
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
            <label htmlFor="preferred_time">
              {t('reservation_voiture.preferred_time', 'Heure préférée')}
            </label>
            <input
              type="time"
              id="preferred_time"
              name="preferred_time"
              value={formData.preferred_time || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">
              {t('reservation_voiture.message', 'Message')}
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message || ''}
              onChange={handleInputChange}
              rows="4"
              placeholder={t('reservation_voiture.message_placeholder', 'Message supplémentaire (optionnel)')}
            />
          </div>

          {reservationData && (
            <div className="reservation-summary">
              <h3>{t('reservation_voiture.summary', 'Résumé de la réservation')}</h3>
              <div className="summary-item">
                <span className="summary-label">{t('reservation_voiture.service', 'Service')}:</span>
                <span className="summary-value">{name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t('reservation_voiture.service_type', 'Type')}:</span>
                <span className="summary-value">
                  {serviceType === 'centre'
                    ? t('reservation_voiture.service_type_centre', 'Lavage en Centre')
                    : t('reservation_voiture.service_type_domicile', 'Lavage à Domicile')
                  }
                </span>
              </div>
              {reservationData.price && (
                <div className="summary-item">
                  <span className="summary-label">{t('reservation_voiture.price', 'Prix')}:</span>
                  <span className="summary-value">{parseFloat(reservationData.price).toFixed(2)} DH</span>
                </div>
              )}
              {displayFinalPrice > 0 && (
                <div className="summary-item summary-total">
                  <span className="summary-label">{t('reservation_voiture.total_price', 'Prix total')}:</span>
                  <span className="summary-value summary-total-value">{displayFinalPrice.toFixed(2)} DH</span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="reservation-voiture-submit-btn"
            disabled={loading}
          >
            {loading
              ? t('reservation_voiture.submitting', 'Envoi...')
              : t('reservation_voiture.submit', 'Confirmer la réservation')
            }
          </button>
        </form>
      </div>
    </main>
  );
}


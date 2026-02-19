import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './reservationTapisCanapes.css';

export default function ReservationTapisCanapes() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const locationRef = useRef(null);

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
        serviceType: location.state.serviceType || 'tapis'
      };
    }
    // 2. Try sessionStorage
    const saved = sessionStorage.getItem('tapis_canapes_pending_reservation_state');
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
  const serviceType = initialData?.serviceType || 'tapis';

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
          message: parsed.message || ''
        }));
      }
    } catch (err) {
      console.error('Error loading prefill:', err);
    }

    // Calculate and display final price
    if (reservationData) {
      let calculatedPrice = 0;
      let totalArea = 0;

      // Use finalPrice from state if available
      if (reservationData.finalPrice) {
        calculatedPrice = parseFloat(reservationData.finalPrice) || 0;
      } else {
        // Calculate based on service type
        if (serviceType === 'tapis' && reservationData.carpetCount) {
          const dimensions = reservationData.carpetDimensions || [];
          dimensions.forEach(dim => {
            const length = parseFloat(dim.length) || 0;
            const width = parseFloat(dim.width) || 0;
            totalArea += (length * width) / 10000;
          });
          const basePrice = parseFloat(reservationData.price) || 0;
          calculatedPrice = basePrice * totalArea;
        } else if (serviceType === 'canapes' && reservationData.canapeCount) {
          const dimensions = reservationData.carpetDimensions || [];
          dimensions.forEach(dim => {
            const length = parseFloat(dim.length) || 0;
            const width = parseFloat(dim.width) || 0;
            totalArea += (length * width) / 10000;
          });
          // Apply minimum price logic for canapes
          if (totalArea <= 8) {
            calculatedPrice = 800;
          } else {
            calculatedPrice = totalArea * 100;
          }
        } else if (serviceType === 'tapis_et_canapes') {
          calculatedPrice = parseFloat(reservationData.price) || 0;
        }
      }

      setDisplayFinalPrice(calculatedPrice);
    }
  }, [reservationData, serviceType]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[ReservationTapisCanapes] No session found, redirecting to login...');
          // Save state to survive redirect
          if (location.state) {
            sessionStorage.setItem('tapis_canapes_pending_reservation_state', JSON.stringify(location.state));
          }
          localStorage.setItem('auth_return_url', location.pathname + location.search);
          console.log('[ReservationTapisCanapes] Saved auth_return_url:', location.pathname + location.search);
          navigate('/login-register', {
            state: {
              returnUrl: location.pathname + location.search
            }
          });
          return;
        }

        // Session exists, check if we need to clean up sessionStorage
        sessionStorage.removeItem('tapis_canapes_pending_reservation_state');

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

  const handleAutoLocate = async () => {
    setLocError('');
    if (!navigator.geolocation) {
      setLocError(t('reservation_tapis_canapes.geolocation_not_supported', 'La géolocalisation n\'est pas supportée par votre navigateur.'));
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
          headers: { 'Accept': 'application/json' }
        });
        const data = await resp.json();
        const a = data.address || {};
        const city = a.city || a.town || a.village || '';
        const road = a.road || '';
        const pc = a.postcode || '';
        const country = a.country || '';
        const value = [road, city, pc, country].filter(Boolean).join(', ');
        const finalValue = value || city || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        setFormData(prev => ({
          ...prev,
          location: finalValue
        }));

        if (locationRef.current) {
          locationRef.current.value = finalValue;
        }
      } catch (err) {
        setLocError(t('reservation_tapis_canapes.location_error', 'Impossible de récupérer la localisation.'));
      } finally {
        setLocLoading(false);
      }
    }, (err) => {
      setLocError(t('reservation_tapis_canapes.permission_error', 'Permission refusée ou indisponible.'));
      setLocLoading(false);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Get user if authenticated
      const { data: { user } } = await supabase.auth.getUser();

      // Calculate total area and final price
      let totalArea = 0;
      let finalPrice = 0;
      let dimensions = [];
      let itemCount = 0;

      if (reservationData) {
        // Use finalPrice from state if available (already calculated)
        if (reservationData.finalPrice) {
          finalPrice = parseFloat(reservationData.finalPrice) || 0;
        }

        // Use totalArea from state if available
        if (reservationData.totalArea) {
          totalArea = parseFloat(reservationData.totalArea) || 0;
        }

        if (serviceType === 'tapis' && reservationData.carpetCount) {
          itemCount = reservationData.carpetCount;
          dimensions = reservationData.carpetDimensions || [];
          if (!totalArea && dimensions.length > 0) {
            dimensions.forEach(dim => {
              const length = parseFloat(dim.length) || 0;
              const width = parseFloat(dim.width) || 0;
              totalArea += (length * width) / 10000; // Convert cm² to m²
            });
          }
          if (!finalPrice) {
            const basePrice = parseFloat(reservationData.price) || 0;
            finalPrice = basePrice * totalArea;
          }
        } else if (serviceType === 'canapes' && reservationData.canapeCount) {
          itemCount = reservationData.canapeCount;
          dimensions = reservationData.carpetDimensions || [];
          if (!totalArea && dimensions.length > 0) {
            dimensions.forEach(dim => {
              const length = parseFloat(dim.length) || 0;
              const width = parseFloat(dim.width) || 0;
              totalArea += (length * width) / 10000; // Convert cm² to m²
            });
          }
          if (!finalPrice) {
            // Apply minimum price logic for canapes
            if (totalArea <= 8) {
              finalPrice = 800;
            } else {
              finalPrice = totalArea * 100;
            }
          }
        } else if (serviceType === 'tapis_et_canapes') {
          // For combined service, use the price from reservationData
          if (!finalPrice) {
            finalPrice = parseFloat(reservationData.price) || 0;
          }
        }
      }

      // Prepare reservation data
      const reservationPayload = {
        firstname: formData.firstname,
        phone: formData.phone,
        email: formData.email || null,
        location: formData.location || null,
        service_type: serviceType,
        type_menage_id: reservationData?.id || null,
        menage_id: reservationData?.service_id || null,
        item_name: reservationData?.name || null,
        item_description: reservationData?.description || null,
        item_price: reservationData?.price ? parseFloat(reservationData.price) : null,
        item_count: itemCount,
        dimensions: dimensions.length > 0 ? dimensions : null,
        total_area_m2: totalArea > 0 ? totalArea : null,
        base_price_per_m2: reservationData?.price ? parseFloat(reservationData.price) : null,
        final_price: finalPrice || parseFloat(reservationData?.price) || 0,
        message: formData.message || null,
        preferred_date: formData.preferred_date || null,
        status: 'pending',
        user_id: user?.id || null
      };

      // Insert reservation
      const { data, error: insertError } = await supabase
        .from('tapis_canapes_reservations')
        .insert([reservationPayload])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Clear localStorage
      localStorage.removeItem('booking_prefill');

      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(serviceType === 'tapis' ? '/tapis' : serviceType === 'canapes' ? '/canapes' : '/tapis-canapes');
      }, 2000);

    } catch (err) {
      console.error('Error creating reservation:', err);
      setError(err?.message || 'Erreur lors de la création de la réservation');
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return <main className="reservation-tapis-canapes-page"><div className="reservation-tapis-canapes-loading">Vérification de l'authentification...</div></main>;
  }

  return (
    <main className="reservation-tapis-canapes-page">
      <div className="reservation-tapis-canapes-header">
        <button
          className="reservation-tapis-canapes-back-btn"
          onClick={() => navigate(-1)}
          title={t('reservation_tapis_canapes.back', 'Retour')}
        >
          ← {t('reservation_tapis_canapes.back', 'Retour')}
        </button>
        <h1 className="reservation-tapis-canapes-title">
          {t('reservation_tapis_canapes.title', 'Formulaire de Réservation')}
        </h1>
      </div>

      {success ? (
        <div className="reservation-tapis-canapes-success">
          <div className="success-icon">✅</div>
          <h2>{t('reservation_tapis_canapes.success_title', 'Réservation créée avec succès!')}</h2>
          <p>{t('reservation_tapis_canapes.success_message', 'Votre demande de réservation a été enregistrée. Nous vous contacterons bientôt.')}</p>
        </div>
      ) : (
        <form className="reservation-tapis-canapes-form" onSubmit={handleSubmit}>
          {error && (
            <div className="reservation-tapis-canapes-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="firstname">
              {t('reservation_tapis_canapes.firstname', 'Prénom')} *
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_tapis_canapes.firstname_placeholder', 'Votre prénom')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              {t('reservation_tapis_canapes.phone', 'Téléphone')} *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_tapis_canapes.phone_placeholder', 'Votre numéro de téléphone')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              {t('reservation_tapis_canapes.email', 'Email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('reservation_tapis_canapes.email_placeholder', 'Votre email (optionnel)')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">
              {t('reservation_tapis_canapes.location', 'Adresse')}
            </label>
            <div className="location-group">
              <input
                ref={locationRef}
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder={t('reservation_tapis_canapes.location_placeholder', 'Votre adresse (optionnel)')}
              />
              <button
                type="button"
                className="location-button"
                onClick={handleAutoLocate}
                disabled={locLoading}
              >
                {locLoading ? t('reservation_tapis_canapes.locating', 'Localisation...') : t('reservation_tapis_canapes.use_location', '📍 Localisation')}
              </button>
            </div>
            {locError && <small className="form-error" style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px', display: 'block' }}>{locError}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="preferred_date">
              {t('reservation_tapis_canapes.preferred_date', 'Date préférée')}
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
              {t('reservation_tapis_canapes.message', 'Message')}
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows="4"
              placeholder={t('reservation_tapis_canapes.message_placeholder', 'Message supplémentaire (optionnel)')}
            />
          </div>

          {reservationData && (
            <div className="reservation-summary">
              <h3>{t('reservation_tapis_canapes.summary', 'Résumé de la réservation')}</h3>
              <div className="summary-item">
                <span className="summary-label">{t('reservation_tapis_canapes.service', 'Service')}:</span>
                <span className="summary-value">{reservationData.name}</span>
              </div>
              {reservationData.price && (
                <div className="summary-item">
                  <span className="summary-label">{t('reservation_tapis_canapes.price_per_m2', 'Prix/m²')}:</span>
                  <span className="summary-value">{parseFloat(reservationData.price).toFixed(2)} DH/m²</span>
                </div>
              )}
              {displayFinalPrice > 0 && (
                <div className="summary-item summary-total">
                  <span className="summary-label">{t('reservation_tapis_canapes.total_price', 'Prix total')}:</span>
                  <span className="summary-value summary-total-value">{displayFinalPrice.toFixed(2)} DH</span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="reservation-tapis-canapes-submit-btn"
            disabled={loading}
          >
            {loading ? t('reservation_tapis_canapes.submitting', 'Envoi...') : t('reservation_tapis_canapes.submit', 'Confirmer la réservation')}
          </button>
        </form>
      )}
    </main>
  );
}


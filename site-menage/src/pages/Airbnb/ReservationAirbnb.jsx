import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './ReservationAirbnb.css';

export default function ReservationAirbnb() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Get data from navigation state or localStorage
  const [formData, setFormData] = useState({
    firstname: '',
    phone: '',
    email: '',
    location: '',
    message: '',
    preferred_date: ''
  });

  const reservationData = location.state?.type || null;
  const serviceType = location.state?.serviceType || 'nettoyage_rapide'; // 'nettoyage_rapide' or 'nettoyage_complet'
  
  // Determine back navigation based on serviceType
  const getBackRoute = () => {
    if (serviceType === 'nettoyage_complet') {
      return '/nettoyage-complet';
    } else if (serviceType === 'nettoyage_rapide') {
      return '/nettoyage-rapide';
    }
    return '/airbnb'; // Default fallback
  };

  const getBackButtonText = () => {
    if (serviceType === 'nettoyage_complet') {
      return t('reservation_airbnb.back_to_complet', 'Retour à Nettoyage Complet');
    } else if (serviceType === 'nettoyage_rapide') {
      return t('reservation_airbnb.back_to_rapide', 'Retour à Nettoyage Rapide');
    }
    return t('reservation_airbnb.back', 'Retour');
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
          location: parsed.location || ''
        }));
      }
    } catch (err) {
      console.error('Error loading prefill:', err);
    }
    
    // Get final price from reservation data
    if (reservationData) {
      const finalPrice = parseFloat(reservationData.finalPrice) || parseFloat(reservationData.price) || 0;
      setDisplayFinalPrice(finalPrice);
    }
  }, [reservationData, serviceType]);

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
      setError(t('reservation_airbnb.validation.firstname', 'Le prénom est requis'));
      setLoading(false);
      return;
    }
    if (!formData.phone.trim()) {
      setError(t('reservation_airbnb.validation.phone', 'Le numéro de téléphone est requis'));
      setLoading(false);
      return;
    }
    if (!formData.location.trim()) {
      setError(t('reservation_airbnb.validation.location', 'La localisation est requise'));
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
        location: formData.location.trim(),
        service_type: serviceType, // 'nettoyage_rapide' or 'nettoyage_complet'
        type_menage_id: reservationData?.id || null,
        menage_id: reservationData?.service_id || reservationData?.menage_id || null,
        item_name: reservationData?.name || null,
        item_description: reservationData?.description || null,
        item_price: reservationData?.price ? parseFloat(reservationData.price) : null,
        item_image: reservationData?.image || null,
        length_cm: null, // No longer required
        width_cm: null, // No longer required
        total_area_m2: null, // No longer required
        final_price: displayFinalPrice || parseFloat(reservationData?.price) || 0,
        preferred_date: formData.preferred_date || null,
        message: formData.message?.trim() || null,
        status: 'pending',
        user_id: user?.id || null
      };

      // Insert reservation
      const { data, error: insertError } = await supabase
        .from('airbnb_reservations')
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
        navigate('/airbnb');
      }, 3000);
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError(err.message || t('reservation_airbnb.error.submit', 'Erreur lors de la création de la réservation'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="reservation-airbnb-page">
        <div className="reservation-airbnb-success">
          <div className="success-icon">✓</div>
          <h2>{t('reservation_airbnb.success_title', 'Réservation créée avec succès!')}</h2>
          <p>{t('reservation_airbnb.success_message', 'Votre demande de réservation a été enregistrée. Nous vous contacterons bientôt.')}</p>
          <p className="redirect-message">{t('reservation_airbnb.redirect', 'Redirection en cours...')}</p>
        </div>
      </main>
    );
  }

  if (!reservationData) {
    return (
      <main className="reservation-airbnb-page">
        <div className="reservation-airbnb-header">
          <button 
            onClick={() => navigate(getBackRoute())}
            className="reservation-airbnb-back-btn"
            title={getBackButtonText()}
          >
            ← {getBackButtonText()}
          </button>
        </div>
        <div className="reservation-airbnb-error">
          <p>{t('reservation_airbnb.error.no_data', 'Aucune donnée de service disponible. Veuillez sélectionner un service.')}</p>
        </div>
      </main>
    );
  }

  const { name, description } = reservationData;

  return (
    <main className="reservation-airbnb-page">
      <div className="reservation-airbnb-header">
        <button 
          className="reservation-airbnb-back-btn"
          onClick={() => navigate(getBackRoute())}
          title={getBackButtonText()}
        >
          ← {getBackButtonText()}
        </button>
      </div>
      <div className="reservation-airbnb-container">
        <h1 className="reservation-airbnb-title">
          {t('reservation_airbnb.title', 'Réservation - Airbnb')}
        </h1>

        {error && (
          <div className="reservation-airbnb-error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="reservation-airbnb-form">
          <div className="form-group">
            <label htmlFor="firstname">
              {t('reservation_airbnb.firstname', 'Prénom')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_airbnb.firstname_placeholder', 'Votre prénom')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              {t('reservation_airbnb.phone', 'Téléphone')} <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_airbnb.phone_placeholder', 'Votre numéro de téléphone')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              {t('reservation_airbnb.email', 'Email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder={t('reservation_airbnb.email_placeholder', 'Votre email (optionnel)')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">
              {t('reservation_airbnb.location', 'Localisation')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location || ''}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_airbnb.location_placeholder', 'Votre localisation')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="preferred_date">
              {t('reservation_airbnb.preferred_date', 'Date préférée')}
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
              {t('reservation_airbnb.message', 'Message')}
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message || ''}
              onChange={handleInputChange}
              rows="4"
              placeholder={t('reservation_airbnb.message_placeholder', 'Message supplémentaire (optionnel)')}
            />
          </div>

          {reservationData && (
            <div className="reservation-summary">
              <h3>{t('reservation_airbnb.summary', 'Résumé de la réservation')}</h3>
              <div className="summary-item">
                <span className="summary-label">{t('reservation_airbnb.service', 'Service')}:</span>
                <span className="summary-value">{name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t('reservation_airbnb.service_type', 'Type')}:</span>
                <span className="summary-value">
                  {serviceType === 'nettoyage_rapide' 
                    ? t('reservation_airbnb.service_type_rapide', 'Nettoyage Rapide')
                    : t('reservation_airbnb.service_type_complet', 'Nettoyage Complet')
                  }
                </span>
              </div>
              {reservationData.price && (
                <div className="summary-item">
                  <span className="summary-label">{t('reservation_airbnb.price', 'Prix')}:</span>
                  <span className="summary-value">{parseFloat(reservationData.price).toFixed(2)} DH</span>
                </div>
              )}
              {displayFinalPrice > 0 && (
                <div className="summary-item summary-total">
                  <span className="summary-label">{t('reservation_airbnb.total_price', 'Prix total')}:</span>
                  <span className="summary-value summary-total-value">{displayFinalPrice.toFixed(2)} DH</span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="reservation-airbnb-submit-btn"
            disabled={loading}
          >
            {loading 
              ? t('reservation_airbnb.submitting', 'Envoi...') 
              : t('reservation_airbnb.submit', 'Confirmer la réservation')
            }
          </button>
        </form>
      </div>
    </main>
  );
}


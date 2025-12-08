import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './ReservationBureuxUsin.css';

export default function ReservationBureuxUsin() {
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
  const serviceType = location.state?.serviceType || 'bureaux'; // 'bureaux' or 'usine'
  
  // Determine back navigation based on serviceType
  const getBackRoute = () => {
    if (serviceType === 'bureaux') {
      return '/bureaux';
    } else if (serviceType === 'usine') {
      return '/usine';
    }
    return '/bureaux-et-usine'; // Default fallback
  };

  const getBackButtonText = () => {
    if (serviceType === 'bureaux') {
      return t('reservation_bureaux_usin.back_to_bureaux', 'Retour');
    } else if (serviceType === 'usine') {
      return t('reservation_bureaux_usin.back_to_usine', 'Retour');
    }
    return t('reservation_bureaux_usin.back', 'Retour');
  };
  
  // Calculate final price for display
  const [displayFinalPrice, setDisplayFinalPrice] = useState(0);
  const [totalArea, setTotalArea] = useState(0);
  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);

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
      const len = parseFloat(reservationData.length) || 0;
      const wid = parseFloat(reservationData.width) || 0;
      const area = parseFloat(reservationData.totalMetre) || 0;
      const basePrice = parseFloat(reservationData.price) || 0;
      const calculatedPrice = reservationData.finalPrice ? parseFloat(reservationData.finalPrice) : (basePrice * area);
      
      setLength(len);
      setWidth(wid);
      setTotalArea(area);
      setDisplayFinalPrice(calculatedPrice);
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
      setError(t('reservation_bureaux_usin.validation.firstname', 'Le prénom est requis'));
      setLoading(false);
      return;
    }
    if (!formData.phone.trim()) {
      setError(t('reservation_bureaux_usin.validation.phone', 'Le numéro de téléphone est requis'));
      setLoading(false);
      return;
    }
    if (!formData.location.trim()) {
      setError(t('reservation_bureaux_usin.validation.location', 'La localisation est requise'));
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
        service_type: serviceType, // 'bureaux' or 'usine'
        type_menage_id: reservationData?.id || null,
        menage_id: reservationData?.service_id || reservationData?.menage_id || null,
        item_name: reservationData?.name || null,
        item_description: reservationData?.description || null,
        item_price: reservationData?.price ? parseFloat(reservationData.price) : null,
        item_image: reservationData?.image || null,
        length_cm: length || null,
        width_cm: width || null,
        total_area_m2: totalArea || 0,
        final_price: displayFinalPrice || parseFloat(reservationData?.price) || 0,
        preferred_date: formData.preferred_date || null,
        message: formData.message?.trim() || null,
        status: 'pending',
        user_id: user?.id || null
      };

      // Insert reservation
      const { data, error: insertError } = await supabase
        .from('bureaux_usin_reservations')
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
        navigate(serviceType === 'bureaux' ? '/bureaux' : '/usine');
      }, 3000);
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError(err.message || t('reservation_bureaux_usin.error.submit', 'Erreur lors de la création de la réservation'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="reservation-bureaux-usin-page">
        <div className="reservation-bureaux-usin-success">
          <div className="success-icon">✓</div>
          <h2>{t('reservation_bureaux_usin.success_title', 'Réservation créée avec succès!')}</h2>
          <p>{t('reservation_bureaux_usin.success_message', 'Votre demande de réservation a été enregistrée. Nous vous contacterons bientôt.')}</p>
          <p className="redirect-message">{t('reservation_bureaux_usin.redirect', 'Redirection en cours...')}</p>
        </div>
      </main>
    );
  }

  if (!reservationData) {
    return (
      <main className="reservation-bureaux-usin-page">
        <div className="reservation-bureaux-usin-header">
          <button 
            onClick={() => navigate(getBackRoute())}
            className="reservation-bureaux-usin-back-btn"
            title={getBackButtonText()}
          >
            ← {getBackButtonText()}
          </button>
        </div>
        <div className="reservation-bureaux-usin-error">
          <p>{t('reservation_bureaux_usin.error.no_data', 'Aucune donnée de service disponible. Veuillez sélectionner un service.')}</p>
        </div>
      </main>
    );
  }

  const { name, description } = reservationData;

  return (
    <main className="reservation-bureaux-usin-page">
      <div className="reservation-bureaux-usin-header">
        <button 
          className="reservation-bureaux-usin-back-btn"
          onClick={() => navigate(getBackRoute())}
          title={getBackButtonText()}
        >
          ← {getBackButtonText()}
        </button>
      </div>
      <div className="reservation-bureaux-usin-container">
        <h1 className="reservation-bureaux-usin-title">
          {t('reservation_bureaux_usin.title', 'Réservation - Bureaux et Usine')}
        </h1>

        {error && (
          <div className="reservation-bureaux-usin-error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="reservation-bureaux-usin-form">
          <div className="form-group">
            <label htmlFor="firstname">
              {t('reservation_bureaux_usin.firstname', 'Prénom')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_bureaux_usin.firstname_placeholder', 'Votre prénom')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              {t('reservation_bureaux_usin.phone', 'Téléphone')} <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_bureaux_usin.phone_placeholder', 'Votre numéro de téléphone')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              {t('reservation_bureaux_usin.email', 'Email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder={t('reservation_bureaux_usin.email_placeholder', 'Votre email (optionnel)')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">
              {t('reservation_bureaux_usin.location', 'Localisation')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location || ''}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_bureaux_usin.location_placeholder', 'Votre localisation')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="preferred_date">
              {t('reservation_bureaux_usin.preferred_date', 'Date préférée')}
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
              {t('reservation_bureaux_usin.message', 'Message')}
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message || ''}
              onChange={handleInputChange}
              rows="4"
              placeholder={t('reservation_bureaux_usin.message_placeholder', 'Message supplémentaire (optionnel)')}
            />
          </div>

          {reservationData && (
            <div className="reservation-summary">
              <h3>{t('reservation_bureaux_usin.summary', 'Résumé de la réservation')}</h3>
              <div className="summary-item">
                <span className="summary-label">{t('reservation_bureaux_usin.service', 'Service')}:</span>
                <span className="summary-value">{name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t('reservation_bureaux_usin.service_type', 'Type')}:</span>
                <span className="summary-value">
                  {serviceType === 'bureaux' 
                    ? t('reservation_bureaux_usin.service_type_bureaux', 'Bureaux')
                    : t('reservation_bureaux_usin.service_type_usine', 'Usine')
                  }
                </span>
              </div>
              {reservationData.price && (
                <div className="summary-item">
                  <span className="summary-label">{t('reservation_bureaux_usin.price_per_m2', 'Prix par m²')}:</span>
                  <span className="summary-value">{parseFloat(reservationData.price).toFixed(2)} DH</span>
                </div>
              )}
              {length > 0 && width > 0 && (
                <>
                  <div className="summary-item">
                    <span className="summary-label">{t('reservation_bureaux_usin.length', 'Longueur')}:</span>
                    <span className="summary-value">{length} cm</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">{t('reservation_bureaux_usin.width', 'Largeur')}:</span>
                    <span className="summary-value">{width} cm</span>
                  </div>
                </>
              )}
              {totalArea > 0 && (
                <div className="summary-item">
                  <span className="summary-label">{t('reservation_bureaux_usin.total_area', 'Surface totale')}:</span>
                  <span className="summary-value">{totalArea.toFixed(2)} m²</span>
                </div>
              )}
              {displayFinalPrice > 0 && (
                <div className="summary-item summary-total">
                  <span className="summary-label">{t('reservation_bureaux_usin.total_price', 'Prix total')}:</span>
                  <span className="summary-value summary-total-value">{displayFinalPrice.toFixed(2)} DH</span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="reservation-bureaux-usin-submit-btn"
            disabled={loading}
          >
            {loading 
              ? t('reservation_bureaux_usin.submitting', 'Envoi...') 
              : t('reservation_bureaux_usin.submit', 'Confirmer la réservation')
            }
          </button>
        </form>
      </div>
    </main>
  );
}


import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './reservationLavageRopassage.css';

export default function ReservationLavageRopassage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const locationRef = useRef(null);
  
  // Get data from navigation state
  const [formData, setFormData] = useState({
    firstname: '',
    phone: '',
    email: '',
    location: '',
    message: '',
    preferred_date: ''
  });

  const reservationData = location.state?.type || null;
  const serviceType = location.state?.serviceType || 'lavage'; // 'lavage' or 'ropassage'
  const selectedOptions = location.state?.selectedOptions || [];
  const vetementsDetails = location.state?.vetementsDetails || {};
  const grandsTextilesDetails = location.state?.grandsTextilesDetails || {};
  const finalPriceFromState = location.state?.finalPrice || 0;
  
  // Prices for Vêtements sub-options (same as in Lavage.jsx and Ropassage.jsx)
  const vetementsPrices = {
    option1: 5, // T-shirt, Sweatshirts, Short, Jeans
    option2: 10, // Jaket
    option3: 15 // Manteaux
  };

  // Calculate price for a single Grands textiles piece
  const calculateGrandsTextilesPiecePrice = (length, width) => {
    const len = parseFloat(length) || 0;
    const wid = parseFloat(width) || 0;
    
    if (len === 0 || wid === 0) return 0;
    
    // Price = (Longueur × Largeur) / 10,000 × 10 DH
    const areaM2 = (len * wid) / 10000;
    return areaM2 * 10;
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
    
    // Calculate final price
    let calculatedPrice = 0;
    
    // Use finalPrice from state if available
    if (finalPriceFromState > 0) {
      calculatedPrice = parseFloat(finalPriceFromState) || 0;
    } else {
      // Recalculate from details if finalPrice is not available
      // Calculate price for Vêtements
      Object.keys(vetementsDetails).forEach(subOption => {
        if (vetementsDetails[subOption]?.selected && vetementsDetails[subOption]?.quantity > 0) {
          const price = vetementsPrices[subOption] || 0;
          const quantity = vetementsDetails[subOption].quantity || 0;
          calculatedPrice += price * quantity;
        }
      });
      
      // Calculate price for Grands textiles
      if (grandsTextilesDetails && grandsTextilesDetails.pieces) {
        grandsTextilesDetails.pieces.forEach(piece => {
          const piecePrice = calculateGrandsTextilesPiecePrice(piece.length, piece.width);
          calculatedPrice += piecePrice;
        });
      }
    }
    
    setDisplayFinalPrice(calculatedPrice);
  }, [reservationData, serviceType, finalPriceFromState, vetementsDetails, grandsTextilesDetails]);

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
      setLocError(t('reservation_lavage_ropassage.location_error.not_supported', 'La géolocalisation n\'est pas supportée par votre navigateur'));
      return;
    }

    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'HousekeepingApp/1.0'
              }
            }
          );

          if (!response.ok) throw new Error('Failed to get address');
          const data = await response.json();
          
          if (data && data.display_name) {
            setFormData(prev => ({
              ...prev,
              location: data.display_name
            }));
          } else {
            throw new Error('No address found');
          }
        } catch (err) {
          console.error('Error getting address:', err);
          setLocError(t('reservation_lavage_ropassage.location_error.fetch_failed', 'Impossible de récupérer l\'adresse. Veuillez la saisir manuellement.'));
        } finally {
          setLocLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocError(t('reservation_lavage_ropassage.location_error.general', 'Impossible d\'obtenir votre localisation'));
        setLocLoading(false);
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
      setError(t('reservation_lavage_ropassage.validation.firstname', 'Le prénom est requis'));
      setLoading(false);
      return;
    }
    if (!formData.phone.trim()) {
      setError(t('reservation_lavage_ropassage.validation.phone', 'Le numéro de téléphone est requis'));
      setLoading(false);
      return;
    }
    if (!reservationData) {
      setError(t('reservation_lavage_ropassage.validation.no_service', 'Aucune information de service trouvée'));
      setLoading(false);
      return;
    }

    try {
      // Recalculate final price to ensure accuracy
      let calculatedFinalPrice = 0;
      
      // Calculate price for Vêtements
      Object.keys(vetementsDetails).forEach(subOption => {
        if (vetementsDetails[subOption]?.selected && vetementsDetails[subOption]?.quantity > 0) {
          const price = vetementsPrices[subOption] || 0;
          const quantity = vetementsDetails[subOption].quantity || 0;
          calculatedFinalPrice += price * quantity;
        }
      });
      
      // Calculate price for Grands textiles
      if (grandsTextilesDetails && grandsTextilesDetails.pieces) {
        grandsTextilesDetails.pieces.forEach(piece => {
          const piecePrice = calculateGrandsTextilesPiecePrice(piece.length, piece.width);
          calculatedFinalPrice += piecePrice;
        });
      }
      
      // Use the calculated price or fallback to displayFinalPrice
      const finalPriceToSave = calculatedFinalPrice > 0 ? calculatedFinalPrice : displayFinalPrice;
      
      // Prepare data for insertion
      const insertData = {
        firstname: formData.firstname.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        location: formData.location.trim() || null,
        service_type: serviceType,
        type_menage_id: reservationData.id || null,
        menage_id: reservationData.service_id || null,
        item_name: reservationData.name || null,
        item_description: reservationData.description || null,
        item_price: reservationData.price ? parseFloat(reservationData.price) : null,
        item_image: reservationData.image || null,
        selected_options: selectedOptions.length > 0 ? selectedOptions : null,
        vetements_details: Object.keys(vetementsDetails).length > 0 ? vetementsDetails : null,
        grands_textiles_details: grandsTextilesDetails && (grandsTextilesDetails.count > 0 || grandsTextilesDetails.pieces?.length > 0) ? grandsTextilesDetails : null,
        final_price: finalPriceToSave,
        preferred_date: formData.preferred_date || null,
        message: formData.message.trim() || null,
        status: 'pending'
      };

      const { data, error: insertError } = await supabase
        .from('lavage_ropassage_reservations')
        .insert([insertData])
        .select();

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      setError('');
      
      // Clear form after successful submission
      setFormData({
        firstname: '',
        phone: '',
        email: '',
        location: '',
        message: '',
        preferred_date: ''
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/lavage-et-ropassage');
      }, 3000);
    } catch (err) {
      console.error('Error submitting reservation:', err);
      setError(t('reservation_lavage_ropassage.error.submit', 'Erreur lors de l\'envoi de la réservation: ') + (err.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  if (!reservationData) {
    return (
      <main className="reservation-lavage-ropassage-page">
        <div className="reservation-lavage-ropassage-header">
          <button 
            className="reservation-lavage-ropassage-back-btn"
            onClick={() => navigate('/lavage-et-ropassage')}
          >
            ← {t('reservation_lavage_ropassage.back', 'Retour')}
          </button>
        </div>
        <div className="reservation-lavage-ropassage-error">
          {t('reservation_lavage_ropassage.no_data', 'Aucune information de service trouvée. Veuillez retourner à la page précédente.')}
        </div>
      </main>
    );
  }

  return (
    <main className="reservation-lavage-ropassage-page">
      <div className="reservation-lavage-ropassage-header">
        <button 
          className="reservation-lavage-ropassage-back-btn"
          onClick={() => navigate(-1)}
        >
          ← {t('reservation_lavage_ropassage.back', 'Retour')}
        </button>
        <h1 className="reservation-lavage-ropassage-title">
          {t('reservation_lavage_ropassage.title', 'Réservation')}
        </h1>
      </div>

      {success && (
        <div className="reservation-lavage-ropassage-success">
          <h2>{t('reservation_lavage_ropassage.success.title', 'Réservation envoyée avec succès!')}</h2>
          <p>{t('reservation_lavage_ropassage.success.message', 'Votre demande de réservation a été enregistrée. Nous vous contacterons bientôt.')}</p>
        </div>
      )}

      {error && (
        <div className="reservation-lavage-ropassage-error-message">
          {error}
        </div>
      )}

      <div className="reservation-lavage-ropassage-container">
        <div className="reservation-lavage-ropassage-summary">
          <h2>{t('reservation_lavage_ropassage.summary.title', 'Résumé de la réservation')}</h2>
          <div className="reservation-lavage-ropassage-summary-item">
            <span className="reservation-lavage-ropassage-summary-label">
              {t('reservation_lavage_ropassage.summary.service', 'Service')}:
            </span>
            <span className="reservation-lavage-ropassage-summary-value">
              {reservationData.name || 'N/A'}
            </span>
          </div>
          {displayFinalPrice > 0 && (
            <div className="reservation-lavage-ropassage-summary-item reservation-lavage-ropassage-summary-total">
              <span className="reservation-lavage-ropassage-summary-label">
                {t('reservation_lavage_ropassage.summary.total', 'Prix total')}:
              </span>
              <span className="reservation-lavage-ropassage-summary-value reservation-lavage-ropassage-summary-total-value">
                {displayFinalPrice.toFixed(2)} DH
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="reservation-lavage-ropassage-form">
          <div className="reservation-lavage-ropassage-form-group">
            <label htmlFor="firstname" className="reservation-lavage-ropassage-form-label">
              {t('reservation_lavage_ropassage.form.firstname', 'Prénom')} *
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              className="reservation-lavage-ropassage-form-input"
              required
              placeholder={t('reservation_lavage_ropassage.form.firstname_placeholder', 'Votre prénom')}
            />
          </div>

          <div className="reservation-lavage-ropassage-form-group">
            <label htmlFor="phone" className="reservation-lavage-ropassage-form-label">
              {t('reservation_lavage_ropassage.form.phone', 'Téléphone')} *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="reservation-lavage-ropassage-form-input"
              required
              placeholder={t('reservation_lavage_ropassage.form.phone_placeholder', 'Votre numéro de téléphone')}
            />
          </div>

          <div className="reservation-lavage-ropassage-form-group">
            <label htmlFor="email" className="reservation-lavage-ropassage-form-label">
              {t('reservation_lavage_ropassage.form.email', 'Email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="reservation-lavage-ropassage-form-input"
              placeholder={t('reservation_lavage_ropassage.form.email_placeholder', 'Votre email (optionnel)')}
            />
          </div>

          <div className="reservation-lavage-ropassage-form-group">
            <label htmlFor="location" className="reservation-lavage-ropassage-form-label">
              {t('reservation_lavage_ropassage.form.location', 'Localisation')}
            </label>
            <div className="reservation-lavage-ropassage-location-group">
              <input
                ref={locationRef}
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="reservation-lavage-ropassage-form-input"
                placeholder={t('reservation_lavage_ropassage.form.location_placeholder', 'Votre adresse (optionnel)')}
              />
              <button
                type="button"
                onClick={handleAutoLocate}
                disabled={locLoading}
                className="reservation-lavage-ropassage-location-btn"
                title={t('reservation_lavage_ropassage.form.location_btn', 'Obtenir la localisation automatiquement')}
              >
                {locLoading ? t('reservation_lavage_ropassage.form.location_loading', 'Chargement...') : '📍'}
              </button>
            </div>
            {locError && (
              <div className="reservation-lavage-ropassage-location-error">
                {locError}
              </div>
            )}
          </div>

          <div className="reservation-lavage-ropassage-form-group">
            <label htmlFor="preferred_date" className="reservation-lavage-ropassage-form-label">
              {t('reservation_lavage_ropassage.form.preferred_date', 'Date préférée')}
            </label>
            <input
              type="date"
              id="preferred_date"
              name="preferred_date"
              value={formData.preferred_date}
              onChange={handleInputChange}
              className="reservation-lavage-ropassage-form-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="reservation-lavage-ropassage-form-group">
            <label htmlFor="message" className="reservation-lavage-ropassage-form-label">
              {t('reservation_lavage_ropassage.form.message', 'Message')}
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              className="reservation-lavage-ropassage-form-textarea"
              rows="4"
              placeholder={t('reservation_lavage_ropassage.form.message_placeholder', 'Message supplémentaire (optionnel)')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="reservation-lavage-ropassage-submit-btn"
          >
            {loading ? t('reservation_lavage_ropassage.form.submitting', 'Envoi en cours...') : t('reservation_lavage_ropassage.form.submit', 'Envoyer la réservation')}
          </button>
        </form>
      </div>
    </main>
  );
}


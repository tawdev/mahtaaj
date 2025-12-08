import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './ReservationCuisin.css';

export default function ReservationCuisin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedTypes = location.state?.selectedTypes || [];
  const categoryData = location.state?.category || null;
  const serviceData = location.state?.service || null;

  const [formValues, setFormValues] = useState({
    firstname: '',
    phone: '',
    email: '',
    location: '',
    preferred_date: '',
    preferred_time: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotalPrice = () => {
    return selectedTypes.reduce((sum, type) => {
      return sum + (parseFloat(type.price) || 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formValues.firstname.trim()) {
      setSubmitError(t('reservation_cuisin.error_firstname', 'Veuillez entrer votre nom'));
      return;
    }
    if (!formValues.phone.trim()) {
      setSubmitError(t('reservation_cuisin.error_phone', 'Veuillez entrer votre numéro de téléphone'));
      return;
    }
    if (!formValues.location.trim()) {
      setSubmitError(t('reservation_cuisin.error_location', 'Veuillez entrer votre adresse'));
      return;
    }
    if (selectedTypes.length === 0) {
      setSubmitError(t('reservation_cuisin.error_types', 'Veuillez sélectionner au moins un type de cuisine'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();

      const totalPrice = calculateTotalPrice();

      const reservationPayload = {
        firstname: formValues.firstname.trim(),
        phone: formValues.phone.trim(),
        email: formValues.email.trim() || null,
        location: formValues.location.trim(),
        category_house_id: categoryData?.id || 2, // Cuisine category ID is 2
        service_id: serviceData?.id || null,
        selected_types: selectedTypes.map(t => ({
          id: t.id,
          name: t.name,
          price: t.price || 0
        })),
        types_names: selectedTypes.map(t => t.name).join(' + '),
        total_price: totalPrice,
        preferred_date: formValues.preferred_date || null,
        preferred_time: formValues.preferred_time || null,
        message: formValues.message.trim() || null,
        user_id: user?.id || null,
        status: 'pending'
      };

      console.log('[ReservationCuisin] Submitting reservation:', reservationPayload);

      const { data, error } = await supabase
        .from('cuisine_reservations')
        .insert([reservationPayload])
        .select()
        .single();

      if (error) {
        console.error('[ReservationCuisin] Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        setSubmitError(t('reservation_cuisin.error_submit', 'Erreur lors de l\'envoi de la réservation. Veuillez réessayer.'));
        setIsSubmitting(false);
        return;
      }

      console.log('[ReservationCuisin] Reservation submitted successfully:', data);
      setSubmitSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/menage-et-cuisine');
      }, 3000);

    } catch (err) {
      console.error('[ReservationCuisin] Exception during submission:', err);
      setSubmitError(t('reservation_cuisin.error_submit', 'Erreur lors de l\'envoi de la réservation. Veuillez réessayer.'));
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <main className="reservation-cuisin-page">
        <div className="reservation-cuisin-container">
          <div className="reservation-cuisin-success">
            <div className="success-icon">✅</div>
            <h2>{t('reservation_cuisin.success_title', 'Réservation envoyée avec succès!')}</h2>
            <p>{t('reservation_cuisin.success_message', 'Votre demande de réservation a été enregistrée. Nous vous contacterons bientôt.')}</p>
            <p className="redirect-message">{t('reservation_cuisin.redirect_message', 'Redirection en cours...')}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="reservation-cuisin-page">
      <div className="reservation-cuisin-container">
        <button 
          className="reservation-cuisin-back-button"
          onClick={() => navigate('/cuisin')}
          title={t('reservation_cuisin.back', 'Retour')}
        >
          ← {t('reservation_cuisin.back', 'Retour')}
        </button>

        <div className="reservation-cuisin-header">
          <h1>{t('reservation_cuisin.title', 'Réservation Cuisine')}</h1>
          {categoryData && (
            <h2>{categoryData.name}</h2>
          )}
        </div>

        {selectedTypes.length > 0 && (
          <div className="selected-types-summary">
            <h3>{t('reservation_cuisin.selected_types', 'Types sélectionnés:')}</h3>
            <div className="types-list">
              {selectedTypes.map((type, index) => (
                <div key={type.id || index} className="type-item">
                  <span className="type-name">{type.name}</span>
                  {type.price && (
                    <span className="type-price">{parseFloat(type.price).toFixed(2)} DH</span>
                  )}
                </div>
              ))}
            </div>
            <div className="total-price">
              <strong>{t('reservation_cuisin.total', 'Total:')} {calculateTotalPrice().toFixed(2)} DH</strong>
            </div>
          </div>
        )}

        {submitError && (
          <div className="reservation-cuisin-error">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="reservation-cuisin-form">
          <div className="form-group">
            <label htmlFor="firstname">
              {t('reservation_cuisin.firstname', 'Nom complet')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formValues.firstname}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_cuisin.firstname_placeholder', 'Votre nom complet')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              {t('reservation_cuisin.phone', 'Téléphone')} <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formValues.phone}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_cuisin.phone_placeholder', 'Votre numéro de téléphone')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              {t('reservation_cuisin.email', 'Email')} <span className="optional">(optionnel)</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formValues.email}
              onChange={handleInputChange}
              placeholder={t('reservation_cuisin.email_placeholder', 'Votre adresse email')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">
              {t('reservation_cuisin.location', 'Adresse')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formValues.location}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_cuisin.location_placeholder', 'Votre adresse complète')}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="preferred_date">
                {t('reservation_cuisin.preferred_date', 'Date préférée')}
              </label>
              <input
                type="date"
                id="preferred_date"
                name="preferred_date"
                value={formValues.preferred_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="preferred_time">
                {t('reservation_cuisin.preferred_time', 'Heure préférée')}
              </label>
              <input
                type="time"
                id="preferred_time"
                name="preferred_time"
                value={formValues.preferred_time}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="message">
              {t('reservation_cuisin.message', 'Message')} <span className="optional">(optionnel)</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formValues.message}
              onChange={handleInputChange}
              rows="4"
              placeholder={t('reservation_cuisin.message_placeholder', 'Informations supplémentaires ou demandes spéciales...')}
            />
          </div>

          <button
            type="submit"
            className="reservation-cuisin-submit-button"
            disabled={isSubmitting || selectedTypes.length === 0}
          >
            {isSubmitting 
              ? t('reservation_cuisin.submitting', 'Envoi en cours...') 
              : t('reservation_cuisin.submit', 'Envoyer la réservation')}
          </button>
        </form>
      </div>
    </main>
  );
}


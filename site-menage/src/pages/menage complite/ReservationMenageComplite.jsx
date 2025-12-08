import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './ReservationMenageComplite.css';

export default function ReservationMenageComplite() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const serviceData = location.state?.type || null;
  const serviceType = location.state?.serviceType || 'resort_hotel';
  const formData = location.state?.reservationData || {};

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formValues.firstname.trim()) {
      setSubmitError(t('reservation_menage_complite.error_firstname', 'Veuillez entrer votre nom'));
      return;
    }
    if (!formValues.phone.trim()) {
      setSubmitError(t('reservation_menage_complite.error_phone', 'Veuillez entrer votre numéro de téléphone'));
      return;
    }
    if (!formValues.location.trim()) {
      setSubmitError(t('reservation_menage_complite.error_location', 'Veuillez entrer votre adresse'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();

      const reservationPayload = {
        firstname: formValues.firstname.trim(),
        phone: formValues.phone.trim(),
        email: formValues.email.trim() || null,
        location: formValues.location.trim(),
        service_type: serviceType,
        type_menage_id: serviceData?.id || null,
        menage_id: serviceData?.service_id || null,
        item_name: serviceData?.name || null,
        item_description: serviceData?.description || null,
        item_price: serviceData?.price || null,
        item_image: serviceData?.image || null,
        reservation_data: formData || {}, // All form data (rooms, bathrooms, etc.) - default to empty object
        final_price: serviceData?.finalPrice || 0,
        preferred_date: formValues.preferred_date || null,
        preferred_time: formValues.preferred_time || null,
        message: formValues.message.trim() || null,
        user_id: user?.id || null,
        status: 'pending'
      };

      console.log('[ReservationMenageComplite] Submitting reservation:', {
        ...reservationPayload,
        reservation_data: '...' // Don't log full data
      });

      // Try to insert without select first (to avoid RLS issues)
      const { data, error } = await supabase
        .from('menage_complet_reservations')
        .insert([reservationPayload])
        .select()
        .single();

      if (error) {
        console.error('[ReservationMenageComplite] Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // If select fails but insert might have succeeded, try without select
        if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('SELECT')) {
          console.log('[ReservationMenageComplite] Retrying without select...');
          const { error: insertError } = await supabase
            .from('menage_complet_reservations')
            .insert([reservationPayload]);
          
          if (insertError) {
            throw insertError;
          }
          // If insert succeeded without select, continue
        } else {
          throw error;
        }
      }

      setSubmitSuccess(true);
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/menage-complet');
      }, 3000);
    } catch (err) {
      console.error('[ReservationMenageComplite] Error submitting reservation:', err);
      let errorMessage = t('reservation_menage_complite.error_submit', 'Erreur lors de l\'envoi de la réservation. Veuillez réessayer.');
      
      // Provide more specific error messages
      if (err?.code === 'PGRST301' || err?.message?.includes('permission denied') || err?.message?.includes('401')) {
        errorMessage = t('reservation_menage_complite.error_permission', 'Erreur de permission. Veuillez vérifier que la table existe et que les politiques RLS sont correctement configurées.');
      } else if (err?.message) {
        errorMessage = `${errorMessage} (${err.message})`;
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    switch (serviceType) {
      case 'resort_hotel':
        navigate('/resort-hotel');
        break;
      case 'maison':
        navigate('/maison');
        break;
      case 'appartement':
        navigate('/appartement');
        break;
      case 'hotel':
        navigate('/hotel');
        break;
      case 'maison_dhote':
        navigate('/maison-dhote');
        break;
      case 'villa':
        navigate('/villa');
        break;
      default:
        navigate('/menage-complet');
    }
  };

  if (!serviceData) {
    return (
      <main className="reservation-menage-complite-page">
        <div className="reservation-header">
          <button className="reservation-back-btn" onClick={() => navigate('/menage-complet')}>
            ← {t('reservation_menage_complite.back', 'Retour')}
          </button>
        </div>
        <div className="reservation-error">
          {t('reservation_menage_complite.no_data', 'Aucune donnée de réservation trouvée')}
        </div>
      </main>
    );
  }

  if (submitSuccess) {
    return (
      <main className="reservation-menage-complite-page">
        <div className="reservation-header">
          <button className="reservation-back-btn" onClick={handleBack}>
            ← {t('reservation_menage_complite.back', 'Retour')}
          </button>
        </div>
        <div className="reservation-success">
          <h2>{t('reservation_menage_complite.success_title', 'Réservation envoyée avec succès !')}</h2>
          <p>{t('reservation_menage_complite.success_message', 'Votre réservation a été enregistrée. Nous vous contacterons bientôt.')}</p>
          <p>{t('reservation_menage_complite.redirecting', 'Redirection en cours...')}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="reservation-menage-complite-page">
      <div className="reservation-header">
        <button className="reservation-back-btn" onClick={handleBack}>
          ← {t('reservation_menage_complite.back', 'Retour')}
        </button>
        <h1 className="reservation-title">
          {t('reservation_menage_complite.title', 'Réservation Ménage Complet')}
        </h1>
      </div>

      <div className="reservation-container">
        {/* Service Summary */}
        <div className="reservation-summary">
          <h2>{t('reservation_menage_complite.service_summary', 'Résumé du service')}</h2>
          <div className="summary-item">
            <strong>{t('reservation_menage_complite.service', 'Service')}:</strong> {serviceData.name}
          </div>
          {serviceData.description && (
            <div className="summary-item">
              <strong>{t('reservation_menage_complite.description', 'Description')}:</strong> {serviceData.description}
            </div>
          )}
          {serviceData.finalPrice > 0 && (
            <div className="summary-item summary-price">
              <strong>{t('reservation_menage_complite.total_price', 'Prix total')}:</strong> {serviceData.finalPrice.toFixed(2)} DH
            </div>
          )}
        </div>

        {/* Reservation Form */}
        <form className="reservation-form" onSubmit={handleSubmit}>
          <h2>{t('reservation_menage_complite.contact_info', 'Informations de contact')}</h2>

          <div className="form-group">
            <label htmlFor="firstname" className="form-label">
              {t('reservation_menage_complite.firstname', 'Nom complet')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formValues.firstname}
              onChange={handleInputChange}
              className="form-input"
              placeholder={t('reservation_menage_complite.firstname_placeholder', 'Votre nom complet')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              {t('reservation_menage_complite.phone', 'Téléphone')} <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formValues.phone}
              onChange={handleInputChange}
              className="form-input"
              placeholder={t('reservation_menage_complite.phone_placeholder', 'Votre numéro de téléphone')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {t('reservation_menage_complite.email', 'Email')} <span className="optional">({t('reservation_menage_complite.optional', 'optionnel')})</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formValues.email}
              onChange={handleInputChange}
              className="form-input"
              placeholder={t('reservation_menage_complite.email_placeholder', 'Votre adresse email')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location" className="form-label">
              {t('reservation_menage_complite.location', 'Adresse')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formValues.location}
              onChange={handleInputChange}
              className="form-input"
              placeholder={t('reservation_menage_complite.location_placeholder', 'Votre adresse complète')}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="preferred_date" className="form-label">
                {t('reservation_menage_complite.preferred_date', 'Date préférée')}
              </label>
              <input
                type="date"
                id="preferred_date"
                name="preferred_date"
                value={formValues.preferred_date}
                onChange={handleInputChange}
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="preferred_time" className="form-label">
                {t('reservation_menage_complite.preferred_time', 'Heure préférée')}
              </label>
              <input
                type="time"
                id="preferred_time"
                name="preferred_time"
                value={formValues.preferred_time}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="message" className="form-label">
              {t('reservation_menage_complite.message', 'Message')} <span className="optional">({t('reservation_menage_complite.optional', 'optionnel')})</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formValues.message}
              onChange={handleInputChange}
              className="form-textarea"
              rows="4"
              placeholder={t('reservation_menage_complite.message_placeholder', 'Ajoutez des informations supplémentaires si nécessaire')}
            />
          </div>

          {submitError && (
            <div className="form-error">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            className="form-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? t('reservation_menage_complite.submitting', 'Envoi en cours...')
              : t('reservation_menage_complite.submit', 'Envoyer la réservation')
            }
          </button>
        </form>
      </div>
    </main>
  );
}


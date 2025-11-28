import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './HandWorkerAppointment.css';

export default function HandWorkerAppointment() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryId = searchParams.get('category');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    duration: 1
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSubmitting(true);
    setError('');

    try {
      console.log('[HandWorkerAppointment] Starting submission...');
      console.log('[HandWorkerAppointment] Form data:', formData);
      
      // Get user ID from Supabase session if available
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      
      // Prepare appointment data
      const appointmentData = {
        user_id: userId,
        category_id: categoryId || null,
        client_name: formData.name,
        client_phone: formData.phone,
        client_email: formData.email,
        appointment_date: formData.date || null,
        duration_days: formData.duration ? parseFloat(formData.duration) : null,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      console.log('[HandWorkerAppointment] Appointment data to insert:', appointmentData);
      
      const { data, error: insertError } = await supabase
        .from('hand_worker_appointments')
        .insert(appointmentData)
        .select()
        .single();
      
      if (insertError) {
        console.error('[HandWorkerAppointment] ❌ Error submitting appointment:', insertError);
        const errorMessage = insertError.message || insertError.details || t('hand_worker_appointment.submission_error', 'Erreur lors de la soumission. Veuillez réessayer.');
        setError(errorMessage);
        return;
      }
      
      console.log('[HandWorkerAppointment] ✅ Appointment submitted successfully:', data);
      
      setSuccess(true);
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        date: '',
        duration: 1
      });
    } catch (e) {
      console.error('[HandWorkerAppointment] Exception submitting appointment:', e);
      const errorMessage = e.message || t('hand_worker_appointment.submission_error', 'Erreur lors de la soumission. Veuillez réessayer.');
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="hand-worker-appointment-page">
        <div className="success-container">
          <div className="success-card">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2>{t('hand_worker_appointment.success_title', 'Rendez-vous demandé avec succès!')}</h2>
            <p>{t('hand_worker_appointment.success_message', 'Votre demande de rendez-vous a été soumise. Nous vous contacterons bientôt pour confirmer les détails.')}</p>
            <button 
              className="back-to-home-button"
              onClick={() => navigate('/hand-workers')}
            >
              {t('hand_worker_appointment.back_to_hand_workers', 'Retour aux services')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="hand-worker-appointment-page">
      {/* Back Button - Top Left */}
      <div className="back-button-top-container">
        <Link 
          to="/hand-workers" 
          className="back-button-top"
        >
          <span className="back-icon">←</span>
          {t('hand_worker_appointment.back_to_hand_workers', 'Retour aux services')}
        </Link>
      </div>

      <div className="appointment-header">
        <h1 className="appointment-title">{t('hand_worker_appointment.title', 'Réserver un rendez-vous')}</h1>
        <p className="appointment-subtitle">{t('hand_worker_appointment.subtitle', 'Remplissez le formulaire ci-dessous pour réserver un rendez-vous')}</p>
      </div>

      <div className="appointment-content">
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="appointment-form">
          <div className="form-section">
            <h3 className="section-title">{t('hand_worker_appointment.personal_info', 'Informations personnelles')}</h3>
            
            <div className="form-group">
              <label className="form-label">{t('hand_worker_appointment.name', 'Nom complet')} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                required
                placeholder={t('hand_worker_appointment.name_placeholder', 'Votre nom complet')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('hand_worker_appointment.phone', 'Téléphone')} *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="form-input"
                required
                placeholder={t('hand_worker_appointment.phone_placeholder', 'Votre numéro de téléphone')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('hand_worker_appointment.email', 'Email')} *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                required
                placeholder={t('hand_worker_appointment.email_placeholder', 'Votre adresse email')}
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">{t('hand_worker_appointment.appointment_details', 'Détails du rendez-vous')}</h3>
            
            <div className="form-group">
              <label className="form-label">{t('hand_worker_appointment.date', 'Date')} *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="form-input"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('hand_worker_appointment.duration', 'Durée (jours)')} *</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="form-input"
                required
                min="1"
                step="1"
                placeholder={t('hand_worker_appointment.duration_placeholder', 'Nombre de jours')}
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={submitting}
            >
              {submitting ? t('hand_worker_appointment.submitting', 'Envoi...') : t('hand_worker_appointment.submit', 'Soumettre')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}


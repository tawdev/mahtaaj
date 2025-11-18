import React, { useState } from 'react';
import './ReservationForm.css';
import { supabase } from '../lib/supabase';

const ReservationForm = ({ serviceId, categoryId, serviceType, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    location: '', // Required for reservations table
    booking_type: 'heures', // 'heures' or 'jours'
    // For heures booking
    start_date: '',
    start_time: '',
    hours: 1,
    // For jours booking
    start_date_jours: '',
    end_date_jours: '',
    days: 1,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Calculate price based on booking type and duration
  const calculatePrice = (bookingType, duration, startDateJours = null, endDateJours = null) => {
    const basePrice = 150; // Prix de base pour 4 heures
    const extraHourRate = 40; // Prix par heure supplémentaire après 4 heures
    const dayRate = 300; // Prix par jour (8 heures = 150 + 4*40 = 310, arrondi à 300)
    
    if (bookingType === 'heures') {
      // Si ≤ 4 heures: prix de base
      if (duration <= 4) {
        return basePrice;
      }
      // Si > 4 heures: prix de base + 40 DH par heure supplémentaire
      const extraHours = duration - 4;
      return basePrice + (extraHours * extraHourRate);
    } else {
      // Pour les jours: utiliser duration المحسوبة مسبقاً
      return duration * dayRate;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Le nom est requis';
    }
    
    if (!formData.client_phone.trim()) {
      newErrors.client_phone = 'Le téléphone est requis';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.client_phone)) {
      newErrors.client_phone = 'Format de téléphone invalide';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Le lieu est requis';
    }
    
    // Validate based on booking type
    if (formData.booking_type === 'heures') {
      if (!formData.start_date) {
        newErrors.start_date = 'La date de début est requise';
      } else {
        const selectedDate = new Date(formData.start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          newErrors.start_date = 'La date doit être aujourd\'hui ou dans le futur';
        }
      }
      
      if (!formData.start_time) {
        newErrors.start_time = 'L\'heure de début est requise';
      }
      
      if (formData.hours < 1 || formData.hours > 24) {
        newErrors.hours = 'Le nombre d\'heures doit être entre 1 et 24';
      }
    } else {
      if (!formData.start_date_jours) {
        newErrors.start_date_jours = 'La date de début est requise';
      } else {
        const selectedDate = new Date(formData.start_date_jours);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          newErrors.start_date_jours = 'La date de début doit être aujourd\'hui ou dans le futur';
        }
      }
      
      if (!formData.end_date_jours) {
        newErrors.end_date_jours = 'La date de fin est requise';
      } else if (formData.start_date_jours) {
        const startDate = new Date(formData.start_date_jours);
        const endDate = new Date(formData.end_date_jours);
        
        if (endDate < startDate) {
          newErrors.end_date_jours = 'La date de fin doit être après la date de début';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Get user ID from Supabase session if available
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      
      // Calculate total price based on booking type
      let duration;
      let reservationDate;
      
      if (formData.booking_type === 'heures') {
        duration = parseInt(formData.hours);
        reservationDate = formData.start_date;
      } else {
        // Calculate days from start to end date
        if (formData.start_date_jours && formData.end_date_jours) {
          const start = new Date(formData.start_date_jours);
          const end = new Date(formData.end_date_jours);
          const diffTime = Math.abs(end - start);
          duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        } else {
          duration = parseInt(formData.days);
        }
        reservationDate = formData.start_date_jours;
      }
      
      const totalPrice = calculatePrice(formData.booking_type, duration, formData.start_date_jours, formData.end_date_jours);
      
      if (serviceType === 'jardinage') {
        // Insert jardinage reservation into Supabase
        const reservationData = {
          user_id: userId,
          jardinage_service_id: serviceId || null,
          jardinage_category_id: categoryId || null,
          client_name: formData.client_name.trim(),
          client_phone: formData.client_phone.trim(),
          client_email: null,
          location: formData.location.trim() || 'Non spécifié',
          reservation_date: reservationDate ? new Date(reservationDate).toISOString().split('T')[0] : null,
          booking_type: formData.booking_type,
          // For heures booking
          start_date: formData.booking_type === 'heures' ? (formData.start_date ? new Date(formData.start_date).toISOString().split('T')[0] : null) : null,
          start_time: formData.booking_type === 'heures' ? formData.start_time : null,
          hours: formData.booking_type === 'heures' ? parseInt(formData.hours) : null,
          // For jours booking
          start_date_jours: formData.booking_type === 'jours' ? (formData.start_date_jours ? new Date(formData.start_date_jours).toISOString().split('T')[0] : null) : null,
          end_date_jours: formData.booking_type === 'jours' ? (formData.end_date_jours ? new Date(formData.end_date_jours).toISOString().split('T')[0] : null) : null,
          days: formData.booking_type === 'jours' ? duration : null,
          total_price: totalPrice,
          status: 'pending',
          notes: formData.notes.trim() || null
        };
        
        console.log('[ReservationForm] Submitting jardinage reservation:', reservationData);
        
        const { data, error } = await supabase
          .from('jardinage_reservations')
          .insert(reservationData)
          .select()
          .single();
        
        if (error) {
          console.error('[ReservationForm] Error submitting reservation:', error);
          setErrors({ general: error.message || 'Erreur lors de la création de la réservation' });
          return;
        }
        
        console.log('[ReservationForm] Reservation submitted successfully:', data);
        onSuccess({ success: true, data });
        
        // Reset form
        setFormData({
          client_name: '',
          client_phone: '',
          location: '',
          booking_type: 'heures',
          start_date: '',
          start_time: '',
          hours: 1,
          start_date_jours: '',
          end_date_jours: '',
          days: 1,
          notes: ''
        });
      } else if (serviceType === 'bebe') {
        // Insert bebe reservation into Supabase bebe_reservations table
        const reservationData = {
          user_id: userId,
          bebe_setting_id: serviceId || null,
          bebe_category_id: categoryId || null,
          client_name: formData.client_name.trim(),
          client_phone: formData.client_phone.trim(),
          client_email: null,
          location: formData.location.trim() || 'Non spécifié',
          reservation_date: reservationDate ? new Date(reservationDate).toISOString().split('T')[0] : null,
          booking_type: formData.booking_type,
          // For heures booking
          start_date: formData.booking_type === 'heures' ? (formData.start_date ? new Date(formData.start_date).toISOString().split('T')[0] : null) : null,
          start_time: formData.booking_type === 'heures' ? formData.start_time : null,
          hours: formData.booking_type === 'heures' ? parseInt(formData.hours) : null,
          // For jours booking
          start_date_jours: formData.booking_type === 'jours' ? (formData.start_date_jours ? new Date(formData.start_date_jours).toISOString().split('T')[0] : null) : null,
          end_date_jours: formData.booking_type === 'jours' ? (formData.end_date_jours ? new Date(formData.end_date_jours).toISOString().split('T')[0] : null) : null,
          days: formData.booking_type === 'jours' ? duration : null,
          total_price: totalPrice,
          status: 'pending',
          notes: formData.notes.trim() || null
        };
        
        console.log('[ReservationForm] Submitting bebe reservation to bebe_reservations:', reservationData);
        
        // Insert into bebe_reservations table
        const { data, error } = await supabase
          .from('bebe_reservations')
          .insert(reservationData)
          .select()
          .single();
        
        if (error) {
          console.error('[ReservationForm] Error submitting to bebe_reservations:', error);
          // If table doesn't exist, try general reservations table as fallback
          console.log('[ReservationForm] bebe_reservations table error, trying reservations table as fallback');
          const { data: altData, error: altError } = await supabase
            .from('reservations')
            .insert({
              user_id: userId,
              firstname: formData.client_name.trim(),
              phone: formData.client_phone.trim(),
              location: formData.location.trim() || 'Non spécifié',
              service: 'bebe',
              total_price: totalPrice,
              message: formData.notes.trim() || null,
              preferred_date: reservationDate,
              status: 'pending'
            })
            .select()
            .single();
          
          if (altError) {
            console.error('[ReservationForm] Error submitting reservation:', altError);
            setErrors({ general: altError.message || 'Erreur lors de la création de la réservation. Veuillez vérifier que le tableau bebe_reservations existe dans Supabase.' });
            return;
          }
          
          console.log('[ReservationForm] Reservation submitted successfully to reservations table (fallback):', altData);
          onSuccess({ success: true, data: altData });
        } else {
          console.log('[ReservationForm] Reservation submitted successfully to bebe_reservations:', data);
          onSuccess({ success: true, data });
        }
        
        // Reset form
        setFormData({
          client_name: '',
          client_phone: '',
          location: '',
          booking_type: 'heures',
          start_date: '',
          start_time: '',
          hours: 1,
          start_date_jours: '',
          end_date_jours: '',
          days: 1,
          notes: ''
        });
      } else {
        setErrors({ general: 'Type de service non reconnu' });
      }
    } catch (error) {
      console.error('[ReservationForm] Exception submitting reservation:', error);
      setErrors({ general: error.message || 'Erreur de connexion. Veuillez réessayer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total price dynamically
  let displayDuration;
  if (formData.booking_type === 'heures') {
    displayDuration = parseInt(formData.hours);
  } else {
    if (formData.start_date_jours && formData.end_date_jours) {
      const start = new Date(formData.start_date_jours);
      const end = new Date(formData.end_date_jours);
      const diffTime = Math.abs(end - start);
      displayDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else {
      displayDuration = parseInt(formData.days);
    }
  }
  const totalPrice = calculatePrice(formData.booking_type, displayDuration, formData.start_date_jours, formData.end_date_jours);

  return (
    <div className="reservation-form-container">
      <div className="reservation-form-header">
        <h3>📅 Réserver ce service</h3>
        <button 
          type="button" 
          className="close-btn"
          onClick={onCancel}
          aria-label="Fermer le formulaire"
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="reservation-form">
        {errors.general && (
          <div className="error-message general-error">
            {errors.general}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="client_name">Nom complet *</label>
          <input
            type="text"
            id="client_name"
            name="client_name"
            value={formData.client_name}
            onChange={handleInputChange}
            className={errors.client_name ? 'error' : ''}
            placeholder="Votre nom complet"
            required
          />
          {errors.client_name && (
            <span className="error-text">{errors.client_name}</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="client_phone">Numéro de téléphone *</label>
          <input
            type="tel"
            id="client_phone"
            name="client_phone"
            value={formData.client_phone}
            onChange={handleInputChange}
            className={errors.client_phone ? 'error' : ''}
            placeholder="Ex: +212 6 12 34 56 78"
            required
          />
          {errors.client_phone && (
            <span className="error-text">{errors.client_phone}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="location">📍 Lieu de la prestation *</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className={errors.location ? 'error' : ''}
            placeholder="Ex: Casablanca, Rabat, Marrakech..."
            required
          />
          {errors.location && (
            <span className="error-text">{errors.location}</span>
          )}
        </div>
        
        {/* Booking Type Selection */}
        <div className="form-group">
          <label>Type de réservation *</label>
          <div className="booking-type-selector">
            <button
              type="button"
              className={`booking-type-btn ${formData.booking_type === 'heures' ? 'active' : ''}`}
              onClick={() => {
                setFormData(prev => ({ ...prev, booking_type: 'heures' }));
                // Clear jours errors
                if (errors.start_date_jours || errors.end_date_jours) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.start_date_jours;
                    delete newErrors.end_date_jours;
                    return newErrors;
                  });
                }
              }}
            >
              ⏰ Par heures
            </button>
            <button
              type="button"
              className={`booking-type-btn ${formData.booking_type === 'jours' ? 'active' : ''}`}
              onClick={() => {
                setFormData(prev => ({ ...prev, booking_type: 'jours' }));
                // Clear heures errors
                if (errors.start_date || errors.start_time || errors.hours) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.start_date;
                    delete newErrors.start_time;
                    delete newErrors.hours;
                    return newErrors;
                  });
                }
              }}
            >
              📅 Par jours
            </button>
          </div>
        </div>

        {/* Dynamic Fields based on booking type */}
        {formData.booking_type === 'heures' ? (
          <>
            {/* Date and Time for heures booking */}
            <div className="form-group">
              <label htmlFor="start_date">📅 Date de début *</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className={errors.start_date ? 'error' : ''}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              {errors.start_date && (
                <span className="error-text">{errors.start_date}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="start_time">⏰ Heure de début *</label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className={errors.start_time ? 'error' : ''}
                required
              />
              {errors.start_time && (
                <span className="error-text">{errors.start_time}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="hours">⏰ Nombre d'heures *</label>
              <select
                id="hours"
                name="hours"
                value={formData.hours}
                onChange={handleInputChange}
                className={errors.hours ? 'error' : ''}
                required
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                  <option key={hour} value={hour}>
                    {hour} heure{hour > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
              {errors.hours && (
                <span className="error-text">{errors.hours}</span>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Date range for jours booking */}
            <div className="form-group">
              <label htmlFor="start_date_jours">📅 Date de début *</label>
              <input
                type="date"
                id="start_date_jours"
                name="start_date_jours"
                value={formData.start_date_jours}
                onChange={handleInputChange}
                className={errors.start_date_jours ? 'error' : ''}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              {errors.start_date_jours && (
                <span className="error-text">{errors.start_date_jours}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="end_date_jours">📅 Date de fin *</label>
              <input
                type="date"
                id="end_date_jours"
                name="end_date_jours"
                value={formData.end_date_jours}
                onChange={handleInputChange}
                className={errors.end_date_jours ? 'error' : ''}
                min={formData.start_date_jours || new Date().toISOString().split('T')[0]}
                required
              />
              {errors.end_date_jours && (
                <span className="error-text">{errors.end_date_jours}</span>
              )}
              {formData.start_date_jours && formData.end_date_jours && (
                <span className="info-text">
                  Durée: {(() => {
                    const start = new Date(formData.start_date_jours);
                    const end = new Date(formData.end_date_jours);
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                  })()}
                </span>
              )}
            </div>
          </>
        )}
        
        <div className="form-group">
          <label htmlFor="notes">Notes supplémentaires (optionnel)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Informations supplémentaires..."
            rows="3"
            maxLength="500"
          />
        </div>
        
        <div className="price-summary">
          <div className="price-breakdown">
            {formData.booking_type === 'heures' ? (
              <>
                {displayDuration <= 4 ? (
                  <div className="price-item">
                    <span>Prix de base (4h):</span>
                    <span>150 MAD</span>
                  </div>
                ) : (
                  <>
                    <div className="price-item">
                      <span>Prix de base (4h):</span>
                      <span>150 MAD</span>
                    </div>
                    <div className="price-item">
                      <span>Heures supplémentaires ({displayDuration - 4} × 40 MAD):</span>
                      <span>{(displayDuration - 4) * 40} MAD</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="price-item">
                <span>Prix par jour ({displayDuration} jour{displayDuration > 1 ? 's' : ''} × 300 MAD):</span>
                <span>{displayDuration * 300} MAD</span>
              </div>
            )}
            <div className="price-total">
              <span>Total:</span>
              <span>{totalPrice} MAD</span>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : 'Réserver maintenant'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReservationForm;

import React, { useState } from 'react';
import './ReservationForm.css';
import { supabase } from '../lib/supabase';

const ReservationForm = ({ serviceId, serviceType, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    reservation_date: '',
    hours: 1,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const calculatePrice = (hours) => {
    const basePrice = 150; // Minimum price
    const hourlyRate = 40; // Additional price per hour
    return basePrice + ((hours - 1) * hourlyRate);
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
    
    if (!formData.reservation_date) {
      newErrors.reservation_date = 'La date est requise';
    } else {
      const selectedDate = new Date(formData.reservation_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate <= today) {
        newErrors.reservation_date = 'La date doit être dans le futur';
      }
    }
    
    if (formData.hours < 1 || formData.hours > 12) {
      newErrors.hours = 'Le nombre d\'heures doit être entre 1 et 12';
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
      
      // Calculate total price
      const totalPrice = calculatePrice(parseInt(formData.hours));
      
      if (serviceType === 'jardinage') {
        // Insert jardinage reservation into Supabase
        const reservationData = {
          user_id: userId,
          jardinage_service_id: serviceId || null,
          client_name: formData.client_name.trim(),
          client_phone: formData.client_phone.trim(),
          client_email: null, // Can be added later if needed
          reservation_date: formData.reservation_date,
          hours: parseInt(formData.hours),
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
          reservation_date: '',
          hours: 1,
          notes: ''
        });
      } else if (serviceType === 'bebe') {
        // For bebe reservations, we might need a separate table or use a general reservations table
        // For now, we'll show an error message
        setErrors({ general: 'Les réservations pour les services bébé ne sont pas encore disponibles via Supabase. Veuillez contacter l\'administrateur.' });
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

  const totalPrice = calculatePrice(formData.hours);

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
          <label htmlFor="reservation_date">Date de réservation *</label>
          <input
            type="date"
            id="reservation_date"
            name="reservation_date"
            value={formData.reservation_date}
            onChange={handleInputChange}
            className={errors.reservation_date ? 'error' : ''}
            min={new Date().toISOString().split('T')[0]}
            required
          />
          {errors.reservation_date && (
            <span className="error-text">{errors.reservation_date}</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="hours">Durée (heures) *</label>
          <select
            id="hours"
            name="hours"
            value={formData.hours}
            onChange={handleInputChange}
            className={errors.hours ? 'error' : ''}
            required
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(hour => (
              <option key={hour} value={hour}>
                {hour} heure{hour > 1 ? 's' : ''}
              </option>
            ))}
          </select>
          {errors.hours && (
            <span className="error-text">{errors.hours}</span>
          )}
        </div>
        
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
            <div className="price-item">
              <span>Prix de base (4h):</span>
              <span>150 MAD</span>
            </div>
            {formData.hours > 1 && (
              <div className="price-item">
                <span>Heures supplémentaires ({(formData.hours - 1)} × 40 MAD):</span>
                <span>{(formData.hours - 1) * 40} MAD</span>
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

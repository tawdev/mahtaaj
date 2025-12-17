import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createDriverReservation } from '../api-supabase';
import './BookingDriverForm.css';

export default function BookingDriverForm({ category, onSuccess, onCancel }) {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    reservation_date: '',
    reservation_time: '',
    number_of_seats: 1,
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.full_name.trim()) {
      setError(
        i18n.language === 'ar' ? 'الاسم مطلوب' : 
        i18n.language === 'fr' ? 'Le nom est requis' : 
        'Name is required'
      );
      setLoading(false);
      return;
    }

    if (!formData.phone.trim()) {
      setError(
        i18n.language === 'ar' ? 'رقم الهاتف مطلوب' : 
        i18n.language === 'fr' ? 'Le téléphone est requis' : 
        'Phone is required'
      );
      setLoading(false);
      return;
    }

    if (!formData.reservation_date) {
      setError(
        i18n.language === 'ar' ? 'تاريخ الحجز مطلوب' : 
        i18n.language === 'fr' ? 'La date de réservation est requise' : 
        'Reservation date is required'
      );
      setLoading(false);
      return;
    }

    try {
      // Get localized category name
      const getLocalizedName = (category) => {
        if (!category) return '';
        const locale = i18n.language || 'fr';
        if (locale === 'ar' && category.name_ar) return category.name_ar;
        if (locale === 'en' && category.name_en) return category.name_en;
        if (category.name_fr) return category.name_fr;
        return category.category_name || category.name || '';
      };

      const categoryName = getLocalizedName(category);

      // Prepare reservation data with all fields
      // Format time: input type="time" gives "HH:MM", PostgreSQL TIME accepts "HH:MM:SS"
      const formattedTime = formData.reservation_time 
        ? `${formData.reservation_time}:00` 
        : null;

      const reservationData = {
        driver_id: category?.driver_id || null,
        reservation_date: formData.reservation_date,
        reservation_time: formattedTime,
        status: 'pending',
        full_name: formData.full_name.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone.trim(),
        address: formData.address?.trim() || null,
        number_of_seats: formData.number_of_seats ? parseInt(formData.number_of_seats) : 1,
        message: formData.message?.trim() || null
      };

      console.log('[BookingDriverForm] Submitting reservation:', reservationData);

      // Create reservation with all details
      await createDriverReservation(reservationData);
      
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Error creating driver reservation:', err);
      setError(
        i18n.language === 'ar' ? 'خطأ في إرسال الحجز. يرجى المحاولة مرة أخرى.' : 
        i18n.language === 'fr' ? 'Erreur lors de l\'envoi de la réservation. Veuillez réessayer.' : 
        'Error submitting reservation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (success) {
    return (
      <div className="booking-driver-form-overlay">
        <div className="booking-driver-form success-message">
          <div className="success-icon">✓</div>
          <h3>
            {i18n.language === 'ar' ? 'تم إرسال الحجز بنجاح!' : 
             i18n.language === 'fr' ? 'Réservation envoyée avec succès!' : 
             'Reservation sent successfully!'}
          </h3>
          <p>
            {i18n.language === 'ar' ? 'سيتم التواصل معك قريباً' : 
             i18n.language === 'fr' ? 'Nous vous contacterons bientôt' : 
             'We will contact you soon'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-driver-form-overlay" onClick={onCancel}>
      <div className="booking-driver-form" onClick={(e) => e.stopPropagation()}>
        <div className="booking-driver-form-header">
          <h2>
            {i18n.language === 'ar' ? 'حجز سائق' : 
             i18n.language === 'fr' ? 'Réservation Chauffeur' : 
             'Driver Reservation'}
          </h2>
          <button 
            type="button" 
            className="close-button" 
            onClick={onCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="form-error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="booking-driver-form-content">
          <div className="form-group">
            <label htmlFor="full_name">
              {i18n.language === 'ar' ? 'الاسم الكامل' : 
               i18n.language === 'fr' ? 'Nom complet' : 
               'Full Name'} *
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              required
              placeholder={
                i18n.language === 'ar' ? 'أدخل الاسم الكامل' : 
                i18n.language === 'fr' ? 'Entrez votre nom complet' : 
                'Enter your full name'
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              {i18n.language === 'ar' ? 'رقم الهاتف' : 
               i18n.language === 'fr' ? 'Téléphone' : 
               'Phone'} *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder={
                i18n.language === 'ar' ? '+212 6 12 34 56 78' : 
                i18n.language === 'fr' ? '+212 6 12 34 56 78' : 
                '+212 6 12 34 56 78'
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              {i18n.language === 'ar' ? 'البريد الإلكتروني' : 
               i18n.language === 'fr' ? 'Email' : 
               'Email'}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={
                i18n.language === 'ar' ? 'votre@email.com' : 
                i18n.language === 'fr' ? 'votre@email.com' : 
                'your@email.com'
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">
              {i18n.language === 'ar' ? 'العنوان' : 
               i18n.language === 'fr' ? 'Adresse' : 
               'Address'}
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder={
                i18n.language === 'ar' ? 'أدخل العنوان' : 
                i18n.language === 'fr' ? 'Entrez votre adresse' : 
                'Enter your address'
              }
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reservation_date">
                {i18n.language === 'ar' ? 'تاريخ الحجز' : 
                 i18n.language === 'fr' ? 'Date de réservation' : 
                 'Reservation Date'} *
              </label>
              <input
                type="date"
                id="reservation_date"
                name="reservation_date"
                value={formData.reservation_date}
                onChange={handleInputChange}
                required
                min={getMinDate()}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reservation_time">
                {i18n.language === 'ar' ? 'الوقت' : 
                 i18n.language === 'fr' ? 'Heure' : 
                 'Time'}
              </label>
              <input
                type="time"
                id="reservation_time"
                name="reservation_time"
                value={formData.reservation_time}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="number_of_seats">
              {i18n.language === 'ar' ? 'عدد المقاعد' : 
               i18n.language === 'fr' ? 'Nombre de places' : 
               'Number of Seats'} *
            </label>
            <input
              type="number"
              id="number_of_seats"
              name="number_of_seats"
              value={formData.number_of_seats}
              onChange={handleInputChange}
              required
              min="1"
              max="50"
              step="1"
              placeholder={
                i18n.language === 'ar' ? 'أدخل عدد المقاعد' : 
                i18n.language === 'fr' ? 'Entrez le nombre de places' : 
                'Enter number of seats'
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">
              {i18n.language === 'ar' ? 'رسالة إضافية' : 
               i18n.language === 'fr' ? 'Message supplémentaire' : 
               'Additional Message'}
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows="4"
              placeholder={
                i18n.language === 'ar' ? 'أدخل أي معلومات إضافية...' : 
                i18n.language === 'fr' ? 'Entrez des informations supplémentaires...' : 
                'Enter any additional information...'
              }
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                i18n.language === 'ar' ? 'جاري الإرسال...' : 
                i18n.language === 'fr' ? 'Envoi en cours...' : 
                'Sending...'
              ) : (
                i18n.language === 'ar' ? 'إرسال الحجز' : 
                i18n.language === 'fr' ? 'Envoyer la réservation' : 
                'Submit Reservation'
              )}
            </button>
            <button 
              type="button" 
              className="cancel-button"
              onClick={onCancel}
              disabled={loading}
            >
              {i18n.language === 'ar' ? 'إلغاء' : 
               i18n.language === 'fr' ? 'Annuler' : 
               'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


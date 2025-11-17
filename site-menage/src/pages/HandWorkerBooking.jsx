import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { translateHandWorkerCategories } from '../services/handWorkerTranslation';
import i18n from '../i18n';
import { supabase } from '../lib/supabase';
import './HandWorkerBooking.css';

export default function HandWorkerBooking() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [handWorkers, setHandWorkers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    client_first_name: '',
    client_last_name: '',
    client_email: '',
    client_phone: '',
    category_id: '',
    hand_worker_id: '',
    service_description: '',
    preferred_date: '',
    preferred_time: '',
    duration_hours: 1,
    location: '',
    address: '',
    city: '',
    client_notes: ''
  });

  useEffect(() => {
    loadCategories();
    
    // Pre-select category if provided in URL
    const categoryId = searchParams.get('category');
    if (categoryId) {
      setFormData(prev => ({ ...prev, category_id: categoryId }));
    }
  }, [searchParams]);

  // Recharger les catégories quand la langue change
  useEffect(() => {
    if (categories.length > 0) {
      const currentLanguage = i18n.language || 'fr';
      const translatedCategories = translateHandWorkerCategories(categories, currentLanguage);
      setCategories(translatedCategories);
      
      // Mettre à jour la catégorie sélectionnée si elle existe
      if (selectedCategory) {
        const updatedCategory = translatedCategories.find(cat => cat.id === selectedCategory.id);
        if (updatedCategory) {
          setSelectedCategory(updatedCategory);
        }
      }
    }
  }, [i18n.language]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[HandWorkerBooking] Loading categories from Supabase...');
      
      const { data, error } = await supabase
        .from('hand_worker_categories')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });
      
      if (error) {
        console.error('[HandWorkerBooking] Error loading categories:', error);
        setError(t('hand_worker_booking.loading_error'));
        return;
      }
      
      console.log('[HandWorkerBooking] Loaded categories:', data?.length || 0);
      
      // Appliquer les traductions selon la langue actuelle
      const currentLanguage = i18n.language || 'fr';
      const translatedCategories = translateHandWorkerCategories(data || [], currentLanguage);
      setCategories(translatedCategories);
      
      // Auto-select category if provided in URL
      const categoryId = searchParams.get('category');
      if (categoryId) {
        const category = translatedCategories.find(cat => cat.id == categoryId);
        if (category) {
          setSelectedCategory(category);
          loadHandWorkers(categoryId);
        }
      }
    } catch (e) {
      console.error('[HandWorkerBooking] Exception loading categories:', e);
      setError(t('hand_worker_booking.loading_error'));
    } finally {
      setLoading(false);
    }
  };

  const loadHandWorkers = async (categoryId) => {
    try {
      console.log('[HandWorkerBooking] Loading hand workers for category:', categoryId);
      
      const { data, error } = await supabase
        .from('hand_workers')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_available', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[HandWorkerBooking] Error loading hand workers:', error);
        return;
      }
      
      console.log('[HandWorkerBooking] Loaded hand workers:', data?.length || 0);
      setHandWorkers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[HandWorkerBooking] Exception loading hand workers:', e);
    }
  };

  const handleCategoryChange = (categoryId) => {
    const category = categories.find(cat => cat.id == categoryId);
    setSelectedCategory(category);
    setFormData(prev => ({ 
      ...prev, 
      category_id: categoryId,
      hand_worker_id: '',
      duration_hours: category?.minimum_hours || 1
    }));
    loadHandWorkers(categoryId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotalPrice = () => {
    if (selectedCategory && formData.duration_hours) {
      return selectedCategory.price_per_hour * parseFloat(formData.duration_hours);
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      setError(t('hand_worker_booking.select_category_error'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('[HandWorkerBooking] Submitting reservation:', formData);
      
      // Get user ID from Supabase session if available
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      
      // Calculate total price
      const totalPrice = calculateTotalPrice();
      
      // Prepare reservation data
      const reservationData = {
        user_id: userId,
        client_first_name: formData.client_first_name,
        client_last_name: formData.client_last_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone,
        category_id: formData.category_id || null,
        hand_worker_id: formData.hand_worker_id || null,
        service_description: formData.service_description,
        preferred_date: formData.preferred_date || null,
        preferred_time: formData.preferred_time || null,
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
        location: formData.location,
        address: formData.address,
        city: formData.city,
        total_price: totalPrice || null,
        status: 'pending',
        client_notes: formData.client_notes || null
      };
      
      const { data, error } = await supabase
        .from('hand_worker_reservations')
        .insert(reservationData)
        .select()
        .single();
      
      if (error) {
        console.error('[HandWorkerBooking] Error submitting reservation:', error);
        setError(error.message || t('hand_worker_booking.submission_error'));
        return;
      }
      
      console.log('[HandWorkerBooking] Reservation submitted successfully:', data);
      
      setSuccess(true);
      // Reset form
      setFormData({
        client_first_name: '',
        client_last_name: '',
        client_email: '',
        client_phone: '',
        category_id: '',
        hand_worker_id: '',
        service_description: '',
        preferred_date: '',
        preferred_time: '',
        duration_hours: 1,
        location: '',
        address: '',
        city: '',
        client_notes: ''
      });
      setSelectedCategory(null);
      setHandWorkers([]);
    } catch (e) {
      console.error('[HandWorkerBooking] Exception submitting reservation:', e);
      setError(e.message || t('hand_worker_booking.submission_error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-state">{t('hand_worker_booking.loading')}</div>;
  if (error && !submitting) return <div className="error-state">{error}</div>;

  if (success) {
    return (
      <div className="success-container">
        <div className="success-card">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>{t('hand_worker_booking.success_title')}</h2>
          <p>{t('hand_worker_booking.success_message')}</p>
          <button 
            className="back-to-home-button"
            onClick={() => navigate('/hand-workers')}
          >
            {t('hand_worker_booking.back_to_hand_workers')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="hand-worker-booking-page">
      <div className="booking-header">
        <h1 className="booking-title">{t('hand_worker_booking.title')}</h1>
        <p className="booking-subtitle">{t('hand_worker_booking.subtitle')}</p>
      </div>

      <div className="booking-content">
        <form onSubmit={handleSubmit} className="booking-form">
          {/* Personal Information */}
          <div className="form-section">
            <h3 className="section-title">{t('hand_worker_booking.personal_info')}</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('hand_worker_booking.first_name')} *</label>
                <input
                  type="text"
                  name="client_first_name"
                  value={formData.client_first_name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('hand_worker_booking.last_name')} *</label>
                <input
                  type="text"
                  name="client_last_name"
                  value={formData.client_last_name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('hand_worker_booking.email')} *</label>
                <input
                  type="email"
                  name="client_email"
                  value={formData.client_email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('hand_worker_booking.phone')} *</label>
                <input
                  type="tel"
                  name="client_phone"
                  value={formData.client_phone}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Service Selection */}
          <div className="form-section">
            <h3 className="section-title">{t('hand_worker_booking.service_selection')}</h3>
            <div className="form-group">
              <label className="form-label">{t('hand_worker_booking.category')} *</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="form-select"
                required
              >
                <option value="">{t('hand_worker_booking.select_category')}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} - {category.price_per_hour} DH/h
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory && (
              <div className="category-info">
                <div className="category-details">
                  <h4>{selectedCategory.name}</h4>
                  <p>{selectedCategory.description}</p>
                  <div className="category-pricing">
                    <span>{t('hand_worker_booking.price_per_hour')}: {selectedCategory.price_per_hour} DH</span>
                    <span>{t('hand_worker_booking.minimum_hours')}: {selectedCategory.minimum_hours}h</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Service Details */}
          <div className="form-section">
            <h3 className="section-title">{t('hand_worker_booking.service_details')}</h3>
            <div className="form-group">
              <label className="form-label">{t('hand_worker_booking.service_description')} *</label>
              <textarea
                name="service_description"
                value={formData.service_description}
                onChange={handleInputChange}
                className="form-textarea"
                rows="4"
                placeholder={t('hand_worker_booking.service_description_placeholder')}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('hand_worker_booking.duration_hours')} *</label>
                <input
                  type="number"
                  name="duration_hours"
                  value={formData.duration_hours}
                  onChange={handleInputChange}
                  className="form-input"
                  min={selectedCategory?.minimum_hours || 1}
                  step="0.5"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('hand_worker_booking.preferred_date')} *</label>
                <input
                  type="date"
                  name="preferred_date"
                  value={formData.preferred_date}
                  onChange={handleInputChange}
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('hand_worker_booking.preferred_time')}</label>
              <input
                type="time"
                name="preferred_time"
                value={formData.preferred_time}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <h3 className="section-title">{t('hand_worker_booking.location')}</h3>
            <div className="form-group">
              <label className="form-label">{t('hand_worker_booking.location_name')} *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="form-input"
                placeholder={t('hand_worker_booking.location_placeholder')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('hand_worker_booking.address')} *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="form-textarea"
                rows="3"
                placeholder={t('hand_worker_booking.address_placeholder')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('hand_worker_booking.city')} *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div className="form-section">
            <h3 className="section-title">{t('hand_worker_booking.additional_notes')}</h3>
            <div className="form-group">
              <label className="form-label">{t('hand_worker_booking.client_notes')}</label>
              <textarea
                name="client_notes"
                value={formData.client_notes}
                onChange={handleInputChange}
                className="form-textarea"
                rows="3"
                placeholder={t('hand_worker_booking.client_notes_placeholder')}
              />
            </div>
          </div>

          {/* Price Summary */}
          {selectedCategory && (
            <div className="price-summary">
              <h3>{t('hand_worker_booking.price_summary')}</h3>
              <div className="price-breakdown">
                <div className="price-item">
                  <span>{t('hand_worker_booking.hourly_rate')}</span>
                  <span>{selectedCategory.price_per_hour} DH</span>
                </div>
                <div className="price-item">
                  <span>{t('hand_worker_booking.duration')}</span>
                  <span>{formData.duration_hours}h</span>
                </div>
                <div className="price-item total">
                  <span>{t('hand_worker_booking.total_price')}</span>
                  <span>{calculateTotalPrice().toFixed(2)} DH</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={submitting || !selectedCategory}
            >
              {submitting ? t('hand_worker_booking.submitting') : t('hand_worker_booking.submit')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

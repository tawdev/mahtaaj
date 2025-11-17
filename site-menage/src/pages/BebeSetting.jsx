import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReservationForm from '../components/ReservationForm';
import { supabase } from '../lib/supabase';
import './BebeSetting.css';

export default function BebeSetting() {
  const { t, i18n } = useTranslation();
  
  // Use backend-provided localized fields directly

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Set direction based on language
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    if (selectedCategory) {
      // reload current category details in the new language
      loadCategoryDetails(selectedCategory.id);
    } else {
      loadCategories();
    }

    // if a service modal is open, sync the selectedService from refreshed settings
    // to avoid stale language
    if (showServiceDetails && selectedService && settings.length > 0) {
      const updated = settings.find(s => s.id === selectedService.id);
      if (updated) setSelectedService(updated);
    }
  }, [i18n.language]);

  // Helper function to get image URL from Supabase Storage
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a Supabase URL, return it
    if (imagePath.includes('supabase.co/storage')) {
      return imagePath;
    }
    
    // If it's an old Laravel path, extract filename and try to get from Supabase
    if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000') || imagePath.startsWith('/storage/') || imagePath.startsWith('/images/')) {
      const filename = imagePath.split('/').pop();
      if (filename) {
        console.log('[BebeSetting] Converting Laravel path to Supabase:', imagePath, '-> filename:', filename);
        // Try employees bucket (where bebe images are stored)
        const { data: { publicUrl } } = supabase.storage
          .from('employees')
          .getPublicUrl(filename);
        console.log('[BebeSetting] Generated Supabase URL:', publicUrl);
        return publicUrl;
      }
      return null;
    }
    
    // If it's just a filename, try to get from Supabase Storage
    if (!imagePath.includes('/') && !imagePath.includes('http')) {
      const { data: { publicUrl } } = supabase.storage
        .from('employees')
        .getPublicUrl(imagePath);
      return publicUrl;
    }
    
    // Return as-is if it's a valid URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    return null;
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[BebeSetting] Loading categories from Supabase');
      
      const { data, error } = await supabase
        .from('bebe_categories')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });

      if (error) {
        console.error('[BebeSetting] Error loading categories:', error);
        setError(t('bebe_setting.errors.categories') + ': ' + error.message);
        return;
      }

      console.log('[BebeSetting] Loaded categories:', data?.length || 0);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[BebeSetting] Exception loading categories:', err);
      setError(t('bebe_setting.errors.connection') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryDetails = async (categoryId) => {
    try {
      setLoadingDetails(true);
      setError('');
      
      console.log('[BebeSetting] Loading category details for category_id:', categoryId);
      
      const { data, error } = await supabase
        .from('bebe_settings')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('order', { ascending: true });

      if (error) {
        console.error('[BebeSetting] Error loading category details:', error);
        setError(t('bebe_setting.errors.details') + ': ' + error.message);
        return;
      }

      console.log('[BebeSetting] Loaded settings:', data?.length || 0);
      setSettings(Array.isArray(data) ? data : []);
      setSelectedCategory(categories.find(cat => cat.id === categoryId));
    } catch (err) {
      console.error('[BebeSetting] Exception loading category details:', err);
      setError(t('bebe_setting.errors.connection') + ': ' + err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    loadCategoryDetails(categoryId);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSettings([]);
    setShowServiceDetails(false);
    setSelectedService(null);
    setShowReservationForm(false);
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setShowServiceDetails(true);
  };

  const handleReservationSuccess = (data) => {
    setSuccessMessage(t('bebe_setting.success.reservation'));
    setShowReservationForm(false);
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  const handleReservationCancel = () => {
    setShowReservationForm(false);
  };

  if (loading) {
    return (
      <div className="bebe-setting-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>{t('bebe_setting.loading.categories')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bebe-setting-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={loadCategories} className="retry-button">
            {t('bebe_setting.errors.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="bebe-setting-page">
      {!showServiceDetails && (
        <>
          <div className="bebe-setting-header">
            <div className="header-content">
              <h1 className="page-title">{t('bebe_setting.title')}</h1>
              <p className="page-subtitle">
                {t('bebe_setting.subtitle')}
              </p>
            </div>
            <div className="back-to-home">
              <Link to="/" className="back-button">
                <span className="back-icon">←</span>
                {t('bebe_setting.back_to_home')}
              </Link>
            </div>
          </div>

          <div className="bebe-setting-content">
        {!selectedCategory ? (
          <div className="categories-section">
            <h2 className="section-title">{t('bebe_setting.categories.title')}</h2>
            <div className="categories-grid">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="category-card"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className="category-image">
                    {(() => {
                      const imagePath = category.image;
                      const imageUrl = imagePath ? getImageUrl(imagePath) : null;
                      return imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={category.name}
                          onError={(e) => {
                            console.log('[BebeSetting] Image failed to load:', imageUrl, 'Original path:', imagePath);
                            e.target.src = '/images/bebe/default.jpg';
                          }}
                          onLoad={() => {
                            console.log('[BebeSetting] Image loaded successfully:', imageUrl);
                          }}
                        />
                      ) : (
                        <div className="category-image-placeholder">
                          👶
                        </div>
                      );
                    })()}
                  </div>
                  <div className="category-content">
                    <h3 className="category-name">{category.name || t('bebe_setting.category_not_available')}</h3>
                    <p className="category-description">{category.description || t('bebe_setting.description_not_available')}</p>
                  </div>
                  <div className="category-overlay">
                    <span className="view-icon">👁️</span>
                    <span className="view-text">{t('bebe_setting.categories.view_details')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="details-section">
            <div className="details-header">
              <button onClick={handleBackToCategories} className="back-to-categories">
                <span className="back-icon">←</span>
                {t('bebe_setting.services.back_to_categories')}
              </button>
              <h2 className="section-title">{selectedCategory.name}</h2>
            </div>

            {loadingDetails ? (
              <div className="loading-details">
                <div className="loader"></div>
                <p>{t('bebe_setting.loading.services')}</p>
              </div>
            ) : (
              <div className="settings-grid">
                {settings.length > 0 ? (
                  settings.map((setting) => (
                    <div key={setting.id} className="setting-card">
                      <div className="setting-image">
                        <img
                          src={setting.photo || '/images/bebe/default.jpg'}
                          alt={setting.nom}
                          onError={(e) => {
                            e.target.src = '/images/bebe/default.jpg';
                          }}
                        />
                      </div>
                      <div className="setting-content">
                        <h3 className="setting-name">{setting.nom || setting.name || t('bebe_setting.category_not_available')}</h3>
                        <p className="setting-description">{setting.description || t('bebe_setting.description_not_available')}</p>
                        <div className="setting-details">
                          <div className="price-info">
                            <span className="price-label">{t('bebe_setting.services.price')}</span>
                            <span className="price-value">{setting.price} DH</span>
                          </div>
                          <div className="duration-info">
                            <span className="duration-label">{t('bebe_setting.services.duration')}</span>
                            <span className="duration-value">{setting.duration}</span>
                          </div>
                        </div>
                        <div className="setting-actions">
                          <button 
                            className="details-button"
                            onClick={() => handleServiceClick(setting)}
                          >
                            <span className="details-icon">👁️</span>
                            {t('bebe_setting.services.view_details')}
                          </button>
                          <button 
                            className="reserve-button"
                            onClick={() => {
                              setSelectedService(setting);
                              setShowReservationForm(true);
                            }}
                          >
                            <span className="reserve-icon">📅</span>
                            {t('bebe_setting.services.reserve')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-services">
                    <div className="no-services-icon">📭</div>
                    <p>{t('bebe_setting.services.no_services')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
          </div>
        </>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <div className="success-content">
            <span className="success-icon">✅</span>
            <span className="success-text">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Service Details Page */}
      {showServiceDetails && selectedService && (
        <div className="service-details-page">
          <div className="service-details-container">
            {/* Back Button */}
            <button 
              className="back-to-services-button"
              onClick={() => setShowServiceDetails(false)}
            >
              <span className="back-icon">←</span>
              {t('bebe_setting.details.back_to_services')}
            </button>

            {/* Service Title */}
            <h1 className="service-details-title">
              {selectedService.nom || selectedService.name || t('bebe_setting.category_not_available')}
            </h1>

            {/* Service Image */}
            <div className="service-details-image-container">
              <img
                src={
                  Array.isArray(selectedService.photo) 
                    ? (selectedService.photo[0] || '/images/bebe/default.jpg')
                    : (selectedService.photo || '/images/bebe/default.jpg')
                }
                alt={selectedService.nom || selectedService.name}
                className="service-details-image"
                onError={(e) => {
                  e.target.src = '/images/bebe/default.jpg';
                }}
              />
              <div className="service-image-overlay">
                <p className="service-image-text">
                  {selectedService.nom || selectedService.name || t('bebe_setting.category_not_available')}
                </p>
              </div>
            </div>

            {/* Service Description */}
            <div className="service-details-description">
              <p className="service-description-text">
                {selectedService.description || t('bebe_setting.description_not_available')}
              </p>
            </div>

            {/* Reserve Button */}
            <div className="service-details-actions">
              <button 
                className="reserve-caregiver-button"
                onClick={() => {
                  setShowReservationForm(true);
                }}
              >
                🍼 {t('bebe_setting.details.reserve_caregiver')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Form Modal */}
      {showReservationForm && selectedService && (
        <div className="reservation-modal">
          <div className="modal-backdrop" onClick={handleReservationCancel}></div>
          <div className="modal-content">
            <ReservationForm
              serviceId={selectedService.id}
              serviceType="bebe"
              onSuccess={handleReservationSuccess}
              onCancel={handleReservationCancel}
            />
          </div>
        </div>
      )}
    </main>
  );
}

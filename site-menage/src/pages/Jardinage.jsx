import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReservationForm from '../components/ReservationForm';
import RatingSection from '../components/RatingSection';
import { supabase } from '../lib/supabase';
import './Jardinage.css';

export default function Jardinage() {
  const { t, i18n } = useTranslation();
  
  // Function to get translated category name
  const getTranslatedCategoryName = (categoryName) => {
    if (!categoryName) return t('jardinage.category_not_available');
    
    // Direct translations for common categories
    const directTranslations = {
      'Plantation': t('jardinage.plantation', 'الزراعة'),
      'Entretien Jardin': t('jardinage.garden_maintenance', 'صيانة الحديقة'),
      'Aménagement Paysager': t('jardinage.landscaping', 'تنسيق المناظر الطبيعية'),
      'Tonte et Taille': t('jardinage.mowing_pruning', 'قص وتشذيب')
    };
    
    if (directTranslations[categoryName]) {
      return directTranslations[categoryName];
    }
    
    // Create category key from name
    const categoryKey = categoryName.toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    // Try multiple key variations
    const possibleKeys = [
      `jardinage.categories.${categoryKey}.name`,
      `jardinage.categories.${categoryName.toLowerCase().replace(/\s+/g, '_')}.name`,
      `jardinage.categories.${categoryName.toLowerCase().replace(/[éèêë]/g, 'e').replace(/[àáâãäå]/g, 'a').replace(/[ç]/g, 'c').replace(/\s+/g, '_')}.name`
    ];
    
    for (const key of possibleKeys) {
      const translation = t(key, { defaultValue: null });
      if (translation && translation !== key) {
        return translation;
      }
    }
    
    return categoryName; // Fallback to original name
  };

  // Function to get translated category description
  const getTranslatedCategoryDescription = (categoryName) => {
    if (!categoryName) return t('jardinage.description_not_available');
    
    // Direct translations for common categories
    const directTranslations = {
      'Plantation': t('jardinage.plantation_desc', 'زراعة الأشجار والشجيرات والزهور'),
      'Entretien Jardin': t('jardinage.garden_maintenance_desc', 'صيانة منتظمة لحديقتك'),
      'Aménagement Paysager': t('jardinage.landscaping_desc', 'تنسيق وتطوير المساحات الخضراء'),
      'Tonte et Taille': t('jardinage.mowing_pruning_desc', 'قص وتشذيب العشب والأشجار')
    };
    
    if (directTranslations[categoryName]) {
      return directTranslations[categoryName];
    }
    
    // Create category key from name
    const categoryKey = categoryName.toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    // Try multiple key variations
    const possibleKeys = [
      `jardinage.categories.${categoryKey}.description`,
      `jardinage.categories.${categoryName.toLowerCase().replace(/\s+/g, '_')}.description`,
      `jardinage.categories.${categoryName.toLowerCase().replace(/[éèêë]/g, 'e').replace(/[àáâãäå]/g, 'a').replace(/[ç]/g, 'c').replace(/\s+/g, '_')}.description`
    ];
    
    for (const key of possibleKeys) {
      const translation = t(key, { defaultValue: null });
      if (translation && translation !== key) {
        return translation;
      }
    }
    
    return categoryName; // Fallback to original name
  };

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [jardins, setJardins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    if (selectedCategory) {
      loadCategoryDetails(selectedCategory.id);
    } else {
      loadCategories();
    }
  }, [i18n.language]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[Jardinage] Loading categories from Supabase');
      
      const { data, error } = await supabase
        .from('jardinage_categories')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });
      
      if (error) {
        console.error('[Jardinage] Error loading categories:', error);
        setError(t('jardinage.errors.categories') + ': ' + error.message);
        return;
      }
      
      console.log('[Jardinage] Loaded categories:', data?.length || 0);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Jardinage] Exception loading categories:', err);
      setError(t('jardinage.errors.connection') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryDetails = async (categoryId) => {
    try {
      setLoadingDetails(true);
      setError('');
      console.log('[Jardinage] Loading category details for ID:', categoryId);
      
      const { data, error } = await supabase
        .from('jardins')
        .select('*')
        .eq('jardinage_category_id', categoryId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[Jardinage] Error loading services:', error);
        setError(t('jardinage.errors.details') + ': ' + error.message);
        return;
      }
      
      console.log('[Jardinage] Loaded services:', data?.length || 0);
      setJardins(Array.isArray(data) ? data : []);
      setSelectedCategory(categories.find(cat => cat.id === categoryId));
    } catch (err) {
      console.error('[Jardinage] Exception loading category details:', err);
      setError(t('jardinage.errors.connection') + ': ' + err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    loadCategoryDetails(categoryId);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setJardins([]);
    setShowServiceDetails(false);
    setSelectedService(null);
    setShowReservationForm(false);
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setShowServiceDetails(true);
  };

  const handleReservationSuccess = (data) => {
    setSuccessMessage(t('jardinage.success.reservation'));
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
      <div className="jardinage-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>{t('jardinage.loading.categories')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="jardinage-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={loadCategories} className="retry-button">
            {t('jardinage.errors.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="jardinage-page">
      <div className="jardinage-header">
        <div className="header-content">
          <h1 className="page-title">{t('jardinage.title')}</h1>
          <p className="page-subtitle">
            {t('jardinage.subtitle')}
          </p>
        </div>
        <div className="back-to-home">
          <Link to="/" className="back-button">
            <span className="back-icon">←</span>
            {t('jardinage.back_to_home')}
          </Link>
        </div>
      </div>

      <div className="jardinage-content">
        {!selectedCategory ? (
          <div className="categories-section">
            <h2 className="section-title">{t('jardinage.categories.title')}</h2>
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
                      let imageUrl = imagePath;
                      
                      // Convert Laravel paths to Supabase Storage URLs
                      if (imagePath && (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000') || imagePath.startsWith('/storage/') || imagePath.startsWith('/images/'))) {
                        const filename = imagePath.split('/').pop();
                        if (filename) {
                          const { data: { publicUrl } } = supabase.storage
                            .from('employees')
                            .getPublicUrl(filename);
                          imageUrl = publicUrl;
                        }
                      }
                      
                      return imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={category.name}
                          onError={(e) => {
                            console.log('[Jardinage] Image failed to load:', imageUrl);
                            e.target.src = '/images/jardinage/default.jpg';
                          }}
                        />
                      ) : (
                        <div className="category-image-placeholder">🌱</div>
                      );
                    })()}
                  </div>
                  <div className="category-content">
                    <h3 className="category-name">{category.name || t('jardinage.category_not_available')}</h3>
                    <p className="category-description">{category.description || t('jardinage.description_not_available')}</p>
                  </div>
                  <div className="category-overlay">
                    <span className="view-icon">🌱</span>
                    <span className="view-text">{t('jardinage.categories.view_services')}</span>
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
                {t('jardinage.services.back_to_categories')}
              </button>
              <h2 className="section-title">{selectedCategory.name}</h2>
            </div>

            {loadingDetails ? (
              <div className="loading-details">
                <div className="loader"></div>
                <p>{t('jardinage.loading.services')}</p>
              </div>
            ) : (
              <div className="jardins-grid">
                {jardins.length > 0 ? (
                  jardins.map((jardin) => (
                    <div key={jardin.id} className="jardin-card">
                      <div className="jardin-image">
                        <img
                          src={jardin.image_url || '/images/jardinage/default.jpg'}
                          alt={jardin.name}
                          onError={(e) => {
                            console.error('Image failed to load:', e.target.src);
                            e.target.src = '/images/jardinage/default.jpg';
                          }}
                          onLoad={(e) => {
                            console.log('Image loaded successfully:', e.target.src);
                            e.target.style.opacity = '1';
                          }}
                          style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                        />
                      </div>
                      <div className="jardin-content">
                        <h3 className="jardin-name">{jardin.name}</h3>
                        <p className="jardin-description">{jardin.description}</p>
                        <div className="jardin-details">
                          <div className="price-info">
                            <span className="price-label">{t('jardinage.services.price')}</span>
                            <span className="price-value">{jardin.price} DH</span>
                          </div>
                          <div className="duration-info">
                            <span className="duration-label">{t('jardinage.services.duration')}</span>
                            <span className="duration-value">{jardin.duration}</span>
                          </div>
                        </div>
                        <div className="jardin-actions">
                          <button 
                            className="details-button"
                            onClick={() => handleServiceClick(jardin)}
                          >
                            <span className="details-icon">👁️</span>
                            {t('jardinage.services.view_details')}
                          </button>
                          <button 
                            className="reserve-button"
                            onClick={() => {
                              setSelectedService(jardin);
                              setShowReservationForm(true);
                            }}
                          >
                            <span className="reserve-icon">📅</span>
                            {t('jardinage.services.reserve')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-services">
                    <div className="no-services-icon">🌿</div>
                    <p>{t('jardinage.services.no_services')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <div className="success-content">
            <span className="success-icon">✅</span>
            <span className="success-text">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Service Details Modal */}
      {showServiceDetails && selectedService && (
        <div className="service-details-modal">
          <div className="modal-backdrop" onClick={() => setShowServiceDetails(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedService.name}</h3>
              <button 
                className="close-modal"
                onClick={() => setShowServiceDetails(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="service-image">
                <img
                  src={selectedService.image_url || '/images/jardinage/default.jpg'}
                  alt={selectedService.name}
                  onError={(e) => {
                    e.target.src = '/images/jardinage/default.jpg';
                  }}
                />
              </div>
              <div className="service-info">
                <p className="service-description">{selectedService.description}</p>
                <div className="service-details">
                  <div className="detail-item">
                    <span className="detail-label">{t('jardinage.services.price')}</span>
                    <span className="detail-value">{selectedService.price} DH</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t('jardinage.services.duration')}</span>
                    <span className="detail-value">{selectedService.duration}</span>
                  </div>
                </div>
                <div className="service-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setShowServiceDetails(false);
                      setShowReservationForm(true);
                    }}
                  >
                    📅 {t('jardinage.services.reserve_service')}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <RatingSection 
                serviceId={selectedService.id} 
                serviceType="jardinage" 
              />
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
              serviceType="jardinage"
              onSuccess={handleReservationSuccess}
              onCancel={handleReservationCancel}
            />
          </div>
        </div>
      )}
    </main>
  );
}

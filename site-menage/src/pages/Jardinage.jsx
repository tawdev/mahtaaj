import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReservationForm from '../components/ReservationForm';
import RatingSection from '../components/RatingSection';
import { supabase } from '../lib/supabase';
import './Jardinage.css';

export default function Jardinage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Function to get translated category name
  const getTranslatedCategoryName = (category) => {
    if (!category) return t('jardinage.category_not_available');

    const lang = i18n.language;
    if (lang === 'ar' && category.name_ar) return category.name_ar;
    if (lang === 'fr' && category.name_fr) return category.name_fr;
    if (lang === 'en' && category.name_en) return category.name_en;

    const categoryName = category.name;
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

    return categoryName;
  };

  // Function to get translated category description
  const getTranslatedCategoryDescription = (category) => {
    if (!category) return t('jardinage.description_not_available');

    const lang = i18n.language;
    if (lang === 'ar' && category.description_ar) return category.description_ar;
    if (lang === 'fr' && category.description_fr) return category.description_fr;
    if (lang === 'en' && category.description_en) return category.description_en;

    const categoryName = category.name;
    if (!categoryName) return t('jardinage.description_not_available');

    // Direct translations for common categories descriptions
    const directTranslations = {
      'Plantation': t('jardinage.plantation_desc', 'زراعة الأشجار والشجيرات والزهور'),
      'Entretien Jardin': t('jardinage.garden_maintenance_desc', 'صيانة منتظمة لحديقتك'),
      'Aménagement Paysager': t('jardinage.landscaping_desc', 'تنسيق وتطوير المساحات الخضراء'),
      'Tonte et Taille': t('jardinage.mowing_pruning_desc', 'قص وتشذيب العشب والأشجار')
    };

    if (directTranslations[categoryName]) {
      return directTranslations[categoryName];
    }

    return category.description || t('jardinage.description_not_available');
  };

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [jardins, setJardins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
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

    // Check for pending reservation context
    const pending = sessionStorage.getItem('jardinage_pending_context');
    if (pending) {
      try {
        const { pendingReservation, categoryId } = JSON.parse(pending);
        if (pendingReservation) {
          console.log('[Jardinage] Auto-redirecting to reservation page for category:', categoryId);
          sessionStorage.removeItem('jardinage_pending_context');
          navigate(`/jardinage/reservation/${categoryId}`);
        }
      } catch (err) {
        console.error('Error parsing pending context:', err);
      }
    }
  }, [i18n.language, navigate]);

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

      // Fetch the specific category first to set selectedCategory
      const { data: categoryData, error: categoryError } = await supabase
        .from('jardinage_categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (categoryError) {
        console.error('[Jardinage] Error loading single category:', categoryError);
        setError(t('jardinage.errors.categories') + ': ' + categoryError.message);
        setLoadingDetails(false);
        return;
      }
      setSelectedCategory(categoryData);

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
    } catch (err) {
      console.error('[Jardinage] Exception loading category details:', err);
      setError(t('jardinage.errors.connection') + ': ' + err.message);
    } finally {
      setLoadingDetails(false);
    }
  };


  const handleReserve = async (categoryId) => {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Set pending context to re-trigger after login
      sessionStorage.setItem('jardinage_pending_context', JSON.stringify({
        pendingReservation: true,
        categoryId: categoryId
      }));

      // Store returnUrl as the current page (Jardinage)
      localStorage.setItem('auth_return_url', '/jardinage');

      // Short delay for stability
      setTimeout(() => {
        navigate('/login-register', { state: { returnUrl: '/jardinage' } });
      }, 500);
      return;
    }

    navigate(`/jardinage/reservation/${categoryId}`);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setJardins([]);
    setShowServiceDetails(false);
    setSelectedService(null);
    navigate('/jardinage'); // Navigate back to the base /jardinage URL
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setShowServiceDetails(true);
  };

  const handleReservationSuccess = () => {
    setSuccessMessage(t('jardinage.success.reservation'));
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  const handleReservationCancel = () => {
    setSelectedService(null);
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
      {/* Back Button Container */}
      <div className="back-button-container">
        <Link
          to="/tous-les-services"
          className="hand-workers-back-button"
          title={i18n.language === 'ar' ? 'العودة' : i18n.language === 'fr' ? 'Retour' : 'Back'}
        >
          ← {i18n.language === 'ar' ? 'العودة' :
            i18n.language === 'fr' ? 'Retour' :
              'Back'}
        </Link>
      </div>

      <div className="jardinage-header">
        <div className="header-content">
          <h1 className="page-title">{t('jardinage.title')}</h1>
          <p className="page-subtitle">
            {t('jardinage.subtitle')}
          </p>
        </div>
      </div>

      <div className="jardinage-content">
        {!selectedCategory ? (
          <div className="categories-section">
            <h2 className="section-title">{t('jardinage.categories.title')}</h2>
            <div className="jardinage-categories-grid">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/jardinage/details/${category.id}`}
                  className="jardinage-category-card"
                >
                  <div className="jardinage-category-image">
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
                          alt={getTranslatedCategoryName(category)}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const placeholder = e.target.nextElementSibling;
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null;
                    })()}
                    <div className="jardinage-category-image-placeholder" style={{ display: category.image ? 'none' : 'flex' }}>
                      🌱
                    </div>
                    {/* Category Name + short description Overlay */}
                    <div className="jardinage-category-name-overlay">
                      <div className="jardinage-category-name-line">
                        <span className="jardinage-category-name">
                          {getTranslatedCategoryName(category)}
                        </span>
                      </div>
                      <div className="jardinage-category-desc-line">
                        <span className="jardinage-category-description-overlay">
                          {getTranslatedCategoryDescription(category)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="jardinage-category-overlay">

                    <span className="view-text">{t('jardinage.categories.view_services')}</span>
                  </div>
                </Link>
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
              <h2 className="section-title">
                {getTranslatedCategoryName(selectedCategory)}
              </h2>
            </div>

            {loadingDetails ? (
              <div className="loading-details">
                <div className="loader"></div>
                <p>{t('jardinage.loading.services')}</p>
              </div>
            ) : (
              <div className="jardinage-jardins-grid">
                {jardins.length > 0 ? (
                  jardins.map((jardin) => (
                    <div key={jardin.id} className="jardin-card">
                      <div className="jardin-image">
                        <img
                          src={jardin.image_url || '/images/jardinage/default.jpg'}
                          alt={i18n.language === 'ar' ? (jardin.name_ar || jardin.name) :
                            i18n.language === 'fr' ? (jardin.name_fr || jardin.name) :
                              (jardin.name_en || jardin.name) || jardin.name}
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
                        <h3 className="jardin-name">
                          {i18n.language === 'ar' ? (jardin.name_ar || jardin.name) :
                            i18n.language === 'fr' ? (jardin.name_fr || jardin.name) :
                              (jardin.name_en || jardin.name) || jardin.name}
                        </h3>
                        <p className="jardin-description">
                          {i18n.language === 'ar' ? (jardin.description_ar || jardin.description) :
                            i18n.language === 'fr' ? (jardin.description_fr || jardin.description) :
                              (jardin.description_en || jardin.description) || jardin.description}
                        </p>
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
                            onClick={() => handleReserve(selectedCategory.id)}
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
              <h3>
                {i18n.language === 'ar' ? (selectedService.name_ar || selectedService.name) :
                  i18n.language === 'fr' ? (selectedService.name_fr || selectedService.name) :
                    (selectedService.name_en || selectedService.name) || selectedService.name}
              </h3>
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
                  alt={i18n.language === 'ar' ? (selectedService.name_ar || selectedService.name) :
                    i18n.language === 'fr' ? (selectedService.name_fr || selectedService.name) :
                      (selectedService.name_en || selectedService.name) || selectedService.name}
                  onError={(e) => {
                    e.target.src = '/images/jardinage/default.jpg';
                  }}
                />
              </div>
              <div className="service-info">
                <p className="service-description">
                  {i18n.language === 'ar' ? (selectedService.description_ar || selectedService.description) :
                    i18n.language === 'fr' ? (selectedService.description_fr || selectedService.description) :
                      (selectedService.description_en || selectedService.description) || selectedService.description}
                </p>
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
                    onClick={() => handleReserve(selectedCategory.id)}
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
    </main>
  );
}

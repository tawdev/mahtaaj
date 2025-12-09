import React, { useState, useEffect } from 'react';
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

  // Load first service automatically when categories are loaded
  useEffect(() => {
    const loadFirstServiceAuto = async () => {
      if (categories.length > 0 && !selectedService && !selectedCategory) {
        const firstCategory = categories[0];
        const { data } = await supabase
          .from('bebe_settings')
          .select('*')
          .eq('category_id', firstCategory.id)
          .eq('is_active', true)
          .order('order', { ascending: true })
          .limit(1);
        
        if (data && data.length > 0) {
          setSelectedService(data[0]);
          setSelectedCategory(firstCategory);
        }
      }
    };
    
    if (categories.length > 0) {
      loadFirstServiceAuto();
    }
  }, [categories]);

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
      // Log first setting to verify data structure (for debugging)
      if (data && data.length > 0 && process.env.NODE_ENV === 'development') {
        console.log('[BebeSetting] First setting sample:', {
          id: data[0].id,
          nom: data[0].nom,
          price: data[0].price,
          duration: data[0].duration,
          description: data[0].description,
          description_ar: data[0].description_ar,
          description_fr: data[0].description_fr,
          description_en: data[0].description_en
        });
      }
      setSettings(Array.isArray(data) ? data : []);
      setSelectedCategory(categories.find(cat => cat.id === categoryId));
      
      // Auto-select first service if available
      if (data && data.length > 0) {
        setSelectedService(data[0]);
        console.log('[BebeSetting] Auto-selected first service:', data[0].id, 'Price:', data[0].price);
      } else {
        setSelectedService(null);
      }
    } catch (err) {
      console.error('[BebeSetting] Exception loading category details:', err);
      setError(t('bebe_setting.errors.connection') + ': ' + err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCategoryClick = async (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setSelectedCategory(category);
      // Load services to get price and duration for reservation
      await loadCategoryDetails(categoryId);
      // Set the first service as selected for reservation if available
      const { data, error } = await supabase
        .from('bebe_settings')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('order', { ascending: true })
        .limit(1);
      
      if (error) {
        console.error('[BebeSetting] Error loading first service:', error);
      }
      
      if (data && data.length > 0) {
        console.log('[BebeSetting] Setting selectedService:', {
          id: data[0].id,
          price: data[0].price,
          duration: data[0].duration
        });
        setSelectedService(data[0]);
      } else {
        console.warn('[BebeSetting] No services found for category:', categoryId);
        setSelectedService(null);
      }
    }
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

  // Helper function to get localized description
  const getLocalizedDescription = (setting) => {
    if (!setting) {
      console.warn('[BebeSetting] getLocalizedDescription: setting is null/undefined');
      return t('bebe_setting.description_not_available');
    }
    
    const lang = (i18n.language || 'fr').toString().split(/[-_]/)[0].toLowerCase();
    
    // Try language-specific description first
    if (lang === 'ar' && setting.description_ar && setting.description_ar.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[BebeSetting] Using description_ar for setting:', setting.id);
      }
      return setting.description_ar.trim();
    }
    if (lang === 'fr' && setting.description_fr && setting.description_fr.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[BebeSetting] Using description_fr for setting:', setting.id);
      }
      return setting.description_fr.trim();
    }
    if (lang === 'en' && setting.description_en && setting.description_en.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[BebeSetting] Using description_en for setting:', setting.id);
      }
      return setting.description_en.trim();
    }
    
    // Fallback to main description field
    if (setting.description && setting.description.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[BebeSetting] Using description (fallback) for setting:', setting.id);
      }
      return setting.description.trim();
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('[BebeSetting] No description found for setting:', setting.id, 'Available fields:', {
        description: setting.description,
        description_ar: setting.description_ar,
        description_fr: setting.description_fr,
        description_en: setting.description_en
      });
    }
    return t('bebe_setting.description_not_available');
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
          {/* Back Button Container */}
          <div className="back-button-container">
            <button
              type="button"
              className="hand-workers-back-button"
              onClick={() => window.history.back()}
              title={i18n.language === 'ar' ? 'رجوع' : i18n.language === 'fr' ? 'Retour' : 'Back'}
            >
              ← {i18n.language === 'ar' ? 'رجوع' : 
                 i18n.language === 'fr' ? 'Retour' : 
                 'Back'}
            </button>
          </div>

          <div className="bebe-setting-header">
            <div className="header-content">
              <h1 className="page-title">
                {i18n.language === 'ar' ? 'رعاية الأطفال' : 
                 i18n.language === 'fr' ? 'soins pour les enfants' : 
                 'Childcare'}
              </h1>
              <p className="page-subtitle">
                {i18n.language === 'ar' ? 'تجهيز وتزيين غرفة الطفل' : 
                 i18n.language === 'fr' ? 'Aménagement et décoration de chambre pour bébé' : 
                 'Baby room setup and decoration'}
              </p>
            </div>
          </div>

          <div className="bebe-setting-content">
            <div className="service-info-card" style={{
              maxWidth: '800px',
              margin: '0 auto',
              padding: '32px',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              {/* Service Image */}
              <div style={{
                marginBottom: '24px',
                borderRadius: '12px',
                overflow: 'hidden',
                maxHeight: '300px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#f3f4f6'
              }}>
                {(() => {
                  // Try to get image from selectedService first
                  let imagePath = null;
                  if (selectedService) {
                    imagePath = Array.isArray(selectedService.photo) 
                      ? selectedService.photo[0] 
                      : (selectedService.photo || selectedService.image);
                  }
                  
                  // If no service image, try to get from selectedCategory
                  if (!imagePath && selectedCategory) {
                    imagePath = selectedCategory.image;
                  }
                  
                  // If still no image, try first category image
                  if (!imagePath && categories.length > 0) {
                    imagePath = categories[0].image;
                  }
                  
                  const imageUrl = imagePath ? getImageUrl(imagePath) : null;
                  const defaultImage = '/serveces/a_مربية_أطفال_مغربية_ت.png';
                  
                  return (
                    <img
                      src={imageUrl || defaultImage}
                      alt={i18n.language === 'ar' ? 'رعاية الأطفال' : 
                           i18n.language === 'fr' ? 'soins pour les enfants' : 
                           'Childcare'}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '300px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.target.src = defaultImage;
                      }}
                    />
                  );
                })()}
              </div>

              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '16px',
                color: '#1f2937'
              }}>
                {i18n.language === 'ar' ? 'رعاية الأطفال' : 
                 i18n.language === 'fr' ? 'soins pour les enfants' : 
                 'Childcare'}
              </h2>
              
              <p style={{
                fontSize: '18px',
                color: '#6b7280',
                marginBottom: '32px',
                lineHeight: '1.6'
              }}>
                {i18n.language === 'ar' ? 'تجهيز وتزيين غرفة الطفل' : 
                 i18n.language === 'fr' ? 'Aménagement et décoration de chambre pour bébé' : 
                 'Baby room setup and decoration'}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '32px',
                marginBottom: '32px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    {i18n.language === 'ar' ? 'السعر:' : 
                     i18n.language === 'fr' ? 'Prix:' : 
                     'Price:'}
                  </span>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#10b981'
                  }}>
                    250 DH
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    {i18n.language === 'ar' ? 'المدة:' : 
                     i18n.language === 'fr' ? 'Durée:' : 
                     'Duration:'}
                  </span>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#3b82f6'
                  }}>
                    {i18n.language === 'ar' ? '7 ساعات' : 
                     i18n.language === 'fr' ? '7 heures' : 
                     '7 hours'}
                  </span>
                </div>
              </div>

              <button 
                className="reserve-button"
                onClick={async () => {
                  // Load first service if not already loaded
                  if (!selectedService && categories.length > 0) {
                    const firstCategory = categories[0];
                    await handleCategoryClick(firstCategory.id);
                  }
                  
                  if (selectedService) {
                    setShowReservationForm(true);
                  } else {
                    // If no service found, try to load the first one
                    const loadFirstService = async () => {
                      if (categories.length > 0) {
                        const firstCategory = categories[0];
                        const { data } = await supabase
                          .from('bebe_settings')
                          .select('*')
                          .eq('category_id', firstCategory.id)
                          .eq('is_active', true)
                          .order('order', { ascending: true })
                          .limit(1);
                        
                        if (data && data.length > 0) {
                          setSelectedService(data[0]);
                          setSelectedCategory(firstCategory);
                          setShowReservationForm(true);
                        }
                      }
                    };
                    loadFirstService();
                  }
                }}
                style={{
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#ffffff',
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#059669';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#10b981';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <span>📅</span>
                {i18n.language === 'ar' ? 'احجز' : 
                 i18n.language === 'fr' ? 'Réserver' : 
                 'Reserve'}
              </button>
            </div>
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
                  (() => {
                    const imagePath = Array.isArray(selectedService.photo) 
                      ? selectedService.photo[0] 
                      : (selectedService.photo || selectedService.image);
                    const imageUrl = imagePath ? getImageUrl(imagePath) : null;
                    return imageUrl || '/serveces/a_مربية_أطفال_مغربية_ت.png';
                  })()
                }
                alt={selectedService.nom || selectedService.name}
                className="service-details-image"
                onError={(e) => {
                  e.target.src = '/serveces/a_مربية_أطفال_مغربية_ت.png';
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
                {getLocalizedDescription(selectedService)}
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
              categoryId={selectedService.category_id || selectedCategory?.id || null}
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

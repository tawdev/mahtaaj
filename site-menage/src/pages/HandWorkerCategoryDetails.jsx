import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import i18n from '../i18n';
import './HandWorkers.css';

export default function HandWorkerCategoryDetails() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadCategory();
    }
  }, [id]);

  const getCurrentLang = () => (localStorage.getItem('currentLang') || i18n.language || 'fr').split(/[-_]/)[0].toLowerCase();

  const getLocalizedValue = (item, field) => {
    if (!item) return '';
    const lang = getCurrentLang();
    const value = item[`${field}_${lang}`] || item[`${field}_fr`] || item[`${field}`] || '';
    if (value) return value;
    if (lang === 'ar') return 'غير متوفر';
    if (lang === 'en') return 'Not available';
    return 'Non disponible';
  };

  const getNumberLocale = () => {
    const lang = getCurrentLang();
    if (lang === 'ar') return 'ar-MA';
    if (lang === 'en') return 'en-US';
    return 'fr-FR';
  };

  const formatNumericValue = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return String(value);
    return new Intl.NumberFormat(getNumberLocale(), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numeric);
  };

  const formatPriceValue = (value) => {
    const formatted = formatNumericValue(value);
    if (!formatted) {
      return t('hand_workers.price_not_available', { defaultValue: '—' });
    }
    const currency = t('hand_workers.currency_unit', { defaultValue: 'DH' });
    return `${formatted} ${currency}`;
  };

  const formatMinimumJoursValue = (value) => {
    const formatted = formatNumericValue(value);
    if (!formatted) {
      return t('hand_workers.minimum_jours_not_available', { defaultValue: '—' });
    }
    const suffix = t('hand_workers.jours_suffix', { defaultValue: ' jour(s)' });
    return `${formatted}${suffix}`;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a Supabase URL, return it
    if (imagePath.includes('supabase.co/storage')) {
      return imagePath;
    }
    
    // If it's an old Laravel path, extract filename and try to get from Supabase
    if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000') || imagePath.startsWith('/storage/') || imagePath.startsWith('/images/') || imagePath.startsWith('/uploads/')) {
      const filename = imagePath.split('/').pop();
      if (filename) {
        const { data: { publicUrl } } = supabase.storage
          .from('employees')
          .getPublicUrl(filename);
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

  const shouldHideMonthlyMessage = (category) => {
    if (!category) return false;
    const categoryName = getLocalizedValue(category, 'name');
    const excludedNames = [
      'Ouvrier des égouts',
      'Serrurier',
      'Menuisier',
      'عامل الصرف الصحي',
      'الحداد',
      'النجار',
      'Sewer Worker',
      'Locksmith',
      'Carpenter'
    ];
    return excludedNames.includes(categoryName);
  };

  const loadCategory = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[HandWorkerCategoryDetails] Loading category with ID:', id);
      
      const { data, error } = await supabase
        .from('hand_worker_categories')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('[HandWorkerCategoryDetails] Error loading category:', error);
        setError(t('hand_workers.loading_error') || 'Error loading category');
        return;
      }
      
      if (!data) {
        setError('Category not found');
        return;
      }
      
      console.log('[HandWorkerCategoryDetails] Category loaded:', data);
      setCategory(data);
    } catch (e) {
      console.error('[HandWorkerCategoryDetails] Exception loading category:', e);
      setError('Error loading category: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="hand-workers-page">
        <div className="loading-state" style={{textAlign: 'center', margin: '40px 0'}}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          <p style={{color: '#64748b', fontSize: '0.95rem'}}>{t('hand_workers.loading') || 'Chargement...'}</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </main>
    );
  }

  if (error || !category) {
    return (
      <main className="hand-workers-page">
        <div className="error-state" style={{
          color: 'red',
          textAlign: 'center',
          margin: '20px 0',
          padding: '12px',
          background: '#fee2e2',
          borderRadius: '8px'
        }}>
          {error || 'Category not found'}
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => navigate('/hand-workers')}
            className="back-button"
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ← {t('hand_workers.back_to_categories') || 'Retour aux Catégories'}
          </button>
        </div>
      </main>
    );
  }

  const categoryName = getLocalizedValue(category, 'name');
  const categoryDescription = getLocalizedValue(category, 'description');
  const imageUrl = getImageUrl(category.image);

  return (
    <main className="hand-workers-page">
      <div className="category-details-section">
        <div className="category-header">
          <button 
            className="back-button" 
            onClick={() => navigate('/hand-workers')}
            data-aos="fade-up" 
            data-aos-delay="100"
          >
            ← {t('hand_workers.back_to_categories') || 'Retour aux Catégories'}
          </button>
          <h2 className="category-details-title" data-aos="fade-up" data-aos-delay="200">
            {categoryName}
          </h2>
        </div>

        <div className="category-info" data-aos="fade-up" data-aos-delay="300">
          <div className="category-info-card">
            <div className="category-info-header">
              {imageUrl ? (
                <div className="category-info-image">
                  <img
                    src={imageUrl}
                    alt={categoryName}
                    className="category-detail-image"
                    onError={(e) => {
                      console.log('[HandWorkerCategoryDetails] Detail image failed to load:', imageUrl);
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="category-info-icon" style={{display: 'none'}}>
                    {category.icon ? (
                      <i className={category.icon}></i>
                    ) : (
                      <i className="fas fa-tools"></i>
                    )}
                  </div>
                </div>
              ) : (
                <div className="category-info-icon">
                  {category.icon ? (
                    <i className={category.icon}></i>
                  ) : (
                    <i className="fas fa-tools"></i>
                  )}
                </div>
              )}
              <div className="category-info-details">
                <h3>{categoryName}</h3>
                <p>{categoryDescription}</p>
              </div>
            </div>
            <div className="category-info-pricing">
              <div className="pricing-item">
                <span className="pricing-label">{t('hand_workers.price_per_day') || 'Prix par jour'}</span>
                <span className="pricing-value">{formatPriceValue(category.price_per_day || category.price_per_hour)}</span>
              </div>
              <div className="pricing-item">
                <span className="pricing-label">{t('hand_workers.minimum_jours') || 'Jours minimum'}</span>
                <span className="pricing-value">{formatMinimumJoursValue(category.minimum_jours)}</span>
              </div>
            </div>
            {!shouldHideMonthlyMessage(category) && category.minimum_jours > 1 && (
              <div className="category-info-message">
                <p className="message-text">{t('hand_workers.less_than_month_booking_message', 'أقل من شهر — المرجو الضغط على هذا الزر لحجز موعد')}</p>
                <Link 
                  to={`/hand-workers/appointment?category=${category.id}`}
                  className="booking-button-inline"
                >
                  {t('hand_workers.book_appointment', 'Réserver un rendez-vous')}
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="reservation-section" data-aos="fade-up" data-aos-delay="600">
          <div className="reservation-card">
            <h3>{t('hand_workers.book_service')}</h3>
            <p>{t('hand_workers.book_service_description')}</p>
            <Link 
              to={`/hand-workers/booking?category=${category.id}`}
              className="booking-button"
            >
              {t('hand_workers.book_now')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}


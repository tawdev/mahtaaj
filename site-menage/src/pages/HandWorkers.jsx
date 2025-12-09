import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import CategoryCard from '../components/CategoryCard';
import i18n from '../i18n';
import { supabase } from '../lib/supabase';
import './HandWorkers.css';

export default function HandWorkers() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load categories function with useCallback
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[HandWorkers] Loading categories from Supabase');
      
      const { data, error } = await supabase
        .from('hand_worker_categories')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });
      
      if (error) {
        console.error('[HandWorkers] Error loading categories:', error);
        setError(t('hand_workers.loading_error') + ': ' + error.message);
        setCategories([]); // Ensure categories is set even on error
        setLoading(false); // Make sure loading is set to false on error
        return;
      }
      
      console.log('[HandWorkers] Loaded categories:', data?.length || 0);
      console.log('[HandWorkers] Categories data:', data);
      
      // Ensure we set categories even if data is null/undefined
      const categoriesData = Array.isArray(data) ? data : [];
      
      // Set categories first, then loading to false
      setCategories(categoriesData);
      console.log('[HandWorkers] Categories state updated, count:', categoriesData.length);
      
      // Force a re-render by ensuring state update completes
      if (categoriesData.length === 0) {
        console.warn('[HandWorkers] No categories found');
      }
    } catch (e) {
      console.error('[HandWorkers] Exception loading categories:', e);
      setError(t('hand_workers.loading_error') + ': ' + e.message);
      setCategories([]); // Ensure categories is set even on error
    } finally {
      setLoading(false);
      console.log('[HandWorkers] Loading set to false');
    }
  }, [t]);

  // Initial load on mount - only once
  useEffect(() => {
    let isMounted = true;
    let cancelled = false;
    
    const fetchData = async () => {
      if (!isMounted || cancelled) {
        console.log('[HandWorkers] Component unmounted or cancelled, skipping fetch');
        return;
      }
      
      try {
        console.log('[HandWorkers] Starting initial data fetch...');
        await loadCategories();
        console.log('[HandWorkers] Initial data fetch completed');
      } catch (error) {
        if (!cancelled && isMounted) {
          console.error('[HandWorkers] Error in initial load:', error);
          setError(t('hand_workers.loading_error') + ': ' + (error.message || 'Unknown error'));
          setLoading(false);
        }
      }
    };
    
    // Start loading immediately
    fetchData();
    
    return () => {
      console.log('[HandWorkers] Cleanup: cancelling fetch');
      isMounted = false;
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Persist language and set direction when language changes
  useEffect(() => {
    const lang = (i18n.language || localStorage.getItem('currentLang') || 'fr').split(/[-_]/)[0].toLowerCase();
    try { localStorage.setItem('currentLang', lang); } catch {}
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
  }, [i18n.language]);

  // Ensure header is visible immediately on mount (before any async operations)
  useEffect(() => {
    // Force header visibility immediately - this runs synchronously on mount
    const forceVisibility = () => {
      const header = document.querySelector('.hand-workers-header');
      const titleSection = document.querySelector('.hand-workers-title-section');
      const title = document.querySelector('.hand-workers-title');
      const subtitle = document.querySelector('.hand-workers-subtitle');
      const actions = document.querySelector('.hand-workers-actions');
      
      [header, titleSection, title, subtitle, actions].forEach(el => {
        if (el) {
          el.style.display = el === actions ? 'flex' : 'block';
          el.style.visibility = 'visible';
          el.style.opacity = '1';
          el.style.animation = 'none';
          el.style.transform = 'none';
        }
      });
    };
    
    // Run immediately
    forceVisibility();
    
    // Also run after a tiny delay to ensure it overrides any CSS animations
    const timeoutId = setTimeout(forceVisibility, 10);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Force re-render when categories are loaded (for mobile compatibility)
  useEffect(() => {
    if (categories.length > 0 && !loading) {
      console.log('[HandWorkers] Categories loaded, forcing visibility check');
      // Force a re-render by updating a dummy state if needed
      // This helps ensure content is visible on mobile
    }
  }, [categories.length, loading]);


  const getCurrentLang = () => (localStorage.getItem('currentLang') || i18n.language || 'fr').split(/[-_]/)[0].toLowerCase();

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

  // Helper: localized value with per-lang fallback and language-specific default text
  const getLocalizedValue = (item, field) => {
    const lang = getCurrentLang();
    const value = (item && (item[`${field}_${lang}`] || item[`${field}_fr`] || item[`${field}`])) || '';
    if (value) return value;
    if (lang === 'ar') return 'غير متوفر';
    if (lang === 'en') return 'Not available';
    return 'Non disponible';
  };

  // Check if category name should hide the monthly booking message
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

  // Helper function to get image URL from Supabase Storage
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
        console.log('[HandWorkers] Converting Laravel path to Supabase:', imagePath, '-> filename:', filename);
        const { data: { publicUrl } } = supabase.storage
          .from('employees')
          .getPublicUrl(filename);
        console.log('[HandWorkers] Generated Supabase URL:', publicUrl);
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

  const handleCategorySelect = (category) => {
    // Navigate to category details page instead of showing in same page
    navigate(`/hand-workers/category/${category.id}`);
  };

  // Debug: Log current state on every render
  console.log('[HandWorkers] Render state:', { 
    loading, 
    categoriesCount: categories.length, 
    error: !!error,
    hasCategories: categories.length > 0
  });

  return (
    <main className="hand-workers-page">
      {/* Back Button Container */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 20px',
        marginTop: '20px',
        marginBottom: '20px'
      }}>
        <button 
          className="hand-workers-back-button"
          onClick={() => navigate('/tous-les-services')}
          title={t('common.back', { defaultValue: 'Retour' })}
        >
          ← {t('common.back', { defaultValue: 'Retour' })}
        </button>
      </div>

      {/* Header - Always visible, not dependent on loading state */}
      <div 
        className="hand-workers-header"
        style={{
          display: 'block',
          visibility: 'visible',
          opacity: 1,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div 
          className="hand-workers-title-section"
          style={{
            display: 'block',
            visibility: 'visible',
            opacity: 1,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <h1 
            className="hand-workers-title" 
            data-aos="fade-up" 
            data-aos-delay="100"
            style={{
              display: 'block',
              visibility: 'visible',
              opacity: 1,
              animation: 'none',
              transform: 'none'
            }}
          >
            {t('hand_workers.title')}
          </h1>
          <p 
            className="hand-workers-subtitle" 
            data-aos="fade-up" 
            data-aos-delay="200"
            style={{
              display: 'block',
              visibility: 'visible',
              opacity: 1,
              animation: 'none',
              transform: 'none'
            }}
          >
            {t('hand_workers.subtitle')}
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="error-state" style={{
          color: 'red',
          textAlign: 'center',
          margin: '20px 0',
          padding: '12px',
          background: '#fee2e2',
          borderRadius: '8px'
        }}>
          {error}
        </div>
      )}

      {/* Loading state - only show when loading and no categories yet */}
      {loading && categories.length === 0 && !error && (
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
          <p style={{color: '#64748b', fontSize: '0.95rem'}}>{t('hand_workers.loading')}</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Empty state - no categories and not loading */}
      {!loading && categories.length === 0 && !error && (
        <div style={{textAlign: 'center', margin: '40px 0', color: '#64748b'}}>
          <p>{t('hand_workers.no_categories_available') || 'No categories available'}</p>
        </div>
      )}

      <div className="hand-workers-content">
        {categories.length > 0 && (
          <div 
            className="categories-section"
            style={{
              display: 'block',
              visibility: 'visible',
              opacity: 1,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
          >
            <h2 
              className="section-title" 
              data-aos="fade-up" 
              data-aos-delay="300"
              style={{
                display: 'block',
                visibility: 'visible',
                opacity: 1
              }}
            >
              {t('hand_workers.choose_category')}
            </h2>
            <div 
              className="categories-grid"
              style={{
                display: 'grid',
                visibility: 'visible',
                opacity: 1,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}
              key={`categories-grid-${categories.length}`}
            >
              {categories.map((category, index) => {
                if (!category || !category.id) {
                  console.warn('[HandWorkers] Invalid category at index:', index, category);
                  return null;
                }
                const localized = {
                  ...category,
                  name: getLocalizedValue(category, 'name'),
                  description: getLocalizedValue(category, 'description'),
                  imageUrl: category.image ? getImageUrl(category.image) : null
                };
                return (
                  <CategoryCard
                    key={category.id || `category-${index}`}
                    category={localized}
                    onClick={handleCategorySelect}
                    index={index}
                  />
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

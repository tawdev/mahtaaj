import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import './JardinageDetail.css';

export default function JardinageDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [category, setCategory] = useState(null);
  const [jardins, setJardins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingServices, setLoadingServices] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    if (id) {
      loadCategory();
    }

    // Check for success message from reservation page
    if (location.state?.reservationSuccess) {
      setSuccessMessage(t('jardinage.success.reservation', 'Réservation réussie'));
      // Clear location state to prevent toast on refresh
      window.history.replaceState({}, document.title);
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }

    // Check for pending reservation context
    const pending = sessionStorage.getItem('jardinage_pending_context');
    if (pending) {
      try {
        const { pendingReservation, categoryId } = JSON.parse(pending);
        if (pendingReservation && categoryId === id) {
          console.log('[JardinageDetail] Auto-redirecting to reservation page for category:', categoryId);
          sessionStorage.removeItem('jardinage_pending_context');
          navigate(`/jardinage/reservation/${categoryId}`);
        }
      } catch (err) {
        console.error('Error parsing pending context:', err);
      }
    }
  }, [id, i18n.language, location.state, navigate]);

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

  // Helper function to get image URL from Supabase Storage
  const getImageUrl = React.useCallback((imagePath) => {
    if (!imagePath) return null;

    if (imagePath.includes('supabase.co/storage')) {
      return imagePath;
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000') ||
      imagePath.startsWith('/storage/') || imagePath.startsWith('/images/')) {
      const filename = imagePath.split('/').pop();
      if (filename) {
        const { data: { publicUrl } } = supabase.storage
          .from('employees')
          .getPublicUrl(filename);
        return publicUrl;
      }
      return null;
    }

    if (!imagePath.includes('/') && !imagePath.includes('http')) {
      const { data: { publicUrl } } = supabase.storage
        .from('employees')
        .getPublicUrl(imagePath);
      return publicUrl;
    }

    return null;
  }, []);

  const loadCategory = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('[JardinageDetail] Loading category ID:', id);

      const { data, error } = await supabase
        .from('jardinage_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[JardinageDetail] Error loading category:', error);
        setError(t('jardinage.errors.category_not_found', 'Catégorie non trouvée'));
        return;
      }

      console.log('[JardinageDetail] Loaded category:', data);
      setCategory(data);

      // Load services for this category
      await loadServices(data.id);
    } catch (err) {
      console.error('[JardinageDetail] Exception loading category:', err);
      setError(t('jardinage.errors.connection', 'Erreur de connexion') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (categoryId) => {
    try {
      setLoadingServices(true);

      const { data, error } = await supabase
        .from('jardins')
        .select('*')
        .eq('jardinage_category_id', categoryId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[JardinageDetail] Error loading services:', error);
        return;
      }

      console.log('[JardinageDetail] Loaded services:', data?.length || 0);
      setJardins(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[JardinageDetail] Exception loading services:', err);
    } finally {
      setLoadingServices(false);
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

      // Store returnUrl as the current page (Jardinage detail)
      localStorage.setItem('auth_return_url', `/jardinage/details/${categoryId}`);

      // Short delay for stability
      setTimeout(() => {
        navigate('/login-register', { state: { returnUrl: `/jardinage/details/${categoryId}` } });
      }, 500);
      return;
    }

    navigate(`/jardinage/reservation/${categoryId}`);
  };

  const handleReservationSuccess = () => {
    setSuccessMessage(t('jardinage.success.reservation', 'Réservation réussie'));
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  if (loading) {
    return (
      <div className="jardinage-detail-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>{t('jardinage.loading.category', 'Chargement de la catégorie...')}</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="jardinage-detail-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error || t('jardinage.errors.category_not_found', 'Catégorie non trouvée')}</p>
          <Link to="/jardinage" className="retry-button">
            {t('jardinage.back_to_categories', 'Retour aux catégories')}
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = category.image ? getImageUrl(category.image) : null;

  return (
    <div className="jardinage-detail-page">
      {/* Back Button - Top Left */}
      <div className="back-button-top-container">
        <Link
          to="/jardinage"
          className="back-button-top"
        >
          <span className="back-icon">←</span>
          {t('jardinage.back_to_categories', 'Retour aux catégories')}
        </Link>
      </div>

      {/* Centered Detail Card */}
      <main className="jardinage-detail-container">
        <div className="jardinage-detail-card">
          {/* Card Image Header */}
          <div className="card-image-header">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={getTranslatedCategoryName(category)}
                className="category-card-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const placeholder = e.target.nextElementSibling;
                  if (placeholder) {
                    placeholder.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div
              className="card-image-placeholder"
              style={{ display: imageUrl ? 'none' : 'flex' }}
            >
              🌱
            </div>
          </div>

          {/* Card Body */}
          <div className="card-body">
            <h1 className="category-title">
              {getTranslatedCategoryName(category)}
            </h1>

            <p className="category-description">
              {getTranslatedCategoryDescription(category)}
            </p>

            <div className="card-actions">
              <button
                className="btn-reserve-card"
                onClick={() => handleReserve(id)}
              >
                📅 {t('jardinage.services.reserve', 'Réserver')}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message-toast">
          <div className="success-content">
            <span className="success-icon">✅</span>
            <span className="success-text">{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}


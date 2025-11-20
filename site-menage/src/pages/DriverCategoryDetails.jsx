import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDriverCategories } from '../api-supabase';
import { supabase } from '../lib/supabase';
import BookingDriverForm from '../components/BookingDriverForm';
import './DriverCategoryDetails.css';

export default function DriverCategoryDetails() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    if (id) {
      loadCategory();
    }
  }, [id, i18n.language]);

  // Helper function to get image URL from Supabase Storage
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.includes('supabase.co/storage')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    if (!imagePath.includes('/') && !imagePath.includes('http')) {
      const { data: { publicUrl } } = supabase.storage
        .from('employees')
        .getPublicUrl(imagePath);
      return publicUrl;
    }
    
    return null;
  };

  // Helper function to get localized name
  const getLocalizedName = (category) => {
    if (!category) return '';
    const locale = i18n.language || 'fr';
    if (locale === 'ar' && category.name_ar) return category.name_ar;
    if (locale === 'en' && category.name_en) return category.name_en;
    if (category.name_fr) return category.name_fr;
    return category.category_name || category.name || 'Sans nom';
  };

  // Helper function to get localized description
  const getLocalizedDescription = (category) => {
    if (!category) return '';
    const locale = i18n.language || 'fr';
    if (locale === 'ar' && category.description_ar) return category.description_ar;
    if (locale === 'en' && category.description_en) return category.description_en;
    if (category.description_fr) return category.description_fr;
    return category.description || '';
  };

  const loadCategory = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[DriverCategoryDetails] Loading category ID:', id);
      
      const data = await getDriverCategories();

      if (!data || !Array.isArray(data)) {
        console.error('[DriverCategoryDetails] Invalid data format:', data);
        setError('Format de données invalide');
        return;
      }

      const foundCategory = data.find(cat => cat.id === id);
      
      if (!foundCategory) {
        setError(
          i18n.language === 'ar' ? 'الفئة غير موجودة' : 
          i18n.language === 'fr' ? 'Catégorie non trouvée' : 
          'Category not found'
        );
        return;
      }

      console.log('[DriverCategoryDetails] Loaded category:', foundCategory);
      setCategory(foundCategory);
    } catch (err) {
      console.error('[DriverCategoryDetails] Error loading category:', err);
      setError(
        i18n.language === 'ar' ? 'خطأ في تحميل الفئة' : 
        i18n.language === 'fr' ? 'Erreur lors du chargement de la catégorie' : 
        'Error loading category'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = () => {
    setShowBookingForm(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    // Optionally show success message or reload
  };

  const handleBookingCancel = () => {
    setShowBookingForm(false);
  };

  if (loading) {
    return (
      <main className="driver-category-details-page">
        <div className="loading-state">
          {i18n.language === 'ar' ? 'جاري التحميل...' : 
           i18n.language === 'fr' ? 'Chargement...' : 
           'Loading...'}
        </div>
      </main>
    );
  }

  if (error || !category) {
    return (
      <main className="driver-category-details-page">
        <div className="error-state">
          {error || (i18n.language === 'ar' ? 'الفئة غير موجودة' : 
                     i18n.language === 'fr' ? 'Catégorie non trouvée' : 
                     'Category not found')}
        </div>
        <Link to="/driver" className="back-button">
          {i18n.language === 'ar' ? '← العودة' : 
           i18n.language === 'fr' ? '← Retour' : 
           '← Back'}
        </Link>
      </main>
    );
  }

  const categoryName = getLocalizedName(category);
  const categoryDescription = getLocalizedDescription(category);
  const imageUrl = getImageUrl(category.image);

  return (
    <main className="driver-category-details-page">
      <div className="category-details-header">
        <Link to="/driver" className="back-button">
          ← {i18n.language === 'ar' ? 'العودة' : 
              i18n.language === 'fr' ? 'Retour' : 
              'Back'}
        </Link>
        <h1>🚗 {categoryName}</h1>
      </div>

      <div className="category-details-content">
        {imageUrl && (
          <div className="category-image-section">
            <img 
              src={imageUrl} 
              alt={categoryName}
              className="category-main-image"
            />
          </div>
        )}

        {categoryDescription && (
          <div className="description-section">
            <h3>
              {i18n.language === 'ar' ? '📝 الوصف' : 
               i18n.language === 'fr' ? '📝 Description' : 
               '📝 Description'}
            </h3>
            <p>{categoryDescription}</p>
          </div>
        )}

        <div className="actions-section">
          <button onClick={handleReserve} className="reserve-button">
            {i18n.language === 'ar' ? 'احجز الآن' : 
             i18n.language === 'fr' ? 'Réserver' : 
             'Reserve'}
          </button>
          <Link to="/driver" className="back-services-button">
            {i18n.language === 'ar' ? 'العودة إلى الخدمات' : 
             i18n.language === 'fr' ? 'Retour aux services' : 
             'Back to services'}
          </Link>
        </div>
      </div>

      {showBookingForm && (
        <BookingDriverForm
          category={category}
          onSuccess={handleBookingSuccess}
          onCancel={handleBookingCancel}
        />
      )}
    </main>
  );
}


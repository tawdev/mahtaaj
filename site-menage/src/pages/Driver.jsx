import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getDriverCategories } from '../api-supabase';
import { supabase } from '../lib/supabase';
import './Driver.css';

export default function Driver() {
  const { t, i18n } = useTranslation();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Set direction based on language
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    loadCategories();
  }, [i18n.language]);

  // Helper function to get image URL from Supabase Storage
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a Supabase URL, return it
    if (imagePath.includes('supabase.co/storage')) {
      return imagePath;
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

  // Helper function to get localized name
  const getLocalizedName = (category) => {
    const locale = i18n.language || 'fr';
    if (locale === 'ar' && category.name_ar) return category.name_ar;
    if (locale === 'en' && category.name_en) return category.name_en;
    if (category.name_fr) return category.name_fr;
    return category.category_name || category.name || 'Sans nom';
  };

  // Helper function to get localized description
  const getLocalizedDescription = (category) => {
    const locale = i18n.language || 'fr';
    if (locale === 'ar' && category.description_ar) return category.description_ar;
    if (locale === 'en' && category.description_en) return category.description_en;
    if (category.description_fr) return category.description_fr;
    return category.description || '';
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[Driver] Loading categories from Supabase');
      
      const data = await getDriverCategories();

      if (!data || !Array.isArray(data)) {
        console.error('[Driver] Invalid data format:', data);
        setError('Format de données invalide');
        return;
      }

      console.log('[Driver] Loaded categories:', data.length);
      setCategories(data);
    } catch (err) {
      console.error('[Driver] Error loading categories:', err);
      setError('Erreur lors du chargement des catégories: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <main className="driver-page">
        <div className="loading-state">
          {i18n.language === 'ar' ? 'جاري التحميل...' : 
           i18n.language === 'fr' ? 'Chargement...' : 
           'Loading...'}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="driver-page">
        <div className="error-state">{error}</div>
      </main>
    );
  }

  return (
    <main className="driver-page">
      <div className="driver-header">
        <h1>🚗 {i18n.language === 'ar' ? 'خدمات السائقين' : 
                 i18n.language === 'fr' ? 'Services de Chauffeur' : 
                 'Driver Services'}</h1>
        <p className="driver-subtitle">
          {i18n.language === 'ar' ? 'اختر نوع الخدمة التي تحتاجها' : 
           i18n.language === 'fr' ? 'Choisissez le type de service dont vous avez besoin' : 
           'Choose the type of service you need'}
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="no-categories">
          {i18n.language === 'ar' ? 'لا توجد فئات متاحة حالياً' : 
           i18n.language === 'fr' ? 'Aucune catégorie disponible pour le moment' : 
           'No categories available at the moment'}
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map((category) => {
            const imageUrl = getImageUrl(category.image);
            const categoryName = getLocalizedName(category);
            const categoryDescription = getLocalizedDescription(category);
            
            return (
              <Link
                key={category.id}
                to={`/driver/${category.id}`}
                className="category-card"
                style={{
                  backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  textDecoration: 'none',
                  display: 'block'
                }}
              >
                <div className="category-card-overlay">
                  <h3 className="category-name">{categoryName}</h3>
                  {categoryDescription && (
                    <p className="category-description">{categoryDescription}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}


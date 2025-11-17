import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getServices, getCategoriesHouse } from '../api-supabase';
import './Services.css';

export default function ServiceCategories() {
  const { serviceSlug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [service, setService] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [serviceSlug, i18n.language]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get service by slug or ID
      const servicesData = await getServices(i18n.language);
      const servicesArray = Array.isArray(servicesData) ? servicesData : servicesData.data || [];
      const foundService = servicesArray.find(s => 
        s.id === parseInt(serviceSlug) || 
        s.slug === serviceSlug ||
        (s.name || s.title || '').toLowerCase().replace(/\s+/g, '-') === serviceSlug.toLowerCase()
      );

      if (!foundService) {
        setError('Service non trouvé');
        return;
      }

      setService(foundService);

      // Load categories-house for this service
      const categoriesData = await getCategoriesHouse(i18n.language, foundService.id);
      // Parse response: can be {success: true, data: [...]} or directly an array
      const categoriesArray = Array.isArray(categoriesData) 
        ? categoriesData 
        : (categoriesData.data || categoriesData.success ? categoriesData.data || [] : []);
      setCategories(categoriesArray);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getCategorySlug = (category) => {
    return category.id.toString() || 
           (category.name || '').toLowerCase().replace(/\s+/g, '-');
  };

  if (loading) {
    return (
      <main className="services-page">
        <div className="loading-state">{t('services_page.loading')}</div>
      </main>
    );
  }

  if (error || !service) {
    return (
      <main className="services-page">
        <div className="error-state">{error || 'Service non trouvé'}</div>
        <Link to="/services" className="back-button">Retour aux services</Link>
      </main>
    );
  }

  return (
    <main className="services-page">
      <div className="services-header">
        <Link to="/services" className="back-button">← {t('services_page.back')}</Link>
        <h1>{service.name || service.title}</h1>
      </div>

      {categories.length === 0 ? (
        <div className="no-data-message">
          <p>لا توجد بيانات متاحة حاليًا لهذه الفئة.</p>
          <p>No data available for this service currently.</p>
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map((category) => {
            // Use image_url first, then fallback to image, then null
            let bgImage = category.image_url || category.image || null;
            
            if (bgImage) {
              // If image_url is relative path (starts with /serveces), add PUBLIC_URL
              if (bgImage.startsWith('/serveces')) {
                bgImage = (process.env.PUBLIC_URL || '') + bgImage;
              }
              // If it's already a full URL (starts with http:// or https://), use as is
              // If it's from storage, API should return full URL, but handle relative paths too
              if (bgImage.startsWith('/') && !bgImage.startsWith('/serveces')) {
                // Relative path from API root, construct full URL
                const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
                bgImage = apiBase + bgImage;
              }
            }
            
            return (
              <Link
                key={category.id}
                to={`/services/${serviceSlug}/${getCategorySlug(category)}`}
                className="category-card"
                style={{
                  backgroundImage: bgImage 
                    ? `url(${bgImage})` 
                    : undefined,
                  backgroundSize: bgImage ? 'cover' : undefined,
                  backgroundPosition: bgImage ? 'center' : undefined,
                  backgroundRepeat: bgImage ? 'no-repeat' : undefined
                }}
              >
                <h3>{category.name}</h3>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}


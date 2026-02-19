import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getServices, getCategoryHouseById, getTypes } from '../../api-supabase';
import { supabase } from '../../lib/supabase';
import './Cuisin.css';

export default function Cuisin() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [service, setService] = useState(null);
  const [category, setCategory] = useState(null);
  const [types, setTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();

    // Restore pending context if it exists
    const pendingContext = sessionStorage.getItem('cuisin_pending_context');
    if (pendingContext) {
      try {
        const { selectedTypes: savedTypes } = JSON.parse(pendingContext);
        if (savedTypes && savedTypes.length > 0) {
          console.log('[Cuisin] Restoring pending types:', savedTypes);
          setSelectedTypes(savedTypes);
        }
      } catch (err) {
        console.error('[Cuisin] Error restoring context:', err);
      } finally {
        sessionStorage.removeItem('cuisin_pending_context');
      }
    }
  }, [i18n.language]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get service (menage service, usually ID 1)
      const servicesData = await getServices(i18n.language);
      const servicesArray = Array.isArray(servicesData) ? servicesData : servicesData.data || [];
      const foundService = servicesArray.find(s =>
        s.id === 1 ||
        (s.name && (s.name.toLowerCase().includes('menage') || s.name.toLowerCase().includes('cleaning')))
      );

      if (!foundService) {
        setError('Service non trouvé');
        setLoading(false);
        return;
      }

      setService(foundService);

      // Get Cuisine category (ID 2)
      const categoryData = await getCategoryHouseById(2, i18n.language);
      const foundCategory = categoryData?.data || categoryData;

      if (!foundCategory) {
        setError('Catégorie non trouvée');
        setLoading(false);
        return;
      }

      setCategory(foundCategory);

      // Get types for Cuisine category
      const typesData = await getTypes(i18n.language, null, 2);
      const typesArray = Array.isArray(typesData) ? typesData : (typesData.data || []);
      setTypes(typesArray);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type) => {
    setSelectedTypes(prev => {
      const isSelected = prev.some(t => t.id === type.id);
      if (isSelected) {
        return prev.filter(t => t.id !== type.id);
      } else {
        return [...prev, type];
      }
    });
  };

  const isTypeSelected = (type) => {
    return selectedTypes.some(t => t.id === type.id);
  };

  const handleReserve = async () => {
    if (selectedTypes.length === 0) return;

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Save current selection context to sessionStorage
      sessionStorage.setItem('cuisin_pending_context', JSON.stringify({
        selectedTypes: selectedTypes,
        category: category,
        service: service
      }));

      // Store returnUrl in localStorage for the auth callback
      localStorage.setItem('auth_return_url', '/cuisin');

      // Redirect to login
      navigate('/login-register', {
        state: { returnUrl: '/cuisin' }
      });
      return;
    }

    navigate('/reservation-cuisin', {
      state: {
        selectedTypes: selectedTypes,
        category: category,
        service: service
      }
    });
  };

  if (loading) {
    return (
      <main className="cuisin-page">
        <div className="cuisin-loader-container">
          <div className="cuisin-loader"></div>
          <p style={{ marginTop: '20px', color: '#64748b', fontWeight: '500' }}>
            {t('services_page.loading')}
          </p>
        </div>
      </main>
    );
  }

  if (error || !service || !category) {
    return (
      <main className="cuisin-page">
        <div className="cuisin-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#0f172a', marginBottom: '16px' }}>{error || 'Données non disponibles'}</h2>
          <button
            onClick={() => navigate('/menage-et-cuisine')}
            className="cuisin-back-button"
            style={{ position: 'relative', margin: '0 auto' }}
          >
            ← Retour
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="cuisin-page">
      <div className="cuisin-container">
        <header className="cuisin-header">
          <button
            onClick={() => navigate('/menage-et-cuisine')}
            className="cuisin-back-button"
            aria-label="Retour"
          >
            ← {t('menage_page.back', 'Retour')}
          </button>

          <div className="cuisin-title-section">
            <h1 className="cuisin-main-title">
              {t('services_page.category_details.title', 'Détails de la catégorie')}
            </h1>
            <h2 className="cuisin-subtitle">{category.name}</h2>
          </div>
        </header>

        <section className="cuisin-content">
          <h3 className="cuisin-section-title" style={{ fontSize: '1.25rem', fontWeight: '600', color: '#334155', marginBottom: '24px' }}>
            {t('services_page.category_details.available_types', 'Types disponibles:')}
          </h3>

          <div className="cuisin-grid">
            {types.map((type) => {
              let bgImage = type.image_url || type.image || null;

              if (bgImage) {
                if (bgImage.startsWith('/serveces')) {
                  bgImage = (process.env.PUBLIC_URL || '') + bgImage;
                }
                if (bgImage.startsWith('/') && !bgImage.startsWith('/serveces') && !bgImage.startsWith('http')) {
                  const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
                  bgImage = apiBase + bgImage;
                }
              }

              const selected = isTypeSelected(type);

              return (
                <article
                  key={type.id}
                  className={`cuisin-card ${selected ? 'selected' : ''}`}
                  onClick={() => handleTypeSelect(type)}
                >
                  {/* Selection Indicator */}
                  <div className={`cuisin-selection-indicator ${selected ? 'selected' : ''}`}>
                    {selected ? <span>✓</span> : <span>+</span>}
                  </div>

                  {/* Background Image */}
                  {bgImage && (
                    <div
                      className="cuisin-card-image"
                      style={{ backgroundImage: `url(${bgImage})` }}
                    />
                  )}
                  <div className="cuisin-card-overlay" />

                  {/* Card content */}
                  <div className="cuisin-card-content">
                    <h4 className="cuisin-card-title">{type.name}</h4>
                    {type.price && (
                      <div className="cuisin-card-price">
                        {parseFloat(type.price).toFixed(2)} DH
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Fallback for no data */}
          {types.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              <p>Aucun type disponible pour le moment.</p>
            </div>
          )}
        </section>

        {/* Floating Selection Bar */}
        {selectedTypes.length > 0 && (
          <div className="cuisin-summary-bar">
            <div className="cuisin-selected-list">
              <span style={{ color: '#64748b', fontWeight: '600', width: '100%', marginBottom: '4px' }}>
                {t('services_page.category_details.choices', 'Choix sélectionnés:')}
              </span>
              {selectedTypes.map(type => (
                <span key={type.id} className="cuisin-selected-tag">
                  {type.name}
                </span>
              ))}
            </div>

            <button
              onClick={handleReserve}
              className="cuisin-reserve-button"
            >
              <span>📅</span>
              {i18n.language === 'ar' ? 'احجز الآن' :
                i18n.language === 'fr' ? 'Réserver maintenant' :
                  'Reserve now'}
            </button>
          </div>
        )}
      </div>

      {/* Spacer for fixed bar */}
      {selectedTypes.length > 0 && <div style={{ height: '120px' }} />}
    </main>
  );
}


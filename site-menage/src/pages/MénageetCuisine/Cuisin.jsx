import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getServices, getCategoryHouseById, getTypes } from '../../api-supabase';
import '../Services.css';

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

  const handleReserve = () => {
    if (selectedTypes.length === 0) return;

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
      <main className="services-page">
        <div className="loading-state">{t('services_page.loading')}</div>
      </main>
    );
  }

  if (error || !service || !category) {
    return (
      <main className="services-page">
        <div className="error-state">{error || 'Données non disponibles'}</div>
        <button 
          onClick={() => navigate('/menage-et-cuisine')} 
          className="back-button"
        >
          ← Retour
        </button>
      </main>
    );
  }

  return (
    <main className="services-page">
      <div className="category-details-header">
        <button 
          onClick={() => navigate('/menage-et-cuisine')} 
          className="back-button"
        >
          ← Retour
        </button>
        <h1>🧾 {t('services_page.category_details.title', 'Détails de la catégorie')}</h1>
        <h2>{category.name}</h2>
      </div>

      {types.length > 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                margin: 0,
              }}
            >
              {t('services_page.category_details.available_types', 'Types disponibles:')}
            </h3>
          </div>
          <div className="types-grid-container">
            {types.map((type) => {
              let bgImage = type.image_url || type.image || null;
              
              if (bgImage) {
                if (bgImage.startsWith('/serveces')) {
                  bgImage = (process.env.PUBLIC_URL || '') + bgImage;
                }
                if (bgImage.startsWith('/') && !bgImage.startsWith('/serveces')) {
                  const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
                  bgImage = apiBase + bgImage;
                }
              }

              const selected = isTypeSelected(type);
              
              return (
                <div
                  key={type.id}
                  className="type-card"
                  style={{
                    backgroundImage: bgImage 
                      ? `url(${bgImage})` 
                      : undefined,
                    backgroundSize: bgImage ? 'cover' : undefined,
                    backgroundPosition: bgImage ? 'center' : undefined,
                    backgroundRepeat: bgImage ? 'no-repeat' : undefined,
                    cursor: 'default',
                    position: 'relative'
                  }}
                >
                  {/* Selection checkbox in top-right corner */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTypeSelect(type);
                    }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '32px',
                      height: '32px',
                      backgroundColor: selected ? '#10b981' : 'rgba(255, 255, 255, 0.95)',
                      border: selected ? '2px solid #10b981' : '2px solid #3b82f6',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      transition: 'all 0.3s ease',
                      boxShadow: selected 
                        ? '0 2px 8px rgba(16, 185, 129, 0.4)' 
                        : '0 2px 6px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      } else {
                        e.currentTarget.style.backgroundColor = '#059669';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.transform = 'scale(1)';
                      } else {
                        e.currentTarget.style.backgroundColor = '#10b981';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {selected && (
                      <span style={{
                        color: '#fff',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        lineHeight: '1'
                      }}>✓</span>
                    )}
                  </div>
                  <h4>{type.name}</h4>
                  {type.price !== null && type.price !== undefined && !isNaN(parseFloat(type.price)) && (
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#10b981',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}>
                      {parseFloat(type.price).toFixed(2)} DH 
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected types display */}
          {selectedTypes.length > 0 && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>
                {t('services_page.category_details.choices', 'Choix:')}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedTypes.map(type => (
                  <span
                    key={type.id}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {type.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reserve button */}
          {selectedTypes.length > 0 && (
            <div style={{
              marginTop: '32px',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleReserve}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
                }}
              >
                <span>📅</span>
                {i18n.language === 'ar' ? 'احجز الآن' : 
                 i18n.language === 'fr' ? 'Réserver maintenant' : 
                 'Reserve now'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="no-data-message">
          <p>Aucun type disponible pour le moment.</p>
        </div>
      )}
    </main>
  );
}


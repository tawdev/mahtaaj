import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Centre.css';

export default function Centre() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCentre = async () => {
      try {
        setLoading(true);
        setError('');

        // Load all types_menage
        const { data: allTypesData, error: typesError } = await supabase
          .from('types_menage')
          .select('*, menage:menage_id(*)')
          .order('created_at', { ascending: false });

        if (typesError) {
          throw typesError;
        }

        const allTypes = allTypesData || [];

        // Filter: Only items where name contains "lavage en centre" or "lavage au centre"
        const filtered = allTypes.filter(item => {
          if (!item) return false;

          // Get type_menage names in all languages
          const typeNameFr = (item.name_fr || '').toLowerCase().trim();
          const typeNameAr = (item.name_ar || '').toLowerCase().trim();
          const typeNameEn = (item.name_en || '').toLowerCase().trim();

          // Check if contains "lavage en centre" or "lavage au centre" or "غسيل في المركز" or "car wash center"
          const frHasCentre = typeNameFr.includes('lavage en centre') || 
                             typeNameFr.includes('lavage au centre') ||
                             typeNameFr.includes('centre') && typeNameFr.includes('lavage');
          const arHasCentre = typeNameAr.includes('غسيل في المركز') || 
                             typeNameAr.includes('المركز') && typeNameAr.includes('غسيل');
          const enHasCentre = typeNameEn.includes('car wash center') || 
                            typeNameEn.includes('center') && typeNameEn.includes('wash');

          // Exclude items that contain "domicile" or "à domicile" or "home"
          const frHasDomicile = typeNameFr.includes('domicile') || typeNameFr.includes('à domicile');
          const arHasDomicile = typeNameAr.includes('منزل') || typeNameAr.includes('في المنزل');
          const enHasDomicile = typeNameEn.includes('home') || typeNameEn.includes('at home');

          // Include if has centre/center but NOT domicile/home
          return (frHasCentre || arHasCentre || enHasCentre) && 
                 !frHasDomicile && !arHasDomicile && !enHasDomicile;
        });

        // Remove duplicates based on ID
        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        console.log('[Centre] Filtered items:', uniqueItems.length, 'out of', allTypes.length);
        setItems(uniqueItems);
      } catch (err) {
        console.error('[Centre] Exception loading data:', err);
        const errorMessage = err?.message || err?.toString() || 'Erreur de connexion';
        setError('Erreur de connexion: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadCentre();
  }, []);

  const getLocalizedText = (item) => {
    const lang = i18n.language || 'fr';
    if (lang === 'ar') {
      return {
        name: item.name_ar || item.name_fr || item.name_en,
        description: item.description_ar || item.description_fr || item.description_en
      };
    }
    if (lang === 'en') {
      return {
        name: item.name_en || item.name_fr || item.name_ar,
        description: item.description_en || item.description_fr || item.description_ar
      };
    }
    // default fr
    return {
      name: item.name_fr || item.name_en || item.name_ar,
      description: item.description_fr || item.description_en || item.description_ar
    };
  };

  const formatPrice = (price) => {
    if (!price || isNaN(parseFloat(price))) {
      return null;
    }
    return `${parseFloat(price).toFixed(2)} DH`;
  };

  const handleReserve = (item) => {
    const { name, description } = getLocalizedText(item);
    
    // Navigate to reservation page
    navigate('/reservation-voiture', {
      state: {
        selectedService: {
          id: item.id,
          name: name,
          description: description,
          price: item.price,
          image: item.image,
          menage_id: item.menage_id
        },
        serviceType: 'centre'
      }
    });
  };

  if (loading) {
    return (
      <main className="centre-page">
        <div className="centre-header">
          <button 
            className="centre-back-btn"
            onClick={() => navigate('/lavage-de-voiture')}
            title={t('centre_page.back', 'Retour')}
          >
            ← {t('centre_page.back', 'Retour')}
          </button>
        </div>
        <div className="centre-loading">Chargement des services Lavage en Centre...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="centre-page">
        <div className="centre-header">
          <button 
            className="centre-back-btn"
            onClick={() => navigate('/lavage-de-voiture')}
            title={t('centre_page.back', 'Retour')}
          >
            ← {t('centre_page.back', 'Retour')}
          </button>
        </div>
        <div className="centre-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="centre-page">
        <div className="centre-header">
          <button 
            className="centre-back-btn"
            onClick={() => navigate('/lavage-de-voiture')}
            title={t('centre_page.back', 'Retour')}
          >
            ← {t('centre_page.back', 'Retour')}
          </button>
        </div>
        <div className="centre-empty">Aucun service Lavage en Centre disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="centre-page">
      <div className="centre-header">
        <button 
          className="centre-back-btn"
          onClick={() => navigate('/lavage-de-voiture')}
          title={t('centre_page.back', 'Retour')}
        >
          ← {t('centre_page.back', 'Retour')}
        </button>
        <h1 className="centre-title">
          {t('centre_page.title', 'Lavage en Centre')}
        </h1>
      </div>
      <div className="centre-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const priceFormatted = formatPrice(item.price);
          return (
            <article key={item.id} className="centre-card">
              {item.image && (
                <div className="centre-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Lavage en Centre'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="centre-card-body">
                <h2 className="centre-card-title">{name || `Service #${item.id}`}</h2>
                {description && (
                  <p className="centre-card-description">
                    {description}
                  </p>
                )}
                {priceFormatted && (
                  <div className="centre-card-price">
                    {priceFormatted}
                  </div>
                )}
                <button
                  className="centre-card-reserve-btn"
                  onClick={() => handleReserve(item)}
                >
                  {t('centre_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


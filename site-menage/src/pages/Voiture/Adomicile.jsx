import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Adomicile.css';

export default function Adomicile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAdomicile = async () => {
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

        // Filter: Only items where name contains "lavage à domicile" or "lavage au domicile"
        const filtered = allTypes.filter(item => {
          if (!item) return false;

          // Get type_menage names in all languages
          const typeNameFr = (item.name_fr || '').toLowerCase().trim();
          const typeNameAr = (item.name_ar || '').toLowerCase().trim();
          const typeNameEn = (item.name_en || '').toLowerCase().trim();

          // Check if contains "lavage à domicile" or "lavage au domicile" or "غسيل في المنزل" or "car wash at home"
          const frHasDomicile = typeNameFr.includes('lavage à domicile') || 
                               typeNameFr.includes('lavage au domicile') ||
                               typeNameFr.includes('à domicile') && typeNameFr.includes('lavage') ||
                               typeNameFr.includes('domicile') && typeNameFr.includes('lavage');
          const arHasDomicile = typeNameAr.includes('غسيل في المنزل') || 
                               typeNameAr.includes('في المنزل') && typeNameAr.includes('غسيل') ||
                               typeNameAr.includes('منزل') && typeNameAr.includes('غسيل');
          const enHasDomicile = typeNameEn.includes('car wash at home') || 
                               typeNameEn.includes('at home') && typeNameEn.includes('wash') ||
                               typeNameEn.includes('home') && typeNameEn.includes('wash');

          // Exclude items that contain "centre" or "center"
          const frHasCentre = typeNameFr.includes('centre') || typeNameFr.includes('center');
          const arHasCentre = typeNameAr.includes('المركز') || typeNameAr.includes('مركز');
          const enHasCentre = typeNameEn.includes('center') || typeNameEn.includes('centre');

          // Include if has domicile/home but NOT centre/center
          return (frHasDomicile || arHasDomicile || enHasDomicile) && 
                 !frHasCentre && !arHasCentre && !enHasCentre;
        });

        // Remove duplicates based on ID
        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        console.log('[Adomicile] Filtered items:', uniqueItems.length, 'out of', allTypes.length);
        setItems(uniqueItems);
      } catch (err) {
        console.error('[Adomicile] Exception loading data:', err);
        const errorMessage = err?.message || err?.toString() || 'Erreur de connexion';
        setError('Erreur de connexion: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadAdomicile();
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
        serviceType: 'domicile'
      }
    });
  };

  if (loading) {
    return (
      <main className="adomicile-page">
        <div className="adomicile-header">
          <button 
            className="adomicile-back-btn"
            onClick={() => navigate('/lavage-de-voiture')}
            title={t('adomicile_page.back', 'Retour')}
          >
            ← {t('adomicile_page.back', 'Retour')}
          </button>
        </div>
        <div className="adomicile-loading">Chargement des services Lavage à Domicile...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="adomicile-page">
        <div className="adomicile-header">
          <button 
            className="adomicile-back-btn"
            onClick={() => navigate('/lavage-de-voiture')}
            title={t('adomicile_page.back', 'Retour')}
          >
            ← {t('adomicile_page.back', 'Retour')}
          </button>
        </div>
        <div className="adomicile-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="adomicile-page">
        <div className="adomicile-header">
          <button 
            className="adomicile-back-btn"
            onClick={() => navigate('/lavage-de-voiture')}
            title={t('adomicile_page.back', 'Retour')}
          >
            ← {t('adomicile_page.back', 'Retour')}
          </button>
        </div>
        <div className="adomicile-empty">Aucun service Lavage à Domicile disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="adomicile-page">
      <div className="adomicile-header">
        <button 
          className="adomicile-back-btn"
          onClick={() => navigate('/lavage-de-voiture')}
          title={t('adomicile_page.back', 'Retour')}
        >
          ← {t('adomicile_page.back', 'Retour')}
        </button>
        <h1 className="adomicile-title">
          {t('adomicile_page.title', 'Lavage à Domicile')}
        </h1>
      </div>
      <div className="adomicile-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const priceFormatted = formatPrice(item.price);
          return (
            <article key={item.id} className="adomicile-card">
              {item.image && (
                <div className="adomicile-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Lavage à Domicile'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="adomicile-card-body">
                <h2 className="adomicile-card-title">{name || `Service #${item.id}`}</h2>
                {description && (
                  <p className="adomicile-card-description">
                    {description}
                  </p>
                )}
                {priceFormatted && (
                  <div className="adomicile-card-price">
                    {priceFormatted}
                  </div>
                )}
                <button
                  className="adomicile-card-reserve-btn"
                  onClick={() => handleReserve(item)}
                >
                  {t('adomicile_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


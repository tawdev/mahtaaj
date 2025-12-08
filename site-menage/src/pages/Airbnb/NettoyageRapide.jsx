import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './NettoyageRapide.css';

export default function NettoyageRapide() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadNettoyageRapide = async () => {
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

        // Filter: Only items where:
        // 1. menage name contains "Airbnb" or "airbnb"
        // 2. type_menage name contains "rapide" or "سريع" or "quick" (but NOT "complet" or "complet" or "complete")
        const filtered = allTypes.filter(item => {
          if (!item) return false;

          // Check menage name
          const menage = item.menage;
          if (!menage) return false;
          
          const menageNameFr = (menage.name_fr || '').toLowerCase().trim();
          const menageNameAr = (menage.name_ar || '').toLowerCase().trim();
          const menageNameEn = (menage.name_en || '').toLowerCase().trim();
          
          const isAirbnb = 
            menageNameFr.includes('airbnb') ||
            menageNameAr.includes('airbnb') ||
            menageNameEn.includes('airbnb');

          if (!isAirbnb) return false;

          // Check type_menage name for "rapide" (but NOT "complet")
          const typeNameFr = (item.name_fr || '').toLowerCase().trim();
          const typeNameAr = (item.name_ar || '').toLowerCase().trim();
          const typeNameEn = (item.name_en || '').toLowerCase().trim();

          // Must contain "rapide" / "سريع" / "quick" but NOT "complet" / "كامل" / "complete"
          const frHasRapide = typeNameFr.includes('rapide') && !typeNameFr.includes('complet');
          const arHasRapide = typeNameAr.includes('سريع') && !typeNameAr.includes('كامل');
          const enHasRapide = (typeNameEn.includes('quick') || typeNameEn.includes('rapid')) && !typeNameEn.includes('complete');

          return frHasRapide || arHasRapide || enHasRapide;
        });

        // Remove duplicates based on ID
        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        console.log('[NettoyageRapide] Filtered items:', uniqueItems.length, 'out of', allTypes.length);
        setItems(uniqueItems);
      } catch (err) {
        console.error('[NettoyageRapide] Exception loading data:', err);
        const errorMessage = err?.message || err?.toString() || 'Erreur de connexion';
        setError('Erreur de connexion: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadNettoyageRapide();
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
    const finalPrice = parseFloat(item.price) || 0;
    
    // Navigate to reservation page
    navigate('/reservation-airbnb', {
      state: {
        type: {
          id: item.id,
          name: name,
          description: description,
          price: item.price,
          image: item.image,
          service_id: item.menage_id,
          finalPrice: finalPrice
        },
        serviceType: 'nettoyage_rapide'
      }
    });
  };

  if (loading) {
    return (
      <main className="nettoyage-rapide-page">
        <div className="nettoyage-rapide-header">
          <button 
            className="nettoyage-rapide-back-btn"
            onClick={() => navigate('/airbnb')}
            title={t('nettoyage_rapide_page.back', 'Retour')}
          >
            ← {t('nettoyage_rapide_page.back', 'Retour')}
          </button>
        </div>
        <div className="nettoyage-rapide-loading">Chargement des services Nettoyage Rapide...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="nettoyage-rapide-page">
        <div className="nettoyage-rapide-header">
          <button 
            className="nettoyage-rapide-back-btn"
            onClick={() => navigate('/airbnb')}
            title={t('nettoyage_rapide_page.back', 'Retour')}
          >
            ← {t('nettoyage_rapide_page.back', 'Retour')}
          </button>
        </div>
        <div className="nettoyage-rapide-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="nettoyage-rapide-page">
        <div className="nettoyage-rapide-header">
          <button 
            className="nettoyage-rapide-back-btn"
            onClick={() => navigate('/airbnb')}
            title={t('nettoyage_rapide_page.back', 'Retour')}
          >
            ← {t('nettoyage_rapide_page.back', 'Retour')}
          </button>
        </div>
        <div className="nettoyage-rapide-empty">Aucun service Nettoyage Rapide disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="nettoyage-rapide-page">
      <div className="nettoyage-rapide-header">
        <button 
          className="nettoyage-rapide-back-btn"
          onClick={() => navigate('/airbnb')}
          title={t('nettoyage_rapide_page.back', 'Retour')}
        >
          ← {t('nettoyage_rapide_page.back', 'Retour')}
        </button>
        <h1 className="nettoyage-rapide-title">
          {t('nettoyage_rapide_page.title', 'Nettoyage Rapide')}
        </h1>
      </div>
      <div className="nettoyage-rapide-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const priceFormatted = formatPrice(item.price);
          return (
            <article key={item.id} className="nettoyage-rapide-card">
              {item.image && (
                <div className="nettoyage-rapide-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Nettoyage Rapide'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="nettoyage-rapide-card-body">
                <h2 className="nettoyage-rapide-card-title">{name || `Service #${item.id}`}</h2>
                {description && (
                  <p className="nettoyage-rapide-card-description">
                    {description}
                  </p>
                )}
                
                
                {/* Pack Section */}
                <div className="nettoyage-rapide-pack-card">
                  <div className="nettoyage-rapide-pack-header">
                    <h3 className="nettoyage-rapide-pack-title">
                      {t('nettoyage_rapide_page.pack_title', 'Pack')}
                    </h3>
                  </div>
                  <div className="nettoyage-rapide-pack-items">
                    <div className="nettoyage-rapide-pack-item">
                      <span className="nettoyage-rapide-pack-item-text">
                        {t('nettoyage_rapide_page.pack_housses', 'Les housses')}
                      </span>
                    </div>
                    <div className="nettoyage-rapide-pack-item">
                      <span className="nettoyage-rapide-pack-item-text">
                        {t('nettoyage_rapide_page.pack_draps', 'Draps')}
                      </span>
                    </div>
                    <div className="nettoyage-rapide-pack-item">
                      <span className="nettoyage-rapide-pack-item-text">
                        {t('nettoyage_rapide_page.pack_nettoyage', 'Nettoyage')}
                      </span>
                    </div>
                    {priceFormatted && (
                  <div className="nettoyage-rapide-card-price">
                    <span className="nettoyage-rapide-price-label">
                      {t('nettoyage_rapide_page.total_price', 'السعر الإجمالي')}:
                    </span>
                    <span className="nettoyage-rapide-price-value">
                      {priceFormatted}
                    </span>
                  </div>
                )}
                  </div>
                </div>
                
                
                
                <button
                  className="nettoyage-rapide-card-reserve-btn"
                  onClick={() => handleReserve(item)}
                >
                  {t('nettoyage_rapide_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


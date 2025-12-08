import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './NettoyageComplet.css';

export default function NettoyageComplet() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadNettoyageComplet = async () => {
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
        // 2. type_menage name contains "complet" or "كامل" or "complete" (but NOT "rapide" or "سريع" or "quick")
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

          // Check type_menage name for "complet" (but NOT "rapide")
          const typeNameFr = (item.name_fr || '').toLowerCase().trim();
          const typeNameAr = (item.name_ar || '').toLowerCase().trim();
          const typeNameEn = (item.name_en || '').toLowerCase().trim();

          // Must contain "complet" / "كامل" / "complete" but NOT "rapide" / "سريع" / "quick"
          const frHasComplet = typeNameFr.includes('complet') && !typeNameFr.includes('rapide');
          const arHasComplet = typeNameAr.includes('كامل') && !typeNameAr.includes('سريع');
          const enHasComplet = typeNameEn.includes('complete') && !typeNameEn.includes('quick') && !typeNameEn.includes('rapid');

          return frHasComplet || arHasComplet || enHasComplet;
        });

        // Remove duplicates based on ID
        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        console.log('[NettoyageComplet] Filtered items:', uniqueItems.length, 'out of', allTypes.length);
        setItems(uniqueItems);
      } catch (err) {
        console.error('[NettoyageComplet] Exception loading data:', err);
        const errorMessage = err?.message || err?.toString() || 'Erreur de connexion';
        setError('Erreur de connexion: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadNettoyageComplet();
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
        serviceType: 'nettoyage_complet'
      }
    });
  };

  if (loading) {
    return (
      <main className="nettoyage-complet-page">
        <div className="nettoyage-complet-header">
          <button 
            className="nettoyage-complet-back-btn"
            onClick={() => navigate('/airbnb')}
            title={t('nettoyage_complet_page.back', 'Retour')}
          >
            ← {t('nettoyage_complet_page.back', 'Retour')}
          </button>
        </div>
        <div className="nettoyage-complet-loading">Chargement des services Nettoyage Complet...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="nettoyage-complet-page">
        <div className="nettoyage-complet-header">
          <button 
            className="nettoyage-complet-back-btn"
            onClick={() => navigate('/airbnb')}
            title={t('nettoyage_complet_page.back', 'Retour')}
          >
            ← {t('nettoyage_complet_page.back', 'Retour')}
          </button>
        </div>
        <div className="nettoyage-complet-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="nettoyage-complet-page">
        <div className="nettoyage-complet-header">
          <button 
            className="nettoyage-complet-back-btn"
            onClick={() => navigate('/airbnb')}
            title={t('nettoyage_complet_page.back', 'Retour')}
          >
            ← {t('nettoyage_complet_page.back', 'Retour')}
          </button>
        </div>
        <div className="nettoyage-complet-empty">Aucun service Nettoyage Complet disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="nettoyage-complet-page">
      <div className="nettoyage-complet-header">
        <button 
          className="nettoyage-complet-back-btn"
          onClick={() => navigate('/airbnb')}
          title={t('nettoyage_complet_page.back', 'Retour')}
        >
          ← {t('nettoyage_complet_page.back', 'Retour')}
        </button>
        <h1 className="nettoyage-complet-title">
          {t('nettoyage_complet_page.title', 'Nettoyage Complet')}
        </h1>
      </div>
      <div className="nettoyage-complet-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const priceFormatted = formatPrice(item.price);
          return (
            <article key={item.id} className="nettoyage-complet-card">
              {item.image && (
                <div className="nettoyage-complet-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Nettoyage Complet'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="nettoyage-complet-card-body">
                <h2 className="nettoyage-complet-card-title">{name || `Service #${item.id}`}</h2>
                {description && (
                  <p className="nettoyage-complet-card-description">
                    {description}
                  </p>
                )}
                
                
                {/* Pack Section */}
                <div className="nettoyage-complet-pack-card">
                  <div className="nettoyage-complet-pack-header">
                    <h3 className="nettoyage-complet-pack-title">
                      {t('nettoyage_complet_page.pack_title', 'Pack')}
                    </h3>
                  </div>
                  <div className="nettoyage-complet-pack-items">
                    <div className="nettoyage-complet-pack-item">
                      <span className="nettoyage-complet-pack-item-text">
                        {t('nettoyage_complet_page.pack_tapis', 'Les tapis')}
                      </span>
                    </div>
                    <div className="nettoyage-complet-pack-item">
                      <span className="nettoyage-complet-pack-item-text">
                        {t('nettoyage_complet_page.pack_machines', 'Les machines à laver')}
                      </span>
                    </div>
                    <div className="nettoyage-complet-pack-item">
                      <span className="nettoyage-complet-pack-item-text">
                        {t('nettoyage_complet_page.pack_vitrines', 'Les vitrines')}
                      </span>
                    </div>
                    <div className="nettoyage-complet-pack-item">
                      <span className="nettoyage-complet-pack-item-text">
                        {t('nettoyage_complet_page.pack_terrasses', 'Les terrasses')}
                      </span>
                    </div>
                    <div className="nettoyage-complet-pack-item">
                      <span className="nettoyage-complet-pack-item-text">
                        {t('nettoyage_complet_page.pack_electromenager', 'Tout l\'électroménager')}
                      </span>
                    </div>
                    <div className="nettoyage-complet-pack-item">
                      <span className="nettoyage-complet-pack-item-text">
                        {t('nettoyage_complet_page.pack_placards', 'Les placards')}
                      </span>
                    </div>
                    <div className="nettoyage-complet-pack-item">
                      <span className="nettoyage-complet-pack-item-text">
                        {t('nettoyage_complet_page.pack_meubles', 'Sortir les meubles')}
                      </span>
                    </div>
                  </div>
                  {priceFormatted && (
                  <div className="nettoyage-complet-card-price">
                    <span className="nettoyage-complet-price-label">
                      {t('nettoyage_complet_page.total_price', 'السعر الإجمالي')}:
                    </span>
                    <span className="nettoyage-complet-price-value">
                      {priceFormatted}
                    </span>
                  </div>
                )}
                </div>
                
                
                
                <button
                  className="nettoyage-complet-card-reserve-btn"
                  onClick={() => handleReserve(item)}
                >
                  {t('nettoyage_complet_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


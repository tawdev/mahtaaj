import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './TapisEtCanapes.css';

export default function TapisEtCanapes() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTapisCanapes = async () => {
      try {
        setLoading(true);
        setError('');

        // First, find the menage with name "Tapis Et Canapés" (or similar)
        const menageNames = [
          'Tapis Et Canapés',
          'Tapis et Canapés',
          'Tapis Et Canapes',
          'Tapis et Canapes',
          'ال tapis et canapés',
          'Tapis & Canapés'
        ];

        // Try to find the menage by name in any language
        let menageId = null;
        const { data: menageData, error: menageError } = await supabase
          .from('menage')
          .select('id, name_fr, name_ar, name_en')
          .or(`name_fr.ilike.%Tapis%,name_fr.ilike.%Canapé%,name_ar.ilike.%تapis%,name_ar.ilike.%Canapé%,name_en.ilike.%Tapis%,name_en.ilike.%Canapé%`);

        if (!menageError && menageData && menageData.length > 0) {
          // Find the best match
          const matchedMenage = menageData.find(m => 
            menageNames.some(name => 
              m.name_fr?.toLowerCase().includes('tapis') && 
              (m.name_fr?.toLowerCase().includes('canapé') || m.name_fr?.toLowerCase().includes('canapes'))
            ) ||
            m.name_ar?.includes('تapis') ||
            (m.name_en?.toLowerCase().includes('tapis') && m.name_en?.toLowerCase().includes('canap'))
          );
          
          if (matchedMenage) {
            menageId = matchedMenage.id;
          } else {
            // Use the first result if no exact match
            menageId = menageData[0].id;
          }
        }

        let allTypes = [];

        if (!menageId) {
          console.warn('[TapisEtCanapes] No menage found for "Tapis Et Canapés", loading all types_menage');
          // If no specific menage found, try to load all types_menage
          // and filter client-side (less efficient but works)
          const { data: allTypesData, error: typesError } = await supabase
            .from('types_menage')
            .select('*, menage:menage_id(*)')
            .order('created_at', { ascending: false });

          if (typesError) {
            throw typesError;
          }

          allTypes = allTypesData || [];
        } else {
          // Load types_menage filtered by menage_id
          const { data, error } = await supabase
            .from('types_menage')
            .select('*, menage:menage_id(*)')
            .eq('menage_id', menageId)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('[TapisEtCanapes] Error loading types_menage:', error);
            setError('Erreur lors du chargement des services: ' + error.message);
            return;
          }

          allTypes = data || [];
        }

        // Filter: Only items where type_menage name contains BOTH "tapis" AND "canapés" (exact match)
        // Check in ALL languages - if ANY language has both keywords, include it
        const filtered = allTypes.filter(item => {
          if (!item) return false;

          // Get type_menage names in all languages
          const typeNameFr = (item.name_fr || '').toLowerCase().trim();
          const typeNameAr = (item.name_ar || '').toLowerCase().trim();
          const typeNameEn = (item.name_en || '').toLowerCase().trim();

          // Check French name
          const frHasTapis = typeNameFr.includes('tapis');
          const frHasCanapes = typeNameFr.includes('canapé') || typeNameFr.includes('canapes');
          const frMatch = frHasTapis && frHasCanapes;

          // Check Arabic name
          const arHasTapis = typeNameAr.includes('سجاد') || typeNameAr.includes('تapis') || typeNameAr.includes('tapis');
          const arHasCanapes = typeNameAr.includes('كنب') || typeNameAr.includes('canapé') || typeNameAr.includes('canapes');
          const arMatch = arHasTapis && arHasCanapes;

          // Check English name
          const enHasTapis = typeNameEn.includes('tapis') || typeNameEn.includes('carpet');
          const enHasCanapes = typeNameEn.includes('canap') || typeNameEn.includes('sofa');
          const enMatch = enHasTapis && enHasCanapes;

          // Include if ANY language has both keywords (tapis AND canapés)
          return frMatch || arMatch || enMatch;
        });

        // Remove duplicates based on ID
        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        // If multiple items found, take the first one (or you can add logic to select the best match)
        // For now, we'll show only the first matching item
        const finalItems = uniqueItems.length > 0 ? [uniqueItems[0]] : [];

        console.log('[TapisEtCanapes] Filtered items:', finalItems.length, 'out of', allTypes.length);
        setItems(finalItems);
      } catch (err) {
        console.error('[TapisEtCanapes] Exception loading data:', err);
        const errorMessage = err?.message || err?.toString() || 'Erreur de connexion';
        setError('Erreur de connexion: ' + errorMessage);
        
        // Log more details for debugging
        if (err?.code) {
          console.error('[TapisEtCanapes] Error code:', err.code);
        }
        if (err?.details) {
          console.error('[TapisEtCanapes] Error details:', err.details);
        }
        if (err?.hint) {
          console.error('[TapisEtCanapes] Error hint:', err.hint);
        }
      } finally {
        setLoading(false);
      }
    };

    loadTapisCanapes();
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
    const finalPrice = item.price ? parseFloat(item.price) : 0;

    navigate('/reservation-tapis-canapes', {
      state: {
        type: {
          id: item.id,
          name: name,
          description: description,
          price: item.price,
          service_id: item.menage_id,
          finalPrice: finalPrice
        },
        serviceType: 'tapis_et_canapes'
      }
    });
  };

  if (loading) {
    return (
      <main className="tapis-et-canapes-page">
        <div className="tapis-et-canapes-header">
          <button 
            className="tapis-et-canapes-back-btn"
            onClick={() => navigate('/tapis-canapes')}
            title={t('tapis_canapes_page.back', 'Retour')}
          >
            ← {t('tapis_canapes_page.back', 'Retour')}
          </button>
        </div>
        <div className="tapis-et-canapes-loading">Chargement des services Tapis et Canapés...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="tapis-et-canapes-page">
        <div className="tapis-et-canapes-header">
          <button 
            className="tapis-et-canapes-back-btn"
            onClick={() => navigate('/tapis-canapes')}
            title={t('tapis_canapes_page.back', 'Retour')}
          >
            ← {t('tapis_canapes_page.back', 'Retour')}
          </button>
        </div>
        <div className="tapis-et-canapes-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="tapis-et-canapes-page">
        <div className="tapis-et-canapes-header">
          <button 
            className="tapis-et-canapes-back-btn"
            onClick={() => navigate('/tapis-canapes')}
            title={t('tapis_canapes_page.back', 'Retour')}
          >
            ← {t('tapis_canapes_page.back', 'Retour')}
          </button>
        </div>
        <div className="tapis-et-canapes-empty">Aucun service Tapis et Canapés disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="tapis-et-canapes-page">
      <div className="tapis-et-canapes-header">
        <button 
          className="tapis-et-canapes-back-btn"
          onClick={() => navigate('/tapis-canapes')}
          title={t('tapis_canapes_page.back', 'Retour')}
        >
          ← {t('tapis_canapes_page.back', 'Retour')}
        </button>
        <h1 className="tapis-et-canapes-title">
          {t('tapis_canapes_page.title', 'Tapis et Canapés')}
        </h1>
      </div>
      <div className="tapis-et-canapes-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const priceFormatted = formatPrice(item.price);
          const lang = i18n.language || 'fr';
          return (
            <article key={item.id} className="tapis-et-canapes-card">
              {item.image && (
                <div className="tapis-et-canapes-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Tapis et Canapés'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="tapis-et-canapes-card-body">
                <h2 className="tapis-et-canapes-card-title">{name || `Service #${item.id}`}</h2>
                {description && (
                  <p className="tapis-et-canapes-card-description">
                    {description}
                  </p>

)}
 {/* Promotional Card - Centered */}
 {items.length > 0 && (() => {
        const firstItem = items[0];
        const priceFormatted = formatPrice(firstItem.price);
        const lang = i18n.language || 'fr';
        return (
          <div className="tapis-et-canapes-promo-container">
            <div className="tapis-et-canapes-promo-card">
              <div className="tapis-et-canapes-promo-header">
                <h3 className="tapis-et-canapes-promo-title">
                  {lang === 'ar' ? 'العرض الشامل' : lang === 'en' ? 'Comprehensive Offer' : 'Offre Complète'}
                </h3>
                <span className="tapis-et-canapes-promo-stars">✨✨</span>
              </div>
              <div className="tapis-et-canapes-promo-content">
                <div className="tapis-et-canapes-promo-item">
                  <span className="tapis-et-canapes-promo-text">
                    {lang === 'ar' ? '6 م أرائك' : lang === 'en' ? '6 m sofas' : '6 m canapés'}
                  </span>
                  <span className="tapis-et-canapes-promo-icon">🛋️</span>
                </div>
                <div className="tapis-et-canapes-promo-item">
                  <span className="tapis-et-canapes-promo-text">
                    {lang === 'ar' ? '3 × 2.5م سجاد' : lang === 'en' ? '3 × 2.5 m carpets' : '3 × 2.5 m tapis'}
                  </span>
                  <span className="tapis-et-canapes-promo-icon">🧶</span>
                </div>
                <div className="tapis-et-canapes-promo-item">
                  <span className="tapis-et-canapes-promo-text">
                    {lang === 'ar' ? '2 أسرة مضادة للبكتيريا' : lang === 'en' ? '2 anti-bacterial beds' : '2 lits anti-bactériens'}
                  </span>
                  <span className="tapis-et-canapes-promo-icon">🛏️</span>
                </div>
                <div className="tapis-et-canapes-promo-divider"></div>
                <div className="tapis-et-canapes-promo-price-section">
                  <div className="tapis-et-canapes-promo-price-label">
                    {lang === 'ar' ? 'السعر:' : lang === 'en' ? 'Price:' : 'Prix:'}
                    <span className="tapis-et-canapes-promo-price-icon">💰</span>
                  </div>
                  <div className="tapis-et-canapes-promo-price-value">
                    <span className="tapis-et-canapes-old-price">2000.00 DH</span>
                    <span className="tapis-et-canapes-current-price">{priceFormatted || '800.00 DH'}</span>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        );
      })()}
                <button
                  className="tapis-et-canapes-card-reserve-btn"
                  onClick={() => handleReserve(item)}
                >
                  {t('tapis_canapes_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
     
    </main>
  );
}


import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './LastrageChassures.css';

export default function LastrageChassures() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // State for shoe count per item
  const [shoeCounts, setShoeCounts] = useState({}); // { itemId: count }
  const [finalPrices, setFinalPrices] = useState({}); // { itemId: finalPrice }
  const [validationErrors, setValidationErrors] = useState({}); // { itemId: errorMessage }

  useEffect(() => {
    const loadCirageChassures = async () => {
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

        // Filter: Only items where name contains "Cirage des chaussures" or "تلميع الأحذية" or "shoe polish"
        const filtered = allTypes.filter(item => {
          if (!item) return false;

          // Get type_menage names in all languages
          const typeNameFr = (item.name_fr || '').toLowerCase().trim();
          const typeNameAr = (item.name_ar || '').toLowerCase().trim();
          const typeNameEn = (item.name_en || '').toLowerCase().trim();

          // Check if contains "cirage" or "chaussures" or "تلميع" or "أحذية" or "shoe polish"
          const frHasCirage = typeNameFr.includes('cirage') || 
                            (typeNameFr.includes('chaussure') && typeNameFr.includes('cirage'));
          const arHasCirage = typeNameAr.includes('تلميع') || 
                             (typeNameAr.includes('أحذية') && typeNameAr.includes('تلميع'));
          const enHasCirage = typeNameEn.includes('polish') || 
                             (typeNameEn.includes('shoe') && typeNameEn.includes('polish'));

          // Include if has cirage/polish
          return frHasCirage || arHasCirage || enHasCirage;
        });

        // Remove duplicates based on ID
        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        console.log('[LastrageChassures] Filtered items:', uniqueItems.length, 'out of', allTypes.length);
        setItems(uniqueItems);
      } catch (err) {
        console.error('[LastrageChassures] Exception loading data:', err);
        const errorMessage = err?.message || err?.toString() || 'Erreur de connexion';
        setError('Erreur de connexion: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadCirageChassures();
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

  // Calculate final price for an item
  const calculateFinalPrice = (item) => {
    const basePrice = parseFloat(item.price) || 0;
    const count = shoeCounts[item.id] || 0;
    
    if (count === 0 || basePrice === 0) {
      return null;
    }
    
    const finalPrice = basePrice * count;
    return finalPrice.toFixed(2);
  };

  // Update final prices when counts change
  useEffect(() => {
    const newFinalPrices = {};
    items.forEach(item => {
      const count = shoeCounts[item.id] || 0;
      
      // Only calculate if there are shoes
      if (count > 0) {
        const finalPrice = calculateFinalPrice(item);
        if (finalPrice) {
          newFinalPrices[item.id] = finalPrice;
        }
      }
    });
    
    setFinalPrices(newFinalPrices);
  }, [shoeCounts, items]);

  // Handle shoe count change
  const handleShoeCountChange = (itemId, count) => {
    const numCount = parseInt(count) || 0;
    setShoeCounts(prev => ({
      ...prev,
      [itemId]: numCount
    }));
    
    // Clear validation error when user changes the count
    if (numCount > 0) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[itemId];
        return newErrors;
      });
    }
  };

  const handleReserve = (item) => {
    const count = shoeCounts[item.id] || 0;
    
    // Validate shoe count
    if (count === 0 || count < 1) {
      setValidationErrors(prev => ({
        ...prev,
        [item.id]: t('lastrage_chassures_page.shoe_count_error', 'يجب أن يكون عدد الأحذية أكبر من 0')
      }));
      return;
    }
    
    // Clear validation error for this item
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[item.id];
      return newErrors;
    });
    
    const { name, description } = getLocalizedText(item);
    const finalPrice = finalPrices[item.id] || item.price || 0;
    
    navigate('/reservation-chaussures', {
      state: {
        type: {
          id: item.id,
          name: name,
          description: description,
          price: item.price,
          service_id: item.menage_id,
          shoeCount: count,
          finalPrice: finalPrice
        },
        serviceType: 'cirage_chaussures'
      }
    });
  };

  if (loading) {
    return (
      <main className="lastrage-chassures-page">
        <div className="lastrage-chassures-header">
          <button 
            className="lastrage-chassures-back-btn"
            onClick={() => navigate('/chaussures')}
            title={t('lastrage_chassures_page.back', 'Retour')}
          >
            ← {t('lastrage_chassures_page.back', 'Retour')}
          </button>
        </div>
        <div className="lastrage-chassures-loading">Chargement des services Cirage des Chaussures...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="lastrage-chassures-page">
        <div className="lastrage-chassures-header">
          <button 
            className="lastrage-chassures-back-btn"
            onClick={() => navigate('/chaussures')}
            title={t('lastrage_chassures_page.back', 'Retour')}
          >
            ← {t('lastrage_chassures_page.back', 'Retour')}
          </button>
        </div>
        <div className="lastrage-chassures-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="lastrage-chassures-page">
        <div className="lastrage-chassures-header">
          <button 
            className="lastrage-chassures-back-btn"
            onClick={() => navigate('/chaussures')}
            title={t('lastrage_chassures_page.back', 'Retour')}
          >
            ← {t('lastrage_chassures_page.back', 'Retour')}
          </button>
        </div>
        <div className="lastrage-chassures-empty">Aucun service Cirage des Chaussures disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="lastrage-chassures-page">
      <div className="lastrage-chassures-header">
        <button 
          className="lastrage-chassures-back-btn"
          onClick={() => navigate('/chaussures')}
          title={t('lastrage_chassures_page.back', 'Retour')}
        >
          ← {t('lastrage_chassures_page.back', 'Retour')}
        </button>
        <h1 className="lastrage-chassures-title">
          {t('lastrage_chassures_page.title', 'Cirage des Chaussures')}
        </h1>
      </div>
      <div className="lastrage-chassures-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const priceFormatted = formatPrice(item.price);
          return (
            <article key={item.id} className="lastrage-chassures-card">
              {item.image && (
                <div className="lastrage-chassures-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Cirage des Chaussures'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="lastrage-chassures-card-body">
                <h2 className="lastrage-chassures-card-title">{name || `Service #${item.id}`}</h2>
                {description && (
                  <p className="lastrage-chassures-card-description">
                    {description}
                  </p>
                )}
                {priceFormatted && (
                  <div className="lastrage-chassures-card-price-per-item">
                    {priceFormatted} {t('lastrage_chassures_page.per_shoe', 'par paire')}
                  </div>
                )}
                {/* Shoe Count Section */}
                <div className="lastrage-chassures-shoe-section">
                  <label className="lastrage-chassures-shoe-count-label">
                    {t('lastrage_chassures_page.shoe_count', '📦 عدد الأحذية')}: 
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={shoeCounts[item.id] || 0}
                      onChange={(e) => handleShoeCountChange(item.id, e.target.value)}
                      className="lastrage-chassures-shoe-count-input"
                    />
                  </label>
                  {validationErrors[item.id] && (
                    <div className="lastrage-chassures-validation-error">
                      {validationErrors[item.id]}
                    </div>
                  )}
                </div>
                {finalPrices[item.id] && (
                  <div className="lastrage-chassures-card-price">
                    <span className="lastrage-chassures-price-label">
                      {t('lastrage_chassures_page.total_price', 'السعر الإجمالي')}:
                    </span>
                    <span className="lastrage-chassures-price-value">
                      {finalPrices[item.id]} DH
                    </span>
                  </div>
                )}
                
                <button
                  className="lastrage-chassures-card-reserve-btn"
                  onClick={() => handleReserve(item)}
                  disabled={(shoeCounts[item.id] || 0) === 0}
                >
                  {t('lastrage_chassures_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


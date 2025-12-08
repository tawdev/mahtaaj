import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Usin.css';

export default function Usin() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // State for dimensions per item
  const [dimensions, setDimensions] = useState({}); // { itemId: { length, width } }
  const [finalPrices, setFinalPrices] = useState({}); // { itemId: finalPrice }

  useEffect(() => {
    const loadUsin = async () => {
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
        // 1. menage name contains "Bureaux et Usine" or "مكاتب ومصنع" or "Office and Factory"
        // 2. type_menage name contains "usine" or "مصنع" or "factory" (but NOT "bureau" or "مكتب")
        const filtered = allTypes.filter(item => {
          if (!item) return false;

          // Check menage name
          const menage = item.menage;
          if (!menage) return false;
          
          const menageNameFr = (menage.name_fr || '').toLowerCase().trim();
          const menageNameAr = (menage.name_ar || '').toLowerCase().trim();
          const menageNameEn = (menage.name_en || '').toLowerCase().trim();
          
          const isBureauxEtUsine = 
            (menageNameFr.includes('bureaux') && menageNameFr.includes('usine')) ||
            (menageNameFr.includes('bureau') && menageNameFr.includes('usine')) ||
            (menageNameAr.includes('مكاتب') && menageNameAr.includes('مصنع')) ||
            (menageNameAr.includes('مكتب') && menageNameAr.includes('مصنع')) ||
            (menageNameEn.includes('office') && menageNameEn.includes('factory'));

          if (!isBureauxEtUsine) return false;

          // Check type_menage name for "usine" (but NOT "bureau")
          const typeNameFr = (item.name_fr || '').toLowerCase().trim();
          const typeNameAr = (item.name_ar || '').toLowerCase().trim();
          const typeNameEn = (item.name_en || '').toLowerCase().trim();

          // Must contain "usine" / "مصنع" / "factory"
          const frHasUsine = typeNameFr.includes('usine') && !typeNameFr.includes('bureau');
          const arHasUsine = typeNameAr.includes('مصنع') && !typeNameAr.includes('مكتب');
          const enHasUsine = typeNameEn.includes('factory') && !typeNameEn.includes('office');

          return frHasUsine || arHasUsine || enHasUsine;
        });

        // Remove duplicates based on ID
        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        console.log('[Usin] Filtered items:', uniqueItems.length, 'out of', allTypes.length);
        setItems(uniqueItems);
      } catch (err) {
        console.error('[Usin] Exception loading data:', err);
        const errorMessage = err?.message || err?.toString() || 'Erreur de connexion';
        setError('Erreur de connexion: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadUsin();
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

  // Calculate total area in m²
  const calculateTotalMetre = (itemId) => {
    const dim = dimensions[itemId];
    if (!dim) return 0;
    
    const length = parseFloat(dim.length) || 0;
    const width = parseFloat(dim.width) || 0;
    
    if (length === 0 || width === 0) return 0;
    
    // Convert cm² to m²: (length × width) / 10000
    return (length * width) / 10000;
  };

  // Calculate final price for an item
  const calculateFinalPrice = (item) => {
    const basePrice = parseFloat(item.price) || 0;
    const totalMetre = calculateTotalMetre(item.id);
    
    if (totalMetre === 0 || basePrice === 0) {
      return null;
    }
    
    const finalPrice = basePrice * totalMetre;
    return finalPrice.toFixed(2);
  };

  // Update final prices when dimensions change
  useEffect(() => {
    const newFinalPrices = {};
    items.forEach(item => {
      const dim = dimensions[item.id];
      
      // Only calculate if dimensions are provided
      if (dim && (dim.length > 0 || dim.width > 0)) {
        const finalPrice = calculateFinalPrice(item);
        if (finalPrice) {
          newFinalPrices[item.id] = finalPrice;
        }
      }
    });
    
    setFinalPrices(newFinalPrices);
  }, [dimensions, items]);

  // Handle dimension change
  const handleDimensionChange = (itemId, field, value) => {
    // Remove non-numeric characters except decimal point
    let cleanedValue = value.replace(/[^\d.]/g, '');
    
    // Remove leading zeros (but keep "0" or "0.x")
    if (cleanedValue.length > 1 && cleanedValue.startsWith('0') && !cleanedValue.startsWith('0.')) {
      cleanedValue = cleanedValue.replace(/^0+/, '');
    }
    
    // If empty, set to "0"
    if (cleanedValue === '' || cleanedValue === '.') {
      cleanedValue = '0';
    }
    
    setDimensions(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { length: '0', width: '0' }),
        [field]: cleanedValue
      }
    }));
  };

  // Check if dimensions are valid (both > 0)
  const isValidDimensions = (itemId) => {
    const dim = dimensions[itemId];
    if (!dim) return false;
    const length = parseFloat(dim.length) || 0;
    const width = parseFloat(dim.width) || 0;
    return length > 0 && width > 0;
  };

  const handleReserve = (item) => {
    // Validate dimensions before proceeding
    if (!isValidDimensions(item.id)) {
      return; // Don't proceed if dimensions are invalid
    }

    const { name, description } = getLocalizedText(item);
    const dim = dimensions[item.id] || { length: '0', width: '0' };
    const totalMetre = calculateTotalMetre(item.id);
    const finalPrice = finalPrices[item.id] || item.price || 0;
    
    navigate('/reservation-bureaux-usin', {
      state: {
        type: {
          id: item.id,
          name: name,
          description: description,
          price: item.price,
          image: item.image,
          service_id: item.menage_id,
          length: dim.length,
          width: dim.width,
          totalMetre: totalMetre,
          finalPrice: finalPrice
        },
        serviceType: 'usine'
      }
    });
  };

  if (loading) {
    return (
      <main className="usin-page">
        <div className="usin-header">
          <button 
            className="usin-back-btn"
            onClick={() => navigate('/bureaux-et-usine')}
            title={t('usin_page.back', 'Retour')}
          >
            ← {t('usin_page.back', 'Retour')}
          </button>
        </div>
        <div className="usin-loading">Chargement des services Usine...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="usin-page">
        <div className="usin-header">
          <button 
            className="usin-back-btn"
            onClick={() => navigate('/bureaux-et-usine')}
            title={t('usin_page.back', 'Retour')}
          >
            ← {t('usin_page.back', 'Retour')}
          </button>
        </div>
        <div className="usin-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="usin-page">
        <div className="usin-header">
          <button 
            className="usin-back-btn"
            onClick={() => navigate('/bureaux-et-usine')}
            title={t('usin_page.back', 'Retour')}
          >
            ← {t('usin_page.back', 'Retour')}
          </button>
        </div>
        <div className="usin-empty">Aucun service Usine disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="usin-page">
      <div className="usin-header">
        <button 
          className="usin-back-btn"
          onClick={() => navigate('/bureaux-et-usine')}
          title={t('usin_page.back', 'Retour')}
        >
          ← {t('usin_page.back', 'Retour')}
        </button>
        <h1 className="usin-title">
          {t('usin_page.title', 'Usine')}
        </h1>
      </div>
      <div className="usin-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const priceFormatted = formatPrice(item.price);
          const dim = dimensions[item.id] || { length: '0', width: '0' };
          const totalMetre = calculateTotalMetre(item.id);
          return (
            <article key={item.id} className="usin-card">
              {item.image && (
                <div className="usin-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Usine'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="usin-card-body">
                <h2 className="usin-card-title">{name || `Service #${item.id}`}</h2>
                {description && (
                  <p className="usin-card-description">
                    {description}
                  </p>
                )}
                {priceFormatted && (
                  <div className="usin-card-price-per-meter">
                    {priceFormatted}/m²
                  </div>
                )}
                {/* Dimensions Section */}
                <div className="usin-dimension-section">
                  <div className="usin-dimension-group">
                    <label className="usin-dimension-label">
                      {t('usin_page.length', 'Longueur (cm)')}:
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={dim.length}
                      onChange={(e) => handleDimensionChange(item.id, 'length', e.target.value)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const cleaned = pastedText.replace(/[^\d.]/g, '').replace(/^0+/, '') || '0';
                        handleDimensionChange(item.id, 'length', cleaned);
                      }}
                      className="usin-dimension-input"
                      placeholder="0"
                    />
                  </div>
                  <div className="usin-dimension-group">
                    <label className="usin-dimension-label">
                      {t('usin_page.width', 'Largeur (cm)')}:
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={dim.width}
                      onChange={(e) => handleDimensionChange(item.id, 'width', e.target.value)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const cleaned = pastedText.replace(/[^\d.]/g, '').replace(/^0+/, '') || '0';
                        handleDimensionChange(item.id, 'width', cleaned);
                      }}
                      className="usin-dimension-input"
                      placeholder="0"
                    />
                  </div>
                  {totalMetre > 0 && (
                    <div className="usin-total-metre">
                      {t('usin_page.total_area', 'Surface totale')}: {totalMetre.toFixed(2)} m²
                    </div>
                  )}
                  {!isValidDimensions(item.id) && (
                    <div className="usin-validation-message">
                      {t('usin_page.validation_message', '⚠️ يجب أن تكون Longueur و Largeur أكبر من 0')}
                    </div>
                  )}
                </div>
                
                {finalPrices[item.id] && (
                  <div className="usin-card-price">
                    <span className="usin-price-label">
                      {t('usin_page.total_price', 'السعر الإجمالي')}:
                    </span>
                    <span className="usin-price-value">
                      {finalPrices[item.id]} DH
                    </span>
                  </div>
                )}
                
                <button
                  className={`usin-card-reserve-btn ${!isValidDimensions(item.id) ? 'usin-card-reserve-btn-disabled' : ''}`}
                  onClick={() => handleReserve(item)}
                  disabled={!isValidDimensions(item.id)}
                >
                  {t('usin_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


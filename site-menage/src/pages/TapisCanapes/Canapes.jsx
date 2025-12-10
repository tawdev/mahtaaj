import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Canapes.css';

export default function Canapes() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // State for canape count and dimensions per item
  const [canapeCounts, setCanapeCounts] = useState({}); // { itemId: count }
  const [canapeDimensions, setCanapeDimensions] = useState({}); // { itemId: [{ length, width }, ...] }
  const [finalPrices, setFinalPrices] = useState({}); // { itemId: finalPrice }

  useEffect(() => {
    const loadCanapes = async () => {
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

        // Filter: Only items where name contains "canapés" (sofa) but NOT "tapis" (carpet)
        const filtered = allTypes.filter(item => {
          if (!item) return false;

          // Get type_menage names in all languages
          const typeNameFr = (item.name_fr || '').toLowerCase().trim();
          const typeNameAr = (item.name_ar || '').toLowerCase().trim();
          const typeNameEn = (item.name_en || '').toLowerCase().trim();

          // Check if contains "canapés" or "sofa" or "أريكة" or "أرائك"
          const frHasCanapes = typeNameFr.includes('canapé') || typeNameFr.includes('canapes') || typeNameFr.includes('sofa');
          const arHasCanapes = typeNameAr.includes('أريكة') || typeNameAr.includes('أرائك') || typeNameAr.includes('كنب') || typeNameAr.includes('canapé') || typeNameAr.includes('canapes') || typeNameAr.includes('sofa');
          const enHasCanapes = typeNameEn.includes('canap') || typeNameEn.includes('sofa');

          // Exclude items that contain "tapis" or "carpet" or "rug" or "سجاد"
          const frHasTapis = typeNameFr.includes('tapis') || typeNameFr.includes('carpet') || typeNameFr.includes('rug');
          const arHasTapis = typeNameAr.includes('سجاد') || typeNameAr.includes('tapis') || typeNameAr.includes('carpet');
          const enHasTapis = typeNameEn.includes('tapis') || typeNameEn.includes('carpet') || typeNameEn.includes('rug');

          // Include if has canapés/sofa but NOT tapis/carpet
          return (frHasCanapes || arHasCanapes || enHasCanapes) && !frHasTapis && !arHasTapis && !enHasTapis;
        });

        // Remove duplicates based on ID
        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        console.log('[Canapes] Filtered items:', uniqueItems.length, 'out of', allTypes.length);
        setItems(uniqueItems);
      } catch (err) {
        console.error('[Canapes] Exception loading data:', err);
        const errorMessage = err?.message || err?.toString() || 'Erreur de connexion';
        setError('Erreur de connexion: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadCanapes();
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

  // Calculate total square meters from dimensions
  const calculateTotalMetre = (dimensions) => {
    if (!dimensions || dimensions.length === 0) {
      return 0;
    }
    return dimensions.reduce((total, dim) => {
      const length = parseFloat(dim.length) || 0;
      const width = parseFloat(dim.width) || 0;
      // Convert cm² to m²: (length × width) / 10000
      const areaInM2 = (length * width) / 10000;
      return total + areaInM2;
    }, 0);
  };

  // Calculate final price for an item
  const calculateFinalPrice = (item) => {
    const basePrice = parseFloat(item.price) || 0;
    const dimensions = canapeDimensions[item.id] || [];
    const totalMetre = calculateTotalMetre(dimensions);
    
    if (totalMetre === 0 || basePrice === 0) {
      return null;
    }
    
    // New pricing logic: Minimum 8 meters = 800 DH, otherwise area × 100 DH
    const MINIMUM_AREA = 8; // meters
    const MINIMUM_PRICE = 800; // DH
    const PRICE_PER_METER = 100; // DH per meter
    
    let finalPrice;
    if (totalMetre <= MINIMUM_AREA) {
      // If area ≤ 8 meters, fixed price = 800 DH
      finalPrice = MINIMUM_PRICE;
    } else {
      // If area > 8 meters, price = area × 100 DH
      finalPrice = totalMetre * PRICE_PER_METER;
    }
    
    return finalPrice.toFixed(2);
  };

  // Update final prices when dimensions or counts change
  useEffect(() => {
    const newFinalPrices = {};
    items.forEach(item => {
      const dimensions = canapeDimensions[item.id] || [];
      const count = canapeCounts[item.id] || 0;
      
      // Only calculate if there are canapes with dimensions
      if (count > 0 && dimensions.length > 0) {
        const finalPrice = calculateFinalPrice(item);
        if (finalPrice) {
          newFinalPrices[item.id] = finalPrice;
        }
      }
    });
    
    setFinalPrices(newFinalPrices);
  }, [canapeDimensions, canapeCounts, items]);

  // Handle canape count change
  const handleCanapeCountChange = (itemId, count) => {
    const numCount = parseInt(count) || 0;
    setCanapeCounts(prev => ({
      ...prev,
      [itemId]: numCount
    }));
    
    // Update dimensions array while preserving existing values
    setCanapeDimensions(prev => {
      const currentDimensions = prev[itemId] || [];
      const currentLength = currentDimensions.length;
      
      if (numCount === 0) {
        // Remove dimensions if count is 0
        const newDims = { ...prev };
        delete newDims[itemId];
        return newDims;
      }
      
      if (numCount > currentLength) {
        // Increase: Add new empty dimensions, keep existing ones
        const newDimensions = [...currentDimensions];
        for (let i = currentLength; i < numCount; i++) {
          newDimensions.push({ length: 0, width: 0 });
        }
        return {
          ...prev,
          [itemId]: newDimensions
        };
      } else if (numCount < currentLength) {
        // Decrease: Remove only the extra dimensions, keep existing ones
        const newDimensions = currentDimensions.slice(0, numCount);
        return {
          ...prev,
          [itemId]: newDimensions
        };
      }
      
      // If count is the same, keep dimensions as is
      return prev;
    });
  };

  // Handle dimension change for a specific canape
  const handleDimensionChange = (itemId, canapeIndex, field, value) => {
    // Remove any non-numeric characters except decimal point
    // Allow only digits and one decimal point
    let cleanedValue = value.replace(/[^\d.]/g, '');
    
    // Remove multiple decimal points, keep only the first one
    const parts = cleanedValue.split('.');
    if (parts.length > 2) {
      cleanedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Remove leading zeros, but preserve "0" if it's the only character
    // Also preserve decimal numbers like "0.5" or "0.05"
    if (cleanedValue.length > 1) {
      // If it starts with "0" and the second character is not ".", remove leading zeros
      if (cleanedValue.startsWith('0') && cleanedValue[1] !== '.') {
        cleanedValue = cleanedValue.replace(/^0+/, '');
      }
    }
    
    // If empty after cleaning, set to "0"
    if (cleanedValue === '' || cleanedValue === '.') {
      cleanedValue = '0';
    }
    
    // Parse to number for storage
    const numValue = parseFloat(cleanedValue) || 0;
    
    setCanapeDimensions(prev => {
      const itemDims = prev[itemId] || [];
      const newDims = [...itemDims];
      newDims[canapeIndex] = {
        ...newDims[canapeIndex],
        [field]: numValue
      };
      return {
        ...prev,
        [itemId]: newDims
      };
    });
  };

  // Handle remove a specific canape
  const handleRemoveCanape = (itemId, canapeIndex) => {
    setCanapeDimensions(prev => {
      const itemDims = prev[itemId] || [];
      // Remove the canape at the specified index
      const newDims = itemDims.filter((_, i) => i !== canapeIndex);
      
      // Update count to match new dimensions length
      setCanapeCounts(prevCounts => ({
        ...prevCounts,
        [itemId]: newDims.length
      }));
      
      if (newDims.length === 0) {
        // Remove dimensions if no canapes left
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      }
      
      return {
        ...prev,
        [itemId]: newDims
      };
    });
  };

  // Check if all dimensions are valid (all length > 0 and width > 0)
  const isValidDimensions = (itemId) => {
    const count = canapeCounts[itemId] || 0;
    if (count === 0) return false;
    
    const dimensions = canapeDimensions[itemId] || [];
    if (dimensions.length === 0) return false;
    
    // Check that all canapes have valid dimensions (length > 0 and width > 0)
    return dimensions.every(dim => {
      const length = parseFloat(dim.length) || 0;
      const width = parseFloat(dim.width) || 0;
      return length > 0 && width > 0;
    });
  };

  const handleReserve = (item) => {
    // Validate dimensions before proceeding
    if (!isValidDimensions(item.id)) {
      return; // Don't proceed if dimensions are invalid
    }

    const { name, description } = getLocalizedText(item);
    
    // Get canape data for this item
    const count = canapeCounts[item.id] || 0;
    const dimensions = canapeDimensions[item.id] || [];
    const finalPrice = finalPrices[item.id] || item.price || 0;
    
    // Calculate total area
    let totalArea = 0;
    if (dimensions.length > 0) {
      dimensions.forEach(dim => {
        const length = parseFloat(dim.length) || 0;
        const width = parseFloat(dim.width) || 0;
        totalArea += (length * width) / 10000; // Convert cm² to m²
      });
    }

    navigate('/reservation-tapis-canapes', {
      state: {
        type: {
          id: item.id,
          name: name,
          description: description,
          price: item.price,
          service_id: item.menage_id,
          canapeCount: count,
          carpetDimensions: dimensions, // Using same field name for consistency
          finalPrice: finalPrice,
          totalArea: totalArea
        },
        serviceType: 'canapes'
      }
    });
  };

  if (loading) {
    return (
      <main className="canapes-page">
        <div className="canapes-header">
          <button 
            className="canapes-back-btn"
            onClick={() => navigate('/tapis-canapes')}
            title={t('canapes_page.back', 'Retour')}
          >
            ← {t('canapes_page.back', 'Retour')}
          </button>
        </div>
        <div className="canapes-loading">Chargement des services Canapés...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="canapes-page">
        <div className="canapes-header">
          <button 
            className="canapes-back-btn"
            onClick={() => navigate('/tapis-canapes')}
            title={t('canapes_page.back', 'Retour')}
          >
            ← {t('canapes_page.back', 'Retour')}
          </button>
        </div>
        <div className="canapes-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="canapes-page">
        <div className="canapes-header">
          <button 
            className="canapes-back-btn"
            onClick={() => navigate('/tapis-canapes')}
            title={t('canapes_page.back', 'Retour')}
          >
            ← {t('canapes_page.back', 'Retour')}
          </button>
        </div>
        <div className="canapes-empty">Aucun service Canapés disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="canapes-page">
      <div className="canapes-header">
        <button 
          className="canapes-back-btn"
          onClick={() => navigate('/tapis-canapes')}
          title={t('canapes_page.back', 'Retour')}
        >
          ← {t('canapes_page.back', 'Retour')}
        </button>
        <h1 className="canapes-title">
          {t('canapes_page.title', 'Canapés')}
        </h1>
      </div>
      <div className="canapes-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const priceFormatted = formatPrice(item.price);
          return (
            <article key={item.id} className="canapes-card">
              {item.image && (
                <div className="canapes-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Canapés'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="canapes-card-body">
                <h2 className="canapes-card-title">{name || `Service #${item.id}`}</h2>
                {description && (
                  <p className="canapes-card-description">
                    {description}
                  </p>
                )}
                {priceFormatted && (
                  <div className="canapes-card-price-info">
                    <div className="canapes-card-price-per-meter">
                      {priceFormatted}/m²
                    </div>
                    <div className="canapes-card-price-notes">
                      <div className="canapes-card-price-note">
                        {t('canapes_page.minimum_note', 'الحد الأدنى هو 8 متر')}
                      </div>
                      <div className="canapes-card-team-message">
                        {t('canapes_page.team_message', 'Déplacement d\'une équipe de 2 ou 3 personnes avec leur machine')}
                      </div>
                    </div>
                  </div>
                )}
                {/* Canape Count and Dimensions Section */}
                <div className="canapes-canape-section">
                  <label className="canapes-canape-count-label">
                    {t('canapes_page.canape_count', '📏 عدد الكنب')}: 
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={canapeCounts[item.id] || 0}
                      onChange={(e) => handleCanapeCountChange(item.id, e.target.value)}
                      className="canapes-canape-count-input"
                    />
                  </label>
                  
                  {/* Dynamic canape dimensions inputs */}
                  {canapeCounts[item.id] > 0 && (
                    <div className="canapes-canapes-dimensions">
                      {Array.from({ length: canapeCounts[item.id] }, (_, index) => {
                        const dimensions = canapeDimensions[item.id] || [];
                        const canape = dimensions[index] || { length: 0, width: 0 };
                        return (
                          <div key={index} className="canapes-canape-dimension-group">
                            <div className="canapes-canape-header">
                              <h4 className="canapes-canape-number">
                                {t('canapes_page.canape', 'الكنبة')} {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => handleRemoveCanape(item.id, index)}
                                className="canapes-remove-btn"
                                title={t('canapes_page.remove', 'إلغاء')}
                              >
                                {t('canapes_page.remove', 'إلغاء')}
                              </button>
                            </div>
                            <div className="canapes-dimension-inputs">
                              <label className="canapes-dimension-label">
                                {t('canapes_page.length', 'الطول (cm)')}:
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  min="0"
                                  step="0.1"
                                  value={canape.length || 0}
                                  onChange={(e) => handleDimensionChange(item.id, index, 'length', e.target.value)}
                                  onPaste={(e) => {
                                    e.preventDefault();
                                    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                                    // Only allow numeric values with decimal point
                                    const cleanedPaste = pastedText.replace(/[^\d.]/g, '');
                                    if (cleanedPaste) {
                                      handleDimensionChange(item.id, index, 'length', cleanedPaste);
                                    }
                                  }}
                                  className="canapes-dimension-input"
                                />
                              </label>
                              <label className="canapes-dimension-label">
                                {t('canapes_page.width', 'العرض (cm)')}:
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  min="0"
                                  step="0.1"
                                  value={canape.width || 0}
                                  onChange={(e) => handleDimensionChange(item.id, index, 'width', e.target.value)}
                                  onPaste={(e) => {
                                    e.preventDefault();
                                    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                                    // Only allow numeric values with decimal point
                                    const cleanedPaste = pastedText.replace(/[^\d.]/g, '');
                                    if (cleanedPaste) {
                                      handleDimensionChange(item.id, index, 'width', cleanedPaste);
                                    }
                                  }}
                                  className="canapes-dimension-input"
                                />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {canapeCounts[item.id] > 0 && !isValidDimensions(item.id) && (
                    <div className="canapes-validation-message">
                      {t('canapes_page.validation_message', '⚠️ Longueur et Largeur doivent être > 0')}
                    </div>
                  )}
                </div>
                {finalPrices[item.id] && (
                  <div className="canapes-card-price">
                    {finalPrices[item.id]} DH
                  </div>
                )}
                
                <button
                  className={`canapes-card-reserve-btn ${!isValidDimensions(item.id) ? 'canapes-card-reserve-btn-disabled' : ''}`}
                  onClick={() => handleReserve(item)}
                  disabled={!isValidDimensions(item.id)}
                >
                  {t('canapes_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Tapis.css';

export default function Tapis() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // State for carpet count and dimensions per item
  const [carpetCounts, setCarpetCounts] = useState({}); // { itemId: count }
  const [carpetDimensions, setCarpetDimensions] = useState({}); // { itemId: [{ length, width }, ...] }
  const [finalPrices, setFinalPrices] = useState({}); // { itemId: finalPrice }

  useEffect(() => {
    const loadTapis = async () => {
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

        // Filter: Only items where name contains "tapis" (carpet/rug) but NOT "canapés" (sofa)
        const filtered = allTypes.filter(item => {
          if (!item) return false;

          // Get type_menage names in all languages
          const typeNameFr = (item.name_fr || '').toLowerCase().trim();
          const typeNameAr = (item.name_ar || '').toLowerCase().trim();
          const typeNameEn = (item.name_en || '').toLowerCase().trim();

          // Check if contains "tapis" or "carpet" or "rug" or "سجاد"
          const frHasTapis = typeNameFr.includes('tapis') || typeNameFr.includes('tapis');
          const arHasTapis = typeNameAr.includes('سجاد') || typeNameAr.includes('tapis');
          const enHasTapis = typeNameEn.includes('tapis') || typeNameEn.includes('carpet') || typeNameEn.includes('rug');

          // Exclude items that contain "canapés" or "sofa" or "كنب"
          const frHasCanapes = typeNameFr.includes('canapé') || typeNameFr.includes('canapes') || typeNameFr.includes('sofa');
          const arHasCanapes = typeNameAr.includes('كنب') || typeNameAr.includes('canapé') || typeNameAr.includes('canapes');
          const enHasCanapes = typeNameEn.includes('canap') || typeNameEn.includes('sofa');

          // Include if has tapis/carpet but NOT canapés/sofa
          return (frHasTapis || arHasTapis || enHasTapis) && !frHasCanapes && !arHasCanapes && !enHasCanapes;
        });

        // Remove duplicates based on ID
        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        console.log('[Tapis] Filtered items:', uniqueItems.length, 'out of', allTypes.length);
        setItems(uniqueItems);
      } catch (err) {
        console.error('[Tapis] Exception loading data:', err);
        const errorMessage = err?.message || err?.toString() || 'Erreur de connexion';
        setError('Erreur de connexion: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadTapis();
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
    const dimensions = carpetDimensions[item.id] || [];
    const totalMetre = calculateTotalMetre(dimensions);
    
    if (totalMetre === 0 || basePrice === 0) {
      return null;
    }
    
    const finalPrice = basePrice * totalMetre;
    return finalPrice.toFixed(2);
  };

  // Update final prices when dimensions or counts change
  useEffect(() => {
    const newFinalPrices = {};
    items.forEach(item => {
      const dimensions = carpetDimensions[item.id] || [];
      const count = carpetCounts[item.id] || 0;
      
      // Only calculate if there are carpets with dimensions
      if (count > 0 && dimensions.length > 0) {
        const finalPrice = calculateFinalPrice(item);
        if (finalPrice) {
          newFinalPrices[item.id] = finalPrice;
        }
      }
    });
    
    setFinalPrices(newFinalPrices);
  }, [carpetDimensions, carpetCounts, items]);

  // Handle carpet count change
  const handleCarpetCountChange = (itemId, count) => {
    const numCount = parseInt(count) || 0;
    setCarpetCounts(prev => ({
      ...prev,
      [itemId]: numCount
    }));
    
    // Update dimensions array while preserving existing values
    setCarpetDimensions(prev => {
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

  // Handle dimension change for a specific carpet
  const handleDimensionChange = (itemId, carpetIndex, field, value) => {
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
    
    setCarpetDimensions(prev => {
      const itemDims = prev[itemId] || [];
      const newDims = [...itemDims];
      newDims[carpetIndex] = {
        ...newDims[carpetIndex],
        [field]: numValue
      };
      return {
        ...prev,
        [itemId]: newDims
      };
    });
  };

  // Handle remove a specific carpet
  const handleRemoveTapis = (itemId, carpetIndex) => {
    setCarpetDimensions(prev => {
      const itemDims = prev[itemId] || [];
      // Remove the carpet at the specified index
      const newDims = itemDims.filter((_, i) => i !== carpetIndex);
      
      // Update count to match new dimensions length
      setCarpetCounts(prevCounts => ({
        ...prevCounts,
        [itemId]: newDims.length
      }));
      
      if (newDims.length === 0) {
        // Remove dimensions if no carpets left
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
    const count = carpetCounts[itemId] || 0;
    if (count === 0) return false;
    
    const dimensions = carpetDimensions[itemId] || [];
    if (dimensions.length === 0) return false;
    
    // Check that all carpets have valid dimensions (length > 0 and width > 0)
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
    
    // Get carpet data for this item
    const count = carpetCounts[item.id] || 0;
    const dimensions = carpetDimensions[item.id] || [];
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
          carpetCount: count,
          carpetDimensions: dimensions,
          finalPrice: finalPrice,
          totalArea: totalArea
        },
        serviceType: 'tapis'
      }
    });
  };

  if (loading) {
    return (
      <main className="tapis-page">
        <div className="tapis-header">
          <button 
            className="tapis-back-btn"
            onClick={() => navigate('/tapis-canapes')}
            title={t('tapis_page.back', 'Retour')}
          >
            ← {t('tapis_page.back', 'Retour')}
          </button>
        </div>
        <div className="tapis-loading">Chargement des services Tapis...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="tapis-page">
        <div className="tapis-header">
          <button 
            className="tapis-back-btn"
            onClick={() => navigate('/tapis-canapes')}
            title={t('tapis_page.back', 'Retour')}
          >
            ← {t('tapis_page.back', 'Retour')}
          </button>
        </div>
        <div className="tapis-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="tapis-page">
        <div className="tapis-header">
          <button 
            className="tapis-back-btn"
            onClick={() => navigate('/tapis-canapes')}
            title={t('tapis_page.back', 'Retour')}
          >
            ← {t('tapis_page.back', 'Retour')}
          </button>
        </div>
        <div className="tapis-empty">Aucun service Tapis disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="tapis-page">
      <div className="tapis-header">
        <button 
          className="tapis-back-btn"
          onClick={() => navigate('/tapis-canapes')}
          title={t('tapis_page.back', 'Retour')}
        >
          ← {t('tapis_page.back', 'Retour')}
        </button>
        <h1 className="tapis-title">
          {t('tapis_page.title', 'Tapis')}
        </h1>
      </div>
      <div className="tapis-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const priceFormatted = formatPrice(item.price);
          return (
            <article key={item.id} className="tapis-card">
              {item.image && (
                <div className="tapis-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Tapis'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="tapis-card-body">
                <h2 className="tapis-card-title">{name || `Service #${item.id}`}</h2>
                {description && (
                  <p className="tapis-card-description">
                    {description}
                  </p>
                )}
                {priceFormatted && (
                  <div className="tapis-card-price-per-meter">
                    {priceFormatted}/m²
                  </div>
                )}
                {/* Carpet Count and Dimensions Section */}
                <div className="tapis-carpet-section">
                  <label className="tapis-carpet-count-label">
                    {t('tapis_page.carpet_count', '📏 عدد السجاد')}: 
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={carpetCounts[item.id] || 0}
                      onChange={(e) => handleCarpetCountChange(item.id, e.target.value)}
                      className="tapis-carpet-count-input"
                    />
                  </label>
                  
                  {/* Dynamic carpet dimensions inputs */}
                  {carpetCounts[item.id] > 0 && (
                    <div className="tapis-carpets-dimensions">
                      {Array.from({ length: carpetCounts[item.id] }, (_, index) => {
                        const dimensions = carpetDimensions[item.id] || [];
                        const carpet = dimensions[index] || { length: 0, width: 0 };
                        return (
                          <div key={index} className="tapis-carpet-dimension-group">
                            <div className="tapis-carpet-header">
                              <h4 className="tapis-carpet-number">
                                {t('tapis_page.carpet', 'السجادة')} {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => handleRemoveTapis(item.id, index)}
                                className="tapis-remove-btn"
                                title={t('tapis_page.remove', 'إلغاء')}
                              >
                                {t('tapis_page.remove', 'إلغاء')}
                              </button>
                            </div>
                            <div className="tapis-dimension-inputs">
                              <label className="tapis-dimension-label">
                                {t('tapis_page.length', 'الطول (cm)')}:
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  min="0"
                                  step="0.1"
                                  value={carpet.length || 0}
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
                                  className="tapis-dimension-input"
                                />
                              </label>
                              <label className="tapis-dimension-label">
                                {t('tapis_page.width', 'العرض (cm)')}:
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  min="0"
                                  step="0.1"
                                  value={carpet.width || 0}
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
                                  className="tapis-dimension-input"
                                />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {carpetCounts[item.id] > 0 && !isValidDimensions(item.id) && (
                    <div className="tapis-validation-message">
                      {t('tapis_page.validation_message', '⚠️ Longueur et Largeur doivent être > 0')}
                    </div>
                  )}
                </div>
                {finalPrices[item.id] && (
                  <div className="tapis-card-price">
                    {finalPrices[item.id]} DH
                  </div>
                )}
                
                <button
                  className={`tapis-card-reserve-btn ${!isValidDimensions(item.id) ? 'tapis-card-reserve-btn-disabled' : ''}`}
                  onClick={() => handleReserve(item)}
                  disabled={!isValidDimensions(item.id)}
                >
                  {t('tapis_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


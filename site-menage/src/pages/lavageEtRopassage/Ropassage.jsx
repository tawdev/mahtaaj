import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Ropassage.css';

export default function Ropassage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // State for selected options per item
  const [selectedOptions, setSelectedOptions] = useState({}); // { itemId: ['vetements', 'grands_textiles'] }
  // State for Vêtements sub-options and quantities per item
  const [vetementsDetails, setVetementsDetails] = useState({}); // { itemId: { 'option1': { selected: true, quantity: 2 }, ... } }
  // State for Grands textiles: number of pieces and dimensions per piece, separated by long type
  const [grandsTextilesDetails, setGrandsTextilesDetails] = useState({}); // { itemId: { draps: { count: 2, pieces: [...] }, couverte: { count: 1, pieces: [...] }, ... } }
  // State for Long types selection (draps, couverte, couverte_protegee)
  const [longTypesDetails, setLongTypesDetails] = useState({}); // { itemId: ['draps', 'couverte', 'couverte_protegee'] }
  // State for final prices per item
  const [finalPrices, setFinalPrices] = useState({}); // { itemId: finalPrice }

  useEffect(() => {
    const loadRopassage = async () => {
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
        // 1. menage name contains "Lavage et Repassage" or "غسيل وكي" or "Laundry and Ironing"
        // 2. type_menage name contains "repassage" or "كي" or "ironing" (but NOT "lavage" or "غسيل" or "laundry")
        const filtered = allTypes.filter(item => {
          if (!item) return false;

          // Check menage name
          const menage = item.menage;
          if (!menage) return false;
          
          const menageNameFr = (menage.name_fr || '').toLowerCase().trim();
          const menageNameAr = (menage.name_ar || '').toLowerCase().trim();
          const menageNameEn = (menage.name_en || '').toLowerCase().trim();
          
          const isLavageEtRepassage = 
            (menageNameFr.includes('lavage') && menageNameFr.includes('repassage')) ||
            (menageNameAr.includes('غسيل') && menageNameAr.includes('كي')) ||
            (menageNameEn.includes('laundry') && menageNameEn.includes('ironing'));

          if (!isLavageEtRepassage) return false;

          // Check type_menage name for "repassage" (but NOT "lavage")
          const typeNameFr = (item.name_fr || '').toLowerCase().trim();
          const typeNameAr = (item.name_ar || '').toLowerCase().trim();
          const typeNameEn = (item.name_en || '').toLowerCase().trim();

          // Must contain "repassage" / "كي" / "ironing" but NOT "lavage" / "غسيل" / "laundry"
          const frHasRepassage = typeNameFr.includes('repassage') && !typeNameFr.includes('lavage');
          const arHasRepassage = typeNameAr.includes('كي') && !typeNameAr.includes('غسيل');
          const enHasRepassage = typeNameEn.includes('ironing') && !typeNameEn.includes('laundry');

          return frHasRepassage || arHasRepassage || enHasRepassage;
        });

        // Remove duplicates based on ID
        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        console.log('[Ropassage] Filtered items:', uniqueItems.length, 'out of', allTypes.length);
        setItems(uniqueItems);
      } catch (err) {
        console.error('[Ropassage] Exception loading data:', err);
        const errorMessage = err?.message || err?.toString() || 'Erreur de connexion';
        setError('Erreur de connexion: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadRopassage();
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

  // Prices for Vêtements sub-options
  const vetementsPrices = {
    option1: 5, // T-shirt, Sweatshirts, Short, Jeans
    option2: 10, // Jaket
    option3: 15, // Manteaux
    option4: 12 // Jacket cuire
  };

  const longTypesPrices = {
    draps: 10, // Draps
    couverte: 15, // Couverte
    couverte_protegee: 20 // Couverte protégée
  };

  // Price per m² for each long type
  const longTypesPricesPerM2 = {
    draps: 10, // Draps: 10 DH/m²
    couverte: 15, // Couverte: 15 DH/m²
    couverte_protegee: 20 // Couverte protégée: 20 DH/m²
  };

  // Handle option toggle
  const handleOptionToggle = (itemId, option) => {
    setSelectedOptions(prev => {
      const currentOptions = prev[itemId] || [];
      const isSelected = currentOptions.includes(option);
      
      if (isSelected) {
        // Remove option
        if (option === 'vetements') {
          // Clear vetements details when unselecting
          setVetementsDetails(prevDetails => {
            const newDetails = { ...prevDetails };
            delete newDetails[itemId];
            return newDetails;
          });
        } else if (option === 'grands_textiles') {
          // Clear grands textiles details when unselecting
          setGrandsTextilesDetails(prevDetails => {
            const newDetails = { ...prevDetails };
            delete newDetails[itemId];
            return newDetails;
          });
          // Clear long types details when unselecting
          setLongTypesDetails(prevDetails => {
            const newDetails = { ...prevDetails };
            delete newDetails[itemId];
            return newDetails;
          });
        }
        return {
          ...prev,
          [itemId]: currentOptions.filter(opt => opt !== option)
        };
      } else {
        // Add option
        if (option === 'grands_textiles') {
          // Initialize grands textiles with count 0
          setGrandsTextilesDetails(prev => ({
            ...prev,
            [itemId]: {
              count: 0,
              pieces: []
            }
          }));
        }
        return {
          ...prev,
          [itemId]: [...currentOptions, option]
        };
      }
    });
  };

  // Handle Vêtements sub-option toggle
  const handleVetementsSubOptionToggle = (itemId, subOption) => {
    setVetementsDetails(prev => {
      const currentDetails = prev[itemId] || {};
      const isSelected = currentDetails[subOption]?.selected || false;
      
      if (isSelected) {
        // Remove sub-option
        const newDetails = { ...currentDetails };
        delete newDetails[subOption];
        return {
          ...prev,
          [itemId]: Object.keys(newDetails).length > 0 ? newDetails : undefined
        };
      } else {
        // Add sub-option with quantity 0
        return {
          ...prev,
          [itemId]: {
            ...currentDetails,
            [subOption]: {
              selected: true,
              quantity: 0
            }
          }
        };
      }
    });
  };

  // Handle quantity change for Vêtements sub-options
  const handleQuantityChange = (itemId, subOption, quantity) => {
    const numQuantity = parseInt(quantity) || 0;
    setVetementsDetails(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [subOption]: {
          ...(prev[itemId]?.[subOption] || { selected: true }),
          quantity: numQuantity
        }
      }
    }));
  };

  // Handle Long type toggle (draps, couverte, couverte_protegee)
  const handleLongTypeToggle = (itemId, longType) => {
    setLongTypesDetails(prev => {
      const currentTypes = prev[itemId] || [];
      const isSelected = currentTypes.includes(longType);
      
      if (isSelected) {
        // Remove type
        // Also clear grands textiles details for this type
        setGrandsTextilesDetails(prevDetails => {
          const newDetails = { ...prevDetails };
          if (newDetails[itemId]) {
            const updatedItem = { ...newDetails[itemId] };
            delete updatedItem[longType];
            if (Object.keys(updatedItem).length === 0) {
              delete newDetails[itemId];
            } else {
              newDetails[itemId] = updatedItem;
            }
          }
          return newDetails;
        });
        return {
          ...prev,
          [itemId]: currentTypes.filter(type => type !== longType)
        };
      } else {
        // Add type
        // Initialize grands textiles details for this type
        setGrandsTextilesDetails(prevDetails => {
          const currentItem = prevDetails[itemId] || {};
          return {
            ...prevDetails,
            [itemId]: {
              ...currentItem,
              [longType]: {
                count: 0,
                pieces: []
              }
            }
          };
        });
        return {
          ...prev,
          [itemId]: [...currentTypes, longType]
        };
      }
    });
  };

  // Handle Grands textiles count change (now per long type)
  const handleGrandsTextilesCountChange = (itemId, longType, count) => {
    const numCount = parseInt(count) || 0;
    setGrandsTextilesDetails(prev => {
      const currentItem = prev[itemId] || {};
      const currentType = currentItem[longType] || { count: 0, pieces: [] };
      const currentPieces = currentType.pieces || [];
      
      // If increasing count, add new pieces with default dimensions
      if (numCount > currentPieces.length) {
        const newPieces = [...currentPieces];
        for (let i = currentPieces.length; i < numCount; i++) {
          newPieces.push({ length: '0', width: '0' });
        }
        return {
          ...prev,
          [itemId]: {
            ...currentItem,
            [longType]: {
              count: numCount,
              pieces: newPieces
            }
          }
        };
      } else if (numCount < currentPieces.length) {
        // If decreasing count, remove excess pieces
        return {
          ...prev,
          [itemId]: {
            ...currentItem,
            [longType]: {
              count: numCount,
              pieces: currentPieces.slice(0, numCount)
            }
          }
        };
      } else {
        return {
          ...prev,
          [itemId]: {
            ...currentItem,
            [longType]: {
              count: numCount,
              pieces: currentPieces
            }
          }
        };
      }
    });
  };

  // Handle dimension change for Grands textiles pieces (now per long type)
  const handleGrandsTextilesDimensionChange = (itemId, longType, pieceIndex, field, value) => {
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
    
    setGrandsTextilesDetails(prev => {
      const currentItem = prev[itemId] || {};
      const currentType = currentItem[longType] || { count: 0, pieces: [] };
      const newPieces = [...currentType.pieces];
      
      if (!newPieces[pieceIndex]) {
        newPieces[pieceIndex] = { length: '0', width: '0' };
      }
      
      newPieces[pieceIndex] = {
        ...newPieces[pieceIndex],
        [field]: cleanedValue
      };
      
      return {
        ...prev,
        [itemId]: {
          ...currentItem,
          [longType]: {
            count: currentType.count,
            pieces: newPieces
          }
        }
      };
    });
  };

  // Calculate price for a single Grands textiles piece (now per long type with different price per m²)
  const calculateGrandsTextilesPiecePrice = (length, width, longType) => {
    const len = parseFloat(length) || 0;
    const wid = parseFloat(width) || 0;
    
    if (len === 0 || wid === 0) return 0;
    
    // Get price per m² for this long type
    const pricePerM2 = longTypesPricesPerM2[longType] || 10;
    
    // Price = (Longueur × Largeur) / 10,000 × pricePerM2
    const areaM2 = (len * wid) / 10000;
    return areaM2 * pricePerM2;
  };

  // Update final prices when vetements or grands textiles details change
  useEffect(() => {
    const newFinalPrices = {};
    items.forEach(item => {
      let total = 0;
      
      // Calculate price for Vêtements
      const vetementsDetailsItem = vetementsDetails[item.id] || {};
      Object.keys(vetementsDetailsItem).forEach(subOption => {
        if (vetementsDetailsItem[subOption]?.selected && vetementsDetailsItem[subOption]?.quantity > 0) {
          const price = vetementsPrices[subOption] || 0;
          const quantity = vetementsDetailsItem[subOption].quantity || 0;
          total += price * quantity;
        }
      });
      
      // Calculate price for Grands textiles (now per long type)
      const grandsTextilesItem = grandsTextilesDetails[item.id];
      if (grandsTextilesItem) {
        Object.keys(grandsTextilesItem).forEach(longType => {
          const typeDetails = grandsTextilesItem[longType];
          if (typeDetails && typeDetails.pieces) {
            typeDetails.pieces.forEach(piece => {
              const piecePrice = calculateGrandsTextilesPiecePrice(piece.length, piece.width, longType);
              total += piecePrice;
            });
          }
        });
      }
      
      if (total > 0) {
        newFinalPrices[item.id] = total;
      }
    });
    setFinalPrices(newFinalPrices);
  }, [vetementsDetails, grandsTextilesDetails, items]);

  // Check if reservation is valid
  const isValidReservation = (itemId) => {
    const selected = selectedOptions[itemId] || [];
    
    // Must have at least one main option selected
    if (selected.length === 0) return false;
    
    // If Vêtements is selected, must have at least one sub-option with quantity > 0
    if (selected.includes('vetements')) {
      const details = vetementsDetails[itemId] || {};
      const hasValidQuantity = Object.keys(details).some(subOption => 
        details[subOption]?.selected && details[subOption]?.quantity > 0
      );
      if (!hasValidQuantity) return false;
    }
    
    // If Grands textiles is selected, must have at least one long type selected with count > 0 and all pieces with valid dimensions
    if (selected.includes('grands_textiles')) {
      const selectedLongTypes = longTypesDetails[itemId] || [];
      if (selectedLongTypes.length === 0) return false;
      
      const grandsTextilesItem = grandsTextilesDetails[itemId];
      if (!grandsTextilesItem) return false;
      
      // Check each selected long type
      let hasValidType = false;
      selectedLongTypes.forEach(longType => {
        const typeDetails = grandsTextilesItem[longType];
        if (typeDetails && typeDetails.count > 0) {
          // Check that all pieces have valid dimensions (length > 0 and width > 0)
          if (typeDetails.pieces) {
            const allValid = typeDetails.pieces.every(piece => {
              const length = parseFloat(piece.length) || 0;
              const width = parseFloat(piece.width) || 0;
              return length > 0 && width > 0;
            });
            if (allValid) hasValidType = true;
          }
        }
      });
      
      if (!hasValidType) return false;
    }
    
    return true;
  };

  const handleReserve = (item) => {
    if (!isValidReservation(item.id)) {
      alert(t('ropassage_page.invalid_reservation', 'Veuillez sélectionner au moins une option et spécifier les quantités'));
      return;
    }

    const { name, description } = getLocalizedText(item);
    const selected = selectedOptions[item.id] || [];
    
    navigate('/reservation-lavage-ropassage', {
      state: {
        type: {
          id: item.id,
          name: name,
          description: description,
          price: item.price,
          image: item.image,
          service_id: item.menage_id,
        },
        serviceType: 'ropassage',
        selectedOptions: selected,
        vetementsDetails: vetementsDetails[item.id] || {},
        grandsTextilesDetails: grandsTextilesDetails[item.id] || {},
        finalPrice: finalPrices[item.id] || 0
      }
    });
  };

  if (loading) {
    return (
      <main className="ropassage-page">
        <div className="ropassage-header">
          <button 
            className="ropassage-back-btn"
            onClick={() => navigate('/lavage-et-ropassage')}
            title={t('ropassage_page.back', 'Retour')}
          >
            ← {t('ropassage_page.back', 'Retour')}
          </button>
        </div>
        <div className="ropassage-loading">{t('ropassage_page.loading', 'Chargement des services Repassage...')}</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="ropassage-page">
        <div className="ropassage-header">
          <button 
            className="ropassage-back-btn"
            onClick={() => navigate('/lavage-et-ropassage')}
            title={t('ropassage_page.back', 'Retour')}
          >
            ← {t('ropassage_page.back', 'Retour')}
          </button>
        </div>
        <div className="ropassage-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="ropassage-page">
        <div className="ropassage-header">
          <button 
            className="ropassage-back-btn"
            onClick={() => navigate('/lavage-et-ropassage')}
            title={t('ropassage_page.back', 'Retour')}
          >
            ← {t('ropassage_page.back', 'Retour')}
          </button>
        </div>
        <div className="ropassage-empty">{t('ropassage_page.empty', 'Aucun service Repassage disponible pour le moment.')}</div>
      </main>
    );
  }

  return (
    <main className="ropassage-page">
      <div className="ropassage-header">
        <button 
          className="ropassage-back-btn"
          onClick={() => navigate('/lavage-et-ropassage')}
          title={t('ropassage_page.back', 'Retour')}
        >
          ← {t('ropassage_page.back', 'Retour')}
        </button>
        <h1 className="ropassage-title">
          {t('ropassage_page.title', 'Repassage')}
        </h1>
      </div>
      <div className="ropassage-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const selected = selectedOptions[item.id] || [];
          return (
            <article key={item.id} className="ropassage-card">
              {item.image && (
                <div className="ropassage-card-image">
                  <img
                    src={item.image}
                    alt={name || t('ropassage_page.title', 'Repassage')}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="ropassage-card-body">
                <h2 className="ropassage-card-title">{name || `Service #${item.id}`}</h2>
                {description && (
                  <p className="ropassage-card-description">
                    {description}
                  </p>
                )}
                
                {/* Options Section */}
                <div className="ropassage-options-section">
                  <div className="ropassage-options-title">
                    {t('ropassage_page.select_options', 'Sélectionnez vos options')}:
                  </div>
                  <div className="ropassage-options-container">
                    <div className="ropassage-option-wrapper ropassage-option-wrapper-left">
                      <button
                        type="button"
                        className={`ropassage-option-btn ${selected.includes('vetements') ? 'ropassage-option-btn-selected' : ''}`}
                        onClick={() => handleOptionToggle(item.id, 'vetements')}
                      >
                        <span className="ropassage-option-checkbox">
                          {selected.includes('vetements') ? '✓' : ''}
                        </span>
                        <span className="ropassage-option-label">
                          {t('ropassage_page.option_vetements', 'Vêtements')}
                        </span>
                      </button>
                    </div>
                    <div className="ropassage-option-wrapper ropassage-option-wrapper-right">
                      <button
                        type="button"
                        className={`ropassage-option-btn ${selected.includes('grands_textiles') ? 'ropassage-option-btn-selected' : ''}`}
                        onClick={() => handleOptionToggle(item.id, 'grands_textiles')}
                      >
                        <span className="ropassage-option-checkbox">
                          {selected.includes('grands_textiles') ? '✓' : ''}
                        </span>
                        <span className="ropassage-option-label">
                          {t('ropassage_page.option_grands_textiles', 'Grands textiles')}
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Vêtements and Grands textiles Sections Container */}
                  {(selected.includes('vetements') || selected.includes('grands_textiles')) && (
                    <div className="ropassage-details-container">
                      {/* Vêtements Sub-options - Left */}
                      {selected.includes('vetements') && (
                        <div className="ropassage-details-wrapper ropassage-details-wrapper-left">
                          <div className="ropassage-vetements-sub-options">
                            <div className="ropassage-sub-options-title">
                              {t('ropassage_page.select_vetements_type', 'Sélectionnez le type de vêtements')}:
                            </div>
                            <div className="ropassage-sub-options-container">
                              {/* Option 1: T-shirt, Sweatshirts, Short, Jeans */}
                              <div className="ropassage-sub-option-item">
                                <button
                                  type="button"
                                  className={`ropassage-sub-option-btn ${vetementsDetails[item.id]?.option1?.selected ? 'ropassage-sub-option-btn-selected' : ''}`}
                                  onClick={() => handleVetementsSubOptionToggle(item.id, 'option1')}
                                >
                                  <span className="ropassage-option-checkbox">
                                    {vetementsDetails[item.id]?.option1?.selected ? '✓' : ''}
                                  </span>
                                  <span className="ropassage-option-label">
                                    {t('ropassage_page.option1_label', 'T-shirt, Sweatshirts, Short, Jeans')}
                                  </span>
                                  <span className="ropassage-sub-option-price">
                                    {vetementsPrices.option1} DH
                                  </span>
                                </button>
                                {vetementsDetails[item.id]?.option1?.selected && (
                                  <div className="ropassage-quantity-input-group">
                                    <label className="ropassage-quantity-label">
                                      {t('ropassage_page.quantity', 'Nombre de pièces')}:
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={vetementsDetails[item.id]?.option1?.quantity || 0}
                                      onChange={(e) => handleQuantityChange(item.id, 'option1', e.target.value)}
                                      className="ropassage-quantity-input"
                                      placeholder="0"
                                    />
                                    {vetementsDetails[item.id]?.option1?.quantity > 0 && (
                                      <div className="ropassage-sub-option-total">
                                        {vetementsPrices.option1 * (vetementsDetails[item.id]?.option1?.quantity || 0)} DH
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Option 2: Jaket */}
                              <div className="ropassage-sub-option-item">
                                <button
                                  type="button"
                                  className={`ropassage-sub-option-btn ${vetementsDetails[item.id]?.option2?.selected ? 'ropassage-sub-option-btn-selected' : ''}`}
                                  onClick={() => handleVetementsSubOptionToggle(item.id, 'option2')}
                                >
                                  <span className="ropassage-option-checkbox">
                                    {vetementsDetails[item.id]?.option2?.selected ? '✓' : ''}
                                  </span>
                                  <span className="ropassage-option-label">
                                    {t('ropassage_page.option2_label', 'Jaket')}
                                  </span>
                                  <span className="ropassage-sub-option-price">
                                    {vetementsPrices.option2} DH
                                  </span>
                                </button>
                                {vetementsDetails[item.id]?.option2?.selected && (
                                  <div className="ropassage-quantity-input-group">
                                    <label className="ropassage-quantity-label">
                                      {t('ropassage_page.quantity', 'Nombre de pièces')}:
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={vetementsDetails[item.id]?.option2?.quantity || 0}
                                      onChange={(e) => handleQuantityChange(item.id, 'option2', e.target.value)}
                                      className="ropassage-quantity-input"
                                      placeholder="0"
                                    />
                                    {vetementsDetails[item.id]?.option2?.quantity > 0 && (
                                      <div className="ropassage-sub-option-total">
                                        {vetementsPrices.option2 * (vetementsDetails[item.id]?.option2?.quantity || 0)} DH
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Option 3: Manteaux */}
                              <div className="ropassage-sub-option-item">
                                <button
                                  type="button"
                                  className={`ropassage-sub-option-btn ${vetementsDetails[item.id]?.option3?.selected ? 'ropassage-sub-option-btn-selected' : ''}`}
                                  onClick={() => handleVetementsSubOptionToggle(item.id, 'option3')}
                                >
                                  <span className="ropassage-option-checkbox">
                                    {vetementsDetails[item.id]?.option3?.selected ? '✓' : ''}
                                  </span>
                                  <span className="ropassage-option-label">
                                    {t('ropassage_page.option3_label', 'Manteaux')}
                                  </span>
                                  <span className="ropassage-sub-option-price">
                                    {vetementsPrices.option3} DH
                                  </span>
                                </button>
                                {vetementsDetails[item.id]?.option3?.selected && (
                                  <div className="ropassage-quantity-input-group">
                                    <label className="ropassage-quantity-label">
                                      {t('ropassage_page.quantity', 'Nombre de pièces')}:
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={vetementsDetails[item.id]?.option3?.quantity || 0}
                                      onChange={(e) => handleQuantityChange(item.id, 'option3', e.target.value)}
                                      className="ropassage-quantity-input"
                                      placeholder="0"
                                    />
                                    {vetementsDetails[item.id]?.option3?.quantity > 0 && (
                                      <div className="ropassage-sub-option-total">
                                        {vetementsPrices.option3 * (vetementsDetails[item.id]?.option3?.quantity || 0)} DH
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Option 4: Jacket cuire */}
                              <div className="ropassage-sub-option-item">
                                <button
                                  type="button"
                                  className={`ropassage-sub-option-btn ${vetementsDetails[item.id]?.option4?.selected ? 'ropassage-sub-option-btn-selected' : ''}`}
                                  onClick={() => handleVetementsSubOptionToggle(item.id, 'option4')}
                                >
                                  <span className="ropassage-option-checkbox">
                                    {vetementsDetails[item.id]?.option4?.selected ? '✓' : ''}
                                  </span>
                                  <span className="ropassage-option-label">
                                    {t('ropassage_page.option4_label', 'Jacket cuire')}
                                  </span>
                                  <span className="ropassage-sub-option-price">
                                    {vetementsPrices.option4} DH
                                  </span>
                                </button>
                                {vetementsDetails[item.id]?.option4?.selected && (
                                  <div className="ropassage-quantity-input-group">
                                    <label className="ropassage-quantity-label">
                                      {t('ropassage_page.quantity', 'Nombre de pièces')}:
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={vetementsDetails[item.id]?.option4?.quantity || 0}
                                      onChange={(e) => handleQuantityChange(item.id, 'option4', e.target.value)}
                                      className="ropassage-quantity-input"
                                      placeholder="0"
                                    />
                                    {vetementsDetails[item.id]?.option4?.quantity > 0 && (
                                      <div className="ropassage-sub-option-total">
                                        {vetementsPrices.option4 * (vetementsDetails[item.id]?.option4?.quantity || 0)} DH
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Grands textiles Section - Right */}
                      {selected.includes('grands_textiles') && (
                        <div className="ropassage-details-wrapper ropassage-details-wrapper-right">
                          <div className="ropassage-grands-textiles-section">
                            {/* Sélectionnez le type long */}
                            <div className="ropassage-long-types-section">
                              <div className="ropassage-long-types-title">
                                {t('ropassage_page.select_long_type', 'Sélectionnez le type long')}:
                              </div>
                              <div className="ropassage-long-types-container">
                                {/* Option 1: Draps */}
                                <div className="ropassage-long-type-item">
                                  <button
                                    type="button"
                                    className={`ropassage-long-type-btn ${(longTypesDetails[item.id] || []).includes('draps') ? 'ropassage-long-type-btn-selected' : ''}`}
                                    onClick={() => handleLongTypeToggle(item.id, 'draps')}
                                  >
                                    <span className="ropassage-option-checkbox">
                                      {(longTypesDetails[item.id] || []).includes('draps') ? '✓' : ''}
                                    </span>
                                    <span className="ropassage-option-label">
                                      {t('ropassage_page.long_type_draps', 'Draps')}
                                    </span>
                                    <span className="ropassage-long-type-price">
                                      {longTypesPrices.draps} DH
                                    </span>
                                  </button>
                                </div>
                                
                                {/* Option 2: Couverte */}
                                <div className="ropassage-long-type-item">
                                  <button
                                    type="button"
                                    className={`ropassage-long-type-btn ${(longTypesDetails[item.id] || []).includes('couverte') ? 'ropassage-long-type-btn-selected' : ''}`}
                                    onClick={() => handleLongTypeToggle(item.id, 'couverte')}
                                  >
                                    <span className="ropassage-option-checkbox">
                                      {(longTypesDetails[item.id] || []).includes('couverte') ? '✓' : ''}
                                    </span>
                                    <span className="ropassage-option-label">
                                      {t('ropassage_page.long_type_couverte', 'Couverte')}
                                    </span>
                                    <span className="ropassage-long-type-price">
                                      {longTypesPrices.couverte} DH
                                    </span>
                                  </button>
                                </div>
                                
                                {/* Option 3: Couverte protégée */}
                                <div className="ropassage-long-type-item">
                                  <button
                                    type="button"
                                    className={`ropassage-long-type-btn ${(longTypesDetails[item.id] || []).includes('couverte_protegee') ? 'ropassage-long-type-btn-selected' : ''}`}
                                    onClick={() => handleLongTypeToggle(item.id, 'couverte_protegee')}
                                  >
                                    <span className="ropassage-option-checkbox">
                                      {(longTypesDetails[item.id] || []).includes('couverte_protegee') ? '✓' : ''}
                                    </span>
                                    <span className="ropassage-option-label">
                                      {t('ropassage_page.long_type_couverte_protegee', 'Couverte protégée')}
                                    </span>
                                    <span className="ropassage-long-type-price">
                                      {longTypesPrices.couverte_protegee} DH
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Détails des grands textiles - Separate section for each selected long type */}
                            {(longTypesDetails[item.id] && longTypesDetails[item.id].length > 0) && (
                              <>
                                {longTypesDetails[item.id].map((longType) => {
                                  const typeDetails = grandsTextilesDetails[item.id]?.[longType] || { count: 0, pieces: [] };
                                  const typeName = longType === 'draps' ? t('ropassage_page.long_type_draps', 'Draps') :
                                                  longType === 'couverte' ? t('ropassage_page.long_type_couverte', 'Couverte') :
                                                  t('ropassage_page.long_type_couverte_protegee', 'Couverte protégée');
                                  const pricePerM2 = longTypesPricesPerM2[longType] || 10;
                                  
                                  return (
                                    <div key={longType} className="ropassage-long-type-details-section">
                                      <div className="ropassage-grands-textiles-details-title">
                                        {t('ropassage_page.grands_textiles_details', 'Détails des grands textiles')}: {typeName}
                                      </div>
                                      <div className="ropassage-price-per-m2">
                                        {t('ropassage_page.price_per_m2', 'Prix')}: {pricePerM2} DH/m²
                                      </div>
                                      <div className="ropassage-grands-textiles-count-group">
                                        <label className="ropassage-grands-textiles-count-label">
                                          {t('ropassage_page.number_of_pieces', 'Nombre de pièces')}:
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={typeDetails.count || 0}
                                          onChange={(e) => handleGrandsTextilesCountChange(item.id, longType, e.target.value)}
                                          className="ropassage-grands-textiles-count-input"
                                          placeholder="0"
                                        />
                                      </div>
                                      
                                      {/* Dynamic pieces inputs */}
                                      {typeDetails.pieces && typeDetails.pieces.length > 0 && (
                                        <div className="ropassage-grands-textiles-pieces">
                                          {typeDetails.pieces.map((piece, pieceIndex) => {
                                            const piecePrice = calculateGrandsTextilesPiecePrice(piece.length, piece.width, longType);
                                            const length = parseFloat(piece.length) || 0;
                                            const width = parseFloat(piece.width) || 0;
                                            return (
                                              <div key={pieceIndex} className="ropassage-grands-textiles-piece-item">
                                                <div className="ropassage-piece-header">
                                                  <span className="ropassage-piece-number">
                                                    {t('ropassage_page.piece', 'Pièce')} {pieceIndex + 1}
                                                  </span>
                                                  {piecePrice > 0 && (
                                                    <span className="ropassage-piece-price">
                                                      {piecePrice.toFixed(2)} DH
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="ropassage-piece-dimensions">
                                                  <div className="ropassage-piece-dimension-group">
                                                    <label className="ropassage-piece-dimension-label">
                                                      {t('ropassage_page.length', 'Longueur (cm)')}:
                                                    </label>
                                                    <input
                                                      type="text"
                                                      inputMode="decimal"
                                                      value={piece.length}
                                                      onChange={(e) => handleGrandsTextilesDimensionChange(item.id, longType, pieceIndex, 'length', e.target.value)}
                                                      onPaste={(e) => {
                                                        e.preventDefault();
                                                        const pastedText = e.clipboardData.getData('text');
                                                        const cleaned = pastedText.replace(/[^\d.]/g, '').replace(/^0+/, '') || '0';
                                                        handleGrandsTextilesDimensionChange(item.id, longType, pieceIndex, 'length', cleaned);
                                                      }}
                                                      className="ropassage-piece-dimension-input"
                                                      placeholder="0"
                                                    />
                                                  </div>
                                                  <div className="ropassage-piece-dimension-group">
                                                    <label className="ropassage-piece-dimension-label">
                                                      {t('ropassage_page.width', 'Largeur (cm)')}:
                                                    </label>
                                                    <input
                                                      type="text"
                                                      inputMode="decimal"
                                                      value={piece.width}
                                                      onChange={(e) => handleGrandsTextilesDimensionChange(item.id, longType, pieceIndex, 'width', e.target.value)}
                                                      onPaste={(e) => {
                                                        e.preventDefault();
                                                        const pastedText = e.clipboardData.getData('text');
                                                        const cleaned = pastedText.replace(/[^\d.]/g, '').replace(/^0+/, '') || '0';
                                                        handleGrandsTextilesDimensionChange(item.id, longType, pieceIndex, 'width', cleaned);
                                                      }}
                                                      className="ropassage-piece-dimension-input"
                                                      placeholder="0"
                                                    />
                                                  </div>
                                                  {length > 0 && width > 0 && (
                                                    <div className="ropassage-piece-area">
                                                      {t('ropassage_page.area', 'Surface')}: {((length * width) / 10000).toFixed(2)} m²
                                                    </div>
                                                  )}
                                                  {(!length || length === 0 || !width || width === 0) && (
                                                    <div className="ropassage-piece-validation">
                                                      {t('ropassage_page.dimensions_required', '⚠️ Longueur et Largeur doivent être > 0')}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Final Price Display */}
                  {finalPrices[item.id] > 0 && (
                    <div className="ropassage-final-price">
                      <span className="ropassage-final-price-label">
                        {t('ropassage_page.total_price', 'Prix total')}:
                      </span>
                      <span className="ropassage-final-price-value">
                        {finalPrices[item.id].toFixed(2)} DH
                      </span>
                    </div>
                  )}
                </div>
                
                <button
                  className={`ropassage-card-reserve-btn ${!isValidReservation(item.id) ? 'ropassage-card-reserve-btn-disabled' : ''}`}
                  onClick={() => handleReserve(item)}
                  disabled={!isValidReservation(item.id)}
                >
                  {t('ropassage_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


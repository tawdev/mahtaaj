import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Lavage.css';

export default function Lavage() {
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
    const loadLavage = async () => {
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
        // 2. type_menage name contains "lavage" or "غسيل" or "laundry" (but NOT "repassage" or "كي" or "ironing")
        const filtered = allTypes.filter(item => {
          if (!item) return false;

          // Check menage name
          const menage = item.menage;
          if (!menage) return false;
          
          const menageNameFr = (menage.name_fr || '').toLowerCase().trim();
          const menageNameAr = (menage.name_ar || '').toLowerCase().trim();
          const menageNameEn = (menage.name_en || '').toLowerCase().trim();
          
          const isLavageEtRepassage = 
            (menageNameFr.includes('lavage') && (menageNameFr.includes('repassage') || menageNameFr.includes('repassage'))) ||
            (menageNameAr.includes('غسيل') && menageNameAr.includes('كي')) ||
            (menageNameEn.includes('laundry') && menageNameEn.includes('ironing'));

          if (!isLavageEtRepassage) return false;

          // Check type_menage name for "lavage" (but NOT "repassage")
          const typeNameFr = (item.name_fr || '').toLowerCase().trim();
          const typeNameAr = (item.name_ar || '').toLowerCase().trim();
          const typeNameEn = (item.name_en || '').toLowerCase().trim();

          // Must contain "lavage" / "غسيل" / "laundry" but NOT "repassage" / "كي" / "ironing"
          const frHasLavage = typeNameFr.includes('lavage') && !typeNameFr.includes('repassage');
          const arHasLavage = typeNameAr.includes('غسيل') && !typeNameAr.includes('كي');
          const enHasLavage = typeNameEn.includes('laundry') && !typeNameEn.includes('ironing');

          return frHasLavage || arHasLavage || enHasLavage;
        });

        // Remove duplicates based on ID
        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        console.log('[Lavage] Filtered items:', uniqueItems.length, 'out of', allTypes.length);
        setItems(uniqueItems);
      } catch (err) {
        console.error('[Lavage] Exception loading data:', err);
        const errorMessage = err?.message || err?.toString() || 'Erreur de connexion';
        setError('Erreur de connexion: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadLavage();
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
      alert(t('lavage_page.invalid_reservation', 'Veuillez sélectionner au moins une option et spécifier les quantités'));
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
        serviceType: 'lavage',
        selectedOptions: selected,
        vetementsDetails: vetementsDetails[item.id] || {},
        grandsTextilesDetails: grandsTextilesDetails[item.id] || {},
        finalPrice: finalPrices[item.id] || 0
      }
    });
  };

  if (loading) {
    return (
      <main className="lavage-page">
        <div className="lavage-header">
          <button 
            className="lavage-back-btn"
            onClick={() => navigate('/lavage-et-ropassage')}
            title={t('lavage_page.back', 'Retour')}
          >
            ← {t('lavage_page.back', 'Retour')}
          </button>
        </div>
        <div className="lavage-loading">Chargement des services Lavage...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="lavage-page">
        <div className="lavage-header">
          <button 
            className="lavage-back-btn"
            onClick={() => navigate('/lavage-et-ropassage')}
            title={t('lavage_page.back', 'Retour')}
          >
            ← {t('lavage_page.back', 'Retour')}
          </button>
        </div>
        <div className="lavage-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="lavage-page">
        <div className="lavage-header">
          <button 
            className="lavage-back-btn"
            onClick={() => navigate('/lavage-et-ropassage')}
            title={t('lavage_page.back', 'Retour')}
          >
            ← {t('lavage_page.back', 'Retour')}
          </button>
        </div>
        <div className="lavage-empty">Aucun service Lavage disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="lavage-page">
      <div className="lavage-header">
        <button 
          className="lavage-back-btn"
          onClick={() => navigate('/lavage-et-ropassage')}
          title={t('lavage_page.back', 'Retour')}
        >
          ← {t('lavage_page.back', 'Retour')}
        </button>
        <h1 className="lavage-title">
          {t('lavage_page.title', 'Lavage')}
        </h1>
      </div>
      <div className="lavage-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const selected = selectedOptions[item.id] || [];
          return (
            <article key={item.id} className="lavage-card">
              {item.image && (
                <div className="lavage-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Lavage'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="lavage-card-body">
                <h2 className="lavage-card-title">{name || `Service #${item.id}`}</h2>
                {description && (
                  <p className="lavage-card-description">
                    {description}
                  </p>
                )}
                
                {/* Options Section */}
                <div className="lavage-options-section">
                  <div className="lavage-options-title">
                    {t('lavage_page.select_options', 'Sélectionnez vos options')}:
                  </div>
                  <div className="lavage-options-container">
                    <div className="lavage-option-wrapper lavage-option-wrapper-left">
                      <button
                        type="button"
                        className={`lavage-option-btn ${selected.includes('vetements') ? 'lavage-option-btn-selected' : ''}`}
                        onClick={() => handleOptionToggle(item.id, 'vetements')}
                      >
                        <span className="lavage-option-checkbox">
                          {selected.includes('vetements') ? '✓' : ''}
                        </span>
                        <span className="lavage-option-label">
                          {t('lavage_page.option_vetements', 'Vêtements')}
                        </span>
                      </button>
                    </div>
                    <div className="lavage-option-wrapper lavage-option-wrapper-right">
                      <button
                        type="button"
                        className={`lavage-option-btn ${selected.includes('grands_textiles') ? 'lavage-option-btn-selected' : ''}`}
                        onClick={() => handleOptionToggle(item.id, 'grands_textiles')}
                      >
                        <span className="lavage-option-checkbox">
                          {selected.includes('grands_textiles') ? '✓' : ''}
                        </span>
                        <span className="lavage-option-label">
                          {t('lavage_page.option_grands_textiles', 'Grands textiles')}
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Vêtements and Grands textiles Sections Container */}
                  {(selected.includes('vetements') || selected.includes('grands_textiles')) && (
                    <div className="lavage-details-container">
                      {/* Vêtements Sub-options - Left */}
                      {selected.includes('vetements') && (
                        <div className="lavage-details-wrapper lavage-details-wrapper-left">
                          <div className="lavage-vetements-sub-options">
                            <div className="lavage-sub-options-title">
                              {t('lavage_page.select_vetements_type', 'Sélectionnez le type de vêtements')}:
                            </div>
                            <div className="lavage-sub-options-container">
                              {/* Option 1: T-shirt, Sweatshirts, Short, Jeans */}
                              <div className="lavage-sub-option-item">
                                <button
                                  type="button"
                                  className={`lavage-sub-option-btn ${vetementsDetails[item.id]?.option1?.selected ? 'lavage-sub-option-btn-selected' : ''}`}
                                  onClick={() => handleVetementsSubOptionToggle(item.id, 'option1')}
                                >
                                  <span className="lavage-option-checkbox">
                                    {vetementsDetails[item.id]?.option1?.selected ? '✓' : ''}
                                  </span>
                                  <span className="lavage-option-label">
                                    {t('lavage_page.option1_label', 'T-shirt, Sweatshirts, Short, Jeans')}
                                  </span>
                                  <span className="lavage-sub-option-price">
                                    {vetementsPrices.option1} DH
                                  </span>
                                </button>
                                {vetementsDetails[item.id]?.option1?.selected && (
                                  <div className="lavage-quantity-input-group">
                                    <label className="lavage-quantity-label">
                                      {t('lavage_page.quantity', 'Nombre de pièces')}:
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={vetementsDetails[item.id]?.option1?.quantity || 0}
                                      onChange={(e) => handleQuantityChange(item.id, 'option1', e.target.value)}
                                      className="lavage-quantity-input"
                                      placeholder="0"
                                    />
                                    {vetementsDetails[item.id]?.option1?.quantity > 0 && (
                                      <div className="lavage-sub-option-total">
                                        {vetementsPrices.option1 * (vetementsDetails[item.id]?.option1?.quantity || 0)} DH
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Option 2: Jaket */}
                              <div className="lavage-sub-option-item">
                                <button
                                  type="button"
                                  className={`lavage-sub-option-btn ${vetementsDetails[item.id]?.option2?.selected ? 'lavage-sub-option-btn-selected' : ''}`}
                                  onClick={() => handleVetementsSubOptionToggle(item.id, 'option2')}
                                >
                                  <span className="lavage-option-checkbox">
                                    {vetementsDetails[item.id]?.option2?.selected ? '✓' : ''}
                                  </span>
                                  <span className="lavage-option-label">
                                    {t('lavage_page.option2_label', 'Jaket')}
                                  </span>
                                  <span className="lavage-sub-option-price">
                                    {vetementsPrices.option2} DH
                                  </span>
                                </button>
                                {vetementsDetails[item.id]?.option2?.selected && (
                                  <div className="lavage-quantity-input-group">
                                    <label className="lavage-quantity-label">
                                      {t('lavage_page.quantity', 'Nombre de pièces')}:
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={vetementsDetails[item.id]?.option2?.quantity || 0}
                                      onChange={(e) => handleQuantityChange(item.id, 'option2', e.target.value)}
                                      className="lavage-quantity-input"
                                      placeholder="0"
                                    />
                                    {vetementsDetails[item.id]?.option2?.quantity > 0 && (
                                      <div className="lavage-sub-option-total">
                                        {vetementsPrices.option2 * (vetementsDetails[item.id]?.option2?.quantity || 0)} DH
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Option 3: Manteaux */}
                              <div className="lavage-sub-option-item">
                                <button
                                  type="button"
                                  className={`lavage-sub-option-btn ${vetementsDetails[item.id]?.option3?.selected ? 'lavage-sub-option-btn-selected' : ''}`}
                                  onClick={() => handleVetementsSubOptionToggle(item.id, 'option3')}
                                >
                                  <span className="lavage-option-checkbox">
                                    {vetementsDetails[item.id]?.option3?.selected ? '✓' : ''}
                                  </span>
                                  <span className="lavage-option-label">
                                    {t('lavage_page.option3_label', 'Manteaux')}
                                  </span>
                                  <span className="lavage-sub-option-price">
                                    {vetementsPrices.option3} DH
                                  </span>
                                </button>
                                {vetementsDetails[item.id]?.option3?.selected && (
                                  <div className="lavage-quantity-input-group">
                                    <label className="lavage-quantity-label">
                                      {t('lavage_page.quantity', 'Nombre de pièces')}:
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={vetementsDetails[item.id]?.option3?.quantity || 0}
                                      onChange={(e) => handleQuantityChange(item.id, 'option3', e.target.value)}
                                      className="lavage-quantity-input"
                                      placeholder="0"
                                    />
                                    {vetementsDetails[item.id]?.option3?.quantity > 0 && (
                                      <div className="lavage-sub-option-total">
                                        {vetementsPrices.option3 * (vetementsDetails[item.id]?.option3?.quantity || 0)} DH
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Option 4: Jacket cuire */}
                              <div className="lavage-sub-option-item">
                                <button
                                  type="button"
                                  className={`lavage-sub-option-btn ${vetementsDetails[item.id]?.option4?.selected ? 'lavage-sub-option-btn-selected' : ''}`}
                                  onClick={() => handleVetementsSubOptionToggle(item.id, 'option4')}
                                >
                                  <span className="lavage-option-checkbox">
                                    {vetementsDetails[item.id]?.option4?.selected ? '✓' : ''}
                                  </span>
                                  <span className="lavage-option-label">
                                    {t('lavage_page.option4_label', 'Jacket cuire')}
                                  </span>
                                  <span className="lavage-sub-option-price">
                                    {vetementsPrices.option4} DH
                                  </span>
                                </button>
                                {vetementsDetails[item.id]?.option4?.selected && (
                                  <div className="lavage-quantity-input-group">
                                    <label className="lavage-quantity-label">
                                      {t('lavage_page.quantity', 'Nombre de pièces')}:
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={vetementsDetails[item.id]?.option4?.quantity || 0}
                                      onChange={(e) => handleQuantityChange(item.id, 'option4', e.target.value)}
                                      className="lavage-quantity-input"
                                      placeholder="0"
                                    />
                                    {vetementsDetails[item.id]?.option4?.quantity > 0 && (
                                      <div className="lavage-sub-option-total">
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
                        <div className="lavage-details-wrapper lavage-details-wrapper-right">
                          <div className="lavage-grands-textiles-section">
                            {/* Sélectionnez le type long */}
                            <div className="lavage-long-types-section">
                              <div className="lavage-long-types-title">
                                {t('lavage_page.select_long_type', 'Sélectionnez le type long')}:
                              </div>
                              <div className="lavage-long-types-container">
                                {/* Option 1: Draps */}
                                <div className="lavage-long-type-item">
                                  <button
                                    type="button"
                                    className={`lavage-long-type-btn ${(longTypesDetails[item.id] || []).includes('draps') ? 'lavage-long-type-btn-selected' : ''}`}
                                    onClick={() => handleLongTypeToggle(item.id, 'draps')}
                                  >
                                    <span className="lavage-option-checkbox">
                                      {(longTypesDetails[item.id] || []).includes('draps') ? '✓' : ''}
                                    </span>
                                    <span className="lavage-option-label">
                                      {t('lavage_page.long_type_draps', 'Draps')}
                                    </span>
                                    <span className="lavage-long-type-price">
                                      {longTypesPrices.draps} DH
                                    </span>
                                  </button>
                                </div>
                                
                                {/* Option 2: Couverte */}
                                <div className="lavage-long-type-item">
                                  <button
                                    type="button"
                                    className={`lavage-long-type-btn ${(longTypesDetails[item.id] || []).includes('couverte') ? 'lavage-long-type-btn-selected' : ''}`}
                                    onClick={() => handleLongTypeToggle(item.id, 'couverte')}
                                  >
                                    <span className="lavage-option-checkbox">
                                      {(longTypesDetails[item.id] || []).includes('couverte') ? '✓' : ''}
                                    </span>
                                    <span className="lavage-option-label">
                                      {t('lavage_page.long_type_couverte', 'Couverte')}
                                    </span>
                                    <span className="lavage-long-type-price">
                                      {longTypesPrices.couverte} DH
                                    </span>
                                  </button>
                                </div>
                                
                                {/* Option 3: Couverte protégée */}
                                <div className="lavage-long-type-item">
                                  <button
                                    type="button"
                                    className={`lavage-long-type-btn ${(longTypesDetails[item.id] || []).includes('couverte_protegee') ? 'lavage-long-type-btn-selected' : ''}`}
                                    onClick={() => handleLongTypeToggle(item.id, 'couverte_protegee')}
                                  >
                                    <span className="lavage-option-checkbox">
                                      {(longTypesDetails[item.id] || []).includes('couverte_protegee') ? '✓' : ''}
                                    </span>
                                    <span className="lavage-option-label">
                                      {t('lavage_page.long_type_couverte_protegee', 'Couverte protégée')}
                                    </span>
                                    <span className="lavage-long-type-price">
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
                                  const typeName = longType === 'draps' ? t('lavage_page.long_type_draps', 'Draps') :
                                                  longType === 'couverte' ? t('lavage_page.long_type_couverte', 'Couverte') :
                                                  t('lavage_page.long_type_couverte_protegee', 'Couverte protégée');
                                  const pricePerM2 = longTypesPricesPerM2[longType] || 10;
                                  
                                  return (
                                    <div key={longType} className="lavage-long-type-details-section">
                                      <div className="lavage-grands-textiles-details-title">
                                        {t('lavage_page.grands_textiles_details', 'Détails des grands textiles')}: {typeName}
                                      </div>
                                      <div className="lavage-price-per-m2">
                                        {t('lavage_page.price_per_m2', 'Prix')}: {pricePerM2} DH/m²
                                      </div>
                                      <div className="lavage-grands-textiles-count-group">
                                        <label className="lavage-grands-textiles-count-label">
                                          {t('lavage_page.number_of_pieces', 'Nombre de pièces')}:
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={typeDetails.count || 0}
                                          onChange={(e) => handleGrandsTextilesCountChange(item.id, longType, e.target.value)}
                                          className="lavage-grands-textiles-count-input"
                                          placeholder="0"
                                        />
                                      </div>
                                      
                                      {/* Dynamic pieces inputs */}
                                      {typeDetails.pieces && typeDetails.pieces.length > 0 && (
                                        <div className="lavage-grands-textiles-pieces">
                                          {typeDetails.pieces.map((piece, pieceIndex) => {
                                            const piecePrice = calculateGrandsTextilesPiecePrice(piece.length, piece.width, longType);
                                            const length = parseFloat(piece.length) || 0;
                                            const width = parseFloat(piece.width) || 0;
                                            return (
                                              <div key={pieceIndex} className="lavage-grands-textiles-piece-item">
                                                <div className="lavage-piece-header">
                                                  <span className="lavage-piece-number">
                                                    {t('lavage_page.piece', 'Pièce')} {pieceIndex + 1}
                                                  </span>
                                                  {piecePrice > 0 && (
                                                    <span className="lavage-piece-price">
                                                      {piecePrice.toFixed(2)} DH
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="lavage-piece-dimensions">
                                                  <div className="lavage-piece-dimension-group">
                                                    <label className="lavage-piece-dimension-label">
                                                      {t('lavage_page.length', 'Longueur (cm)')}:
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
                                                      className="lavage-piece-dimension-input"
                                                      placeholder="0"
                                                    />
                                                  </div>
                                                  <div className="lavage-piece-dimension-group">
                                                    <label className="lavage-piece-dimension-label">
                                                      {t('lavage_page.width', 'Largeur (cm)')}:
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
                                                      className="lavage-piece-dimension-input"
                                                      placeholder="0"
                                                    />
                                                  </div>
                                                  {length > 0 && width > 0 && (
                                                    <div className="lavage-piece-area">
                                                      {t('lavage_page.area', 'Surface')}: {((length * width) / 10000).toFixed(2)} m²
                                                    </div>
                                                  )}
                                                  {(!length || length === 0 || !width || width === 0) && (
                                                    <div className="lavage-piece-validation">
                                                      {t('lavage_page.dimensions_required', '⚠️ Longueur et Largeur doivent être > 0')}
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
                    <div className="lavage-final-price">
                      <span className="lavage-final-price-label">
                        {t('lavage_page.total_price', 'Prix total')}:
                      </span>
                      <span className="lavage-final-price-value">
                        {finalPrices[item.id].toFixed(2)} DH
                      </span>
                    </div>
                  )}
                </div>
                
                <button
                  className={`lavage-card-reserve-btn ${!isValidReservation(item.id) ? 'lavage-card-reserve-btn-disabled' : ''}`}
                  onClick={() => handleReserve(item)}
                  disabled={!isValidReservation(item.id)}
                >
                  {t('lavage_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './menageComplite.css';
import './MaisonDhote.css';

export default function MaisonDhote() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for reservation form per item
  const [reservationData, setReservationData] = useState({}); // { itemId: { rooms: [], suites: [], hasBreakfast: false, hasSheets: false, hasPool: false, pool: { length: '0', width: '0' }, hasGarden: false, garden: { length: '0', width: '0' } } }
  const [finalPrices, setFinalPrices] = useState({}); // { itemId: finalPrice }

  useEffect(() => {
    const loadMaisonDhote = async () => {
      try {
        setLoading(true);
        setError('');

        const { data: allTypesData, error: typesError } = await supabase
          .from('types_menage')
          .select('*, menage:menage_id(*)')
          .order('created_at', { ascending: false });

        if (typesError) {
          throw typesError;
        }

        const allTypes = allTypesData || [];

        const filtered = allTypes.filter(item => {
          if (!item) return false;

          const menage = item.menage;
          if (!menage) return false;
          
          const menageNameFr = (menage.name_fr || '').toLowerCase().trim();
          const menageNameAr = (menage.name_ar || '').toLowerCase().trim();
          const menageNameEn = (menage.name_en || '').toLowerCase().trim();
          
          const hasTapis = menageNameFr.includes('tapis') || menageNameAr.includes('سجاد') || menageNameEn.includes('carpet');
          const hasCanapes = menageNameFr.includes('canapé') || menageNameFr.includes('canapes') || menageNameAr.includes('كنب') || menageNameEn.includes('sofa');
          const hasVoiture = menageNameFr.includes('voiture') || menageNameAr.includes('سيارة') || menageNameEn.includes('car');
          const hasLavageRepassage = (menageNameFr.includes('lavage') && menageNameFr.includes('repassage')) || menageNameAr.includes('كي') || menageNameEn.includes('ironing');
          const hasBureaux = menageNameFr.includes('bureaux') || menageNameFr.includes('bureau') || menageNameAr.includes('مكاتب') || menageNameEn.includes('office');
          const hasAirbnb = menageNameFr.includes('airbnb') || menageNameAr.includes('airbnb') || menageNameEn.includes('airbnb');
          const hasPiscine = menageNameFr.includes('piscine') || menageNameAr.includes('مسبح') || menageNameEn.includes('pool');
          const hasChaussures = menageNameFr.includes('chaussure') || menageNameAr.includes('حذاء') || menageNameEn.includes('shoe');
          
          if (hasTapis || hasCanapes || hasVoiture || hasLavageRepassage || hasBureaux || hasAirbnb || hasPiscine || hasChaussures) {
            return false;
          }
          
          const isMenage = 
            (menageNameFr.includes('ménage') && !menageNameFr.includes('tapis') && !menageNameFr.includes('voiture') && !menageNameFr.includes('lavage') && !menageNameFr.includes('bureaux')) ||
            menageNameAr.includes('تدبير') ||
            menageNameAr.includes('منزلي') ||
            menageNameEn.includes('housekeeping') ||
            (menageNameEn.includes('cleaning') && !menageNameEn.includes('car'));

          if (!isMenage) return false;

          const typeNameFr = (item.name_fr || '').toLowerCase().trim();
          const typeNameAr = (item.name_ar || '').toLowerCase().trim();
          const typeNameEn = (item.name_en || '').toLowerCase().trim();

          // Exclude simple "Maison" (must have "hôte" or "guest house")
          const isSimpleMaison = 
            (typeNameFr.includes('maison') && !typeNameFr.includes('hôte') && !typeNameFr.includes('maison d\'hôte')) ||
            (typeNameAr.includes('منزل') && !typeNameAr.includes('ضيافة')) ||
            (typeNameEn.includes('house') && !typeNameEn.includes('host') && !typeNameEn.includes('guest'));

          if (isSimpleMaison) return false;

          // Must be "Maison d'hôte" / "Guest house"
          const frIsMaisonDhote = 
            (typeNameFr.includes('maison') && typeNameFr.includes('hôte')) || 
            typeNameFr.includes('maison d\'hôte');
          const arIsMaisonDhote = 
            (typeNameAr.includes('بيت') && typeNameAr.includes('ضيافة')) ||
            typeNameAr.includes('بيت ضيافة');
          const enIsMaisonDhote = 
            typeNameEn.includes('guest house') || 
            (typeNameEn.includes('house') && typeNameEn.includes('host'));

          return frIsMaisonDhote || arIsMaisonDhote || enIsMaisonDhote;
        });

        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        setItems(uniqueItems);
      } catch (err) {
        console.error('[MaisonDhote] Exception loading data:', err);
        setError('Erreur de connexion: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMaisonDhote();
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

  // Price per m²
  const PRICE_PER_M2 = 2; // 2 DH per m²
  const BREAKFAST_PRICE = 50; // 50 DH for breakfast
  const SHEETS_PRICE = 20; // 20 DH for sheets change

  // Calculate area in m² from cm
  const calculateArea = (length, width) => {
    const len = parseFloat(String(length).replace(/[^\d.]/g, '')) || 0;
    const wid = parseFloat(String(width).replace(/[^\d.]/g, '')) || 0;
    if (len <= 0 || wid <= 0) return 0;
    // Convert cm² to m²: 1 m² = 10,000 cm²
    const areaInM2 = (len * wid) / 10000;
    return Math.round(areaInM2 * 100) / 100; // Round to 2 decimal places
  };

  // Calculate price for a single room/suite/pool/garden
  const calculateRoomPrice = useCallback((length, width) => {
    const len = parseFloat(String(length).replace(/[^\d.]/g, '')) || 0;
    const wid = parseFloat(String(width).replace(/[^\d.]/g, '')) || 0;
    if (len <= 0 || wid <= 0) return 0;
    // Convert cm² to m²: 1 m² = 10,000 cm²
    const areaInM2 = (len * wid) / 10000;
    const area = Math.round(areaInM2 * 100) / 100; // Round to 2 decimal places
    const price = area * PRICE_PER_M2;
    return Math.round(price * 100) / 100; // Round to 2 decimal places
  }, []);

  // Handle rooms count change
  const handleRoomsCountChange = (itemId, count) => {
    const numCount = parseInt(count) || 0;
    setReservationData(prev => {
      const currentData = prev[itemId] || { rooms: [] };
      const currentRooms = currentData.rooms || [];
      
      if (numCount > currentRooms.length) {
        const newRooms = [...currentRooms];
        for (let i = currentRooms.length; i < numCount; i++) {
          newRooms.push({ length: '0', width: '0' });
        }
        return {
          ...prev,
          [itemId]: {
            ...currentData,
            rooms: newRooms
          }
        };
      } else {
        return {
          ...prev,
          [itemId]: {
            ...currentData,
            rooms: currentRooms.slice(0, numCount)
          }
        };
      }
    });
  };

  // Handle room dimension change
  const handleRoomDimensionChange = (itemId, roomIndex, field, value) => {
    let cleanedValue = value.replace(/[^\d.]/g, '');
    if (cleanedValue.length > 1 && cleanedValue.startsWith('0') && !cleanedValue.startsWith('0.')) {
      cleanedValue = cleanedValue.replace(/^0+/, '');
    }
    if (cleanedValue === '' || cleanedValue === '.') {
      cleanedValue = '0';
    }
    
    setReservationData(prev => {
      const currentData = prev[itemId] || { rooms: [] };
      const newRooms = [...(currentData.rooms || [])];
      if (!newRooms[roomIndex]) {
        newRooms[roomIndex] = { length: '0', width: '0' };
      }
      newRooms[roomIndex] = {
        ...newRooms[roomIndex],
        [field]: cleanedValue
      };
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          rooms: newRooms
        }
      };
    });
  };

  // Handle suites count change
  const handleSuitesCountChange = (itemId, count) => {
    const numCount = parseInt(count) || 0;
    setReservationData(prev => {
      const currentData = prev[itemId] || { suites: [] };
      const currentSuites = currentData.suites || [];
      
      if (numCount > currentSuites.length) {
        const newSuites = [...currentSuites];
        for (let i = currentSuites.length; i < numCount; i++) {
          newSuites.push({ length: '0', width: '0' });
        }
        return {
          ...prev,
          [itemId]: {
            ...currentData,
            suites: newSuites
          }
        };
      } else {
        return {
          ...prev,
          [itemId]: {
            ...currentData,
            suites: currentSuites.slice(0, numCount)
          }
        };
      }
    });
  };

  // Handle suite dimension change
  const handleSuiteDimensionChange = (itemId, suiteIndex, field, value) => {
    let cleanedValue = value.replace(/[^\d.]/g, '');
    if (cleanedValue.length > 1 && cleanedValue.startsWith('0') && !cleanedValue.startsWith('0.')) {
      cleanedValue = cleanedValue.replace(/^0+/, '');
    }
    if (cleanedValue === '' || cleanedValue === '.') {
      cleanedValue = '0';
    }
    
    setReservationData(prev => {
      const currentData = prev[itemId] || { suites: [] };
      const newSuites = [...(currentData.suites || [])];
      if (!newSuites[suiteIndex]) {
        newSuites[suiteIndex] = { length: '0', width: '0' };
      }
      newSuites[suiteIndex] = {
        ...newSuites[suiteIndex],
        [field]: cleanedValue
      };
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          suites: newSuites
        }
      };
    });
  };

  // Handle breakfast checkbox
  const handleBreakfastToggle = (itemId) => {
    setReservationData(prev => {
      const currentData = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          hasBreakfast: !currentData.hasBreakfast
        }
      };
    });
  };

  // Handle sheets checkbox
  const handleSheetsToggle = (itemId) => {
    setReservationData(prev => {
      const currentData = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          hasSheets: !currentData.hasSheets
        }
      };
    });
  };

  // Handle pool checkbox
  const handlePoolToggle = (itemId) => {
    setReservationData(prev => {
      const currentData = prev[itemId] || {};
      const hasPool = !currentData.hasPool;
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          hasPool: hasPool,
          pool: hasPool ? { length: '0', width: '0' } : undefined
        }
      };
    });
  };

  // Handle pool dimension change
  const handlePoolDimensionChange = (itemId, field, value) => {
    let cleanedValue = value.replace(/[^\d.]/g, '');
    if (cleanedValue.length > 1 && cleanedValue.startsWith('0') && !cleanedValue.startsWith('0.')) {
      cleanedValue = cleanedValue.replace(/^0+/, '');
    }
    if (cleanedValue === '' || cleanedValue === '.') {
      cleanedValue = '0';
    }
    
    setReservationData(prev => {
      const currentData = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          pool: {
            ...(currentData.pool || { length: '0', width: '0' }),
            [field]: cleanedValue
          }
        }
      };
    });
  };

  // Handle garden checkbox
  const handleGardenToggle = (itemId) => {
    setReservationData(prev => {
      const currentData = prev[itemId] || {};
      const hasGarden = !currentData.hasGarden;
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          hasGarden: hasGarden,
          garden: hasGarden ? { length: '0', width: '0' } : undefined
        }
      };
    });
  };

  // Handle garden dimension change
  const handleGardenDimensionChange = (itemId, field, value) => {
    let cleanedValue = value.replace(/[^\d.]/g, '');
    if (cleanedValue.length > 1 && cleanedValue.startsWith('0') && !cleanedValue.startsWith('0.')) {
      cleanedValue = cleanedValue.replace(/^0+/, '');
    }
    if (cleanedValue === '' || cleanedValue === '.') {
      cleanedValue = '0';
    }
    
    setReservationData(prev => {
      const currentData = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          garden: {
            ...(currentData.garden || { length: '0', width: '0' }),
            [field]: cleanedValue
          }
        }
      };
    });
  };

  // Calculate final price for an item
  useEffect(() => {
    const newFinalPrices = {};
    items.forEach(item => {
      const data = reservationData[item.id] || {};
      let total = 0;
      
      // Calculate rooms price
      if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
        data.rooms.forEach(room => {
          if (room && room.length && room.width) {
            const price = calculateRoomPrice(room.length, room.width);
            if (!isNaN(price) && isFinite(price)) {
              total += price;
            }
          }
        });
      }
      
      // Calculate suites price
      if (data.suites && Array.isArray(data.suites) && data.suites.length > 0) {
        data.suites.forEach(suite => {
          if (suite && suite.length && suite.width) {
            const price = calculateRoomPrice(suite.length, suite.width);
            if (!isNaN(price) && isFinite(price)) {
              total += price;
            }
          }
        });
      }
      
      // Add breakfast price if selected
      if (data.hasBreakfast) {
        total += BREAKFAST_PRICE;
      }
      
      // Add sheets price if selected
      if (data.hasSheets) {
        total += SHEETS_PRICE;
      }
      
      // Calculate pool price
      if (data.hasPool && data.pool && data.pool.length && data.pool.width) {
        const poolPrice = calculateRoomPrice(data.pool.length, data.pool.width);
        if (!isNaN(poolPrice) && isFinite(poolPrice)) {
          total += poolPrice;
        }
      }
      
      // Calculate garden price
      if (data.hasGarden && data.garden && data.garden.length && data.garden.width) {
        const gardenPrice = calculateRoomPrice(data.garden.length, data.garden.width);
        if (!isNaN(gardenPrice) && isFinite(gardenPrice)) {
          total += gardenPrice;
        }
      }
      
      // Round total to 2 decimal places
      newFinalPrices[item.id] = Math.round(total * 100) / 100;
    });
    setFinalPrices(newFinalPrices);
  }, [reservationData, items, calculateRoomPrice]);

  const handleReserve = (item) => {
    const { name, description } = getLocalizedText(item);
    const finalPrice = finalPrices[item.id] || 0;
    
    if (finalPrice === 0) {
      alert(t('maison_dhote_page.please_fill_form', 'Veuillez remplir le formulaire de réservation'));
      return;
    }
    
    navigate('/reservation-menage-complite', {
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
        serviceType: 'maison_dhote',
        reservationData: reservationData[item.id] || {}
      }
    });
  };

  if (loading) {
    return (
      <main className="menage-complite-page">
        <div className="menage-complite-header">
          <button 
            className="menage-complite-back-btn"
            onClick={() => navigate('/menage-complet')}
            title={t('maison_dhote_page.back', 'Retour')}
          >
            ← {t('maison_dhote_page.back', 'Retour')}
          </button>
        </div>
        <div className="menage-complite-loading">Chargement des services Maison d'hôte...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="menage-complite-page">
        <div className="menage-complite-header">
          <button 
            className="menage-complite-back-btn"
            onClick={() => navigate('/menage-complet')}
            title={t('maison_dhote_page.back', 'Retour')}
          >
            ← {t('maison_dhote_page.back', 'Retour')}
          </button>
        </div>
        <div className="menage-complite-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="menage-complite-page">
        <div className="menage-complite-header">
          <button 
            className="menage-complite-back-btn"
            onClick={() => navigate('/menage-complet')}
            title={t('maison_dhote_page.back', 'Retour')}
          >
            ← {t('maison_dhote_page.back', 'Retour')}
          </button>
        </div>
        <div className="menage-complite-empty">Aucun service Maison d'hôte disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="menage-complite-page">
      <div className="menage-complite-header">
        <button 
          className="menage-complite-back-btn"
          onClick={() => navigate('/menage-complet')}
          title={t('maison_dhote_page.back', 'Retour')}
        >
          ← {t('maison_dhote_page.back', 'Retour')}
        </button>
        <h1 className="menage-complite-title">
          {t('maison_dhote_page.title', 'Maison d\'hôte')}
        </h1>
      </div>
      <div className="maison-dhote-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const priceFormatted = formatPrice(item.price);
          return (
            <article key={item.id} className="menage-complite-card">
              {item.image && (
                <div className="maison-dhote-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Maison d\'hôte'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="menage-complite-card-body">
                <h2 className="menage-complite-card-title">{name || `Service #${item.id}`}</h2>
                {description && (
                  <p className="menage-complite-card-description">
                    {description}
                  </p>
                )}
                
                {/* Reservation Form */}
                <div className="maison-dhote-reservation-form">
                  {/* Rooms */}
                  <div className="maison-dhote-form-group">
                    <label className="maison-dhote-form-label">
                      {t('maison_dhote_page.rooms_count', 'عدد الغرف')}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={(reservationData[item.id]?.rooms || []).length}
                      onChange={(e) => handleRoomsCountChange(item.id, e.target.value)}
                      className="maison-dhote-form-input"
                      placeholder="0"
                    />
                    {(reservationData[item.id]?.rooms || []).length > 0 && (
                      <div className="maison-dhote-rooms-list">
                        {(reservationData[item.id]?.rooms || []).map((room, index) => {
                          const area = calculateArea(room.length, room.width);
                          const price = calculateRoomPrice(room.length, room.width);
                          return (
                            <div key={index} className="maison-dhote-room-item">
                              <div className="maison-dhote-room-header">
                                <span className="maison-dhote-room-title">
                                  {t('maison_dhote_page.room', 'غرفة')} {index + 1}
                                </span>
                                {price > 0 && (
                                  <span className="maison-dhote-room-price">
                                    {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                                  </span>
                                )}
                              </div>
                              <div className="maison-dhote-dimensions">
                                <div className="maison-dhote-dimension-group">
                                  <label className="maison-dhote-dimension-label">
                                    {t('maison_dhote_page.length', 'الطول (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={room.length}
                                    onChange={(e) => handleRoomDimensionChange(item.id, index, 'length', e.target.value)}
                                    className="maison-dhote-dimension-input"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="maison-dhote-dimension-group">
                                  <label className="maison-dhote-dimension-label">
                                    {t('maison_dhote_page.width', 'العرض (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={room.width}
                                    onChange={(e) => handleRoomDimensionChange(item.id, index, 'width', e.target.value)}
                                    className="maison-dhote-dimension-input"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Suites */}
                  <div className="maison-dhote-form-group">
                    <label className="maison-dhote-form-label">
                      {t('maison_dhote_page.suites_count', 'عدد الأجنحة')}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={(reservationData[item.id]?.suites || []).length}
                      onChange={(e) => handleSuitesCountChange(item.id, e.target.value)}
                      className="maison-dhote-form-input"
                      placeholder="0"
                    />
                    {(reservationData[item.id]?.suites || []).length > 0 && (
                      <div className="maison-dhote-suites-list">
                        {(reservationData[item.id]?.suites || []).map((suite, index) => {
                          const area = calculateArea(suite.length, suite.width);
                          const price = calculateRoomPrice(suite.length, suite.width);
                          return (
                            <div key={index} className="maison-dhote-suite-item">
                              <div className="maison-dhote-suite-header">
                                <span className="maison-dhote-suite-title">
                                  {t('maison_dhote_page.suite', 'جناح')} {index + 1}
                                </span>
                                {price > 0 && (
                                  <span className="maison-dhote-suite-price">
                                    {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                                  </span>
                                )}
                              </div>
                              <div className="maison-dhote-dimensions">
                                <div className="maison-dhote-dimension-group">
                                  <label className="maison-dhote-dimension-label">
                                    {t('maison_dhote_page.length', 'الطول (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={suite.length}
                                    onChange={(e) => handleSuiteDimensionChange(item.id, index, 'length', e.target.value)}
                                    className="maison-dhote-dimension-input"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="maison-dhote-dimension-group">
                                  <label className="maison-dhote-dimension-label">
                                    {t('maison_dhote_page.width', 'العرض (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={suite.width}
                                    onChange={(e) => handleSuiteDimensionChange(item.id, index, 'width', e.target.value)}
                                    className="maison-dhote-dimension-input"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Breakfast */}
                  <div className="maison-dhote-form-group">
                    <label className="maison-dhote-checkbox-label">
                      <input
                        type="checkbox"
                        checked={reservationData[item.id]?.hasBreakfast || false}
                        onChange={() => handleBreakfastToggle(item.id)}
                        className="maison-dhote-checkbox"
                      />
                      <span>{t('maison_dhote_page.has_breakfast', 'هل يشمل تجهيز الفطور؟')}</span>
                    </label>
                    {reservationData[item.id]?.hasBreakfast && (
                      <div className="maison-dhote-breakfast-price">
                        {BREAKFAST_PRICE.toFixed(2)} DH
                      </div>
                    )}
                  </div>

                  {/* Sheets */}
                  <div className="maison-dhote-form-group">
                    <label className="maison-dhote-checkbox-label">
                      <input
                        type="checkbox"
                        checked={reservationData[item.id]?.hasSheets || false}
                        onChange={() => handleSheetsToggle(item.id)}
                        className="maison-dhote-checkbox"
                      />
                      <span>{t('maison_dhote_page.has_sheets', 'هل يشمل تغيير الشراشف؟')}</span>
                    </label>
                    {reservationData[item.id]?.hasSheets && (
                      <div className="maison-dhote-sheets-price">
                        {SHEETS_PRICE.toFixed(2)} DH
                      </div>
                    )}
                  </div>

                  {/* Pool */}
                  <div className="maison-dhote-form-group">
                    <label className="maison-dhote-checkbox-label">
                      <input
                        type="checkbox"
                        checked={reservationData[item.id]?.hasPool || false}
                        onChange={() => handlePoolToggle(item.id)}
                        className="maison-dhote-checkbox"
                      />
                      <span>{t('maison_dhote_page.has_pool', 'تنظيف المسبح؟')}</span>
                    </label>
                    {reservationData[item.id]?.hasPool && (
                      <div className="maison-dhote-pool-section">
                        <div className="maison-dhote-pool-header">
                          <span className="maison-dhote-pool-title">
                            {t('maison_dhote_page.pool', 'المسبح')}:
                          </span>
                        </div>
                        <div className="maison-dhote-dimensions">
                          <div className="maison-dhote-dimension-group">
                            <label className="maison-dhote-dimension-label">
                              {t('maison_dhote_page.length', 'الطول (cm)')}:
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={reservationData[item.id]?.pool?.length || '0'}
                              onChange={(e) => handlePoolDimensionChange(item.id, 'length', e.target.value)}
                              className="maison-dhote-dimension-input"
                              placeholder="0"
                            />
                          </div>
                          <div className="maison-dhote-dimension-group">
                            <label className="maison-dhote-dimension-label">
                              {t('maison_dhote_page.width', 'العرض (cm)')}:
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={reservationData[item.id]?.pool?.width || '0'}
                              onChange={(e) => handlePoolDimensionChange(item.id, 'width', e.target.value)}
                              className="maison-dhote-dimension-input"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {reservationData[item.id]?.pool && (() => {
                          const area = calculateArea(reservationData[item.id].pool.length, reservationData[item.id].pool.width);
                          const price = calculateRoomPrice(reservationData[item.id].pool.length, reservationData[item.id].pool.width);
                          return price > 0 ? (
                            <div className="maison-dhote-pool-price">
                              {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Garden */}
                  <div className="maison-dhote-form-group">
                    <label className="maison-dhote-checkbox-label">
                      <input
                        type="checkbox"
                        checked={reservationData[item.id]?.hasGarden || false}
                        onChange={() => handleGardenToggle(item.id)}
                        className="maison-dhote-checkbox"
                      />
                      <span>{t('maison_dhote_page.has_garden', 'تنظيف الحديقة؟')}</span>
                    </label>
                    {reservationData[item.id]?.hasGarden && (
                      <div className="maison-dhote-garden-section">
                        <div className="maison-dhote-garden-header">
                          <span className="maison-dhote-garden-title">
                            {t('maison_dhote_page.garden', 'الحديقة')}:
                          </span>
                        </div>
                        <div className="maison-dhote-dimensions">
                          <div className="maison-dhote-dimension-group">
                            <label className="maison-dhote-dimension-label">
                              {t('maison_dhote_page.length', 'الطول (cm)')}:
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={reservationData[item.id]?.garden?.length || '0'}
                              onChange={(e) => handleGardenDimensionChange(item.id, 'length', e.target.value)}
                              className="maison-dhote-dimension-input"
                              placeholder="0"
                            />
                          </div>
                          <div className="maison-dhote-dimension-group">
                            <label className="maison-dhote-dimension-label">
                              {t('maison_dhote_page.width', 'العرض (cm)')}:
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={reservationData[item.id]?.garden?.width || '0'}
                              onChange={(e) => handleGardenDimensionChange(item.id, 'width', e.target.value)}
                              className="maison-dhote-dimension-input"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {reservationData[item.id]?.garden && (() => {
                          const area = calculateArea(reservationData[item.id].garden.length, reservationData[item.id].garden.width);
                          const price = calculateRoomPrice(reservationData[item.id].garden.length, reservationData[item.id].garden.width);
                          return price > 0 ? (
                            <div className="maison-dhote-garden-price">
                              {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Final Price */}
                  {finalPrices[item.id] > 0 && (
                    <div className="maison-dhote-final-price">
                      <span className="maison-dhote-final-price-label">
                        {t('maison_dhote_page.total_price', 'السعر الإجمالي')}:
                      </span>
                      <span className="maison-dhote-final-price-value">
                        {finalPrices[item.id].toFixed(2)} DH
                      </span>
                    </div>
                  )}
                </div>

                <button
                  className={`maison-dhote-card-reserve-btn ${finalPrices[item.id] <= 0 ? 'maison-dhote-card-reserve-btn-disabled' : ''}`}
                  onClick={() => handleReserve(item)}
                  disabled={finalPrices[item.id] <= 0}
                >
                  {t('maison_dhote_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


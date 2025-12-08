import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './menageComplite.css';
import './Hotel.css';

export default function Hotel() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for reservation form per item
  const [reservationData, setReservationData] = useState({}); // { itemId: { floor: 0, rooms: [], bathrooms: [], hasSheets: false, hasTowels: false, hasWindows: false } }
  const [finalPrices, setFinalPrices] = useState({}); // { itemId: finalPrice }

  useEffect(() => {
    const loadHotel = async () => {
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

          const frIsHotel = (typeNameFr.includes('hôtel') || typeNameFr.includes('hotel')) && !typeNameFr.includes('resort');
          const arIsHotel = typeNameAr.includes('فندق') && !typeNameAr.includes('منتجع');
          const enIsHotel = typeNameEn.includes('hotel') && !typeNameEn.includes('resort');

          return frIsHotel || arIsHotel || enIsHotel;
        });

        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        setItems(uniqueItems);
      } catch (err) {
        console.error('[Hotel] Exception loading data:', err);
        setError('Erreur de connexion: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHotel();
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
  const SHEETS_PRICE = 20; // 20 DH for sheets change
  const TOWELS_PRICE = 30; // 30 DH for towels washing
  const WINDOWS_PRICE = 20; // 20 DH for windows cleaning

  // Calculate area in m² from cm
  const calculateArea = (length, width) => {
    const len = parseFloat(String(length).replace(/[^\d.]/g, '')) || 0;
    const wid = parseFloat(String(width).replace(/[^\d.]/g, '')) || 0;
    if (len <= 0 || wid <= 0) return 0;
    // Convert cm² to m²: 1 m² = 10,000 cm²
    const areaInM2 = (len * wid) / 10000;
    return Math.round(areaInM2 * 100) / 100; // Round to 2 decimal places
  };

  // Calculate price for a single room/bathroom
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

  // Handle floor change
  const handleFloorChange = (itemId, floor) => {
    const numFloor = parseInt(floor) || 0;
    setReservationData(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        floor: numFloor
      }
    }));
  };

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

  // Handle bathrooms count change
  const handleBathroomsCountChange = (itemId, count) => {
    const numCount = parseInt(count) || 0;
    setReservationData(prev => {
      const currentData = prev[itemId] || { bathrooms: [] };
      const currentBathrooms = currentData.bathrooms || [];
      
      if (numCount > currentBathrooms.length) {
        const newBathrooms = [...currentBathrooms];
        for (let i = currentBathrooms.length; i < numCount; i++) {
          newBathrooms.push({ length: '0', width: '0' });
        }
        return {
          ...prev,
          [itemId]: {
            ...currentData,
            bathrooms: newBathrooms
          }
        };
      } else {
        return {
          ...prev,
          [itemId]: {
            ...currentData,
            bathrooms: currentBathrooms.slice(0, numCount)
          }
        };
      }
    });
  };

  // Handle bathroom dimension change
  const handleBathroomDimensionChange = (itemId, bathroomIndex, field, value) => {
    let cleanedValue = value.replace(/[^\d.]/g, '');
    if (cleanedValue.length > 1 && cleanedValue.startsWith('0') && !cleanedValue.startsWith('0.')) {
      cleanedValue = cleanedValue.replace(/^0+/, '');
    }
    if (cleanedValue === '' || cleanedValue === '.') {
      cleanedValue = '0';
    }
    
    setReservationData(prev => {
      const currentData = prev[itemId] || { bathrooms: [] };
      const newBathrooms = [...(currentData.bathrooms || [])];
      if (!newBathrooms[bathroomIndex]) {
        newBathrooms[bathroomIndex] = { length: '0', width: '0' };
      }
      newBathrooms[bathroomIndex] = {
        ...newBathrooms[bathroomIndex],
        [field]: cleanedValue
      };
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          bathrooms: newBathrooms
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

  // Handle towels checkbox
  const handleTowelsToggle = (itemId) => {
    setReservationData(prev => {
      const currentData = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          hasTowels: !currentData.hasTowels
        }
      };
    });
  };

  // Handle windows checkbox
  const handleWindowsToggle = (itemId) => {
    setReservationData(prev => {
      const currentData = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          hasWindows: !currentData.hasWindows
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
      
      // Calculate bathrooms price
      if (data.bathrooms && Array.isArray(data.bathrooms) && data.bathrooms.length > 0) {
        data.bathrooms.forEach(bathroom => {
          if (bathroom && bathroom.length && bathroom.width) {
            const price = calculateRoomPrice(bathroom.length, bathroom.width);
            if (!isNaN(price) && isFinite(price)) {
              total += price;
            }
          }
        });
      }
      
      // Add sheets price if selected
      if (data.hasSheets) {
        total += SHEETS_PRICE;
      }
      
      // Add towels price if selected
      if (data.hasTowels) {
        total += TOWELS_PRICE;
      }
      
      // Add windows price if selected
      if (data.hasWindows) {
        total += WINDOWS_PRICE;
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
      alert(t('hotel_page.please_fill_form', 'Veuillez remplir le formulaire de réservation'));
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
        serviceType: 'hotel',
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
            title={t('hotel_page.back', 'Retour')}
          >
            ← {t('hotel_page.back', 'Retour')}
          </button>
        </div>
        <div className="menage-complite-loading">Chargement des services Hôtel...</div>
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
            title={t('hotel_page.back', 'Retour')}
          >
            ← {t('hotel_page.back', 'Retour')}
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
            title={t('hotel_page.back', 'Retour')}
          >
            ← {t('hotel_page.back', 'Retour')}
          </button>
        </div>
        <div className="menage-complite-empty">Aucun service Hôtel disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="menage-complite-page">
      <div className="menage-complite-header">
        <button 
          className="menage-complite-back-btn"
          onClick={() => navigate('/menage-complet')}
          title={t('hotel_page.back', 'Retour')}
        >
          ← {t('hotel_page.back', 'Retour')}
        </button>
        <h1 className="menage-complite-title">
          {t('hotel_page.title', 'Hôtel')}
        </h1>
      </div>
      <div className="hotel-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const priceFormatted = formatPrice(item.price);
          return (
            <article key={item.id} className="menage-complite-card">
              {item.image && (
                <div className="hotel-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Hôtel'}
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
                <div className="hotel-reservation-form">
                  {/* Floor */}
                  <div className="hotel-form-group">
                    <label className="hotel-form-label">
                      {t('hotel_page.floor', 'رقم الطابق')}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={reservationData[item.id]?.floor || 0}
                      onChange={(e) => handleFloorChange(item.id, e.target.value)}
                      className="hotel-form-input"
                      placeholder="0"
                    />
                  </div>

                  {/* Rooms */}
                  <div className="hotel-form-group">
                    <label className="hotel-form-label">
                      {t('hotel_page.rooms_count', 'عدد الغرف المطلوب تنظيفها')}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={(reservationData[item.id]?.rooms || []).length}
                      onChange={(e) => handleRoomsCountChange(item.id, e.target.value)}
                      className="hotel-form-input"
                      placeholder="0"
                    />
                    {(reservationData[item.id]?.rooms || []).length > 0 && (
                      <div className="hotel-rooms-list">
                        {(reservationData[item.id]?.rooms || []).map((room, index) => {
                          const area = calculateArea(room.length, room.width);
                          const price = calculateRoomPrice(room.length, room.width);
                          return (
                            <div key={index} className="hotel-room-item">
                              <div className="hotel-room-header">
                                <span className="hotel-room-title">
                                  {t('hotel_page.room', 'غرفة')} {index + 1}
                                </span>
                                {price > 0 && (
                                  <span className="hotel-room-price">
                                    {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                                  </span>
                                )}
                              </div>
                              <div className="hotel-dimensions">
                                <div className="hotel-dimension-group">
                                  <label className="hotel-dimension-label">
                                    {t('hotel_page.length', 'الطول (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={room.length}
                                    onChange={(e) => handleRoomDimensionChange(item.id, index, 'length', e.target.value)}
                                    className="hotel-dimension-input"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="hotel-dimension-group">
                                  <label className="hotel-dimension-label">
                                    {t('hotel_page.width', 'العرض (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={room.width}
                                    onChange={(e) => handleRoomDimensionChange(item.id, index, 'width', e.target.value)}
                                    className="hotel-dimension-input"
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

                  {/* Bathrooms */}
                  <div className="hotel-form-group">
                    <label className="hotel-form-label">
                      {t('hotel_page.bathrooms_count', 'عدد الحمامات')}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={(reservationData[item.id]?.bathrooms || []).length}
                      onChange={(e) => handleBathroomsCountChange(item.id, e.target.value)}
                      className="hotel-form-input"
                      placeholder="0"
                    />
                    {(reservationData[item.id]?.bathrooms || []).length > 0 && (
                      <div className="hotel-bathrooms-list">
                        {(reservationData[item.id]?.bathrooms || []).map((bathroom, index) => {
                          const area = calculateArea(bathroom.length, bathroom.width);
                          const price = calculateRoomPrice(bathroom.length, bathroom.width);
                          return (
                            <div key={index} className="hotel-bathroom-item">
                              <div className="hotel-bathroom-header">
                                <span className="hotel-bathroom-title">
                                  {t('hotel_page.bathroom', 'حمام')} {index + 1}
                                </span>
                                {price > 0 && (
                                  <span className="hotel-bathroom-price">
                                    {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                                  </span>
                                )}
                              </div>
                              <div className="hotel-dimensions">
                                <div className="hotel-dimension-group">
                                  <label className="hotel-dimension-label">
                                    {t('hotel_page.length', 'الطول (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={bathroom.length}
                                    onChange={(e) => handleBathroomDimensionChange(item.id, index, 'length', e.target.value)}
                                    className="hotel-dimension-input"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="hotel-dimension-group">
                                  <label className="hotel-dimension-label">
                                    {t('hotel_page.width', 'العرض (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={bathroom.width}
                                    onChange={(e) => handleBathroomDimensionChange(item.id, index, 'width', e.target.value)}
                                    className="hotel-dimension-input"
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

                  {/* Sheets */}
                  <div className="hotel-form-group">
                    <label className="hotel-checkbox-label">
                      <input
                        type="checkbox"
                        checked={reservationData[item.id]?.hasSheets || false}
                        onChange={() => handleSheetsToggle(item.id)}
                        className="hotel-checkbox"
                      />
                      <span>{t('hotel_page.has_sheets', 'تغيير الأغطية؟')}</span>
                    </label>
                    {reservationData[item.id]?.hasSheets && (
                      <div className="hotel-sheets-price">
                        {SHEETS_PRICE.toFixed(2)} DH
                      </div>
                    )}
                  </div>

                  {/* Towels */}
                  <div className="hotel-form-group">
                    <label className="hotel-checkbox-label">
                      <input
                        type="checkbox"
                        checked={reservationData[item.id]?.hasTowels || false}
                        onChange={() => handleTowelsToggle(item.id)}
                        className="hotel-checkbox"
                      />
                      <span>{t('hotel_page.has_towels', 'غسيل المناشف؟')}</span>
                    </label>
                    {reservationData[item.id]?.hasTowels && (
                      <div className="hotel-towels-price">
                        {TOWELS_PRICE.toFixed(2)} DH
                      </div>
                    )}
                  </div>

                  {/* Windows */}
                  <div className="hotel-form-group">
                    <label className="hotel-checkbox-label">
                      <input
                        type="checkbox"
                        checked={reservationData[item.id]?.hasWindows || false}
                        onChange={() => handleWindowsToggle(item.id)}
                        className="hotel-checkbox"
                      />
                      <span>{t('hotel_page.has_windows', 'تنظيف النوافذ؟')}</span>
                    </label>
                    {reservationData[item.id]?.hasWindows && (
                      <div className="hotel-windows-price">
                        {WINDOWS_PRICE.toFixed(2)} DH
                      </div>
                    )}
                  </div>

                  {/* Final Price */}
                  {finalPrices[item.id] > 0 && (
                    <div className="hotel-final-price">
                      <span className="hotel-final-price-label">
                        {t('hotel_page.total_price', 'السعر الإجمالي')}:
                      </span>
                      <span className="hotel-final-price-value">
                        {finalPrices[item.id].toFixed(2)} DH
                      </span>
                    </div>
                  )}
                </div>

                <button
                  className={`hotel-card-reserve-btn ${finalPrices[item.id] <= 0 ? 'hotel-card-reserve-btn-disabled' : ''}`}
                  onClick={() => handleReserve(item)}
                  disabled={finalPrices[item.id] <= 0}
                >
                  {t('hotel_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


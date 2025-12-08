import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './menageComplite.css';
import './ResortHotel.css';

export default function ResortHotel() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for reservation form per item
  const [reservationData, setReservationData] = useState({}); // { itemId: { rooms: [], bathrooms: [], hasPool: false, pool: { length: '0', width: '0' }, hasOutdoor: false, outdoor: { length: '0', width: '0' }, balconies: [] } }
  const [finalPrices, setFinalPrices] = useState({}); // { itemId: finalPrice }

  useEffect(() => {
    const loadResortHotel = async () => {
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
        // 1. menage name contains "Ménage" (or similar)
        // 2. type_menage name contains "Resort Hôtel" (or variations)
        const filtered = allTypes.filter(item => {
          if (!item) return false;

          // Check menage name
          const menage = item.menage;
          if (!menage) return false;
          
          const menageNameFr = (menage.name_fr || '').toLowerCase().trim();
          const menageNameAr = (menage.name_ar || '').toLowerCase().trim();
          const menageNameEn = (menage.name_en || '').toLowerCase().trim();
          
          // Check if it's "Ménage" service (exclude other services)
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

          // Check type_menage name for "Resort Hôtel" (or variations)
          const typeNameFr = (item.name_fr || '').toLowerCase().trim();
          const typeNameAr = (item.name_ar || '').toLowerCase().trim();
          const typeNameEn = (item.name_en || '').toLowerCase().trim();

          // Must contain "resort" and "hôtel" / "hotel" (or variations)
          const frHasResortHotel = (typeNameFr.includes('resort') && typeNameFr.includes('hôtel')) || 
                                   (typeNameFr.includes('resort') && typeNameFr.includes('hotel'));
          const arHasResortHotel = (typeNameAr.includes('منتجع') && typeNameAr.includes('فندق')) ||
                                   (typeNameAr.includes('resort') && typeNameAr.includes('فندق'));
          const enHasResortHotel = typeNameEn.includes('resort') && typeNameEn.includes('hotel');

          return frHasResortHotel || arHasResortHotel || enHasResortHotel;
        });

        // Remove duplicates based on ID
        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        console.log('[ResortHotel] Filtered items:', uniqueItems.length, 'out of', allTypes.length);
        setItems(uniqueItems);
      } catch (err) {
        console.error('[ResortHotel] Exception loading data:', err);
        const errorMessage = err?.message || err?.toString() || 'Erreur de connexion';
        setError('Erreur de connexion: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadResortHotel();
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

  // Price per m²
  const PRICE_PER_M2 = 2; // 2 DH per m²

  // Calculate area in m² from cm
  const calculateArea = (length, width) => {
    const len = parseFloat(String(length).replace(/[^\d.]/g, '')) || 0;
    const wid = parseFloat(String(width).replace(/[^\d.]/g, '')) || 0;
    if (len <= 0 || wid <= 0) return 0;
    // Convert cm² to m²: 1 m² = 10,000 cm²
    const areaInM2 = (len * wid) / 10000;
    return Math.round(areaInM2 * 100) / 100; // Round to 2 decimal places
  };

  // Calculate price for a single room/bathroom/pool/outdoor/balcony
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

  // Handle outdoor checkbox
  const handleOutdoorToggle = (itemId) => {
    setReservationData(prev => {
      const currentData = prev[itemId] || {};
      const hasOutdoor = !currentData.hasOutdoor;
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          hasOutdoor: hasOutdoor,
          outdoor: hasOutdoor ? { length: '0', width: '0' } : undefined
        }
      };
    });
  };

  // Handle outdoor dimension change
  const handleOutdoorDimensionChange = (itemId, field, value) => {
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
          outdoor: {
            ...(currentData.outdoor || { length: '0', width: '0' }),
            [field]: cleanedValue
          }
        }
      };
    });
  };

  // Handle balconies count change
  const handleBalconiesCountChange = (itemId, count) => {
    const numCount = parseInt(count) || 0;
    setReservationData(prev => {
      const currentData = prev[itemId] || { balconies: [] };
      const currentBalconies = currentData.balconies || [];
      
      if (numCount > currentBalconies.length) {
        const newBalconies = [...currentBalconies];
        for (let i = currentBalconies.length; i < numCount; i++) {
          newBalconies.push({ length: '0', width: '0' });
        }
        return {
          ...prev,
          [itemId]: {
            ...currentData,
            balconies: newBalconies
          }
        };
      } else {
        return {
          ...prev,
          [itemId]: {
            ...currentData,
            balconies: currentBalconies.slice(0, numCount)
          }
        };
      }
    });
  };

  // Handle balcony dimension change
  const handleBalconyDimensionChange = (itemId, balconyIndex, field, value) => {
    let cleanedValue = value.replace(/[^\d.]/g, '');
    if (cleanedValue.length > 1 && cleanedValue.startsWith('0') && !cleanedValue.startsWith('0.')) {
      cleanedValue = cleanedValue.replace(/^0+/, '');
    }
    if (cleanedValue === '' || cleanedValue === '.') {
      cleanedValue = '0';
    }
    
    setReservationData(prev => {
      const currentData = prev[itemId] || { balconies: [] };
      const newBalconies = [...(currentData.balconies || [])];
      if (!newBalconies[balconyIndex]) {
        newBalconies[balconyIndex] = { length: '0', width: '0' };
      }
      newBalconies[balconyIndex] = {
        ...newBalconies[balconyIndex],
        [field]: cleanedValue
      };
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          balconies: newBalconies
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
      
      // Calculate pool price
      if (data.hasPool && data.pool && data.pool.length && data.pool.width) {
        const poolPrice = calculateRoomPrice(data.pool.length, data.pool.width);
        if (!isNaN(poolPrice) && isFinite(poolPrice)) {
          total += poolPrice;
        }
      }
      
      // Calculate outdoor price
      if (data.hasOutdoor && data.outdoor && data.outdoor.length && data.outdoor.width) {
        const outdoorPrice = calculateRoomPrice(data.outdoor.length, data.outdoor.width);
        if (!isNaN(outdoorPrice) && isFinite(outdoorPrice)) {
          total += outdoorPrice;
        }
      }
      
      // Calculate balconies price
      if (data.balconies && Array.isArray(data.balconies) && data.balconies.length > 0) {
        data.balconies.forEach(balcony => {
          if (balcony && balcony.length && balcony.width) {
            const price = calculateRoomPrice(balcony.length, balcony.width);
            if (!isNaN(price) && isFinite(price)) {
              total += price;
            }
          }
        });
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
      alert(t('resort_hotel_page.please_fill_form', 'Veuillez remplir le formulaire de réservation'));
      return;
    }
    
    // Navigate to reservation page
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
        serviceType: 'resort_hotel',
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
            title={t('resort_hotel_page.back', 'Retour')}
          >
            ← {t('resort_hotel_page.back', 'Retour')}
          </button>
        </div>
        <div className="menage-complite-loading">Chargement des services Resort Hôtel...</div>
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
            title={t('resort_hotel_page.back', 'Retour')}
          >
            ← {t('resort_hotel_page.back', 'Retour')}
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
            title={t('resort_hotel_page.back', 'Retour')}
          >
            ← {t('resort_hotel_page.back', 'Retour')}
          </button>
        </div>
        <div className="menage-complite-empty">Aucun service Resort Hôtel disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="menage-complite-page">
      <div className="menage-complite-header">
        <button 
          className="menage-complite-back-btn"
          onClick={() => navigate('/menage-complet')}
          title={t('resort_hotel_page.back', 'Retour')}
        >
          ← {t('resort_hotel_page.back', 'Retour')}
        </button>
        <h1 className="menage-complite-title">
          {t('resort_hotel_page.title', 'Resort Hôtel')}
        </h1>
      </div>
      <div className="resort-hotel-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const priceFormatted = formatPrice(item.price);
          return (
            <article key={item.id} className="menage-complite-card">
              {item.image && (
                <div className="resort-hotel-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Resort Hôtel'}
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
                <div className="resort-hotel-reservation-form">
                  {/* Rooms */}
                  <div className="resort-hotel-form-group">
                    <label className="resort-hotel-form-label">
                      {t('resort_hotel_page.rooms_count', 'عدد الغرف')}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={(reservationData[item.id]?.rooms || []).length}
                      onChange={(e) => handleRoomsCountChange(item.id, e.target.value)}
                      className="resort-hotel-form-input"
                      placeholder="0"
                    />
                    {(reservationData[item.id]?.rooms || []).length > 0 && (
                      <div className="resort-hotel-rooms-list">
                        {(reservationData[item.id]?.rooms || []).map((room, index) => {
                          const area = calculateArea(room.length, room.width);
                          const price = calculateRoomPrice(room.length, room.width);
                          return (
                            <div key={index} className="resort-hotel-room-item">
                              <div className="resort-hotel-room-header">
                                <span className="resort-hotel-room-title">
                                  {t('resort_hotel_page.room', 'غرفة')} {index + 1}
                                </span>
                                {price > 0 && (
                                  <span className="resort-hotel-room-price">
                                    {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                                  </span>
                                )}
                              </div>
                              <div className="resort-hotel-dimensions">
                                <div className="resort-hotel-dimension-group">
                                  <label className="resort-hotel-dimension-label">
                                    {t('resort_hotel_page.length', 'الطول (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={room.length}
                                    onChange={(e) => handleRoomDimensionChange(item.id, index, 'length', e.target.value)}
                                    className="resort-hotel-dimension-input"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="resort-hotel-dimension-group">
                                  <label className="resort-hotel-dimension-label">
                                    {t('resort_hotel_page.width', 'العرض (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={room.width}
                                    onChange={(e) => handleRoomDimensionChange(item.id, index, 'width', e.target.value)}
                                    className="resort-hotel-dimension-input"
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
                  <div className="resort-hotel-form-group">
                    <label className="resort-hotel-form-label">
                      {t('resort_hotel_page.bathrooms_count', 'عدد الحمامات')}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={(reservationData[item.id]?.bathrooms || []).length}
                      onChange={(e) => handleBathroomsCountChange(item.id, e.target.value)}
                      className="resort-hotel-form-input"
                      placeholder="0"
                    />
                    {(reservationData[item.id]?.bathrooms || []).length > 0 && (
                      <div className="resort-hotel-bathrooms-list">
                        {(reservationData[item.id]?.bathrooms || []).map((bathroom, index) => {
                          const area = calculateArea(bathroom.length, bathroom.width);
                          const price = calculateRoomPrice(bathroom.length, bathroom.width);
                          return (
                            <div key={index} className="resort-hotel-bathroom-item">
                              <div className="resort-hotel-bathroom-header">
                                <span className="resort-hotel-bathroom-title">
                                  {t('resort_hotel_page.bathroom', 'حمام')} {index + 1}
                                </span>
                                {price > 0 && (
                                  <span className="resort-hotel-bathroom-price">
                                    {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                                  </span>
                                )}
                              </div>
                              <div className="resort-hotel-dimensions">
                                <div className="resort-hotel-dimension-group">
                                  <label className="resort-hotel-dimension-label">
                                    {t('resort_hotel_page.length', 'الطول (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={bathroom.length}
                                    onChange={(e) => handleBathroomDimensionChange(item.id, index, 'length', e.target.value)}
                                    className="resort-hotel-dimension-input"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="resort-hotel-dimension-group">
                                  <label className="resort-hotel-dimension-label">
                                    {t('resort_hotel_page.width', 'العرض (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={bathroom.width}
                                    onChange={(e) => handleBathroomDimensionChange(item.id, index, 'width', e.target.value)}
                                    className="resort-hotel-dimension-input"
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

                  {/* Pool */}
                  <div className="resort-hotel-form-group">
                    <label className="resort-hotel-checkbox-label">
                      <input
                        type="checkbox"
                        checked={reservationData[item.id]?.hasPool || false}
                        onChange={() => handlePoolToggle(item.id)}
                        className="resort-hotel-checkbox"
                      />
                      <span>{t('resort_hotel_page.has_pool', 'تنظيف المسابح؟')}</span>
                    </label>
                    {reservationData[item.id]?.hasPool && (
                      <div className="resort-hotel-pool-section">
                        <div className="resort-hotel-pool-header">
                          <span className="resort-hotel-pool-title">
                            {t('resort_hotel_page.pool', 'المسبح')}:
                          </span>
                        </div>
                        <div className="resort-hotel-dimensions">
                          <div className="resort-hotel-dimension-group">
                            <label className="resort-hotel-dimension-label">
                              {t('resort_hotel_page.length', 'الطول (cm)')}:
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={reservationData[item.id]?.pool?.length || '0'}
                              onChange={(e) => handlePoolDimensionChange(item.id, 'length', e.target.value)}
                              className="resort-hotel-dimension-input"
                              placeholder="0"
                            />
                          </div>
                          <div className="resort-hotel-dimension-group">
                            <label className="resort-hotel-dimension-label">
                              {t('resort_hotel_page.width', 'العرض (cm)')}:
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={reservationData[item.id]?.pool?.width || '0'}
                              onChange={(e) => handlePoolDimensionChange(item.id, 'width', e.target.value)}
                              className="resort-hotel-dimension-input"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {reservationData[item.id]?.pool && (() => {
                          const area = calculateArea(reservationData[item.id].pool.length, reservationData[item.id].pool.width);
                          const price = calculateRoomPrice(reservationData[item.id].pool.length, reservationData[item.id].pool.width);
                          return price > 0 ? (
                            <div className="resort-hotel-pool-price">
                              {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Outdoor */}
                  <div className="resort-hotel-form-group">
                    <label className="resort-hotel-checkbox-label">
                      <input
                        type="checkbox"
                        checked={reservationData[item.id]?.hasOutdoor || false}
                        onChange={() => handleOutdoorToggle(item.id)}
                        className="resort-hotel-checkbox"
                      />
                      <span>{t('resort_hotel_page.has_outdoor', 'تنظيف المساحات الخارجية؟')}</span>
                    </label>
                    {reservationData[item.id]?.hasOutdoor && (
                      <div className="resort-hotel-outdoor-section">
                        <div className="resort-hotel-outdoor-header">
                          <span className="resort-hotel-outdoor-title">
                            {t('resort_hotel_page.outdoor', 'المساحات الخارجية')}:
                          </span>
                        </div>
                        <div className="resort-hotel-dimensions">
                          <div className="resort-hotel-dimension-group">
                            <label className="resort-hotel-dimension-label">
                              {t('resort_hotel_page.length', 'الطول (cm)')}:
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={reservationData[item.id]?.outdoor?.length || '0'}
                              onChange={(e) => handleOutdoorDimensionChange(item.id, 'length', e.target.value)}
                              className="resort-hotel-dimension-input"
                              placeholder="0"
                            />
                          </div>
                          <div className="resort-hotel-dimension-group">
                            <label className="resort-hotel-dimension-label">
                              {t('resort_hotel_page.width', 'العرض (cm)')}:
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={reservationData[item.id]?.outdoor?.width || '0'}
                              onChange={(e) => handleOutdoorDimensionChange(item.id, 'width', e.target.value)}
                              className="resort-hotel-dimension-input"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {reservationData[item.id]?.outdoor && (() => {
                          const area = calculateArea(reservationData[item.id].outdoor.length, reservationData[item.id].outdoor.width);
                          const price = calculateRoomPrice(reservationData[item.id].outdoor.length, reservationData[item.id].outdoor.width);
                          return price > 0 ? (
                            <div className="resort-hotel-outdoor-price">
                              {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Balconies */}
                  <div className="resort-hotel-form-group">
                    <label className="resort-hotel-form-label">
                      {t('resort_hotel_page.balconies_count', 'عدد الشرفات')}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={(reservationData[item.id]?.balconies || []).length}
                      onChange={(e) => handleBalconiesCountChange(item.id, e.target.value)}
                      className="resort-hotel-form-input"
                      placeholder="0"
                    />
                    {(reservationData[item.id]?.balconies || []).length > 0 && (
                      <div className="resort-hotel-balconies-list">
                        {(reservationData[item.id]?.balconies || []).map((balcony, index) => {
                          const area = calculateArea(balcony.length, balcony.width);
                          const price = calculateRoomPrice(balcony.length, balcony.width);
                          return (
                            <div key={index} className="resort-hotel-balcony-item">
                              <div className="resort-hotel-balcony-header">
                                <span className="resort-hotel-balcony-title">
                                  {t('resort_hotel_page.balcony', 'شرفة')} {index + 1}
                                </span>
                                {price > 0 && (
                                  <span className="resort-hotel-balcony-price">
                                    {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                                  </span>
                                )}
                              </div>
                              <div className="resort-hotel-dimensions">
                                <div className="resort-hotel-dimension-group">
                                  <label className="resort-hotel-dimension-label">
                                    {t('resort_hotel_page.length', 'الطول (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={balcony.length}
                                    onChange={(e) => handleBalconyDimensionChange(item.id, index, 'length', e.target.value)}
                                    className="resort-hotel-dimension-input"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="resort-hotel-dimension-group">
                                  <label className="resort-hotel-dimension-label">
                                    {t('resort_hotel_page.width', 'العرض (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={balcony.width}
                                    onChange={(e) => handleBalconyDimensionChange(item.id, index, 'width', e.target.value)}
                                    className="resort-hotel-dimension-input"
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

                  {/* Final Price */}
                  {finalPrices[item.id] > 0 && (
                    <div className="resort-hotel-final-price">
                      <span className="resort-hotel-final-price-label">
                        {t('resort_hotel_page.total_price', 'السعر الإجمالي')}:
                      </span>
                      <span className="resort-hotel-final-price-value">
                        {finalPrices[item.id].toFixed(2)} DH
                      </span>
                    </div>
                  )}
                </div>

                <button
                  className={`resort-hotel-card-reserve-btn ${finalPrices[item.id] <= 0 ? 'resort-hotel-card-reserve-btn-disabled' : ''}`}
                  onClick={() => handleReserve(item)}
                  disabled={finalPrices[item.id] <= 0}
                >
                  {t('resort_hotel_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


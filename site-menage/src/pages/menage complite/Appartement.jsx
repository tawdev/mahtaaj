import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './menageComplite.css';
import './Appartement.css';

export default function Appartement() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for reservation form per item
  const [reservationData, setReservationData] = useState({}); // { itemId: { rooms: [], salons: [], bathrooms: [], hasKitchen: false, kitchen: { length: '0', width: '0' }, hasLaundry: false } }
  const [finalPrices, setFinalPrices] = useState({}); // { itemId: finalPrice }

  useEffect(() => {
    const loadAppartement = async () => {
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

          const frIsAppartement = typeNameFr.includes('appartement') || typeNameFr.includes('appart');
          const arIsAppartement = typeNameAr.includes('شقة');
          const enIsAppartement = typeNameEn.includes('apartment') || typeNameEn.includes('flat');

          return frIsAppartement || arIsAppartement || enIsAppartement;
        });

        const uniqueItems = filtered.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        setItems(uniqueItems);
      } catch (err) {
        console.error('[Appartement] Exception loading data:', err);
        setError('Erreur de connexion: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAppartement();
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
  const LAUNDRY_PRICE = 50; // 50 DH for laundry service

  // Calculate area in m² from cm
  const calculateArea = (length, width) => {
    const len = parseFloat(String(length).replace(/[^\d.]/g, '')) || 0;
    const wid = parseFloat(String(width).replace(/[^\d.]/g, '')) || 0;
    if (len <= 0 || wid <= 0) return 0;
    // Convert cm² to m²: 1 m² = 10,000 cm²
    const areaInM2 = (len * wid) / 10000;
    return Math.round(areaInM2 * 100) / 100; // Round to 2 decimal places
  };

  // Calculate price for a single room/bathroom/salon/kitchen
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

  // Handle salons count change
  const handleSalonsCountChange = (itemId, count) => {
    const numCount = parseInt(count) || 0;
    setReservationData(prev => {
      const currentData = prev[itemId] || { salons: [] };
      const currentSalons = currentData.salons || [];
      
      if (numCount > currentSalons.length) {
        const newSalons = [...currentSalons];
        for (let i = currentSalons.length; i < numCount; i++) {
          newSalons.push({ length: '0', width: '0' });
        }
        return {
          ...prev,
          [itemId]: {
            ...currentData,
            salons: newSalons
          }
        };
      } else {
        return {
          ...prev,
          [itemId]: {
            ...currentData,
            salons: currentSalons.slice(0, numCount)
          }
        };
      }
    });
  };

  // Handle salon dimension change
  const handleSalonDimensionChange = (itemId, salonIndex, field, value) => {
    let cleanedValue = value.replace(/[^\d.]/g, '');
    if (cleanedValue.length > 1 && cleanedValue.startsWith('0') && !cleanedValue.startsWith('0.')) {
      cleanedValue = cleanedValue.replace(/^0+/, '');
    }
    if (cleanedValue === '' || cleanedValue === '.') {
      cleanedValue = '0';
    }
    
    setReservationData(prev => {
      const currentData = prev[itemId] || { salons: [] };
      const newSalons = [...(currentData.salons || [])];
      if (!newSalons[salonIndex]) {
        newSalons[salonIndex] = { length: '0', width: '0' };
      }
      newSalons[salonIndex] = {
        ...newSalons[salonIndex],
        [field]: cleanedValue
      };
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          salons: newSalons
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

  // Handle kitchen checkbox
  const handleKitchenToggle = (itemId) => {
    setReservationData(prev => {
      const currentData = prev[itemId] || {};
      const hasKitchen = !currentData.hasKitchen;
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          hasKitchen: hasKitchen,
          kitchen: hasKitchen ? { length: '0', width: '0' } : undefined
        }
      };
    });
  };

  // Handle kitchen dimension change
  const handleKitchenDimensionChange = (itemId, field, value) => {
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
          kitchen: {
            ...(currentData.kitchen || { length: '0', width: '0' }),
            [field]: cleanedValue
          }
        }
      };
    });
  };

  // Handle laundry checkbox
  const handleLaundryToggle = (itemId) => {
    setReservationData(prev => {
      const currentData = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          ...currentData,
          hasLaundry: !currentData.hasLaundry
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
      
      // Calculate salons price
      if (data.salons && Array.isArray(data.salons) && data.salons.length > 0) {
        data.salons.forEach(salon => {
          if (salon && salon.length && salon.width) {
            const price = calculateRoomPrice(salon.length, salon.width);
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
      
      // Calculate kitchen price
      if (data.hasKitchen && data.kitchen && data.kitchen.length && data.kitchen.width) {
        const kitchenPrice = calculateRoomPrice(data.kitchen.length, data.kitchen.width);
        if (!isNaN(kitchenPrice) && isFinite(kitchenPrice)) {
          total += kitchenPrice;
        }
      }
      
      // Add laundry price if selected
      if (data.hasLaundry) {
        total += LAUNDRY_PRICE;
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
      alert(t('appartement_page.please_fill_form', 'Veuillez remplir le formulaire de réservation'));
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
        serviceType: 'appartement',
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
            title={t('appartement_page.back', 'Retour')}
          >
            ← {t('appartement_page.back', 'Retour')}
          </button>
        </div>
        <div className="menage-complite-loading">Chargement des services Appartement...</div>
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
            title={t('appartement_page.back', 'Retour')}
          >
            ← {t('appartement_page.back', 'Retour')}
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
            title={t('appartement_page.back', 'Retour')}
          >
            ← {t('appartement_page.back', 'Retour')}
          </button>
        </div>
        <div className="menage-complite-empty">Aucun service Appartement disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="menage-complite-page">
      <div className="menage-complite-header">
        <button 
          className="menage-complite-back-btn"
          onClick={() => navigate('/menage-complet')}
          title={t('appartement_page.back', 'Retour')}
        >
          ← {t('appartement_page.back', 'Retour')}
        </button>
        <h1 className="menage-complite-title">
          {t('appartement_page.title', 'Appartement')}
        </h1>
      </div>
      <div className="appartement-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const priceFormatted = formatPrice(item.price);
          return (
            <article key={item.id} className="menage-complite-card">
              {item.image && (
                <div className="appartement-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Appartement'}
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
                <div className="appartement-reservation-form">
                  {/* Rooms */}
                  <div className="appartement-form-group">
                    <label className="appartement-form-label">
                      {t('appartement_page.rooms_count', 'عدد الغرف')}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={(reservationData[item.id]?.rooms || []).length}
                      onChange={(e) => handleRoomsCountChange(item.id, e.target.value)}
                      className="appartement-form-input"
                      placeholder="0"
                    />
                    {(reservationData[item.id]?.rooms || []).length > 0 && (
                      <div className="appartement-rooms-list">
                        {(reservationData[item.id]?.rooms || []).map((room, index) => {
                          const area = calculateArea(room.length, room.width);
                          const price = calculateRoomPrice(room.length, room.width);
                          return (
                            <div key={index} className="appartement-room-item">
                              <div className="appartement-room-header">
                                <span className="appartement-room-title">
                                  {t('appartement_page.room', 'غرفة')} {index + 1}
                                </span>
                                {price > 0 && (
                                  <span className="appartement-room-price">
                                    {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                                  </span>
                                )}
                              </div>
                              <div className="appartement-dimensions">
                                <div className="appartement-dimension-group">
                                  <label className="appartement-dimension-label">
                                    {t('appartement_page.length', 'الطول (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={room.length}
                                    onChange={(e) => handleRoomDimensionChange(item.id, index, 'length', e.target.value)}
                                    className="appartement-dimension-input"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="appartement-dimension-group">
                                  <label className="appartement-dimension-label">
                                    {t('appartement_page.width', 'العرض (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={room.width}
                                    onChange={(e) => handleRoomDimensionChange(item.id, index, 'width', e.target.value)}
                                    className="appartement-dimension-input"
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

                  {/* Salons */}
                  <div className="appartement-form-group">
                    <label className="appartement-form-label">
                      {t('appartement_page.salons_count', 'عدد الصالونات')}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={(reservationData[item.id]?.salons || []).length}
                      onChange={(e) => handleSalonsCountChange(item.id, e.target.value)}
                      className="appartement-form-input"
                      placeholder="0"
                    />
                    {(reservationData[item.id]?.salons || []).length > 0 && (
                      <div className="appartement-salons-list">
                        {(reservationData[item.id]?.salons || []).map((salon, index) => {
                          const area = calculateArea(salon.length, salon.width);
                          const price = calculateRoomPrice(salon.length, salon.width);
                          return (
                            <div key={index} className="appartement-salon-item">
                              <div className="appartement-salon-header">
                                <span className="appartement-salon-title">
                                  {t('appartement_page.salon', 'صالون')} {index + 1}
                                </span>
                                {price > 0 && (
                                  <span className="appartement-salon-price">
                                    {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                                  </span>
                                )}
                              </div>
                              <div className="appartement-dimensions">
                                <div className="appartement-dimension-group">
                                  <label className="appartement-dimension-label">
                                    {t('appartement_page.length', 'الطول (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={salon.length}
                                    onChange={(e) => handleSalonDimensionChange(item.id, index, 'length', e.target.value)}
                                    className="appartement-dimension-input"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="appartement-dimension-group">
                                  <label className="appartement-dimension-label">
                                    {t('appartement_page.width', 'العرض (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={salon.width}
                                    onChange={(e) => handleSalonDimensionChange(item.id, index, 'width', e.target.value)}
                                    className="appartement-dimension-input"
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
                  <div className="appartement-form-group">
                    <label className="appartement-form-label">
                      {t('appartement_page.bathrooms_count', 'عدد الحمامات')}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={(reservationData[item.id]?.bathrooms || []).length}
                      onChange={(e) => handleBathroomsCountChange(item.id, e.target.value)}
                      className="appartement-form-input"
                      placeholder="0"
                    />
                    {(reservationData[item.id]?.bathrooms || []).length > 0 && (
                      <div className="appartement-bathrooms-list">
                        {(reservationData[item.id]?.bathrooms || []).map((bathroom, index) => {
                          const area = calculateArea(bathroom.length, bathroom.width);
                          const price = calculateRoomPrice(bathroom.length, bathroom.width);
                          return (
                            <div key={index} className="appartement-bathroom-item">
                              <div className="appartement-bathroom-header">
                                <span className="appartement-bathroom-title">
                                  {t('appartement_page.bathroom', 'حمام')} {index + 1}
                                </span>
                                {price > 0 && (
                                  <span className="appartement-bathroom-price">
                                    {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                                  </span>
                                )}
                              </div>
                              <div className="appartement-dimensions">
                                <div className="appartement-dimension-group">
                                  <label className="appartement-dimension-label">
                                    {t('appartement_page.length', 'الطول (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={bathroom.length}
                                    onChange={(e) => handleBathroomDimensionChange(item.id, index, 'length', e.target.value)}
                                    className="appartement-dimension-input"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="appartement-dimension-group">
                                  <label className="appartement-dimension-label">
                                    {t('appartement_page.width', 'العرض (cm)')}:
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={bathroom.width}
                                    onChange={(e) => handleBathroomDimensionChange(item.id, index, 'width', e.target.value)}
                                    className="appartement-dimension-input"
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

                  {/* Kitchen */}
                  <div className="appartement-form-group">
                    <label className="appartement-checkbox-label">
                      <input
                        type="checkbox"
                        checked={reservationData[item.id]?.hasKitchen || false}
                        onChange={() => handleKitchenToggle(item.id)}
                        className="appartement-checkbox"
                      />
                      <span>{t('appartement_page.has_kitchen', 'هل يوجد مطبخ؟')}</span>
                    </label>
                    {reservationData[item.id]?.hasKitchen && (
                      <div className="appartement-kitchen-section">
                        <div className="appartement-kitchen-header">
                          <span className="appartement-kitchen-title">
                            {t('appartement_page.kitchen', 'المطبخ')}:
                          </span>
                        </div>
                        <div className="appartement-dimensions">
                          <div className="appartement-dimension-group">
                            <label className="appartement-dimension-label">
                              {t('appartement_page.length', 'الطول (cm)')}:
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={reservationData[item.id]?.kitchen?.length || '0'}
                              onChange={(e) => handleKitchenDimensionChange(item.id, 'length', e.target.value)}
                              className="appartement-dimension-input"
                              placeholder="0"
                            />
                          </div>
                          <div className="appartement-dimension-group">
                            <label className="appartement-dimension-label">
                              {t('appartement_page.width', 'العرض (cm)')}:
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={reservationData[item.id]?.kitchen?.width || '0'}
                              onChange={(e) => handleKitchenDimensionChange(item.id, 'width', e.target.value)}
                              className="appartement-dimension-input"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {reservationData[item.id]?.kitchen && (() => {
                          const area = calculateArea(reservationData[item.id].kitchen.length, reservationData[item.id].kitchen.width);
                          const price = calculateRoomPrice(reservationData[item.id].kitchen.length, reservationData[item.id].kitchen.width);
                          return price > 0 ? (
                            <div className="appartement-kitchen-price">
                              {price.toFixed(2)} DH ({area.toFixed(2)} m²)
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Laundry */}
                  <div className="appartement-form-group">
                    <label className="appartement-checkbox-label">
                      <input
                        type="checkbox"
                        checked={reservationData[item.id]?.hasLaundry || false}
                        onChange={() => handleLaundryToggle(item.id)}
                        className="appartement-checkbox"
                      />
                      <span>{t('appartement_page.has_laundry', 'غسل الملابس؟')}</span>
                    </label>
                    {reservationData[item.id]?.hasLaundry && (
                      <div className="appartement-laundry-price">
                        {LAUNDRY_PRICE.toFixed(2)} DH
                      </div>
                    )}
                  </div>

                  {/* Final Price */}
                  {finalPrices[item.id] > 0 && (
                    <div className="appartement-final-price">
                      <span className="appartement-final-price-label">
                        {t('appartement_page.total_price', 'السعر الإجمالي')}:
                      </span>
                      <span className="appartement-final-price-value">
                        {finalPrices[item.id].toFixed(2)} DH
                      </span>
                    </div>
                  )}
                </div>

                <button
                  className={`appartement-card-reserve-btn ${finalPrices[item.id] <= 0 ? 'appartement-card-reserve-btn-disabled' : ''}`}
                  onClick={() => handleReserve(item)}
                  disabled={finalPrices[item.id] <= 0}
                >
                  {t('appartement_page.reserve', 'Réserver')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


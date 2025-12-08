import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './ReservationCuisin.css';

export default function ReservationMenageCuine() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedTypes = location.state?.selectedTypes || [];
  const selectedMenageItems = location.state?.selectedMenageItems || [];
  const categoryData = location.state?.category || null;
  const serviceData = location.state?.service || null;

  const [formValues, setFormValues] = useState({
    firstname: '',
    phone: '',
    email: '',
    location: '',
    preferred_date: '',
    preferred_time: '',
    message: ''
  });

  // Dynamic fields based on Ménage type
  const [menageFormData, setMenageFormData] = useState({
    floor: 0,
    floors: 0, // For Villa
    rooms: [],
    bathrooms: [],
    salons: [],
    suites: [], // For Maison d'hôte
    hasSheets: false,
    hasTowels: false,
    hasWindows: false,
    hasKitchen: false,
    hasLaundry: false,
    hasGarden: false,
    hasPool: false,
    hasBreakfast: false, // For Maison d'hôte
    hasOutdoor: false, // For Resort Hotel
    pool: { length: '0', width: '0' },
    garden: { length: '0', width: '0' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getLocalizedText = (item) => {
    const lang = i18n.language || 'fr';
    if (lang === 'ar') {
      return item.name_ar || item.name_fr || item.name_en || item.name;
    }
    if (lang === 'en') {
      return item.name_en || item.name_fr || item.name_ar || item.name;
    }
    return item.name_fr || item.name_en || item.name_ar || item.name;
  };

  // Determine Ménage type
  const getMenageType = () => {
    if (selectedMenageItems.length === 0) return null;
    const menageItem = selectedMenageItems[0];
    const name = getLocalizedText(menageItem).toLowerCase();
    
    if (name.includes('hôtel') || name.includes('hotel')) {
      if (name.includes('resort')) return 'resort_hotel';
      return 'hotel';
    }
    if (name.includes('appartement') || name.includes('appart')) return 'appartement';
    if (name.includes('maison')) {
      if (name.includes('hôte') || name.includes('hote')) return 'maison_dhote';
      return 'maison';
    }
    if (name.includes('villa')) return 'villa';
    return null;
  };

  const menageType = getMenageType();

  // Handle dynamic form fields
  const handleMenageFieldChange = (field, value) => {
    setMenageFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRoomsCountChange = (count) => {
    const numRooms = parseInt(count) || 0;
    const newRooms = Array(numRooms).fill(null).map(() => ({ length: '0', width: '0' }));
    setMenageFormData(prev => ({ ...prev, rooms: newRooms }));
  };

  const handleBathroomsCountChange = (count) => {
    const numBathrooms = parseInt(count) || 0;
    const newBathrooms = Array(numBathrooms).fill(null).map(() => ({ length: '0', width: '0' }));
    setMenageFormData(prev => ({ ...prev, bathrooms: newBathrooms }));
  };

  const handleSalonsCountChange = (count) => {
    const numSalons = parseInt(count) || 0;
    const newSalons = Array(numSalons).fill(null).map(() => ({ length: '0', width: '0' }));
    setMenageFormData(prev => ({ ...prev, salons: newSalons }));
  };

  const handleRoomDimensionChange = (index, dimension, value) => {
    const newRooms = [...menageFormData.rooms];
    if (!newRooms[index]) newRooms[index] = { length: '0', width: '0' };
    newRooms[index][dimension] = value;
    setMenageFormData(prev => ({ ...prev, rooms: newRooms }));
  };

  const handleBathroomDimensionChange = (index, dimension, value) => {
    const newBathrooms = [...menageFormData.bathrooms];
    if (!newBathrooms[index]) newBathrooms[index] = { length: '0', width: '0' };
    newBathrooms[index][dimension] = value;
    setMenageFormData(prev => ({ ...prev, bathrooms: newBathrooms }));
  };

  const handleSalonDimensionChange = (index, dimension, value) => {
    const newSalons = [...menageFormData.salons];
    if (!newSalons[index]) newSalons[index] = { length: '0', width: '0' };
    newSalons[index][dimension] = value;
    setMenageFormData(prev => ({ ...prev, salons: newSalons }));
  };

  const handleSuitesCountChange = (count) => {
    const numSuites = parseInt(count) || 0;
    const newSuites = Array(numSuites).fill(null).map(() => ({ length: '0', width: '0' }));
    setMenageFormData(prev => ({ ...prev, suites: newSuites }));
  };

  const handleSuiteDimensionChange = (index, dimension, value) => {
    const newSuites = [...menageFormData.suites];
    if (!newSuites[index]) newSuites[index] = { length: '0', width: '0' };
    newSuites[index][dimension] = value;
    setMenageFormData(prev => ({ ...prev, suites: newSuites }));
  };

  const handleGardenDimensionChange = (dimension, value) => {
    setMenageFormData(prev => ({
      ...prev,
      garden: {
        ...prev.garden,
        [dimension]: value
      }
    }));
  };

  const handlePoolDimensionChange = (dimension, value) => {
    setMenageFormData(prev => ({
      ...prev,
      pool: {
        ...prev.pool,
        [dimension]: value
      }
    }));
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

  // Calculate price for a single room/bathroom/salon
  const calculateRoomPrice = (length, width) => {
    const len = parseFloat(String(length).replace(/[^\d.]/g, '')) || 0;
    const wid = parseFloat(String(width).replace(/[^\d.]/g, '')) || 0;
    if (len <= 0 || wid <= 0) return 0;
    // Convert cm² to m²: 1 m² = 10,000 cm²
    const areaInM2 = (len * wid) / 10000;
    const area = Math.round(areaInM2 * 100) / 100; // Round to 2 decimal places
    const price = area * PRICE_PER_M2;
    return Math.round(price * 100) / 100; // Round to 2 decimal places
  };

  const calculateTotalPrice = () => {
    let total = 0;
    
    // Ajouter le prix du type Ménage sélectionné (prix de base)
    if (selectedMenageItems.length > 0) {
      selectedMenageItems.forEach(item => {
        total += parseFloat(item.price) || 0;
      });
    }
    
    // Calculer le prix basé sur les dimensions des chambres
    if (menageFormData.rooms && menageFormData.rooms.length > 0) {
      menageFormData.rooms.forEach(room => {
        if (room && room.length && room.width) {
          total += calculateRoomPrice(room.length, room.width);
        }
      });
    }
    
    // Calculer le prix basé sur les dimensions des salles de bain
    if (menageFormData.bathrooms && menageFormData.bathrooms.length > 0) {
      menageFormData.bathrooms.forEach(bathroom => {
        if (bathroom && bathroom.length && bathroom.width) {
          total += calculateRoomPrice(bathroom.length, bathroom.width);
        }
      });
    }
    
    // Calculer le prix basé sur les dimensions des salons
    if (menageFormData.salons && menageFormData.salons.length > 0) {
      menageFormData.salons.forEach(salon => {
        if (salon && salon.length && salon.width) {
          total += calculateRoomPrice(salon.length, salon.width);
        }
      });
    }
    
    // Calculer le prix basé sur les dimensions des suites (Maison d'hôte)
    if (menageFormData.suites && menageFormData.suites.length > 0) {
      menageFormData.suites.forEach(suite => {
        if (suite && suite.length && suite.width) {
          total += calculateRoomPrice(suite.length, suite.width);
        }
      });
    }
    
    // Calculer le prix basé sur les dimensions du jardin
    if (menageFormData.hasGarden && menageFormData.garden && menageFormData.garden.length && menageFormData.garden.width) {
      total += calculateRoomPrice(menageFormData.garden.length, menageFormData.garden.width);
    }
    
    // Calculer le prix basé sur les dimensions de la piscine
    if (menageFormData.hasPool && menageFormData.pool && menageFormData.pool.length && menageFormData.pool.width) {
      total += calculateRoomPrice(menageFormData.pool.length, menageFormData.pool.width);
    }
    
    // Ajouter les prix des services supplémentaires
    // Breakfast pour Maison d'hôte (50 DH)
    if (menageFormData.hasBreakfast) {
      total += 50;
    }
    
    // Sheets pour Maison d'hôte (30 DH)
    if (menageFormData.hasSheets && menageType === 'maison_dhote') {
      total += 30;
    }
    
    // Ajouter les prix des types Cuisine sélectionnés
    total += selectedTypes.reduce((sum, type) => {
      return sum + (parseFloat(type.price) || 0);
    }, 0);
    
    return Math.round(total * 100) / 100; // Round to 2 decimal places
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formValues.firstname.trim()) {
      setSubmitError(t('reservation_menage_cuisine.error_firstname', 'Veuillez entrer votre nom'));
      return;
    }
    if (!formValues.phone.trim()) {
      setSubmitError(t('reservation_menage_cuisine.error_phone', 'Veuillez entrer votre numéro de téléphone'));
      return;
    }
    if (!formValues.location.trim()) {
      setSubmitError(t('reservation_menage_cuisine.error_location', 'Veuillez entrer votre adresse'));
      return;
    }
    if (selectedMenageItems.length !== 1) {
      setSubmitError(t('reservation_menage_cuisine.error_menage', 'Veuillez sélectionner un type de Ménage'));
      return;
    }
    if (selectedTypes.length < 1) {
      setSubmitError(t('reservation_menage_cuisine.error_cuisine', 'Veuillez sélectionner au moins un type de Cuisine'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();

      const totalPrice = calculateTotalPrice();
      
      // Préparer les informations Ménage
      const menageItem = selectedMenageItems[0];
      const menageInfo = menageItem ? {
        id: menageItem.id,
        name: getLocalizedText(menageItem),
        price: parseFloat(menageItem.price) || 0
      } : null;

      const reservationPayload = {
        firstname: formValues.firstname.trim(),
        phone: formValues.phone.trim(),
        email: formValues.email.trim() || null,
        location: formValues.location.trim(),
        category_house_id: categoryData?.id || 2, // Cuisine category ID is 2
        service_id: serviceData?.id || null,
        // Informations Ménage
        selected_menage: menageInfo,
        menage_type_id: menageItem?.id || null,
        menage_type: menageType,
        // Informations Cuisine
        selected_types: selectedTypes.map(t => ({
          id: t.id,
          name: t.name,
          price: t.price || 0
        })),
        types_names: [
          menageInfo ? menageInfo.name : null,
          ...selectedTypes.map(t => t.name)
        ].filter(Boolean).join(' + '),
        // Dynamic Ménage form data
        menage_form_data: menageFormData,
        total_price: totalPrice,
        preferred_date: formValues.preferred_date || null,
        preferred_time: formValues.preferred_time || null,
        message: formValues.message.trim() || null,
        user_id: user?.id || null,
        status: 'pending'
      };

      console.log('[ReservationMenageCuine] Submitting reservation:', reservationPayload);

      const { data, error } = await supabase
        .from('menage_cuisine_reservations')
        .insert([reservationPayload])
        .select()
        .single();

      if (error) {
        console.error('[ReservationMenageCuine] Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        setSubmitError(t('reservation_menage_cuisine.error_submit', 'Erreur lors de l\'envoi de la réservation. Veuillez réessayer.'));
        setIsSubmitting(false);
        return;
      }

      console.log('[ReservationMenageCuine] Reservation submitted successfully:', data);
      setSubmitSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/menage-cuisine');
      }, 3000);

    } catch (err) {
      console.error('[ReservationMenageCuine] Exception during submission:', err);
      setSubmitError(t('reservation_menage_cuisine.error_submit', 'Erreur lors de l\'envoi de la réservation. Veuillez réessayer.'));
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <main className="reservation-cuisin-page">
        <div className="reservation-cuisin-container">
          <div className="reservation-cuisin-success">
            <div className="success-icon">✅</div>
            <h2>{t('reservation_menage_cuisine.success_title', 'Réservation envoyée avec succès!')}</h2>
            <p>{t('reservation_menage_cuisine.success_message', 'Votre demande de réservation a été enregistrée. Nous vous contacterons bientôt.')}</p>
            <p className="redirect-message">{t('reservation_menage_cuisine.redirect_message', 'Redirection en cours...')}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="reservation-cuisin-page">
      <div className="reservation-cuisin-container">
        <button 
          className="reservation-cuisin-back-button"
          onClick={() => navigate('/menage-cuisine')}
          title={t('reservation_menage_cuisine.back', 'Retour')}
        >
          ← {t('reservation_menage_cuisine.back', 'Retour')}
        </button>

        <div className="reservation-cuisin-header">
          <h1>{t('reservation_menage_cuisine.title', 'Réservation Ménage + Cuisine')}</h1>
        </div>

        {/* Résumé de la réservation */}
        {(selectedMenageItems.length > 0 || selectedTypes.length > 0) && (
          <div className="selected-types-summary">
            <h3>{t('reservation_menage_cuisine.selected_types', 'Résumé de la réservation:')}</h3>
            
            {/* Affichage Ménage */}
            {selectedMenageItems.length > 0 && (
              <div className="menage-section-summary" style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '8px', color: '#1e293b' }}>
                  {t('reservation_menage_cuisine.menage_selected', 'Ménage sélectionné:')}
                </h4>
                <div className="types-list">
                  {selectedMenageItems.map((item, index) => {
                    const name = getLocalizedText(item);
                    return (
                      <div key={item.id || index} className="type-item">
                        <span className="type-name">{name}</span>
                        {item.price && (
                          <span className="type-price">{parseFloat(item.price).toFixed(2)} DH</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Affichage Cuisine */}
            {selectedTypes.length > 0 && (
              <div className="cuisine-section-summary">
                <h4 style={{ marginBottom: '8px', color: '#1e293b' }}>
                  {t('reservation_menage_cuisine.cuisine_selected', 'Cuisine sélectionnée:')}
                </h4>
                <div className="types-list">
                  {selectedTypes.map((type, index) => (
                    <div key={type.id || index} className="type-item">
                      <span className="type-name">{type.name}</span>
                      {type.price && (
                        <span className="type-price">{parseFloat(type.price).toFixed(2)} DH</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
             <div className="total-price" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e2e8f0' }}>
               {/* Détail du prix */}
               <div style={{ marginBottom: '12px', fontSize: '14px', color: '#64748b' }}>
                 {/* Prix Ménage de base */}
                 {selectedMenageItems.length > 0 && selectedMenageItems[0].price && (
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                     <span>{getLocalizedText(selectedMenageItems[0])} (base):</span>
                     <span>{parseFloat(selectedMenageItems[0].price || 0).toFixed(2)} DH</span>
                   </div>
                 )}
                 
                 {/* Prix des chambres */}
                 {menageFormData.rooms.length > 0 && menageFormData.rooms.some(r => r && (parseFloat(r.length) > 0 || parseFloat(r.width) > 0)) && (
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                     <span>{i18n.language === 'ar' ? 'الغرف:' : i18n.language === 'fr' ? 'Chambres:' : 'Rooms:'}</span>
                     <span>
                       {menageFormData.rooms.reduce((sum, room) => {
                         if (room && room.length && room.width) {
                           return sum + calculateRoomPrice(room.length, room.width);
                         }
                         return sum;
                       }, 0).toFixed(2)} DH
                     </span>
                   </div>
                 )}
                 
                 {/* Prix des salons */}
                 {menageFormData.salons.length > 0 && menageFormData.salons.some(s => s && (parseFloat(s.length) > 0 || parseFloat(s.width) > 0)) && (
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                     <span>{i18n.language === 'ar' ? 'الصالونات:' : i18n.language === 'fr' ? 'Salons:' : 'Salons:'}</span>
                     <span>
                       {menageFormData.salons.reduce((sum, salon) => {
                         if (salon && salon.length && salon.width) {
                           return sum + calculateRoomPrice(salon.length, salon.width);
                         }
                         return sum;
                       }, 0).toFixed(2)} DH
                     </span>
                   </div>
                 )}
                 
                 {/* Prix des salles de bain */}
                 {menageFormData.bathrooms.length > 0 && menageFormData.bathrooms.some(b => b && (parseFloat(b.length) > 0 || parseFloat(b.width) > 0)) && (
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                     <span>{i18n.language === 'ar' ? 'الحمامات:' : i18n.language === 'fr' ? 'Salles de bain:' : 'Bathrooms:'}</span>
                     <span>
                       {menageFormData.bathrooms.reduce((sum, bathroom) => {
                         if (bathroom && bathroom.length && bathroom.width) {
                           return sum + calculateRoomPrice(bathroom.length, bathroom.width);
                         }
                         return sum;
                       }, 0).toFixed(2)} DH
                     </span>
                   </div>
                 )}
                 
                 {/* Prix Cuisine */}
                 {selectedTypes.length > 0 && (
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                     <span>{i18n.language === 'ar' ? 'Cuisine:' : i18n.language === 'fr' ? 'Cuisine:' : 'Cuisine:'}</span>
                     <span>
                       {selectedTypes.reduce((sum, type) => sum + (parseFloat(type.price) || 0), 0).toFixed(2)} DH
                     </span>
                   </div>
                 )}
               </div>
               
               <div style={{ paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '18px', fontWeight: 700 }}>
                 <strong>{t('reservation_menage_cuisine.total', 'Total:')} {calculateTotalPrice().toFixed(2)} DH</strong>
               </div>
             </div>
          </div>
        )}

        {submitError && (
          <div className="reservation-cuisin-error">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="reservation-cuisin-form">
          <div className="form-group">
            <label htmlFor="firstname">
              {t('reservation_menage_cuisine.firstname', 'Nom complet')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formValues.firstname}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_menage_cuisine.firstname_placeholder', 'Votre nom complet')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              {t('reservation_menage_cuisine.phone', 'Téléphone')} <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formValues.phone}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_menage_cuisine.phone_placeholder', 'Votre numéro de téléphone')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              {t('reservation_menage_cuisine.email', 'Email')} <span className="optional">(optionnel)</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formValues.email}
              onChange={handleInputChange}
              placeholder={t('reservation_menage_cuisine.email_placeholder', 'Votre adresse email')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">
              {t('reservation_menage_cuisine.location', 'Adresse')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formValues.location}
              onChange={handleInputChange}
              required
              placeholder={t('reservation_menage_cuisine.location_placeholder', 'Votre adresse complète')}
            />
          </div>

          {/* Dynamic Ménage fields based on type */}
          {menageType && (
            <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
                {i18n.language === 'ar' ? 'تفاصيل Ménage:' : 
                 i18n.language === 'fr' ? 'Détails Ménage:' : 
                 'Ménage Details:'} {getLocalizedText(selectedMenageItems[0])}
              </h3>

              {/* Hotel fields */}
              {menageType === 'hotel' && (
                <>
                  <div className="form-group">
                    <label>
                      {i18n.language === 'ar' ? 'Numéro d\'étage:' : 
                       i18n.language === 'fr' ? 'Numéro d\'étage:' : 
                       'Floor number:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.floor}
                      onChange={(e) => handleMenageFieldChange('floor', parseInt(e.target.value) || 0)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de chambres à nettoyer:' : 
                       i18n.language === 'fr' ? 'Nombre de chambres à nettoyer:' : 
                       'Number of rooms to clean:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.rooms.length}
                      onChange={(e) => handleRoomsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.rooms.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.rooms.map((room, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `غرفة ${index + 1}:` : 
                               i18n.language === 'fr' ? `Chambre ${index + 1}:` : 
                               `Room ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={room.length}
                                  onChange={(e) => handleRoomDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={room.width}
                                  onChange={(e) => handleRoomDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de salles de bain:' : 
                       i18n.language === 'fr' ? 'Nombre de salles de bain:' : 
                       'Number of bathrooms:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.bathrooms.length}
                      onChange={(e) => handleBathroomsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.bathrooms.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.bathrooms.map((bathroom, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `حمام ${index + 1}:` : 
                               i18n.language === 'fr' ? `Salle de bain ${index + 1}:` : 
                               `Bathroom ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={bathroom.length}
                                  onChange={(e) => handleBathroomDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={bathroom.width}
                                  onChange={(e) => handleBathroomDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasSheets}
                        onChange={(e) => handleMenageFieldChange('hasSheets', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'Changement de draps ?' : 
                       i18n.language === 'fr' ? 'Changement de draps ?' : 
                       'Change sheets?'}
                    </label>
                  </div>

                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasTowels}
                        onChange={(e) => handleMenageFieldChange('hasTowels', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'Lavage de serviettes ?' : 
                       i18n.language === 'fr' ? 'Lavage de serviettes ?' : 
                       'Wash towels?'}
                    </label>
                  </div>

                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasWindows}
                        onChange={(e) => handleMenageFieldChange('hasWindows', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'Nettoyage des fenêtres ?' : 
                       i18n.language === 'fr' ? 'Nettoyage des fenêtres ?' : 
                       'Clean windows?'}
                    </label>
                  </div>
                </>
              )}

              {/* Appartement fields */}
              {menageType === 'appartement' && (
                <>
                  <div className="form-group">
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de chambres:' : 
                       i18n.language === 'fr' ? 'Nombre de chambres:' : 
                       'Number of rooms:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.rooms.length}
                      onChange={(e) => handleRoomsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.rooms.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.rooms.map((room, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `غرفة ${index + 1}:` : 
                               i18n.language === 'fr' ? `Chambre ${index + 1}:` : 
                               `Room ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={room.length}
                                  onChange={(e) => handleRoomDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={room.width}
                                  onChange={(e) => handleRoomDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de salons:' : 
                       i18n.language === 'fr' ? 'Nombre de salons:' : 
                       'Number of salons:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.salons.length}
                      onChange={(e) => handleSalonsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.salons.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.salons.map((salon, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `صالون ${index + 1}:` : 
                               i18n.language === 'fr' ? `Salon ${index + 1}:` : 
                               `Salon ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={salon.length}
                                  onChange={(e) => handleSalonDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={salon.width}
                                  onChange={(e) => handleSalonDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de salles de bain:' : 
                       i18n.language === 'fr' ? 'Nombre de salles de bain:' : 
                       'Number of bathrooms:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.bathrooms.length}
                      onChange={(e) => handleBathroomsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.bathrooms.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.bathrooms.map((bathroom, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `حمام ${index + 1}:` : 
                               i18n.language === 'fr' ? `Salle de bain ${index + 1}:` : 
                               `Bathroom ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={bathroom.length}
                                  onChange={(e) => handleBathroomDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={bathroom.width}
                                  onChange={(e) => handleBathroomDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasKitchen}
                        onChange={(e) => handleMenageFieldChange('hasKitchen', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'Avez-vous une cuisine ?' : 
                       i18n.language === 'fr' ? 'Avez-vous une cuisine ?' : 
                       'Do you have a kitchen?'}
                    </label>
                  </div>

                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasLaundry}
                        onChange={(e) => handleMenageFieldChange('hasLaundry', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'Lavage de linge ?' : 
                       i18n.language === 'fr' ? 'Lavage de linge ?' : 
                       'Laundry?'}
                    </label>
                  </div>
                </>
              )}

              {/* Villa fields */}
              {menageType === 'villa' && (
                <>
                  <div className="form-group">
                    <label>
                      {i18n.language === 'ar' ? 'عدد الطوابق:' : 
                       i18n.language === 'fr' ? 'Nombre d\'étages:' : 
                       'Number of floors:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.floors}
                      onChange={(e) => handleMenageFieldChange('floors', parseInt(e.target.value) || 0)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de chambres:' : 
                       i18n.language === 'fr' ? 'Nombre de chambres:' : 
                       'Number of rooms:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.rooms.length}
                      onChange={(e) => handleRoomsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.rooms.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.rooms.map((room, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `غرفة ${index + 1}:` : 
                               i18n.language === 'fr' ? `Chambre ${index + 1}:` : 
                               `Room ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={room.length}
                                  onChange={(e) => handleRoomDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={room.width}
                                  onChange={(e) => handleRoomDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de salles de bain:' : 
                       i18n.language === 'fr' ? 'Nombre de salles de bain:' : 
                       'Number of bathrooms:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.bathrooms.length}
                      onChange={(e) => handleBathroomsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.bathrooms.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.bathrooms.map((bathroom, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `حمام ${index + 1}:` : 
                               i18n.language === 'fr' ? `Salle de bain ${index + 1}:` : 
                               `Bathroom ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={bathroom.length}
                                  onChange={(e) => handleBathroomDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={bathroom.width}
                                  onChange={(e) => handleBathroomDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de salons:' : 
                       i18n.language === 'fr' ? 'Nombre de salons:' : 
                       'Number of salons:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.salons.length}
                      onChange={(e) => handleSalonsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.salons.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.salons.map((salon, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `صالون ${index + 1}:` : 
                               i18n.language === 'fr' ? `Salon ${index + 1}:` : 
                               `Salon ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={salon.length}
                                  onChange={(e) => handleSalonDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={salon.width}
                                  onChange={(e) => handleSalonDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasGarden}
                        onChange={(e) => handleMenageFieldChange('hasGarden', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'هل توجد حديقة؟' : 
                       i18n.language === 'fr' ? 'Avez-vous un jardin ?' : 
                       'Do you have a garden?'}
                    </label>
                    {menageFormData.hasGarden && (
                      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                          {i18n.language === 'ar' ? 'الحديقة:' : 
                           i18n.language === 'fr' ? 'Jardin:' : 
                           'Garden:'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '14px' }}>
                              {i18n.language === 'ar' ? 'الطول (cm):' : 
                               i18n.language === 'fr' ? 'Longueur (cm):' : 
                               'Length (cm):'}
                            </label>
                            <input
                              type="text"
                              value={menageFormData.garden.length}
                              onChange={(e) => handleGardenDimensionChange('length', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '14px' }}>
                              {i18n.language === 'ar' ? 'العرض (cm):' : 
                               i18n.language === 'fr' ? 'Largeur (cm):' : 
                               'Width (cm):'}
                            </label>
                            <input
                              type="text"
                              value={menageFormData.garden.width}
                              onChange={(e) => handleGardenDimensionChange('width', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasPool}
                        onChange={(e) => handleMenageFieldChange('hasPool', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'هل تريد تنظيف المسبح؟' : 
                       i18n.language === 'fr' ? 'Voulez-vous nettoyer la piscine ?' : 
                       'Do you want to clean the pool?'}
                    </label>
                    {menageFormData.hasPool && (
                      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                          {i18n.language === 'ar' ? 'المسبح:' : 
                           i18n.language === 'fr' ? 'Piscine:' : 
                           'Pool:'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '14px' }}>
                              {i18n.language === 'ar' ? 'الطول (cm):' : 
                               i18n.language === 'fr' ? 'Longueur (cm):' : 
                               'Length (cm):'}
                            </label>
                            <input
                              type="text"
                              value={menageFormData.pool.length}
                              onChange={(e) => handlePoolDimensionChange('length', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '14px' }}>
                              {i18n.language === 'ar' ? 'العرض (cm):' : 
                               i18n.language === 'fr' ? 'Largeur (cm):' : 
                               'Width (cm):'}
                            </label>
                            <input
                              type="text"
                              value={menageFormData.pool.width}
                              onChange={(e) => handlePoolDimensionChange('width', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Maison fields */}
              {menageType === 'maison' && (
                <>
                  <div className="form-group">
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de chambres:' : 
                       i18n.language === 'fr' ? 'Nombre de chambres:' : 
                       'Number of rooms:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.rooms.length}
                      onChange={(e) => handleRoomsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.rooms.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.rooms.map((room, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `غرفة ${index + 1}:` : 
                               i18n.language === 'fr' ? `Chambre ${index + 1}:` : 
                               `Room ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={room.length}
                                  onChange={(e) => handleRoomDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={room.width}
                                  onChange={(e) => handleRoomDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de salles de bain:' : 
                       i18n.language === 'fr' ? 'Nombre de salles de bain:' : 
                       'Number of bathrooms:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.bathrooms.length}
                      onChange={(e) => handleBathroomsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.bathrooms.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.bathrooms.map((bathroom, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `حمام ${index + 1}:` : 
                               i18n.language === 'fr' ? `Salle de bain ${index + 1}:` : 
                               `Bathroom ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={bathroom.length}
                                  onChange={(e) => handleBathroomDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={bathroom.width}
                                  onChange={(e) => handleBathroomDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de salons:' : 
                       i18n.language === 'fr' ? 'Nombre de salons:' : 
                       'Number of salons:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.salons.length}
                      onChange={(e) => handleSalonsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.salons.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.salons.map((salon, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `صالون ${index + 1}:` : 
                               i18n.language === 'fr' ? `Salon ${index + 1}:` : 
                               `Salon ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={salon.length}
                                  onChange={(e) => handleSalonDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={salon.width}
                                  onChange={(e) => handleSalonDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasGarden}
                        onChange={(e) => handleMenageFieldChange('hasGarden', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'هل توجد حديقة؟' : 
                       i18n.language === 'fr' ? 'Avez-vous un jardin ?' : 
                       'Do you have a garden?'}
                    </label>
                    {menageFormData.hasGarden && (
                      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                          {i18n.language === 'ar' ? 'الحديقة:' : 
                           i18n.language === 'fr' ? 'Jardin:' : 
                           'Garden:'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '14px' }}>
                              {i18n.language === 'ar' ? 'الطول (cm):' : 
                               i18n.language === 'fr' ? 'Longueur (cm):' : 
                               'Length (cm):'}
                            </label>
                            <input
                              type="text"
                              value={menageFormData.garden.length}
                              onChange={(e) => handleGardenDimensionChange('length', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '14px' }}>
                              {i18n.language === 'ar' ? 'العرض (cm):' : 
                               i18n.language === 'fr' ? 'Largeur (cm):' : 
                               'Width (cm):'}
                            </label>
                            <input
                              type="text"
                              value={menageFormData.garden.width}
                              onChange={(e) => handleGardenDimensionChange('width', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasPool}
                        onChange={(e) => handleMenageFieldChange('hasPool', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'هل تريد تنظيف المسبح؟' : 
                       i18n.language === 'fr' ? 'Voulez-vous nettoyer la piscine ?' : 
                       'Do you want to clean the pool?'}
                    </label>
                    {menageFormData.hasPool && (
                      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                          {i18n.language === 'ar' ? 'المسبح:' : 
                           i18n.language === 'fr' ? 'Piscine:' : 
                           'Pool:'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '14px' }}>
                              {i18n.language === 'ar' ? 'الطول (cm):' : 
                               i18n.language === 'fr' ? 'Longueur (cm):' : 
                               'Length (cm):'}
                            </label>
                            <input
                              type="text"
                              value={menageFormData.pool.length}
                              onChange={(e) => handlePoolDimensionChange('length', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '14px' }}>
                              {i18n.language === 'ar' ? 'العرض (cm):' : 
                               i18n.language === 'fr' ? 'Largeur (cm):' : 
                               'Width (cm):'}
                            </label>
                            <input
                              type="text"
                              value={menageFormData.pool.width}
                              onChange={(e) => handlePoolDimensionChange('width', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Resort Hotel fields */}
              {menageType === 'resort_hotel' && (
                <>
                  <div className="form-group">
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de chambres:' : 
                       i18n.language === 'fr' ? 'Nombre de chambres:' : 
                       'Number of rooms:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.rooms.length}
                      onChange={(e) => handleRoomsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.rooms.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.rooms.map((room, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `غرفة ${index + 1}:` : 
                               i18n.language === 'fr' ? `Chambre ${index + 1}:` : 
                               `Room ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={room.length}
                                  onChange={(e) => handleRoomDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={room.width}
                                  onChange={(e) => handleRoomDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de salles de bain:' : 
                       i18n.language === 'fr' ? 'Nombre de salles de bain:' : 
                       'Number of bathrooms:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.bathrooms.length}
                      onChange={(e) => handleBathroomsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.bathrooms.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.bathrooms.map((bathroom, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `حمام ${index + 1}:` : 
                               i18n.language === 'fr' ? `Salle de bain ${index + 1}:` : 
                               `Bathroom ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={bathroom.length}
                                  onChange={(e) => handleBathroomDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={bathroom.width}
                                  onChange={(e) => handleBathroomDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasPool}
                        onChange={(e) => handleMenageFieldChange('hasPool', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'تنظيف المسابح؟' : 
                       i18n.language === 'fr' ? 'Nettoyage de la piscine ?' : 
                       'Pool cleaning?'}
                    </label>
                    {menageFormData.hasPool && (
                      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                          {i18n.language === 'ar' ? 'المسبح:' : 
                           i18n.language === 'fr' ? 'Piscine:' : 
                           'Pool:'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '14px' }}>
                              {i18n.language === 'ar' ? 'الطول (cm):' : 
                               i18n.language === 'fr' ? 'Longueur (cm):' : 
                               'Length (cm):'}
                            </label>
                            <input
                              type="text"
                              value={menageFormData.pool.length}
                              onChange={(e) => handlePoolDimensionChange('length', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '14px' }}>
                              {i18n.language === 'ar' ? 'العرض (cm):' : 
                               i18n.language === 'fr' ? 'Largeur (cm):' : 
                               'Width (cm):'}
                            </label>
                            <input
                              type="text"
                              value={menageFormData.pool.width}
                              onChange={(e) => handlePoolDimensionChange('width', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasOutdoor}
                        onChange={(e) => handleMenageFieldChange('hasOutdoor', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'تنظيف الأماكن الخارجية؟' : 
                       i18n.language === 'fr' ? 'Nettoyage des espaces extérieurs ?' : 
                       'Outdoor cleaning?'}
                    </label>
                  </div>
                </>
              )}

              {/* Maison d'hôte fields */}
              {menageType === 'maison_dhote' && (
                <>
                  <div className="form-group">
                    <label>
                      {i18n.language === 'ar' ? 'Nombre de chambres:' : 
                       i18n.language === 'fr' ? 'Nombre de chambres:' : 
                       'Number of rooms:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.rooms.length}
                      onChange={(e) => handleRoomsCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.rooms.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.rooms.map((room, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `غرفة ${index + 1}:` : 
                               i18n.language === 'fr' ? `Chambre ${index + 1}:` : 
                               `Room ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={room.length}
                                  onChange={(e) => handleRoomDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={room.width}
                                  onChange={(e) => handleRoomDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>
                      {i18n.language === 'ar' ? 'Nombre d\'أجنحة:' : 
                       i18n.language === 'fr' ? 'Nombre de suites:' : 
                       'Number of suites:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menageFormData.suites.length}
                      onChange={(e) => handleSuitesCountChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      placeholder="0"
                    />
                    {menageFormData.suites.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {menageFormData.suites.map((suite, index) => (
                          <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                              {i18n.language === 'ar' ? `جناح ${index + 1}:` : 
                               i18n.language === 'fr' ? `Suite ${index + 1}:` : 
                               `Suite ${index + 1}:`}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'الطول (cm):' : 
                                   i18n.language === 'fr' ? 'Longueur (cm):' : 
                                   'Length (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={suite.length}
                                  onChange={(e) => handleSuiteDimensionChange(index, 'length', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '14px' }}>
                                  {i18n.language === 'ar' ? 'العرض (cm):' : 
                                   i18n.language === 'fr' ? 'Largeur (cm):' : 
                                   'Width (cm):'}
                                </label>
                                <input
                                  type="text"
                                  value={suite.width}
                                  onChange={(e) => handleSuiteDimensionChange(index, 'width', e.target.value)}
                                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasBreakfast}
                        onChange={(e) => handleMenageFieldChange('hasBreakfast', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'هل يشمل تجهيز الفطور؟' : 
                       i18n.language === 'fr' ? 'Préparation du petit-déjeuner ?' : 
                       'Breakfast preparation?'}
                    </label>
                    {menageFormData.hasBreakfast && (
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#10b981', fontWeight: 600 }}>
                        50.00 DH
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasSheets}
                        onChange={(e) => handleMenageFieldChange('hasSheets', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'هل يشمل تغيير الشراشف؟' : 
                       i18n.language === 'fr' ? 'Changement de draps ?' : 
                       'Change sheets?'}
                    </label>
                    {menageFormData.hasSheets && (
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#10b981', fontWeight: 600 }}>
                        30.00 DH
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={menageFormData.hasPool}
                        onChange={(e) => handleMenageFieldChange('hasPool', e.target.checked)}
                      />
                      {i18n.language === 'ar' ? 'تنظيف المسبح؟' : 
                       i18n.language === 'fr' ? 'Nettoyage de la piscine ?' : 
                       'Pool cleaning?'}
                    </label>
                    {menageFormData.hasPool && (
                      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                          {i18n.language === 'ar' ? 'المسبح:' : 
                           i18n.language === 'fr' ? 'Piscine:' : 
                           'Pool:'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '14px' }}>
                              {i18n.language === 'ar' ? 'الطول (cm):' : 
                               i18n.language === 'fr' ? 'Longueur (cm):' : 
                               'Length (cm):'}
                            </label>
                            <input
                              type="text"
                              value={menageFormData.pool.length}
                              onChange={(e) => handlePoolDimensionChange('length', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '14px' }}>
                              {i18n.language === 'ar' ? 'العرض (cm):' : 
                               i18n.language === 'fr' ? 'Largeur (cm):' : 
                               'Width (cm):'}
                            </label>
                            <input
                              type="text"
                              value={menageFormData.pool.width}
                              onChange={(e) => handlePoolDimensionChange('width', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="preferred_date">
                {t('reservation_menage_cuisine.preferred_date', 'Date préférée')}
              </label>
              <input
                type="date"
                id="preferred_date"
                name="preferred_date"
                value={formValues.preferred_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="preferred_time">
                {t('reservation_menage_cuisine.preferred_time', 'Heure préférée')}
              </label>
              <input
                type="time"
                id="preferred_time"
                name="preferred_time"
                value={formValues.preferred_time}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="message">
              {t('reservation_menage_cuisine.message', 'Message')} <span className="optional">(optionnel)</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formValues.message}
              onChange={handleInputChange}
              rows="4"
              placeholder={t('reservation_menage_cuisine.message_placeholder', 'Informations supplémentaires ou demandes spéciales...')}
            />
          </div>

          <button
            type="submit"
            className="reservation-cuisin-submit-button"
            disabled={isSubmitting || selectedMenageItems.length !== 1 || selectedTypes.length < 1}
          >
            {isSubmitting 
              ? t('reservation_menage_cuisine.submitting', 'Envoi en cours...') 
              : t('reservation_menage_cuisine.submit', 'Envoyer la réservation')}
          </button>
        </form>
      </div>
    </main>
  );
}


import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getServices, getCategoryHouseById, getTypes } from '../../api-supabase';
import './MénageCuisine.css';
import '../menage complite/menageComplite.css';
import '../Services.css';

export default function MénageCuisine() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  // Menage state
  const [menageItems, setMenageItems] = useState([]);
  const [menageLoading, setMenageLoading] = useState(true);
  const [menageError, setMenageError] = useState('');
  const [selectedMenageItems, setSelectedMenageItems] = useState([]);
  
  // Cuisine state
  const [service, setService] = useState(null);
  const [category, setCategory] = useState(null);
  const [types, setTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [cuisineLoading, setCuisineLoading] = useState(true);
  const [cuisineError, setCuisineError] = useState('');

  // Load Menage data (same logic as menageComplite.jsx)
  useEffect(() => {
    const loadMenageComplite = async () => {
      try {
        setMenageLoading(true);
        setMenageError('');

        // Try to find the menage with name "Ménage" (or similar)
        let menageId = null;
        const { data: menageData, error: menageError } = await supabase
          .from('menage')
          .select('id, name_fr, name_ar, name_en')
          .or(`name_fr.ilike.%Ménage%,name_fr.ilike.%ménage%,name_ar.ilike.%تدبير%,name_ar.ilike.%منزلي%,name_en.ilike.%Housekeeping%,name_en.ilike.%Cleaning%`);

        if (!menageError && menageData && menageData.length > 0) {
          // Find the best match - look for "Ménage" specifically, exclude other services
          const matchedMenage = menageData.find(m => {
            const nameFr = (m.name_fr || '').toLowerCase();
            const nameAr = (m.name_ar || '').toLowerCase();
            const nameEn = (m.name_en || '').toLowerCase();
            
            // Exclude specific services
            const hasTapis = nameFr.includes('tapis') || nameAr.includes('سجاد') || nameEn.includes('carpet');
            const hasCanapes = nameFr.includes('canapé') || nameFr.includes('canapes') || nameAr.includes('كنب') || nameEn.includes('sofa');
            const hasVoiture = nameFr.includes('voiture') || nameAr.includes('سيارة') || nameEn.includes('car');
            const hasLavageRepassage = (nameFr.includes('lavage') && nameFr.includes('repassage')) || nameAr.includes('كي') || nameEn.includes('ironing');
            const hasBureaux = nameFr.includes('bureaux') || nameFr.includes('bureau') || nameAr.includes('مكاتب') || nameEn.includes('office');
            const hasAirbnb = nameFr.includes('airbnb') || nameAr.includes('airbnb') || nameEn.includes('airbnb');
            const hasPiscine = nameFr.includes('piscine') || nameAr.includes('مسبح') || nameEn.includes('pool');
            const hasChaussures = nameFr.includes('chaussure') || nameAr.includes('حذاء') || nameEn.includes('shoe');
            
            if (hasTapis || hasCanapes || hasVoiture || hasLavageRepassage || hasBureaux || hasAirbnb || hasPiscine || hasChaussures) {
              return false; // Skip specific services
            }
            
            // Must be general "Ménage" or "Housekeeping"
            return (
              (nameFr.includes('ménage') && !nameFr.includes('tapis') && !nameFr.includes('voiture') && !nameFr.includes('lavage') && !nameFr.includes('bureaux')) ||
              nameAr.includes('تدبير') ||
              nameAr.includes('منزلي') ||
              nameEn.includes('housekeeping') ||
              (nameEn.includes('cleaning') && !nameEn.includes('car'))
            );
          });
          
          if (matchedMenage) {
            menageId = matchedMenage.id;
          } else {
            // Use the first result if no exact match
            menageId = menageData[0].id;
          }
        }

        if (!menageId) {
          console.warn('[MénageCuisine] No menage found for "Ménage", loading all types_menage');
          // If no specific menage found, try to load all types_menage
          const { data: allTypes, error: typesError } = await supabase
            .from('types_menage')
            .select('*, menage:menage_id(*)')
            .order('created_at', { ascending: false });

          if (typesError) {
            throw typesError;
          }

          // Filter by menage name client-side - exclude specific services
          const filtered = (allTypes || []).filter(item => {
            const menage = item.menage;
            if (!menage) return false;
            const nameFr = (menage.name_fr || '').toLowerCase();
            const nameAr = (menage.name_ar || '').toLowerCase();
            const nameEn = (menage.name_en || '').toLowerCase();
            
            // Exclude specific services
            const hasTapis = nameFr.includes('tapis') || nameAr.includes('سجاد') || nameEn.includes('carpet');
            const hasCanapes = nameFr.includes('canapé') || nameFr.includes('canapes') || nameAr.includes('كنب') || nameEn.includes('sofa');
            const hasVoiture = nameFr.includes('voiture') || nameAr.includes('سيارة') || nameEn.includes('car');
            const hasLavageRepassage = (nameFr.includes('lavage') && nameFr.includes('repassage')) || nameAr.includes('كي') || nameEn.includes('ironing');
            const hasBureaux = nameFr.includes('bureaux') || nameFr.includes('bureau') || nameAr.includes('مكاتب') || nameEn.includes('office');
            const hasAirbnb = nameFr.includes('airbnb') || nameAr.includes('airbnb') || nameEn.includes('airbnb');
            const hasPiscine = nameFr.includes('piscine') || nameAr.includes('مسبح') || nameEn.includes('pool');
            const hasChaussures = nameFr.includes('chaussure') || nameAr.includes('حذاء') || nameEn.includes('shoe');
            
            if (hasTapis || hasCanapes || hasVoiture || hasLavageRepassage || hasBureaux || hasAirbnb || hasPiscine || hasChaussures) {
              return false;
            }
            
            // Must be general "Ménage"
            return (
              (nameFr.includes('ménage') && !nameFr.includes('tapis') && !nameFr.includes('voiture') && !nameFr.includes('lavage') && !nameFr.includes('bureaux')) ||
              nameAr.includes('تدبير') ||
              nameAr.includes('منزلي') ||
              nameEn.includes('housekeeping') ||
              (nameEn.includes('cleaning') && !nameEn.includes('car'))
            );
          });

          setMenageItems(filtered);
          setMenageLoading(false);
          return;
        }

        // Load types_menage filtered by menage_id
        const { data, error } = await supabase
          .from('types_menage')
          .select('*, menage:menage_id(*)')
          .eq('menage_id', menageId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[MénageCuisine] Error loading types_menage:', error);
          setMenageError('Erreur lors du chargement des services: ' + error.message);
          return;
        }

        // Filter out items that don't match general Ménage
        const filteredItems = (data || []).filter(item => {
          const nameFr = (item.name_fr || '').toLowerCase();
          const nameAr = (item.name_ar || '').toLowerCase();
          const nameEn = (item.name_en || '').toLowerCase();
          
          // Exclude other services
          const hasTapis = nameFr.includes('tapis') || nameAr.includes('سجاد') || nameEn.includes('carpet');
          const hasCanapes = nameFr.includes('canapé') || nameFr.includes('canapes') || nameAr.includes('كنب') || nameEn.includes('sofa');
          const hasVoiture = nameFr.includes('voiture') || nameAr.includes('سيارة') || nameEn.includes('car');
          const hasLavageRepassage = (nameFr.includes('lavage') && nameFr.includes('repassage')) || nameAr.includes('كي') || nameEn.includes('ironing');
          const hasBureaux = nameFr.includes('bureaux') || nameFr.includes('bureau') || nameAr.includes('مكاتب') || nameEn.includes('office');
          const hasAirbnb = nameFr.includes('airbnb') || nameAr.includes('airbnb') || nameEn.includes('airbnb');
          const hasPiscine = nameFr.includes('piscine') || nameAr.includes('مسبح') || nameEn.includes('pool');
          const hasChaussures = nameFr.includes('chaussure') || nameAr.includes('حذاء') || nameEn.includes('shoe');
          
          return !hasTapis && !hasCanapes && !hasVoiture && !hasLavageRepassage && !hasBureaux && !hasAirbnb && !hasPiscine && !hasChaussures;
        });

        setMenageItems(filteredItems);
      } catch (err) {
        console.error('[MénageCuisine] Exception loading data:', err);
        setMenageError('Erreur de connexion: ' + err.message);
      } finally {
        setMenageLoading(false);
      }
    };

    loadMenageComplite();
  }, []);

  // Load Cuisine data
  useEffect(() => {
    const loadCuisine = async () => {
      try {
        setCuisineLoading(true);
        setCuisineError('');

        // Get service (menage service, usually ID 1)
        const servicesData = await getServices(i18n.language);
        const servicesArray = Array.isArray(servicesData) ? servicesData : servicesData.data || [];
        const foundService = servicesArray.find(s => 
          s.id === 1 || 
          (s.name && (s.name.toLowerCase().includes('menage') || s.name.toLowerCase().includes('cleaning')))
        );

        if (!foundService) {
          setCuisineError('Service non trouvé');
          setCuisineLoading(false);
          return;
        }

        setService(foundService);

        // Get Cuisine category (ID 2)
        const categoryData = await getCategoryHouseById(2, i18n.language);
        const foundCategory = categoryData?.data || categoryData;

        if (!foundCategory) {
          setCuisineError('Catégorie non trouvée');
          setCuisineLoading(false);
          return;
        }

        setCategory(foundCategory);

        // Get types for Cuisine category
        const typesData = await getTypes(i18n.language, null, 2);
        const typesArray = Array.isArray(typesData) ? typesData : (typesData.data || []);
        setTypes(typesArray);
      } catch (err) {
        console.error('[MénageCuisine] Error loading cuisine:', err);
        setCuisineError('Erreur lors du chargement des données');
      } finally {
        setCuisineLoading(false);
      }
    };

    loadCuisine();
  }, [i18n.language]);

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

  // Menage card click handlers (same as menageComplite.jsx)
  const isResortHotel = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    const frHasResortHotel = (typeNameFr.includes('resort') && typeNameFr.includes('hôtel')) || 
                             (typeNameFr.includes('resort') && typeNameFr.includes('hotel'));
    const arHasResortHotel = (typeNameAr.includes('منتجع') && typeNameAr.includes('فندق')) ||
                             (typeNameAr.includes('resort') && typeNameAr.includes('فندق'));
    const enHasResortHotel = typeNameEn.includes('resort') && typeNameEn.includes('hotel');

    return frHasResortHotel || arHasResortHotel || enHasResortHotel;
  };

  const isMaison = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    const isMaisonDhote = 
      (typeNameFr.includes('maison') && typeNameFr.includes('hôte')) ||
      typeNameFr.includes('maison d\'hôte') ||
      (typeNameAr.includes('بيت') && typeNameAr.includes('ضيافة')) ||
      typeNameEn.includes('guest house') ||
      (typeNameEn.includes('house') && typeNameEn.includes('host'));

    if (isMaisonDhote) return false;

    const frIsMaison = typeNameFr.includes('maison') && !typeNameFr.includes('hôte') && !typeNameFr.includes('hotel') && !typeNameFr.includes('hôtel');
    const arIsMaison = typeNameAr.includes('منزل') && !typeNameAr.includes('فندق') && !typeNameAr.includes('ضيافة');
    const enIsMaison = typeNameEn.includes('house') && !typeNameEn.includes('hotel') && !typeNameEn.includes('host') && !typeNameEn.includes('guest');

    return frIsMaison || arIsMaison || enIsMaison;
  };

  const isAppartement = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    const frIsAppartement = typeNameFr.includes('appartement') || typeNameFr.includes('appart');
    const arIsAppartement = typeNameAr.includes('شقة');
    const enIsAppartement = typeNameEn.includes('apartment') || typeNameEn.includes('flat');

    return frIsAppartement || arIsAppartement || enIsAppartement;
  };

  const isVilla = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    const frIsVilla = typeNameFr.includes('villa');
    const arIsVilla = typeNameAr.includes('فيلا');
    const enIsVilla = typeNameEn.includes('villa');

    return frIsVilla || arIsVilla || enIsVilla;
  };

  const isHotel = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    const frIsHotel = (typeNameFr.includes('hôtel') || typeNameFr.includes('hotel')) && !typeNameFr.includes('resort');
    const arIsHotel = typeNameAr.includes('فندق') && !typeNameAr.includes('منتجع');
    const enIsHotel = typeNameEn.includes('hotel') && !typeNameEn.includes('resort');

    return frIsHotel || arIsHotel || enIsHotel;
  };

  const isMaisonDhote = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    const isSimpleMaison = 
      (typeNameFr.includes('maison') && !typeNameFr.includes('hôte') && !typeNameFr.includes('maison d\'hôte')) ||
      (typeNameAr.includes('منزل') && !typeNameAr.includes('ضيافة')) ||
      (typeNameEn.includes('house') && !typeNameEn.includes('host') && !typeNameEn.includes('guest'));

    if (isSimpleMaison) return false;

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
  };

  // Menage item selection - Radio button behavior (un seul type peut être sélectionné)
  const handleMenageItemSelect = (item) => {
    setSelectedMenageItems(prev => {
      const isSelected = prev.some(i => i.id === item.id);
      if (isSelected) {
        // Si l'élément est déjà sélectionné, le désélectionner
        return prev.filter(i => i.id !== item.id);
      } else {
        // Si l'élément n'est pas sélectionné, remplacer la sélection précédente par le nouveau
        // Un seul type Ménage peut être sélectionné à la fois (comportement radio button)
        return [item];
      }
    });
  };

  const isMenageItemSelected = (item) => {
    return selectedMenageItems.some(i => i.id === item.id);
  };

  // Cuisine type selection
  const handleTypeSelect = (type) => {
    setSelectedTypes(prev => {
      const isSelected = prev.some(t => t.id === type.id);
      if (isSelected) {
        return prev.filter(t => t.id !== type.id);
      } else {
        return [...prev, type];
      }
    });
  };

  const isTypeSelected = (type) => {
    return selectedTypes.some(t => t.id === type.id);
  };

  const handleReserve = () => {
    // Vérifier qu'exactement 1 type Ménage et au moins 1 type Cuisine sont sélectionnés
    if (selectedMenageItems.length !== 1 || selectedTypes.length < 1) {
      return;
    }

    navigate('/reservation-menage-cuisine', {
      state: {
        selectedTypes: selectedTypes,
        selectedMenageItems: selectedMenageItems,
        category: category,
        service: service
      }
    });
  };

  // Vérifier si le bouton Réserver doit être affiché
  const shouldShowReserveButton = () => {
    // Le bouton apparaît seulement si:
    // - Exactement 1 type Ménage est sélectionné
    // - Au moins 1 type Cuisine est sélectionné
    return selectedMenageItems.length === 1 && selectedTypes.length >= 1;
  };

  return (
    <main className="menage-cuisine-page">
      <button 
        className="menage-cuisine-back-button"
        onClick={() => navigate('/menage-et-cuisine')}
        title={t('menage_page.back', 'Retour')}
      >
        ← {t('menage_page.back', 'Retour')}
      </button>
      
      <h1 className="menage-cuisine-title">
        Ménage + Cuisine
      </h1>

      {/* Message d'instruction sous le titre */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
        padding: '16px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        maxWidth: '800px',
        margin: '0 auto 32px auto'
      }}>
        <p style={{
          margin: 0,
          fontSize: '16px',
          color: '#1e293b',
          fontWeight: '500'
        }}>
          {i18n.language === 'ar' ? 'يرجى اختيار نوع واحد فقط من Ménage ونوع واحد على الأقل من Cuisine للتمكن من الحجز' : 
           i18n.language === 'fr' ? 'Veuillez sélectionner un seul type de Ménage et au moins un type de Cuisine pour pouvoir réserver.' : 
           'Please select one type of Ménage only and at least one type of Cuisine to be able to reserve.'}
        </p>
      </div>

      {/* Affichage combiné des éléments Ménage et Cuisine sélectionnés - Sous le message d'instruction */}
      {(selectedMenageItems.length > 0 || selectedTypes.length > 0) && (
        <div style={{
          marginBottom: '32px',
          padding: '16px',
          backgroundColor: (selectedMenageItems.length === 1 && selectedTypes.length >= 1) ? '#f0fdf4' : 
                          (selectedMenageItems.length > 1) ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${(selectedMenageItems.length === 1 && selectedTypes.length >= 1) ? '#86efac' : 
                              (selectedMenageItems.length > 1) ? '#fca5a5' : '#fde047'}`,
          borderRadius: '8px',
          maxWidth: '800px',
          margin: '0 auto 32px auto'
        }}>
          {/* Choix Ménage */}
          {selectedMenageItems.length > 0 && (
            <div style={{ marginBottom: selectedTypes.length > 0 ? '16px' : '0' }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '16px', 
                fontWeight: 600,
                color: selectedMenageItems.length === 1 ? '#166534' : '#991b1b'
              }}>
                {i18n.language === 'ar' ? 'الخيارات المختارة (Ménage):' : 
                 i18n.language === 'fr' ? 'Choix Ménage:' : 
                 'Selected Ménage:'}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedMenageItems.map(item => {
                  const { name } = getLocalizedText(item);
                  return (
                    <span
                      key={item.id}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: selectedMenageItems.length === 1 ? '#10b981' : '#ef4444',
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Choix Cuisine */}
          {selectedTypes.length > 0 && (
            <div>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '16px', 
                fontWeight: 600,
                color: '#166534'
              }}>
                {i18n.language === 'ar' ? 'الخيارات المختارة (Cuisine):' : 
                 i18n.language === 'fr' ? 'Choix Cuisine:' : 
                 'Selected Cuisine:'}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedTypes.map(type => (
                  <span
                    key={type.id}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {type.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Messages d'état */}
          {selectedMenageItems.length > 1 && (
            <p style={{
              margin: '16px 0 0 0',
              fontSize: '14px',
              color: '#991b1b',
              fontWeight: '500'
            }}>
              {i18n.language === 'ar' ? '⚠️ يجب اختيار نوع واحد فقط من Ménage' : 
               i18n.language === 'fr' ? '⚠️ Veuillez sélectionner un seul type de Ménage' : 
               '⚠️ Please select only one Ménage type'}
            </p>
          )}
          {selectedMenageItems.length === 1 && selectedTypes.length >= 1 && (
            <p style={{
              margin: '16px 0 0 0',
              fontSize: '14px',
              color: '#166534',
              fontWeight: '500'
            }}>
              {i18n.language === 'ar' ? '✅ يمكنك الآن الحجز (Ménage + Cuisine sélectionnés)' : 
               i18n.language === 'fr' ? '✅ Vous pouvez maintenant réserver (Ménage + Cuisine sélectionnés)' : 
               '✅ You can now reserve (Ménage + Cuisine selected)'}
            </p>
          )}
          {selectedMenageItems.length === 1 && selectedTypes.length === 0 && (
            <p style={{
              margin: '16px 0 0 0',
              fontSize: '14px',
              color: '#f59e0b',
              fontWeight: '500'
            }}>
              {i18n.language === 'ar' ? '⚠️ يرجى اختيار نوع واحد على الأقل من Cuisine للتمكن من الحجز' : 
               i18n.language === 'fr' ? '⚠️ Veuillez sélectionner au moins un type de Cuisine pour pouvoir réserver' : 
               '⚠️ Please select at least one type of Cuisine to be able to reserve'}
            </p>
          )}
        </div>
      )}

      <div className="menage-cuisine-container">
        {/* Div 1: Menage (Left) */}
        <div className="menage-section">
          <h2 className="section-title">{t('menage_page.title', 'Ménage')}</h2>
          
          {menageLoading ? (
            <div className="loading-state">Chargement des services ménage...</div>
          ) : menageError ? (
            <div className="error-state">{menageError}</div>
          ) : !menageItems.length ? (
            <div className="empty-state">Aucun service Ménage disponible pour le moment.</div>
          ) : (
            <div className="menage-complite-grid">
              {menageItems.map((item) => {
                const { name, description } = getLocalizedText(item);
                const isSelected = isMenageItemSelected(item);
                return (
                  <article 
                    key={item.id} 
                    className={`menage-complite-card ${isSelected ? 'menage-complite-card-selected' : ''}`}
                    onClick={() => handleMenageItemSelect(item)}
                    style={{ position: 'relative', cursor: 'pointer' }}
                  >
                    {item.image && (
                      <div className="menage-complite-card-image">
                        <img
                          src={item.image}
                          alt={name || 'Ménage'}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        {/* Selection checkbox overlay */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenageItemSelect(item);
                          }}
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '32px',
                            height: '32px',
                            backgroundColor: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.95)',
                            border: isSelected ? '2px solid #10b981' : '2px solid #3b82f6',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            transition: 'all 0.3s ease',
                            boxShadow: isSelected 
                              ? '0 2px 8px rgba(16, 185, 129, 0.4)' 
                              : '0 2px 6px rgba(0, 0, 0, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                              e.currentTarget.style.borderColor = '#2563eb';
                              e.currentTarget.style.transform = 'scale(1.1)';
                            } else {
                              e.currentTarget.style.backgroundColor = '#059669';
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                              e.currentTarget.style.borderColor = '#3b82f6';
                              e.currentTarget.style.transform = 'scale(1)';
                            } else {
                              e.currentTarget.style.backgroundColor = '#10b981';
                              e.currentTarget.style.transform = 'scale(1)';
                            }
                          }}
                        >
                          {isSelected && (
                            <span style={{
                              color: '#fff',
                              fontSize: '20px',
                              fontWeight: 'bold',
                              lineHeight: '1'
                            }}>✓</span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="menage-complite-card-body">
                      <h2 className="menage-complite-card-title">{name || `Service #${item.id}`}</h2>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Div 2: Cuisine (Right) */}
        <div className="cuisine-section">
          <h2 className="section-title">{category?.name || 'Cuisine'}</h2>
          
          {cuisineLoading ? (
            <div className="loading-state">{t('services_page.loading')}</div>
          ) : cuisineError || !category ? (
            <div className="error-state">{cuisineError || 'Données non disponibles'}</div>
          ) : types.length === 0 ? (
            <div className="empty-state">Aucun type disponible pour le moment.</div>
          ) : (
            <>
              <div className="menage-complite-grid">
                {types.map((type) => {
                  const selected = isTypeSelected(type);
                  
                  // Get image URL (same logic as Cuisin.jsx)
                  let imageUrl = type.image_url || type.image || null;
                  if (imageUrl) {
                    if (imageUrl.startsWith('/serveces')) {
                      imageUrl = (process.env.PUBLIC_URL || '') + imageUrl;
                    }
                    if (imageUrl.startsWith('/') && !imageUrl.startsWith('/serveces')) {
                      const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
                      imageUrl = apiBase + imageUrl;
                    }
                  }
                  
                  return (
                    <article 
                      key={type.id}
                      className={`menage-complite-card ${selected ? 'menage-complite-card-selected' : ''}`}
                      onClick={() => handleTypeSelect(type)}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {imageUrl && (
                        <div className="menage-complite-card-image">
                          <img
                            src={imageUrl}
                            alt={type.name || 'Cuisine'}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          {/* Selection checkbox overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              width: '32px',
                              height: '32px',
                              backgroundColor: selected ? '#10b981' : 'rgba(255, 255, 255, 0.95)',
                              border: selected ? '2px solid #10b981' : '2px solid #3b82f6',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 10,
                              transition: 'all 0.3s ease',
                              boxShadow: selected 
                                ? '0 2px 8px rgba(16, 185, 129, 0.4)' 
                                : '0 2px 6px rgba(0, 0, 0, 0.2)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTypeSelect(type);
                            }}
                            onMouseEnter={(e) => {
                              if (!selected) {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                                e.currentTarget.style.borderColor = '#2563eb';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              } else {
                                e.currentTarget.style.backgroundColor = '#059669';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!selected) {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                                e.currentTarget.style.borderColor = '#3b82f6';
                                e.currentTarget.style.transform = 'scale(1)';
                              } else {
                                e.currentTarget.style.backgroundColor = '#10b981';
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                          >
                            {selected && (
                              <span style={{
                                color: '#fff',
                                fontSize: '20px',
                                fontWeight: 'bold',
                                lineHeight: '1'
                              }}>✓</span>
                            )}
                          </div>
                          {/* Price overlay */}
                          {type.price !== null && type.price !== undefined && !isNaN(parseFloat(type.price)) && (
                            <div style={{
                              position: 'absolute',
                              bottom: '12px',
                              left: '12px',
                              right: '12px',
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#10b981',
                              textAlign: 'center',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                              zIndex: 5
                            }}>
                              {parseFloat(type.price).toFixed(2)} DH 
                            </div>
                          )}
                        </div>
                      )}
                      <div className="menage-complite-card-body">
                        <h2 className="menage-complite-card-title">{type.name || `Type #${type.id}`}</h2>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reserve button - Centré en bas de la page, séparé des divs */}
      {shouldShowReserveButton() && (
        <div style={{
          marginTop: '40px',
          display: 'flex',
          justifyContent: 'center',
          padding: '20px 0'
        }}>
          <button
            onClick={handleReserve}
            style={{
              padding: '16px 48px',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#059669';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#10b981';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
            }}
          >
            <span>📅</span>
            {i18n.language === 'ar' ? 'احجز الآن' : 
             i18n.language === 'fr' ? 'Réserver maintenant' : 
             'Reserve now'}
          </button>
        </div>
      )}
    </main>
  );
}


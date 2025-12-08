import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './menageComplite.css';

export default function MenageComplite() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMenageComplite = async () => {
      try {
        setLoading(true);
        setError('');

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
          console.warn('[MenageComplite] No menage found for "Ménage", loading all types_menage');
          // If no specific menage found, try to load all types_menage
          // and filter client-side (less efficient but works)
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

          setItems(filtered);
          setLoading(false);
          return;
        }

        // Load types_menage filtered by menage_id
        const { data, error } = await supabase
          .from('types_menage')
          .select('*, menage:menage_id(*)')
          .eq('menage_id', menageId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[MenageComplite] Error loading types_menage:', error);
          setError('Erreur lors du chargement des services: ' + error.message);
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

        setItems(filteredItems);
      } catch (err) {
        console.error('[MenageComplite] Exception loading data:', err);
        setError('Erreur de connexion: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMenageComplite();
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

  // Check if item is "Resort Hôtel"
  const isResortHotel = (item) => {
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
  };

  // Check if item is "Maison"
  const isMaison = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    // Exclude "Maison d'hôte" explicitly
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

  // Check if item is "Appartement"
  const isAppartement = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    const frIsAppartement = typeNameFr.includes('appartement') || typeNameFr.includes('appart');
    const arIsAppartement = typeNameAr.includes('شقة');
    const enIsAppartement = typeNameEn.includes('apartment') || typeNameEn.includes('flat');

    return frIsAppartement || arIsAppartement || enIsAppartement;
  };

  // Check if item is "Villa"
  const isVilla = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    const frIsVilla = typeNameFr.includes('villa');
    const arIsVilla = typeNameAr.includes('فيلا');
    const enIsVilla = typeNameEn.includes('villa');

    return frIsVilla || arIsVilla || enIsVilla;
  };

  // Check if item is "Hôtel"
  const isHotel = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    const frIsHotel = (typeNameFr.includes('hôtel') || typeNameFr.includes('hotel')) && !typeNameFr.includes('resort');
    const arIsHotel = typeNameAr.includes('فندق') && !typeNameAr.includes('منتجع');
    const enIsHotel = typeNameEn.includes('hotel') && !typeNameEn.includes('resort');

    return frIsHotel || arIsHotel || enIsHotel;
  };

  // Check if item is "Maison d'hôte"
  const isMaisonDhote = (item) => {
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
  };

  const handleCardClick = (item) => {
    // Check "Maison d'hôte" BEFORE "Maison" to avoid conflicts
    if (isResortHotel(item)) {
      navigate('/resort-hotel');
    } else if (isMaisonDhote(item)) {
      navigate('/maison-dhote');
    } else if (isMaison(item)) {
      navigate('/maison');
    } else if (isAppartement(item)) {
      navigate('/appartement');
    } else if (isVilla(item)) {
      navigate('/villa');
    } else if (isHotel(item)) {
      navigate('/hotel');
    }
    // If no match, card is not clickable
  };

  if (loading) {
    return (
      <main className="menage-complite-page">
        <div className="menage-complite-header">
          <button 
            className="menage-complite-back-btn"
            onClick={() => navigate('/menage')}
            title={t('menage_complite_page.back', 'Retour au Ménage')}
          >
            ← {t('menage_complite_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="menage-complite-loading">Chargement des services Ménage...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="menage-complite-page">
        <div className="menage-complite-header">
          <button 
            className="menage-complite-back-btn"
            onClick={() => navigate('/menage')}
            title={t('menage_complite_page.back', 'Retour au Ménage')}
          >
            ← {t('menage_complite_page.back', 'Retour au Ménage')}
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
            onClick={() => navigate('/menage')}
            title={t('menage_complite_page.back', 'Retour au Ménage')}
          >
            ← {t('menage_complite_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="menage-complite-empty">Aucun service Ménage disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="menage-complite-page">
      <div className="menage-complite-header">
        <button 
          className="menage-complite-back-btn"
          onClick={() => navigate('/menage')}
          title={t('menage_complite_page.back', 'Retour au Ménage')}
        >
          ← {t('menage_complite_page.back', 'Retour au Ménage')}
        </button>
        <h1 className="menage-complite-title">
          {t('menage_complite_page.title', 'Ménage')}
        </h1>
      </div>
      <div className="menage-complite-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const isClickable = isResortHotel(item) || isMaison(item) || isAppartement(item) || isVilla(item) || isHotel(item) || isMaisonDhote(item);
          return (
            <article 
              key={item.id} 
              className={`menage-complite-card ${isClickable ? 'menage-complite-card-clickable' : ''}`}
              onClick={() => handleCardClick(item)}
              style={isClickable ? { cursor: 'pointer' } : {}}
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
                </div>
              )}
              <div className="menage-complite-card-body">
                <h2 className="menage-complite-card-title">{name || `Service #${item.id}`}</h2>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


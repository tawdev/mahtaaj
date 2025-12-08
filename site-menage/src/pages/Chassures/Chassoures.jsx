import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Chassoures.css';

export default function Chassoures() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadChassures = async () => {
      try {
        setLoading(true);
        setError('');

        // Try to find the menage with name "Chaussures" (or similar)
        let menageId = null;
        const { data: menageData, error: menageError } = await supabase
          .from('menage')
          .select('id, name_fr, name_ar, name_en')
          .or(`name_fr.ilike.%Chaussure%,name_fr.ilike.%chaussure%,name_ar.ilike.%حذاء%,name_ar.ilike.%أحذية%,name_en.ilike.%Shoe%,name_en.ilike.%Shoes%`);

        if (!menageError && menageData && menageData.length > 0) {
          // Find the best match
          const matchedMenage = menageData.find(m => {
            const nameFr = (m.name_fr || '').toLowerCase();
            const nameAr = (m.name_ar || '').toLowerCase();
            const nameEn = (m.name_en || '').toLowerCase();
            return (
              nameFr.includes('chaussure') ||
              nameAr.includes('حذاء') ||
              nameAr.includes('أحذية') ||
              nameEn.includes('shoe') ||
              nameEn.includes('shoes')
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
          console.warn('[Chassures] No menage found for "Chaussures", loading all types_menage');
          // If no specific menage found, try to load all types_menage
          // and filter client-side (less efficient but works)
          const { data: allTypes, error: typesError } = await supabase
            .from('types_menage')
            .select('*, menage:menage_id(*)')
            .order('created_at', { ascending: false });

          if (typesError) {
            throw typesError;
          }

          // Filter by menage name client-side
          const filtered = (allTypes || []).filter(item => {
            const menage = item.menage;
            if (!menage) return false;
            const nameFr = (menage.name_fr || '').toLowerCase();
            const nameAr = (menage.name_ar || '').toLowerCase();
            const nameEn = (menage.name_en || '').toLowerCase();
            return (
              nameFr.includes('chaussure') ||
              nameAr.includes('حذاء') ||
              nameAr.includes('أحذية') ||
              nameEn.includes('shoe') ||
              nameEn.includes('shoes')
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
          console.error('[Chassures] Error loading types_menage:', error);
          setError('Erreur lors du chargement des services: ' + error.message);
          return;
        }

        // Filter out items that don't match Chaussures
        const filteredItems = (data || []).filter(item => {
          const nameFr = (item.name_fr || '').toLowerCase();
          const nameAr = (item.name_ar || '').toLowerCase();
          const nameEn = (item.name_en || '').toLowerCase();
          
          // Exclude other services
          const hasTapis = nameFr.includes('tapis') || nameAr.includes('سجاد') || nameEn.includes('carpet');
          const hasCanapes = nameFr.includes('canapé') || nameFr.includes('canapes') || nameAr.includes('كنب') || nameEn.includes('sofa');
          const hasVoiture = nameFr.includes('voiture') || nameAr.includes('سيارة') || nameEn.includes('car');
          const hasAirbnb = nameFr.includes('airbnb') || nameAr.includes('airbnb') || nameEn.includes('airbnb');
          const hasPiscine = nameFr.includes('piscine') || nameAr.includes('مسبح') || nameEn.includes('pool');
          
          return !hasTapis && !hasCanapes && !hasVoiture && !hasAirbnb && !hasPiscine;
        });

        setItems(filteredItems);
      } catch (err) {
        console.error('[Chassures] Exception loading data:', err);
        setError('Erreur de connexion: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadChassures();
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

  // Check if item is "Cirage des chaussures"
  const isCirageChaussures = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase().trim();
    const nameAr = (item.name_ar || '').toLowerCase().trim();
    const nameEn = (item.name_en || '').toLowerCase().trim();

    // Check if contains "cirage" or "chaussures" or "تلميع" or "أحذية" or "shoe polish"
    const frHasCirage = nameFr.includes('cirage') || 
                       (nameFr.includes('chaussure') && nameFr.includes('cirage'));
    const arHasCirage = nameAr.includes('تلميع') || 
                       (nameAr.includes('أحذية') && nameAr.includes('تلميع'));
    const enHasCirage = nameEn.includes('polish') || 
                       (nameEn.includes('shoe') && nameEn.includes('polish'));

    // Include if has cirage/polish
    return frHasCirage || arHasCirage || enHasCirage;
  };

  // Check if item is "Nettoyage des chaussures"
  const isNettoyageChaussures = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase().trim();
    const nameAr = (item.name_ar || '').toLowerCase().trim();
    const nameEn = (item.name_en || '').toLowerCase().trim();

    // Check if contains "nettoyage" (but NOT "cirage") or "تنظيف" or "shoe cleaning"
    const frHasNettoyage = (nameFr.includes('nettoyage') && !nameFr.includes('cirage')) || 
                          (nameFr.includes('chaussure') && nameFr.includes('nettoyage') && !nameFr.includes('cirage'));
    const arHasNettoyage = (nameAr.includes('تنظيف') && !nameAr.includes('تلميع')) || 
                          (nameAr.includes('أحذية') && nameAr.includes('تنظيف') && !nameAr.includes('تلميع'));
    const enHasNettoyage = (nameEn.includes('cleaning') && !nameEn.includes('polish')) || 
                          (nameEn.includes('shoe') && nameEn.includes('cleaning') && !nameEn.includes('polish'));

    // Include if has nettoyage/cleaning but NOT cirage/polish
    return (frHasNettoyage || arHasNettoyage || enHasNettoyage);
  };

  // Handle card click
  const handleCardClick = (item) => {
    if (isCirageChaussures(item)) {
      navigate('/cirage-chaussures');
    } else if (isNettoyageChaussures(item)) {
      navigate('/nettoyage-chaussures');
    }
    // If not matching any service, do nothing
  };

  if (loading) {
    return (
      <main className="chassures-page">
        <div className="chassures-header">
          <button 
            className="chassures-back-btn"
            onClick={() => navigate('/menage')}
            title={t('chassures_page.back', 'Retour au Ménage')}
          >
            ← {t('chassures_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="chassures-loading">Chargement des services Chaussures...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="chassures-page">
        <div className="chassures-header">
          <button 
            className="chassures-back-btn"
            onClick={() => navigate('/menage')}
            title={t('chassures_page.back', 'Retour au Ménage')}
          >
            ← {t('chassures_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="chassures-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="chassures-page">
        <div className="chassures-header">
          <button 
            className="chassures-back-btn"
            onClick={() => navigate('/menage')}
            title={t('chassures_page.back', 'Retour au Ménage')}
          >
            ← {t('chassures_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="chassures-empty">Aucun service Chaussures disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="chassures-page">
      <div className="chassures-header">
        <button 
          className="chassures-back-btn"
          onClick={() => navigate('/menage')}
          title={t('chassures_page.back', 'Retour au Ménage')}
        >
          ← {t('chassures_page.back', 'Retour au Ménage')}
        </button>
        <h1 className="chassures-title">
          {t('chassures_page.title', 'Chaussures')}
        </h1>
      </div>
      <div className="chassures-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const isCirage = isCirageChaussures(item);
          const isNettoyage = isNettoyageChaussures(item);
          const isClickable = isCirage || isNettoyage;
          return (
            <article 
              key={item.id} 
              className={`chassures-card ${isClickable ? 'chassures-card-clickable' : ''}`}
              onClick={() => isClickable && handleCardClick(item)}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
            >
              {item.image && (
                <div className="chassures-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Chaussures'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="chassures-card-body">
                <h2 className="chassures-card-title">{name || `Service #${item.id}`}</h2>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


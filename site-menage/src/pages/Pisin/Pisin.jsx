import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Pisin.css';

export default function Pisin() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPisin = async () => {
      try {
        setLoading(true);
        setError('');

        // Try to find the menage with name "Piscine" (or similar)
        let menageId = null;
        const { data: menageData, error: menageError } = await supabase
          .from('menage')
          .select('id, name_fr, name_ar, name_en')
          .or(`name_fr.ilike.%Piscine%,name_fr.ilike.%piscine%,name_ar.ilike.%مسبح%,name_en.ilike.%Pool%,name_en.ilike.%Swimming%`);

        if (!menageError && menageData && menageData.length > 0) {
          // Find the best match
          const matchedMenage = menageData.find(m => {
            const nameFr = (m.name_fr || '').toLowerCase();
            const nameAr = (m.name_ar || '').toLowerCase();
            const nameEn = (m.name_en || '').toLowerCase();
            return (
              nameFr.includes('piscine') ||
              nameAr.includes('مسبح') ||
              nameEn.includes('pool') ||
              nameEn.includes('swimming')
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
          console.warn('[Pisin] No menage found for "Piscine", loading all types_menage');
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
              nameFr.includes('piscine') ||
              nameAr.includes('مسبح') ||
              nameEn.includes('pool') ||
              nameEn.includes('swimming')
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
          console.error('[Pisin] Error loading types_menage:', error);
          setError('Erreur lors du chargement des services: ' + error.message);
          return;
        }

        // Filter out items that don't match Piscine
        const filteredItems = (data || []).filter(item => {
          const nameFr = (item.name_fr || '').toLowerCase();
          const nameAr = (item.name_ar || '').toLowerCase();
          const nameEn = (item.name_en || '').toLowerCase();
          
          // Exclude other services
          const hasTapis = nameFr.includes('tapis') || nameAr.includes('سجاد') || nameEn.includes('carpet');
          const hasCanapes = nameFr.includes('canapé') || nameFr.includes('canapes') || nameAr.includes('كنب') || nameEn.includes('sofa');
          const hasVoiture = nameFr.includes('voiture') || nameAr.includes('سيارة') || nameEn.includes('car');
          const hasAirbnb = nameFr.includes('airbnb') || nameAr.includes('airbnb') || nameEn.includes('airbnb');
          
          return !hasTapis && !hasCanapes && !hasVoiture && !hasAirbnb;
        });

        setItems(filteredItems);
      } catch (err) {
        console.error('[Pisin] Exception loading data:', err);
        setError('Erreur de connexion: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPisin();
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

  // Check if item is "Nettoyage profond"
  const isProfond = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase().trim();
    const nameAr = (item.name_ar || '').toLowerCase().trim();
    const nameEn = (item.name_en || '').toLowerCase().trim();

    const frHasProfond = nameFr.includes('profond');
    const arHasProfond = nameAr.includes('عميق');
    const enHasProfond = nameEn.includes('deep');

    return frHasProfond || arHasProfond || enHasProfond;
  };

  // Check if item is "Nettoyage standard"
  const isStandard = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase().trim();
    const nameAr = (item.name_ar || '').toLowerCase().trim();
    const nameEn = (item.name_en || '').toLowerCase().trim();

    // Exclude "profond" or "deep"
    const hasProfond = nameFr.includes('profond') || 
                      nameAr.includes('عميق') || 
                      nameEn.includes('deep');

    if (hasProfond) return false;

    // Check for "standard" or "عادي" or "normal"
    const frHasStandard = nameFr.includes('standard') || nameFr.includes('normal');
    const arHasStandard = nameAr.includes('عادي') || nameAr.includes('قياسي');
    const enHasStandard = nameEn.includes('standard') || nameEn.includes('normal');

    return frHasStandard || arHasStandard || enHasStandard;
  };

  // Handle card click
  const handleCardClick = (item) => {
    if (isProfond(item)) {
      navigate('/nettoyage-profond');
    } else if (isStandard(item)) {
      navigate('/nettoyage-standard');
    }
    // If not matching any service, do nothing
  };

  if (loading) {
    return (
      <main className="pisin-page">
        <div className="pisin-header">
          <button 
            className="pisin-back-btn"
            onClick={() => navigate('/menage')}
            title={t('pisin_page.back', 'Retour au Ménage')}
          >
            ← {t('pisin_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="pisin-loading">Chargement des services Piscine...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="pisin-page">
        <div className="pisin-header">
          <button 
            className="pisin-back-btn"
            onClick={() => navigate('/menage')}
            title={t('pisin_page.back', 'Retour au Ménage')}
          >
            ← {t('pisin_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="pisin-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="pisin-page">
        <div className="pisin-header">
          <button 
            className="pisin-back-btn"
            onClick={() => navigate('/menage')}
            title={t('pisin_page.back', 'Retour au Ménage')}
          >
            ← {t('pisin_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="pisin-empty">Aucun service Piscine disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="pisin-page">
      <div className="pisin-header">
        <button 
          className="pisin-back-btn"
          onClick={() => navigate('/menage')}
          title={t('pisin_page.back', 'Retour au Ménage')}
        >
          ← {t('pisin_page.back', 'Retour au Ménage')}
        </button>
        <h1 className="pisin-title">
          {t('pisin_page.title', 'Piscine')}
        </h1>
      </div>
      <div className="pisin-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const isProfondItem = isProfond(item);
          const isStandardItem = isStandard(item);
          const isClickable = isProfondItem || isStandardItem;
          return (
            <article 
              key={item.id} 
              className={`pisin-card ${isClickable ? 'pisin-card-clickable' : ''}`}
              onClick={() => isClickable && handleCardClick(item)}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
            >
              {item.image && (
                <div className="pisin-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Piscine'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="pisin-card-body">
                <h2 className="pisin-card-title">{name || `Service #${item.id}`}</h2>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


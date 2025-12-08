import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './lavageEtRopassage.css';

export default function LavageEtRopassage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLavageEtRopassage = async () => {
      try {
        setLoading(true);
        setError('');

        // Try to find the menage with name "Lavage et Repassage" (or similar)
        let menageId = null;
        const { data: menageData, error: menageError } = await supabase
          .from('menage')
          .select('id, name_fr, name_ar, name_en')
          .or(`name_fr.ilike.%Lavage%,name_fr.ilike.%Repassage%,name_fr.ilike.%Repassage%,name_ar.ilike.%غسيل%,name_ar.ilike.%كي%,name_en.ilike.%Laundry%,name_en.ilike.%Ironing%`);

        if (!menageError && menageData && menageData.length > 0) {
          // Find the best match
          const matchedMenage = menageData.find(m => {
            const nameFr = (m.name_fr || '').toLowerCase();
            const nameAr = (m.name_ar || '').toLowerCase();
            const nameEn = (m.name_en || '').toLowerCase();
            return (
              (nameFr.includes('lavage') && (nameFr.includes('repassage') || nameFr.includes('repassage'))) ||
              (nameFr.includes('laundry') && nameFr.includes('ironing')) ||
              (nameAr.includes('غسيل') || nameAr.includes('كي')) ||
              (nameEn.includes('laundry') && nameEn.includes('ironing'))
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
          console.warn('[LavageEtRopassage] No menage found for "Lavage et Repassage", loading all types_menage');
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
              (nameFr.includes('lavage') && (nameFr.includes('repassage') || nameFr.includes('repassage'))) ||
              (nameFr.includes('laundry') && nameFr.includes('ironing')) ||
              (nameAr.includes('غسيل') || nameAr.includes('كي')) ||
              (nameEn.includes('laundry') && nameEn.includes('ironing'))
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
          console.error('[LavageEtRopassage] Error loading types_menage:', error);
          setError('Erreur lors du chargement des services: ' + error.message);
          return;
        }

        setItems(data || []);
      } catch (err) {
        console.error('[LavageEtRopassage] Exception loading data:', err);
        setError('Erreur de connexion: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadLavageEtRopassage();
  }, []);

  // Check if item is "Lavage" (not "Repassage")
  const isLavage = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    // Must contain "lavage" / "غسيل" / "laundry" but NOT "repassage" / "كي" / "ironing"
    const frIsLavage = typeNameFr.includes('lavage') && !typeNameFr.includes('repassage');
    const arIsLavage = typeNameAr.includes('غسيل') && !typeNameAr.includes('كي');
    const enIsLavage = typeNameEn.includes('laundry') && !typeNameEn.includes('ironing');

    return frIsLavage || arIsLavage || enIsLavage;
  };

  // Check if item is "Repassage" (not "Lavage")
  const isRepassage = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    // Must contain "repassage" / "كي" / "ironing" but NOT "lavage" / "غسيل" / "laundry"
    const frIsRepassage = typeNameFr.includes('repassage') && !typeNameFr.includes('lavage');
    const arIsRepassage = typeNameAr.includes('كي') && !typeNameAr.includes('غسيل');
    const enIsRepassage = typeNameEn.includes('ironing') && !typeNameEn.includes('laundry');

    return frIsRepassage || arIsRepassage || enIsRepassage;
  };

  const getLocalizedText = (item) => {
    const lang = i18n.language || 'fr';
    let name, description;
    
    if (lang === 'ar') {
      name = item.name_ar || item.name_fr || item.name_en;
      description = item.description_ar || item.description_fr || item.description_en;
      
      // If name is not in Arabic (using fallback), try to use translation from translation files
      // Check if the name contains Arabic characters or if it's a fallback from another language
      const hasArabicChars = /[\u0600-\u06FF]/.test(name);
      if (!item.name_ar || !hasArabicChars) {
        if (isLavage(item)) {
          name = t('lavage_page.title', 'الغسيل');
        } else if (isRepassage(item)) {
          name = t('ropassage_page.title', 'الكي');
        }
      }
    } else if (lang === 'en') {
      name = item.name_en || item.name_fr || item.name_ar;
      description = item.description_en || item.description_fr || item.description_ar;
      
      // If name is not in English (using fallback), try to use translation from translation files
      if (!item.name_en) {
        if (isLavage(item)) {
          name = t('lavage_page.title', 'Laundry');
        } else if (isRepassage(item)) {
          name = t('ropassage_page.title', 'Ironing');
        }
      }
    } else {
      // default fr
      name = item.name_fr || item.name_en || item.name_ar;
      description = item.description_fr || item.description_en || item.description_ar;
      
      // If name is not in French (using fallback), try to use translation from translation files
      if (!item.name_fr) {
        if (isLavage(item)) {
          name = t('lavage_page.title', 'Lavage');
        } else if (isRepassage(item)) {
          name = t('ropassage_page.title', 'Repassage');
        }
      }
    }
    
    return { name, description };
  };

  const handleCardClick = (item) => {
    if (isLavage(item)) {
      navigate('/lavage');
    } else if (isRepassage(item)) {
      navigate('/ropassage');
    }
  };

  if (loading) {
    return (
      <main className="lavage-ropassage-page">
        <div className="lavage-ropassage-header">
          <button 
            className="lavage-ropassage-back-btn"
            onClick={() => navigate('/menage')}
            title={t('lavage_ropassage_page.back', 'Retour au Ménage')}
          >
            ← {t('lavage_ropassage_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="lavage-ropassage-loading">{t('lavage_ropassage_page.loading', 'Chargement des services Lavage et Repassage...')}</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="lavage-ropassage-page">
        <div className="lavage-ropassage-header">
          <button 
            className="lavage-ropassage-back-btn"
            onClick={() => navigate('/menage')}
            title={t('lavage_ropassage_page.back', 'Retour au Ménage')}
          >
            ← {t('lavage_ropassage_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="lavage-ropassage-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="lavage-ropassage-page">
        <div className="lavage-ropassage-header">
          <button 
            className="lavage-ropassage-back-btn"
            onClick={() => navigate('/menage')}
            title={t('lavage_ropassage_page.back', 'Retour au Ménage')}
          >
            ← {t('lavage_ropassage_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="lavage-ropassage-empty">{t('lavage_ropassage_page.empty', 'Aucun service Lavage et Repassage disponible pour le moment.')}</div>
      </main>
    );
  }

  return (
    <main className="lavage-ropassage-page">
      <div className="lavage-ropassage-header">
        <button 
          className="lavage-ropassage-back-btn"
          onClick={() => navigate('/menage')}
          title={t('lavage_ropassage_page.back', 'Retour au Ménage')}
        >
          ← {t('lavage_ropassage_page.back', 'Retour au Ménage')}
        </button>
        <h1 className="lavage-ropassage-title">
          {t('lavage_ropassage_page.title', 'Lavage et Repassage')}
        </h1>
      </div>
      <div className="lavage-ropassage-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const clickable = isLavage(item) || isRepassage(item);
          return (
            <article 
              key={item.id} 
              className={`lavage-ropassage-card ${clickable ? 'lavage-ropassage-card-clickable' : ''}`}
              onClick={clickable ? () => handleCardClick(item) : undefined}
              style={clickable ? { cursor: 'pointer' } : {}}
            >
              {item.image && (
                <div className="lavage-ropassage-card-image">
                  <img
                    src={item.image}
                    alt={name || t('lavage_ropassage_page.title', 'Lavage et Repassage')}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="lavage-ropassage-card-body">
                <h2 className="lavage-ropassage-card-title">{name || `Service #${item.id}`}</h2>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './voiture.css';

export default function Voiture() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVoiture = async () => {
      try {
        setLoading(true);
        setError('');

        // Try to find the menage with name "Lavage de Voiture" (or similar)
        let menageId = null;
        const { data: menageData, error: menageError } = await supabase
          .from('menage')
          .select('id, name_fr, name_ar, name_en')
          .or(`name_fr.ilike.%Voiture%,name_ar.ilike.%سيارة%,name_en.ilike.%Car%`);

        if (!menageError && menageData && menageData.length > 0) {
          // Find the best match - must include voiture/car and exclude tapis/canapés
          const matchedMenage = menageData.find(m => {
            const nameFr = (m.name_fr || '').toLowerCase();
            const nameAr = (m.name_ar || '').toLowerCase();
            const nameEn = (m.name_en || '').toLowerCase();
            
            // Exclude tapis and canapés
            const hasTapis = nameFr.includes('tapis') || nameAr.includes('سجاد') || nameEn.includes('carpet');
            const hasCanapes = nameFr.includes('canapé') || nameFr.includes('canapes') || nameAr.includes('كنب') || nameEn.includes('sofa');
            
            if (hasTapis || hasCanapes) {
              return false; // Skip this one
            }
            
            // Must include voiture/car
            const hasVoiture = nameFr.includes('voiture') || nameAr.includes('سيارة') || nameEn.includes('car');
            
            return hasVoiture && (
              nameFr.includes('lavage') ||
              nameFr.includes('nettoyage') ||
              nameAr.includes('غسيل') ||
              nameAr.includes('تنظيف') ||
              nameEn.includes('wash') ||
              nameEn.includes('cleaning')
            );
          });
          
          if (matchedMenage) {
            menageId = matchedMenage.id;
          }
        }

        if (!menageId) {
          console.warn('[Voiture] No menage found for "Lavage de Voiture", loading all types_menage');
          // If no specific menage found, try to load all types_menage
          // and filter client-side (less efficient but works)
          const { data: allTypes, error: typesError } = await supabase
            .from('types_menage')
            .select('*, menage:menage_id(*)')
            .order('created_at', { ascending: false });

          if (typesError) {
            throw typesError;
          }

          // Filter by menage name client-side - must be voiture/car and exclude tapis/canapés
          const filtered = (allTypes || []).filter(item => {
            const menage = item.menage;
            if (!menage) return false;
            const nameFr = (menage.name_fr || '').toLowerCase();
            const nameAr = (menage.name_ar || '').toLowerCase();
            const nameEn = (menage.name_en || '').toLowerCase();
            
            // Exclude tapis and canapés
            const hasTapis = nameFr.includes('tapis') || nameAr.includes('سجاد') || nameEn.includes('carpet');
            const hasCanapes = nameFr.includes('canapé') || nameFr.includes('canapes') || nameAr.includes('كنب') || nameEn.includes('sofa');
            
            if (hasTapis || hasCanapes) {
              return false; // Skip tapis and canapés
            }
            
            // Must include voiture/car
            const hasVoiture = nameFr.includes('voiture') || nameAr.includes('سيارة') || nameEn.includes('car');
            
            if (!hasVoiture) {
              return false; // Must have voiture/car
            }
            
            // Must also have lavage/wash/cleaning
            return (
              nameFr.includes('lavage') ||
              nameFr.includes('nettoyage') ||
              nameAr.includes('غسيل') ||
              nameAr.includes('تنظيف') ||
              nameEn.includes('wash') ||
              nameEn.includes('cleaning')
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
          console.error('[Voiture] Error loading types_menage:', error);
          setError('Erreur lors du chargement des services: ' + error.message);
          return;
        }

        // Filter out items that contain tapis or canapés in their names
        const filteredItems = (data || []).filter(item => {
          const nameFr = (item.name_fr || '').toLowerCase();
          const nameAr = (item.name_ar || '').toLowerCase();
          const nameEn = (item.name_en || '').toLowerCase();
          
          // Exclude tapis and canapés
          const hasTapis = nameFr.includes('tapis') || nameAr.includes('سجاد') || nameEn.includes('carpet');
          const hasCanapes = nameFr.includes('canapé') || nameFr.includes('canapes') || nameAr.includes('كنب') || nameEn.includes('sofa');
          
          return !hasTapis && !hasCanapes;
        });

        setItems(filteredItems);
      } catch (err) {
        console.error('[Voiture] Exception loading data:', err);
        setError('Erreur de connexion: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadVoiture();
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

  // Check if item is "lavage en centre"
  const isLavageEnCentre = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase().trim();
    const nameAr = (item.name_ar || '').toLowerCase().trim();
    const nameEn = (item.name_en || '').toLowerCase().trim();

    // Check if contains "lavage en centre" or "lavage au centre" or "غسيل في المركز" or "car wash center"
    const frHasCentre = nameFr.includes('lavage en centre') || 
                       nameFr.includes('lavage au centre') ||
                       (nameFr.includes('centre') && nameFr.includes('lavage'));
    const arHasCentre = nameAr.includes('غسيل في المركز') || 
                       (nameAr.includes('المركز') && nameAr.includes('غسيل'));
    const enHasCentre = nameEn.includes('car wash center') || 
                       (nameEn.includes('center') && nameEn.includes('wash'));

    // Exclude items that contain "domicile" or "à domicile" or "home"
    const frHasDomicile = nameFr.includes('domicile') || nameFr.includes('à domicile');
    const arHasDomicile = nameAr.includes('منزل') || nameAr.includes('في المنزل');
    const enHasDomicile = nameEn.includes('home') || nameEn.includes('at home');

    // Include if has centre/center but NOT domicile/home
    return (frHasCentre || arHasCentre || enHasCentre) && 
           !frHasDomicile && !arHasDomicile && !enHasDomicile;
  };

  // Check if item is "lavage à domicile"
  const isLavageADomicile = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase().trim();
    const nameAr = (item.name_ar || '').toLowerCase().trim();
    const nameEn = (item.name_en || '').toLowerCase().trim();

    // Check if contains "lavage à domicile" or "lavage au domicile" or "غسيل في المنزل" or "car wash at home"
    const frHasDomicile = nameFr.includes('lavage à domicile') || 
                         nameFr.includes('lavage au domicile') ||
                         (nameFr.includes('à domicile') && nameFr.includes('lavage')) ||
                         (nameFr.includes('domicile') && nameFr.includes('lavage'));
    const arHasDomicile = nameAr.includes('غسيل في المنزل') || 
                         (nameAr.includes('في المنزل') && nameAr.includes('غسيل')) ||
                         (nameAr.includes('منزل') && nameAr.includes('غسيل'));
    const enHasDomicile = nameEn.includes('car wash at home') || 
                         (nameEn.includes('at home') && nameEn.includes('wash')) ||
                         (nameEn.includes('home') && nameEn.includes('wash'));

    // Exclude items that contain "centre" or "center"
    const frHasCentre = nameFr.includes('centre') || nameFr.includes('center');
    const arHasCentre = nameAr.includes('المركز') || nameAr.includes('مركز');
    const enHasCentre = nameEn.includes('center') || nameEn.includes('centre');

    // Include if has domicile/home but NOT centre/center
    return (frHasDomicile || arHasDomicile || enHasDomicile) && 
           !frHasCentre && !arHasCentre && !enHasCentre;
  };

  // Handle card click
  const handleCardClick = (item) => {
    if (isLavageEnCentre(item)) {
      navigate('/lavage-en-centre');
    } else if (isLavageADomicile(item)) {
      navigate('/lavage-a-domicile');
    }
    // If not matching any specific route, do nothing
  };

  if (loading) {
    return (
      <main className="voiture-page">
        <div className="voiture-header">
          <button 
            className="voiture-back-btn"
            onClick={() => navigate('/menage')}
            title={t('voiture_page.back', 'Retour au Ménage')}
          >
            ← {t('voiture_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="voiture-loading">Chargement des services Lavage de Voiture...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="voiture-page">
        <div className="voiture-header">
          <button 
            className="voiture-back-btn"
            onClick={() => navigate('/menage')}
            title={t('voiture_page.back', 'Retour au Ménage')}
          >
            ← {t('voiture_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="voiture-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="voiture-page">
        <div className="voiture-header">
          <button 
            className="voiture-back-btn"
            onClick={() => navigate('/menage')}
            title={t('voiture_page.back', 'Retour au Ménage')}
          >
            ← {t('voiture_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="voiture-empty">Aucun service Lavage de Voiture disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="voiture-page">
      <div className="voiture-header">
        <button 
          className="voiture-back-btn"
          onClick={() => navigate('/menage')}
          title={t('voiture_page.back', 'Retour au Ménage')}
        >
          ← {t('voiture_page.back', 'Retour au Ménage')}
        </button>
        <h1 className="voiture-title">
          {t('voiture_page.title', 'Lavage de Voiture')}
        </h1>
      </div>
      <div className="voiture-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const isCentre = isLavageEnCentre(item);
          const isDomicile = isLavageADomicile(item);
          const isClickable = isCentre || isDomicile;
          return (
            <article 
              key={item.id} 
              className={`voiture-card ${isClickable ? 'voiture-card-clickable' : ''}`}
              onClick={() => isClickable && handleCardClick(item)}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
            >
              {item.image && (
                <div className="voiture-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Lavage de Voiture'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="voiture-card-body">
                <h2 className="voiture-card-title">{name || `Service #${item.id}`}</h2>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Airbnb.css';

export default function Airbnb() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAirbnb = async () => {
      try {
        setLoading(true);
        setError('');

        // Try to find the menage with name "Airbnb" (or similar)
        let menageId = null;
        const { data: menageData, error: menageError } = await supabase
          .from('menage')
          .select('id, name_fr, name_ar, name_en')
          .or(`name_fr.ilike.%Airbnb%,name_fr.ilike.%airbnb%,name_ar.ilike.%airbnb%,name_en.ilike.%Airbnb%`);

        if (!menageError && menageData && menageData.length > 0) {
          // Find the best match
          const matchedMenage = menageData.find(m => {
            const nameFr = (m.name_fr || '').toLowerCase();
            const nameAr = (m.name_ar || '').toLowerCase();
            const nameEn = (m.name_en || '').toLowerCase();
            return (
              nameFr.includes('airbnb') ||
              nameAr.includes('airbnb') ||
              nameEn.includes('airbnb')
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
          console.warn('[Airbnb] No menage found for "Airbnb", loading all types_menage');
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
              nameFr.includes('airbnb') ||
              nameAr.includes('airbnb') ||
              nameEn.includes('airbnb')
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
          console.error('[Airbnb] Error loading types_menage:', error);
          setError('Erreur lors du chargement des services: ' + error.message);
          return;
        }

        // Filter out items that don't match Airbnb
        const filteredItems = (data || []).filter(item => {
          const nameFr = (item.name_fr || '').toLowerCase();
          const nameAr = (item.name_ar || '').toLowerCase();
          const nameEn = (item.name_en || '').toLowerCase();
          
          // Exclude other services
          const hasTapis = nameFr.includes('tapis') || nameAr.includes('سجاد') || nameEn.includes('carpet');
          const hasCanapes = nameFr.includes('canapé') || nameFr.includes('canapes') || nameAr.includes('كنب') || nameEn.includes('sofa');
          const hasVoiture = nameFr.includes('voiture') || nameAr.includes('سيارة') || nameEn.includes('car');
          
          return !hasTapis && !hasCanapes && !hasVoiture;
        });

        setItems(filteredItems);
      } catch (err) {
        console.error('[Airbnb] Exception loading data:', err);
        setError('Erreur de connexion: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAirbnb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Check if item is "Nettoyage rapide" (not "Nettoyage complet")
  const isNettoyageRapide = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    // Must contain "rapide" / "سريع" / "quick" but NOT "complet" / "كامل" / "complete"
    const frIsRapide = typeNameFr.includes('rapide') && !typeNameFr.includes('complet');
    const arIsRapide = typeNameAr.includes('سريع') && !typeNameAr.includes('كامل');
    const enIsRapide = (typeNameEn.includes('quick') || typeNameEn.includes('rapid')) && !typeNameEn.includes('complete');

    return frIsRapide || arIsRapide || enIsRapide;
  };

  // Check if item is "Nettoyage complet" (not "Nettoyage rapide")
  const isNettoyageComplet = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    // Must contain "complet" / "كامل" / "complete" but NOT "rapide" / "سريع" / "quick"
    const frIsComplet = typeNameFr.includes('complet') && !typeNameFr.includes('rapide');
    const arIsComplet = typeNameAr.includes('كامل') && !typeNameAr.includes('سريع');
    const enIsComplet = typeNameEn.includes('complete') && !typeNameEn.includes('quick') && !typeNameEn.includes('rapid');

    return frIsComplet || arIsComplet || enIsComplet;
  };

  const handleCardClick = (item) => {
    if (isNettoyageRapide(item)) {
      navigate('/nettoyage-rapide');
    } else if (isNettoyageComplet(item)) {
      navigate('/nettoyage-complet');
    }
  };

  if (loading) {
    return (
      <main className="airbnb-page">
        <div className="airbnb-header">
          <button 
            className="airbnb-back-btn"
            onClick={() => navigate('/menage')}
            title={t('airbnb_page.back', 'Retour au Ménage')}
          >
            ← {t('airbnb_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="airbnb-loading">Chargement des services Airbnb...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="airbnb-page">
        <div className="airbnb-header">
          <button 
            className="airbnb-back-btn"
            onClick={() => navigate('/menage')}
            title={t('airbnb_page.back', 'Retour au Ménage')}
          >
            ← {t('airbnb_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="airbnb-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="airbnb-page">
        <div className="airbnb-header">
          <button 
            className="airbnb-back-btn"
            onClick={() => navigate('/menage')}
            title={t('airbnb_page.back', 'Retour au Ménage')}
          >
            ← {t('airbnb_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="airbnb-empty">Aucun service Airbnb disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="airbnb-page">
      <div className="airbnb-header">
        <button 
          className="airbnb-back-btn"
          onClick={() => navigate('/menage')}
          title={t('airbnb_page.back', 'Retour au Ménage')}
        >
          ← {t('airbnb_page.back', 'Retour au Ménage')}
        </button>
        <h1 className="airbnb-title">
          {t('airbnb_page.title', 'Airbnb')}
        </h1>
      </div>
      <div className="airbnb-grid">
        {items.map((item) => {
          const { name } = getLocalizedText(item);
          const clickable = isNettoyageRapide(item) || isNettoyageComplet(item);
          return (
            <article 
              key={item.id} 
              className={`airbnb-card ${clickable ? 'airbnb-card-clickable' : ''}`}
              onClick={clickable ? () => handleCardClick(item) : undefined}
              style={clickable ? { cursor: 'pointer' } : {}}
            >
              {item.image && (
                <div className="airbnb-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Airbnb'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="airbnb-card-body">
                <h2 className="airbnb-card-title">{name || `Service #${item.id}`}</h2>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './bureuxEtUsin.css';

export default function BureuxEtUsin() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBureuxEtUsin = async () => {
      try {
        setLoading(true);
        setError('');

        // Try to find the menage with name "Bureaux et Usine" (or similar)
        let menageId = null;
        const { data: menageData, error: menageError } = await supabase
          .from('menage')
          .select('id, name_fr, name_ar, name_en')
          .or(`name_fr.ilike.%Bureaux%,name_fr.ilike.%Usine%,name_fr.ilike.%Bureau%,name_ar.ilike.%مكاتب%,name_ar.ilike.%مصنع%,name_en.ilike.%Office%,name_en.ilike.%Factory%`);

        if (!menageError && menageData && menageData.length > 0) {
          // Find the best match
          const matchedMenage = menageData.find(m => {
            const nameFr = (m.name_fr || '').toLowerCase();
            const nameAr = (m.name_ar || '').toLowerCase();
            const nameEn = (m.name_en || '').toLowerCase();
            return (
              (nameFr.includes('bureaux') && nameFr.includes('usine')) ||
              (nameFr.includes('bureau') && nameFr.includes('usine')) ||
              (nameFr.includes('office') && nameFr.includes('factory')) ||
              (nameAr.includes('مكاتب') && nameAr.includes('مصنع')) ||
              (nameEn.includes('office') && nameEn.includes('factory'))
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
          console.warn('[BureuxEtUsin] No menage found for "Bureaux et Usine", loading all types_menage');
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
              (nameFr.includes('bureaux') && nameFr.includes('usine')) ||
              (nameFr.includes('bureau') && nameFr.includes('usine')) ||
              (nameFr.includes('office') && nameFr.includes('factory')) ||
              (nameAr.includes('مكاتب') && nameAr.includes('مصنع')) ||
              (nameEn.includes('office') && nameEn.includes('factory'))
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
          console.error('[BureuxEtUsin] Error loading types_menage:', error);
          setError('Erreur lors du chargement des services: ' + error.message);
          return;
        }

        setItems(data || []);
      } catch (err) {
        console.error('[BureuxEtUsin] Exception loading data:', err);
        setError('Erreur de connexion: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBureuxEtUsin();
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

  // Check if item is "Usine" (not "Bureau")
  const isUsine = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    // Must contain "usine" / "مصنع" / "factory" but NOT "bureau" / "مكتب" / "office"
    const frIsUsine = typeNameFr.includes('usine') && !typeNameFr.includes('bureau');
    const arIsUsine = typeNameAr.includes('مصنع') && !typeNameAr.includes('مكتب');
    const enIsUsine = typeNameEn.includes('factory') && !typeNameEn.includes('office');

    return frIsUsine || arIsUsine || enIsUsine;
  };

  // Check if item is "Bureaux" (not "Usine")
  const isBureaux = (item) => {
    const typeNameFr = (item.name_fr || '').toLowerCase().trim();
    const typeNameAr = (item.name_ar || '').toLowerCase().trim();
    const typeNameEn = (item.name_en || '').toLowerCase().trim();

    // Must contain "bureau" / "مكتب" / "office" but NOT "usine" / "مصنع" / "factory"
    const frIsBureaux = (typeNameFr.includes('bureau') || typeNameFr.includes('bureaux')) && !typeNameFr.includes('usine');
    const arIsBureaux = (typeNameAr.includes('مكتب') || typeNameAr.includes('مكاتب')) && !typeNameAr.includes('مصنع');
    const enIsBureaux = (typeNameEn.includes('office') || typeNameEn.includes('bureau')) && !typeNameEn.includes('factory');

    return frIsBureaux || arIsBureaux || enIsBureaux;
  };

  const handleCardClick = (item) => {
    if (isUsine(item)) {
      navigate('/usine');
    } else if (isBureaux(item)) {
      navigate('/bureaux');
    }
  };

  if (loading) {
    return (
      <main className="bureux-usin-page">
        <div className="bureux-usin-header">
          <button 
            className="bureux-usin-back-btn"
            onClick={() => navigate('/menage')}
            title={t('bureux_usin_page.back', 'Retour au Ménage')}
          >
            ← {t('bureux_usin_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="bureux-usin-loading">Chargement des services Bureaux et Usine...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bureux-usin-page">
        <div className="bureux-usin-header">
          <button 
            className="bureux-usin-back-btn"
            onClick={() => navigate('/menage')}
            title={t('bureux_usin_page.back', 'Retour au Ménage')}
          >
            ← {t('bureux_usin_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="bureux-usin-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="bureux-usin-page">
        <div className="bureux-usin-header">
          <button 
            className="bureux-usin-back-btn"
            onClick={() => navigate('/menage')}
            title={t('bureux_usin_page.back', 'Retour au Ménage')}
          >
            ← {t('bureux_usin_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="bureux-usin-empty">Aucun service Bureaux et Usine disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="bureux-usin-page">
      <div className="bureux-usin-header">
        <button 
          className="bureux-usin-back-btn"
          onClick={() => navigate('/menage')}
          title={t('bureux_usin_page.back', 'Retour au Ménage')}
        >
          ← {t('bureux_usin_page.back', 'Retour au Ménage')}
        </button>
        <h1 className="bureux-usin-title">
          {t('bureux_usin_page.title', 'Bureaux et Usine')}
        </h1>
      </div>
      <div className="bureux-usin-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const clickable = isUsine(item) || isBureaux(item);
          return (
            <article 
              key={item.id} 
              className={`bureux-usin-card ${clickable ? 'bureux-usin-card-clickable' : ''}`}
              onClick={clickable ? () => handleCardClick(item) : undefined}
              style={clickable ? { cursor: 'pointer' } : {}}
            >
              {item.image && (
                <div className="bureux-usin-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Bureaux et Usine'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="bureux-usin-card-body">
                <h2 className="bureux-usin-card-title">{name || `Service #${item.id}`}</h2>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


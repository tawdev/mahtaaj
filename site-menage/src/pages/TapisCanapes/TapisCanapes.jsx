import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './TapisCanapes.css';

export default function TapisCanapes() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTapisCanapes = async () => {
      try {
        setLoading(true);
        setError('');

        // First, find the menage with name "Tapis Et Canapés" (or similar)
        const menageNames = [
          'Tapis Et Canapés',
          'Tapis et Canapés',
          'Tapis Et Canapes',
          'Tapis et Canapes',
          'ال tapis et canapés',
          'Tapis & Canapés'
        ];

        // Try to find the menage by name in any language
        let menageId = null;
        const { data: menageData, error: menageError } = await supabase
          .from('menage')
          .select('id, name_fr, name_ar, name_en')
          .or(`name_fr.ilike.%Tapis%,name_fr.ilike.%Canapé%,name_ar.ilike.%تapis%,name_ar.ilike.%Canapé%,name_en.ilike.%Tapis%,name_en.ilike.%Canapé%`);

        if (!menageError && menageData && menageData.length > 0) {
          // Find the best match
          const matchedMenage = menageData.find(m => 
            menageNames.some(name => 
              m.name_fr?.toLowerCase().includes('tapis') && 
              (m.name_fr?.toLowerCase().includes('canapé') || m.name_fr?.toLowerCase().includes('canapes'))
            ) ||
            m.name_ar?.includes('تapis') ||
            (m.name_en?.toLowerCase().includes('tapis') && m.name_en?.toLowerCase().includes('canap'))
          );
          
          if (matchedMenage) {
            menageId = matchedMenage.id;
          } else {
            // Use the first result if no exact match
            menageId = menageData[0].id;
          }
        }

        if (!menageId) {
          console.warn('[TapisCanapes] No menage found for "Tapis Et Canapés", loading all types_menage');
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
              (nameFr.includes('tapis') && (nameFr.includes('canapé') || nameFr.includes('canapes'))) ||
              (nameAr.includes('تapis') || nameAr.includes('كنب')) ||
              (nameEn.includes('tapis') && nameEn.includes('canap'))
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
          console.error('[TapisCanapes] Error loading types_menage:', error);
          setError('Erreur lors du chargement des services: ' + error.message);
          return;
        }

        setItems(data || []);
      } catch (err) {
        console.error('[TapisCanapes] Exception loading data:', err);
        setError('Erreur de connexion: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTapisCanapes();
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

  // Check if item name matches "tapis" only (without canapés)
  const isTapisOnly = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase().trim();
    const nameAr = (item.name_ar || '').toLowerCase().trim();
    const nameEn = (item.name_en || '').toLowerCase().trim();
    
    // Check if name contains "tapis" or "carpet" or "rug" or "سجاد"
    const hasTapis = 
      nameFr.includes('tapis') || 
      nameAr.includes('سجاد') || 
      nameAr.includes('تapis') || 
      nameEn.includes('tapis') || 
      nameEn.includes('carpet') ||
      nameEn.includes('rug');
    
    // Exclude items that contain "canapés" or "sofa" or "كنب"
    const hasCanapes = 
      nameFr.includes('canapé') || 
      nameFr.includes('canapes') || 
      nameFr.includes('sofa') ||
      nameAr.includes('كنب') || 
      nameAr.includes('canapé') || 
      nameAr.includes('canapes') ||
      nameEn.includes('canap') || 
      nameEn.includes('sofa');
    
    return hasTapis && !hasCanapes;
  };

  // Check if item name matches "canapés" only (without tapis)
  const isCanapesOnly = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase().trim();
    const nameAr = (item.name_ar || '').toLowerCase().trim();
    const nameEn = (item.name_en || '').toLowerCase().trim();
    
    // Check if name contains "canapés" or "sofa" or "كنب"
    const hasCanapes = 
      nameFr.includes('canapé') || 
      nameFr.includes('canapes') || 
      nameFr.includes('sofa') ||
      nameAr.includes('كنب') || 
      nameAr.includes('canapé') || 
      nameAr.includes('canapes') ||
      nameEn.includes('canap') || 
      nameEn.includes('sofa');
    
    // Exclude items that contain "tapis" or "carpet" or "rug" or "سجاد"
    const hasTapis = 
      nameFr.includes('tapis') || 
      nameFr.includes('carpet') || 
      nameFr.includes('rug') ||
      nameAr.includes('سجاد') || 
      nameAr.includes('tapis') || 
      nameAr.includes('carpet') ||
      nameEn.includes('tapis') || 
      nameEn.includes('carpet') || 
      nameEn.includes('rug');
    
    return hasCanapes && !hasTapis;
  };

  // Check if item name matches "tapis & canapés"
  const isTapisCanapesItem = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase().trim();
    const nameAr = (item.name_ar || '').toLowerCase().trim();
    const nameEn = (item.name_en || '').toLowerCase().trim();
    
    // Check if name contains both "tapis" AND "canapé/canapes"
    const hasTapis = 
      nameFr.includes('tapis') || 
      nameAr.includes('سجاد') || 
      nameAr.includes('تapis') || 
      nameEn.includes('tapis') || 
      nameEn.includes('carpet');
    
    const hasCanapes = 
      nameFr.includes('canapé') || 
      nameFr.includes('canapes') || 
      nameAr.includes('كنب') || 
      nameAr.includes('canapé') || 
      nameEn.includes('canap') || 
      nameEn.includes('sofa');
    
    return hasTapis && hasCanapes;
  };

  const handleCardClick = (item) => {
    // Check "tapis" only first
    if (isTapisOnly(item)) {
      navigate('/tapis');
    } 
    // Check "canapés" only second
    else if (isCanapesOnly(item)) {
      navigate('/canapes');
    } 
    // Check "tapis & canapés" last
    else if (isTapisCanapesItem(item)) {
      navigate('/tapis-et-canape');
    }
  };

  if (loading) {
    return (
      <main className="tapis-canapes-page">
        <div className="tapis-canapes-header">
          <button 
            className="tapis-canapes-back-btn"
            onClick={() => navigate('/menage')}
            title={t('tapis_canapes_page.back', 'Retour au Ménage')}
          >
            ← {t('tapis_canapes_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="tapis-canapes-loading">Chargement des services Tapis et Canapés...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="tapis-canapes-page">
        <div className="tapis-canapes-header">
          <button 
            className="tapis-canapes-back-btn"
            onClick={() => navigate('/menage')}
            title={t('tapis_canapes_page.back', 'Retour au Ménage')}
          >
            ← {t('tapis_canapes_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="tapis-canapes-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="tapis-canapes-page">
        <div className="tapis-canapes-header">
          <button 
            className="tapis-canapes-back-btn"
            onClick={() => navigate('/menage')}
            title={t('tapis_canapes_page.back', 'Retour au Ménage')}
          >
            ← {t('tapis_canapes_page.back', 'Retour au Ménage')}
          </button>
        </div>
        <div className="tapis-canapes-empty">Aucun service Tapis et Canapés disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="tapis-canapes-page">
      <div className="tapis-canapes-header">
        <button 
          className="tapis-canapes-back-btn"
          onClick={() => navigate('/menage')}
          title={t('tapis_canapes_page.back', 'Retour au Ménage')}
        >
          ← {t('tapis_canapes_page.back', 'Retour au Ménage')}
        </button>
        <h1 className="tapis-canapes-title">
          {t('tapis_canapes_page.title', 'Tapis et Canapés')}
        </h1>
      </div>
      <div className="tapis-canapes-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const isTapisOnlyItem = isTapisOnly(item);
          const isCanapesOnlyItem = isCanapesOnly(item);
          const isTapisCanapesItemValue = isTapisCanapesItem(item);
          const isClickable = isTapisOnlyItem || isCanapesOnlyItem || isTapisCanapesItemValue;
          return (
            <article 
              key={item.id} 
              className={`tapis-canapes-card ${isClickable ? 'tapis-canapes-card-clickable' : ''}`}
              onClick={() => isClickable && handleCardClick(item)}
              style={isClickable ? { cursor: 'pointer' } : {}}
            >
              {item.image && (
                <div className="tapis-canapes-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Tapis et Canapés'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="tapis-canapes-card-body">
                <h2 className="tapis-canapes-card-title">{name || `Service #${item.id}`}</h2>
                {/* <p className="tapis-canapes-card-description">
                  {description || '—'}
                </p> */}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}


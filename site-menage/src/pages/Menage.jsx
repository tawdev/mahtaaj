import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Menage.css';

export default function Menage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMenage = async () => {
      try {
        setLoading(true);
        setError('');

        const { data, error } = await supabase
          .from('menage')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Menage] Error loading menage:', error);
          setError('Erreur lors du chargement des services ménage: ' + error.message);
          return;
        }

        setItems(data || []);
      } catch (err) {
        console.error('[Menage] Exception loading menage:', err);
        setError('Erreur de connexion: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMenage();
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

  // Check if item name matches "Tapis Et Canapés" (in any language)
  const isTapisCanapes = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    
    return (
      (nameFr.includes('tapis') && (nameFr.includes('canapé') || nameFr.includes('canapes'))) ||
      (nameAr.includes('تapis') || nameAr.includes('كنب') || nameAr.includes('سجاد')) ||
      (nameEn.includes('tapis') && nameEn.includes('canap')) ||
      (nameFr.includes('tapis et canapé') || nameFr.includes('tapis & canapé'))
    );
  };

  // Check if item name matches "Lavage de Voiture" (in any language)
  // This must be checked BEFORE "Lavage et Repassage" to avoid conflicts
  const isLavageDeVoiture = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    
    // Exclude "repassage" to avoid confusion with "Lavage et Repassage"
    const hasRepassage = nameFr.includes('repassage') || nameAr.includes('كي') || nameEn.includes('ironing');
    if (hasRepassage) {
      return false;
    }
    
    return (
      (nameFr.includes('lavage') && nameFr.includes('voiture')) ||
      (nameFr.includes('nettoyage') && nameFr.includes('voiture')) ||
      (nameFr.includes('car') && (nameFr.includes('wash') || nameFr.includes('lavage'))) ||
      (nameAr.includes('غسيل') && nameAr.includes('سيارة')) ||
      (nameAr.includes('تنظيف') && nameAr.includes('سيارة')) ||
      (nameEn.includes('car') && (nameEn.includes('wash') || nameEn.includes('cleaning')))
    );
  };

  // Check if item name matches "Lavage et Repassage" (in any language)
  const isLavageEtRopassage = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    
    // Exclude "voiture" to avoid confusion with "Lavage de Voiture"
    const hasVoiture = nameFr.includes('voiture') || nameAr.includes('سيارة') || nameEn.includes('car');
    if (hasVoiture) {
      return false;
    }
    
    return (
      (nameFr.includes('lavage') && (nameFr.includes('repassage') || nameFr.includes('repassage'))) ||
      (nameFr.includes('laundry') && nameFr.includes('ironing')) ||
      (nameAr.includes('غسيل') && (nameAr.includes('كي') || nameAr.includes('كي'))) ||
      (nameEn.includes('laundry') && nameEn.includes('ironing'))
    );
  };

  // Check if item name matches "Bureaux et Usine" (in any language)
  const isBureuxEtUsin = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    
    return (
      (nameFr.includes('bureaux') && nameFr.includes('usine')) ||
      (nameFr.includes('bureau') && nameFr.includes('usine')) ||
      (nameFr.includes('office') && nameFr.includes('factory')) ||
      (nameAr.includes('مكاتب') && nameAr.includes('مصنع')) ||
      (nameEn.includes('office') && nameEn.includes('factory'))
    );
  };

  // Check if item name matches "Airbnb" (in any language)
  const isAirbnb = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    
    return (
      nameFr.includes('airbnb') ||
      nameAr.includes('airbnb') ||
      nameEn.includes('airbnb')
    );
  };

  // Check if item name matches "Piscine" (in any language)
  const isPisin = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    
    return (
      nameFr.includes('piscine') ||
      nameAr.includes('مسبح') ||
      nameEn.includes('pool') ||
      nameEn.includes('swimming')
    );
  };

  // Check if item name matches "Chaussures" (in any language)
  const isChassures = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    
    return (
      nameFr.includes('chaussure') ||
      nameAr.includes('حذاء') ||
      nameAr.includes('أحذية') ||
      nameEn.includes('shoe') ||
      nameEn.includes('shoes')
    );
  };

  // Check if item name matches "Ménage" (general, not specific services)
  const isMenageGeneral = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    
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
  };

  const handleCardClick = (item) => {
    // Check "Lavage de Voiture" BEFORE "Lavage et Repassage" to avoid conflicts
    if (isTapisCanapes(item)) {
      navigate('/tapis-canapes');
    } else if (isLavageDeVoiture(item)) {
      navigate('/lavage-de-voiture');
    } else if (isLavageEtRopassage(item)) {
      navigate('/lavage-et-ropassage');
    } else if (isBureuxEtUsin(item)) {
      navigate('/bureaux-et-usine');
    } else if (isAirbnb(item)) {
      navigate('/airbnb');
    } else if (isPisin(item)) {
      navigate('/piscine');
    } else if (isChassures(item)) {
      navigate('/chaussures');
    } else if (isMenageGeneral(item)) {
      navigate('/menage-complet');
    }
  };

  if (loading) {
    return (
      <main className="menage-page">
        <div className="menage-loading">Chargement des services ménage...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="menage-page">
        <div className="menage-error">{error}</div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="menage-page">
        <div className="menage-empty">Aucun service ménage disponible pour le moment.</div>
      </main>
    );
  }

  return (
    <main className="menage-page">
      <button 
        className="menage-back-button"
        onClick={() => navigate('/menage-et-cuisine')}
        title={t('menage_page.back', 'Retour')}
      >
        ← {t('menage_page.back', 'Retour')}
      </button>
      <h1 className="menage-title">
        {t('menage_page.title', 'Ménage')}
      </h1>
      <div className="menage-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const isClickable = isTapisCanapes(item) || isLavageEtRopassage(item) || isBureuxEtUsin(item) || isLavageDeVoiture(item) || isAirbnb(item) || isPisin(item) || isChassures(item) || isMenageGeneral(item);
          return (
            <article 
              key={item.id} 
              className={`menage-card ${isClickable ? 'menage-card-clickable' : ''}`}
              onClick={() => handleCardClick(item)}
              style={isClickable ? { cursor: 'pointer' } : {}}
            >
              {item.image && (
                <div className="menage-card-image">
                  <img
                    src={item.image}
                    alt={name || 'Ménage'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="menage-card-body">
                <h2 className="menage-card-title">{name || `Ménage #${item.id}`}</h2>
                <p className="menage-card-description">
                  {description || '—'}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}



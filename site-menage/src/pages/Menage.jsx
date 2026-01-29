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

  const isTapisCanapes = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    return (
      (nameFr.includes('tapis') && (nameFr.includes('canapé') || nameFr.includes('canapes'))) ||
      (nameAr.includes('كنب') || nameAr.includes('سجاد')) ||
      (nameEn.includes('tapis') && nameEn.includes('canap')) ||
      (nameFr.includes('tapis et canapé') || nameFr.includes('tapis & canapé'))
    );
  };

  const isLavageDeVoiture = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    const hasRepassage = nameFr.includes('repassage') || nameAr.includes('كي') || nameEn.includes('ironing');
    if (hasRepassage) return false;
    return (
      (nameFr.includes('lavage') && nameFr.includes('voiture')) ||
      (nameFr.includes('nettoyage') && nameFr.includes('voiture')) ||
      (nameFr.includes('car') && (nameFr.includes('wash') || nameFr.includes('lavage'))) ||
      (nameAr.includes('غسيل') && nameAr.includes('سيارة')) ||
      (nameAr.includes('تنظيف') && nameAr.includes('سيارة')) ||
      (nameEn.includes('car') && (nameEn.includes('wash') || nameEn.includes('cleaning')))
    );
  };

  const isLavageEtRopassage = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    const hasVoiture = nameFr.includes('voiture') || nameAr.includes('سيارة') || nameEn.includes('car');
    if (hasVoiture) return false;
    return (
      (nameFr.includes('lavage') && (nameFr.includes('repassage') || nameFr.includes('repassage'))) ||
      (nameFr.includes('laundry') && nameFr.includes('ironing')) ||
      (nameAr.includes('غسيل') && (nameAr.includes('كي') || nameAr.includes('كي'))) ||
      (nameEn.includes('laundry') && nameEn.includes('ironing'))
    );
  };

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

  const isAirbnb = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    return nameFr.includes('airbnb') || nameAr.includes('airbnb') || nameEn.includes('airbnb');
  };

  const isPisin = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    return nameFr.includes('piscine') || nameAr.includes('مسبح') || nameEn.includes('pool') || nameEn.includes('swimming');
  };

  const isChassures = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    return nameFr.includes('chaussure') || nameAr.includes('حذاء') || nameAr.includes('أحذية') || nameEn.includes('shoe') || nameEn.includes('shoes');
  };

  const isMenageGeneral = (item) => {
    const nameFr = (item.name_fr || '').toLowerCase();
    const nameAr = (item.name_ar || '').toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    const hasSpecial = isTapisCanapes(item) || isLavageDeVoiture(item) || isLavageEtRopassage(item) || isBureuxEtUsin(item) || isAirbnb(item) || isPisin(item) || isChassures(item);
    if (hasSpecial) return false;
    return (
      (nameFr.includes('ménage') && !nameFr.includes('tapis') && !nameFr.includes('voiture') && !nameFr.includes('lavage') && !nameFr.includes('bureaux')) ||
      nameAr.includes('تدبير') || nameAr.includes('منزلي') ||
      nameEn.includes('housekeeping') || (nameEn.includes('cleaning') && !nameEn.includes('car'))
    );
  };

  const getPriority = (item) => {
    if (isMenageGeneral(item)) return 1;
    if (isBureuxEtUsin(item)) return 2;
    if (isLavageEtRopassage(item)) return 3;
    if (isAirbnb(item)) return 4;
    if (isPisin(item)) return 5;
    if (isTapisCanapes(item)) return 6;
    if (isLavageDeVoiture(item)) return 7;
    if (isChassures(item)) return 8;
    return 99;
  };

  const handleCardClick = (item) => {
    if (isTapisCanapes(item)) navigate('/tapis-canapes');
    else if (isLavageDeVoiture(item)) navigate('/lavage-de-voiture');
    else if (isLavageEtRopassage(item)) navigate('/lavage-et-ropassage');
    else if (isBureuxEtUsin(item)) navigate('/bureaux-et-usine');
    else if (isAirbnb(item)) navigate('/airbnb');
    else if (isPisin(item)) navigate('/piscine');
    else if (isChassures(item)) navigate('/chaussures');
    else if (isMenageGeneral(item)) navigate('/menage-complet');
  };

  useEffect(() => {
    const loadMenage = async () => {
      try {
        setLoading(true);
        setError('');
        const { data, error } = await supabase
          .from('menage')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        const sortedData = (data || []).sort((a, b) => getPriority(a) - getPriority(b));
        setItems(sortedData);
      } catch (err) {
        console.error('[Menage] Error loading menage:', err);
        setError('Erreur lors du chargement des services ménage');
      } finally {
        setLoading(false);
      }
    };
    loadMenage();
  }, [i18n.language]);

  if (loading) return <main className="menage-page"><div className="menage-loading">Chargement...</div></main>;
  if (error) return <main className="menage-page"><div className="menage-error">{error}</div></main>;
  if (!items.length) return <main className="menage-page"><div className="menage-empty">Aucun service disponible.</div></main>;

  return (
    <main className="menage-page">
      <button className="menage-back-button" onClick={() => navigate('/menage-et-cuisine')}>← {t('menage_page.back', 'Retour')}</button>
      <h1 className="menage-title">{t('menage_page.title', 'Ménage')}</h1>
      <div className="menage-grid">
        {items.map((item) => {
          const { name, description } = getLocalizedText(item);
          const isClickable = true;
          return (
            <article key={item.id} className="menage-card menage-card-clickable" onClick={() => handleCardClick(item)} style={{ cursor: 'pointer' }}>
              {item.image && (
                <div className="menage-card-image">
                  <img src={item.image} alt={name} onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
              <div className="menage-card-body">
                <h2 className="menage-card-title">{name || `Ménage #${item.id}`}</h2>
                <p className="menage-card-description">{description || '—'}</p>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

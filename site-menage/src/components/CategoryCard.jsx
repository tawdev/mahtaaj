import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function CategoryCard({ category, onClick, index }) {
  const { t, i18n } = useTranslation();
  const [imageError, setImageError] = useState(false);

  const resolveLocale = useMemo(() => {
    const langFromI18n = i18n?.language;
    let lang = 'fr';
    if (langFromI18n) {
      lang = langFromI18n.split(/[-_]/)[0].toLowerCase();
    } else {
      try {
        const stored = localStorage.getItem('currentLang');
        if (stored) lang = stored.split(/[-_]/)[0].toLowerCase();
      } catch {
        lang = 'fr';
      }
    }
    if (lang === 'ar') return 'ar-MA';
    if (lang === 'en') return 'en-US';
    return 'fr-FR';
  }, [i18n?.language]);

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return String(value);
    return new Intl.NumberFormat(resolveLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numeric);
  };

  const formatPrice = (value) => {
    const formatted = formatNumber(value);
    if (!formatted) {
      return t('hand_workers.price_not_available', { defaultValue: '—' });
    }
    return `${formatted} ${t('hand_workers.currency_unit', { defaultValue: 'DH' })}`;
  };

  const formatMinimumJours = (value) => {
    const formatted = formatNumber(value);
    if (!formatted) {
      return t('hand_workers.minimum_jours_not_available', { defaultValue: '—' });
    }
    return `${formatted}${t('hand_workers.jours_suffix', { defaultValue: ' jour(s)' })}`;
  };

  // Check if category name should hide the monthly booking message
  const shouldHideMonthlyMessage = (category) => {
    if (!category || !category.name) return false;
    const categoryName = category.name;
    const excludedNames = [
      'Ouvrier des égouts',
      'Serrurier',
      'Menuisier',
      'عامل الصرف الصحي',
      'الحداد',
      'النجار',
      'Sewer Worker',
      'Locksmith',
      'Carpenter'
    ];
    return excludedNames.includes(categoryName);
  };

  return (
    <div
      className="category-card"
      onClick={() => onClick(category)}
      data-aos="fade-up"
      data-aos-delay={`${400 + index * 100}`}
    >
      <div className="category-image-container">
        {category.imageUrl && !imageError ? (
          <>
            <img
              src={category.imageUrl}
              alt={category.name}
              className="category-image"
              onError={(e) => {
                setImageError(true);
                e.target.style.display = 'none';
              }}
            />
            <div className="category-name-overlay">
              <h3 className="category-title">{category.name}</h3>
            </div>
          </>
        ) : (
          <>
            <div className="category-icon">
              {category.icon ? (
                <i className={category.icon}></i>
              ) : (
                <i className="fas fa-tools"></i>
              )}
            </div>
            <div className="category-name-overlay">
              <h3 className="category-title">{category.name}</h3>
            </div>
          </>
        )}
      </div>
      
      <div className="category-footer">
        <div className="category-price">
          <span className="price-label">{t('hand_workers.price_per_day') || 'Prix par jour'}</span>
          <span className="price-value">{formatPrice(category.price_per_day || category.price_per_hour)}</span>
        </div>
        <div className="category-minimum">
          <span className="minimum-label">{t('hand_workers.minimum_jours') || 'Jours minimum'}</span>
          <span className="minimum-value">{formatMinimumJours(category.minimum_jours)}</span>
        </div>
        {!shouldHideMonthlyMessage(category) && category.minimum_jours > 1 && (
          <div className="category-message">
            <p className="message-text">{t('hand_workers.less_than_month_message', { defaultValue: 'أقل من شهر المرجو التواصل معنا للتفاوض حسب المدة' })}</p>
          </div>
        )}
      </div>
    </div>
  );
}

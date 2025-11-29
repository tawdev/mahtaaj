import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ServiceCard({ icon, title, description, image, isActive = true }) {
  const { t } = useTranslation();
  
  // Function to get translated text or fallback to original
  const getTranslatedText = (text, key) => {
    // Try to get translation from i18n first
    const translation = t(key, { defaultValue: text });
    return translation !== key ? translation : text;
  };

  // Create service key from title
  const getServiceKey = (title) => {
    if (!title) return '';
    return title.toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  };

  const serviceKey = getServiceKey(title);

  return (
    <article className={`home-service-card service-card ${!isActive ? 'inactive' : ''}`}>
      {image && (
        <div className="service-card-image">
          <img src={image} alt={title} />
        </div>
      )}
      <div className="service-content">
        <div className="service-title-section">
          <h3>{getTranslatedText(title, `services.${serviceKey}.title`)}</h3>
        </div>
        <div className="service-description-section">
          <p>{getTranslatedText(description, `services.${serviceKey}.description`)}</p>
        </div>
      </div>
      {!isActive && (
        <div className="home-service-status">
          <span className="home-service-status-badge inactive">{t('services_page.inactive')}</span>
        </div>
      )}
    </article>
  );
}



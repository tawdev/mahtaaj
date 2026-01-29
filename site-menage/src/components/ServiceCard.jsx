import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ServiceCard({ icon, title, description, image, isActive = true }) {
  const { t } = useTranslation();

  return (
    <article className={`home-service-card service-card ${!isActive ? 'inactive' : ''}`}>
      {image && (
        <div className="service-card-image">
          <img src={image} alt={title} />
        </div>
      )}
      <div className="service-content">
        <div className="service-title-section">
          <h3>{title}</h3>
        </div>
        <div className="service-description-section">
          <p>{description}</p>
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



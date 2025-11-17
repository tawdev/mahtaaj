import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './TousLesServices.css';

export default function TousLesServices() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const services = [
    {
      id: 1,
      icon: '🧹',
      translationKey: 'menage',
      path: '/services',
      color: '#3b82f6',
      image: 'Ménage1.jpeg'
    },
    {
      id: 2,
      icon: '🛡️',
      translationKey: 'security',
      path: '/security',
      color: '#10b981',
      image: 'security1.jpeg'
    },
    {
      id: 3,
      icon: '👶',
      translationKey: 'bebe_setting',
      path: '/bebe-setting',
      color: '#f59e0b',
      image: 'bebe1.jpeg'
    },
    {
      id: 4,
      icon: '🌿',
      translationKey: 'jardinage',
      path: '/jardinage',
      color: '#059669',
      image: 'jardinage1.jpeg'
    },
    {
      id: 5,
      icon: '🔧',
      translationKey: 'hand_workers',
      path: '/hand-workers',
      color: '#8b5cf6',
      image: 'menuisier1.jpeg'
    }
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div className="tous-les-services-page">
      <div className="tous-les-services-container">
        <h1 className="tous-les-services-title">🧺 {t('tous_les_services.title')}</h1>
        
        <div className="services-grid">
          {services.map((service) => (
            <div
              key={service.id}
              className="service-card"
              onClick={() => handleCardClick(service.path)}
              style={{ 
                '--card-color': service.color,
                backgroundImage: `url(${(process.env.PUBLIC_URL || '') + '/serveces/' + encodeURIComponent(service.image)})`
              }}
            >
              <div className="card-background-overlay"></div>
              <div className="service-card-content">
                <h2 className="service-name">{t(`tous_les_services.${service.translationKey}.name`)}</h2>
                <p className="service-name-fr">{t(`tous_les_services.${service.translationKey}.name_fr`)}</p>
              </div>
              <div className="card-overlay"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


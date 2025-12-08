import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './TousLesServices.css';

export default function TousLesServices() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [imageErrors, setImageErrors] = useState({});

  const services = [
    {
      id: 1,
      icon: '🧹',
      translationKey: 'menage',
      path: '/menage-et-cuisine',
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
    },
    {
      id: 6,
      icon: '🚗',
      translationKey: 'driver',
      path: '/driver',
      color: '#dc2626',
      image: 'Gemini_Generated_Image_mw2wgwmw2wgwmw2w.png'
    }
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  const handleImageError = (serviceId) => {
    setImageErrors(prev => ({ ...prev, [serviceId]: true }));
  };

  const getImageUrl = (image) => {
    const baseUrl = process.env.PUBLIC_URL || '';
    return `${baseUrl}/image/serveces/${encodeURIComponent(image)}`;
  };

  return (
    <div className="tous-les-services-page">
      <div className="tous-les-services-container">
        <h1 className="tous-les-services-title">🧺 {t('tous_les_services.title')}</h1>
        
        <div className="services-grid">
          {services.map((service) => {
            const imageUrl = getImageUrl(service.image);
            const hasImageError = imageErrors[service.id];
            
            return (
              <div
                key={service.id}
                className="service-card"
                onClick={() => handleCardClick(service.path)}
                style={{ 
                  '--card-color': service.color,
                  backgroundColor: hasImageError ? service.color : undefined,
                  backgroundImage: hasImageError ? 'none' : `url(${imageUrl})`
                }}
              >
                {/* Preload image to detect errors */}
                {!hasImageError && (
                  <img
                    src={imageUrl}
                    alt=""
                    style={{ display: 'none' }}
                    onError={() => handleImageError(service.id)}
                    onLoad={() => {
                      // Image loaded successfully, ensure it's visible
                      if (imageErrors[service.id]) {
                        setImageErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[service.id];
                          return newErrors;
                        });
                      }
                    }}
                  />
                )}
                <div className="card-background-overlay"></div>
                <div className="service-card-content">
                  <h2 className="service-name">{t(`tous_les_services.${service.translationKey}.name`)}</h2>
                </div>
                <div className="card-overlay"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function CategoryCard({ category, onClick, index }) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="category-card"
      onClick={() => onClick(category)}
      data-aos="fade-up"
      data-aos-delay={`${400 + index * 100}`}
    >
      <div className="category-image-container">
        {category.imageUrl && !imageError ? (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="category-image"
            onError={(e) => {
              setImageError(true);
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="category-icon">
            {category.icon ? (
              <i className={category.icon}></i>
            ) : (
              <i className="fas fa-tools"></i>
            )}
          </div>
        )}
      </div>
      
      <div className="category-content">
        <h3 className="category-title">{category.name}</h3>
        <p className="category-description" title={category.description}>
          {category.description}
        </p>
      </div>
      
      <div className="category-footer">
        <div className="category-price">
          <span className="price-label">{t('hand_workers.price_per_hour')}</span>
          <span className="price-value">{category.price_per_hour} DH</span>
        </div>
        <div className="category-minimum">
          <span className="minimum-label">{t('hand_workers.minimum_hours')}</span>
          <span className="minimum-value">{category.minimum_hours}h</span>
        </div>
      </div>
    </div>
  );
}

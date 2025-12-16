import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './HandWorkers.css';
import { SERVICES } from './MultiServiceEmployeesData';

export default function MultiServiceEmployees() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <main className="hand-workers-page">
      <div className="hand-workers-header">
        <div className="hand-workers-title-section">
          <h1 className="hand-workers-title">
            {t('multi_services.grid_title', 'اختر الخدمة المناسبة لك')}
          </h1>
          <p className="hand-workers-subtitle">
            {t(
              'multi_services.grid_subtitle',
              'اضغط على إحدى البطاقات ثم قم بتحديد المدينة والحي لعرض الموظفين المناسبين.',
            )}
          </p>
        </div>
      </div>

      {/* Services grid */}
      <div className="hand-workers-content">
        <div className="categories-section">
          <h2 className="section-title">
            {t('multi_services.services_title', 'الخدمات المتوفرة')}
          </h2>
          <div className="categories-grid">
            {SERVICES.map((service) => (
              <button
                key={service.id}
                type="button"
                className="category-card"
                onClick={() => navigate(`/multi-services-employees/${service.id}`)}
              >
                <div className="category-image-container">
                  <div className="multi-service-user-avatar">
                    <span>👤</span>
                  </div>
                  <div className="category-name-overlay">
                    <h3 className="category-title">{service.label}</h3>
                  </div>
                </div>
                <div className="category-content">
                  <p className="category-description">
                    {t(
                      'multi_services.service_card_description',
                      'اضغط لعرض الموظفين المتاحين لهذه الخدمة مع فلترة حسب المدينة والحي.',
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}


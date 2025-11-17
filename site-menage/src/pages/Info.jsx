import React from 'react';
import { useTranslation } from 'react-i18next';
import './Info.css';

export default function Info() {
  const { t } = useTranslation();
  
  return (
    <div className="info-page">
      <div className="info-container">
        <header className="info-header">
          <h1 className="info-title" data-aos="fade-up" data-aos-delay="100">{t('info.title')}</h1>
          <p className="info-subtitle" data-aos="fade-up" data-aos-delay="200">
            {t('info.subtitle')}
          </p>
        </header>

        <main className="info-content">
          <section className="info-section" data-aos="fade-up" data-aos-delay="300">
            <div className="info-card">
              <div className="info-card-header">
                <div className="info-icon">🏢</div>
                <h2>{t('info.sections.history.title')}</h2>
              </div>
              <div className="info-card-content">
                <p>
                  {t('info.sections.history.content')}
                </p>
              </div>
            </div>
          </section>

          <section className="info-section" data-aos="fade-up" data-aos-delay="400">
            <div className="info-card">
              <div className="info-card-header">
                <div className="info-icon">🎯</div>
                <h2>{t('info.sections.mission.title')}</h2>
              </div>
              <div className="info-card-content">
                <p>
                  {t('info.sections.mission.content')}
                </p>
              </div>
            </div>
          </section>

          <section className="info-section" data-aos="fade-up" data-aos-delay="500">
            <div className="info-card">
              <div className="info-card-header">
                <div className="info-icon">✨</div>
                <h2>{t('info.sections.values.title')}</h2>
              </div>
              <div className="info-card-content">
                <ul className="values-list">
                  <li><strong>{t('info.sections.values.quality')}:</strong> {t('info.sections.values.quality_desc')}</li>
                  <li><strong>{t('info.sections.values.reliability')}:</strong> {t('info.sections.values.reliability_desc')}</li>
                  <li><strong>{t('info.sections.values.ecology')}:</strong> {t('info.sections.values.ecology_desc')}</li>
                  <li><strong>{t('info.sections.values.innovation')}:</strong> {t('info.sections.values.innovation_desc')}</li>
                  <li><strong>{t('info.sections.values.customer_service')}:</strong> {t('info.sections.values.customer_service_desc')}</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="info-section" data-aos="fade-up" data-aos-delay="600">
            <div className="info-card">
              <div className="info-card-header">
                <div className="info-icon">👥</div>
                <h2>{t('info.sections.team.title')}</h2>
              </div>
              <div className="info-card-content">
                <p>
                  {t('info.sections.team.content')}
                </p>
              </div>
            </div>
          </section>

          <section className="info-section" data-aos="fade-up" data-aos-delay="700">
            <div className="info-card">
              <div className="info-card-header">
                <div className="info-icon">🌱</div>
                <h2>{t('info.sections.ecology.title')}</h2>
              </div>
              <div className="info-card-content">
                <p>
                  {t('info.sections.ecology.content')}
                </p>
              </div>
            </div>
          </section>

          <section className="info-section" data-aos="fade-up" data-aos-delay="800">
            <div className="info-card">
              <div className="info-card-header">
                <div className="info-icon">📞</div>
                <h2>{t('info.sections.contact.title')}</h2>
              </div>
              <div className="info-card-content">
                <div className="contact-info">
                  <p><strong>{t('info.sections.contact.phone')}:</strong> <a href="tel:+33666262106">06 66 26 21 06</a></p>
                  <p><strong>{t('info.sections.contact.email')}:</strong> <a href="mailto:contact@proservices-menage.com">contact@proservices-menage.com</a></p>
                  <p><strong>{t('info.sections.contact.hours')}:</strong> {t('info.sections.contact.hours_value')}</p>
                  <p><strong>{t('info.sections.contact.zone')}:</strong> {t('info.sections.contact.zone_value')}</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

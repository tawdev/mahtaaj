import React from 'react';
import { useTranslation } from 'react-i18next';
import { LuPhone, LuMapPin, LuMail, LuClock } from 'react-icons/lu';
import './Contact.css';

export default function Contact() {
  const { t } = useTranslation();

  // Using the high-quality wide angle image
  const backgroundImage = '/galerie/b__A_wide-angle,_high-.png';

  return (
    <main
      className="contact-hero"
      id="contact"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.8)), url(${backgroundImage})`,
      }}
    >
      <div className="contact-container">
        <div className="contact-card">
          <div className="contact-header">
            <div className="contact-icon-wrapper">
              <LuPhone className="contact-main-icon" />
            </div>
            <h1 className="contact-title">{t('contact.title', 'Contactez-nous')}</h1>
            <p className="contact-subtitle">
              {t('contact.description', 'Une équipe à votre écoute pour tous vos besoins.')}
            </p>
          </div>

          <div className="contact-methods">
            <a href="tel:+212524308038" className="contact-method-item primary">
              <div className="method-icon">
                <LuPhone />
              </div>
              <div className="method-content">
                <span className="method-label">Appelez-nous</span>
                <span className="method-value">+212 524 30 80 38</span>
              </div>
              <div className="method-action">
                <span className="pulse-dot"></span>
              </div>
            </a>

            {/* Added email as a placeholder if needed, or just keeping the phone focused as per request */}
            {/* <div className="contact-method-item">
              <div className="method-icon"><LuMail /></div>
              <div className="method-content">
                <span className="method-label">Email</span>
                <span className="method-value">contact@mahtaaj.com</span>
              </div>
            </div> */}
          </div>

          <div className="contact-hours-card">
            <div className="hours-icon"><LuClock /></div>
            <div className="hours-text">
              <strong>Horaires d'ouverture</strong>
              <span>Lundi - Samedi: 09:00 - 18:00</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}



import React from 'react';
import './Support.css';
import { useTranslation } from 'react-i18next';

export default function Support() {
  const phoneNumber = '+212600000000';
  const email = 'support@houseklean.ma';
  const { t, i18n } = useTranslation();
  const isRTL = (i18n.language || 'fr').toString().split(/[-_]/)[0].toLowerCase() === 'ar';

  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleEmail = () => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <main className="support-hero" id="support" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="support-card">
        <div className="support-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h1 className="support-title">{t('support.title', 'Support & Assistance')}</h1>
        <p className="support-description">{t('support.intro')}</p>
        <p className="support-subtitle">{t('support.message')}</p>

        <div className="support-info">
          <div className="info-item">
            <div className="info-icon phone-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="info-content">
              <h3>{t('support.phone_label')}</h3>
              <p className="info-value">
                <a href={`tel:${phoneNumber}`}>{phoneNumber}</a>
              </p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon email-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  fill="currentColor"
                />
                <path
                  d="m22 6-10 5L2 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="info-content">
              <h3>{t('support.email_label')}</h3>
              <p className="info-value">
                <a href={`mailto:${email}`}>{email}</a>
              </p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon time-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
                <path
                  d="M12 6v6l4 2"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="info-content">
              <h3>{t('support.hours_label')}</h3>
              <p className="info-value">{t('support.hours_value')}</p>
            </div>
          </div>
        </div>

        <div className="support-actions">
          <button onClick={handleCall} className="support-button support-button--call">
            <span className="button-icon">📞</span>
            <span>{t('support.call_now')}</span>
          </button>
          <button onClick={handleEmail} className="support-button support-button--email">
            <span className="button-icon">✉️</span>
            <span>{t('support.send_message')}</span>
          </button>
        </div>
      </div>
    </main>
  );
}


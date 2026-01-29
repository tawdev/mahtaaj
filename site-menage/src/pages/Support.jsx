import React from 'react';
import { useTranslation } from 'react-i18next';
import { LuPhone, LuMail, LuClock, LuMessageCircle } from 'react-icons/lu';
import SEO from '../components/SEO';
import './Support.css';

export default function Support() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const phoneNumber = '+212 524308038';
  const email = 'support@mahtaaj.ma';

  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleEmail = () => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <main className={`support-page ${isRTL ? 'rtl' : ''}`}>
      <SEO
        title={t('nav.support') || 'Support'}
        description="Contactez le support mahtaaj pour toute assistance ou information complémentaire sur nos services."
      />

      <div className="support-wrapper">
        <div className="support-grid">
          {/* Left Side: Visual/Hero */}
          <div className="support-visual">
            <div className="support-image-container">
              <img
                src="https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&q=80&w=1200"
                alt="Customer Support mahtaaj"
                className="support-main-img"
              />
              <div className="support-overlay">
                <div className="floating-badge">
                  <LuMessageCircle size={24} />
                  <span>24/7 Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Content & Actions */}
          <div className="support-content-area">
            <div className="support-header">
              <span className="support-tag">{t('support.tag', 'Help Center')}</span>
              <h1 className="support-title">{t('support.title', 'Support & Assistance')}</h1>
              <p className="support-subtitle">
                {t('support.intro', 'We are here to help you. Reach out to us via any of the channels below.')}
              </p>
            </div>

            <div className="support-cards-container">
              <div className="contact-premium-card" onClick={handleCall}>
                <div className="card-icon-box phone">
                  <LuPhone size={24} />
                </div>
                <div className="card-text">
                  <h3>{t('support.phone_label', 'Call Us')}</h3>
                  <p>{phoneNumber}</p>
                </div>
                <div className="card-arrow">
                  <LuClock size={16} />
                </div>
              </div>

              <div className="contact-premium-card" onClick={handleEmail}>
                <div className="card-icon-box email">
                  <LuMail size={24} />
                </div>
                <div className="card-text">
                  <h3>{t('support.email_label', 'Email Us')}</h3>
                  <p>{email}</p>
                </div>
                <div className="card-arrow">
                  <LuMessageCircle size={16} />
                </div>
              </div>


            </div>

            <div className="support-cta-group">
              <button onClick={handleCall} className="btn-primary support-btn">
                <LuPhone /> {t('support.call_now', 'Call Now')}
              </button>
              <button onClick={handleEmail} className="btn-secondary support-btn">
                <LuMail /> {t('support.send_message', 'Send Message')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

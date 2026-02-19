import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LuFacebook, LuInstagram, LuMail, LuPhone, LuMapPin, LuExternalLink } from 'react-icons/lu';
import './Footer.css';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const isRTL = i18n.language === 'ar';

  return (
    <footer className={`site-footer ${isRTL ? 'rtl' : ''}`}>
      <div className="footer-container">
        {/* Column 1: Brand & About */}
        <div className="footer-column brand-col">
          <img src="/galerie/logooomahtaaj.png" alt="mahtaaj" className="footer-logo" />
          <p className="footer-about">
            {t('footer.about_text')}
          </p>
          <div className="footer-socials">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
              <LuFacebook size={20} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
              <LuInstagram size={20} />
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="footer-column">
          <h3 className="footer-title">{t('footer.links_title')}</h3>
          <ul className="footer-links">
            <li><Link to="/">{t('nav.home')}</Link></li>
            <li><Link to="/gallery">{t('nav.gallery')}</Link></li>
            <li><Link to="/shop">{t('nav.shop')}</Link></li>
            <li><Link to="/blog">{t('nav.blog')}</Link></li>
            <li><Link to="/support">{t('nav.info')}</Link></li>
          </ul>
        </div>

        {/* Column 3: Services */}
        <div className="footer-column">
          <h3 className="footer-title">{t('footer.services_title')}</h3>
          <ul className="footer-links">
            <li><Link to="/services">{t('nav.house_keeping')}</Link></li>
            <li><Link to="/security">{t('nav.security')}</Link></li>
            <li><Link to="/bebe-setting">{t('nav.baby_setting')}</Link></li>
            <li><Link to="/jardinage">{t('nav.gardening')}</Link></li>
            <li><Link to="/hand-workers">{t('nav.hand_workers')}</Link></li>
            <li><Link to="/driver">{t('nav.driver')}</Link></li>
          </ul>
        </div>

        {/* Column 4: Contact */}
        <div className="footer-column contact-col">
          <h3 className="footer-title">{t('footer.contact_title')}</h3>
          <ul className="footer-contact-info">
            <li>
              <LuMapPin size={18} />
              <span>{t('footer.address_value')}</span>
            </li>
            <li>
              <LuPhone size={18} />
              <a href="tel:+212600000000">+212 5 24 30 80 38</a>
            </li>
            <li>
              <LuMail size={18} />
              <a href="mailto:contact@mahtaaj.com">contact@mahtaaj.com</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{t('footer.rights', { year: currentYear })}</p>
      </div>
    </footer>
  );
}



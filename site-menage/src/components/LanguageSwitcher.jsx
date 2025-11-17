import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [supportedLocales, setSupportedLocales] = useState([
    { code: 'fr', name: 'French', native: 'français', flag: '🇫🇷' },
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  ]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  const currentLanguage = supportedLocales.find(
    (locale) => locale.code === i18n.language
  ) || { code: 'fr', name: 'French', native: 'français', flag: '🇫🇷' };

  return (
    <div className="language-switcher">
      <button className="language-button" onClick={() => setIsOpen(!isOpen)}>
        <span className="flag">{currentLanguage.flag}</span>
        <span className="language-name">{currentLanguage.native}</span>
        <span className="dropdown-arrow">▼</span>
      </button>
      {isOpen && (
        <ul className="language-dropdown">
          {supportedLocales.map((locale) => (
            <li key={locale.code}>
              <button 
                className={`language-option ${locale.code === i18n.language ? 'active' : ''}`}
                onClick={() => changeLanguage(locale.code)}
              >
                <span className="flag">{locale.flag}</span>
                <span className="language-name">{locale.native}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;

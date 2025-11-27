import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Added
import { adminLogout } from '../api-supabase';
import './Navbar1.css';

export default function Navbar1() {
  const { t, i18n } = useTranslation(); // Added i18n for language detection
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('user') || localStorage.getItem('adminToken')));
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const handleChangeLanguage = (lng, event) => {
    // Prevent event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Close dropdown immediately when language is selected
    setIsLangOpen(false);
    
    // Change language after closing dropdown
    try {
      i18n.changeLanguage(lng);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };
  const location = useLocation();
  const navigate = useNavigate();

  function toggleMenu() {
    setIsOpen(!isOpen);
  }

  function closeMenu() {
    setIsOpen(false);
    setIsLangOpen(false);
    setIsLoginDropdownOpen(false);
  }

  function handleLoginClick(e) {
    e.stopPropagation();
    setIsLoginDropdownOpen(!isLoginDropdownOpen);
    setIsLangOpen(false); // Close language dropdown if open
  }

  function handleLanguageClick() {
    setIsLangOpen(!isLangOpen);
    setIsLoginDropdownOpen(false); // Close login dropdown if open
  }

  function handleLoginAsClient() {
    setIsLoginDropdownOpen(false);
    closeMenu();
    navigate('/login-register');
  }

  function handleLoginForJob() {
    setIsLoginDropdownOpen(false);
    closeMenu();
    navigate('/employees/register');
  }

  async function handleLogout() {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        try {
          await adminLogout(adminToken);
        } catch (_) {
          // ignore API errors, proceed to local logout
        }
      }

      // Clear possible auth storages (user + admin)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      sessionStorage.removeItem('token');
    } finally {
      closeMenu();
      navigate('/');
    }
  }

  useEffect(() => {
    // Close menu on route change
    closeMenu();
  }, [location.pathname]);

  useEffect(() => {
    // Prevent body scroll when menu is open on mobile
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    // Close menu when clicking outside or pressing Escape
    const handleClickOutside = (event) => {
      if (isOpen) {
        const navbar = document.querySelector('.navbar1');
        const drawer = document.querySelector('.navbar1__drawer');
        
        // Check if click is outside navbar and drawer
        if (navbar && drawer && 
            !navbar.contains(event.target) && 
            !drawer.contains(event.target)) {
          closeMenu();
        }
      }
      
      // Close language dropdown when clicking outside (for both mobile and desktop)
      if (isLangOpen) {
        const mobileLangBtn = document.querySelector('.navbar1__mobile-lang-btn');
        const mobileLangDropdown = document.querySelector('.navbar1__mobile-lang-dropdown');
        const desktopLangBtn = document.querySelector('.lang-btn');
        const desktopLangDropdown = document.querySelector('.navbar1__links .language-switcher-item > div[style*="position"]');
        const desktopLangItem = document.querySelector('.language-switcher-item');
        
        // Check if click is inside any language-related element
        const clickedInsideMobile = mobileLangBtn?.contains(event.target) || 
                                   mobileLangDropdown?.contains(event.target);
        
        const clickedInsideDesktop = desktopLangBtn?.contains(event.target) || 
                                    desktopLangDropdown?.contains(event.target) ||
                                    desktopLangItem?.contains(event.target);
        
        // Close if click is outside both mobile and desktop language elements
        if (!clickedInsideMobile && !clickedInsideDesktop) {
          setIsLangOpen(false);
        }
      }

      // Close login dropdown when clicking outside
      if (isLoginDropdownOpen) {
        const loginBtn = event.target.closest('.login-btn');
        const loginDropdown = event.target.closest('.login-dropdown');
        
        if (!loginBtn && !loginDropdown) {
          setIsLoginDropdownOpen(false);
        }
      }
    };

    const handleKeyDown = (event) => {
      if (isOpen && event.key === 'Escape') {
        closeMenu();
      }
      if (isLangOpen && event.key === 'Escape') {
        setIsLangOpen(false);
      }
      if (isLoginDropdownOpen && event.key === 'Escape') {
        setIsLoginDropdownOpen(false);
      }
    };

    // Add event listeners when menu, language dropdown, or login dropdown is open
    if (isOpen || isLangOpen || isLoginDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup event listeners
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLangOpen, isLoginDropdownOpen]);

  useEffect(() => {
    // Handle scroll effect
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Track auth changes via storage events or route changes
    const syncAuth = () => {
      setIsLoggedIn(Boolean(localStorage.getItem('user') || localStorage.getItem('adminToken')));
    };
    window.addEventListener('storage', syncAuth);
    syncAuth();
    return () => window.removeEventListener('storage', syncAuth);
  }, [location.pathname]);

  // Set HTML lang and direction based on language
  useEffect(() => {
    const lang = i18n.language || 'fr';
    const langCode = lang.split(/[-_]/)[0].toLowerCase();
    const isRTL = langCode === 'ar';
    
    // Set HTML lang attribute
    document.documentElement.setAttribute('lang', langCode);
    
    // Set direction
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.style.direction = isRTL ? 'rtl' : 'ltr';
    document.documentElement.style.textAlign = isRTL ? 'right' : 'left';
  }, [i18n.language]);

  // Determine if we're in RTL mode (Arabic)
  const isRTL = i18n.language === 'ar';

  // Get current language code (FR, AR, EN)
  const getCurrentLangCode = () => {
    const lang = i18n.language || 'fr';
    const langCode = lang.split(/[-_]/)[0].toLowerCase();
    if (langCode === 'ar') return 'AR';
    if (langCode === 'en') return 'EN';
    return 'FR';
  };

  return (
    <header
      className={`navbar1 ${isScrolled ? 'scrolled' : ''} ${isRTL ? 'rtl' : ''}`}
      role="banner"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 999999,
        background: 'rgba(255,255,255,0.95)',
        display: 'flex',
        visibility: 'visible',
        opacity: 1
      }}
    >
      <div className={`navbar1__inner ${isRTL ? 'rtl-inner' : ''}`}>
        {/* Burger menu - hidden on desktop, visible on mobile */}
        <button
          type="button"
          className={`navbar1__hamburger ${isOpen ? 'is-open' : ''}`}
          aria-label="Menu"
          aria-expanded={isOpen}
          aria-controls="navbar1-drawer"
          onClick={toggleMenu}
        >
          <span className="bar bar-1"/>
          <span className="bar bar-2"/>
          <span className="bar bar-3"/>
        </button>

        {/* Logo - first in RTL layout */}
        <Link 
          to="/" 
          className={`navbar1__brand ${isRTL ? 'rtl-brand' : ''}`} 
          aria-label="SolutionPourMaintenant - Accueil" 
          onClick={closeMenu}
        >
          <span className="navbar1__title">ForNowSolution</span>
        </Link>

        {/* Mobile Language Switcher Button - appears only on mobile */}
        <div className="navbar1__mobile-lang-container" style={{ position: 'relative' }}>
          <button
            type="button"
            className="navbar1__mobile-lang-btn"
            title={t('nav.languages', 'Languages')}
            aria-label={t('nav.languages', 'Languages')}
            aria-expanded={isLangOpen}
            onClick={handleLanguageClick}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="mobile-lang-globe-icon"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="mobile-lang-code">{getCurrentLangCode()}</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`mobile-lang-chevron ${isLangOpen ? 'open' : ''}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {/* Language Dropdown Menu - outside the button to avoid nesting */}
          {isLangOpen && (
            <div className="navbar1__mobile-lang-dropdown">
              {[
                { code: 'ar', label: 'العربية', codeLabel: 'AR' },
                { code: 'fr', label: 'Français', codeLabel: 'FR' },
                { code: 'en', label: 'English', codeLabel: 'EN' },
              ].map(({ code, label, codeLabel }) => (
                <button
                  key={code}
                  type="button"
                  onClick={(e) => handleChangeLanguage(code, e)}
                  className={`mobile-lang-option ${i18n.language.startsWith(code) ? 'active' : ''}`}
                >
                  <span className="mobile-lang-option-label">{label}</span>
                  <span className="mobile-lang-option-code">{codeLabel}</span>
                  {i18n.language.startsWith(code) && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation menu - links in normal order */}
        <nav className={`navbar1__nav ${isRTL ? 'rtl-nav' : ''}`} aria-label="Navigation principale">
          <ul className={`navbar1__links ${isRTL ? 'rtl' : ''}`}>
            {/* RTL: Logo → الرئيسية → جميع خدماتنا → المتجر → الدعم → ملفي الشخصي → [langue + login/logout] */}
            {/* Normal order for RTL (links read naturally right to left) */}
            {isRTL ? (
              <>
                {/* Navigation links in normal order */}
                <li><Link to="/" onClick={closeMenu}>{t('nav.home')}</Link></li>
                <li><Link to="/tous-les-services" onClick={closeMenu}>{t('nav.all_services')}</Link></li>
                <li><Link to="/shop" onClick={closeMenu}>{t('nav.shop')}</Link></li>
                <li><Link to="/support" onClick={closeMenu}>الدعم</Link></li>
                {isLoggedIn && (
                  <li><Link to="/profile" onClick={closeMenu}>{t('nav.profile')}</Link></li>
                )}
                
                {/* Icons at the end */}
                <li className="language-switcher-item" style={{ position:'relative', marginLeft: 'auto', marginRight: '0' }}>
                  <button
                    type="button"
                    className="icon-btn lang-btn"
                    title={t('nav.languages', 'Languages')}
                    aria-label={t('nav.languages', 'Languages')}
                    aria-expanded={isLangOpen}
                    onClick={handleLanguageClick}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="desktop-lang-globe-icon"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </button>
                  {isLangOpen && (
                    <div style={{ 
                      position:'absolute', 
                      top:'110%', 
                      right: 'auto', 
                      left: 0, 
                      zIndex:100000,
                      background:'#fff',
                      border:'1px solid #e5e7eb',
                      borderRadius:12,
                      padding:8,
                      boxShadow:'0 10px 25px rgba(0,0,0,0.12)'
                    }}>
                      <div style={{display:'flex', flexDirection:'column', minWidth:180}}>
                        {[
                          { code:'ar', label:'العربية SA' },
                          { code:'fr', label:'Français FR' },
                          { code:'en', label:'English EN' },
                        ].map(({code,label}) => (
                          <button key={code}
                            type="button"
                            onClick={(e) => handleChangeLanguage(code, e)}
                            className={`lang-option ${i18n.language.startsWith(code) ? 'active' : ''}`}
                            style={{
                              display:'flex', alignItems:'center', justifyContent:'space-between',
                              gap:8, padding:'8px 10px', border:'none', background:'transparent',
                              cursor:'pointer', borderRadius:8, color:'#0f172a'
                            }}
                          >
                            <span>{label}</span>
                            {i18n.language.startsWith(code) && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
                {!isLoggedIn && (
                  <li style={{ marginLeft: 'auto', marginRight: '0', position: 'relative' }}>
                    <button
                      type="button"
                      className="icon-btn login-btn login-btn-with-text"
                      title={t('nav.login')}
                      aria-label={t('nav.login')}
                      aria-expanded={isLoginDropdownOpen}
                      onClick={handleLoginClick}
                    >
                      <span className="login-text">{t('nav.login', 'Login')}</span>
                    </button>
                    {isLoginDropdownOpen && (
                      <div className="login-dropdown" style={{ 
                        position: 'absolute',
                        top: '110%',
                        right: 0,
                        left: 'auto',
                        zIndex: 100000,
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        padding: 8,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                        minWidth: 200
                      }}>
                        <button
                          type="button"
                          onClick={handleLoginAsClient}
                          className="login-dropdown-option"
                        >
                          <span>Login as Client</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleLoginForJob}
                          className="login-dropdown-option"
                        >
                          <span>Login for Job</span>
                        </button>
                      </div>
                    )}
                  </li>
                )}
                {isLoggedIn && (
                  <li style={{ marginLeft: 'auto', marginRight: '0' }}>
                    <button
                      type="button"
                      className="icon-btn logout-btn logout-btn-with-text"
                      title={t('nav.logout')}
                      aria-label={t('nav.logout')}
                      onClick={handleLogout}
                    >
                      <span className="logout-text">{t('nav.logout', 'Logout')}</span>
                    </button>
                  </li>
                )}
              </>
            ) : (
              <>
                {/* LTR: normal order */}
                <li><Link to="/" onClick={closeMenu}>{t('nav.home')}</Link></li>
                <li><Link to="/tous-les-services" onClick={closeMenu}>{t('nav.all_services')}</Link></li>
                <li><Link to="/shop" onClick={closeMenu}>{t('nav.shop')}</Link></li>
                <li><Link to="/support" onClick={closeMenu}>Support</Link></li>
                {isLoggedIn && (
                  <li><Link to="/profile" onClick={closeMenu}>{t('nav.profile')}</Link></li>
                )}
                
                {/* Language switcher - right side in LTR */}
                <li className="language-switcher-item" style={{ position:'relative', marginLeft: 'auto', marginRight: '0' }}>
              <button
                type="button"
                className="icon-btn lang-btn"
                title={t('nav.languages', 'Languages')}
                aria-label={t('nav.languages', 'Languages')}
                aria-expanded={isLangOpen}
                onClick={handleLanguageClick}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="desktop-lang-globe-icon"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </button>
              {isLangOpen && (
                <div style={{ 
                  position:'absolute', 
                  top:'110%', 
                  right: isRTL ? 'auto' : 0, 
                  left: isRTL ? 0 : 'auto', 
                  zIndex:100000,
                  background:'#fff',
                  border:'1px solid #e5e7eb',
                  borderRadius:12,
                  padding:8,
                  boxShadow:'0 10px 25px rgba(0,0,0,0.12)'
                }}>
                  <div style={{display:'flex', flexDirection:'column', minWidth:180}}>
                    {[
                      { code:'ar', label:'العربية SA' },
                      { code:'fr', label:'Français FR' },
                      { code:'en', label:'English EN' },
                    ].map(({code,label}) => (
                      <button key={code}
                        type="button"
                        onClick={() => handleChangeLanguage(code)}
                        className={`lang-option ${i18n.language.startsWith(code) ? 'active' : ''}`}
                        style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          gap:8, padding:'8px 10px', border:'none', background:'transparent',
                          cursor:'pointer', borderRadius:8, color:'#0f172a'
                        }}
                      >
                        <span>{label}</span>
                        {i18n.language.startsWith(code) && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
            {/* Login/Logout buttons - always on the right side (left in RTL) */}
            {!isLoggedIn && (
              <li style={{ marginLeft: isRTL ? '0' : 'auto', marginRight: isRTL ? '8px' : '0', position: 'relative' }}>
                <button
                  type="button"
                  className="icon-btn login-btn login-btn-with-text"
                  title={t('nav.login')}
                  aria-label={t('nav.login')}
                  aria-expanded={isLoginDropdownOpen}
                  onClick={handleLoginClick}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-in">
                    <path d="m10 17 5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  </svg>
                  <span className="login-text">{t('nav.login', 'Login')}</span>
                </button>
                {isLoginDropdownOpen && (
                  <div className="login-dropdown" style={{ 
                    position: 'absolute',
                    top: '110%',
                    right: isRTL ? 'auto' : 0,
                    left: isRTL ? 0 : 'auto',
                    zIndex: 100000,
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 8,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                    minWidth: 200
                  }}>
                    <button
                      type="button"
                      onClick={handleLoginAsClient}
                      className="login-dropdown-option"
                    >
                      <span>Login as Client</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLoginForJob}
                      className="login-dropdown-option"
                    >
                      <span>Login for Job</span>
                    </button>
                  </div>
                )}
              </li>
            )}
            {isLoggedIn && (
              <li style={{ marginLeft: isRTL ? '0' : 'auto', marginRight: isRTL ? '8px' : '0' }}>
                <button
                  type="button"
                  className="icon-btn logout-btn logout-btn-with-text"
                  title={t('nav.logout')}
                  aria-label={t('nav.logout')}
                  onClick={handleLogout}
                >
                  <span className="logout-text">{t('nav.logout', 'Logout')}</span>
                </button>
              </li>
            )}
              </>
            )}
          </ul>
        </nav>
      </div>

      <div
        id="navbar1-drawer"
        className={`navbar1__drawer ${isOpen ? 'open' : ''} ${isRTL ? 'rtl' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="navbar1__drawer-inner">
          <div className="navbar1__drawer-header" style={{ 
            flexDirection: isRTL ? 'row-reverse' : 'row' 
          }}>
            <h2>{t('nav.menu', 'Menu')}</h2>
            <button
              type="button"
              className="navbar1__close-btn"
              aria-label="Fermer le menu"
              onClick={closeMenu}
            >
              ×
            </button>
          </div>
          <ul className="navbar1__drawer-links">
            <li><Link to="/" onClick={closeMenu}>{t('nav.home')}</Link></li>
            <li><Link to="/tous-les-services" onClick={closeMenu}>{t('nav.all_services')}</Link></li>
            <li><Link to="/shop" onClick={closeMenu}>{t('nav.shop')}</Link></li>
            <li><Link to="/contact" onClick={closeMenu}>{t('nav.contact')}</Link></li>
            <li><Link to="/support" onClick={closeMenu}>{isRTL ? 'الدعم' : 'Support'}</Link></li>
            <li><Link to="/gallery" onClick={closeMenu}>{t('nav.gallery')}</Link></li>
            <li><Link to="/info" onClick={closeMenu}>{t('nav.info')}</Link></li>
            {isLoggedIn && (
              <li><Link to="/profile" onClick={closeMenu}>{t('nav.profile')}</Link></li>
            )}
            {!isLoggedIn && (
              <li style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="icon-btn login-btn login-btn-with-text"
                  title={t('nav.login')}
                  aria-label={t('nav.login')}
                  aria-expanded={isLoginDropdownOpen}
                  onClick={handleLoginClick}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-in">
                    <path d="m10 17 5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  </svg>
                  <span className="login-text">{t('nav.login', 'Login')}</span>
                </button>
                {isLoginDropdownOpen && (
                  <div className="login-dropdown" style={{ 
                    position: 'absolute',
                    top: '110%',
                    right: isRTL ? 'auto' : 0,
                    left: isRTL ? 0 : 'auto',
                    zIndex: 100000,
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 8,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                    minWidth: 200,
                    width: '100%'
                  }}>
                    <button
                      type="button"
                      onClick={handleLoginAsClient}
                      className="login-dropdown-option"
                    >
                      <span>Login as Client</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLoginForJob}
                      className="login-dropdown-option"
                    >
                      <span>Login for Job</span>
                    </button>
                  </div>
                )}
              </li>
            )}
            {isLoggedIn && (
              <li>
                <button
                  type="button"
                  className="icon-btn logout-btn logout-btn-with-text"
                  title={t('nav.logout')}
                  aria-label={t('nav.logout')}
                  onClick={handleLogout}
                >
                  <span className="logout-text">{t('nav.logout', 'Logout')}</span>
                </button>
              </li>
            )}
          </ul>
        </div>
        <button className="navbar1__backdrop" aria-label="Fermer le menu" onClick={closeMenu}/>
      </div>
    </header>
  );
}

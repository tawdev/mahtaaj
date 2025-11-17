import React, { useState, useEffect, useMemo } from 'react';
import { getServices } from '../api-supabase';
import ServiceCard from '../components/ServiceCard';
import './Home.css';
import './Services.css';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Services() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Suppression du mode gestion - seulement affichage public
  const [selectedService, setSelectedService] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null); // 'menage' | 'cuisine'
  const [selectedSubcategory, setSelectedSubcategory] = useState(null); // e.g. {id,title,icon}
  const [detailSize, setDetailSize] = useState('');
  const [detailPrice, setDetailPrice] = useState(0);

  useEffect(() => {
    // Restore saved language on mount if present
    try {
      const saved = localStorage.getItem('currentLang');
      if (saved && saved !== i18n.language) {
        i18n.changeLanguage(saved);
      }
    } catch {}
    loadServices();
  }, []);

  // Reload services when language changes and persist selection
  useEffect(() => {
    try { localStorage.setItem('currentLang', i18n.language); } catch {}
    loadServices();
  }, [i18n.language]);

  // ProfileCard-like 3D tilt + shine effect on service tiles
  useEffect(() => {
    const cards = document.querySelectorAll('.pcard-tilt');
    const handleMove = (e) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;   // 0..1
      const py = (e.clientY - rect.top) / rect.height;   // 0..1
      const rotateY = (px - 0.5) * 18;
      const rotateX = (0.5 - py) * 18;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      const shine = card.querySelector('.pcard__shine');
      if (shine) {
        const sx = px * 100;
        const sy = py * 100;
        shine.style.background = `radial-gradient(600px circle at ${sx}% ${sy}%, rgba(255,255,255,0.25), transparent 40%)`;
        shine.style.opacity = '1';
      }
    };
    const handleLeave = (e) => {
      const card = e.currentTarget;
      card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
      const shine = card.querySelector('.pcard__shine');
      if (shine) shine.style.opacity = '0';
    };
    cards.forEach((el) => {
      el.addEventListener('mousemove', handleMove);
      el.addEventListener('mouseleave', handleLeave);
    });
    return () => {
      cards.forEach((el) => {
        el.removeEventListener('mousemove', handleMove);
        el.removeEventListener('mouseleave', handleLeave);
      });
    };
  }, [services]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const locale = (i18n.language || 'fr').toString().split(/[-_]/)[0].toLowerCase();
      const data = await getServices(locale);
      console.log('Services API Response:', data);
      const servicesArray = Array.isArray(data) ? data : data.data || [];
      console.log('Services Array:', servicesArray);
      console.log('Services Count:', servicesArray.length);
      setServices(servicesArray);
    } catch (e) {
      console.error('Error loading services:', e);
      setError(t('services_page.loading_error'));
    } finally {
      setLoading(false);
    }
  };

  const serviceTypes = useMemo(() => {
    if (!selectedService) return [];
    // Types spécifiques pour "Ménage à domicile"
    if (selectedService.title === 'Ménage à domicile') {
      return [
        {
          id: 'menage',
          name: t('services_page.service_types.menage.name'),
          description: t('services_page.service_types.menage.description'),
          features: t('services_page.service_types.menage.features')
        },
        {
          id: 'cussin',
          name: t('services_page.service_types.cussin.name'),
          description: t('services_page.service_types.cussin.description'),
          features: t('services_page.service_types.cussin.features')
        }
      ];
    }
    // Par défaut: trois types génériques
    return [
      {
        id: 'standard',
        name: t('services_page.service_types.standard.name'),
        description: t('services_page.service_types.standard.description'),
        features: t('services_page.service_types.standard.features')
      },
      {
        id: 'premium',
        name: t('services_page.service_types.premium.name'),
        description: t('services_page.service_types.premium.description'),
        features: t('services_page.service_types.premium.features')
      },
      {
        id: 'deluxe',
        name: t('services_page.service_types.deluxe.name'),
        description: t('services_page.service_types.deluxe.description'),
        features: t('services_page.service_types.deluxe.features')
      }
    ];
  }, [selectedService, t]);

  const getServiceSlug = (service) => {
    if (service.slug) return service.slug;
    if (service.id) return service.id.toString();
    return (service.name || service.title || '').toLowerCase().replace(/\s+/g, '-');
  };

  const handleSelectService = (service) => {
    const slug = getServiceSlug(service);
    navigate(`/services/${slug}`);
  };

  const handleBackToServices = () => {
    setSelectedService(null);
    setSelectedType(null);
    setSelectedMainCategory(null);
  };

  const handleBackToTypes = () => {
    setSelectedType(null);
  };

  // Prix par m² pour calcul détaillé (exemple cohérent avec Booking.jsx)
  const getPricePerM2 = () => {
    // Bureaux / Usine (service id = 2)
    if (selectedService?.id === 2) {
      if (selectedMainCategory === 'bureaux') return 3.0;
      if (selectedMainCategory === 'usine') return 4.0;
    }
    // Lavage de vitres
    if (selectedService?.id === 3) {
      if (selectedMainCategory === 'interieur') return 2.0;
      if (selectedMainCategory === 'exterieur') return 2.8;
    }
    // Linge des maisons et repassage
    if (selectedService?.id === 4) {
      if (selectedMainCategory === 'lavage') return 1.5;
      if (selectedMainCategory === 'repassage') return 2.2;
    }
    // Airbnb Cleaning
    if (selectedService?.id === 5) {
      if (selectedMainCategory === 'check-in') return 3.0;
      if (selectedMainCategory === 'check-out') return 3.5;
    }
    // Pool Cleaning
    if (selectedService?.id === 6) {
      if (selectedMainCategory === 'standard') return 1.8;
      if (selectedMainCategory === 'profond') return 2.6;
    }
    // Par défaut: Ménage à domicile
    return 2.5;
  };

  useEffect(() => {
    if (detailSize) {
      const n = parseFloat(detailSize);
      const pricePerM2 = getPricePerM2();
      setDetailPrice(Number.isFinite(n) && n > 0 ? n * pricePerM2 : 0);
    } else {
      setDetailPrice(0);
    }
  }, [detailSize, selectedMainCategory]);

  const handleReserveFromDetails = () => {
    if (!selectedService) return;
    
    let prefill = {};
    
    if (selectedService.id === 1 && selectedSubcategory) {
      // Existing logic for menage/cuisine
      prefill = {
        serviceTitle: selectedService.name || selectedService.title,
        message: `${t('services_page.subcategories')}: ${selectedSubcategory.title}${detailSize ? `, ${t('services_page.forms.estimated_surface')}: ${detailSize} m²` : ''}`,
        type: selectedSubcategory.title,
        size: detailSize || '',
        totalPrice: detailPrice || 0,
      };
    } else if (selectedService.id === 2 && selectedMainCategory) {
      // New logic for bureaux/usine
      prefill = {
        serviceTitle: selectedService.name || selectedService.title,
        message: `${t('services_page.forms.details')}: ${selectedMainCategory === 'bureaux' ? t('services_page.categories.bureaux') : t('services_page.categories.usine')}${detailSize ? `, ${t('services_page.forms.estimated_surface')}: ${detailSize} m²` : ''}`,
        type: selectedMainCategory === 'bureaux' ? t('services_page.categories.bureaux') : t('services_page.categories.usine'),
        size: detailSize || '',
        totalPrice: detailPrice || 0,
      };
    } else if ((selectedService.id === 3) && selectedMainCategory) {
      prefill = {
        serviceTitle: selectedService.name || selectedService.title,
        message: `${t('services_page.forms.details')}: ${selectedMainCategory === 'interieur' ? t('services_page.categories.interieur') : t('services_page.categories.exterieur')}${detailSize ? `, ${t('services_page.forms.estimated_surface')}: ${detailSize} m²` : ''}`,
        type: selectedMainCategory === 'interieur' ? t('services_page.categories.interieur') : t('services_page.categories.exterieur'),
        size: detailSize || '',
        totalPrice: detailPrice || 0,
      };
    } else if (selectedService.id === 4 && selectedMainCategory) {
      prefill = {
        serviceTitle: selectedService.name || selectedService.title,
        message: `${t('services_page.forms.details')}: ${selectedMainCategory === 'lavage' ? t('services_page.categories.lavage') : t('services_page.categories.repassage')}${detailSize ? `, ${t('services_page.forms.estimated_surface')}: ${detailSize} m²` : ''}`,
        type: selectedMainCategory === 'lavage' ? t('services_page.categories.lavage') : t('services_page.categories.repassage'),
        size: detailSize || '',
        totalPrice: detailPrice || 0,
      };
    } else if (selectedService.id === 5 && selectedMainCategory) {
      prefill = {
        serviceTitle: selectedService.name || selectedService.title,
        message: `${t('services_page.forms.details')}: ${selectedMainCategory === 'check-in' ? t('services_page.categories.check_in') : t('services_page.categories.check_out')}${detailSize ? `, ${t('services_page.forms.estimated_surface')}: ${detailSize} m²` : ''}`,
        type: selectedMainCategory === 'check-in' ? t('services_page.categories.check_in') : t('services_page.categories.check_out'),
        size: detailSize || '',
        totalPrice: detailPrice || 0,
      };
    } else if (selectedService.id === 6 && selectedMainCategory) {
      prefill = {
        serviceTitle: selectedService.name || selectedService.title,
        message: `${t('services_page.forms.details')}: ${selectedMainCategory === 'standard' ? t('services_page.categories.standard') : t('services_page.categories.profond')}${detailSize ? `, ${t('services_page.forms.estimated_surface')}: ${detailSize} m²` : ''}`,
        type: selectedMainCategory === 'standard' ? t('services_page.categories.standard') : t('services_page.categories.profond'),
        size: detailSize || '',
        totalPrice: detailPrice || 0,
      };
    }
    
    try {
      console.log('Setting prefill data:', prefill);
      localStorage.setItem('booking_prefill', JSON.stringify(prefill));
    } catch {}
    navigate('/booking');
  };

  if (loading) return <div className="loading-state">{t('services_page.loading')}</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <main className="services-page">
      {/* Enhanced modern styles for services page */}
      <style>{`
        /* Modern Grid Layout */
        .grid-2-responsive { 
          display: grid; 
          grid-template-columns: repeat(2, minmax(0, 1fr)); 
          gap: 24px; 
          margin-top: 2rem;
        }
        
        @media (max-width: 768px) { 
          .grid-2-responsive { 
            grid-template-columns: 1fr; 
            gap: 16px;
          } 
        }
        
        /* Enhanced Card Design */
        .card-tile { 
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 20px; 
          padding: 24px; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border: 1px solid rgba(255,255,255,0.2);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer; 
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        /* ProfileCard-like wrapper */
        .pcard {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          background: linear-gradient(135deg, #e6f0ff 0%, #f0f9ff 50%, #e6fffb 100%);
          border: 1px solid rgba(255,255,255,0.35);
          box-shadow: 0 15px 40px rgba(2, 132, 199, 0.15), inset 0 0 0 1px rgba(255,255,255,0.2);
          transform-style: preserve-3d;
          will-change: transform;
          transition: transform 300ms ease, box-shadow 300ms ease, filter 300ms ease;
        }
        .pcard::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(1200px circle at 0% 0%, rgba(59,130,246,0.18), transparent 40%),
                      radial-gradient(1000px circle at 100% 100%, rgba(6,182,212,0.18), transparent 40%);
          pointer-events: none;
          mix-blend-mode: screen;
        }
        .pcard:hover {
          box-shadow: 0 25px 60px rgba(2, 132, 199, 0.25), 0 8px 24px rgba(59,130,246,0.15);
          filter: saturate(1.08);
        }
        .pcard__shine {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 250ms ease;
        }
        .pcard:hover .pcard__shine { opacity: 1; }
        
        .card-tile::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .card-tile:hover { 
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-color: rgba(59, 130, 246, 0.3);
          position: relative;
        }
        
        .card-tile:hover::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
          border-radius: 20px;
          pointer-events: none;
        }
        
        .card-tile:hover::before {
          opacity: 1;
        }
        
        /* Enhanced Typography */
        .card-title { 
          margin: 12px 0 0; 
          font-weight: 700; 
          font-size: 1.25rem;
          color: #1e293b;
          letter-spacing: -0.025em;
          transition: color 0.3s ease;
        }
        
        .card-tile:hover .card-title {
          color: #3b82f6;
        }
        
        /* Smooth Animations */
        .fade-slide { 
          opacity: 0; 
          transform: translateY(20px); 
          animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; 
        }
        
        @keyframes fadeInUp { 
          to { 
            opacity: 1; 
            transform: translateY(0); 
          } 
        }
        
        /* Service Cards Enhancement */
        .service-card-link {
          transition: all 0.3s ease;
          position: relative;
        }
        
        .service-card-link:hover {
          transform: translateY(-2px);
        }
        
        .service-card-link:hover .home-service-card {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-color: rgba(59, 130, 246, 0.3);
        }
        
        .service-card-link:hover .home-service-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
          border-radius: 20px;
          pointer-events: none;
        }
        
        .home-service-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 20px;
          padding: 28px 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border: 1px solid rgba(255,255,255,0.2);
          transition: all 0.4s ease-in-out;
          position: relative;
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        
        .home-service-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .home-service-card:hover {
          transform: translateY(-6px) scale(1.03);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-color: rgba(59, 130, 246, 0.3);
          position: relative;
        }
        
        .home-service-card:hover::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
          border-radius: 20px;
          pointer-events: none;
        }
        
        .home-service-card:hover::before {
          opacity: 1;
        }
        
        /* Strict flip structure */
        .home-service-card { perspective: 1000px; }
        .home-service-card .service-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.8s ease-in-out;
        }
        .home-service-card:hover .service-inner,
        .service-card-link:hover .home-service-card .service-inner,
        .pcard:hover .home-service-card .service-inner {
          transform: rotateY(180deg);
        }
        .home-service-card .service-front,
        .home-service-card .service-back {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100%; height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .home-service-card .service-front {
          z-index: 2;
          transform: rotateY(0deg);
          text-align: center;
        }
        .home-service-card .service-front h3 { 
          font-size: 1.5rem; font-weight: 700; color: #1e293b; letter-spacing: -0.025em; margin: 0;
        }
        .home-service-card .service-back {
          transform: rotateY(180deg);
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(255,255,255,0.9);
          color: #000;
          text-align: center;
        }
        .home-service-card .service-back p { margin: 0; line-height: 1.6; }
        
        .home-service-status {
          margin-top: 16px;
        }
        
        .home-service-status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        
        /* Enhanced Cart Estimate Styles */
        .cart-estimate {
          margin-top: 24px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 16px;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.1);
          max-width: 600px;
          width: 100%;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        
        .cart-estimate::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #06b6d4, #10b981);
        }
        
        .cart-estimate-text {
          margin: 0;
          font-size: 16px;
          line-height: 1.7;
          color: #1e293b;
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: center;
          width: 100%;
          max-width: 100%;
          justify-content: center;
          align-items: center;
        }
        
        .cart-estimate-minimum {
          font-weight: 700;
          color: #1e40af;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 1.1rem;
          width: auto;
          max-width: 100%;
          text-align: center;
        }
        
        .cart-estimate-minimum::before {
          content: "💰";
          font-size: 20px;
          animation: pulse 2s infinite;
          flex-shrink: 0;
        }
        
        .cart-estimate-additional {
          font-weight: 600;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: auto;
          max-width: 100%;
          text-align: center;
        }
        
        .cart-estimate-additional::before {
          content: "⏰";
          font-size: 18px;
          flex-shrink: 0;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        /* Enhanced Button Styles */
        .mode-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: none;
          border-radius: 12px;
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
          min-height: 48px;
          min-width: 140px;
          justify-content: center;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        
        .mode-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .mode-button:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
          text-decoration: none;
        }
        
        .mode-button:hover::before {
          left: 100%;
        }
        
        .mode-button:active {
          transform: translateY(0);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }
        
        .mode-button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        /* Service Details Enhancement */
        .service-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .service-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6);
        }
        
        .service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.15);
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-color: rgba(59, 130, 246, 0.3);
          position: relative;
        }
        
        .service-card:hover::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
          border-radius: 20px;
          pointer-events: none;
        }
        
        /* Form Elements Enhancement */
        .form-label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          font-size: 0.95rem;
        }
        
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #ffffff;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .size-input-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .size-unit {
          font-weight: 600;
          color: #6b7280;
          font-size: 0.9rem;
        }
        
        .price-display {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          margin-top: 16px;
        }
        
        .price-label {
          font-weight: 600;
          color: #374151;
          font-size: 0.95rem;
        }
        
        .price-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #059669;
          margin-left: 8px;
        }
        
        .booking-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          text-decoration: none;
          display: inline-block;
        }
        
        .booking-button:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
          text-decoration: none;
          color: white;
        }
        
        .booking-button:active {
          transform: translateY(0);
        }
        
        /* Enhanced Responsive Design */
        @media (max-width: 768px) {
          .cart-estimate {
            margin-top: 16px;
            padding: 16px 20px;
          }
          
          .cart-estimate-text {
            font-size: 15px;
            gap: 6px;
          }
          
          .cart-estimate-minimum {
            font-size: 1rem;
          }
          
          .cart-estimate-minimum::before,
          .cart-estimate-additional::before {
            font-size: 16px;
          }
          
          .mode-button {
            padding: 12px 16px;
            font-size: 14px;
            min-width: 120px;
            min-height: 44px;
          }
          
          .home-service-card {
            padding: 20px 16px;
          }
          
          .home-service-card h3 {
            font-size: 1.25rem;
          }
          
          .card-tile {
            padding: 20px 16px;
          }
          
          .card-title {
            font-size: 1.1rem;
          }
          
          .service-card {
            padding: 20px 16px;
          }
          
          .booking-button {
            padding: 12px 20px;
            font-size: 0.95rem;
          }
        }
        
        @media (max-width: 480px) {
          .cart-estimate {
            padding: 14px 16px;
          }
          
          .cart-estimate-text {
            font-size: 14px;
          }
          
          .mode-button {
            padding: 10px 14px;
            font-size: 13px;
            min-width: 100px;
            min-height: 40px;
          }
          
          .home-service-card {
            padding: 16px 12px;
          }
          
          .card-tile {
            padding: 16px 12px;
          }
          
          .service-card {
            padding: 16px 12px;
          }
          
          .booking-button {
            padding: 10px 16px;
            font-size: 0.9rem;
          }
        }
        
        /* Loading and Error States Enhancement */
        .loading-state, .error-state {
          text-align: center;
          padding: 60px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 20px;
          margin: 40px auto;
          max-width: 500px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .loading-state {
          color: #3b82f6;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .error-state {
          color: #dc2626;
          font-size: 1.1rem;
          font-weight: 600;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        }
        
        /* Services Grid Enhancement */
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-top: 2rem;
        }
        
        @media (max-width: 768px) {
          .services-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
        
        /* Section Headers Enhancement - Base Styles */
        .services-header {
          text-align: center;
          margin: 0 auto 3rem auto;
          padding: 0;
          width: 100%;
          max-width: 1200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          visibility: visible;
          opacity: 1;
          position: relative;
          z-index: 1;
          box-sizing: border-box;
          overflow: visible;
        }
        
        .services-title-section {
          width: 100%;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          visibility: visible;
          opacity: 1;
          box-sizing: border-box;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .services-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          color: #1e293b;
          margin: 0 auto 16px auto;
          padding: 0;
          letter-spacing: -0.025em;
          background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
          visibility: visible;
          opacity: 1;
          width: 100%;
          max-width: 800px;
          line-height: 1.3;
          text-align: center;
          box-sizing: border-box;
        }
        
        .services-subtitle {
          font-size: 1.2rem;
          color: #64748b;
          margin: 0 auto 24px auto;
          padding: 0;
          font-weight: 500;
          display: block;
          visibility: visible;
          opacity: 1;
          width: 100%;
          max-width: 700px;
          line-height: 1.6;
          text-align: center;
          box-sizing: border-box;
        }
        
        .cart-estimate {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          visibility: visible;
          opacity: 1;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        
        .cart-estimate-text {
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: 100%;
          max-width: 100%;
          text-align: center;
          box-sizing: border-box;
        }
        
        .cart-estimate-minimum,
        .cart-estimate-additional {
          display: flex !important;
          flex-direction: row !important;
          justify-content: center !important;
          align-items: center !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: auto;
          max-width: 100%;
          text-align: center;
          box-sizing: border-box;
        }
        
        /* Mobile/Tablet Responsive Styles - لا تخفي المحتوى */
        @media (max-width: 768px) {
          /* تقليل padding-top من page-transition لصفحة Services في الموبايل */
          .page-transition:has(.services-page),
          .page-transition > .services-page {
            padding-top: 0.5rem !important;
          }
          
          .services-page {
            padding: 0.5rem 12px 20px 12px;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            margin-top: 0 !important;
            padding-top: 0.5rem !important;
          }
          
          .services-header {
            margin: 0 auto 2rem auto;
            padding: 0;
            padding-top: 0.5rem !important;
            margin-top: 0 !important;
            width: 100%;
            max-width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            visibility: visible;
            opacity: 1;
            box-sizing: border-box;
            position: relative;
            z-index: 1;
            overflow: visible;
            min-height: auto;
          }
          
          .services-title-section {
            width: 100%;
            max-width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            visibility: visible;
            opacity: 1;
            box-sizing: border-box;
            margin: 0 auto;
            padding: 0 16px;
            padding-top: 0 !important;
            margin-top: 0 !important;
          }
          
          .services-title,
          h1.services-title {
            font-size: clamp(1.4rem, 5vw, 2.25rem);
            line-height: 1.3;
            margin: 0 auto 12px auto;
            margin-top: 0 !important;
            padding: 0;
            padding-top: 0 !important;
            display: block;
            visibility: visible;
            opacity: 1;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            text-align: center;
            -webkit-text-fill-color: transparent;
          }
          
          .services-subtitle {
            font-size: clamp(0.9rem, 3vw, 1.1rem);
            line-height: 1.5;
            margin: 0 auto 20px auto;
            padding: 0;
            display: block;
            visibility: visible;
            opacity: 1;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            text-align: center;
          }
          
          .cart-estimate {
            max-width: 100%;
            width: 100%;
            margin: 0 auto;
            padding: 18px 16px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            visibility: visible;
            opacity: 1;
            box-sizing: border-box;
            border-radius: 14px;
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.12);
          }
          
          .cart-estimate-text {
            gap: 10px !important;
            text-align: center !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 15px !important;
            line-height: 1.6 !important;
            box-sizing: border-box;
          }
          
          .cart-estimate-minimum {
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            align-items: center !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: auto !important;
            max-width: 100% !important;
            text-align: center !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 1rem !important;
            gap: 8px !important;
            box-sizing: border-box;
          }
          
          .cart-estimate-minimum::before {
            font-size: 18px !important;
          }
          
          .cart-estimate-additional {
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            align-items: center !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: auto !important;
            max-width: 100% !important;
            text-align: center !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 0.95rem !important;
            gap: 8px !important;
            box-sizing: border-box;
          }
          
          .cart-estimate-additional::before {
            font-size: 16px !important;
          }
        }
        
        @media (max-width: 480px) {
          /* تقليل padding-top من page-transition لصفحة Services في الموبايل */
          .page-transition:has(.services-page),
          .page-transition > .services-page {
            padding-top: 0.5rem !important;
          }
          
          .services-page {
            padding: 0.5rem 8px 16px 8px;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            margin-top: 0 !important;
            padding-top: 0.5rem !important;
          }
          
          .services-header {
            padding: 0;
            padding-top: 0.5rem !important;
            margin: 0 auto 1.5rem auto;
            margin-top: 0 !important;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            visibility: visible;
            opacity: 1;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow: visible;
            min-height: auto;
          }
          
          .services-title-section {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            visibility: visible;
            opacity: 1;
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            margin-top: 0 !important;
            padding: 0 12px;
            padding-top: 0 !important;
            box-sizing: border-box;
          }
          
          .services-title,
          h1.services-title {
            font-size: clamp(1.4rem, 6.5vw, 2rem);
            line-height: 1.3;
            margin: 0 auto 10px auto;
            margin-top: 0 !important;
            padding: 0;
            padding-top: 0 !important;
            display: block;
            visibility: visible;
            opacity: 1;
            width: 100%;
            max-width: 100%;
            text-align: center;
            -webkit-text-fill-color: transparent;
            box-sizing: border-box;
          }
          
          .services-subtitle {
            font-size: clamp(0.9rem, 3.5vw, 1rem);
            line-height: 1.5;
            margin: 0 auto 16px auto;
            padding: 0;
            display: block;
            visibility: visible;
            opacity: 1;
            width: 100%;
            max-width: 100%;
            text-align: center;
            box-sizing: border-box;
          }
          
          .cart-estimate {
            padding: 16px 14px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            visibility: visible;
            opacity: 1;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
          }
          
          .cart-estimate-text {
            font-size: 14px !important;
            gap: 8px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            max-width: 100% !important;
            text-align: center !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.6 !important;
            box-sizing: border-box;
          }
          
          .cart-estimate-minimum {
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            align-items: center !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: auto !important;
            max-width: 100% !important;
            text-align: center !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 0.95rem !important;
            gap: 8px !important;
            box-sizing: border-box;
          }
          
          .cart-estimate-minimum::before {
            font-size: 16px !important;
          }
          
          .cart-estimate-additional {
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            align-items: center !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: auto !important;
            max-width: 100% !important;
            text-align: center !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 0.9rem !important;
            gap: 8px !important;
            box-sizing: border-box;
          }
          
          .cart-estimate-additional::before {
            font-size: 15px !important;
          }
        }
        
        /* Services Display Section */
        .services-display-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          width: 100%;
          box-sizing: border-box;
        }
        
        @media (max-width: 768px) {
          .services-display-section {
            padding: 0 16px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box;
          }
        }
        
        @media (max-width: 480px) {
          .services-display-section {
            padding: 0 12px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box;
          }
        }
        
        /* Service Details Section */
        .service-details {
          margin-top: 2rem;
        }
        
        .service-details h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 20px;
        }
        
        /* Enhanced Link Styles */
        .service-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
          width: 100%;
          transition: all 0.3s ease;
        }
        
        .service-card-link:hover {
          text-decoration: none;
          color: inherit;
          transform: translateY(-2px);
        }
        
        /* Additional Hover Effects for Interactive Elements */
        .booking-button:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
          text-decoration: none;
          color: white;
        }
        
        .form-input:hover {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .price-display:hover {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
        }

        /* --- 3D Flip animation on hover (clean structure) --- */
        .service-card { perspective: 1000px; }
        .service-card .service-inner {
          position: relative;
          width: 100%; height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.8s ease-in-out;
        }
        .service-card-link:hover .service-card .service-inner,
        .pcard:hover .service-card .service-inner,
        .service-card:hover .service-inner {
          transform: rotateY(180deg);
        }
        .service-card .service-front,
        .service-card .service-back {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          backface-visibility: hidden; -webkit-backface-visibility: hidden;
          display: flex; align-items: center; justify-content: center;
          border-radius: 12px;
        }
        .service-card .service-front { background:#f9fafb; color:#111; z-index:2; transform: rotateY(0deg); }
        .service-card .service-front h3 { margin:0; font-size:1.5rem; font-weight:700; letter-spacing:-0.025em; color:#1e293b; }
        .service-card .service-back { background:#eaf6ff; color:#111; z-index:1; transform: rotateY(180deg); padding:1rem; text-align:center; }
        .service-card .service-back p { margin:0; line-height:1.6; }
      `}</style>
      <div className="services-header">
        <div className="services-title-section">
          <h1 className="services-title" data-aos="fade-up" data-aos-delay="100">{t('services_page.title')}</h1>
          <p className="services-subtitle" data-aos="fade-up" data-aos-delay="200">{t('services_page.subtitle')}</p>
          <div className="cart-estimate" data-aos="fade-up" data-aos-delay="300">
            <p className="cart-estimate-text">
              <span className="cart-estimate-minimum">{t('services_page.minimum_price')}</span>
              <span className="cart-estimate-additional">{t('services_page.additional_hour')}</span>
            </p>
          </div>
        </div>
        
      </div>

      <div className="services-display-section">
        {!selectedService && (
        <div className="services-grid">
            {services.map((service, index) => (
              <button 
                key={service.id} 
                className="service-card-link"
                onClick={() => handleSelectService(service)}
                data-aos="fade-up" 
                data-aos-delay={`${400 + index * 100}`}
                style={{textAlign:'left'}}
              >
                <div className="pcard pcard-tilt">
                  <ServiceCard 
                    title={service.name || service.title} 
                    description={service.description}
                    isActive={service.is_active}
                  />
                  <span className="pcard__shine" aria-hidden></span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedService && !selectedType && (
          selectedService.title === 'Ménage et cuisine' ? (
            <div className="fade-slide">
              {!selectedMainCategory ? (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{margin:0}}>{t('services_page.main_categories')}</h2>
                    <button className="mode-button" onClick={handleBackToServices} title={t('services_page.back')}>{t('services_page.back')}</button>
                  </div>
                  <div className="grid-2-responsive">
                    <div className="card-tile" onClick={() => setSelectedMainCategory('menage')}>
                      <h3 className="card-title">{t('services_page.categories.menage')}</h3>
                    </div>
                    <div className="card-tile" onClick={() => setSelectedMainCategory('cuisine')}>
                      <h3 className="card-title">{t('services_page.categories.cuisine')}</h3>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{margin:0}}>
                      {selectedMainCategory === 'menage' ? `${t('services_page.subcategories')} – ${t('services_page.categories.menage')}` : `${t('services_page.subcategories')} – ${t('services_page.categories.cuisine')}`}
                    </h2>
                    <button className="mode-button" onClick={() => setSelectedMainCategory(null)} title={t('services_page.back')}>{t('services_page.back')}</button>
                  </div>
                  <div className="grid-2-responsive">
                    {(selectedMainCategory === 'menage' ? [
                      { id:'villa', title: t('services_page.subcategories_menage.villa') },
                      { id:'riad', title: t('services_page.subcategories_menage.riad') },
                      { id:'maison', title: t('services_page.subcategories_menage.maison') },
                      { id:'appartement', title: t('services_page.subcategories_menage.appartement') },
                      { id:'hotel', title: t('services_page.subcategories_menage.hotel') },
                      { id:'resort-hotel', title: t('services_page.subcategories_menage.resort_hotel') },
                    ] : [
                      { id:'italienne', title: t('services_page.subcategories_cuisine.italienne') },
                      { id:'marocaine', title: t('services_page.subcategories_cuisine.marocaine') },
                      { id:'francaise', title: t('services_page.subcategories_cuisine.francaise') },
                      { id:'golfe', title: t('services_page.subcategories_cuisine.golfe') },
                    ]).map((sc, i) => (
                      <Link key={sc.id} className="card-tile" to={`/services/details/${selectedMainCategory}/${sc.id}`}>
                        <h3 className="card-title">{sc.title}</h3>
              </Link>
                    ))}
                  </div>
                  {/* Details now handled on dedicated page */}
                </div>
              )}
            </div>
          ) : selectedService.id === 2 ? (
            <div className="fade-slide">
              {!selectedMainCategory ? (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{margin:0}}>{t('services_page.main_categories')}</h2>
                    <button className="mode-button" onClick={handleBackToServices} title={t('services_page.back')}>{t('services_page.back')}</button>
                  </div>
                  <div className="grid-2-responsive">
                    <div className="card-tile" onClick={() => setSelectedMainCategory('bureaux')}>
                      <h3 className="card-title">{t('services_page.categories.bureaux')}</h3>
                    </div>
                    <div className="card-tile" onClick={() => setSelectedMainCategory('usine')}>
                      <h3 className="card-title">{t('services_page.categories.usine')}</h3>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{margin:0}}>
                      {selectedMainCategory === 'bureaux' ? `${t('services_page.details')} – ${t('services_page.categories.bureaux')}` : `${t('services_page.details')} – ${t('services_page.categories.usine')}`}
                    </h2>
                    <button className="mode-button" onClick={() => setSelectedMainCategory(null)} title={t('services_page.back')}>{t('services_page.back')}</button>
                  </div>
                  
                  <div className="service-card" style={{padding:20}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                      <h3 style={{margin:0}}>{selectedMainCategory === 'bureaux' ? t('services_page.service_details.office_cleaning') : t('services_page.service_details.industrial_cleaning')}</h3>
                    </div>
                    
                    <p style={{color:'#64748b',lineHeight:'1.6',margin:'12px 0'}}>
                      {selectedMainCategory === 'bureaux' 
                        ? t('services_page.service_details.office_description')
                        : t('services_page.service_details.industrial_description')
                      }
                    </p>

                    <div style={{marginTop:16}}>
                      <label className="form-label">{t('services_page.forms.estimated_surface')}</label>
                      <div className="size-input-group">
                        <input 
                          type="number" 
                          min="1" 
                          step="0.5" 
                          className="form-input"
                          placeholder={t('services_page.forms.surface_placeholder')}
                          value={detailSize}
                          onChange={(e)=>setDetailSize(e.target.value)}
                        />
                        <span className="size-unit">m²</span>
                      </div>
                    </div>

                    <div className="price-display" style={{display:'flex', alignItems:'center', gap:8, marginTop:12}}>
                      <span className="price-label">{t('services_page.forms.estimated_price')}</span>
                      <strong className="price-value">{detailPrice.toFixed(2)} DH</strong>
                    </div>

                    <div style={{display:'flex', gap:10, marginTop:16, flexWrap:'wrap'}}>
                      <button className="booking-button" onClick={handleReserveFromDetails}>{t('services_page.forms.reserve')}</button>
                      <button className="mode-button" onClick={() => setSelectedMainCategory(null)}>{t('services_page.back_to_services')}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : selectedService.id === 3 ? (
            <div className="fade-slide">
              {!selectedMainCategory ? (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{margin:0}}>{t('services_page.choose_interior_exterior')}</h2>
                    <button className="mode-button" onClick={handleBackToServices} title={t('services_page.back')}>{t('services_page.back')}</button>
                  </div>
                  <div className="grid-2-responsive">
                    <div className="card-tile" onClick={() => setSelectedMainCategory('interieur')}>
                      <h3 className="card-title">{t('services_page.categories.interieur')}</h3>
                    </div>
                    <div className="card-tile" onClick={() => setSelectedMainCategory('exterieur')}>
                      <h3 className="card-title">{t('services_page.categories.exterieur')}</h3>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{margin:0}}>{selectedMainCategory === 'interieur' ? `${t('services_page.details')} – ${t('services_page.categories.interieur')}` : `${t('services_page.details')} – ${t('services_page.categories.exterieur')}`}</h2>
                    <button className="mode-button" onClick={() => setSelectedMainCategory(null)} title={t('services_page.back')}>{t('services_page.back')}</button>
                  </div>
                  <div className="service-card" style={{padding:20}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                      <h3 style={{margin:0}}>{selectedMainCategory === 'interieur' ? t('services_page.service_details.window_interior') : t('services_page.service_details.window_exterior')}</h3>
                    </div>
                    <p style={{color:'#64748b',lineHeight:'1.6',margin:'12px 0'}}>
                      {selectedMainCategory === 'interieur' 
                        ? t('services_page.service_details.window_interior_description')
                        : t('services_page.service_details.window_exterior_description')}
                    </p>
                    <div style={{marginTop:16}}>
                      <label className="form-label">{t('services_page.forms.estimated_surface')}</label>
                      <div className="size-input-group">
                        <input type="number" min="1" step="0.5" className="form-input" placeholder={t('services_page.forms.surface_placeholder')} value={detailSize} onChange={(e)=>setDetailSize(e.target.value)} />
                        <span className="size-unit">m²</span>
                      </div>
                    </div>
                    <div className="price-display" style={{display:'flex', alignItems:'center', gap:8, marginTop:12}}>
                      <span className="price-label">{t('services_page.forms.estimated_price')}</span>
                      <strong className="price-value">{detailPrice.toFixed(2)} DH</strong>
                    </div>
                    <div style={{display:'flex', gap:10, marginTop:16, flexWrap:'wrap'}}>
                      <button className="booking-button" onClick={handleReserveFromDetails}>{t('services_page.forms.reserve')}</button>
                      <button className="mode-button" onClick={() => setSelectedMainCategory(null)}>{t('services_page.back_to_services')}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : selectedService.id === 4 ? (
            <div className="fade-slide">
              {!selectedMainCategory ? (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{margin:0}}>{t('services_page.choose_laundry_ironing')}</h2>
                    <button className="mode-button" onClick={handleBackToServices} title={t('services_page.back')}>{t('services_page.back')}</button>
                  </div>
                  <div className="grid-2-responsive">
                    <div className="card-tile" onClick={() => setSelectedMainCategory('lavage')}>
                      <h3 className="card-title">{t('services_page.categories.lavage')}</h3>
                    </div>
                    <div className="card-tile" onClick={() => setSelectedMainCategory('repassage')}>
                      <h3 className="card-title">{t('services_page.categories.repassage')}</h3>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{margin:0}}>{selectedMainCategory === 'lavage' ? `${t('services_page.details')} – ${t('services_page.categories.lavage')}` : `${t('services_page.details')} – ${t('services_page.categories.repassage')}`}</h2>
                    <button className="mode-button" onClick={() => setSelectedMainCategory(null)} title={t('services_page.back')}>{t('services_page.back')}</button>
                  </div>
                  <div className="service-card" style={{padding:20}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                      <h3 style={{margin:0}}>{selectedMainCategory === 'lavage' ? t('services_page.service_details.laundry_washing') : t('services_page.service_details.laundry_ironing')}</h3>
                    </div>
                    <p style={{color:'#64748b',lineHeight:'1.6',margin:'12px 0'}}>
                      {selectedMainCategory === 'lavage' 
                        ? t('services_page.service_details.laundry_washing_description')
                        : t('services_page.service_details.laundry_ironing_description')}
                    </p>
                    <div style={{marginTop:16}}>
                      <label className="form-label">{t('services_page.forms.estimated_surface')}</label>
                      <div className="size-input-group">
                        <input type="number" min="1" step="0.5" className="form-input" placeholder={t('services_page.forms.surface_placeholder')} value={detailSize} onChange={(e)=>setDetailSize(e.target.value)} />
                        <span className="size-unit">m²</span>
                      </div>
                    </div>
                    <div className="price-display" style={{display:'flex', alignItems:'center', gap:8, marginTop:12}}>
                      <span className="price-label">{t('services_page.forms.estimated_price')}</span>
                      <strong className="price-value">{detailPrice.toFixed(2)} DH</strong>
                    </div>
                    <div style={{display:'flex', gap:10, marginTop:16, flexWrap:'wrap'}}>
                      <button className="booking-button" onClick={handleReserveFromDetails}>{t('services_page.forms.reserve')}</button>
                      <button className="mode-button" onClick={() => setSelectedMainCategory(null)}>{t('services_page.back_to_services')}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : selectedService.id === 5 ? (
            <div className="fade-slide">
              {!selectedMainCategory ? (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{margin:0}}>{t('services_page.choose_checkin_checkout')}</h2>
                    <button className="mode-button" onClick={handleBackToServices} title={t('services_page.back')}>{t('services_page.back')}</button>
                  </div>
                  <div className="grid-2-responsive">
                    <div className="card-tile" onClick={() => setSelectedMainCategory('check-in')}>
                      <h3 className="card-title">{t('services_page.categories.check_in')}</h3>
                    </div>
                    <div className="card-tile" onClick={() => setSelectedMainCategory('check-out')}>
                      <h3 className="card-title">{t('services_page.categories.check_out')}</h3>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{margin:0}}>{selectedMainCategory === 'check-in' ? `${t('services_page.details')} – ${t('services_page.categories.check_in')}` : `${t('services_page.details')} – ${t('services_page.categories.check_out')}`}</h2>
                    <button className="mode-button" onClick={() => setSelectedMainCategory(null)} title={t('services_page.back')}>{t('services_page.back')}</button>
                  </div>
                  <div className="service-card" style={{padding:20}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                      <h3 style={{margin:0}}>{selectedMainCategory === 'check-in' ? t('services_page.service_details.airbnb_checkin') : t('services_page.service_details.airbnb_checkout')}</h3>
                    </div>
                    <p style={{color:'#64748b',lineHeight:'1.6',margin:'12px 0'}}>
                      {selectedMainCategory === 'check-in' 
                        ? t('services_page.service_details.airbnb_checkin_description')
                        : t('services_page.service_details.airbnb_checkout_description')}
                    </p>
                    <div style={{marginTop:16}}>
                      <label className="form-label">{t('services_page.forms.estimated_surface')}</label>
                      <div className="size-input-group">
                        <input type="number" min="1" step="0.5" className="form-input" placeholder={t('services_page.forms.surface_placeholder')} value={detailSize} onChange={(e)=>setDetailSize(e.target.value)} />
                        <span className="size-unit">m²</span>
                      </div>
                    </div>
                    <div className="price-display" style={{display:'flex', alignItems:'center', gap:8, marginTop:12}}>
                      <span className="price-label">{t('services_page.forms.estimated_price')}</span>
                      <strong className="price-value">{detailPrice.toFixed(2)} DH</strong>
                    </div>
                    <div style={{display:'flex', gap:10, marginTop:16, flexWrap:'wrap'}}>
                      <button className="booking-button" onClick={handleReserveFromDetails}>{t('services_page.forms.reserve')}</button>
                      <button className="mode-button" onClick={() => setSelectedMainCategory(null)}>{t('services_page.back_to_services')}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : selectedService.id === 6 ? (
            <div className="fade-slide">
              {!selectedMainCategory ? (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{margin:0}}>{t('services_page.choose_standard_deep')}</h2>
                    <button className="mode-button" onClick={handleBackToServices} title={t('services_page.back')}>{t('services_page.back')}</button>
                  </div>
                  <div className="grid-2-responsive">
                    <div className="card-tile" onClick={() => setSelectedMainCategory('standard')}>
                      <h3 className="card-title">{t('services_page.categories.standard')}</h3>
                    </div>
                    <div className="card-tile" onClick={() => setSelectedMainCategory('profond')}>
                      <h3 className="card-title">{t('services_page.categories.profond')}</h3>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{margin:0}}>{selectedMainCategory === 'standard' ? `${t('services_page.details')} – ${t('services_page.categories.standard')}` : `${t('services_page.details')} – ${t('services_page.categories.profond')}`}</h2>
                    <button className="mode-button" onClick={() => setSelectedMainCategory(null)} title={t('services_page.back')}>{t('services_page.back')}</button>
                  </div>
                  <div className="service-card" style={{padding:20}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                      <h3 style={{margin:0}}>{selectedMainCategory === 'standard' ? t('services_page.service_details.pool_standard') : t('services_page.service_details.pool_deep')}</h3>
                    </div>
                    <p style={{color:'#64748b',lineHeight:'1.6',margin:'12px 0'}}>
                      {selectedMainCategory === 'standard' 
                        ? t('services_page.service_details.pool_standard_description')
                        : t('services_page.service_details.pool_deep_description')}
                    </p>
                    <div style={{marginTop:16}}>
                      <label className="form-label">{t('services_page.forms.estimated_surface')}</label>
                      <div className="size-input-group">
                        <input type="number" min="1" step="0.5" className="form-input" placeholder={t('services_page.forms.surface_placeholder')} value={detailSize} onChange={(e)=>setDetailSize(e.target.value)} />
                        <span className="size-unit">m²</span>
                      </div>
                    </div>
                    <div className="price-display" style={{display:'flex', alignItems:'center', gap:8, marginTop:12}}>
                      <span className="price-label">{t('services_page.forms.estimated_price')}</span>
                      <strong className="price-value">{detailPrice.toFixed(2)} DH</strong>
                    </div>
                    <div style={{display:'flex', gap:10, marginTop:16, flexWrap:'wrap'}}>
                      <button className="booking-button" onClick={handleReserveFromDetails}>{t('services_page.forms.reserve')}</button>
                      <button className="mode-button" onClick={() => setSelectedMainCategory(null)}>{t('services_page.back_to_services')}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <h2 style={{margin:0}} data-aos="fade-up" data-aos-delay="350">Choisissez un type: {selectedService.name || selectedService.title}</h2>
                <button className="mode-button" onClick={handleBackToServices} title="Retour">← Retour</button>
              </div>
              <div className="services-grid">
                {serviceTypes.map((t, idx) => (
                  <button 
                    key={t.id}
                    className="service-card-link"
                    onClick={() => setSelectedType(t)}
                    data-aos="fade-up" 
                    data-aos-delay={`${400 + idx * 100}`}
                    style={{textAlign:'left'}}
                  >
                    <div className="service-card">
                      <h3 className="service-title">{t.name}</h3>
                      <p className="service-description">{t.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        )}

        {selectedService && selectedType && (
          <div className="service-details" data-aos="fade-up" data-aos-delay="350">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h2 style={{margin:0}}>{selectedService.title} – {selectedType.name}</h2>
              <div style={{display:'flex',gap:8}}>
                <button className="mode-button" onClick={handleBackToTypes} title="Retour aux types">← Types</button>
              </div>
            </div>
            <div className="service-card" style={{padding:20}}>
              <p className="service-description" style={{marginTop:0}}>{selectedType.description}</p>
              {selectedType.features && selectedType.features.length > 0 && (
                <ul style={{margin:'8px 0 0 18px'}}>
                  {selectedType.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
              <div style={{marginTop:16, display:'flex', gap:10, flexWrap:'wrap'}}>
                <Link className="booking-button" to={`/service/${selectedService.id}`}>Voir la fiche service</Link>
                <Link className="booking-button" to={`/booking`}>Réserver ce type</Link>
              </div>
            </div>
        </div>
        )}
      </div>
    </main>
  );
}



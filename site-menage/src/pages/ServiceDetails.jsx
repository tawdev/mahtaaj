import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceById } from '../api-supabase';
import getServiceIcon from '../utils/serviceIcons';
import './ServiceDetails.css';

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [calculator, setCalculator] = useState({
    area: '',
    hours: '',
    calculationType: 'area' // 'area' or 'time'
  });
  
  // Special form state for service 7 (carpets & sofas)
  const [carpetSofaForm, setCarpetSofaForm] = useState({
    serviceType: '', // 'carpets', 'sofas', 'both'
    count: '',
    items: [] // Array of {length: '', width: ''}
  });

  useEffect(() => {
    loadService();
  }, [id]);

  const loadService = async () => {
    try {
      setLoading(true);
      const data = await getServiceById(id);
      setService(data);
    } catch (e) {
      console.error('Error loading service:', e);
      setError('Impossible de charger les détails du service');
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (service?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % service.images.length);
    }
  };

  const prevImage = () => {
    if (service?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + service.images.length) % service.images.length);
    }
  };

  const calculateCost = () => {
    if (!service) return 0;
    
    if (calculator.calculationType === 'area' && calculator.area && service.price_per_m2) {
      return parseFloat(calculator.area) * parseFloat(service.price_per_m2);
    } else if (calculator.calculationType === 'time' && calculator.hours) {
      const hours = parseFloat(calculator.hours);
      if (hours <= 4 && service.price_4h) {
        return parseFloat(service.price_4h);
      } else if (hours > 4 && service.price_4h && service.extra_hour_price) {
        return parseFloat(service.price_4h) + ((hours - 4) * parseFloat(service.extra_hour_price));
      }
    }
    return 0;
  };

  // Handle service type change for carpets/sofas form
  const handleServiceTypeChange = (type) => {
    setCarpetSofaForm({
      serviceType: type,
      count: '',
      items: []
    });
  };

  // Handle count change - generate dynamic fields
  const handleCountChange = (count) => {
    const numCount = parseInt(count) || 0;
    const validCount = Math.min(Math.max(numCount, 0), 10); // Limit to 10
    
    const newItems = Array(validCount).fill(null).map((_, index) => 
      carpetSofaForm.items[index] || { length: '', width: '' }
    );
    
    setCarpetSofaForm({
      ...carpetSofaForm,
      count: validCount > 0 ? validCount.toString() : '',
      items: newItems
    });
  };

  // Handle item dimension change
  const handleItemChange = (index, field, value) => {
    const numValue = parseFloat(value) || '';
    const validValue = numValue === '' ? '' : Math.max(0.1, numValue);
    
    const newItems = [...carpetSofaForm.items];
    newItems[index] = {
      ...newItems[index],
      [field]: validValue
    };
    
    setCarpetSofaForm({
      ...carpetSofaForm,
      items: newItems
    });
  };

  // Calculate total area for carpets/sofas
  const calculateCarpetSofaArea = () => {
    return carpetSofaForm.items.reduce((total, item) => {
      const length = parseFloat(item.length) || 0;
      const width = parseFloat(item.width) || 0;
      return total + (length * width);
    }, 0);
  };

  // Calculate price for carpets/sofas
  const calculateCarpetSofaPrice = () => {
    if (!service || !service.price_per_m2) return 0;
    const totalArea = calculateCarpetSofaArea();
    return totalArea * parseFloat(service.price_per_m2);
  };

  // Check if this is service 7 (carpets & sofas)
  const isCarpetSofaService = service && (service.id === 7 || service.id === '7');

  if (loading) {
    return (
      <div className="service-details-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des détails du service...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="service-details-error">
        <h2>Erreur</h2>
        <p>{error || 'Service non trouvé'}</p>
        <button onClick={() => navigate('/services')} className="back-button">
          Retour aux services
        </button>
      </div>
    );
  }

  return (
    <div className="service-details-page">
      <div className="service-details-container">
        {/* Header */}
        <header className="service-details-header" data-aos="fade-up" data-aos-delay="100">
          <button onClick={() => navigate('/services')} className="back-button">
            ← Retour aux services
          </button>
          <div className="service-header-content">
            <div className="service-icon" data-aos="zoom-in" data-aos-delay="200">
              {getServiceIcon(service)}
            </div>
            <div className="service-title-section">
              <h1 className="service-title" data-aos="fade-up" data-aos-delay="300">
                {service.title}
              </h1>
              <p className="service-description" data-aos="fade-up" data-aos-delay="400">
                {service.description}
              </p>
            </div>
          </div>
        </header>

        <div className="service-details-content">
          {/* Images Carousel */}
          {service.images && service.images.length > 0 && (
            <section className="service-images-section" data-aos="fade-up" data-aos-delay="500">
              <h2 className="section-title">Galerie Photos</h2>
              <div className="image-carousel">
                <div className="carousel-container">
                  <img 
                    src={service.images[currentImageIndex]} 
                    alt={`${service.title} - Image ${currentImageIndex + 1}`}
                    className="carousel-image"
                  />
                  {service.images.length > 1 && (
                    <>
                      <button className="carousel-btn prev-btn" onClick={prevImage}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="carousel-btn next-btn" onClick={nextImage}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                {service.images.length > 1 && (
                  <div className="carousel-dots">
                    {service.images.map((_, index) => (
                      <button
                        key={index}
                        className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Pricing Section */}
          <section className="service-pricing-section" data-aos="fade-up" data-aos-delay="600">
            <h2 className="section-title">Tarifs</h2>
            <div className="pricing-grid">
              {service.price_per_m2 && (
                <div className="pricing-card" data-aos="zoom-in" data-aos-delay="700">
                  <div className="pricing-icon">📐</div>
                  <h3>Au m²</h3>
                  <div className="price">{parseFloat(service.price_per_m2).toFixed(2)} €</div>
                  <p>Prix par mètre carré</p>
                </div>
              )}
              
              {service.price_4h && (
                <div className="pricing-card" data-aos="zoom-in" data-aos-delay="800">
                  <div className="pricing-icon">⏰</div>
                  <h3>4 heures</h3>
                  <div className="price">{parseFloat(service.price_4h).toFixed(2)} €</div>
                  <p>Forfait 4 heures</p>
                </div>
              )}
              
              {service.extra_hour_price && (
                <div className="pricing-card" data-aos="zoom-in" data-aos-delay="900">
                  <div className="pricing-icon">➕</div>
                  <h3>Heure supplémentaire</h3>
                  <div className="price">{parseFloat(service.extra_hour_price).toFixed(2)} €</div>
                  <p>Par heure au-delà de 4h</p>
                </div>
              )}
            </div>
          </section>

          {/* Special Calculator Section for Service 7 (Carpets & Sofas) */}
          {isCarpetSofaService ? (
            <section className="service-calculator-section carpet-sofa-calculator" data-aos="fade-up" data-aos-delay="1000">
              <h2 className="section-title">حاسبة التكلفة</h2>
              <div className="carpet-sofa-form-container">
                {/* Service Type Selection */}
                <div className="service-type-selection">
                  <label className={`service-type-option ${carpetSofaForm.serviceType === 'carpets' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="carpetSofaType"
                      value="carpets"
                      checked={carpetSofaForm.serviceType === 'carpets'}
                      onChange={(e) => handleServiceTypeChange(e.target.value)}
                    />
                    <span className="option-icon">🧶</span>
                    <span className="option-text">سجاد فقط</span>
                  </label>
                  <label className={`service-type-option ${carpetSofaForm.serviceType === 'sofas' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="carpetSofaType"
                      value="sofas"
                      checked={carpetSofaForm.serviceType === 'sofas'}
                      onChange={(e) => handleServiceTypeChange(e.target.value)}
                    />
                    <span className="option-icon">🛋️</span>
                    <span className="option-text">أرائك فقط</span>
                  </label>
                  <label className={`service-type-option ${carpetSofaForm.serviceType === 'both' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="carpetSofaType"
                      value="both"
                      checked={carpetSofaForm.serviceType === 'both'}
                      onChange={(e) => handleServiceTypeChange(e.target.value)}
                    />
                    <span className="option-icon">✨</span>
                    <span className="option-text">سجاد وأرائك معاً</span>
                  </label>
                </div>

                {/* Special Offer Card for "Both" Option */}
                {carpetSofaForm.serviceType === 'both' && (
                  <div className="special-offer-card">
                    <div className="offer-header">
                      <span className="offer-icon">✨</span>
                      <h3>العرض الشامل</h3>
                    </div>
                    <div className="offer-items">
                      <div className="offer-item">
                        <span className="item-icon">🛋️</span>
                        <span className="item-text">6م أرائك</span>
                      </div>
                      <div className="offer-item">
                        <span className="item-icon">🧶</span>
                        <span className="item-text">3 × 2.5م سجاد</span>
                      </div>
                      <div className="offer-item">
                        <span className="item-icon">🛏️</span>
                        <span className="item-text">2 أسرّة مضادة للبكتيريا</span>
                      </div>
                    </div>
                    <div className="offer-price">
                      <span className="price-label">💰 السعر:</span>
                      <span className="price-value">800 د.م</span>
                    </div>
                  </div>
                )}

                {/* Dynamic Form for Carpets or Sofas Only */}
                {(carpetSofaForm.serviceType === 'carpets' || carpetSofaForm.serviceType === 'sofas') && (
                  <div className="dynamic-form-container">
                    <div className="count-input-group">
                      <label htmlFor="item-count">
                        {carpetSofaForm.serviceType === 'carpets' ? '📏 عدد السجاد' : '📏 عدد الأرائك'}
                      </label>
                      <input
                        id="item-count"
                        type="number"
                        min="1"
                        max="10"
                        value={carpetSofaForm.count}
                        onChange={(e) => handleCountChange(e.target.value)}
                        placeholder="أدخل العدد"
                        className="count-input"
                      />
                    </div>

                    {/* Dynamic Items Fields */}
                    {carpetSofaForm.items.length > 0 && (
                      <div className="items-fields-container">
                        {carpetSofaForm.items.map((item, index) => (
                          <div key={index} className="item-field-group">
                            <h4 className="item-title">
                              {carpetSofaForm.serviceType === 'carpets' 
                                ? `السجادة ${index + 1}:` 
                                : `الأريكة ${index + 1}:`}
                            </h4>
                            <div className="dimensions-inputs">
                              <div className="dimension-input">
                                <label>الطول (م):</label>
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={item.length}
                                  onChange={(e) => handleItemChange(index, 'length', e.target.value)}
                                  placeholder="0.0"
                                />
                              </div>
                              <div className="dimension-input">
                                <label>العرض (م):</label>
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={item.width}
                                  onChange={(e) => handleItemChange(index, 'width', e.target.value)}
                                  placeholder="0.0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Calculation Result */}
                    {calculateCarpetSofaArea() > 0 && (
                      <div className="calculation-result-card">
                        <div className="result-item">
                          <span className="result-icon">📐</span>
                          <span className="result-label">المساحة الإجمالية:</span>
                          <span className="result-value">{calculateCarpetSofaArea().toFixed(2)} م²</span>
                        </div>
                        <div className="result-item">
                          <span className="result-icon">💰</span>
                          <span className="result-label">السعر المقدر:</span>
                          <span className="result-value price-value">{calculateCarpetSofaPrice().toFixed(2)} د.م</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          ) : (
            /* Standard Calculator Section for Other Services */
            <section className="service-calculator-section" data-aos="fade-up" data-aos-delay="1000">
              <h2 className="section-title">Calculateur de coût</h2>
              <div className="calculator-container">
                <div className="calculator-inputs">
                  <div className="calculation-type">
                    <label>
                      <input
                        type="radio"
                        name="calculationType"
                        value="area"
                        checked={calculator.calculationType === 'area'}
                        onChange={(e) => setCalculator({...calculator, calculationType: e.target.value, hours: ''})}
                      />
                      Calcul par surface
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="calculationType"
                        value="time"
                        checked={calculator.calculationType === 'time'}
                        onChange={(e) => setCalculator({...calculator, calculationType: e.target.value, area: ''})}
                      />
                      Calcul par temps
                    </label>
                  </div>

                  {calculator.calculationType === 'area' && service.price_per_m2 && (
                    <div className="input-group">
                      <label htmlFor="area">Surface (m²)</label>
                      <input
                        id="area"
                        type="number"
                        min="1"
                        step="0.1"
                        value={calculator.area}
                        onChange={(e) => setCalculator({...calculator, area: e.target.value})}
                        placeholder="Entrez la surface"
                      />
                    </div>
                  )}

                  {calculator.calculationType === 'time' && (
                    <div className="input-group">
                      <label htmlFor="hours">Durée (heures)</label>
                      <input
                        id="hours"
                        type="number"
                        min="1"
                        step="0.5"
                        value={calculator.hours}
                        onChange={(e) => setCalculator({...calculator, hours: e.target.value})}
                        placeholder="Entrez la durée"
                      />
                    </div>
                  )}
                </div>

                <div className="calculator-result">
                  <h3>Coût estimé</h3>
                  <div className="estimated-cost">
                    {calculateCost() > 0 ? `${calculateCost().toFixed(2)} €` : '-- €'}
                  </div>
                  {calculateCost() > 0 && (
                    <p className="cost-breakdown">
                  {calculator.calculationType === 'area' && service.price_per_m2 && (
                    `${calculator.area} m² × ${parseFloat(service.price_per_m2).toFixed(2)} € = ${calculateCost().toFixed(2)} €`
                  )}
                  {calculator.calculationType === 'time' && calculator.hours && (
                    (() => {
                      const hours = parseFloat(calculator.hours);
                      if (hours <= 4) {
                        return `Forfait 4h : ${parseFloat(service.price_4h).toFixed(2)} €`;
                      } else {
                        return `4h (${parseFloat(service.price_4h).toFixed(2)} €) + ${hours - 4}h × ${parseFloat(service.extra_hour_price).toFixed(2)} € = ${calculateCost().toFixed(2)} €`;
                      }
                    })()
                  )}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* CTA Section */}
          <section className="service-cta-section" data-aos="fade-up" data-aos-delay="1100">
            <div className="cta-content">
              <h2>Intéressé par ce service ?</h2>
              <p>Contactez-nous pour obtenir un devis personnalisé ou réservez directement en ligne.</p>
              <div className="cta-buttons">
                <button 
                  onClick={() => navigate('/booking')} 
                  className="cta-button primary"
                >
                  Réserver maintenant
                </button>
                <button 
                  onClick={() => navigate('/contact')} 
                  className="cta-button secondary"
                >
                  Demander un devis
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

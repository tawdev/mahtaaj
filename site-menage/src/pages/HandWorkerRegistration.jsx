import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateHandWorkerCategories } from '../services/handWorkerTranslation';
import './HandWorkerRegistration.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function HandWorkerRegistration() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    category_id: '',
    address: '',
    city: '',
    photo: null,
    work_samples: [],
    bio: '',
    experience_years: 0,
  });

  const [formErrors, setFormErrors] = useState({});
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  // Recharger les catégories quand la langue change
  useEffect(() => {
    if (categories.length > 0) {
      const currentLanguage = i18n.language || 'fr';
      const translatedCategories = translateHandWorkerCategories(categories, currentLanguage);
      setCategories(translatedCategories);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/hand-worker-categories`);
      const data = await response.json();
      
      if (data.success) {
        const currentLanguage = i18n.language || 'fr';
        const translatedCategories = translateHandWorkerCategories(data.data, currentLanguage);
        setCategories(translatedCategories);
      } else {
        setError(t('hand_worker_registration.loading_error'));
      }
    } catch (e) {
      console.error('Error loading categories:', e);
      setError(t('hand_worker_registration.loading_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    
    if (name === 'photo') {
      setFormData(prev => ({ ...prev, [name]: files[0] || null }));
    } else if (name === 'work_samples') {
      setFormData(prev => ({ ...prev, [name]: Array.from(files) }));
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(t('hand_worker_registration.geolocation_not_supported') || 'Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // استخدام OpenStreetMap Nominatim API لتحويل الإحداثيات إلى عنوان
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=${i18n.language || 'en'}`,
            {
              headers: {
                'User-Agent': 'NettoyageApp/1.0'
              }
            }
          );
          
          const data = await response.json();
          
          if (data && data.address) {
            const addressParts = [];
            
            // بناء العنوان من بيانات OSM
            if (data.address.road) addressParts.push(data.address.road);
            if (data.address.house_number) addressParts.push(data.address.house_number);
            if (data.address.suburb || data.address.neighbourhood) {
              addressParts.push(data.address.suburb || data.address.neighbourhood);
            }
            if (data.address.city || data.address.town || data.address.village) {
              addressParts.push(data.address.city || data.address.town || data.address.village);
            }
            if (data.address.state || data.address.region) {
              addressParts.push(data.address.state || data.address.region);
            }
            
            const fullAddress = addressParts.join(', ') || data.display_name || '';
            
            if (fullAddress) {
              setFormData(prev => ({ 
                ...prev, 
                address: fullAddress,
                city: data.address.city || data.address.town || data.address.village || prev.city
              }));
            } else {
              setError(t('hand_worker_registration.location_not_found') || 'Could not determine address from location');
            }
          } else {
            setError(t('hand_worker_registration.location_not_found') || 'Could not determine address from location');
          }
        } catch (error) {
          console.error('Error fetching address:', error);
          setError(t('hand_worker_registration.location_error') || 'Error fetching location address');
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = t('hand_worker_registration.location_error') || 'Error getting location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('hand_worker_registration.location_permission_denied') || 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('hand_worker_registration.location_unavailable') || 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = t('hand_worker_registration.location_timeout') || 'Location request timeout';
            break;
        }
        
        setError(errorMessage);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.full_name.trim()) {
      errors.full_name = t('hand_worker_registration.full_name_required');
    }

    if (!formData.email.trim()) {
      errors.email = t('hand_worker_registration.email_required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('hand_worker_registration.email_invalid');
    }

    if (!formData.phone.trim()) {
      errors.phone = t('hand_worker_registration.phone_required');
    }

    if (!formData.category_id) {
      errors.category_id = t('hand_worker_registration.category_required');
    }

    if (formData.experience_years < 0) {
      errors.experience_years = t('hand_worker_registration.experience_invalid');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'work_samples') {
          formData.work_samples.forEach((file, index) => {
            formDataToSend.append(`work_samples[${index}]`, file);
          });
        } else if (key === 'photo' && formData[key]) {
          formDataToSend.append('photo', formData[key]);
        } else if (key === 'experience_years') {
          // Always include experience_years even if 0
          formDataToSend.append(key, formData[key]);
        } else if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/hand-worker-registrations`, {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Reset form
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          category_id: '',
          address: '',
          city: '',
          photo: null,
          work_samples: [],
          bio: '',
          experience_years: 0,
        });
      } else {
        if (data.errors) {
          setFormErrors(data.errors);
        } else {
          setError(data.message || t('hand_worker_registration.submission_error'));
        }
      }
    } catch (e) {
      console.error('Error submitting registration:', e);
      setError(t('hand_worker_registration.submission_error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="employee-register">
      <div className="form-card">
        <div className="loading-state">{t('hand_worker_registration.loading')}</div>
      </div>
    </div>
  );
  if (error && !submitting && !success) {
    return (
      <div className="employee-register">
        <div className="form-card">
          <div className="alert error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="employee-register"
      style={{
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {success && (
        <div className="er-overlay" role="dialog" aria-modal="true">
          <div className="er-modal" data-aos="fade-in">
            <div className="er-check" aria-hidden>✅</div>
            <h3 className="er-title">{t('hand_worker_registration.success_title')}</h3>
            <p>{t('hand_worker_registration.success_message')}</p>
            <div className="er-actions">
              <button type="button" className="er-close" onClick={() => window.location.href = '/'}>{t('hand_worker_registration.back_to_home')}</button>
            </div>
          </div>
        </div>
      )}
      <div className="form-card" data-aos="fade-up">
        <h1>{t('hand_worker_registration.title')}</h1>
        <p className="subtitle">{t('hand_worker_registration.subtitle')}</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>{t('hand_worker_registration.full_name')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 16.7909 14.2091 15 12 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className={formErrors.full_name ? 'error' : ''}
                placeholder={t('hand_worker_registration.full_name_placeholder')}
                required
              />
            </div>
            {formErrors.full_name && <span className="error-message">{formErrors.full_name}</span>}
          </div>
          <div className="form-group">
            <label>{t('hand_worker_registration.email')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6H20C21.1046 6 22 6.89543 22 8V16C22 17.1046 21.1046 18 20 18H4C2.89543 18 2 17.1046 2 16V8C2 6.89543 2.89543 6 4 6Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M22 8L12.971 13.514C12.3681 13.8847 11.6319 13.8847 11.029 13.514L2 8" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={formErrors.email ? 'error' : ''}
                placeholder={t('hand_worker_registration.email_placeholder')}
                required
              />
            </div>
            {formErrors.email && <span className="error-message">{formErrors.email}</span>}
          </div>
          <div className="form-group">
            <label>{t('hand_worker_registration.phone')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.73 19.73 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.12.89.3 1.76.54 2.59a2 2 0 0 1-.45 2.11l-.7.7a16 16 0 0 0 6.88 6.88l.7-.7a2 2 0 0 1 2.11-.45c.83.24 1.7.42 2.59.54A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={formErrors.phone ? 'error' : ''}
                placeholder={t('hand_worker_registration.phone_placeholder')}
                required
              />
            </div>
            {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
          </div>
          <div className="form-group">
            <label>{t('hand_worker_registration.experience_years')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleInputChange}
                className={formErrors.experience_years ? 'error' : ''}
                min="0"
                max="50"
                required
              />
            </div>
            {formErrors.experience_years && <span className="error-message">{formErrors.experience_years}</span>}
          </div>
          <div className="form-group full">
            <label>{t('hand_worker_registration.category')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className={formErrors.category_id ? 'error' : ''}
                required
              >
                <option value="">{t('hand_worker_registration.select_category')}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            {formErrors.category_id && <span className="error-message">{formErrors.category_id}</span>}
          </div>
          <div className="form-group full">
            <label>{t('hand_worker_registration.bio')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="4"
                placeholder={t('hand_worker_registration.bio_placeholder')}
                style={{width: '100%', padding: '12px', borderRadius: '8px', border: 'none', fontFamily: 'inherit', background: 'transparent', color: '#ffffff', resize: 'vertical'}}
              />
            </div>
          </div>
          <div className="form-group">
            <label>{t('hand_worker_registration.address')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21C12 21 5 14.9706 5 10.5C5 7.46243 7.46243 5 10.5 5C13.5376 5 16 7.46243 16 10.5C16 14.9706 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10.5" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder={t('hand_worker_registration.address_placeholder')}
              />
              <button
                type="button"
                className="location-btn"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                title={t('hand_worker_registration.get_location') || 'Get current location'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V4M12 20V22M4 12H2M22 12H20M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {gettingLocation ? t('employee_register.form.locating') : t('employee_register.form.locate')}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>{t('hand_worker_registration.city')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21C12 21 5 14.9706 5 10.5C5 7.46243 7.46243 5 10.5 5C13.5376 5 16 7.46243 16 10.5C16 14.9706 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10.5" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder={t('hand_worker_registration.city_placeholder')}
              />
            </div>
          </div>
          <div className="form-group">
            <label>{t('hand_worker_registration.photo')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 15L8 10L14 16L17 13L21 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input
                type="file"
                name="photo"
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
            <small style={{fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', display: 'block'}}>{t('hand_worker_registration.photo_help')}</small>
          </div>
          <div className="form-group">
            <label>{t('hand_worker_registration.work_samples')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 15L8 10L14 16L17 13L21 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input
                type="file"
                name="work_samples"
                onChange={handleFileChange}
                accept="image/*"
                multiple
              />
            </div>
            <small style={{fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', display: 'block'}}>{t('hand_worker_registration.work_samples_help')}</small>
          </div>

          <div className="actions">
            <button type="submit" className="submit-button" disabled={submitting}>
              <span className="btn-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {submitting ? t('hand_worker_registration.submitting') : t('hand_worker_registration.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

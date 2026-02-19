import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { translateHandWorkerCategories } from '../services/handWorkerTranslation';
import { supabase } from '../lib/supabase';
import { CITY_QUARTIERS } from '../constants/cities';
import LocationPicker from '../components/LocationPicker/LocationPicker';
import './HandWorkerRegistration.css';

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
    latitude: null,
    longitude: null,
    location_address: '',
    photo: null,
    work_samples: [],
    bio: '',
    experience_years: 0,
    employee_type: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [availableQuartiers, setAvailableQuartiers] = useState([]);

  const handleLocationSelect = ({ lat, lng, address }) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location_address: address
    }));
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('[HandWorkerRegistration] Loading categories from Supabase');

      const { data, error } = await supabase
        .from('hand_worker_categories')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });

      if (error) {
        console.error('[HandWorkerRegistration] Error loading categories:', error);
        setError(t('hand_worker_registration.loading_error') || 'Erreur lors du chargement des catégories. Veuillez réessayer.');
        return;
      }

      console.log('[HandWorkerRegistration] Loaded categories:', data?.length || 0);

      if (data && Array.isArray(data) && data.length > 0) {
        const currentLanguage = i18n.language || 'fr';
        const translatedCategories = translateHandWorkerCategories(data, currentLanguage);
        setCategories(translatedCategories);
      } else {
        setCategories([]);
        console.warn('[HandWorkerRegistration] No categories found');
      }
    } catch (e) {
      console.error('[HandWorkerRegistration] Exception loading categories:', e);
      setError(t('hand_worker_registration.loading_error') || 'Erreur lors du chargement des catégories. Veuillez réessayer.');
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

    if (!formData.latitude || !formData.longitude) {
      errors.location = t('hand_worker_registration.location_required') || 'الموقع مطلوب';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Recharger les catégories quand la langue change (restored)
  useEffect(() => {
    if (categories.length > 0) {
      const currentLanguage = i18n.language || 'fr';
      const translatedCategories = translateHandWorkerCategories(categories, currentLanguage);
      setCategories(translatedCategories);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (submitting) {
      console.warn('[HandWorkerRegistration] Submission already in progress, ignoring duplicate submit');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('[HandWorkerRegistration] Submitting registration to Supabase');

      // Upload photo to Supabase Storage if provided
      let photoUrl = null;
      if (formData.photo) {
        try {
          const photoFile = formData.photo;
          const fileName = `hand_worker_${Date.now()}_${Math.random().toString(36).substring(7)}.${photoFile.name.split('.').pop()}`;

          console.log('[HandWorkerRegistration] Uploading photo:', fileName);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('employees')
            .upload(fileName, photoFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('[HandWorkerRegistration] Photo upload error:', uploadError);
            throw new Error('Erreur lors du téléchargement de la photo: ' + uploadError.message);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('employees')
            .getPublicUrl(fileName);

          photoUrl = publicUrl;
          console.log('[HandWorkerRegistration] Photo uploaded successfully:', photoUrl);
        } catch (uploadErr) {
          console.error('[HandWorkerRegistration] Error uploading photo:', uploadErr);
          setError('Erreur lors du téléchargement de la photo: ' + uploadErr.message);
          setSubmitting(false);
          return;
        }
      }

      // Prepare data for Supabase hand_worker_employees table
      const [firstName, ...lastNameParts] = (formData.full_name || '').split(' ');
      const lastName = lastNameParts.join(' ') || '';

      // Build worker data object for hand_worker_employees table
      const workerData = {
        first_name: (firstName || formData.full_name || '').trim(),
        last_name: (lastName || '').trim(),
        email: (formData.email || '').trim() || null,
        phone: (formData.phone || '').trim() || null,
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        location_address: formData.location_address,
        address: formData.location_address, // Fallback
        photo: photoUrl || null,
        photo_url: photoUrl || null,
        bio: (formData.bio || '').trim() || null,
        experience_years: parseInt(formData.experience_years, 10) || 0,
        employee_type: formData.employee_type || null,
        status: 'pending', // New registrations start as pending
        is_available: false // Not available until approved
      };

      // Remove null/empty string values for optional fields to avoid issues
      Object.keys(workerData).forEach(key => {
        if (workerData[key] === '' || workerData[key] === undefined) {
          if (key !== 'experience_years' && key !== 'status' && key !== 'is_available' && key !== 'employee_type') {
            workerData[key] = null;
          }
        }
      });

      console.log('[HandWorkerRegistration] Inserting worker data to hand_worker_employees:', JSON.stringify(workerData, null, 2));

      const { data, error } = await supabase
        .from('hand_worker_employees')
        .insert([workerData])
        .select();

      if (error) {
        console.error('[HandWorkerRegistration] Error inserting worker:', error);

        // Handle specific error cases
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          throw new Error('Un enregistrement avec ces informations existe déjà. Veuillez vérifier vos données.');
        } else if (error.code === '23503' || error.message?.includes('foreign key')) {
          throw new Error('La catégorie sélectionnée n\'est pas valide.');
        } else {
          throw new Error(error.message || 'Erreur lors de l\'enregistrement. Veuillez réessayer.');
        }
      }

      if (!data || data.length === 0) {
        throw new Error('Aucune donnée retournée après l\'enregistrement');
      }

      console.log('[HandWorkerRegistration] Worker registered successfully:', data);
      setSuccess(true);

      // Reset form
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        category_id: '',
        latitude: null,
        longitude: null,
        location_address: '',
        photo: null,
        work_samples: [],
        bio: '',
        experience_years: 0,
        employee_type: '',
      });
    } catch (e) {
      console.error('[HandWorkerRegistration] Error submitting registration:', e);
      setError(e.message || t('hand_worker_registration.submission_error') || 'Erreur lors de l\'enregistrement');
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
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
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
            <h3 className="er-title">{t('hand_worker_registration.success_title', 'Inscription réussie !')}</h3>
            <p>{t('hand_worker_registration.success_message', 'Votre demande a été envoyée avec succès. Nous examinerons votre profil et vous contacterons bientôt.')}</p>
            <div className="er-actions">
              <button type="button" className="er-close" onClick={() => window.location.href = '/'}>{t('hand_worker_registration.back_to_home', 'Retour à l\'accueil')}</button>
            </div>
          </div>
        </div>
      )}
      {/* Back Button Container */}
      <div className="back-button-container">
        <Link
          to="/employees/register"
          className="hand-workers-back-button"
          title={i18n.language === 'ar' ? 'العودة' : i18n.language === 'fr' ? 'Retour' : 'Back'}
        >
          {i18n.language === 'ar' ? '← العودة' :
            i18n.language === 'fr' ? '← Retour' :
              '← Back'}
        </Link>
      </div>
      <div className="form-card" data-aos="fade-up">
        <h1>{t('hand_worker_registration.title', 'Inscription des Artisans')}</h1>
        <p className="subtitle">{t('hand_worker_registration.subtitle', 'Rejoignez notre réseau d\'artisans qualifiés')}</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>{t('employee_register.form.full_name', 'Nom Complet')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 16.7909 14.2091 15 12 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className={formErrors.full_name ? 'error' : ''}
                placeholder={t('hand_worker_registration.full_name_placeholder', 'Votre nom complet')}
                required
              />
            </div>
            {formErrors.full_name && <span className="error-message">{formErrors.full_name}</span>}
          </div>
          <div className="form-group">
            <label>{t('employee_register.form.email', 'Adresse Email')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6H20C21.1046 6 22 6.89543 22 8V16C22 17.1046 21.1046 18 20 18H4C2.89543 18 2 17.1046 2 16V8C2 6.89543 2.89543 6 4 6Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M22 8L12.971 13.514C12.3681 13.8847 11.6319 13.8847 11.029 13.514L2 8" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={formErrors.email ? 'error' : ''}
                placeholder={t('hand_worker_registration.email_placeholder', 'votre@email.com')}
                required
              />
            </div>
            {formErrors.email && <span className="error-message">{formErrors.email}</span>}
          </div>
          <div className="form-group">
            <label>{t('hand_worker_registration.phone', 'Téléphone')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.73 19.73 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.12.89.3 1.76.54 2.59a2 2 0 0 1-.45 2.11l-.7.7a16 16 0 0 0 6.88 6.88l.7-.7a2 2 0 0 1 2.11-.45c.83.24 1.7.42 2.59.54A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={formErrors.phone ? 'error' : ''}
                placeholder={t('hand_worker_registration.phone_placeholder', '+212...')}
                required
              />
            </div>
            {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
          </div>
          <div className="form-group">
            <label>{t('hand_worker_registration.experience_years', 'Années d\'expérience')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
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
            <label>{t('hand_worker_registration.category', 'Catégorie')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className={formErrors.category_id ? 'error' : ''}
                required
              >
                <option value="">{t('hand_worker_registration.select_category', 'Sélectionnez une catégorie')}</option>
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
            <label>{t('hand_worker_registration.employee_type', 'Type d\'artisan')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 16.7909 14.2091 15 12 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <select
                name="employee_type"
                value={formData.employee_type}
                onChange={handleInputChange}
                className={formErrors.employee_type ? 'error' : ''}
                required
              >
                <option value="">{t('hand_worker_registration.select_employee_type', 'Sélectionnez le type')}</option>
                <option value="عامل">{t('hand_worker_registration.employee_type_worker', 'Ouvrier / Artisan')}</option>
                <option value="مساعد">{t('hand_worker_registration.employee_type_assistant', 'Assistant / Apprenti')}</option>
              </select>
            </div>
            {formErrors.employee_type && <span className="error-message">{formErrors.employee_type}</span>}
          </div>
          <div className="form-group full">
            <label>{t('hand_worker_registration.bio', 'Biographie / Description')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="4"
                placeholder={t('hand_worker_registration.bio_placeholder', 'Décrivez votre expérience et vos compétences...')}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', fontFamily: 'inherit', background: 'transparent', color: '#1e293b', resize: 'vertical' }}
              />
            </div>
          </div>
          <div className="form-group full">
            <label style={{ marginBottom: '15px', display: 'block' }}>
              {t('employees.register.location_label', 'Localisation (GPS)')}
            </label>
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null}
            />
            {formData.location_address && (
              <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#64748b' }}>
                <strong>{t('employee_register.form.selected_address', 'Adresse sélectionnée:')}</strong> {formData.location_address}
              </div>
            )}
            {formErrors.location && <span className="error-message">{formErrors.location}</span>}
          </div>
          <div className="form-group">
            <label>{t('hand_worker_registration.photo', 'Photo de profil')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M3 15L8 10L14 16L17 13L21 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <input
                type="file"
                name="photo"
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
            <small style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>{t('hand_worker_registration.photo_help', 'Format JPG ou PNG')}</small>
          </div>
          <div className="form-group">
            <label>{t('hand_worker_registration.work_samples', 'Exemples de travaux')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M3 15L8 10L14 16L17 13L21 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            <small style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>{t('hand_worker_registration.work_samples_help', 'Vous pouvez sélectionner plusieurs images')}</small>
          </div>

          <div className="actions">
            <button type="submit" className="submit-button" disabled={submitting}>
              <span className="btn-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {submitting ? t('employee_register.buttons.submitting', 'Envoi en cours...') : t('employee_register.buttons.submit_handworker', 'S\'inscrire')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

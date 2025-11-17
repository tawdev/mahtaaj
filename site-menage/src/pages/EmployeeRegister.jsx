import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiCheck } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import './EmployeeRegister.css';

export default function EmployeeRegister() {
  const { t } = useTranslation();
  
  // Define day keys for internal use
  const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  // Get translated day names
  const DAYS = DAY_KEYS.map(key => t(`employee_register.days.${key}`));
  const [form, setForm] = useState({
    name: '', prenom: '', birth_date: '', age: '', email: '', phone: '', adresse: '', competency_id: '', photo: null, auto_entrepreneur: '', last_experience: '', company_name: '', preferred_work_time: ''
  });
  const [services, setServices] = useState([]);
  const [days, setDays] = useState({}); // { lundi: { checked:true, start:'', end:'' }, ... }
  const [lastSelectedHours, setLastSelectedHours] = useState(null); // { start:'09:00', end:'18:00' }
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [timeErrors, setTimeErrors] = useState({});
  const { i18n } = useTranslation();

  useEffect(() => {
    (async () => {
      try {
        console.log('[EmployeeRegister] Loading services from Supabase');
        
        // Load services from Supabase
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('order', { ascending: true });
        
        if (error) {
          console.error('[EmployeeRegister] Error loading services:', error);
          setServices([]);
          return;
        }
        
        console.log('[EmployeeRegister] Loaded services:', data?.length || 0);
        setServices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('[EmployeeRegister] Exception loading services:', err);
        setServices([]);
      }
    })();
  }, [i18n.language]);

  // Calculate age from birth date
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return '';
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age.toString() : '';
  };

  // Auto-calculate age when birth_date changes
  useEffect(() => {
    if (form.birth_date) {
      const calculatedAge = calculateAge(form.birth_date);
      setForm(prev => ({ ...prev, age: calculatedAge }));
    } else {
      setForm(prev => ({ ...prev, age: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.birth_date]);

  const getServiceDisplayTitle = (service) => {
    if (!service || typeof service !== 'object') return '';
    const lang = (i18n.language || 'fr').toString().split(/[-_]/)[0].toLowerCase();

    const pick = (obj, keys) => {
      for (const k of keys) {
        if (obj[k]) return obj[k];
      }
      return '';
    };

    if (lang === 'ar') {
      const val = pick(service, ['name_ar','nameAr','title_ar','titleAr']);
      if (val) return val;
    }
    if (lang === 'fr') {
      const val = pick(service, ['name_fr','nameFr','title_fr','titleFr']);
      if (val) return val;
    }
    if (lang === 'en') {
      const val = pick(service, ['name_en','nameEn','title_en','titleEn']);
      if (val) return val;
    }

    // Fallbacks: try DB generic, then any server-provided translated title, then last resorts
    const generic = pick(service, ['name','title']);
    if (generic) return generic;
    if (service.translated_title) return service.translated_title;

    // Last resort: try i18n by slug
    if (service.slug) {
      const key = `services.${service.slug}.title`;
      const translated = t(key, { defaultValue: '' });
      if (translated && translated !== key && translated.trim() !== '') return translated;
    }

    return '';
  };

  const selectedDaysPayload = useMemo(() => {
    // Build object: { lundi: {start, end}, mardi: {start, end} }
    // Laravel expects French day names
    const dayMapping = {
      'monday': 'lundi',
      'tuesday': 'mardi',
      'wednesday': 'mercredi',
      'thursday': 'jeudi',
      'friday': 'vendredi',
      'saturday': 'samedi',
      'sunday': 'dimanche'
    };
    
    const out = {};
    for (const key of DAY_KEYS) {
      const d = days[key];
      if (d?.checked && d.start && d.end) {
        const frenchDayName = dayMapping[key] || key;
        out[frenchDayName] = { start: d.start, end: d.end };
      }
    }
    return out;
  }, [days]);

  const handleDayToggle = (dayIndex) => {
    const key = DAY_KEYS[dayIndex];
    setDays(prev => {
      const currentlyChecked = !!prev[key]?.checked;
      if (currentlyChecked) {
        // Uncheck -> remove values
        const next = { ...prev };
        next[key] = { checked: false };
        return next;
      }
      // Check -> prefill with lastSelectedHours if exists
      const prefill = lastSelectedHours ? { start: lastSelectedHours.start, end: lastSelectedHours.end } : { start: '', end: '' };
      return {
        ...prev,
        [key]: { checked: true, ...prefill }
      };
    });
  };

  const handleUseLocation = async () => {
    try {
      setIsLocating(true);
      setError(null);
      if (!navigator.geolocation) {
        throw new Error(t('employee_register.location.not_supported'));
      }
      const coords = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          (err) => reject(new Error(t('employee_register.location.error'))),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
      // Reverse geocoding via Nominatim (public OSM)
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}` , { headers: { 'Accept': 'application/json' }});
      const data = await res.json();
      const display = data?.display_name || `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`;
      setForm(prev => ({ ...prev, adresse: display }));
    } catch (e) {
      setError(e.message || t('employee_register.location.location_error'));
    } finally {
      setIsLocating(false);
    }
  };

  const validateTime = (day, startTime, endTime) => {
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      if (end <= start) {
        setTimeErrors(prev => ({ ...prev, [day]: t('employee_register.validation.end_time_after_start') }));
        return false;
      } else {
        setTimeErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[day];
          return newErrors;
        });
        return true;
      }
    }
    return true;
  };

  const handleTimeChange = (dayIndex, field, value) => {
    const key = DAY_KEYS[dayIndex];
    setDays(prev => {
      const next = {
        ...prev,
        [key]: { ...(prev[key] || { checked: true }), [field]: value }
      };
      const cur = next[key] || {};
      if (cur.start && cur.end) {
        setLastSelectedHours({ start: cur.start, end: cur.end });
        // Validate time
        validateTime(key, cur.start, cur.end);
      }
      return next;
    });
  };

  const validate = () => {
    if (!form.name || !form.prenom || !form.birth_date || !form.age || !form.email || !form.adresse || !form.competency_id) return t('employee_register.validation.all_fields_required');
    // Only require days if preferred_work_time is not selected
    if (!form.preferred_work_time && Object.keys(selectedDaysPayload).length === 0) return t('employee_register.validation.select_at_least_one_day');
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null); setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    try {
      setSubmitting(true);
      
      // Upload photo to Supabase Storage if provided
      let photoUrl = '';
      if (form.photo instanceof File) {
        console.log('[EmployeeRegister] Uploading photo to Supabase Storage');
        const cleanFileName = form.photo.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_')
          .toLowerCase();
        const fileName = `employee_${Date.now()}_${cleanFileName}`;
        const filePath = fileName;
        
        const { error: uploadError } = await supabase.storage
          .from('employees')
          .upload(filePath, form.photo, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('[EmployeeRegister] Error uploading photo:', uploadError);
          throw new Error('Erreur lors du téléchargement de la photo: ' + uploadError.message);
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('employees')
          .getPublicUrl(filePath);
        photoUrl = publicUrl;
        console.log('[EmployeeRegister] Photo uploaded successfully:', photoUrl);
      }
      
      // Prepare data for Supabase
      // Note: Store additional fields in metadata JSONB since employees table has limited columns
      const employeeData = {
        full_name: `${form.name} ${form.prenom}`.trim(),
        email: form.email || null,
        phone: form.phone || null,
        address: form.adresse, // Map adresse to address
        photo: photoUrl || null,
        photo_url: photoUrl || null,
        status: 'pending',
        metadata: {
          name: form.name,
          prenom: form.prenom,
          birth_date: form.birth_date,
          age: Number(form.age),
          competency_id: Number(form.competency_id),
          auto_entrepreneur: form.auto_entrepreneur || null,
          last_experience: form.last_experience || null,
          company_name: form.company_name || null,
          preferred_work_time: form.preferred_work_time || null,
          jours_disponibles: Object.keys(selectedDaysPayload).length > 0 ? selectedDaysPayload : null
        }
      };
      
      console.log('[EmployeeRegister] Submitting employee data:', employeeData);
      
      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('employees')
        .insert(employeeData)
        .select();
      
      if (insertError) {
        console.error('[EmployeeRegister] Error inserting employee:', insertError);
        throw new Error(insertError.message || 'Erreur lors de l\'inscription');
      }
      
      setMessage('Inscription réussie!');
      setShowSuccess(true);
      setForm({ name:'', prenom:'', birth_date:'', age:'', email:'', phone:'', adresse:'', competency_id:'', photo: null, auto_entrepreneur: '', last_experience: '', company_name: '', preferred_work_time: '' });
      setDays({});
      // Auto-hide after 4s
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (e2) {
      // Better error handling for validation errors
      let errorMessage = e2.message;
      
      // If error contains validation errors, format them nicely
      if (errorMessage.includes('Validation errors:')) {
        setError(errorMessage);
      } else {
        setError(errorMessage || t('employee_register.submit.error'));
      }
      
      console.error('Submit error:', e2);
    } finally {
      setSubmitting(false);
    }
  };

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
      {showSuccess && (
        <div className="er-overlay" role="dialog" aria-modal="true">
          <div className="er-modal" data-aos="fade-in">
            <div className="er-check" aria-hidden>✅</div>
            <h3 className="er-title">{t('employee_register.success_modal.title')}</h3>
            <div className="er-actions">
              <button type="button" className="er-close" onClick={()=>setShowSuccess(false)}>{t('employee_register.success_modal.ok')}</button>
            </div>
          </div>
        </div>
      )}
      <div className="form-card" data-aos="fade-up">
        <h1>{t('employee_register.title')}</h1>
        <p className="subtitle">{t('employee_register.subtitle')}</p>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>{t('employee_register.form.name')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 16.7909 14.2091 15 12 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input type="text" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employee_register.form.first_name')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 16.7909 14.2091 15 12 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input type="text" value={form.prenom} onChange={(e)=>setForm({...form, prenom:e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employee_register.form.birth_date')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2v3M16 2v3M3 9h18M5 13h2m4 0h2m4 0h2M5 17h2m4 0h2m4 0h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input type="date" value={form.birth_date} onChange={(e)=>setForm({...form, birth_date:e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employee_register.form.age')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input type="number" min="16" max="80" value={form.age} onChange={(e)=>setForm({...form, age:e.target.value})} readOnly required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employee_register.form.email')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6H20C21.1046 6 22 6.89543 22 8V16C22 17.1046 21.1046 18 20 18H4C2.89543 18 2 17.1046 2 16V8C2 6.89543 2.89543 6 4 6Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M22 8L12.971 13.514C12.3681 13.8847 11.6319 13.8847 11.029 13.514L2 8" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employee_register.form.phone')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.73 19.73 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.12.89.3 1.76.54 2.59a2 2 0 0 1-.45 2.11l-.7.7a16 16 0 0 0 6.88 6.88l.7-.7a2 2 0 0 1 2.11-.45c.83.24 1.7.42 2.59.54A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input type="tel" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} placeholder={t('employee_register.form.phone_placeholder')} />
            </div>
          </div>
          <div className="form-group full">
            <label>{t('employee_register.form.address')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21C12 21 5 14.9706 5 10.5C5 7.46243 7.46243 5 10.5 5C13.5376 5 16 7.46243 16 10.5C16 14.9706 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10.5" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input type="text" value={form.adresse} onChange={(e)=>setForm({...form, adresse:e.target.value})} required />
              <button type="button" className="location-btn" onClick={handleUseLocation} disabled={isLocating} title={t('employee_register.form.use_location')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V4M12 20V22M4 12H2M22 12H20M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {isLocating ? t('employee_register.form.locating') : t('employee_register.form.locate')}
              </button>
            </div>
          </div>
          <div className="form-group full">
            <label>{t('employee_register.form.photo')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 15L8 10L14 16L17 13L21 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input type="file" accept="image/*" onChange={(e)=>setForm({...form, photo: e.target.files?.[0] || null})} />
            </div>
          </div>
          <div className="form-group full">
            <label>{t('employee_register.form.competency')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <select value={form.competency_id || ''} onChange={(e)=>setForm({...form, competency_id:e.target.value})} required>
                <option value="">{t('employee_register.form.select_competency')}</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {getServiceDisplayTitle(service)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group full">
            <label>{t('employee_register.form.auto_entrepreneur') || 'Auto-entrepreneur'}</label>
            <div style={{display: 'flex', gap: '16px', flexDirection: 'row', alignItems: 'center', marginTop: '8px'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0}}>
                <input 
                  type="radio" 
                  name="auto_entrepreneur" 
                  value="yes" 
                  checked={form.auto_entrepreneur === 'yes'}
                  onChange={(e)=>setForm({...form, auto_entrepreneur:e.target.value})}
                />
                <span>{t('employee_register.form.yes') || 'Yes'}</span>
              </label>
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0}}>
                <input 
                  type="radio" 
                  name="auto_entrepreneur" 
                  value="no" 
                  checked={form.auto_entrepreneur === 'no'}
                  onChange={(e)=>setForm({...form, auto_entrepreneur:e.target.value})}
                />
                <span>{t('employee_register.form.no') || 'No'}</span>
              </label>
            </div>
          </div>

          <div className="form-group full">
            <label>{t('employees.register.last_experience') || t('employee_register.form.last_experience') || 'آخر تجربة عمل'}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <textarea placeholder={t('employees.register.last_experience_ph') || t('employee_register.form.last_experience_ph') || 'وصف آخر تجربة عمل'} value={form.last_experience || ''} onChange={(e)=>setForm({...form, last_experience:e.target.value})} rows={3} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit'}} />
            </div>
          </div>

          <div className="form-group full">
            <label>{t('employees.register.company_name') || t('employee_register.form.company_name') || 'اسم الشركة'}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 21V7L13 2L21 7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input type="text" value={form.company_name || ''} onChange={(e)=>setForm({...form, company_name:e.target.value})} placeholder={t('employees.register.company_name_ph') || t('employee_register.form.company_name_ph') || 'أدخل اسم الشركة'} />
            </div>
          </div>

          <div className="form-group full">
            <label>{t('employee_register.form.preferred_work_time') || 'وقت العمل المفضل'}</label>
            <div className="preferred-work-time-buttons">
              <button
                type="button"
                className={`preferred-time-btn ${form.preferred_work_time === 'morning' ? 'active' : ''}`}
                onClick={() => setForm(prev => ({ ...prev, preferred_work_time: prev.preferred_work_time === 'morning' ? '' : 'morning' }))}
              >
                <span className="btn-icon" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                {t('employee_register.form.work_morning') || 'أعمل كل يوم في الصباح'}
              </button>
              <button
                type="button"
                className={`preferred-time-btn ${form.preferred_work_time === 'night' ? 'active' : ''}`}
                onClick={() => setForm(prev => ({ ...prev, preferred_work_time: prev.preferred_work_time === 'night' ? '' : 'night' }))}
              >
                <span className="btn-icon" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                {t('employee_register.form.work_night') || 'أعمل كل يوم في الليل'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {!form.preferred_work_time && (
              <motion.div
                className="form-group full"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <label>{t('employee_register.form.available_days')}</label>
                <div className="days-grid-modern">
                  {DAYS.map((day, index) => {
                    const key = DAY_KEYS[index];
                    const isActive = days[key]?.checked;
                    const hasError = timeErrors[key];
                    
                    return (
                      <motion.div
                        key={key}
                        className={`day-card ${isActive ? 'active' : ''} ${hasError ? 'error' : ''}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="day-header">
                          <label className="day-checkbox-modern">
                            <input 
                              type="checkbox" 
                              checked={isActive} 
                              onChange={() => handleDayToggle(index)} 
                            />
                            <span className="checkbox-custom">
                              {isActive && <FiCheck className="check-icon" />}
                            </span>
                            <span className="day-name">{day}</span>
                          </label>
                        </div>
                        
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              className="time-fields-modern"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                              <div className="time-inputs-row">
                                <div className="time-field-modern">
                                  <label className="time-label-modern">{t('employee_register.days.start_time')}</label>
                                  <div className="time-input-wrapper">
                                    <FiClock className="time-icon" />
                                    <input 
                                      type="time" 
                                      value={days[key]?.start || ''} 
                                      onChange={(e) => handleTimeChange(index, 'start', e.target.value)} 
                                      placeholder={t('employee_register.days.start_placeholder')}
                                      className="time-input"
                                    />
                                  </div>
                                </div>
                                
                                <div className="time-field-modern">
                                  <label className="time-label-modern">{t('employee_register.days.end_time')}</label>
                                  <div className="time-input-wrapper">
                                    <FiClock className="time-icon" />
                                    <input 
                                      type="time" 
                                      value={days[key]?.end || ''} 
                                      onChange={(e) => handleTimeChange(index, 'end', e.target.value)} 
                                      placeholder={t('employee_register.days.end_placeholder')}
                                      className="time-input"
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              {hasError && (
                                <motion.div
                                  className="time-error-message"
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                >
                                  {hasError}
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="actions">
            <button type="submit" className="submit-button" disabled={submitting}>
              <span className="btn-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {submitting ? t('employee_register.submit.submitting') : t('employee_register.submit.button')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiCheck } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CITY_QUARTIERS } from '../../constants/cities';
import './bebeSettingRegister.css';

export default function BebeSettingRegister() {
  const { t, i18n } = useTranslation();
  
  // Define day keys for internal use
  const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  // Get translated day names
  const DAYS = DAY_KEYS.map(key => t(`employee_register.days.${key}`));
  
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    age: '',
    email: '',
    phone: '',
    city: '',
    quartier: '',
    location: '',
    expertise: '',
    photo: null,
    auto_entrepreneur: '',
    last_experience: '',
    company_name: '',
    preferred_work_time: ''
  });
  const [availableQuartiers, setAvailableQuartiers] = useState([]);
  const [days, setDays] = useState({}); // { monday: { checked:true, start:'', end:'' }, ... }
  const [lastSelectedHours, setLastSelectedHours] = useState(null); // { start:'09:00', end:'18:00' }
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [timeErrors, setTimeErrors] = useState({});

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

  // Keep quartiers list in sync with selected city
  useEffect(() => {
    if (form.city && CITY_QUARTIERS[form.city]) {
      setAvailableQuartiers(CITY_QUARTIERS[form.city]);
      if (!CITY_QUARTIERS[form.city].includes(form.quartier)) {
        setForm((prev) => ({ ...prev, quartier: '' }));
      }
    } else {
      setAvailableQuartiers([]);
      if (form.quartier) {
        setForm((prev) => ({ ...prev, quartier: '' }));
      }
    }
  }, [form.city]);

  const expertiseOptions = [
    t('employees.bebe.expertise.newborn','رعاية طفل حديث الولادة'),
    t('employees.bebe.expertise.home_nursery','حضانة منزلية'),
    t('employees.bebe.expertise.nanny','مربية أطفال'),
    t('employees.bebe.expertise.home_assistant','مساعدة منزلية للطفل'),
  ];

  const selectedDaysPayload = useMemo(() => {
    // Build object: { monday: {start, end}, wednesday: {start, end} }
    const out = {};
    for (const key of DAY_KEYS) {
      const d = days[key];
      if (d?.checked && d.start && d.end) {
        out[key] = { start: d.start, end: d.end };
      }
    }
    // Convert to translated day names for API
    const translatedDays = {};
    Object.keys(out).forEach(key => {
      const translatedDay = DAYS[DAY_KEYS.indexOf(key)];
      translatedDays[translatedDay] = out[key];
    });
    return translatedDays;
  }, [days, DAYS]);

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
    if (!form.first_name || !form.last_name || !form.birth_date || !form.email || !form.city || !form.quartier) {
      return t('employee_register.validation.all_fields_required');
    }
    // Only require days if preferred_work_time is not selected
    if (!form.preferred_work_time && Object.keys(selectedDaysPayload).length === 0) return t('employee_register.validation.select_at_least_one_day');
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null); setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    try {
      setSubmitting(true);
      
      // Upload photo to Supabase Storage (if exists)
      let photoUrl = null;
      if (form.photo instanceof File) {
        try {
          const fileExt = form.photo.name.split('.').pop();
          const fileName = `bebe_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          // Path inside bucket (without bucket name)
          const filePath = `bebe/${fileName}`;
          
          console.log('Uploading photo to:', filePath);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('employees')
            .upload(filePath, form.photo, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            console.warn('Photo upload error:', uploadError);
            // Don't stop the process if photo upload fails
          } else {
            // Get public URL for the image
            const { data: { publicUrl } } = supabase.storage
              .from('employees')
              .getPublicUrl(filePath);
            photoUrl = publicUrl;
            console.log('Photo uploaded successfully:', photoUrl);
          }
        } catch (photoErr) {
          console.warn('Photo upload failed:', photoErr);
          // Don't stop the process if photo upload fails
        }
      }
      
      // Prepare data for Supabase bebe_employees table
      // Only include columns that exist in the table schema:
      // - id: auto-generated (DO NOT include in insert)
      // - first_name, last_name, email, phone, address, location, expertise, photo (existing)
      // - photo_url, status, is_active (to be added via SQL script)
      
      // Build employeeData with only existing columns
      // DO NOT include 'id' - it's auto-generated by Supabase
      const employeeData = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone?.trim() || null,
        address: `${form.city} - ${form.quartier}`,
        city: form.city?.trim() || null,
        quartier: form.quartier?.trim() || null,
        location: form.location?.trim() || null,
        expertise: form.expertise || null,
        photo: photoUrl || null  // Store URL in photo column
      };
      
      // Add optional columns if they exist (after running SQL script)
      // These will be ignored if columns don't exist, but won't cause errors if they do
      if (photoUrl) {
        employeeData.photo_url = photoUrl;
      }
      employeeData.status = 'pending';
      employeeData.is_active = true;
      
      // Note: Additional fields like birth_date, age, auto_entrepreneur, etc.
      // are not stored as the table schema doesn't support them
      
      console.log('[BebeSettingRegister] Submitting employee data to bebe_employees:', employeeData);
      console.log('[BebeSettingRegister] Note: id will be auto-generated by Supabase');
      
      // Insert into Supabase bebe_employees table
      // Supabase will auto-generate the 'id' field
      const { data, error } = await supabase
        .from('bebe_employees')
        .insert([employeeData])
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || t('employees.register.submit_failed','فشل في إرسال النموذج'));
      }
      
      setMessage(t('employees.register.submit_success','تم إرسال النموذج بنجاح'));
      setShowSuccess(true);
      setForm({
        first_name: '',
        last_name: '',
        birth_date: '',
        age: '',
        email: '',
        phone: '',
        city: '',
        quartier: '',
        location: '',
        expertise: '',
        photo: null,
        auto_entrepreneur: '',
        last_experience: '',
        company_name: '',
        preferred_work_time: '',
      });
      setDays({});
      // Auto-hide after 4s
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (e2) {
      console.error('Submit error:', e2);
      setError(e2.message || t('common.unexpected_error','حدث خطأ غير متوقع'));
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
      {/* Back Button Container */}
      <div className="back-button-container">
        <Link 
          to="/employees/register" 
          className="hand-workers-back-button"
          title={i18n.language === 'ar' ? 'العودة' : i18n.language === 'fr' ? 'Retour' : 'Back'}
        >
          ← {i18n.language === 'ar' ? 'العودة' : 
             i18n.language === 'fr' ? 'Retour' : 
             'Back'}
        </Link>
      </div>
      <div className="form-card" data-aos="fade-up">
        <h1>{t('employees.register.join_team','انضم إلى فريقنا')}</h1>
        <p className="subtitle">{t('employees.register.fill_form','يرجى ملء النموذج أدناه')}</p>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <form onSubmit={submit} className="form-grid">
          <div className="form-group">
            <label>{t('employees.register.first_name','الاسم')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 16.7909 14.2091 15 12 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input type="text" value={form.first_name || ''} onChange={(e)=>setForm({...form, first_name:e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employees.register.last_name','اللقب')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 16.7909 14.2091 15 12 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input type="text" value={form.last_name || ''} onChange={(e)=>setForm({...form, last_name:e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employees.register.birth_date','تاريخ الميلاد')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2v3M16 2v3M3 9h18M5 13h2m4 0h2m4 0h2M5 17h2m4 0h2m4 0h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input type="date" value={form.birth_date || ''} onChange={(e)=>setForm({...form, birth_date:e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employees.register.age','العمر')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input type="number" min="16" max="80" value={form.age || ''} onChange={(e)=>setForm({...form, age:e.target.value})} readOnly />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employees.register.email','البريد الإلكتروني')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6H20C21.1046 6 22 6.89543 22 8V16C22 17.1046 21.1046 18 20 18H4C2.89543 18 2 17.1046 2 16V8C2 6.89543 2.89543 6 4 6Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M22 8L12.971 13.514C12.3681 13.8847 11.6319 13.8847 11.029 13.514L2 8" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input type="email" value={form.email || ''} onChange={(e)=>setForm({...form, email:e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employees.register.phone','الهاتف')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.73 19.73 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.12.89.3 1.76.54 2.59a2 2 0 0 1-.45 2.11l-.7.7a16 16 0 0 0 6.88 6.88l.7-.7a2 2 0 0 1 2.11-.45c.83.24 1.7.42 2.59.54A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input type="tel" value={form.phone || ''} onChange={(e)=>setForm({...form, phone:e.target.value})} placeholder={t('employees.register.phone_ph','مثال: +212 6 12 34 56 78')} />
            </div>
          </div>
          <div className="form-group full">
            <label>{t('multi_service_employees.city_label')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21C12 21 5 14.9706 5 10.5C5 7.46243 7.46243 5 10.5 5C13.5376 5 16 7.46243 16 10.5C16 14.9706 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10.5" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <select
                value={form.city || ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              >
                <option value="">
                  {t('multi_services.city_placeholder', 'اختر المدينة')}
                </option>
                {Object.keys(CITY_QUARTIERS).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group full">
            <label>{t('multi_service_employees.quartier_label')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21C12 21 5 14.9706 5 10.5C5 7.46243 7.46243 5 10.5 5C13.5376 5 16 7.46243 16 10.5C16 14.9706 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10.5" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <select
                value={form.quartier || ''}
                onChange={(e) => setForm({ ...form, quartier: e.target.value })}
                disabled={!form.city || availableQuartiers.length === 0}
                required
              >
                <option value="">
                  {t('multi_services.quartier_placeholder', 'اختر الحي')}
                </option>
                {availableQuartiers.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group full">
            <label>{t('employees.register.location','الموقع')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21C12 21 5 14.9706 5 10.5C5 7.46243 7.46243 5 10.5 5C13.5376 5 16 7.46243 16 10.5C16 14.9706 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10.5" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <input type="text" value={form.location || ''} onChange={(e)=>setForm({...form, location:e.target.value})} />
            </div>
          </div>
          <div className="form-group full">
            <label>{t('employees.register.photo_optional','الصورة (اختياري)')}</label>
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
            <label>{t('employees.register.expertise','مجال الخبرة')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <select value={form.expertise || ''} onChange={(e)=>setForm({...form, expertise:e.target.value})}>
                <option value="">{t('employees.register.expertise_select','اختر مجال الخبرة')}</option>
                {expertiseOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
              </select>
            </div>
          </div>

          <div className="form-group full">
            <label>{t('employees.register.auto_entrepreneur','مقاول ذاتي')}</label>
            <div style={{display: 'flex', gap: '16px', flexDirection: 'row', alignItems: 'center', marginTop: '8px'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0}}>
                <input 
                  type="radio" 
                  name="auto_entrepreneur" 
                  value="yes" 
                  checked={form.auto_entrepreneur === 'yes'}
                  onChange={(e)=>setForm({...form, auto_entrepreneur:e.target.value})}
                />
                <span>{t('common.yes','نعم')}</span>
              </label>
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0}}>
                <input 
                  type="radio" 
                  name="auto_entrepreneur" 
                  value="no" 
                  checked={form.auto_entrepreneur === 'no'}
                  onChange={(e)=>setForm({...form, auto_entrepreneur:e.target.value})}
                />
                <span>{t('common.no','لا')}</span>
              </label>
            </div>
          </div>

          <div className="form-group full">
            <label>{t('employees.register.last_experience','آخر تجربة عمل')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <textarea placeholder={t('employees.register.last_experience_ph','وصف آخر تجربة عمل')} value={form.last_experience || ''} onChange={(e)=>setForm({...form, last_experience:e.target.value})} rows={3} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', background: 'transparent', color: '#ffffff'}} />
            </div>
          </div>

          <div className="form-group full">
            <label>{t('employees.register.company_name','اسم الشركة')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 21V7L13 2L21 7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input type="text" value={form.company_name || ''} onChange={(e)=>setForm({...form, company_name:e.target.value})} placeholder={t('employees.register.company_name_ph','أدخل اسم الشركة')} />
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
                                      value={(days[key]?.start ?? '') || ''} 
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
                                      value={(days[key]?.end ?? '') || ''} 
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
              {submitting ? t('employee_register.submit.submitting') : t('common.submit','تسجيل')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

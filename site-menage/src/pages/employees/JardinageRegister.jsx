import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CITY_QUARTIERS } from '../../constants/cities';
import LocationPicker from '../../components/LocationPicker/LocationPicker';
import './jardinageRegister.css';

export default function JardinageRegister() {
  const { t, i18n } = useTranslation();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    age: '',
    email: '',
    phone: '',
    latitude: null,
    longitude: null,
    location_address: '',
    expertise: '',
    employee_type: '',
    photo: null,
    auto_entrepreneur: '',
    last_experience: '',
    company_name: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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

  const handleLocationSelect = ({ lat, lng, address }) => {
    setForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location_address: address
    }));
  };
  const expertiseOptions = [
    t('employees.jardinage.expertise.planting', 'زراعة'),
    t('employees.jardinage.expertise.pruning', 'تقليم'),
    t('employees.jardinage.expertise.maintenance', 'صيانة الحدائق'),
  ];

  const validate = () => {
    if (!form.first_name || !form.last_name || !form.birth_date || !form.email || !form.latitude || !form.longitude || !form.location_address) {
      return t('employee_register.validation.all_fields_required');
    }
    if (!form.employee_type) return t('employee_register.validation.employee_type_required', 'نوع العامل مطلوب');
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null); setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    try {
      setSubmitting(true);

      // Upload photo to Supabase Storage if provided
      let photoUrl = '';
      if (form.photo instanceof File) {
        console.log('[JardinageRegister] Uploading photo to Supabase Storage');
        const cleanFileName = form.photo.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_')
          .toLowerCase();
        const fileName = `jardinage_employee_${Date.now()}_${cleanFileName}`;
        const filePath = fileName;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employees')
          .upload(filePath, form.photo, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('[JardinageRegister] Error uploading photo:', uploadError);
          throw new Error('Erreur lors du téléchargement de la photo: ' + uploadError.message);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('employees')
          .getPublicUrl(filePath);
        photoUrl = publicUrl;
        console.log('[JardinageRegister] Photo uploaded successfully:', photoUrl);
      }

      // Prepare data for Supabase jardinage_employees table
      const employeeData = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        birth_date: form.birth_date || null,
        age: form.age ? parseInt(form.age, 10) : null,
        email: form.email.trim() || null,
        phone: form.phone?.trim() || null,
        latitude: form.latitude,
        longitude: form.longitude,
        location_address: form.location_address,
        address: form.location_address, // Fallback
        expertise: form.expertise || null,
        employee_type: form.employee_type || null,
        auto_entrepreneur: form.auto_entrepreneur || null,
        last_experience: form.last_experience || null,
        company_name: form.company_name || null,
        photo: photoUrl || null,
        photo_url: photoUrl || null,
        status: 'pending',
        is_active: true
      };

      console.log('[JardinageRegister] Submitting employee data to jardinage_employees:', employeeData);

      // Insert into Supabase jardinage_employees table
      const { data: result, error: insertError } = await supabase
        .from('jardinage_employees')
        .insert([employeeData])
        .select();

      if (insertError) {
        console.error('[JardinageRegister] Error inserting employee:', insertError);
        throw new Error(insertError.message || t('employees.register.submit_failed', 'فشل في إرسال النموذج'));
      }

      setMessage(t('employees.register.submit_success', 'تم إرسال النموذج بنجاح'));
      setShowSuccess(true);
      setForm({
        first_name: '',
        last_name: '',
        birth_date: '',
        age: '',
        email: '',
        phone: '',
        latitude: null,
        longitude: null,
        location_address: '',
        expertise: '',
        employee_type: '',
        photo: null,
        auto_entrepreneur: '',
        last_experience: '',
        company_name: '',
      });
      // Auto-hide after 4s
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (e2) {
      setError(e2.message || t('common.unexpected_error', 'حدث خطأ غير متوقع'));
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
              <button type="button" className="er-close" onClick={() => setShowSuccess(false)}>{t('employee_register.success_modal.ok')}</button>
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
        <h1>{t('employees.register.join_team', 'انضم إلى فريقنا')}</h1>
        <p className="subtitle">{t('employees.register.fill_form', 'يرجى ملء النموذج أدناه')}</p>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <form onSubmit={submit} className="form-grid">
          <div className="form-group">
            <label>{t('employee_register.form.first_name')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 16.7909 14.2091 15 12 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employee_register.form.last_name')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 16.7909 14.2091 15 12 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employees.register.birth_date', 'تاريخ الميلاد')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2v3M16 2v3M3 9h18M5 13h2m4 0h2m4 0h2M5 17h2m4 0h2m4 0h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employees.register.age', 'العمر')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <input type="number" min="16" max="80" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} readOnly />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employees.register.email', 'البريد الإلكتروني')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6H20C21.1046 6 22 6.89543 22 8V16C22 17.1046 21.1046 18 20 18H4C2.89543 18 2 17.1046 2 16V8C2 6.89543 2.89543 6 4 6Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M22 8L12.971 13.514C12.3681 13.8847 11.6319 13.8847 11.029 13.514L2 8" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('employees.register.phone', 'الهاتف')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.73 19.73 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.12.89.3 1.76.54 2.59a2 2 0 0 1-.45 2.11l-.7.7a16 16 0 0 0 6.88 6.88l.7-.7a2 2 0 0 1 2.11-.45c.83.24 1.7.42 2.59.54A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t('employees.register.phone_ph', 'مثال: +212 6 12 34 56 78')} />
            </div>
          </div>
          <div className="form-group full">
            <label style={{ marginBottom: '15px', display: 'block' }}>
              {t('employee_register.form.location_label')}
            </label>
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null}
            />
            {form.location_address && (
              <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#64748b' }}>
                <strong>{t('employee_register.form.selected_address')}</strong> {form.location_address}
              </div>
            )}
          </div>
          <div className="form-group full">
            <label>{t('employee_register.form.photo')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M3 15L8 10L14 16L17 13L21 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })} />
            </div>
          </div>
          <div className="form-group full">
            <label>{t('employee_register.form.expertise')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <select value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })}>
                <option value="">{t('employee_register.form.select_expertise') || 'اختر مجال الخبرة'}</option>
                {expertiseOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
              </select>
            </div>
          </div>

          <div className="form-group full">
            <label>{t('employees.register.employee_type', 'نوع العامل')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 16.7909 14.2091 15 12 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <select value={form.employee_type} onChange={(e) => setForm({ ...form, employee_type: e.target.value })} required>
                <option value="">{t('employees.register.select_employee_type', 'اختر نوع العامل')}</option>
                <option value="عامل">عامل</option>
                <option value="مساعد">مساعد</option>
              </select>
            </div>
          </div>

          <div className="form-group full">
            <label>{t('employee_register.form.auto_entrepreneur')}</label>
            <div style={{ display: 'flex', gap: '16px', flexDirection: 'row', alignItems: 'center', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="radio"
                  name="auto_entrepreneur"
                  value="yes"
                  checked={form.auto_entrepreneur === 'yes'}
                  onChange={(e) => setForm({ ...form, auto_entrepreneur: e.target.value })}
                />
                <span>{t('common.yes', 'نعم')}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="radio"
                  name="auto_entrepreneur"
                  value="no"
                  checked={form.auto_entrepreneur === 'no'}
                  onChange={(e) => setForm({ ...form, auto_entrepreneur: e.target.value })}
                />
                <span>{t('common.no', 'لا')}</span>
              </label>
            </div>
          </div>

          <div className="form-group full">
            <label>{t('employee_register.form.last_experience')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <textarea placeholder={t('employee_register.form.last_experience_ph')} value={form.last_experience} onChange={(e) => setForm({ ...form, last_experience: e.target.value })} rows={3} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', background: 'transparent', color: '#ffffff' }} />
            </div>
          </div>

          <div className="form-group full">
            <label>{t('employee_register.form.company_name')}</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 21V7L13 2L21 7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder={t('employees.register.company_name_ph', 'أدخل اسم الشركة')} />
            </div>
          </div>

          <div className="actions">
            <button type="submit" className="submit-button" disabled={submitting}>
              <span className="btn-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {submitting ? t('employee_register.buttons.submitting') : t('employee_register.buttons.submit_jardinage')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

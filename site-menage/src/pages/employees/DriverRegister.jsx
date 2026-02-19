import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CITY_QUARTIERS } from '../../constants/cities';
import LocationPicker from '../../components/LocationPicker/LocationPicker';
import './driverRegister.css';

export default function DriverRegister() {
  const { t, i18n } = useTranslation();

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    cin_number: '',
    latitude: null,
    longitude: null,
    location_address: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleLocationSelect = ({ lat, lng, address }) => {
    setForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location_address: address
    }));
  };

  const validate = () => {
    if (!form.full_name || !form.phone || !form.cin_number || !form.latitude || !form.longitude) {
      return t('employee_register.validation.all_fields_required', 'جميع الحقول مطلوبة');
    }
    // Validate phone format
    const phoneRegex = /^(\+212|0)[0-9\s\-]{6,}$/;
    if (!phoneRegex.test(form.phone)) {
      return t('employee_register.validation.invalid_phone', 'رقم الهاتف غير صحيح');
    }
    // Validate CIN number (should be alphanumeric, typically 8-12 characters)
    if (form.cin_number.length < 6 || form.cin_number.length > 20) {
      return t('employee_register.validation.invalid_cin', 'رقم البطاقة الوطنية غير صحيح');
    }
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    try {
      setSubmitting(true);

      // Prepare employee data for Supabase
      const employeeData = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        cin_number: form.cin_number.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        location_address: form.location_address,
        address: form.location_address, // Fallback
        status: 'pending',
      };

      console.log('[DriverRegister] Submitting employee data to driver_employees:', employeeData);

      // Insert data directly into Supabase driver_employees table
      const { data, error } = await supabase
        .from('driver_employees')
        .insert([employeeData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || t('employees.register.submit_failed', 'فشل في إرسال النموذج'));
      }

      console.log('[DriverRegister] Successfully created driver employee:', data);

      setMessage(t('employees.register.submit_success', 'تم إرسال النموذج بنجاح'));
      setShowSuccess(true);
      setForm({
        full_name: '',
        phone: '',
        cin_number: '',
        latitude: null,
        longitude: null,
        location_address: '',
      });
      // Auto-hide after 4s
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (e2) {
      console.error('Error submitting driver registration:', e2);
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
            <h3 className="er-title">{t('employee_register.success_modal.title', 'تم التسجيل بنجاح!')}</h3>
            <div className="er-actions">
              <button type="button" className="er-close" onClick={() => setShowSuccess(false)}>
                {t('employee_register.success_modal.ok', 'حسناً')}
              </button>
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
          <div className="form-group full">
            <label>{t('employee_register.form.full_name')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 16.7909 14.2091 15 12 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                placeholder={t('employee_register.form.full_name_ph') || 'أدخل الاسم الكامل'}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('employee_register.form.phone')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.73 19.73 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.12.89.3 1.76.54 2.59a2 2 0 0 1-.45 2.11l-.7.7a16 16 0 0 0 6.88 6.88l.7-.7a2 2 0 0 1 2.11-.45c.83.24 1.7.42 2.59.54A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                placeholder={t('employee_register.form.phone_placeholder')}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('employee_register.form.cin_number')} *</label>
            <div className="input-with-icon">
              <span className="ifi-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <input
                type="text"
                value={form.cin_number}
                onChange={(e) => setForm({ ...form, cin_number: e.target.value })}
                required
                placeholder={t('employee_register.form.cin_placeholder') || 'AB123456'}
                maxLength={20}
              />
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

          <div className="actions">
            <button type="submit" className="submit-button" disabled={submitting}>
              <span className="btn-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {submitting ? t('employee_register.buttons.submitting') : t('employee_register.buttons.submit_driver')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

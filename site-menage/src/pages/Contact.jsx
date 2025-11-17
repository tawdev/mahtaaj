import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './Contact.css';
import { postContact } from '../api-supabase';

export default function Contact() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const locationRef = useRef(null);
  
  const backgroundImage = `${process.env.PUBLIC_URL}/canaper.jpg`;

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const payload = {
      firstname: form.firstname.value.trim(),
      phone: form.phone.value.trim(),
      location: form.location.value.trim(),
      service: form.service.value,
      message: form.message.value.trim(),
      email: form.email ? form.email.value.trim() : undefined,
    };
    try {
      await postContact(payload);
      setSubmitted(true);
    } catch (err) {
      alert(t('contact.form.submit_error'));
    }
  }

  return (
    <main 
      className="contact-hero" 
      id="contact"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="contact-card">
        <div className="contact-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1.14a2 2 0 0 1 2.11-.45c.84.29 1.71.5 2.61.62A2 2 0 0 1 22 16.92z" fill="currentColor"/>
          </svg>
        </div>
        <h1 className="contact-title">{t('contact.title')}</h1>
        <p className="contact-description">
          {t('contact.description')}
        </p>
        <div className="contact-cta">
          <a href="tel:+33666262106" className="contact-button">06 66 26 21 06</a>
        </div>
        {/* <section className="contact-form">
          {submitted ? (
            <div className="success">
              <h3>{t('contact.form.success.title')}</h3>
              <p>{t('contact.form.success.message')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="firstname">{t('contact.form.firstname')}<span aria-hidden> *</span></label>
                <input id="firstname" name="firstname" required minLength={2} placeholder={t('contact.form.firstname_placeholder')} />
              </div>
              <div className="field">
                <label htmlFor="phone">{t('contact.form.phone')}<span aria-hidden> *</span></label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="^(\+33|\+212|0)[0-9\s\-]{6,}$"
                  title={t('contact.form.phone_title')}
                  placeholder={t('contact.form.phone_placeholder')}
                  onInput={(e) => { e.target.value = e.target.value.replace(/[A-Za-z]/g, ''); }}
                />
                <small>{t('contact.form.phone_note')}</small>
              </div>
              <div className="field">
                <label htmlFor="location">{t('contact.form.location')}<span aria-hidden> *</span></label>
                <div style={{display:'grid', gap:8}}>
                  <input ref={locationRef} id="location" name="location" required minLength={2} placeholder={t('contact.form.location_placeholder')} />
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <button type="button" className="use-location" onClick={async ()=>{
                      setLocError('');
                      if (!navigator.geolocation) { setLocError(t('contact.form.geolocation_not_supported')); return; }
                      setLocLoading(true);
                      navigator.geolocation.getCurrentPosition(async (pos)=>{
                        try {
                          const { latitude, longitude } = pos.coords;
                          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}` , { headers: { 'Accept': 'application/json' } });
                          const data = await resp.json();
                          const a = data.address || {};
                          const city = a.city || a.town || a.village || '';
                          const road = a.road || '';
                          const pc = a.postcode || '';
                          const country = a.country || '';
                          const value = [road, city, pc, country].filter(Boolean).join(', ');
                          if (locationRef.current) locationRef.current.value = value || city || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
                        } catch (err) {
                          setLocError(t('contact.form.location_error'));
                        } finally {
                          setLocLoading(false);
                        }
                      }, (err)=>{ setLocError(t('contact.form.permission_error')); setLocLoading(false); });
                    }}>{locLoading ? t('contact.form.locating') : t('contact.form.use_location')}</button>
                    {locError ? <small style={{color:'#b91c1c'}}>{locError}</small> : null}
                  </div>
                </div>
              </div>
              <div className="field">
                <label htmlFor="service">{t('contact.form.service')}<span aria-hidden> *</span></label>
                <select id="service" name="service" required defaultValue="">
                  <option value="" disabled>{t('contact.form.select_service')}</option>
                  <option value="Ménage à domicile">{t('contact.form.services.home_cleaning')}</option>
                  <option value="Nettoyage de bureaux">{t('contact.form.services.office_cleaning')}</option>
                  <option value="Lavage de vitres">{t('contact.form.services.window_cleaning')}</option>
                  <option value="Repassage">{t('contact.form.services.ironing')}</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="message">{t('contact.form.message')}<span aria-hidden> *</span></label>
                <textarea id="message" name="message" rows="5" required minLength={10} placeholder={t('contact.form.message_placeholder')} />
              </div>
              <input type="email" name="email" id="email" hidden />
              <button type="submit" className="submit">{t('contact.form.submit')}</button>
            </form>
          )}
        </section> */}
      </div>
    </main>
  );
}



import React, { useEffect, useState, useCallback } from 'react';
import './Security.css';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function SecurityRoleDetails() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [roleData, setRoleData] = useState(null);
  const [roleImage, setRoleImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    type_reservation: 'heures',
    date_reservation: '',
    heure_debut: '',
    nombre_heures: 1,
    date_debut: '',
    date_fin: '',
    nombre_jours: 1,
    full_name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [toast, setToast] = useState({ show: false, text: '' });

  const getTranslatedRole = (roleName) => {
    if (!roleName) return t('security_page.role_not_available');
    
    const directTranslations = {
      'Chef de sécurité': t('security_page.chef_de_securite', 'رئيس الأمن'),
      'Agent de sûreté': t('security_page.agent_de_surete', 'وكيل الأمن المتخصص'),
      'Agent de sécurité': t('security_page.agent_de_securite', 'وكيل الأمن العام'),
      'Superviseur sécurité': t('security_page.superviseur_securite', 'مشرف فريق الأمن')
    };
    
    if (directTranslations[roleName]) {
      return directTranslations[roleName];
    }
    
    const roleKey = roleName.toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    const possibleKeys = [
      `security_roles.${roleKey}.title`,
      `security_roles.${roleName.toLowerCase().replace(/\s+/g, '_')}.title`,
      `security_roles.${roleName.toLowerCase().replace(/[éèêë]/g, 'e').replace(/[àáâãäå]/g, 'a').replace(/[ç]/g, 'c').replace(/\s+/g, '_')}.title`
    ];
    
    for (const key of possibleKeys) {
      const translation = t(key, { defaultValue: null });
      if (translation && translation !== key) {
        return translation;
      }
    }
    
    return roleName;
  };

  const getTranslatedRoleDescription = (roleName) => {
    if (!roleName) return t('security_page.description_not_available');
    
    const roleKey = roleName.toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    const possibleKeys = [
      `security_roles.${roleKey}.description`,
      `security_roles.${roleName.toLowerCase().replace(/\s+/g, '_')}.description`,
      `security_roles.${roleName.toLowerCase().replace(/[éèêë]/g, 'e').replace(/[àáâãäå]/g, 'a').replace(/[ç]/g, 'c').replace(/\s+/g, '_')}.description`
    ];
    
    for (const key of possibleKeys) {
      const translation = t(key, { defaultValue: null });
      if (translation && translation !== key) {
        return translation;
      }
    }
    
    return roleName;
  };

  const loadRoleDetails = useCallback(async (roleId) => {
    if (!roleId) return;
    
    try {
      setError('');
      setLoading(true);
      
      const { data: rolesData, error: rolesError } = await supabase
        .from('security_roles')
        .select('*')
        .eq('id', roleId)
        .eq('is_active', true)
        .single();
      
      if (rolesError) {
        console.error('[SecurityRoleDetails] Error loading role:', rolesError);
        throw rolesError;
      }
      
      if (rolesData) {
        setRoleData(rolesData);
        
        if (rolesData.image) {
          const getImageUrl = (imagePath) => {
            if (!imagePath) return null;
            if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
              return imagePath;
            }
            if (imagePath.includes('supabase.co/storage')) {
              return imagePath;
            }
            const filename = imagePath.split('/').pop();
            if (filename) {
              const { data: { publicUrl } } = supabase.storage
                .from('securities')
                .getPublicUrl(filename);
              return publicUrl;
            }
            return null;
          };
          
          const imageUrl = getImageUrl(rolesData.image);
          setRoleImage(imageUrl);
        }
      } else {
        setError(t('security_page.role_not_found') || 'Role not found');
      }
    } catch (err) {
      console.error('[SecurityRoleDetails] Exception loading role:', err);
      setError(t('security_page.loading_error') + ': ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (id) {
      loadRoleDetails(id);
    }
  }, [id, loadRoleDetails]);

  const updateReservationField = (field, value) => {
    setReservationForm(prev => ({ ...prev, [field]: value }));
  };

  const openReservationForm = () => {
    setShowReservationForm(true);
  };

  const submitReservation = async (e) => {
    e.preventDefault();
    setReservationLoading(true);
    setError('');

    try {
      const reservationData = {
        role_id: id,
        type_reservation: reservationForm.type_reservation,
        ...(reservationForm.type_reservation === 'heures' ? {
          date_reservation: reservationForm.date_reservation,
          heure_debut: reservationForm.heure_debut,
          nombre_heures: reservationForm.nombre_heures
        } : {
          date_debut: reservationForm.date_debut,
          date_fin: reservationForm.date_fin,
          nombre_jours: reservationForm.nombre_jours
        }),
        full_name: reservationForm.full_name,
        email: reservationForm.email,
        phone: reservationForm.phone,
        address: reservationForm.address,
        notes: reservationForm.notes,
        status: 'pending'
      };

      const { data, error: insertError } = await supabase
        .from('security_reservations')
        .insert([reservationData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setReservationSuccess(true);
      setShowReservationForm(false);
      setReservationForm({
        type_reservation: 'heures',
        date_reservation: '',
        heure_debut: '',
        nombre_heures: 1,
        date_debut: '',
        date_fin: '',
        nombre_jours: 1,
        full_name: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
      });
      
      setToast({
        show: true,
        text: t('security_page.reservation_success') || 'Reservation submitted successfully!'
      });
      
      setTimeout(() => {
        setToast({ show: false, text: '' });
      }, 3000);
    } catch (err) {
      console.error('[SecurityRoleDetails] Error submitting reservation:', err);
      setError(t('security_page.reservation_error') + ': ' + (err.message || 'Unknown error'));
    } finally {
      setReservationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="shop-container">
        <div style={{textAlign: 'center', margin: '40px 0'}}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          <p style={{color: '#64748b', fontSize: '0.95rem'}}>{t('security_page.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !roleData) {
    return (
      <div className="shop-container">
        <div style={{textAlign: 'center', margin: '40px 0', color: 'red'}}>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/security')}
            className="role-back-button"
            style={{marginTop: '16px'}}
          >
            ← {t('security_page.back_to_roles')}
          </button>
        </div>
      </div>
    );
  }

  if (!roleData) {
    return (
      <div className="shop-container">
        <div style={{textAlign: 'center', margin: '40px 0', color: '#64748b'}}>
          <p>{t('security_page.role_not_found') || 'Role not found'}</p>
          <button 
            onClick={() => navigate('/security')}
            className="role-back-button"
            style={{marginTop: '16px'}}
          >
            ← {t('security_page.back_to_roles')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-container">
      {/* Back Button Container */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 20px',
        marginTop: '20px',
        marginBottom: '20px'
      }}>
        <button 
          onClick={() => navigate('/security')}
          className="back-button"
        >
          <span className="back-icon">←</span>
          {i18n.language === 'ar' ? 'العودة إلى الأدوار' : 
           i18n.language === 'fr' ? 'Retour aux rôles' : 
           'Back to roles'}
        </button>
      </div>

      <div className="role-detail-page">
        {/* Titre */}
        <h1 className="role-detail-title">
          {getTranslatedRole(roleData.name) || roleData.name || t('security_page.role_not_available')}
        </h1>

        {/* Image */}
        {roleImage && (
          <div className="role-image-container">
            <img 
              src={roleImage} 
              alt={roleData.name}
              className="role-detail-image"
            />
            <div className="role-image-overlay">
              <p className="role-image-text">
                {getTranslatedRole(roleData.name) || roleData.name}
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="role-description-section">
          <p className="role-description-text">
            {roleData.description || getTranslatedRoleDescription(roleData.name) || t('security_page.description_not_available')}
          </p>
        </div>

        {/* Bouton de réservation */}
        <button 
          onClick={openReservationForm}
          className="role-booking-button"
        >
          🛡️ {t('security_page.book_role_now')}
        </button>
      </div>

      {/* Modal de réservation */}
      {showReservationForm && (
        <div className="evaluation-modal-overlay" style={{ zIndex: 10000 }}>
          <div className="evaluation-modal">
            <div className="evaluation-modal-header" style={{ flexShrink: 0 }}>
              <h3>{t('security_page.reserve', { defaultValue: i18n.language === 'ar' ? 'حجز' : i18n.language === 'fr' ? 'Réserver' : 'Reserve' })} {getTranslatedRole(roleData?.name) || roleData?.name || t('security_page.security_role', { defaultValue: i18n.language === 'ar' ? 'دور الأمن' : i18n.language === 'fr' ? 'Rôle de sécurité' : 'Security role' })}</h3>
              <button 
                className="evaluation-modal-close"
                onClick={() => setShowReservationForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={submitReservation} className="evaluation-form">
              {/* Type de réservation */}
              <div className="evaluation-form-group">
                <label>📋 {t('security_page.reservation_type', { defaultValue: i18n.language === 'ar' ? 'نوع الحجز' : i18n.language === 'fr' ? 'Type de réservation' : 'Reservation Type' })}</label>
                <select
                  value={reservationForm.type_reservation}
                  onChange={(e) => {
                    updateReservationField('type_reservation', e.target.value);
                    if (e.target.value === 'heures') {
                      updateReservationField('date_debut', '');
                      updateReservationField('date_fin', '');
                    } else {
                      updateReservationField('date_reservation', '');
                      updateReservationField('heure_debut', '');
                      updateReservationField('nombre_heures', 1);
                    }
                  }}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    width: '100%'
                  }}
                >
                  <option value="heures">🕒 {i18n.language === 'ar' ? 'بالساعات' : i18n.language === 'fr' ? 'Par heures' : 'By hours'}</option>
                  <option value="jours">📅 {i18n.language === 'ar' ? 'بالأيام' : i18n.language === 'fr' ? 'Par jours' : 'By days'}</option>
                </select>
              </div>

              {/* Champs pour réservation par heures */}
              {reservationForm.type_reservation === 'heures' && (
                <>
                  <div className="evaluation-form-group">
                    <label>📅 {t('security_page.date', { defaultValue: i18n.language === 'ar' ? 'التاريخ' : i18n.language === 'fr' ? 'Date' : 'Date' })}</label>
                    <input
                      type="date"
                      value={reservationForm.date_reservation}
                      onChange={(e) => updateReservationField('date_reservation', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '1rem',
                        width: '100%'
                      }}
                    />
                  </div>

                  <div className="evaluation-form-group">
                    <label>⏰ {t('security_page.start_time', { defaultValue: i18n.language === 'ar' ? 'وقت البداية' : i18n.language === 'fr' ? 'Heure de début' : 'Start time' })}</label>
                    <input
                      type="time"
                      value={reservationForm.heure_debut}
                      onChange={(e) => updateReservationField('heure_debut', e.target.value)}
                      required
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '1rem',
                        width: '100%'
                      }}
                    />
                  </div>

                  <div className="evaluation-form-group">
                    <label>⏱️ {t('security_page.number_of_hours', { defaultValue: i18n.language === 'ar' ? 'عدد الساعات' : i18n.language === 'fr' ? 'Nombre d\'heures' : 'Number of hours' })}</label>
                    <input
                      type="number"
                      min="1"
                      value={reservationForm.nombre_heures}
                      onChange={(e) => updateReservationField('nombre_heures', parseInt(e.target.value) || 1)}
                      required
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '1rem',
                        width: '100%'
                      }}
                    />
                  </div>
                </>
              )}

              {/* Champs pour réservation par jours */}
              {reservationForm.type_reservation === 'jours' && (
                <>
                  <div className="evaluation-form-group">
                    <label>📅 {t('security_page.start_date', { defaultValue: i18n.language === 'ar' ? 'تاريخ البداية' : i18n.language === 'fr' ? 'Date de début' : 'Start date' })}</label>
                    <input
                      type="date"
                      value={reservationForm.date_debut}
                      onChange={(e) => updateReservationField('date_debut', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '1rem',
                        width: '100%'
                      }}
                    />
                  </div>

                  <div className="evaluation-form-group">
                    <label>📅 {t('security_page.end_date', { defaultValue: i18n.language === 'ar' ? 'تاريخ النهاية' : i18n.language === 'fr' ? 'Date de fin' : 'End date' })}</label>
                    <input
                      type="date"
                      value={reservationForm.date_fin}
                      onChange={(e) => updateReservationField('date_fin', e.target.value)}
                      min={reservationForm.date_debut || new Date().toISOString().split('T')[0]}
                      required
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '1rem',
                        width: '100%'
                      }}
                    />
                  </div>

                  <div className="evaluation-form-group">
                    <label>📆 {t('security_page.number_of_days', { defaultValue: i18n.language === 'ar' ? 'عدد الأيام' : i18n.language === 'fr' ? 'Nombre de jours' : 'Number of days' })}</label>
                    <input
                      type="number"
                      min="1"
                      value={reservationForm.nombre_jours}
                      onChange={(e) => updateReservationField('nombre_jours', parseInt(e.target.value) || 1)}
                      required
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '1rem',
                        width: '100%'
                      }}
                    />
                  </div>
                </>
              )}

              {/* Informations de contact */}
              <div className="evaluation-form-group">
                <label>👤 {t('security_page.full_name', { defaultValue: i18n.language === 'ar' ? 'الاسم الكامل' : i18n.language === 'fr' ? 'Nom complet' : 'Full name' })}</label>
                <input
                  type="text"
                  value={reservationForm.full_name}
                  onChange={(e) => updateReservationField('full_name', e.target.value)}
                  required
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    width: '100%'
                  }}
                />
              </div>

              <div className="evaluation-form-group">
                <label>📧 {t('security_page.email', { defaultValue: i18n.language === 'ar' ? 'البريد الإلكتروني' : i18n.language === 'fr' ? 'Email' : 'Email' })}</label>
                <input
                  type="email"
                  value={reservationForm.email}
                  onChange={(e) => updateReservationField('email', e.target.value)}
                  required
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    width: '100%'
                  }}
                />
              </div>

              <div className="evaluation-form-group">
                <label>📱 {t('security_page.phone', { defaultValue: i18n.language === 'ar' ? 'الهاتف' : i18n.language === 'fr' ? 'Téléphone' : 'Phone' })}</label>
                <input
                  type="tel"
                  value={reservationForm.phone}
                  onChange={(e) => updateReservationField('phone', e.target.value)}
                  required
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    width: '100%'
                  }}
                />
              </div>

              <div className="evaluation-form-group">
                <label>📍 {t('security_page.address', { defaultValue: i18n.language === 'ar' ? 'العنوان' : i18n.language === 'fr' ? 'Adresse' : 'Address' })}</label>
                <textarea
                  value={reservationForm.address}
                  onChange={(e) => updateReservationField('address', e.target.value)}
                  required
                  rows="3"
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    width: '100%',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div className="evaluation-form-group">
                <label>📝 {t('security_page.notes', { defaultValue: i18n.language === 'ar' ? 'ملاحظات (اختياري)' : i18n.language === 'fr' ? 'Notes (optionnel)' : 'Notes (optional)' })}</label>
                <textarea
                  value={reservationForm.notes}
                  onChange={(e) => updateReservationField('notes', e.target.value)}
                  rows="3"
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    width: '100%',
                    resize: 'vertical'
                  }}
                />
              </div>

              {error && (
                <div style={{color: 'red', marginBottom: '16px', padding: '12px', background: '#fee2e2', borderRadius: '8px'}}>
                  {error}
                </div>
              )}

              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button
                  type="button"
                  onClick={() => setShowReservationForm(false)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    background: 'white',
                    color: '#333',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  {t('security_page.cancel', { defaultValue: i18n.language === 'ar' ? 'إلغاء' : i18n.language === 'fr' ? 'Annuler' : 'Cancel' })}
                </button>
                <button
                  type="submit"
                  disabled={reservationLoading}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: reservationLoading ? '#94a3b8' : '#667eea',
                    color: 'white',
                    cursor: reservationLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  {reservationLoading 
                    ? t('security_page.submitting', { defaultValue: i18n.language === 'ar' ? 'جاري الإرسال...' : i18n.language === 'fr' ? 'Envoi...' : 'Submitting...' })
                    : t('security_page.submit', { defaultValue: i18n.language === 'ar' ? 'إرسال' : i18n.language === 'fr' ? 'Soumettre' : 'Submit' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Message */}
      {reservationSuccess && (
        <div className="evaluation-modal-overlay" style={{ zIndex: 10001 }}>
          <div className="evaluation-modal" style={{ maxWidth: '500px' }}>
            <div style={{textAlign: 'center', padding: '40px 20px'}}>
              <div style={{fontSize: '4rem', marginBottom: '20px'}}>✅</div>
              <h2 style={{marginBottom: '16px', color: '#22c55e'}}>
                {t('security_page.reservation_success_title') || 'Réservation soumise avec succès!'}
              </h2>
              <p style={{marginBottom: '24px', color: '#64748b'}}>
                {i18n.language === 'ar' ? 'سنتصل بكم في أقرب وقت.' : 
                 i18n.language === 'fr' ? 'Nous vous contacterons dans les plus brefs délais.' : 
                 'We will contact you as soon as possible.'}
              </p>
              <button 
                className="reservation-success-button"
                onClick={() => {
                  setReservationSuccess(false);
                  navigate('/security');
                }}
              >
                {i18n.language === 'ar' ? 'العودة إلى الأمن' : 
                 i18n.language === 'fr' ? 'Retour à la sécurité' : 
                 'Back to Security'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: 16,
          right: 16,
          background: 'linear-gradient(90deg,#22c55e,#16a34a)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 8,
          boxShadow: '0 10px 20px rgba(0,0,0,0.12)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{fontSize: 18}}>✓</span>
          <span style={{fontWeight: 600}}>{toast.text}</span>
        </div>
      )}
    </div>
  );
}


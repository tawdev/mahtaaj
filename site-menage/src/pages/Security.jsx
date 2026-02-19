import React, { useEffect, useState, useCallback } from 'react';
import './Security.css';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Security() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRoleData, setSelectedRoleData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, text: '' });
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);

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

    return roleName;
  };

  const getTranslatedRoleDescription = (roleName) => {
    if (!roleName) return t('security_page.description_not_available');

    // Simple fallback for descriptions
    return t(`security_roles.${roleName.toLowerCase().replace(/\s+/g, '_')}.description`, roleName);
  };

  const loadRoles = useCallback(async () => {
    try {
      setError('');
      setLoading(true);

      const { data, error: rolesError } = await supabase
        .from('security_roles')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });

      if (rolesError) throw rolesError;

      setRoles(data || []);
    } catch (e) {
      console.error('[Security] Error:', e);
      setError(t('security_page.load_roles_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadRoles();

    // Check if we came back from login with an intent to reserve
    const pending = sessionStorage.getItem('security_pending_context');
    if (pending) {
      try {
        const { pendingReservation, roleId } = JSON.parse(pending);
        if (pendingReservation) {
          console.log('[Security] Auto-redirecting to reservation page for role:', roleId);
          sessionStorage.removeItem('security_pending_context');
          navigate(`/reservation-security/${roleId}`);
        }
      } catch (err) {
        console.error('Error parsing pending context:', err);
      }
    }
  }, [loadRoles, i18n.language, navigate]);

  const openReservationForm = async (role) => {
    // Check authentication via Supabase
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Set pending context to re-trigger after login
      sessionStorage.setItem('security_pending_context', JSON.stringify({ pendingReservation: true, roleId: role.id }));

      // Store returnUrl as the current page
      localStorage.setItem('auth_return_url', '/security');

      setToast({ show: true, text: t('security_page.please_login_to_reserve') });
      setTimeout(() => setToast({ show: false, text: '' }), 3000);
      setTimeout(() => { navigate('/login-register', { state: { returnUrl: '/security' } }); }, 1000);
      return;
    }
    navigate(`/reservation-security/${role.id}`);
  };

  // Modal logic removed

  return (
    <div className="shop-page">
      <section className="security-hero" data-aos="fade-down">
        {/* Back Button Container */}
        <div className="back-button-top-container">
          <Link to="/tous-les-services" className="back-button-top">
            <span className="back-icon" style={{ transform: i18n.language === 'ar' ? 'rotate(180deg)' : 'none' }}>←</span>
            {t('security_page.back_home', 'Retour à l\'accueil')}
          </Link>
        </div>
        <h1>{t('security_page.hero_title', 'Sécurité Professionnelle')}</h1>
        <p>{t('security_page.hero_subtitle', 'Des solutions de protection sur mesure pour votre tranquillité d\'esprit.')}</p>
      </section>

      {reservationSuccess && (
        <div className="reservation-success-card">
          <div className="reservation-success-content" data-aos="zoom-in">
            <div className="reservation-success-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" />
              </svg>
            </div>
            <h2 className="reservation-success-title">{t('security_page.success_title', 'Réservation confirmée !')}</h2>
            <p className="reservation-success-message">{t('security_page.success_message', 'Nous vous contacterons dans les plus brefs délais.')}</p>
            <button className="reservation-success-button" onClick={() => navigate('/')}>{t('security_page.back_home', 'Retour à l\'accueil')}</button>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="toast-notification" style={{
          position: 'fixed', top: 80, right: 20, background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(8px)', color: '#fff', padding: '16px 24px', borderRadius: 16, zIndex: 3000
        }}>
          {toast.text}
        </div>
      )}

      <div className="security-grid">
        {loading ? (
          <div className="loader-container"><div className="admin-loader"></div></div>
        ) : roles.map((role, idx) => (
          <div key={role.id} className="security-card" data-aos="fade-up" data-aos-delay={idx * 100} onClick={() => navigate(`/security/role/${role.id}`)}>
            <div className="security-card-image-container">
              <img src={role.image || '/nettoyage1.jpg'} alt={role.name} className="security-card-image" />
            </div>
            <div className="security-card-content">
              <h3 className="security-name">{getTranslatedRole(role.name)}</h3>
              <p className="security-desc">{getTranslatedRoleDescription(role.name)}</p>
              <button className="security-card-button" onClick={(e) => { e.stopPropagation(); openReservationForm(role); }}>
                {t('security_page.reserve_now', 'Réserver maintenant')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reservation section removed - moved to separate page */}
    </div>
  );
}

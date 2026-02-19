import React, { useEffect, useState, useCallback } from 'react';
import './Security.css';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function SecurityRoleDetails() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [roleData, setRoleData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, text: '' });

  const loadRoleDetails = useCallback(async (roleId) => {
    try {
      setLoading(true);
      const { data, error: roleError } = await supabase
        .from('security_roles')
        .select('*')
        .eq('id', roleId)
        .single();

      if (roleError) throw roleError;
      setRoleData(data);
    } catch (err) {
      console.error(err);
      setError(t('security_page.error_loading_role'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (id) loadRoleDetails(id);

    // Check if we came back from login with an intent to reserve
    const pending = sessionStorage.getItem('security_pending_context');
    if (pending) {
      try {
        const { pendingReservation, roleId } = JSON.parse(pending);
        if (pendingReservation && roleId === id) {
          console.log('[SecurityDetails] Auto-redirecting to reservation page');
          sessionStorage.removeItem('security_pending_context');
          navigate(`/reservation-security/${id}`);
        }
      } catch (err) {
        console.error('Error parsing pending context:', err);
      }
    }
  }, [id, loadRoleDetails, navigate]);

  const openReservationForm = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Set pending context to re-trigger after login
      sessionStorage.setItem('security_pending_context', JSON.stringify({ pendingReservation: true, roleId: id }));
      localStorage.setItem('auth_return_url', window.location.pathname);

      setToast({ show: true, text: t('security_page.please_login_to_reserve') });
      setTimeout(() => setToast({ show: false, text: '' }), 3000);
      setTimeout(() => navigate('/login-register', { state: { returnUrl: window.location.pathname } }), 1000);
      return;
    }

    navigate(`/reservation-security/${id}`);
  };

  if (loading) return <div className="loader-container"><div className="admin-loader"></div></div>;
  if (!roleData) return <div className="error-container">Role not found</div>;

  return (
    <div className="shop-page">
      <div className="security-details-hero">
        <div className="security-details-hero-content">
          <Link to="/security" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12,19 5,12 12,5" />
            </svg>
            {t('security_page.back_to_list', 'Retour aux services')}
          </Link>
          <h1 className="security-details-title">
            {t(`security_roles.${roleData.name.toLowerCase().replace(/\s+/g, '_')}.title`, roleData.name)}
          </h1>
        </div>
      </div>

      <div className="security-details-content">
        <div className="security-details-card" data-aos="fade-up">
          <img src={roleData.image || '/nettoyage1.jpg'} alt={roleData.name} className="security-details-image" />
          <div className="security-details-info">
            <p className="security-details-desc">
              {t(`security_roles.${roleData.name.toLowerCase().replace(/\s+/g, '_')}.description`, roleData.description)}
            </p>
            <button className="book-now-large-btn" onClick={openReservationForm}>
              {t('security_page.reserve_this_role', 'Réserver ce service')}
            </button>
          </div>
        </div>
      </div>

      {toast.show && <div className="toast-notification">{toast.text}</div>}
    </div>
  );
}

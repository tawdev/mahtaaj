import React, { useEffect, useState, useCallback } from 'react';
import './Security.css';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

export default function Security() {
  const { t, i18n } = useTranslation();

  const getTranslatedRole = (roleName) => {
    if (!roleName) return t('security_page.role_not_available');
    
    // Direct translations for common roles
    const directTranslations = {
      'Chef de sécurité': t('security_page.chef_de_securite', 'رئيس الأمان'),
      'Agent de sûreté': t('security_page.agent_de_surete', 'وكيل الأمان المتخصص'),
      'Agent de sécurité': t('security_page.agent_de_securite', 'وكيل الأمان العام'),
      'Superviseur sécurité': t('security_page.superviseur_securite', 'مشرف فريق الأمان')
    };
    
    if (directTranslations[roleName]) {
      return directTranslations[roleName];
    }
    
    // Create role key from name
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
    
    // Try multiple key variations
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
    
    return roleName; // Fallback to original name
  };

  const getTranslatedRoleDescription = (roleName) => {
    if (!roleName) return t('security_page.description_not_available');
    
    // Create role key from name
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
    
    // Try multiple key variations
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
    
    return roleName; // Fallback to original name
  };
  const [personnel, setPersonnel] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRoleData, setSelectedRoleData] = useState(null);
  const [roleImage, setRoleImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, text: '' });
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    type_reservation: 'jour',
    date_reservation: '',
    heure_debut: '',
    heure_fin: '',
    phone: '',
    prix_total: 0,
    role_id: null,
  });

  // Load roles function with useCallback to prevent unnecessary re-renders
  const loadRoles = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      
      console.log('[Security] Loading security roles from Supabase');
      
      const { data, error } = await supabase
        .from('security_roles')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });

      if (error) {
        console.error('[Security] Error loading roles:', error);
        setError(t('security_page.load_roles_error') + ': ' + error.message);
        setRoles([]); // Ensure roles is set even on error
        setLoading(false); // Make sure loading is set to false on error
        return;
      }

      console.log('[Security] Loaded roles:', data?.length || 0, 'roles');
      console.log('[Security] Roles data:', data);
      
      // Ensure we set roles even if data is null/undefined
      const rolesData = Array.isArray(data) ? data : [];
      
      // Set roles first, then loading to false
      setRoles(rolesData);
      console.log('[Security] Roles state updated, count:', rolesData.length);
      
      // Force a re-render by ensuring state update completes
      if (rolesData.length === 0) {
        console.warn('[Security] No roles found');
      }
    } catch (e) {
      console.error('[Security] Exception loading roles:', e);
      setError(t('security_page.load_roles_error') + ': ' + e.message);
      setRoles([]); // Ensure roles is set even on error
    } finally {
      setLoading(false);
      console.log('[Security] Loading set to false');
    }
  }, [t]);

  // Initial load on mount - only once
  useEffect(() => {
    let isMounted = true;
    let cancelled = false;
    
    const fetchData = async () => {
      if (!isMounted || cancelled) return;
      
      try {
        await loadRoles();
      } catch (error) {
        if (!cancelled) {
          console.error('[Security] Error in initial load:', error);
        }
      }
    };
    
    // Start loading immediately
    fetchData();
    
    return () => {
      isMounted = false;
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Reload data when language changes
  useEffect(() => {
    // Skip initial mount - only reload when language actually changes
    const reloadData = async () => {
      await loadRoles();
      if (selectedRole) {
        // Force reload role details with the new language
        await loadRoleDetails(selectedRole);
      }
    };
    
    try {
      // Persist current language just in case
      localStorage.setItem('i18nextLng', i18n.language || 'fr');
    } catch (_) {}
    
    // Only reload if we have roles already loaded (language change, not initial mount)
    if (roles.length > 0 || selectedRole) {
      reloadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  // Prevent background scroll and ensure modals appear above navbar
  useEffect(() => {
    if (showReservationForm) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = previousOverflow; };
    }
    return undefined;
  }, [showReservationForm]);

  const loadRoleDetails = useCallback(async (roleId) => {
    if (!roleId) return;
    
    try {
      setError('');
      setLoading(true);
      
      console.log('[Security] Loading role details for role_id:', roleId);
      
      let role = null;
      
      // Reload roles if not loaded yet
      if (roles.length === 0) {
        const { data: rolesData, error: rolesError } = await supabase
          .from('security_roles')
          .select('*')
          .eq('is_active', true)
          .order('order', { ascending: true });
        
        if (rolesError) {
          console.error('[Security] Error loading roles:', rolesError);
          throw rolesError;
        }
        
        const rolesList = Array.isArray(rolesData) ? rolesData : [];
        setRoles(rolesList);
        
        role = rolesList.find(r => r.id === roleId);
      } else {
        // Find the role data
        role = roles.find(r => r.id === roleId);
      }
      
      if (role) {
        setSelectedRoleData(role);
        setSelectedRole(roleId);
      } else {
        console.warn('[Security] Role not found:', roleId);
        setError(t('security_page.role_not_found') || 'Role not found');
        return;
      }
      
      // Get first agent image for this role from securities table
      // Note: securities table may not have role_id, so we'll get any active security agent
      const { data: securitiesData, error: securitiesError } = await supabase
        .from('securities')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'active')
        .limit(1);
      
      if (securitiesError) {
        console.error('[Security] Error loading securities:', securitiesError);
      } else if (securitiesData && securitiesData.length > 0) {
        const firstAgent = securitiesData[0];
        if (firstAgent && (firstAgent.photo || firstAgent.photo_url)) {
          // Helper function to get image URL from Supabase Storage
          const getImageUrl = (imagePath) => {
            if (!imagePath) return null;
            
            // If it's already a Supabase URL, return it
            if (imagePath.includes('supabase.co/storage')) {
              return imagePath;
            }
            
            // If it's an old Laravel path, extract filename and try to get from Supabase
            if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000') || imagePath.startsWith('/storage/')) {
              const filename = imagePath.split('/').pop();
              if (filename) {
                const { data: { publicUrl } } = supabase.storage
                  .from('employees')
                  .getPublicUrl(filename);
                return publicUrl;
              }
              return null;
            }
            
            // If it's just a filename, try to get from Supabase Storage
            if (!imagePath.includes('/') && !imagePath.includes('http')) {
              const { data: { publicUrl } } = supabase.storage
                .from('employees')
                .getPublicUrl(imagePath);
              return publicUrl;
            }
            
            return imagePath;
          };
          
          const imageUrl = getImageUrl(firstAgent.photo_url || firstAgent.photo);
          setRoleImage(imageUrl || '/nettoyage1.jpg');
        } else {
          setRoleImage('/nettoyage1.jpg');
        }
      } else {
        setRoleImage('/nettoyage1.jpg');
      }
    } catch (e) { 
      console.error('[Security] Error loading role details:', e);
      setError(t('security_page.load_personnel_error') + ': ' + e.message); 
    } finally {
      setLoading(false);
    }
  }, [roles, t]);

  const openReservationForm = () => {
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userInfo?.id) {
      setToast({ show: true, text: t('security_page.please_login_to_reserve') });
      setTimeout(() => setToast({ show: false, text: '' }), 3000);
      setTimeout(() => { window.location.href = '/login-register'; }, 600);
      return;
    }
    setReservationForm({
      type_reservation: 'jour',
      date_reservation: '',
      heure_debut: '',
      heure_fin: '',
      phone: '',
      prix_total: 0,
      role_id: selectedRole,
    });
    setShowReservationForm(true);
  };

  const calculateReservationPrice = (form) => {
    if (form.type_reservation === 'jour') {
      return 800; // prix par jour
    }
    if (form.type_reservation === 'heure') {
      const start = form.heure_debut ? Date.parse(`1970-01-01T${form.heure_debut}:00`) : 0;
      const end = form.heure_fin ? Date.parse(`1970-01-01T${form.heure_fin}:00`) : 0;
      if (end > start) {
        const hours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
        return hours * 120; // 120 / heure
      }
      return 120; // minimum 1h
    }
    return 0;
  };

  const updateReservationField = (key, value) => {
    setReservationForm(prev => {
      const next = { ...prev, [key]: value };
      next.prix_total = calculateReservationPrice(next);
      return next;
    });
  };

  const submitReservation = useCallback(async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (reservationLoading) {
      console.log('⚠️ Already submitting, ignoring duplicate submission');
      return;
    }
    
    setReservationLoading(true);
    
    try {
      // Validation côté client
      if (!reservationForm.date_reservation) {
        setToast({ show: true, text: t('security_page.please_select_date') });
        setTimeout(() => setToast({ show: false, text: '' }), 3000);
        setReservationLoading(false);
        return;
      }
      
      if (!reservationForm.phone.trim()) {
        setToast({ show: true, text: t('security_page.please_enter_phone') });
        setTimeout(() => setToast({ show: false, text: '' }), 3000);
        setReservationLoading(false);
        return;
      }
      
      if (!reservationForm.role_id) {
        setToast({ show: true, text: t('security_page.role_not_selected') });
        setTimeout(() => setToast({ show: false, text: '' }), 3000);
        setReservationLoading(false);
        return;
      }
      
      if (reservationForm.type_reservation === 'heure') {
        if (!reservationForm.heure_debut || !reservationForm.heure_fin) {
          setToast({ show: true, text: t('security_page.please_select_hours') });
          setTimeout(() => setToast({ show: false, text: '' }), 3000);
          setReservationLoading(false);
          return;
        }
        
        if (reservationForm.heure_fin <= reservationForm.heure_debut) {
          setToast({ show: true, text: t('security_page.end_time_after_start') });
          setTimeout(() => setToast({ show: false, text: '' }), 3000);
          setReservationLoading(false);
          return;
        }
      }
      
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('🔍 User info:', userInfo);
      
      // Get user ID from Supabase session (must be UUID, not numeric ID)
      // user_id in reserve_security is UUID type (references auth.users)
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null; // Must be UUID from Supabase Auth
      
      // Note: user_id can be null if user is not logged in via Supabase Auth
      // The reservation will still be saved with firstname, email, phone for identification
      // The table allows user_id to be NULL (ON DELETE SET NULL)

      // Calculate total price
      const totalPrice = calculateReservationPrice(reservationForm);
      
      // Prepare location - must not be empty (NOT NULL constraint)
      const location = userInfo.location || reservationForm.location || 'Non spécifié';
      
      // Prepare date_reservation
      const dateReservation = reservationForm.date_reservation ? new Date(reservationForm.date_reservation).toISOString().split('T')[0] : null;
      
      // Prepare preferred_date (TIMESTAMPTZ)
      const preferredDate = reservationForm.date_reservation ? new Date(reservationForm.date_reservation).toISOString() : null;
      
      const insertData = {
        user_id: userId || null,
        security_id: null, // Will be assigned later by admin
        firstname: userInfo.firstname || userInfo.name || 'User',
        phone: reservationForm.phone.trim(),
        location: location, // Required field, must not be empty
        email: userInfo.email || null,
        message: `Reservation for role_id: ${reservationForm.role_id}, Type: ${reservationForm.type_reservation}`,
        total_price: totalPrice || 0,
        status: 'pending',
        preferred_date: preferredDate,
        admin_notes: `Type: ${reservationForm.type_reservation}, Start: ${reservationForm.heure_debut || 'N/A'}, End: ${reservationForm.heure_fin || 'N/A'}`,
        // Add new columns if they exist
        type_reservation: reservationForm.type_reservation || 'jour',
        date_reservation: dateReservation,
        heure_debut: reservationForm.type_reservation === 'heure' && reservationForm.heure_debut ? reservationForm.heure_debut : null,
        heure_fin: reservationForm.type_reservation === 'heure' && reservationForm.heure_fin ? reservationForm.heure_fin : null,
        role_id: reservationForm.role_id || null
      };
      
      console.log('[Security] Submitting reservation:', insertData);

      const { data, error } = await supabase
        .from('reserve_security')
        .insert(insertData)
        .select();

      if (error) {
        console.error('[Security] Error submitting reservation:', error);
        const errorMsg = error.message || 'Erreur lors de la réservation';
        setToast({ show: true, text: errorMsg });
        setTimeout(() => setToast({ show: false, text: '' }), 3000);
        setReservationLoading(false);
        return;
      }

      console.log('[Security] Reservation submitted successfully:', data);
      setToast({ show: true, text: t('security_page.reservation_confirmed') });
      setTimeout(() => setToast({ show: false, text: '' }), 2500);
      setShowReservationForm(false);
      setReservationLoading(false);
    } catch (err) {
      console.error('[Security] Exception during reservation:', err);
      setToast({ show: true, text: t('security_page.reservation_error') + ': ' + err.message });
      setTimeout(() => setToast({ show: false, text: '' }), 3000);
      setReservationLoading(false);
    }
  }, [reservationLoading, reservationForm, t]);

  // Debug: Log current state on every render
  console.log('[Security] Render state:', { 
    loading, 
    rolesCount: roles.length, 
    selectedRole, 
    error: !!error,
    hasRoles: roles.length > 0
  });

  return (
    <div className="shop-page">
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
      <div className="shop-container">
        <header className="shop-header" style={{marginBottom: 24}}>
          <div className="shop-header-content">
            <h1 className="shop-title" data-aos="fade-up" data-aos-delay="100">{t('security_page.title')}</h1>
            <p className="shop-description" data-aos="fade-up" data-aos-delay="200">
              {t('security_page.subtitle')}
            </p>
          </div>
        </header>

        {error && (
          <div style={{color: 'red', textAlign: 'center', margin: '20px 0', padding: '12px', background: '#fee2e2', borderRadius: '8px'}}>
            {error}
          </div>
        )}

        {/* Loading state - only show when loading and no roles yet */}
        {loading && roles.length === 0 && !error && (
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
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Empty state - no roles and not loading */}
        {!loading && !selectedRole && roles.length === 0 && !error && (
          <div style={{textAlign: 'center', margin: '40px 0', color: '#64748b'}}>
            <p>{t('security_page.no_roles_available') || 'No security roles available'}</p>
          </div>
        )}

        {/* Roles list - show when we have roles and no role is selected */}
        {!selectedRole && roles.length > 0 && (
          <div 
            className="security-grid" 
            data-aos="fade-up" 
            data-aos-delay="300" 
            key={`roles-grid-${roles.length}`}
            style={{ 
              display: 'grid',
              visibility: 'visible',
              opacity: 1
            }}
          >
            {roles.map((role, idx) => {
              if (!role || !role.id) {
                console.warn('[Security] Invalid role at index:', idx, role);
                return null;
              }
              return (
                <article 
                  key={role.id || `role-${idx}`}
                  className="security-card role-card" 
                  style={{
                    animationDelay: `${0.1 + idx * 0.1}s`
                  }}
                >
                  <div className="security-card-content">
                    <h3 className="security-name">
                      {role.name || getTranslatedRole(role.name) || t('security_page.role_not_available')}
                    </h3>
                    <p className="security-desc">
                      {role.description || getTranslatedRoleDescription(role.name) || t('security_page.description_not_available')}
                    </p>
                    <button 
                      className="security-card-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadRoleDetails(role.id);
                      }}
                    >
                      {t('security_page.click_to_see_agents')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {selectedRole && (
          // Page de détail du rôle
          loading && !selectedRoleData ? (
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
          ) : selectedRoleData ? (
            <div className="role-detail-page">
              {/* Bouton de retour */}
              <button 
                onClick={() => {
                  setSelectedRole(null);
                  setSelectedRoleData(null);
                  setRoleImage(null);
                }}
                className="role-back-button"
              >
                ← {t('security_page.back_to_roles')}
              </button>

              {/* Titre */}
              <h1 className="role-detail-title">
                {getTranslatedRole(selectedRoleData.name) || selectedRoleData.name || t('security_page.role_not_available')}
              </h1>

              {/* Image */}
              {roleImage && (
                <div className="role-image-container">
                  <img 
                    src={roleImage} 
                    alt={selectedRoleData.name}
                    className="role-detail-image"
                  />
                  <div className="role-image-overlay">
                    <p className="role-image-text">
                      {getTranslatedRole(selectedRoleData.name) || selectedRoleData.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="role-description-section">
                <p className="role-description-text">
                  {selectedRoleData.description || getTranslatedRoleDescription(selectedRoleData.name) || t('security_page.description_not_available')}
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
          ) : (
            <div style={{textAlign: 'center', margin: '40px 0', color: '#64748b'}}>
              <p>{t('security_page.role_not_found') || 'Role not found'}</p>
              <button 
                onClick={() => {
                  setSelectedRole(null);
                  setSelectedRoleData(null);
                  setRoleImage(null);
                }}
                className="role-back-button"
                style={{marginTop: '16px'}}
              >
                ← {t('security_page.back_to_roles')}
              </button>
            </div>
          )
        )}
      </div>
      
      {/* Modal de réservation */}
      {showReservationForm && (
        <div className="evaluation-modal-overlay" style={{ zIndex: 10000 }}>
          <div className="evaluation-modal">
            <div className="evaluation-modal-header">
              <h3>{t('security_page.reserve')} {selectedRoleData?.name || t('security_page.security_role')}</h3>
              <button 
                className="evaluation-modal-close"
                onClick={() => setShowReservationForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={submitReservation} className="evaluation-form">
              <div className="evaluation-form-group">
                <label>{t('security_page.reservation_type')}</label>
                <select
                  value={reservationForm.type_reservation}
                  onChange={(e) => updateReservationField('type_reservation', e.target.value)}
                >
                  <option value="jour">{t('security_page.daily')}</option>
                  <option value="heure">{t('security_page.hourly')}</option>
                </select>
              </div>

              <div className="evaluation-form-group">
                <label>{t('security_page.date')}</label>
                <input
                  type="date"
                  value={reservationForm.date_reservation}
                  onChange={(e) => updateReservationField('date_reservation', e.target.value)}
                  required
                />
              </div>

              <div className="evaluation-form-group">
                <label>{t('security_page.phone_number')}</label>
                <input
                  type="tel"
                  value={reservationForm.phone}
                  onChange={(e) => updateReservationField('phone', e.target.value)}
                  placeholder={t('security_page.phone_placeholder')}
                  required
                  pattern="[0-9\s\+\-\(\)]{10,}"
                  title={t('security_page.phone_validation')}
                />
              </div>

              {reservationForm.type_reservation === 'heure' && (
                <div className="time-inputs-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="evaluation-form-group">
                    <label>{t('security_page.start_time')}</label>
                    <input
                      type="time"
                      value={reservationForm.heure_debut}
                      onChange={(e) => updateReservationField('heure_debut', e.target.value)}
                      required
                    />
                  </div>
                  <div className="evaluation-form-group">
                    <label>{t('security_page.end_time')}</label>
                    <input
                      type="time"
                      value={reservationForm.heure_fin}
                      onChange={(e) => updateReservationField('heure_fin', e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div style={{
                background: '#f7f8fa',
                borderRadius: 8,
                padding: 12,
                textAlign: 'center',
                fontWeight: 700,
                color: '#16a34a',
                marginTop: 8
              }}>
                {t('security_page.total_price')} {calculateReservationPrice(reservationForm).toFixed(2)} DH
              </div>

              <div className="evaluation-form-actions">
                <button 
                  type="button" 
                  className="evaluation-cancel-btn" 
                  onClick={() => setShowReservationForm(false)}
                  disabled={reservationLoading}
                >
                  {t('security_page.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="evaluation-submit-btn"
                  disabled={reservationLoading}
                >
                  {reservationLoading ? t('security_page.confirming') : t('security_page.confirm_reservation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import './Profile.css';

export default function Profile() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [securityReservations, setSecurityReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'

  const navigate = useNavigate();

  // Form data for editing profile
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });

  // Check authentication and load user data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);

        // Check Supabase Auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.log('[Profile] No session, redirecting to login');
          navigate('/login');
          return;
        }

        console.log('[Profile] Loading user data from Supabase');
        const userId = session.user.id;

        // Load user profile from Supabase Auth
        const userData = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
          email: session.user.email || ''
        };

        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          password: '',
          password_confirmation: ''
        });

        // Load user orders from Supabase
        console.log('[Profile] Loading orders for user:', userId);
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('[Profile] Error loading orders:', ordersError);
        } else {
          console.log('[Profile] Loaded orders:', ordersData?.length || 0);
          setOrders(Array.isArray(ordersData) ? ordersData : []);
        }

        // Load user reservations from Supabase
        console.log('[Profile] Loading reservations for user:', userId);
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (reservationsError) {
          console.error('[Profile] Error loading reservations:', reservationsError);
        } else {
          console.log('[Profile] Loaded reservations:', reservationsData?.length || 0);
          setReservations(Array.isArray(reservationsData) ? reservationsData : []);
        }

        // Load user security reservations from Supabase
        console.log('[Profile] Loading security reservations for user:', userId);
        const { data: securityReservationsData, error: securityReservationsError } = await supabase
          .from('reserve_security')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (securityReservationsError) {
          console.error('[Profile] Error loading security reservations:', securityReservationsError);
        } else {
          console.log('[Profile] Loaded security reservations:', securityReservationsData?.length || 0);
          setSecurityReservations(Array.isArray(securityReservationsData) ? securityReservationsData : []);
        }
      } catch (error) {
        console.error('[Profile] Exception loading profile:', error);
        setErrorMessage(t('profile.personal_info.messages.loading_error'));
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [navigate, t]);

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle password confirmation visibility
  const togglePasswordConfirmationVisibility = () => {
    setShowPasswordConfirmation(!showPasswordConfirmation);
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validate password confirmation
    if (formData.password && formData.password !== formData.password_confirmation) {
      showToast(t('profile.personal_info.messages.passwords_dont_match'), 'error');
      setIsSaving(false);
      return;
    }

    try {
      // Check Supabase Auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        showToast(t('profile.personal_info.messages.connection_error'), 'error');
        navigate('/login');
        return;
      }

      console.log('[Profile] Updating user profile');

      // Update user metadata (name) in Supabase Auth
      const updates = {
        data: {
          name: formData.name
        }
      };

      // Update email if changed
      if (formData.email !== session.user.email) {
        updates.email = formData.email;
      }

      // Update password if provided
      if (formData.password) {
        updates.password = formData.password;
      }

      const { data: updateData, error: updateError } = await supabase.auth.updateUser(updates);

      if (updateError) {
        console.error('[Profile] Error updating profile:', updateError);
        showToast(updateError.message || t('profile.personal_info.messages.update_error'), 'error');
        return;
      }

      // Update local user state
      const updatedUser = {
        id: session.user.id,
        name: formData.name,
        email: updateData.user?.email || formData.email
      };

      setUser(updatedUser);
      showToast(t('profile.personal_info.messages.profile_updated'), 'success');
      setIsEditing(false);

      // Reset password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        password_confirmation: ''
      }));

      // Reset password visibility
      setShowPassword(false);
      setShowPasswordConfirmation(false);

      console.log('[Profile] Profile updated successfully');
    } catch (error) {
      console.error('[Profile] Exception updating profile:', error);
      showToast(t('profile.personal_info.messages.connection_error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Show order details
  const showOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Show reservation details
  const showReservationDetails = (reservation) => {
    setSelectedReservation(reservation);
  };

  // Show security reservation details
  const showSecurityReservationDetails = (securityReservation) => {
    setSelectedReservation(securityReservation);
  };

  // Filter orders by status
  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'all') return true;
    return order.status === orderFilter;
  });

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'shipped': return '#8b5cf6';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Get status text using translations
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return t('profile.orders.filters.pending');
      case 'processing': return t('profile.orders.filters.processing');
      case 'shipped': return t('profile.orders.filters.shipped');
      case 'delivered': return t('profile.orders.filters.delivered');
      case 'cancelled': return t('profile.orders.filters.cancelled');
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>{t('profile.loading')}</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-layout">
        {/* Sidebar - Identity Card */}
        <aside className="profile-sidebar">
          <div className="user-card" data-aos="fade-right">
            <div className="avatar-placeholder">
              {user?.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              )}
            </div>
            <div className="user-info">
              <h2 className="user-name">{user?.name || t('profile.user.anonymous')}</h2>
              <p className="user-email">{user?.email || ''}</p>
            </div>
            <div className="sidebar-actions" style={{ marginTop: '24px' }}>
              <button onClick={handleLogout} className="details-button" style={{ width: '100%', justifyContent: 'center', border: 'none', background: '#fef2f2', color: '#ef4444' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                Déconnexion
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="profile-main">
          {/* Dashboard Header & Stats */}
          <header className="dashboard-header" data-aos="fade-down">
            <h1 className="profile-title">{t('profile.title')}</h1>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '24px' }}>
              <div className="stat-card" style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: 'var(--dash-shadow)', border: '1px solid var(--dash-border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--dash-text-muted)', textTransform: 'uppercase' }}>Commandes</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '4px' }}>{orders.length}</div>
              </div>
              <div className="stat-card" style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: 'var(--dash-shadow)', border: '1px solid var(--dash-border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--dash-text-muted)', textTransform: 'uppercase' }}>Réservations</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '4px' }}>{reservations.length + securityReservations.length}</div>
              </div>
            </div>
          </header>

          {/* Navigation Tabs */}
          <nav className="profile-tabs" data-aos="fade-up">
            <button
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              <span>{t('profile.tabs.personal_info')}</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 13 1.5 8h14l1.5-8" /><path d="M3 3h1.5L7 13h10l2.5-10H21" /></svg>
              <span>{t('profile.tabs.orders')}</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'reservations' ? 'active' : ''}`}
              onClick={() => setActiveTab('reservations')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
              <span>{t('profile.tabs.reservations')}</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'security-reservations' ? 'active' : ''}`}
              onClick={() => setActiveTab('security-reservations')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span>Sécurité</span>
            </button>
          </nav>

          {/* Success/Error Notifications */}
          <div className="notifications-container">
            {successMessage && (
              <div className="success-message" style={{ marginBottom: '16px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="error-message" style={{ marginBottom: '16px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                {errorMessage}
              </div>
            )}
          </div>

          {/* Tab Content Cards */}
          <section className="dashboard-content" data-aos="fade-up">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="tab-content-card">
                <div className="tab-card-header">
                  <h2 className="tab-card-title">{t('profile.personal_info.title')}</h2>
                  <button
                    type="button"
                    className={`edit-button ${isEditing ? 'cancel' : ''}`}
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setErrorMessage('');
                      setSuccessMessage('');
                      if (isEditing) setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    <span>{isEditing ? t('profile.personal_info.cancel') : t('profile.personal_info.edit')}</span>
                  </button>
                </div>

                <div className="form-fields">
                  <div className="form-group">
                    <label>{t('profile.personal_info.fields.full_name')}</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="form-input"
                      placeholder="Ex: Jean Dupont"
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('profile.personal_info.fields.email')}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="form-fields" style={{ marginTop: '24px' }}>
                    <div className="form-group">
                      <label>{t('profile.personal_info.fields.new_password')}</label>
                      <div className="password-input-container">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                        <button type="button" className="password-toggle-btn" onClick={togglePasswordVisibility}>
                          {showPassword ? 'Masquer' : 'Afficher'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="save-section" style={{ marginTop: '32px', textAlign: 'right' }}>
                    <button className="save-button" onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? 'Enregistrement...' : t('profile.personal_info.save')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="tab-content-card">
                <div className="tab-card-header">
                  <h2 className="tab-card-title">{t('profile.orders.title')}</h2>
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="form-input"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="delivered">Livré</option>
                  </select>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="empty-orders">
                    <div className="empty-icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                    </div>
                    <h3>Pas encore de commande</h3>
                    <p>Découvrez nos produits pour commencer.</p>
                    <button className="shop-button" onClick={() => navigate('/shop')}>Boutique</button>
                  </div>
                ) : (
                  <div className="orders-list">
                    {filteredOrders.map(order => (
                      <div key={order.id} className="order-card">
                        <div className="order-header">
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--dash-text-muted)' }}>#{order.id}</span>
                            <div style={{ fontSize: '1rem', fontWeight: '700' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                          </div>
                          <span className="status-badge" style={{ backgroundColor: getStatusColor(order.status), color: 'white' }}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600' }}>{order.total} DH</span>
                          <button onClick={() => showOrderDetails(order)} className="details-button">Détails</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reservations Tab */}
            {activeTab === 'reservations' && (
              <div className="tab-content-card">
                <div className="tab-card-header">
                  <h2 className="tab-card-title">Mes Réservations</h2>
                </div>
                {reservations.length === 0 ? (
                  <div className="empty-orders">
                    <div className="empty-icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                    </div>
                    <h3>Aucune réservation</h3>
                    <p>Réservez un service professionnel dès maintenant.</p>
                    <button className="shop-button" onClick={() => navigate('/services')}>Voir les services</button>
                  </div>
                ) : (
                  <div className="reservations-list">
                    {reservations.map(res => (
                      <div key={res.id} className="reservation-card" onClick={() => showReservationDetails(res)} style={{ cursor: 'pointer' }}>
                        {/* Simplified reservation card for V2 */}
                        <div className="order-header">
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--dash-text-muted)' }}>#{res.id}</span>
                            <div style={{ fontSize: '1rem', fontWeight: '700' }}>{res.service || 'Nettoyage'}</div>
                          </div>
                          <span className="status-badge" style={{ backgroundColor: getStatusColor(res.status), color: 'white' }}>
                            {getStatusText(res.status)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--dash-text-muted)' }}>{new Date(res.created_at).toLocaleDateString()}</span>
                          <span style={{ fontWeight: '600' }}>{res.total_price} DH</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security-reservations' && (
              <div className="tab-content-card">
                <div className="tab-card-header">
                  <h2 className="tab-card-title">Services Sécurité</h2>
                </div>
                {securityReservations.length === 0 ? (
                  <div className="empty-orders">
                    <div className="empty-icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    </div>
                    <h3>Aucun service sécurité</h3>
                    <p>Assurez votre sécurité avec nos experts.</p>
                    <button className="shop-button" onClick={() => navigate('/security')}>Services Sécurité</button>
                  </div>
                ) : (
                  <div className="security-list">
                    {securityReservations.map(res => (
                      <div key={res.id} className="security-reservation-card" onClick={() => showSecurityReservationDetails(res)} style={{ cursor: 'pointer' }}>
                        <div className="order-header">
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--dash-text-muted)' }}>#{res.id}</span>
                            <div style={{ fontSize: '1rem', fontWeight: '700' }}>{res.service_name || 'Agent Sécurité'}</div>
                          </div>
                          <span className="status-badge" style={{ backgroundColor: getStatusColor(res.status), color: 'white' }}>
                            {getStatusText(res.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderRadius: '24px', maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Détails de la commande</h3>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dash-text-muted)' }}>ID:</span>
                  <span style={{ fontWeight: '600' }}>#{selectedOrder.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dash-text-muted)' }}>Total:</span>
                  <span style={{ fontWeight: '600' }}>{selectedOrder.total} DH</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dash-text-muted)' }}>Statut:</span>
                  <span style={{ fontWeight: '600' }}>{getStatusText(selectedOrder.status)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReservation && (
        <div className="modal-overlay" onClick={() => setSelectedReservation(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderRadius: '24px', maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Détails de la réservation</h3>
              <button className="modal-close" onClick={() => setSelectedReservation(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dash-text-muted)' }}>ID:</span>
                  <span style={{ fontWeight: '600' }}>#{selectedReservation.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dash-text-muted)' }}>Service:</span>
                  <span style={{ fontWeight: '600' }}>{selectedReservation.service || 'Nettoyage'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dash-text-muted)' }}>Prix:</span>
                  <span style={{ fontWeight: '600' }}>{selectedReservation.total_price} DH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

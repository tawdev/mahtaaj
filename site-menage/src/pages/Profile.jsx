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
    setSelectedOrder(reservation); // Reuse the same modal for reservations
    setShowOrderModal(true);
  };

  // Show security reservation details
  const showSecurityReservationDetails = (securityReservation) => {
    setSelectedOrder(securityReservation); // Reuse the same modal for security reservations
    setShowOrderModal(true);
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
        {/* Sidebar - User Card */}
        <div className="profile-sidebar">
          <div className="user-card">
            <div className="user-avatar">
              {user?.name ? (
                <div className="avatar-placeholder">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="avatar-icon">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              )}
            </div>
            <div className="user-info">
              <h2 className="user-name">{user?.name || t('profile.user.anonymous')}</h2>
              <p className="user-email">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-main">
          {/* Header */}
          <div className="profile-header">
            <h1 className="profile-title">{t('profile.title')}</h1>
          </div>

          {/* Tab Navigation */}
          <div className="profile-tabs">
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            {t('profile.tabs.personal_info')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            {t('profile.tabs.orders')} ({orders.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'reservations' ? 'active' : ''}`}
            onClick={() => setActiveTab('reservations')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
            </svg>
            {t('profile.tabs.reservations')} ({(reservations && Array.isArray(reservations) ? reservations.length : 0)})
          </button>
          <button 
            className={`tab-button ${activeTab === 'security-reservations' ? 'active' : ''}`}
            onClick={() => setActiveTab('security-reservations')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            {t('profile.tabs.security_reservations')} ({(securityReservations && Array.isArray(securityReservations) ? securityReservations.length : 0)})
          </button>
        </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {errorMessage}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content-card">
              <div className="tab-card-header">
                <h2 className="tab-card-title">🧍‍♂️ {t('profile.personal_info.title')}</h2>
                <button 
                  className={`edit-button ${isEditing ? 'cancel' : 'edit'}`}
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setErrorMessage('');
                    setSuccessMessage('');
                    // Reset password fields when canceling
                    if (isEditing) {
                      setFormData(prev => ({
                        ...prev,
                        password: '',
                        password_confirmation: ''
                      }));
                    }
                  }}
                >
                  {isEditing ? t('profile.personal_info.cancel') : t('profile.personal_info.edit')}
                </button>
              </div>

              <div className="profile-info">
                {/* Form Fields */}
                <div className="form-fields">
                  <div className="form-group">
                    <label htmlFor="name">{t('profile.personal_info.fields.full_name')}</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">{t('profile.personal_info.fields.email')}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">{t('profile.personal_info.fields.new_password')}</label>
                    <div className="password-input-container">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="form-input password-input"
                        placeholder={t('profile.personal_info.fields.password_placeholder')}
                      />
                      <button 
                        type="button" 
                        className="password-toggle-btn" 
                        onClick={togglePasswordVisibility} 
                        tabIndex="-1" 
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        disabled={!isEditing}
                      >
                        {showPassword ? (
                          <svg className="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        ) : (
                          <svg className="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.05"/>
                            <path d="M1 1l22 22"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="password_confirmation">{t('profile.personal_info.fields.confirm_password')}</label>
                    <div className="password-input-container">
                      <input
                        type={showPasswordConfirmation ? "text" : "password"}
                        id="password_confirmation"
                        name="password_confirmation"
                        value={formData.password_confirmation || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="form-input password-input"
                        placeholder={t('profile.personal_info.fields.confirm_password_placeholder')}
                      />
                      <button 
                        type="button" 
                        className="password-toggle-btn" 
                        onClick={togglePasswordConfirmationVisibility} 
                        tabIndex="-1" 
                        aria-label={showPasswordConfirmation ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        disabled={!isEditing}
                      >
                        {showPasswordConfirmation ? (
                          <svg className="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        ) : (
                          <svg className="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.05"/>
                            <path d="M1 1l22 22"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                {isEditing && (
                  <div className="save-section">
                    <button 
                      className="save-button"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="loading-spinner-small"></div>
                          {t('profile.personal_info.saving')}
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17,21 17,13 7,13 7,21"/>
                            <polyline points="7,3 7,8 15,8"/>
                          </svg>
                          {t('profile.personal_info.save')}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="tab-content-card">
              <div className="tab-card-header">
                <h2 className="tab-card-title">🧾 {t('profile.orders.title')}</h2>
                <div className="order-filters">
                  <select 
                    value={orderFilter} 
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">{t('profile.orders.filters.all')}</option>
                    <option value="pending">{t('profile.orders.filters.pending')}</option>
                    <option value="processing">{t('profile.orders.filters.processing')}</option>
                    <option value="shipped">{t('profile.orders.filters.shipped')}</option>
                    <option value="delivered">{t('profile.orders.filters.delivered')}</option>
                    <option value="cancelled">{t('profile.orders.filters.cancelled')}</option>
                  </select>
                </div>
              </div>

            {filteredOrders.length === 0 ? (
              <div className="empty-orders">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                <h3>{t('profile.orders.empty.title')}</h3>
                <p>{t('profile.orders.empty.message')}</p>
                <button 
                  className="shop-button"
                  onClick={() => navigate('/shop')}
                >
                  {t('profile.orders.empty.button')}
                </button>
              </div>
            ) : (
              <div className="orders-list">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <h3>{t('profile.orders.details.order_number')}{order.id}</h3>
                        <p className="order-date">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="order-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="order-details">
                      <div className="order-items">
                        <p>{order.items ? order.items.length : 0} produit(s)</p>
                      </div>
                      <div className="order-total">
                        <span className="total-label">{t('profile.orders.details.total')}</span>
                        <span className="total-amount">{order.total} DH</span>
                      </div>
                    </div>
                    
                    <div className="order-actions">
                      <button 
                        className="details-button"
                        onClick={() => showOrderDetails(order)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {t('profile.orders.details.view_details')}
                      </button>
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
                <h2 className="tab-card-title">📅 {t('profile.tabs.reservations')}</h2>
              </div>
              <p className="reservations-subtitle" style={{ marginTop: '-20px', marginBottom: '24px', color: '#64748b' }}>Services que vous avez réservés</p>

            {reservations.length === 0 ? (
              <div className="empty-reservations">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
                </svg>
                <h3>Aucune réservation</h3>
                <p>Vous n'avez pas encore fait de réservation</p>
                <button 
                  className="services-button"
                  onClick={() => navigate('/services')}
                >
                  Découvrir nos services
                </button>
              </div>
            ) : (
              <div className="reservations-list">
                {reservations.map((reservation) => (
                  <div key={reservation.id} className="reservation-card">
                    <div className="reservation-header">
                      <div className="reservation-info">
                        <h3>Réservation #{reservation.id}</h3>
                        <p className="reservation-date">
                          {new Date(reservation.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="reservation-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(reservation.status) }}
                        >
                          {getStatusText(reservation.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="reservation-details">
                      <div className="reservation-service">
                        <p><strong>Service:</strong> {reservation.service || 'Service de nettoyage'}</p>
                        <p><strong>Type:</strong> {reservation.type || 'Standard'}</p>
                        {reservation.size && (
                          <p><strong>Surface:</strong> {reservation.size} m²</p>
                        )}
                        {reservation.location && (
                          <p><strong>Lieu:</strong> {reservation.location}</p>
                        )}
                      </div>
                      <div className="reservation-total">
                        <span className="total-label">Prix estimé:</span>
                        <span className="total-amount">{reservation.total_price || 'À calculer'} DH</span>
                      </div>
                    </div>
                    
                    <div className="reservation-actions">
                      <button 
                        className="details-button"
                        onClick={() => showReservationDetails(reservation)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Voir les détails
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}

          {/* Security Reservations Tab */}
          {activeTab === 'security-reservations' && (
            <div className="tab-content-card">
              <div className="tab-card-header">
                <h2 className="tab-card-title">🛡️ {t('profile.tabs.security_reservations')}</h2>
              </div>
              <p className="security-reservations-subtitle" style={{ marginTop: '-20px', marginBottom: '24px', color: '#64748b' }}>Services de sécurité que vous avez réservés</p>

            {securityReservations.length === 0 ? (
              <div className="empty-security-reservations">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                <h3>Aucune réservation sécurité</h3>
                <p>Vous n'avez pas encore fait de réservation pour les services de sécurité</p>
                <button 
                  className="security-button"
                  onClick={() => navigate('/security')}
                >
                  Découvrir nos services sécurité
                </button>
              </div>
            ) : (
              <div className="security-reservations-list">
                {securityReservations.map((securityReservation) => (
                  <div key={securityReservation.id} className="security-reservation-card">
                    <div className="security-reservation-header">
                      <div className="security-reservation-info">
                        <h3>Réservation sécurité #{securityReservation.id}</h3>
                        <p className="security-reservation-date">
                          {new Date(securityReservation.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="security-reservation-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(securityReservation.status) }}
                        >
                          {getStatusText(securityReservation.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="security-reservation-details">
                      <div className="security-reservation-service">
                        <p><strong>Nom:</strong> {securityReservation.firstname || 'Non spécifié'}</p>
                        <p><strong>Téléphone:</strong> {securityReservation.phone || 'Non spécifié'}</p>
                        <p><strong>Lieu:</strong> {securityReservation.location || 'Non spécifié'}</p>
                        {securityReservation.preferred_date && (
                          <p><strong>Date préférée:</strong> {new Date(securityReservation.preferred_date).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                      <div className="security-reservation-total">
                        <span className="total-label">Prix estimé:</span>
                        <span className="total-amount">{securityReservation.total_price || 'À calculer'} DH</span>
                      </div>
                    </div>
                    
                    <div className="security-reservation-actions">
                      <button 
                        className="details-button"
                        onClick={() => showSecurityReservationDetails(securityReservation)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Voir les détails
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('profile.modal.order_details')}{selectedOrder.id}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowOrderModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="order-info-grid">
                <div className="info-item">
                  <label>{t('profile.orders.details.date')}</label>
                  <span>{new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="info-item">
                  <label>{t('profile.orders.details.status')}</label>
                  <span 
                    className="status-text"
                    style={{ color: getStatusColor(selectedOrder.status) }}
                  >
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
                <div className="info-item">
                  <label>{t('profile.orders.details.total')}</label>
                  <span className="total-text">{selectedOrder.total} DH</span>
                </div>
              </div>
              
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="order-items-section">
                  <h4>{t('profile.orders.details.products')}</h4>
                  <div className="items-list">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="item-row">
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">{t('profile.orders.details.quantity')} {item.quantity}</span>
                        </div>
                        <div className="item-price">{item.price} DH</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast-notification ${toastType}`}>
          <div className="toast-content">
            <div className="toast-icon">
              {toastType === 'success' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
            </div>
            <span className="toast-message">{toastMessage}</span>
            <button 
              className="toast-close"
              onClick={() => setToastMessage('')}
              aria-label={t('profile.toast.close')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

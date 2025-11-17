import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getContacts, adminLogout, adminProfile } from '../../api-supabase';
import AdminLogin from './AdminLogin';
import AdminCrud from './AdminCrud';
import ContactCrud from './ContactCrud';
import AdminServicesCrud from './AdminServicesCrud';
import AdminReservationCrud from './AdminReservationCrud';
import AdminCategoriesCrud from './AdminCategoriesCrud';
import AdminTypesCrud from './AdminTypesCrud';
import AdminCategoryHouseCrud from './AdminCategoryHouseCrud';
import AdminRatingCrud from './AdminRatingCrud';
import AdminProductCrud from './AdminProductCrud';
import AdminProductTypesCrud from './AdminProductTypesCrud';
import AdminOrdersCrud from './AdminOrdersCrud';
import AdminEmployeesCrud from './AdminEmployeesCrud';
import AdminPromotionsCrud from './AdminPromotionsCrud';
import AdminConfirmedEmployeesCrud from './AdminConfirmedEmployeesCrud';
import AdminSecurityCrud from './AdminSecurityCrud';
import AdminSecurityReservationsCrud from './AdminSecurityReservationsCrud';
import AdminBebeCategoriesCrud from './AdminBebeCategoriesCrud';
import AdminBebeServicesCrud from './AdminBebeServicesCrud';
import AdminBebeReservationsCrud from './AdminBebeReservationsCrud';
import AdminBebeRatingsCrud from './AdminBebeRatingsCrud';
import AdminJardinageCategoriesCrud from './AdminJardinageCategoriesCrud';
import AdminJardinageServicesCrud from './AdminJardinageServicesCrud';
import AdminJardinageReservationsCrud from './AdminJardinageReservationsCrud';
import AdminJardinageRatingsCrud from './AdminJardinageRatingsCrud';
import AdminJardinageEmployees from './AdminJardinageEmployees';
import AdminBebeEmployees from './AdminBebeEmployees';
import AdminSecurityEmployees from './AdminSecurityEmployees';
import AdminSecurityEmployeesValid from './AdminSecurityEmployeesValid';
import AdminJardinageEmployeesValid from './AdminJardinageEmployeesValid';
import AdminBebeEmployeesValid from './AdminBebeEmployeesValid';
import AdminHandWorkerEmployees from './AdminHandWorkerEmployees';
import AdminHandWorkerCategoriesCrud from './AdminHandWorkerCategoriesCrud';
import AdminHandWorkersCrud from './AdminHandWorkersCrud';
import AdminHandWorkerReservationsCrud from './AdminHandWorkerReservationsCrud';
import AdminHandWorkerRegistrationsCrud from './AdminHandWorkerRegistrationsCrud';
import AdminValideHandWorkerReservationsCrud from './AdminValideHandWorkerReservationsCrud';
import AdminTypeCategoryGalleryCrud from './AdminTypeCategoryGalleryCrud';
import AdminCategoryGalleryCrud from './AdminCategoryGalleryCrud';
import AdminGalleryCrud from './AdminGalleryCrud';
import DashboardStats from './DashboardStats';
import ProductStats from './ProductStats';
import './Admin.css';
import AdminSecurityRolesCrud from './AdminSecurityRolesCrud';

export default function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contactsView, setContactsView] = useState('list'); // 'list' or 'crud'

  useEffect(() => {
    // Check if admin is already logged in
    const token = localStorage.getItem('adminToken');
    const storedAdminData = localStorage.getItem('adminData');
    
    if (token && storedAdminData) {
      // Validate token by making a test API call
      adminProfile(token).then(() => {
      setIsAuthenticated(true);
      const parsed = JSON.parse(storedAdminData);
      setAdminData(parsed);
      // If adminSecurity, ensure we are on /admin/security
      if (parsed?.role === 'adminSecurity') {
        const path = window.location.pathname;
        const allowed = ['/admin/security', '/admin/security/agents', '/admin/security/reservations', '/admin/security/roles', '/admin/security/employees', '/admin/security/employees-valid', '/admin/adminBebe/employees'];
        if (!allowed.includes(path)) {
          navigate('/admin/security', { replace: true });
        }
      } else if (parsed?.role === 'adminHandWorker') {
        const path = window.location.pathname;
        const allowedHW = ['/admin/handworker', '/admin/handworker/categories', '/admin/handworker/employees', '/admin/handworker/reservations', '/admin/handworker/validated'];
        if (!allowedHW.includes(path)) {
          navigate('/admin/handworker', { replace: true });
        }
      } else if (parsed?.role === 'adminHouseKeeping') {
        const path = window.location.pathname;
        const allowedHK = ['/admin/housekeeping', '/admin/housekeeping/services', '/admin/housekeeping/employees', '/admin/housekeeping/confirmed-employees', '/admin/housekeeping/categories', '/admin/housekeeping/reservations', '/admin/housekeeping/types', '/admin/housekeeping/categories-house'];
        if (!allowedHK.includes(path)) {
          navigate('/admin/housekeeping', { replace: true });
        }
      } else if (parsed?.role === 'adminBebe') {
        const path = window.location.pathname;
        const allowedB = ['/admin/adminBebe', '/admin/adminBebe/categories', '/admin/adminBebe/services', '/admin/adminBebe/reservations', '/admin/adminBebe/ratings', '/admin/adminBebe/employees'];
        if (!allowedB.includes(path)) {
          navigate('/admin/adminBebe', { replace: true });
        }
      } else if (parsed?.role === 'adminJardinaje') {
        const path = window.location.pathname;
        const allowedJ = ['/admin/adminJardinaje', '/admin/adminJardinaje/categories', '/admin/adminJardinaje/services', '/admin/adminJardinaje/reservations', '/admin/adminJardinaje/ratings', '/admin/adminJardinaje/employees-manage', '/admin/adminJardinaje/employees-valid'];
        if (!allowedJ.includes(path)) {
          navigate('/admin/adminJardinaje', { replace: true });
        }
      }
      }).catch(() => {
        // Token is invalid, clear it
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        setIsAuthenticated(false);
        setAdminData(null);
      });
    }

    // Listen for global auth errors
    const handleAuthError = () => {
      handleLogout();
    };

    window.addEventListener('adminAuthError', handleAuthError);
    return () => window.removeEventListener('adminAuthError', handleAuthError);
  }, []);

  // Sync active tab with route path
  useEffect(() => {
    const path = location.pathname;
    if (!path.startsWith('/admin')) return;
    if (path === '/admin/dashboard') setActiveTab('dashboard');
    else if (path === '/admin/accounts') setActiveTab('admins');
    else if (path === '/admin/bebe') setActiveTab('bebe-categories');
    else if (path === '/admin/adminBebe') setActiveTab('bebe-categories');
    else if (path === '/admin/adminBebe/categories') setActiveTab('bebe-categories');
    else if (path === '/admin/adminBebe/services') setActiveTab('bebe-services');
    else if (path === '/admin/adminBebe/reservations') setActiveTab('bebe-reservations');
    else if (path === '/admin/adminBebe/ratings') setActiveTab('bebe-ratings');
    else if (path === '/admin/adminBebe/employees') setActiveTab('bebe-employees');
    else if (path === '/admin/adminBebe/employees-valid') setActiveTab('bebe-employees-valid');
    else if (path === '/admin/jardinaje') setActiveTab('jardinage-categories');
    else if (path === '/admin/adminJardinaje') setActiveTab('jardinage-categories');
    else if (path === '/admin/adminJardinaje/categories') setActiveTab('jardinage-categories');
    else if (path === '/admin/adminJardinaje/services') setActiveTab('jardinage-services');
    else if (path === '/admin/adminJardinaje/reservations') setActiveTab('jardinage-reservations');
    else if (path === '/admin/adminJardinaje/ratings') setActiveTab('jardinage-ratings');
    else if (path === '/admin/adminJardinaje/employees-manage') setActiveTab('jardinage-employees');
    else if (path === '/admin/adminJardinaje/employees-valid') setActiveTab('jardinage-employees-valid');
    else if (path === '/admin/housekeeping') setActiveTab('services');
    else if (path === '/admin/security' || path === '/admin/security/agents' || path === '/admin/security/reservations' || path === '/admin/security/employees' || path === '/admin/security/employees-valid') setActiveTab('security');
    else if (path === '/admin/security/roles') setActiveTab('security-roles');
    else if (path === '/admin/adminBebe/employees') setActiveTab('bebe-employees');
    else if (path === '/admin/handworker') {
      setActiveTab('hand-workers');
    } else if (path === '/admin/handworker/categories') {
      setActiveTab('hand-worker-categories');
    } else if (path === '/admin/handworker/employees') {
      setActiveTab('hand-workers');
    } else if (path === '/admin/handworker/reservations') {
      setActiveTab('hand-worker-reservations');
    } else if (path === '/admin/handworker/validated') {
      setActiveTab('valide-hand-worker-reservations');
    } else if (path === '/admin/product-types') {
      setActiveTab('product-types');
    }
  }, [location.pathname]);

  // For adminSecurity role, restrict to /admin/security only
  useEffect(() => {
    const role = adminData?.role;
    if (!role) return;
    if (role === 'adminSecurity') {
      const path = location.pathname;
      const allowed = ['/admin/security', '/admin/security/agents', '/admin/security/reservations', '/admin/security/roles', '/admin/security/employees', '/admin/security/employees-valid', '/admin/adminBebe/employees'];
      if (path.startsWith('/admin') && !allowed.includes(path)) {
        navigate('/admin/security', { replace: true });
      }
    }
    if (role === 'adminBebe') {
      const path = location.pathname;
      const allowed = ['/admin/adminBebe', '/admin/adminBebe/categories', '/admin/adminBebe/services', '/admin/adminBebe/reservations', '/admin/adminBebe/ratings', '/admin/adminBebe/employees', '/admin/adminBebe/employees-valid'];
      if (path.startsWith('/admin') && !allowed.includes(path)) {
        navigate('/admin/adminBebe', { replace: true });
      }
    }
    if (role === 'adminHandWorker') {
      const path = location.pathname;
      const allowed = ['/admin/handworker', '/admin/handworker/categories', '/admin/handworker/employees', '/admin/handworker/reservations', '/admin/handworker/validated'];
      if (path.startsWith('/admin') && !allowed.includes(path)) {
        navigate('/admin/handworker', { replace: true });
      }
    }
    if (role === 'adminJardinaje') {
      const path = location.pathname;
      const allowed = ['/admin/adminJardinaje', '/admin/adminJardinaje/categories', '/admin/adminJardinaje/services', '/admin/adminJardinaje/reservations', '/admin/adminJardinaje/ratings', '/admin/adminJardinaje/employees-manage', '/admin/adminJardinaje/employees-valid'];
      if (path.startsWith('/admin') && !allowed.includes(path)) {
        navigate('/admin/adminJardinaje', { replace: true });
      }
    }
  }, [adminData?.role, location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    let isMounted = true;
    (async () => {
      try {
        const data = await getContacts();
        if (isMounted) setItems(Array.isArray(data) ? data : data.data || []);
      } catch (e) {
        setError('Impossible de charger les contacts');
      } finally {
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [isAuthenticated]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((c) => (
      (c.firstname || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.location || '').toLowerCase().includes(q) ||
      (c.service || '').toLowerCase().includes(q) ||
      (c.message || '').toLowerCase().includes(q)
    ));
  }, [items, query]);

  const handleLogin = (response) => {
    setIsAuthenticated(true);
    setAdminData(response.admin);
    // Save admin data including role to localStorage
    localStorage.setItem('adminData', JSON.stringify(response.admin));
    // Navigate based on role
    if (response.admin?.role === 'adminSecurity') {
      navigate('/admin/security', { replace: true });
    } else if (response.admin?.role === 'adminHandWorker') {
      navigate('/admin/handworker', { replace: true });
    } else if (response.admin?.role === 'adminHouseKeeping') {
      navigate('/admin/housekeeping', { replace: true });
    } else if (response.admin?.role === 'adminBebe') {
      navigate('/admin/adminBebe', { replace: true });
    } else if (response.admin?.role === 'adminJardinaje') {
      navigate('/admin/adminJardinaje', { replace: true });
    } else {
      navigate('/admin/dashboard', { replace: true });
    }
  };

  const handleLogout = async () => {
    // Optimistic UI: clear session immediately
      const token = localStorage.getItem('adminToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setIsAuthenticated(false);
    setAdminData(null);
    // Attempt server logout in background (non-blocking)
    try {
      if (token) {
        await adminLogout(token);
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // Handle authentication errors globally
  const handleAuthError = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setIsAuthenticated(false);
    setAdminData(null);
  };

  // Helper function to check if admin has required role
  const hasRole = (requiredRole) => {
    if (!adminData) return false;
    // Admin principal has access to everything
    if (adminData.role === 'admin') return true;
    return adminData.role === requiredRole;
  };

  // Helper function to check if admin has any of the required roles
  const hasAnyRole = (...roles) => {
    if (!adminData) return false;
    if (adminData.role === 'admin') return true;
    return roles.includes(adminData.role);
  };

  // Handle card clicks from dashboard stats
  const handleCardClick = (cardType) => {
    switch (cardType) {
      case 'contacts':
        setActiveTab('contacts');
        break;
      case 'services':
        setActiveTab('services');
        navigate('/admin/housekeeping');
        break;
      case 'reservations':
        setActiveTab('reservations');
        break;
      case 'ratings':
        setActiveTab('ratings');
        break;
      case 'products':
        setActiveTab('products');
        break;
      case 'product-types':
        setActiveTab('product-types');
        navigate('/admin/product-types');
        break;
      case 'product_stats':
        setActiveTab('product_stats');
        break;
      case 'employees':
        setActiveTab('employees');
        break;
      case 'confirmed_employees':
        setActiveTab('confirmed_employees');
        break;
      case 'promotions':
        setActiveTab('promotions');
        break;
      case 'security':
        setActiveTab('security');
        navigate('/admin/security');
        break;
      case 'security-reservations':
        setActiveTab('security-reservations');
        navigate('/admin/security');
        break;
      case 'orders':
        setActiveTab('orders');
        break;
      case 'admins':
        setActiveTab('admins');
        navigate('/admin/accounts');
        break;
      case 'bebe-categories':
        setActiveTab('bebe-categories');
        navigate('/admin/adminBebe/categories');
        break;
      case 'bebe-services':
        setActiveTab('bebe-services');
        navigate('/admin/adminBebe/services');
        break;
      case 'bebe-reservations':
        setActiveTab('bebe-reservations');
        navigate('/admin/adminBebe/reservations');
        break;
      case 'bebe-ratings':
        setActiveTab('bebe-ratings');
        navigate('/admin/adminBebe/ratings');
        break;
      case 'jardinage-categories':
        setActiveTab('jardinage-categories');
        navigate('/admin/adminJardinaje/categories');
        break;
      case 'jardinage-services':
        setActiveTab('jardinage-services');
        navigate('/admin/adminJardinaje/services');
        break;
      case 'jardinage-reservations':
        setActiveTab('jardinage-reservations');
        navigate('/admin/adminJardinaje/reservations');
        break;
      case 'jardinage-ratings':
        setActiveTab('jardinage-ratings');
        navigate('/admin/adminJardinaje/ratings');
        break;
      case 'hand-worker-categories':
        setActiveTab('hand-worker-categories');
        navigate('/admin/handworker/categories');
        break;
      case 'hand-workers':
        setActiveTab('hand-workers');
        navigate('/admin/handworker/employees');
        break;
      case 'hand-worker-reservations':
        setActiveTab('hand-worker-reservations');
        navigate('/admin/handworker/reservations');
        break;
      case 'hand-worker-registrations':
        setActiveTab('hand-worker-registrations');
        navigate('/admin/handworker');
        break;
      case 'valide-hand-worker-reservations':
        setActiveTab('valide-hand-worker-reservations');
        navigate('/admin/handworker');
        break;
      case 'gallery-types':
        setActiveTab('gallery-types');
        break;
      case 'gallery-categories':
        setActiveTab('gallery-categories');
        break;
      case 'gallery':
        setActiveTab('gallery');
        break;
      case 'revenue':
        // Revenue doesn't have a specific page, could show a revenue report
        console.log('Revenue card clicked - could show revenue report');
        break;
      default:
        console.log('Unknown card type:', cardType);
    }
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  if (loading) return <main className="admin-page" style={{justifyContent:'center', alignItems:'center'}}><p>Chargement…</p></main>;
  if (error) return <main className="admin-page"><p style={{color:'#b91c1c'}}>{error}</p></main>;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Tableau de bord</h1>
          <p className="admin-subtitle">
            {adminData?.name || 'Admin'} ({adminData?.role || 'admin'}) - {adminData?.email}
          </p>
        </div>
        <div className="admin-kpis">
          <div className="admin-kpi">
            <div className="admin-kpi-label">Total</div>
            <div className="admin-kpi-value">{items.length}</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-label">Filtrés</div>
            <div className="admin-kpi-value">{filtered.length}</div>
          </div>
          <button onClick={handleLogout} className="admin-logout-button">
            Déconnexion
          </button>
        </div>
      </header>

      

      {activeTab === 'dashboard' && (
        <DashboardStats 
          token={localStorage.getItem('adminToken')} 
          onAuthError={handleAuthError}
          onCardClick={handleCardClick}
          role={adminData?.role}
        />
      )}

      {activeTab === 'contacts' && (
        <>
          <div className="admin-contacts-toolbar">
            <div className="admin-contacts-view-toggle">
              <button 
                className={`admin-view-button ${contactsView === 'list' ? 'active' : ''}`}
                onClick={() => setContactsView('list')}
              >
                Liste
              </button>
              <button 
                className={`admin-view-button ${contactsView === 'crud' ? 'active' : ''}`}
                onClick={() => setContactsView('crud')}
              >
                Gestion
              </button>
            </div>
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>

          {contactsView === 'list' && (
            <section className="admin-card">
              <div className="admin-toolbar">
                <input
                  placeholder="Rechercher (nom, tel, lieu, service, message)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="admin-search"
                />
              </div>
              <div style={{overflow:'auto'}}>
                <table className="admin-table">
                  <thead className="admin-thead">
                    <tr>
                      <th className="admin-th">Prénom</th>
                      <th className="admin-th">Téléphone</th>
                      <th className="admin-th">Lieu</th>
                      <th className="admin-th">Service</th>
                      <th className="admin-th">Message</th>
                      <th className="admin-th">Créé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => (
                      <tr key={c.id || i} className={i % 2 ? 'admin-row-alt' : undefined}>
                        <td className="admin-td">{c.firstname}</td>
                        <td className="admin-td">{c.phone}</td>
                        <td className="admin-td">{c.location}</td>
                        <td className="admin-td">
                          <span className="admin-badge">{c.service}</span>
                        </td>
                        <td className="admin-td">
                          <div className="admin-ellipsis" title={c.message}>{c.message}</div>
                        </td>
                        <td className="admin-td">{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {contactsView === 'crud' && (
            <ContactCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
          )}
        </>
      )}

      {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <section className="admin-card">
            <div className="admin-toolbar">
              <h2>HouseKeeping</h2>
            </div>
            <div className="stats-grid">
              <div className="stat-card services-card clickable" onClick={() => navigate('/admin/housekeeping/services')}>
                <div className="stat-icon services-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">Services</h3>
                </div>
              </div>
              <div className="stat-card employees-card clickable" onClick={() => navigate('/admin/housekeeping/employees')}>
                <div className="stat-icon employees-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">Employés</h3>
                </div>
              </div>
              <div className="stat-card confirmed-employees-card clickable" onClick={() => navigate('/admin/housekeeping/confirmed-employees')}>
                <div className="stat-icon confirmed-employees-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">Employés Confirmés</h3>
                </div>
              </div>
              <div className="stat-card categories-card clickable" onClick={() => navigate('/admin/housekeeping/categories')}>
                <div className="stat-icon categories-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">Catégories</h3>
                </div>
              </div>
              <div className="stat-card reservations-card clickable" onClick={() => navigate('/admin/housekeeping/reservations')}>
                <div className="stat-icon reservations-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">Réservations</h3>
                </div>
              </div>
              <div className="stat-card types-card clickable" onClick={() => navigate('/admin/housekeeping/types')}>
                <div className="stat-icon types-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">Types</h3>
                </div>
              </div>
              <div className="stat-card categories-house-card clickable" onClick={() => navigate('/admin/housekeeping/categories-house')}>
                <div className="stat-icon categories-house-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">Catégories House</h3>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === 'services' && hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/services' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminServicesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/employees' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => navigate('/admin/housekeeping')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminEmployeesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/confirmed-employees' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => navigate('/admin/housekeeping')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminConfirmedEmployeesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/categories' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => navigate('/admin/housekeeping')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminCategoriesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/reservations' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => navigate('/admin/housekeeping')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminReservationCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/types' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => navigate('/admin/housekeeping')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminTypesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/categories-house' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => navigate('/admin/housekeeping')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminCategoryHouseCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'reservations' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminReservationCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'ratings' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminRatingCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'products' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminProductCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'product-types' && hasRole('admin') && location.pathname === '/admin/product-types' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => {
                setActiveTab('dashboard');
                navigate('/admin/dashboard');
              }}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminProductTypesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'product_stats' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <ProductStats token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'employees' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminEmployeesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'promotions' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminPromotionsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'confirmed_employees' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminConfirmedEmployeesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {location.pathname === '/admin/security' && hasAnyRole('adminSecurity') && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <section className="admin-card">
            <div className="admin-toolbar">
              <h2>Gestion Sécurité</h2>
            </div>
            <div className="stats-grid">
              <div className="stat-card securities-card clickable" onClick={() => navigate('/admin/security/agents')}>
                <div className="stat-icon securities-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3 className="stat-title">Agents de Sécurité</h3>
                  <div className="stat-main-value">CRUD</div>
                </div>
              </div>
              <div className="stat-card clickable" onClick={() => navigate('/admin/security/employees')}>
                <div className="stat-icon">
                  👮
                </div>
                <div className="stat-content">
                  <h3 className="stat-title">Employés Sécurité</h3>
                  <div className="stat-main-value">CRUD</div>
                </div>
              </div>
              <div className="stat-card security-reservations-card clickable" onClick={() => navigate('/admin/security/reservations')}>
                <div className="stat-icon security-reservations-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3 className="stat-title">Réservations Sécurité</h3>
                  <div className="stat-main-value">Liste</div>
                </div>
              </div>
              <div className="stat-card security-roles-card clickable" onClick={() => navigate('/admin/security/roles')}>
                <div className="stat-icon">
                  🛡️
                </div>
                <div className="stat-content">
                  <h3 className="stat-title">Rôles Sécurité</h3>
                  <div className="stat-main-value">CRUD</div>
                </div>
              </div>
              <div className="stat-card bebe-services-card clickable" onClick={() => navigate('/admin/adminBebe/employees')}>
                <div className="stat-icon bebe-services-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🍼 Employés Bébé</h3>
                </div>
              </div>
              <div className="stat-card clickable" onClick={() => navigate('/admin/security/employees-valid')}>
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3 className="stat-title">Employés Sécurité Validés</h3>
                  <div className="stat-main-value">Liste</div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === 'security' && hasAnyRole('adminSecurity') && location.pathname === '/admin/security/agents' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminSecurityCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'security' && hasAnyRole('adminSecurity') && location.pathname === '/admin/security/employees' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminSecurityEmployees token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'security' && hasAnyRole('adminSecurity') && location.pathname === '/admin/security/employees-valid' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminSecurityEmployeesValid token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'security-roles' && hasAnyRole('adminSecurity') && location.pathname === '/admin/security/roles' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminSecurityRolesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {hasAnyRole('adminSecurity') && location.pathname === '/admin/security/reservations' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminSecurityReservationsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'orders' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminOrdersCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'admins' && hasRole('admin') && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {/* Bébé Setting Sections */}
      {hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <section className="admin-card">
            <div className="admin-toolbar">
              <h2>Bébé Setting</h2>
            </div>
            <div className="stats-grid">
              <div className="stat-card bebe-categories-card clickable" onClick={() => navigate('/admin/adminBebe/categories')}>
                <div className="stat-icon bebe-categories-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🍼 Catégories Bébé</h3>
                </div>
              </div>
              <div className="stat-card bebe-services-card clickable" onClick={() => navigate('/admin/adminBebe/services')}>
                <div className="stat-icon bebe-services-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🍼 Services Bébé</h3>
                </div>
              </div>
              <div className="stat-card bebe-reservations-card clickable" onClick={() => navigate('/admin/adminBebe/reservations')}>
                <div className="stat-icon bebe-reservations-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🍼 Réservations Bébé</h3>
                </div>
              </div>
              <div className="stat-card bebe-ratings-card clickable" onClick={() => navigate('/admin/adminBebe/ratings')}>
                <div className="stat-icon bebe-ratings-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🍼 Avis Bébé</h3>
                </div>
              </div>
              <div className="stat-card bebe-services-card clickable" onClick={() => navigate('/admin/adminBebe/employees')}>
                <div className="stat-icon bebe-services-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🍼 Employés Bébé</h3>
                </div>
              </div>
              <div className="stat-card bebe-services-card clickable" onClick={() => navigate('/admin/adminBebe/employees-valid')}>
                <div className="stat-icon bebe-services-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🍼 Employés Validés</h3>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === 'bebe-categories' && hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe/categories' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminBebeCategoriesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'bebe-services' && hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe/services' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminBebeServicesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'bebe-reservations' && hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe/reservations' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminBebeReservationsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'bebe-ratings' && hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe/ratings' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminBebeRatingsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'bebe-employees' && hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe/employees' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminBebeEmployees token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'bebe-employees-valid' && hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe/employees-valid' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminBebeEmployeesValid token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {/* Jardinage Sections */}
      {hasAnyRole('adminJardinaje') && location.pathname === '/admin/adminJardinaje' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <section className="admin-card">
            <div className="admin-toolbar">
              <h2>Jardinage</h2>
            </div>
            <div className="stats-grid">
              <div className="stat-card jardinage-categories-card clickable" onClick={() => navigate('/admin/adminJardinaje/categories')}>
                <div className="stat-icon jardinage-categories-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🌿 Catégories Jardinage</h3>
                </div>
              </div>
              <div className="stat-card jardinage-services-card clickable" onClick={() => navigate('/admin/adminJardinaje/services')}>
                <div className="stat-icon jardinage-services-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🌿 Services Jardinage</h3>
                </div>
              </div>
              <div className="stat-card jardinage-reservations-card clickable" onClick={() => navigate('/admin/adminJardinaje/reservations')}>
                <div className="stat-icon jardinage-reservations-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🌿 Réservations Jardinage</h3>
                </div>
              </div>
              <div className="stat-card jardinage-ratings-card clickable" onClick={() => navigate('/admin/adminJardinaje/ratings')}>
                <div className="stat-icon jardinage-ratings-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🌿 Avis Jardinage</h3>
                </div>
              </div>
              <div className="stat-card jardinage-services-card clickable" onClick={() => navigate('/admin/adminJardinaje/employees-manage')}>
                <div className="stat-icon jardinage-services-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🌿 Employés Jardinage</h3>
                </div>
              </div>
              <div className="stat-card jardinage-services-card clickable" onClick={() => navigate('/admin/adminJardinaje/employees-valid')}>
                <div className="stat-icon jardinage-services-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🌿 Employés Validés</h3>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === 'jardinage-categories' && hasAnyRole('adminJardinaje') && location.pathname === '/admin/adminJardinaje/categories' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminJardinageCategoriesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'jardinage-services' && hasAnyRole('adminJardinaje') && location.pathname === '/admin/adminJardinaje/services' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminJardinageServicesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'jardinage-reservations' && hasAnyRole('adminJardinaje') && location.pathname === '/admin/adminJardinaje/reservations' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminJardinageReservationsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'jardinage-ratings' && hasAnyRole('adminJardinaje') && location.pathname === '/admin/adminJardinaje/ratings' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminJardinageRatingsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'jardinage-employees' && hasAnyRole('adminJardinaje') && location.pathname === '/admin/adminJardinaje/employees-manage' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminJardinageEmployees token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'jardinage-employees-valid' && hasAnyRole('adminJardinaje') && location.pathname === '/admin/adminJardinaje/employees-valid' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminJardinageEmployeesValid token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {/* Hand Workers Sections */}
      {hasAnyRole('adminHandWorker') && location.pathname === '/admin/handworker' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <section className="admin-card">
            <div className="admin-toolbar">
              <h2>Travaux Manuels</h2>
            </div>
            <div className="stats-grid">
              <div className="stat-card hand-worker-categories-card clickable" onClick={() => navigate('/admin/handworker/categories')}>
                <div className="stat-icon hand-worker-categories-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">🔨 Catégories Travaux Manuels</h3>
                </div>
              </div>
              <div className="stat-card hand-workers-card clickable" onClick={() => navigate('/admin/handworker/employees')}>
                <div className="stat-icon hand-workers-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">👷 Employés Travaux Manuels</h3>
                </div>
              </div>
              <div className="stat-card hand-worker-reservations-card clickable" onClick={() => navigate('/admin/handworker/reservations')}>
                <div className="stat-icon hand-worker-reservations-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">📋 Réservations Travaux Manuels</h3>
                </div>
              </div>
              <div className="stat-card hand-workers-card clickable" onClick={() => navigate('/admin/handworker/validated')}>
                <div className="stat-icon hand-workers-icon"></div>
                <div className="stat-content">
                  <h3 className="stat-title">✅ Employés Validés</h3>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === 'hand-worker-categories' && hasAnyRole('adminHandWorker') && location.pathname === '/admin/handworker/categories' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminHandWorkerCategoriesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'hand-workers' && hasAnyRole('adminHandWorker') && location.pathname === '/admin/handworker/employees' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminHandWorkerEmployees token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'hand-worker-reservations' && hasAnyRole('adminHandWorker') && location.pathname === '/admin/handworker/reservations' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminHandWorkerReservationsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'hand-worker-registrations' && hasAnyRole('adminHandWorker') && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminHandWorkerRegistrationsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'valide-hand-worker-reservations' && hasAnyRole('adminHandWorker') && location.pathname === '/admin/handworker/validated' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminValideHandWorkerReservationsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {/* Gallery Sections */}
      {activeTab === 'gallery-types' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminTypeCategoryGalleryCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'gallery-categories' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminCategoryGalleryCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}

      {activeTab === 'gallery' && (
        <>
          <div className="admin-page-header">
            <button 
              className="admin-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Statistiques du Site
            </button>
          </div>
          <AdminGalleryCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
        </>
      )}
    </main>
  );
}




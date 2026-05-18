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
import AdminMenageCrud from './AdminMenageCrud';
import AdminTypesMenageCrud from './AdminTypesMenageCrud';
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
import AdminDriverEmployees from './AdminDriverEmployees';
import AdminDriverEmployeesValid from './AdminDriverEmployeesValid';
import AdminDriverReservationsCrud from './AdminDriverReservationsCrud';
import AdminDriverCategoriesCrud from './AdminDriverCategoriesCrud';
import AdminTypeCategoryGalleryCrud from './AdminTypeCategoryGalleryCrud';
import AdminCategoryGalleryCrud from './AdminCategoryGalleryCrud';
import AdminGalleryCrud from './AdminGalleryCrud';
import DashboardStats from './DashboardStats';
import ProductStats from './ProductStats';
import './Admin.css';
import './AdminHandWorker.css';
import { LuBaby, LuLayers, LuCalendarRange, LuStar, LuUsers, LuUserCheck } from 'react-icons/lu';
import AdminSecurityRolesCrud from './AdminSecurityRolesCrud';
import AdminHousekeepingReservations from './AdminHousekeepingReservations';

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
        } else if (parsed?.role === 'adminDriver' || parsed?.role === 'driver') {
          const path = window.location.pathname;
          const allowedD = ['/admin/driver', '/admin/driver/employees', '/admin/driver/employees-valid', '/admin/driver/reservations', '/admin/driver/categories'];
          if (!allowedD.includes(path)) {
            navigate('/admin/driver', { replace: true });
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
    } else if (path === '/admin/driver') {
      setActiveTab('driver-employees');
    } else if (path === '/admin/driver/employees') {
      setActiveTab('driver-employees');
    } else if (path === '/admin/driver/employees-valid') {
      setActiveTab('driver-employees-valid');
    } else if (path === '/admin/driver/reservations') {
      setActiveTab('driver-reservations');
    } else if (path === '/admin/driver/categories') {
      setActiveTab('driver-categories');
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
    if (role === 'adminDriver' || role === 'driver') {
      const path = location.pathname;
      const allowed = ['/admin/driver', '/admin/driver/employees', '/admin/driver/employees-valid', '/admin/driver/reservations', '/admin/driver/categories'];
      if (path.startsWith('/admin') && !allowed.includes(path)) {
        navigate('/admin/driver', { replace: true });
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
    } else if (response.admin?.role === 'adminDriver' || response.admin?.role === 'driver') {
      navigate('/admin/driver', { replace: true });
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

  const isAdmin = adminData?.role === 'admin';

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

  // Helper function to navigate to dashboard based on admin role
  const navigateToDashboard = () => {
    setActiveTab('dashboard');
    const role = adminData?.role;

    if (role === 'adminSecurity') {
      navigate('/admin/security');
    } else if (role === 'adminHandWorker') {
      navigate('/admin/handworker');
    } else if (role === 'adminHouseKeeping') {
      navigate('/admin/housekeeping');
    } else if (role === 'adminBebe') {
      navigate('/admin/adminBebe');
    } else if (role === 'adminJardinaje') {
      navigate('/admin/adminJardinaje');
    } else if (role === 'adminDriver' || role === 'driver') {
      navigate('/admin/driver');
    } else {
      // Default to main dashboard for admin and other roles
      navigate('/admin/dashboard');
    }
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
      case 'driver-employees':
        setActiveTab('driver-employees');
        navigate('/admin/driver/employees');
        break;
      case 'driver-employees-valid':
        setActiveTab('driver-employees-valid');
        navigate('/admin/driver/employees-valid');
        break;
      case 'driver-reservations':
        setActiveTab('driver-reservations');
        navigate('/admin/driver/reservations');
        break;
      case 'driver-categories':
        setActiveTab('driver-categories');
        navigate('/admin/driver/categories');
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

  if (loading) return <main className="admin-page" style={{ justifyContent: 'center', alignItems: 'center' }}><p>Chargement…</p></main>;
  if (error) return <main className="admin-page"><p style={{ color: '#b91c1c' }}>{error}</p></main>;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <img src="/galerie/logooomahtaaj.png" alt="Mahtaaj" className="sidebar-logo" />
          <h2 className="sidebar-brand">Mahtaaj Admin</h2>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3 className="nav-section-title">Principal</h3>
            <button
              className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={navigateToDashboard}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Tableau de bord</span>
            </button>

            {isAdmin && (
              <button
                className={`sidebar-nav-item ${activeTab === 'admins' ? 'active' : ''}`}
                onClick={() => { setActiveTab('admins'); navigate('/admin/accounts'); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Administrateurs</span>
              </button>
            )}
          </div>

          <div className="nav-section">
            <h3 className="nav-section-title">Gestion des Services</h3>
            {hasAnyRole('adminHouseKeeping') && (
              <button
                className={`sidebar-nav-item ${location.pathname.startsWith('/admin/housekeeping') ? 'active' : ''}`}
                onClick={() => navigate('/admin/housekeeping')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>Ménage</span>
              </button>
            )}

            {(isAdmin || hasRole('adminHandWorker')) && (
              <button
                className={`sidebar-nav-item ${location.pathname.startsWith('/admin/handworker') ? 'active' : ''}`}
                onClick={() => navigate('/admin/handworker')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Travaux Manuels</span>
              </button>
            )}

            {(isAdmin || hasRole('adminBebe')) && (
              <button
                className={`sidebar-nav-item ${location.pathname.startsWith('/admin/adminBebe') ? 'active' : ''}`}
                onClick={() => navigate('/admin/adminBebe')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Bébé & Enfants</span>
              </button>
            )}

            {(isAdmin || hasRole('adminJardinaje')) && (
              <button
                className={`sidebar-nav-item ${location.pathname.startsWith('/admin/adminJardinaje') ? 'active' : ''}`}
                onClick={() => navigate('/admin/adminJardinaje')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Jardinage</span>
              </button>
            )}
          </div>

          <div className="nav-section">
            <h3 className="nav-section-title">Sécurité & Transport</h3>
            {(isAdmin || hasRole('adminSecurity')) && (
              <button
                className={`sidebar-nav-item ${location.pathname.startsWith('/admin/security') ? 'active' : ''}`}
                onClick={() => navigate('/admin/security')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>Sécurité</span>
              </button>
            )}

            {(isAdmin || hasRole('adminDriver') || hasRole('driver')) && (
              <button
                className={`sidebar-nav-item ${location.pathname.startsWith('/admin/driver') ? 'active' : ''}`}
                onClick={() => navigate('/admin/driver')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="3" width="15" height="13" stroke="currentColor" strokeWidth="2" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke="currentColor" strokeWidth="2" />
                  <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>Chauffeurs</span>
              </button>
            )}
          </div>

          {isAdmin && (
            <div className="nav-section">
              <h3 className="nav-section-title">Commerce & Contenu</h3>
              <button
                className={`sidebar-nav-item ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 6h18M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Produits</span>
              </button>

              <button
                className={`sidebar-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Commandes</span>
              </button>

              <button
                className={`sidebar-nav-item ${activeTab === 'gallery' ? 'active' : ''}`}
                onClick={() => setActiveTab('gallery')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
                  <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Galerie</span>
              </button>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">
              {adminData?.name?.charAt(0) || 'A'}
            </div>
            <div className="admin-details">
              <span className="admin-name">{adminData?.name || 'Admin'}</span>
              <span className="admin-role">{adminData?.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="main-header">
          <h1 className="main-title">
            {activeTab === 'dashboard' ? 'Vue d\'ensemble' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          <div className="header-actions">
            <span className="current-date">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>

        <div className="main-content">



          {activeTab === 'dashboard' && !location.pathname.startsWith('/admin/housekeeping') && (
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
                  onClick={navigateToDashboard}
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
                  <div style={{ overflow: 'auto' }}>
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
                  <div className="stat-card categories-card clickable" onClick={() => navigate('/admin/housekeeping/menage')}>
                    <div className="stat-icon categories-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Ménage</h3>
                    </div>
                  </div>
                  <div className="stat-card types-card clickable" onClick={() => navigate('/admin/housekeeping/types-menage')}>
                    <div className="stat-icon types-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Types Ménage</h3>
                    </div>
                  </div>
                  <div className="stat-card reservations-card clickable" onClick={() => navigate('/admin/housekeeping/reservations/tapis-canapes')}>
                    <div className="stat-icon reservations-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Tapis & Canapés</h3>
                    </div>
                  </div>
                  <div className="stat-card reservations-card clickable" onClick={() => navigate('/admin/housekeeping/reservations/piscine')}>
                    <div className="stat-icon reservations-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Piscine</h3>
                    </div>
                  </div>
                  <div className="stat-card reservations-card clickable" onClick={() => navigate('/admin/housekeeping/reservations/menage-cuisine')}>
                    <div className="stat-icon reservations-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Ménage & Cuisine</h3>
                    </div>
                  </div>
                  <div className="stat-card reservations-card clickable" onClick={() => navigate('/admin/housekeeping/reservations/menage-complet')}>
                    <div className="stat-icon reservations-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Ménage Complet</h3>
                    </div>
                  </div>
                  <div className="stat-card reservations-card clickable" onClick={() => navigate('/admin/housekeeping/reservations/lavage-repassage')}>
                    <div className="stat-icon reservations-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Lavage & Repassage</h3>
                    </div>
                  </div>
                  <div className="stat-card reservations-card clickable" onClick={() => navigate('/admin/housekeeping/reservations/cuisine')}>
                    <div className="stat-icon reservations-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Cuisine</h3>
                    </div>
                  </div>
                  <div className="stat-card reservations-card clickable" onClick={() => navigate('/admin/housekeeping/reservations/chaussures')}>
                    <div className="stat-icon reservations-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Chaussures</h3>
                    </div>
                  </div>
                  <div className="stat-card reservations-card clickable" onClick={() => navigate('/admin/housekeeping/reservations/bureaux-usine')}>
                    <div className="stat-icon reservations-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Bureaux & Usine</h3>
                    </div>
                  </div>
                  <div className="stat-card reservations-card clickable" onClick={() => navigate('/admin/housekeeping/reservations/airbnb')}>
                    <div className="stat-icon reservations-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Airbnb</h3>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'services' && hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/services' && (
            <>
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

          {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/menage' && (
            <>
              <div className="admin-page-header">
                <button
                  className="admin-back-to-dashboard"
                  onClick={() => navigate('/admin/housekeeping')}
                >
                  📊 Statistiques du Site
                </button>
              </div>
              <AdminMenageCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/types-menage' && (
            <>
              <div className="admin-page-header">
                <button
                  className="admin-back-to-dashboard"
                  onClick={() => navigate('/admin/housekeeping')}
                >
                  📊 Statistiques du Site
                </button>
              </div>
              <AdminTypesMenageCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {/* Housekeeping Reservations Sections */}
          {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/reservations/tapis-canapes' && (
            <>
              <div className="admin-page-header">
                <button
                  className="admin-back-to-dashboard"
                  onClick={() => navigate('/admin/housekeeping')}
                >
                  📊 Statistiques du Site
                </button>
              </div>
              <AdminHousekeepingReservations
                tableName="tapis_canapes_reservations"
                title="Réservations Tapis & Canapés"
                token={localStorage.getItem('adminToken')}
                onAuthError={handleAuthError}
              />
            </>
          )}

          {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/reservations/piscine' && (
            <>
              <div className="admin-page-header">
                <button
                  className="admin-back-to-dashboard"
                  onClick={() => navigate('/admin/housekeeping')}
                >
                  📊 Statistiques du Site
                </button>
              </div>
              <AdminHousekeepingReservations
                tableName="piscine_reservations"
                title="Réservations Piscine"
                token={localStorage.getItem('adminToken')}
                onAuthError={handleAuthError}
              />
            </>
          )}

          {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/reservations/menage-cuisine' && (
            <>
              <div className="admin-page-header">
                <button
                  className="admin-back-to-dashboard"
                  onClick={() => navigate('/admin/housekeeping')}
                >
                  📊 Statistiques du Site
                </button>
              </div>
              <AdminHousekeepingReservations
                tableName="menage_cuisine_reservations"
                title="Réservations Ménage & Cuisine"
                token={localStorage.getItem('adminToken')}
                onAuthError={handleAuthError}
              />
            </>
          )}

          {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/reservations/menage-complet' && (
            <>
              <div className="admin-page-header">
                <button
                  className="admin-back-to-dashboard"
                  onClick={() => navigate('/admin/housekeeping')}
                >
                  📊 Statistiques du Site
                </button>
              </div>
              <AdminHousekeepingReservations
                tableName="menage_complet_reservations"
                title="Réservations Ménage Complet"
                token={localStorage.getItem('adminToken')}
                onAuthError={handleAuthError}
              />
            </>
          )}

          {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/reservations/lavage-repassage' && (
            <>
              <div className="admin-page-header">
                <button
                  className="admin-back-to-dashboard"
                  onClick={() => navigate('/admin/housekeeping')}
                >
                  📊 Statistiques du Site
                </button>
              </div>
              <AdminHousekeepingReservations
                tableName="lavage_ropassage_reservations"
                title="Réservations Lavage & Repassage"
                token={localStorage.getItem('adminToken')}
                onAuthError={handleAuthError}
              />
            </>
          )}

          {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/reservations/cuisine' && (
            <>
              <div className="admin-page-header">
                <button
                  className="admin-back-to-dashboard"
                  onClick={() => navigate('/admin/housekeeping')}
                >
                  📊 Statistiques du Site
                </button>
              </div>
              <AdminHousekeepingReservations
                tableName="cuisine_reservations"
                title="Réservations Cuisine"
                token={localStorage.getItem('adminToken')}
                onAuthError={handleAuthError}
              />
            </>
          )}

          {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/reservations/chaussures' && (
            <>
              <div className="admin-page-header">
                <button
                  className="admin-back-to-dashboard"
                  onClick={() => navigate('/admin/housekeeping')}
                >
                  📊 Statistiques du Site
                </button>
              </div>
              <AdminHousekeepingReservations
                tableName="chaussures_reservations"
                title="Réservations Chaussures"
                token={localStorage.getItem('adminToken')}
                onAuthError={handleAuthError}
              />
            </>
          )}

          {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/reservations/bureaux-usine' && (
            <>
              <div className="admin-page-header">
                <button
                  className="admin-back-to-dashboard"
                  onClick={() => navigate('/admin/housekeeping')}
                >
                  📊 Statistiques du Site
                </button>
              </div>
              <AdminHousekeepingReservations
                tableName="bureaux_usin_reservations"
                title="Réservations Bureaux & Usine"
                token={localStorage.getItem('adminToken')}
                onAuthError={handleAuthError}
              />
            </>
          )}

          {hasAnyRole('adminHouseKeeping') && location.pathname === '/admin/housekeeping/reservations/airbnb' && (
            <>
              <div className="admin-page-header">
                <button
                  className="admin-back-to-dashboard"
                  onClick={() => navigate('/admin/housekeeping')}
                >
                  📊 Statistiques du Site
                </button>
              </div>
              <AdminHousekeepingReservations
                tableName="airbnb_reservations"
                title="Réservations Airbnb"
                token={localStorage.getItem('adminToken')}
                onAuthError={handleAuthError}
              />
            </>
          )}

          {activeTab === 'reservations' && (
            <>
              <AdminReservationCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'ratings' && (
            <>
              <AdminRatingCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'products' && (
            <>
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
              <ProductStats token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'employees' && (
            <>
              <AdminEmployeesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'promotions' && (
            <>
              <AdminPromotionsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'confirmed_employees' && (
            <>
              <AdminConfirmedEmployeesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {location.pathname === '/admin/security' && hasAnyRole('adminSecurity') && (
            <>
              <section className="admin-card">
                <div className="admin-toolbar">
                  <h2>Gestion Sécurité</h2>
                </div>
                <div className="stats-grid">
                  <div className="stat-card securities-card clickable" onClick={() => navigate('/admin/security/agents')}>
                    <div className="stat-icon securities-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
                        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
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
              <AdminSecurityCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'security' && hasAnyRole('adminSecurity') && location.pathname === '/admin/security/employees' && (
            <>
              <AdminSecurityEmployees token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'security' && hasAnyRole('adminSecurity') && location.pathname === '/admin/security/employees-valid' && (
            <>
              <AdminSecurityEmployeesValid token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'security-roles' && hasAnyRole('adminSecurity') && location.pathname === '/admin/security/roles' && (
            <>
              <AdminSecurityRolesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {hasAnyRole('adminSecurity') && location.pathname === '/admin/security/reservations' && (
            <>
              <AdminSecurityReservationsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <AdminOrdersCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'admins' && hasRole('admin') && (
            <>
              <AdminCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {/* Bébé Setting Sections */}
          {hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe' && (
            <>
              <section className="admin-card">
                <div className="admin-toolbar">
                  <h2>Bébé Setting</h2>
                </div>
                <div className="stats-grid">
                  <div className="stat-card bebe-categories-card clickable" onClick={() => navigate('/admin/adminBebe/categories')}>
                    <div className="stat-icon bebe-categories-icon">
                      <LuBaby />
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-title">Catégories Bébé</h3>
                    </div>
                  </div>
                  <div className="stat-card bebe-services-card clickable" onClick={() => navigate('/admin/adminBebe/services')}>
                    <div className="stat-icon bebe-services-icon">
                      <LuLayers />
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-title">Services Bébé</h3>
                    </div>
                  </div>
                  <div className="stat-card bebe-reservations-card clickable" onClick={() => navigate('/admin/adminBebe/reservations')}>
                    <div className="stat-icon bebe-reservations-icon">
                      <LuCalendarRange />
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-title">Réservations Bébé</h3>
                    </div>
                  </div>
                  <div className="stat-card bebe-ratings-card clickable" onClick={() => navigate('/admin/adminBebe/ratings')}>
                    <div className="stat-icon bebe-ratings-icon">
                      <LuStar />
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-title">Avis Bébé</h3>
                    </div>
                  </div>
                  <div className="stat-card bebe-employees-card clickable" onClick={() => navigate('/admin/adminBebe/employees')}>
                    <div className="stat-icon bebe-employees-icon">
                      <LuUsers />
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-title">Employés Bébé</h3>
                    </div>
                  </div>
                  <div className="stat-card bebe-employees-valid-card clickable" onClick={() => navigate('/admin/adminBebe/employees-valid')}>
                    <div className="stat-icon bebe-employees-valid-icon">
                      <LuUserCheck />
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-title">Employés Validés</h3>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'bebe-categories' && hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe/categories' && (
            <>
              <AdminBebeCategoriesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'bebe-services' && hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe/services' && (
            <>
              <AdminBebeServicesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'bebe-reservations' && hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe/reservations' && (
            <>
              <AdminBebeReservationsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'bebe-ratings' && hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe/ratings' && (
            <>
              <AdminBebeRatingsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'bebe-employees' && hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe/employees' && (
            <>
              <AdminBebeEmployees token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'bebe-employees-valid' && hasAnyRole('adminBebe') && location.pathname === '/admin/adminBebe/employees-valid' && (
            <>
              <AdminBebeEmployeesValid token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {/* Jardinage Sections */}
          {hasAnyRole('adminJardinaje') && location.pathname === '/admin/adminJardinaje' && (
            <>
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
              <AdminJardinageCategoriesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'jardinage-services' && hasAnyRole('adminJardinaje') && location.pathname === '/admin/adminJardinaje/services' && (
            <>
              <AdminJardinageServicesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'jardinage-reservations' && hasAnyRole('adminJardinaje') && location.pathname === '/admin/adminJardinaje/reservations' && (
            <>
              <AdminJardinageReservationsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'jardinage-ratings' && hasAnyRole('adminJardinaje') && location.pathname === '/admin/adminJardinaje/ratings' && (
            <>
              <AdminJardinageRatingsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'jardinage-employees' && hasAnyRole('adminJardinaje') && location.pathname === '/admin/adminJardinaje/employees-manage' && (
            <>
              <AdminJardinageEmployees token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'jardinage-employees-valid' && hasAnyRole('adminJardinaje') && location.pathname === '/admin/adminJardinaje/employees-valid' && (
            <>
              <AdminJardinageEmployeesValid token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {/* Hand Workers Sections */}
          {hasAnyRole('adminHandWorker') && location.pathname === '/admin/handworker' && (
            <>
              <section className="admin-card">
                <div className="handworker-dashboard-container">
                  <div className="handworker-dashboard-header">
                    <h2>Travaux Manuels</h2>
                    <p className="admin-subtitle">Gérez vos catégories, employés et réservations</p>
                  </div>

                  <div className="handworker-grid">
                    {/* Categories Card */}
                    <div className="handworker-card card-categories" onClick={() => navigate('/admin/handworker/categories')}>
                      <div className="handworker-card-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3h7v7H3z" />
                          <path d="M14 3h7v7h-7z" />
                          <path d="M14 14h7v7h-7z" />
                          <path d="M3 14h7v7H3z" />
                        </svg>
                      </div>
                      <div className="handworker-card-content">
                        <h3>Catégories</h3>
                        <p>Gérer les types de travaux</p>
                      </div>
                    </div>

                    {/* Employees Card */}
                    <div className="handworker-card card-employees" onClick={() => navigate('/admin/handworker/employees')}>
                      <div className="handworker-card-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <div className="handworker-card-content">
                        <h3>Employés</h3>
                        <p>Gérer les profils et disponibilités</p>
                      </div>
                    </div>

                    {/* Reservations Card */}
                    <div className="handworker-card card-reservations" onClick={() => navigate('/admin/handworker/reservations')}>
                      <div className="handworker-card-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div className="handworker-card-content">
                        <h3>Réservations</h3>
                        <p>Suivi des commandes et plannings</p>
                      </div>
                    </div>

                    {/* Validated Employees Card */}
                    <div className="handworker-card card-validated" onClick={() => navigate('/admin/handworker/validated')}>
                      <div className="handworker-card-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </div>
                      <div className="handworker-card-content">
                        <h3>Employés Validés</h3>
                        <p>Liste des professionnels vérifiés</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'hand-worker-categories' && hasAnyRole('adminHandWorker') && location.pathname === '/admin/handworker/categories' && (
            <>
              <AdminHandWorkerCategoriesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'hand-workers' && hasAnyRole('adminHandWorker') && location.pathname === '/admin/handworker/employees' && (
            <>
              <AdminHandWorkerEmployees token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'hand-worker-reservations' && hasAnyRole('adminHandWorker') && location.pathname === '/admin/handworker/reservations' && (
            <>
              <AdminHandWorkerReservationsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'hand-worker-registrations' && hasAnyRole('adminHandWorker') && (
            <>
              <AdminHandWorkerRegistrationsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'valide-hand-worker-reservations' && hasAnyRole('adminHandWorker') && location.pathname === '/admin/handworker/validated' && (
            <>
              <AdminValideHandWorkerReservationsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {/* Driver Sections */}
          {hasAnyRole('adminDriver', 'driver') && location.pathname === '/admin/driver' && (
            <>
              <section className="admin-card">
                <div className="admin-toolbar">
                  <h2>Chauffeurs</h2>
                </div>
                <div className="stats-grid">
                  <div className="stat-card employees-card clickable" onClick={() => navigate('/admin/driver/employees')}>
                    <div className="stat-icon employees-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Employés</h3>
                    </div>
                  </div>
                  <div className="stat-card confirmed-employees-card clickable" onClick={() => navigate('/admin/driver/employees-valid')}>
                    <div className="stat-icon confirmed-employees-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Employés Validés</h3>
                    </div>
                  </div>
                  <div className="stat-card reservations-card clickable" onClick={() => navigate('/admin/driver/reservations')}>
                    <div className="stat-icon reservations-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Réservations</h3>
                    </div>
                  </div>
                  <div className="stat-card categories-card clickable" onClick={() => navigate('/admin/driver/categories')}>
                    <div className="stat-icon categories-icon"></div>
                    <div className="stat-content">
                      <h3 className="stat-title">Catégories</h3>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'driver-employees' && hasAnyRole('adminDriver', 'driver') && location.pathname === '/admin/driver/employees' && (
            <>
              <AdminDriverEmployees token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'driver-employees-valid' && hasAnyRole('adminDriver', 'driver') && location.pathname === '/admin/driver/employees-valid' && (
            <>
              <AdminDriverEmployeesValid token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'driver-reservations' && hasAnyRole('adminDriver', 'driver') && location.pathname === '/admin/driver/reservations' && (
            <>
              <AdminDriverReservationsCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'driver-categories' && hasAnyRole('adminDriver', 'driver') && location.pathname === '/admin/driver/categories' && (
            <>
              <AdminDriverCategoriesCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {/* Gallery Sections */}
          {activeTab === 'gallery-types' && (
            <>
              <AdminTypeCategoryGalleryCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'gallery-categories' && (
            <>
              <AdminCategoryGalleryCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}

          {activeTab === 'gallery' && (
            <>
              <AdminGalleryCrud token={localStorage.getItem('adminToken')} onAuthError={handleAuthError} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}




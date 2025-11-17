import React, { useEffect } from 'react';
import './App.css';
import './i18n'; // Initialize i18n
import './styles/rtl.css'; // RTL Support
import Navbar1 from './components/Navbar1';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceCategories from './pages/ServiceCategories';
import CategoryHouseDetails from './pages/CategoryHouseDetails';
import TypeDetails from './pages/TypeDetails';
import ServiceDetails from './pages/ServiceDetails';
import Booking from './pages/Booking';
import Contact from './pages/Contact';
import Support from './pages/Support';
import Gallery from './pages/Gallery';
import Info from './pages/Info';
import Shop from './pages/Shop';
import CartPage from './pages/CartPage';
import OrderSummary from './pages/OrderSummary';
import Checkout from './pages/Checkout';
import LoginRegister from './pages/LoginRegister';
import Profile from './pages/Profile';
import Security from './pages/Security';
import Admin from './pages/dashbordAdmin/Admin';
import AdminForbidden from './pages/dashbordAdmin/AdminForbidden';
import PrivateRoute from './routes/PrivateRoute';
import EmployeePrivateRoute from './routes/EmployeePrivateRoute';
import EmployeeAdminRoute from './routes/EmployeeAdminRoute';
import { EmployeeAuthProvider } from './contexts/EmployeeAuthContext';
import EmployeeLogin from './pages/employee/Login';
import DashboardLayout from './pages/employee/DashboardLayout';
import Overview from './pages/employee/Overview';
import Employees from './pages/employee/Employees';
import EmployeeDetails from './pages/employee/EmployeeDetails';
import EmployeeForm from './pages/employee/EmployeeForm';
import EmployeeProfile from './pages/employee/Profile';
import Offres from './pages/employee/Offres';
import { Navigate } from 'react-router-dom';
import ServiceTypeDetails from './pages/ServiceTypeDetails';
import EmployeeRegister from './pages/EmployeeRegister';
import BebeSetting from './pages/BebeSetting';
import Jardinage from './pages/Jardinage';
import HandWorkers from './pages/HandWorkers';
import HandWorkerBooking from './pages/HandWorkerBooking';
import HandWorkerRegistration from './pages/HandWorkerRegistration';
import TousLesServices from './pages/TousLesServices';
import RegisterEmployee1 from './pages/employees/RegisterEmployee1';
import SecurityRegister from './pages/employees/SecurityRegister';
import BebeSettingRegister from './pages/employees/BebeSettingRegister';
import JardinageRegister from './pages/employees/JardinageRegister';
import { Routes, Route, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function App() {
  const location = useLocation();
  
  useEffect(() => {
    // Initialize AOS animations - enabled on all devices including mobile
    AOS.init({
      duration: 800,
      easing: 'ease-in-out-cubic',
      once: true,
      offset: 50, // Reduced offset for mobile to trigger animations earlier
      delay: 50, // Reduced delay for mobile performance
      disable: false, // Enable animations on all devices
      mobile: true, // Explicitly enable on mobile
      tablet: true // Enable on tablets too
    });

    // Scroll to element if hash present on route changes
    const handleHash = () => {
      if (window.location.hash) {
        const id = window.location.hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    
    return () => {
      window.removeEventListener('hashchange', handleHash);
      AOS.refresh();
    };
  }, []);

  // Refresh AOS on route change
  useEffect(() => {
    AOS.refresh();
  }, [location]);

  // Check if current route is a dashboard route (admin or employee dashboard)
  // Note: /employees routes should show navbar, only /employee/dashboard routes should hide it
  const isDashboard = location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/employee/');

  return (
    <div className="App">
      <ToastContainer />
      {!isDashboard && <Navbar1 />}
      <div className="page-transition">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:serviceSlug" element={<ServiceCategories />} />
          <Route path="/services/:serviceSlug/:categorySlug/:typeSlug" element={<TypeDetails />} />
          <Route path="/services/:serviceSlug/:categorySlug" element={<CategoryHouseDetails />} />
          <Route path="/tous-les-services" element={<TousLesServices />} />
          <Route path="/service/:id" element={<ServiceDetails />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/info" element={<Info />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/order-summary" element={<OrderSummary />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login-register" element={<LoginRegister />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/reservation/:id" element={<Booking />} />
          <Route path="/services/details/:main/:sub" element={<ServiceTypeDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/support" element={<Support />} />
          <Route path="/security" element={<Security />} />
          <Route path="/employees/register" element={<RegisterEmployee1 />} />
          {/* Section-specific pages */}
          <Route path="/employees/register/security" element={<SecurityRegister />} />
          <Route path="/employees/register/bebe-setting" element={<BebeSettingRegister />} />
          <Route path="/employees/register/jardinage" element={<JardinageRegister />} />
          <Route path="/employees/register/handworker" element={<HandWorkerRegistration />} />
          {/* Clean register page uses EmployeeRegister */}
          <Route path="/employees/register/clean" element={<EmployeeRegister />} />
          <Route path="/bebe-setting" element={<BebeSetting />} />
          <Route path="/jardinage" element={<Jardinage />} />
          <Route path="/hand-workers" element={<HandWorkers />} />
          <Route path="/hand-workers/booking" element={<HandWorkerBooking />} />
          <Route path="/hand-workers/register" element={<HandWorkerRegistration />} />
          {/* Admin Panel Routes */}
          <Route path="/admin/login" element={<Admin />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute
                allowedRoles={['admin','adminBebe','adminJardinaje','adminHouseKeeping','adminSecurity','adminHandWorker']}
                element={<Admin />}
              />
            }
          />
          <Route
            path="/admin/accounts"
            element={<PrivateRoute allowedRoles={['admin']} element={<Admin />} />}
          />
          <Route
            path="/admin/bebe"
            element={<PrivateRoute allowedRoles={['admin','adminBebe']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminBebe"
            element={<PrivateRoute allowedRoles={['admin','adminBebe']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminBebe/categories"
            element={<PrivateRoute allowedRoles={['admin','adminBebe']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminBebe/services"
            element={<PrivateRoute allowedRoles={['admin','adminBebe']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminBebe/reservations"
            element={<PrivateRoute allowedRoles={['admin','adminBebe']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminBebe/ratings"
            element={<PrivateRoute allowedRoles={['admin','adminBebe']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminBebe/employees"
            element={<PrivateRoute allowedRoles={['admin','adminBebe','adminSecurity']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminBebe/employees-valid"
            element={<PrivateRoute allowedRoles={['admin','adminBebe']} element={<Admin />} />}
          />
          <Route
            path="/admin/jardinaje"
            element={<PrivateRoute allowedRoles={['admin','adminJardinaje']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminJardinaje"
            element={<PrivateRoute allowedRoles={['admin','adminJardinaje']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminJardinaje/categories"
            element={<PrivateRoute allowedRoles={['admin','adminJardinaje']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminJardinaje/services"
            element={<PrivateRoute allowedRoles={['admin','adminJardinaje']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminJardinaje/employees-manage"
            element={<PrivateRoute allowedRoles={['admin','adminJardinaje']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminJardinaje/employees-valid"
            element={<PrivateRoute allowedRoles={['admin','adminJardinaje']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminJardinaje/reservations"
            element={<PrivateRoute allowedRoles={['admin','adminJardinaje']} element={<Admin />} />}
          />
          <Route
            path="/admin/adminJardinaje/ratings"
            element={<PrivateRoute allowedRoles={['admin','adminJardinaje']} element={<Admin />} />}
          />
          <Route
            path="/admin/housekeeping"
            element={<PrivateRoute allowedRoles={['admin','adminHouseKeeping']} element={<Admin />} />}
          />
          <Route
            path="/admin/housekeeping/services"
            element={<PrivateRoute allowedRoles={['admin','adminHouseKeeping']} element={<Admin />} />}
          />
          <Route
            path="/admin/housekeeping/employees"
            element={<PrivateRoute allowedRoles={['admin','adminHouseKeeping']} element={<Admin />} />}
          />
          <Route
            path="/admin/housekeeping/confirmed-employees"
            element={<PrivateRoute allowedRoles={['admin','adminHouseKeeping']} element={<Admin />} />}
          />
          <Route
            path="/admin/housekeeping/categories"
            element={<PrivateRoute allowedRoles={['admin','adminHouseKeeping']} element={<Admin />} />}
          />
          <Route
            path="/admin/housekeeping/reservations"
            element={<PrivateRoute allowedRoles={['admin','adminHouseKeeping']} element={<Admin />} />}
          />
          <Route
            path="/admin/housekeeping/types"
            element={<PrivateRoute allowedRoles={['admin','adminHouseKeeping']} element={<Admin />} />}
          />
          <Route
            path="/admin/housekeeping/categories-house"
            element={<PrivateRoute allowedRoles={['admin','adminHouseKeeping']} element={<Admin />} />}
          />
          <Route
            path="/admin/product-types"
            element={<PrivateRoute allowedRoles={['admin']} element={<Admin />} />}
          />
          <Route
            path="/admin/security"
            element={<PrivateRoute allowedRoles={['admin','adminSecurity']} element={<Admin />} />}
          />
          <Route
            path="/admin/security/agents"
            element={<PrivateRoute allowedRoles={['admin','adminSecurity']} element={<Admin />} />}
          />
          <Route
            path="/admin/security/reservations"
            element={<PrivateRoute allowedRoles={['admin','adminSecurity']} element={<Admin />} />}
          />
          <Route
            path="/admin/security/roles"
            element={<PrivateRoute allowedRoles={['admin','adminSecurity']} element={<Admin />} />}
          />
          <Route
            path="/admin/security/employees-valid"
            element={<PrivateRoute allowedRoles={['admin','adminSecurity']} element={<Admin />} />}
          />
          <Route
            path="/admin/security/employees"
            element={<PrivateRoute allowedRoles={['admin','adminSecurity']} element={<Admin />} />}
          />
          <Route
            path="/admin/handworker"
            element={<PrivateRoute allowedRoles={['admin','adminHandWorker']} element={<Admin />} />}
          />
          <Route
            path="/admin/handworker/categories"
            element={<PrivateRoute allowedRoles={['admin','adminHandWorker']} element={<Admin />} />}
          />
          <Route
            path="/admin/handworker/employees"
            element={<PrivateRoute allowedRoles={['admin','adminHandWorker']} element={<Admin />} />}
          />
          <Route
            path="/admin/handworker/reservations"
            element={<PrivateRoute allowedRoles={['admin','adminHandWorker']} element={<Admin />} />}
          />
          <Route
            path="/admin/handworker/validated"
            element={<PrivateRoute allowedRoles={['admin','adminHandWorker']} element={<Admin />} />}
          />
          <Route path="/admin/403" element={<AdminForbidden />} />

          {/* Employee Dashboard Routes */}
          <Route
            path="/employee/login"
            element={
              <EmployeeAuthProvider>
                <EmployeeLogin />
              </EmployeeAuthProvider>
            }
          />
          <Route
            path="/employee/dashboard"
            element={
              <EmployeeAuthProvider>
                <EmployeePrivateRoute element={<DashboardLayout />} />
              </EmployeeAuthProvider>
            }
          >
            <Route index element={<EmployeeAdminRoute element={<Overview />} />} />
            <Route path="employees" element={<EmployeeAdminRoute element={<Employees />} />} />
            <Route path="employees/new" element={<EmployeeAdminRoute element={<EmployeeForm />} />} />
            <Route path="employees/:id" element={<EmployeeAdminRoute element={<EmployeeDetails />} />} />
            <Route path="employees/:id/edit" element={<EmployeeAdminRoute element={<EmployeeForm />} />} />
            <Route path="offres" element={<Offres />} />
            <Route path="profile" element={<EmployeeProfile />} />
          </Route>
        </Routes>
      </div>
      {!isDashboard && <Footer />}
    </div>
  );
}

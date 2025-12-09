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
import JardinageDetail from './pages/JardinageDetail';
import HandWorkers from './pages/HandWorkers';
import HandWorkerCategoryDetails from './pages/HandWorkerCategoryDetails';
import HandWorkerBooking from './pages/HandWorkerBooking';
import HandWorkerAppointment from './pages/HandWorkerAppointment';
import HandWorkerRegistration from './pages/HandWorkerRegistration';
import Driver from './pages/Driver';
import DriverCategoryDetails from './pages/DriverCategoryDetails';
import TousLesServices from './pages/TousLesServices';
import Menage from './pages/Menage';
import TapisCanapes from './pages/TapisCanapes/TapisCanapes';
import TapisEtCanapes from './pages/TapisCanapes/TapisEtCanapes';
import Tapis from './pages/TapisCanapes/Tapis';
import Canapes from './pages/TapisCanapes/Canapes';
import ReservationTapisCanapes from './pages/TapisCanapes/reservationTapisCanapes';
import ReservationVoiture from './pages/Voiture/reservationVoiture';
import LavageEtRopassage from './pages/lavageEtRopassage/lavageEtRopassage';
import Lavage from './pages/lavageEtRopassage/Lavage';
import Ropassage from './pages/lavageEtRopassage/Ropassage';
import ReservationLavageRopassage from './pages/lavageEtRopassage/reservationLavageRopassage';
import BureuxEtUsin from './pages/bureuxEtUsin/bureuxEtUsin';
import Usin from './pages/bureuxEtUsin/Usin';
import Bureaux from './pages/bureuxEtUsin/Bureaux';
import ReservationBureuxUsin from './pages/bureuxEtUsin/ReservationBureuxUsin';
import Voiture from './pages/Voiture/voiture';
import Centre from './pages/Voiture/Centre';
import Adomicile from './pages/Voiture/Adomicile';
import Airbnb from './pages/Airbnb/Airbnb';
import NettoyageRapide from './pages/Airbnb/NettoyageRapide';
import NettoyageComplet from './pages/Airbnb/NettoyageComplet';
import ReservationAirbnb from './pages/Airbnb/ReservationAirbnb';
import Pisin from './pages/Pisin/Pisin';
import Profond from './pages/Pisin/Profond';
import Standard from './pages/Pisin/Standard';
import Chassoures from './pages/Chassures/Chassoures';
import LastrageChassures from './pages/Chassures/LastrageChassures';
import NettoyageChassures from './pages/Chassures/NettoyageChassures';
import ReservationChassoures from './pages/Chassures/reservationChassoures';
import ReservationPisin from './pages/Pisin/ReservationPisin';
import MenageComplite from './pages/menage complite/menageComplite';
import ResortHotel from './pages/menage complite/ResortHotel';
import Maison from './pages/menage complite/Maison';
import Appartement from './pages/menage complite/Appartement';
import Hotel from './pages/menage complite/Hotel';
import MaisonDhote from './pages/menage complite/MaisonDhote';
import Villa from './pages/menage complite/villa';
import ReservationMenageComplite from './pages/menage complite/ReservationMenageComplite';
import MénageEtCuisine from './pages/MénageetCuisine/MénageEtCuisine';
import Cuisin from './pages/MénageetCuisine/Cuisin';
import MénageCuisine from './pages/MénageetCuisine/MénageCuisine';
import ReservationCuisin from './pages/MénageetCuisine/ReservationCuisin';
import ReservationMenageCuine from './pages/MénageetCuisine/ReservationMenageCuine';
import RegisterEmployee1 from './pages/employees/RegisterEmployee1';
import SecurityRegister from './pages/employees/SecurityRegister';
import BebeSettingRegister from './pages/employees/BebeSettingRegister';
import JardinageRegister from './pages/employees/JardinageRegister';
import DriverRegister from './pages/employees/DriverRegister';
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
          <Route path="/menage-et-cuisine" element={<MénageEtCuisine />} />
          <Route path="/menage-cuisine" element={<MénageCuisine />} />
          <Route path="/cuisin" element={<Cuisin />} />
          <Route path="/reservation-cuisin" element={<ReservationCuisin />} />
          <Route path="/reservation-menage-cuisine" element={<ReservationMenageCuine />} />
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
          <Route path="/menage" element={<Menage />} />
          <Route path="/tapis-canapes" element={<TapisCanapes />} />
          <Route path="/tapis-et-canapes" element={<TapisEtCanapes />} />
          <Route path="/tapis-et-canape" element={<TapisEtCanapes />} />
          <Route path="/tapis" element={<Tapis />} />
          <Route path="/canapes" element={<Canapes />} />
          <Route path="/reservation-tapis-canapes" element={<ReservationTapisCanapes />} />
          <Route path="/reservation-voiture" element={<ReservationVoiture />} />
          <Route path="/reservation-chaussures" element={<ReservationChassoures />} />
          <Route path="/reservation-piscine" element={<ReservationPisin />} />
          <Route path="/lavage-et-ropassage" element={<LavageEtRopassage />} />
          <Route path="/lavage" element={<Lavage />} />
          <Route path="/ropassage" element={<Ropassage />} />
          <Route path="/reservation-lavage-ropassage" element={<ReservationLavageRopassage />} />
          <Route path="/bureaux-et-usine" element={<BureuxEtUsin />} />
          <Route path="/usine" element={<Usin />} />
          <Route path="/bureaux" element={<Bureaux />} />
          <Route path="/reservation-bureaux-usin" element={<ReservationBureuxUsin />} />
          <Route path="/lavage-de-voiture" element={<Voiture />} />
          <Route path="/lavage-en-centre" element={<Centre />} />
          <Route path="/lavage-a-domicile" element={<Adomicile />} />
          <Route path="/airbnb" element={<Airbnb />} />
          <Route path="/nettoyage-rapide" element={<NettoyageRapide />} />
          <Route path="/nettoyage-complet" element={<NettoyageComplet />} />
          <Route path="/reservation-airbnb" element={<ReservationAirbnb />} />
          <Route path="/piscine" element={<Pisin />} />
          <Route path="/nettoyage-profond" element={<Profond />} />
          <Route path="/nettoyage-standard" element={<Standard />} />
          <Route path="/chaussures" element={<Chassoures />} />
          <Route path="/cirage-chaussures" element={<LastrageChassures />} />
          <Route path="/nettoyage-chaussures" element={<NettoyageChassures />} />
          <Route path="/menage-complet" element={<MenageComplite />} />
          <Route path="/resort-hotel" element={<ResortHotel />} />
          <Route path="/maison" element={<Maison />} />
          <Route path="/appartement" element={<Appartement />} />
          <Route path="/hotel" element={<Hotel />} />
          <Route path="/maison-dhote" element={<MaisonDhote />} />
          <Route path="/villa" element={<Villa />} />
          <Route path="/reservation-menage-complite" element={<ReservationMenageComplite />} />
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
          <Route path="/employees/register/driver" element={<DriverRegister />} />
          {/* Clean register page uses EmployeeRegister */}
          <Route path="/employees/register/clean" element={<EmployeeRegister />} />
          <Route path="/bebe-setting" element={<BebeSetting />} />
          <Route path="/jardinage" element={<Jardinage />} />
          <Route path="/jardinage/details/:id" element={<JardinageDetail />} />
          <Route path="/hand-workers" element={<HandWorkers />} />
          <Route path="/hand-workers/category/:id" element={<HandWorkerCategoryDetails />} />
          <Route path="/hand-workers/booking" element={<HandWorkerBooking />} />
          <Route path="/hand-workers/appointment" element={<HandWorkerAppointment />} />
          <Route path="/hand-workers/register" element={<HandWorkerRegistration />} />
          <Route path="/driver" element={<Driver />} />
          <Route path="/driver/:id" element={<DriverCategoryDetails />} />
          {/* Admin Panel Routes */}
          <Route path="/admin/login" element={<Admin />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute
                allowedRoles={['admin','adminBebe','adminJardinaje','adminHouseKeeping','adminSecurity','adminHandWorker','adminDriver','driver']}
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
            path="/admin/housekeeping/menage"
            element={<PrivateRoute allowedRoles={['admin','adminHouseKeeping']} element={<Admin />} />}
          />
          <Route
            path="/admin/housekeeping/types-menage"
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
          <Route
            path="/admin/driver"
            element={<PrivateRoute allowedRoles={['admin','adminDriver','driver']} element={<Admin />} />}
          />
          <Route
            path="/admin/driver/employees"
            element={<PrivateRoute allowedRoles={['admin','adminDriver','driver']} element={<Admin />} />}
          />
          <Route
            path="/admin/driver/employees-valid"
            element={<PrivateRoute allowedRoles={['admin','adminDriver','driver']} element={<Admin />} />}
          />
          <Route
            path="/admin/driver/reservations"
            element={<PrivateRoute allowedRoles={['admin','adminDriver','driver']} element={<Admin />} />}
          />
          <Route
            path="/admin/driver/categories"
            element={<PrivateRoute allowedRoles={['admin','adminDriver','driver']} element={<Admin />} />}
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

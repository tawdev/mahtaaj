import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEmployeeAuth } from '../../contexts/EmployeeAuthContext';
import './styles/dashboard.css';

export default function DashboardLayout() {
  const { employee, logout } = useEmployeeAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => (location.pathname === path || location.pathname.startsWith(path + '/') ? 'active' : '');

  return (
    <div className="emp-page">
      <div className="emp-layout">
        <aside className="emp-sidebar emp-card">
          <div className="emp-logo-container" style={{ textAlign: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '15px' }}>
            <img src="/galerie/logooomahtaaj.png" alt="Mahtaaj" style={{ height: '45px', width: 'auto' }} />
          </div>
          <div className="emp-user">
            <strong>{employee?.full_name}</strong>
            <div><small>{employee?.email}</small></div>
          </div>
          <nav className="emp-nav">
            {employee?.role === 'adminEmployes' && (
              <Link to="/employee/dashboard" className={isActive('/employee/dashboard')}>Overview</Link>
            )}
            {employee?.role === 'adminEmployes' && (
              <Link to="/employee/dashboard/employees" className={isActive('/employee/dashboard/employees')}>Employees</Link>
            )}
            <Link to="/employee/dashboard/offres" className={isActive('/employee/dashboard/offres')}>Offres</Link>
            <Link to="/employee/dashboard/profile" className={isActive('/employee/dashboard/profile')}>My Profile</Link>
            <Link to="/support" className={isActive('/support')}>الدعم الفني</Link>
            <button onClick={async () => { await logout(); navigate('/employee/login', { replace: true }); }} className="emp-btn">Logout</button>
          </nav>
        </aside>
        <main className="emp-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}



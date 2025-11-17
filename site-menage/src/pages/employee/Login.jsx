import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeAuth } from '../../contexts/EmployeeAuthContext';
import './styles/login.css';

export default function EmployeeLogin() {
  const navigate = useNavigate();
  const { login } = useEmployeeAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Veuillez saisir البريد الإلكتروني وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      const emp = await login(email, password);
      if (emp?.role === 'adminEmployes') {
        navigate('/employee/dashboard/employees');
      } else {
        navigate('/employee/dashboard/profile');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Échec de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emp-page">
      <div className="emp-card emp-login">
        <div className="emp-login-header">
          <span className="emp-brand-dot" />
          <h2 className="emp-title" style={{ marginBottom: 0 }}>Employee Login</h2>
        </div>
        <div className="emp-subtitle">Sign in to access your dashboard</div>
        {error && (<div className="emp-error">{error}</div>)}
        <form onSubmit={handleSubmit} className="emp-form">
          <div className="emp-field">
            <label>Email</label>
            <input className="emp-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="emp-field">
            <label>Password</label>
            <input className="emp-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button disabled={loading} type="submit" className="emp-btn emp-btn--primary emp-submit">
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}



import React, { useState } from 'react';
import { adminLogin } from '../../api-supabase';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './AdminLogin.css';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting admin login with:', email);
      const response = await adminLogin(email, password);
      console.log('Login response:', response);

      if (response.token && response.admin) {
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('adminData', JSON.stringify(response.admin));
        onLogin(response);
      } else {
        setError('Réponse de connexion invalide');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>Espace Administration</h1>
          <p>Authentification sécurisée requise</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-field">
            <label htmlFor="email">Adresse Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
              autoComplete="email"
            />
          </div>

          <div className="admin-field">
            <label htmlFor="password">Mot de passe</label>
            <div className="admin-password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="admin-error">{error}</div>}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? 'Tentative de connexion...' : 'Se connecter au Dashboard'}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>Administration Panel v2.0</p>
        </div>
      </div>
    </div>
  );
}

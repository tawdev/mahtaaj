import React, { useState, useEffect } from 'react';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../api-supabase';
import './AdminCrud.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

const ROLES = [
  { value: 'admin', label: 'Admin Principal' },
  { value: 'adminBebe', label: 'Admin Bébé' },
  { value: 'adminJardinaje', label: 'Admin Jardinage' },
  { value: 'adminHouseKeeping', label: 'Admin House Keeping' },
  { value: 'adminSecurity', label: 'Admin Sécurité' },
  { value: 'adminHandWorker', label: 'Admin Travaux Manuels' },
];

export default function AdminCrud({ token, onAuthError }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [formData, setFormData] = useState({ 
    name: '',
    email: '', 
    password: '', 
    role: 'admin',
    is_active: true
  });

  // Get token from props or localStorage
  const getToken = () => {
    return token || localStorage.getItem('adminToken');
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError('');
      const authToken = getToken();
      
      if (!authToken) {
        setError('Token d\'authentification manquant');
        if (onAuthError) onAuthError();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/admins`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });

      if (response.status === 401) {
        if (onAuthError) onAuthError();
        setError('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        // Handle different response structures
        const adminsArray = Array.isArray(data.data) ? data.data : 
                           (Array.isArray(data) ? data : []);
        setAdmins(adminsArray);
      } else {
        // Show validation errors if available
        let errorMsg = data.message || 'Erreur lors du chargement des administrateurs';
        if (data.errors && typeof data.errors === 'object') {
          const errorMessages = Object.values(data.errors).flat();
          if (errorMessages.length > 0) {
            errorMsg = errorMessages.join(', ');
          }
        }
        setError(errorMsg);
      }
    } catch (e) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const authToken = getToken();
      
      if (!authToken) {
        setError('Token d\'authentification manquant');
        if (onAuthError) onAuthError();
        return;
      }

      if (editingAdmin) {
        await updateAdmin(authToken, editingAdmin.id, formData);
        showNotification('Admin modifié avec succès');
      } else {
        await createAdmin(authToken, formData);
        showNotification('Admin créé avec succès');
      }
      
      setShowForm(false);
      setEditingAdmin(null);
      setFormData({ name: '', email: '', password: '', role: 'admin', is_active: true });
      loadAdmins();
    } catch (e) {
      const errorMsg = e.message || (e.errors ? Object.values(e.errors).flat().join(', ') : 'Erreur lors de la sauvegarde');
      showNotification(errorMsg, 'error');
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({ 
      name: admin.name || '', 
      email: admin.email, 
      password: '', 
      role: admin.role || 'admin',
      is_active: admin.is_active !== undefined ? admin.is_active : true
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ?')) {
      return;
    }
    try {
      setError('');
      const authToken = getToken();
      
      if (!authToken) {
        setError('Token d\'authentification manquant');
        if (onAuthError) onAuthError();
        return;
      }

      await deleteAdmin(authToken, id);
      showNotification('Admin supprimé avec succès');
      loadAdmins();
    } catch (e) {
      const errorMsg = e.message || 'Erreur lors de la suppression';
      showNotification(errorMsg, 'error');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAdmin(null);
    setFormData({ name: '', email: '', password: '', role: 'admin', is_active: true });
    setError('');
    setSuccess('');
  };

  const getRoleLabel = (role) => {
    const roleObj = ROLES.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      (admin.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || admin.role === filterRole;
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && admin.is_active) ||
      (filterStatus === 'inactive' && !admin.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading && admins.length === 0) {
    return (
      <div className="admin-crud">
        <div className="admin-crud-loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="admin-crud">
      <div className="admin-crud-header">
        <h2>Gestion des Comptes</h2>
        <button 
          onClick={() => { setShowForm(true); setEditingAdmin(null); setFormData({ name: '', email: '', password: '', role: 'admin', is_active: true }); }}
          className="admin-crud-add-button"
        >
          + Ajouter un Compte
        </button>
      </div>

      {(error || success) && (
        <div className={`admin-crud-notification ${error ? 'error' : 'success'}`}>
          {error || success}
        </div>
      )}

      {showForm && (
        <div className="admin-crud-form-overlay">
          <div className="admin-crud-form">
            <div className="admin-crud-form-header">
              <h3>{editingAdmin ? 'Modifier' : 'Créer'} un Compte</h3>
              <button type="button" className="admin-crud-close-button" onClick={handleCancel} aria-label="Fermer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-crud-field">
                <label htmlFor="name">Nom (Optionnel)</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nom complet"
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  placeholder="admin@example.com"
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="role">Rôle *</label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-crud-field">
                <label htmlFor="password">
                  Mot de passe {editingAdmin && '(laisser vide pour ne pas changer)'}
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={!editingAdmin}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <div className="admin-crud-field checkbox-field">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  Compte actif
                </label>
              </div>
              <div className="admin-crud-form-actions">
                <button type="submit" className="admin-crud-save-button">
                  {editingAdmin ? 'Modifier' : 'Créer'}
                </button>
                <button type="button" onClick={handleCancel} className="admin-crud-cancel-button">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-crud-filters">
        <input
          type="text"
          placeholder="Rechercher (nom, email)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-crud-search-input"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="admin-crud-filter-select"
        >
          <option value="all">Tous les rôles</option>
          {ROLES.map(role => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="admin-crud-filter-select"
        >
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      <div className="admin-crud-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">Aucun compte trouvé</td>
              </tr>
            ) : (
              filteredAdmins.map((admin) => (
                <tr key={admin.id}>
                  <td>{admin.id}</td>
                  <td>{admin.name || '-'}</td>
                  <td>{admin.email}</td>
                  <td>
                    <span className={`role-badge role-${admin.role}`}>
                      {getRoleLabel(admin.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${admin.is_active ? 'active' : 'inactive'}`}>
                      {admin.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => handleEdit(admin)}
                      className="admin-crud-edit-button"
                    >
                      Modifier
                    </button>
                    <button 
                      onClick={() => handleDelete(admin.id)}
                      className="admin-crud-delete-button"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { 
  getDriverEmployees, 
  createDriverEmployee, 
  updateDriverEmployee, 
  deleteDriverEmployee,
  validateDriverEmployee
} from '../../api-supabase';
import './AdminCrud.css';

export default function AdminDriverEmployees({ token, onAuthError }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({ 
    full_name: '',
    phone: '', 
    cin_number: '', 
    city: '',
    quartier: '',
    address: ''
  });

  const getToken = () => token || localStorage.getItem('adminToken');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getDriverEmployees();
      setEmployees(data || []);
    } catch (e) {
      console.error('Error loading driver employees:', e);
      if (e.message?.includes('JWT') || e.message?.includes('expired')) {
        if (onAuthError) onAuthError();
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError(e.message || 'Erreur de connexion');
      }
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
      
      if (editingEmployee) {
        await updateDriverEmployee(editingEmployee.id, formData);
        showNotification('Employé modifié avec succès');
      } else {
        await createDriverEmployee(formData);
        showNotification('Employé créé avec succès');
      }
      
      setShowForm(false);
      setEditingEmployee(null);
      setFormData({ full_name: '', phone: '', cin_number: '', city: '', quartier: '', address: '' });
      loadEmployees();
    } catch (e) {
      const errorMsg = e.message || 'Erreur lors de la sauvegarde';
      showNotification(errorMsg, 'error');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({ 
      full_name: employee.full_name || '', 
      phone: employee.phone || '', 
      cin_number: employee.cin_number || '', 
      city: employee.city || '', 
      quartier: employee.quartier || '', 
      address: employee.address || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      return;
    }
    try {
      setError('');
      await deleteDriverEmployee(id);
      showNotification('Employé supprimé avec succès');
      loadEmployees();
    } catch (e) {
      const errorMsg = e.message || 'Erreur lors de la suppression';
      showNotification(errorMsg, 'error');
    }
  };

  const handleValidate = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir valider cet employé ?')) {
      return;
    }
    try {
      setError('');
      await validateDriverEmployee(id);
      showNotification('Employé validé avec succès');
      loadEmployees();
    } catch (e) {
      const errorMsg = e.message || 'Erreur lors de la validation';
      showNotification(errorMsg, 'error');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setFormData({ full_name: '', phone: '', cin_number: '', city: '', quartier: '', address: '' });
    setError('');
    setSuccess('');
  };

  const filteredEmployees = employees.filter(employee => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (employee.full_name || '').toLowerCase().includes(searchLower) ||
      (employee.phone || '').toLowerCase().includes(searchLower) ||
      (employee.cin_number || '').toLowerCase().includes(searchLower) ||
      (employee.city || '').toLowerCase().includes(searchLower) ||
      (employee.quartier || '').toLowerCase().includes(searchLower) ||
      (employee.address || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading && employees.length === 0) {
    return (
      <div className="admin-crud">
        <div className="admin-crud-loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="admin-crud">
      <div className="admin-crud-header">
        <h2>Gestion des Employés Chauffeurs</h2>
        <button 
          onClick={() => { setShowForm(true); setEditingEmployee(null); setFormData({ full_name: '', phone: '', cin_number: '', city: '', quartier: '', address: '' }); }}
          className="admin-crud-add-button"
        >
          + Ajouter un Employé
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
              <h3>{editingEmployee ? 'Modifier' : 'Créer'} un Employé</h3>
              <button type="button" className="admin-crud-close-button" onClick={handleCancel} aria-label="Fermer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-crud-field">
                <label htmlFor="full_name">Nom Complet *</label>
                <input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                  placeholder="Nom complet"
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="phone">Téléphone *</label>
                <input
                  id="phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="city">Ville</label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Ville"
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="quartier">Quartier</label>
                <input
                  id="quartier"
                  type="text"
                  value={formData.quartier}
                  onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                  placeholder="Quartier"
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="cin_number">Numéro CIN *</label>
                <input
                  id="cin_number"
                  type="text"
                  value={formData.cin_number}
                  onChange={(e) => setFormData({...formData, cin_number: e.target.value})}
                  required
                  placeholder="Numéro CIN"
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="address">Adresse</label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Adresse complète"
                  rows="3"
                />
              </div>
              <div className="admin-crud-form-actions">
                <button type="submit" className="admin-crud-save-button">
                  {editingEmployee ? 'Modifier' : 'Créer'}
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
          placeholder="Rechercher (nom, téléphone, CIN, adresse)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-crud-search-input"
        />
      </div>

      <div className="admin-crud-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom Complet</th>
              <th>Téléphone</th>
              <th>CIN</th>
              <th>Ville</th>
              <th>Quartier</th>
              <th>Adresse</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">Aucun employé trouvé</td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td>{employee.full_name || '-'}</td>
                  <td>{employee.phone || '-'}</td>
                  <td>{employee.cin_number || '-'}</td>
                  <td>{employee.city || '-'}</td>
                  <td>{employee.quartier || '-'}</td>
                  <td>{employee.address || '-'}</td>
                  <td>{new Date(employee.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => handleValidate(employee.id)}
                      className="admin-crud-edit-button"
                      style={{ backgroundColor: '#10b981', marginRight: '8px' }}
                    >
                      Valider
                    </button>
                    <button 
                      onClick={() => handleEdit(employee)}
                      className="admin-crud-edit-button"
                    >
                      Modifier
                    </button>
                    <button 
                      onClick={() => handleDelete(employee.id)}
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


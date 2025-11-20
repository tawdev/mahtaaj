import React, { useEffect, useState } from 'react';
import { 
  getDriverEmployeesValid, 
  deleteDriverEmployeeValid 
} from '../../api-supabase';
import './AdminCrud.css';

export default function AdminDriverEmployeesValid({ token, onAuthError }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getToken = () => token || localStorage.getItem('adminToken');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getDriverEmployeesValid();
      setEmployees(data || []);
    } catch (e) {
      console.error('Error loading validated driver employees:', e);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet employé validé ?')) {
      return;
    }
    try {
      setError('');
      await deleteDriverEmployeeValid(id);
      showNotification('Employé validé supprimé avec succès');
      loadEmployees();
    } catch (e) {
      const errorMsg = e.message || 'Erreur lors de la suppression';
      showNotification(errorMsg, 'error');
    }
  };

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
        <h2>Employés Chauffeurs Validés</h2>
        <button 
          onClick={loadEmployees}
          className="admin-crud-add-button"
        >
          🔄 Rafraîchir
        </button>
      </div>

      {(error || success) && (
        <div className={`admin-crud-notification ${error ? 'error' : 'success'}`}>
          {error || success}
        </div>
      )}

      <div className="admin-crud-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom Complet</th>
              <th>Téléphone</th>
              <th>CIN</th>
              <th>Statut</th>
              <th>Validé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">Aucun employé validé trouvé</td>
              </tr>
            ) : (
              employees.map((employee) => {
                const driver = employee.driver_employees || {};
                return (
                  <tr key={employee.id}>
                    <td>{employee.id}</td>
                    <td>{driver.full_name || '-'}</td>
                    <td>{driver.phone || '-'}</td>
                    <td>{driver.cin_number || '-'}</td>
                    <td>
                      <span className={`status-badge ${employee.validation_status === 'approved' ? 'active' : 'inactive'}`}>
                        {employee.validation_status === 'approved' ? 'Approuvé' : employee.validation_status}
                      </span>
                    </td>
                    <td>{employee.validated_at ? new Date(employee.validated_at).toLocaleDateString() : '-'}</td>
                    <td>
                      <button 
                        onClick={() => handleDelete(employee.id)}
                        className="admin-crud-delete-button"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


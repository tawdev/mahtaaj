import React, { useState, useEffect } from 'react';
import './AdminHandWorkerRegistrationsCrud.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function AdminHandWorkerRegistrationsCrud({ token, onAuthError }) {
  const [registrations, setRegistrations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories
      const categoriesResponse = await fetch(`${API_BASE_URL}/hand-worker-categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (categoriesResponse.status === 401) {
        onAuthError();
        return;
      }

      const categoriesData = await categoriesResponse.json();
      if (categoriesData.success) {
        setCategories(categoriesData.data);
      }

      // Load registrations
      const registrationsResponse = await fetch(`${API_BASE_URL}/admin/hand-worker-registrations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (registrationsResponse.status === 401) {
        onAuthError();
        return;
      }

      const registrationsData = await registrationsResponse.json();
      if (registrationsData.success) {
        setRegistrations(registrationsData.data);
      } else {
        setError('Erreur lors du chargement des inscriptions');
      }
    } catch (e) {
      console.error('Error loading data:', e);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir approuver cette inscription ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/hand-worker-registrations/${registrationId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_notes: '' })
      });

      if (response.status === 401) {
        onAuthError();
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSuccess('Inscription approuvée avec succès et déplacée vers les validations');
        // Supprimer l'inscription de la liste locale
        setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
      } else {
        setError(data.message || 'Erreur lors de l\'approbation');
      }
    } catch (e) {
      console.error('Error approving registration:', e);
      setError('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (registrationId) => {
    const adminNotes = window.prompt('Raison du rejet:');
    if (!adminNotes) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/hand-worker-registrations/${registrationId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_notes: adminNotes })
      });

      if (response.status === 401) {
        onAuthError();
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSuccess('Inscription rejetée avec succès');
        // Supprimer l'inscription de la liste locale
        setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
      } else {
        setError(data.message || 'Erreur lors du rejet');
      }
    } catch (e) {
      console.error('Error rejecting registration:', e);
      setError('Erreur lors du rejet');
    }
  };

  const handleDelete = async (registrationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/hand-worker-registrations/${registrationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        onAuthError();
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSuccess('Inscription supprimée avec succès');
        // Supprimer l'inscription de la liste locale
        setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
      } else {
        setError(data.message || 'Erreur lors de la suppression');
      }
    } catch (e) {
      console.error('Error deleting registration:', e);
      setError('Erreur lors de la suppression');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'N/A';
  };

  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch = 
      registration.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || registration.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || registration.category_id === parseInt(categoryFilter);
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-hand-worker-registrations">
      <div className="admin-header">
        <h2>إدارة التسجيلات - عمال الحرف</h2>
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-label">إجمالي</span>
            <span className="stat-value">{registrations.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">في الانتظار</span>
            <span className="stat-value">{registrations.filter(r => r.status === 'pending').length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">معتمدة</span>
            <span className="stat-value">{registrations.filter(r => r.status === 'approved').length}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      <div className="filters-bar">
        <div className="filter-group">
          <input
            type="text"
            placeholder="بحث (الاسم، البريد، الهاتف)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">في الانتظار</option>
            <option value="approved">معتمدة</option>
            <option value="rejected">مرفوضة</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الأنواع</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="registrations-table-container">
        <table className="registrations-table">
          <thead>
            <tr>
              <th>الصورة</th>
              <th>الاسم الكامل</th>
              <th>البريد الإلكتروني</th>
              <th>الهاتف</th>
              <th>نوع العمل</th>
              <th>المنطقة/العنوان</th>
              <th>سنوات الخبرة</th>
              <th>الحالة</th>
              <th>تاريخ التسجيل</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistrations.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  لا توجد تسجيلات
                </td>
              </tr>
            ) : (
              filteredRegistrations.map(registration => (
                <tr key={registration.id}>
                  <td className="photo-cell">
                    {registration.photo ? (
                      <img 
                        src={`http://localhost:8000/storage/${registration.photo}`} 
                        alt={registration.full_name}
                        className="registration-photo"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/50';
                        }}
                      />
                    ) : (
                      <div className="default-photo">
                        <i className="fas fa-user"></i>
                      </div>
                    )}
                  </td>
                  <td>{registration.full_name}</td>
                  <td className="email-cell">{registration.email}</td>
                  <td className="phone-cell">{registration.phone}</td>
                  <td className="category-cell">
                    {getCategoryName(registration.category_id)}
                  </td>
                  <td>
                    {registration.address && `${registration.address}, `}
                    {registration.city}
                  </td>
                  <td className="experience-cell">{registration.experience_years} سنة</td>
                  <td>
                    <span className={`status-badge status-${registration.status}`}>
                      {registration.status === 'pending' ? 'في الانتظار' :
                       registration.status === 'approved' ? 'معتمدة' : 'مرفوضة'}
                    </span>
                  </td>
                  <td>
                    {new Date(registration.created_at).toLocaleDateString('ar-MA')}
                  </td>
                  <td className="actions-cell">
                    {registration.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-approve"
                          onClick={() => handleApprove(registration.id)}
                          title="الموافقة"
                        >
                          <i className="fas fa-check"></i>
                          <span>موافقة</span>
                        </button>
                        <button
                          className="btn btn-reject"
                          onClick={() => handleReject(registration.id)}
                          title="الرفض"
                        >
                          <i className="fas fa-times"></i>
                          <span>رفض</span>
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-delete"
                      onClick={() => handleDelete(registration.id)}
                      title="حذف"
                    >
                      <i className="fas fa-trash"></i>
                      <span>حذف</span>
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


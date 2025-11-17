import React, { useState, useEffect } from 'react';
import './AdminHandWorkerRegistrationsCrud.css';
import { supabase } from '../../lib/supabase';

export default function AdminValideHandWorkerReservationsCrud({ token, onAuthError }) {
  const [registrations, setRegistrations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[AdminValideHandWorkerReservations] Loading data from Supabase...');
      
      // Load categories from Supabase
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('hand_worker_categories')
        .select('*')
        .order('order', { ascending: true });
      
      if (categoriesError) {
        console.error('[AdminValideHandWorkerReservations] Error loading categories:', categoriesError);
      } else {
        console.log('[AdminValideHandWorkerReservations] Loaded categories:', categoriesData?.length || 0);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      }

      // Load validated hand workers
      // Load all workers first, then filter in JavaScript for validated ones
      const { data: allWorkersData, error: workersError } = await supabase
        .from('hand_workers')
        .select(`
          *,
          category:hand_worker_categories (
            id,
            name,
            name_fr,
            name_ar,
            name_en
          )
        `)
        .order('updated_at', { ascending: false });
      
      // Filter validated workers: status = 'approved' OR (is_available = true AND status != 'pending')
      const workersData = Array.isArray(allWorkersData) ? allWorkersData.filter(worker => {
        return worker.status === 'approved' || (worker.is_available === true && worker.status !== 'pending');
      }) : [];
      
      if (workersError) {
        console.error('[AdminValideHandWorkerReservations] Error loading workers:', workersError);
        setError(`Erreur lors du chargement: ${workersError.message}`);
      } else {
        console.log('[AdminValideHandWorkerReservations] Loaded validated workers:', workersData?.length || 0);
        
        // Transform data to match expected format
        const transformedData = Array.isArray(workersData) ? workersData.map(worker => ({
          id: worker.id,
          full_name: `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || 'N/A',
          email: worker.email || 'N/A',
          phone: worker.phone || 'N/A',
          category_id: worker.category_id,
          category_name: worker.category 
            ? (worker.category.name || worker.category.name_fr || worker.category.name_ar || worker.category.name_en || 'N/A')
            : 'N/A',
          address: worker.address || '',
          city: worker.city || '',
          experience_years: worker.experience_years || 0,
          photo: worker.photo || null,
          photo_url: worker.photo || null,
          status: worker.status === 'approved' ? 'approved' : 'active',
          approved_at: worker.updated_at || worker.created_at,
          ...worker
        })) : [];
        
        setRegistrations(transformedData);
      }
    } catch (e) {
      console.error('[AdminValideHandWorkerReservations] Exception loading data:', e);
      setError(`Erreur: ${e.message || 'Erreur lors du chargement des données'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (registrationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce travailleur validé ?')) {
      return;
    }

    try {
      console.log('[AdminValideHandWorkerReservations] Deleting worker:', registrationId);
      
      const { error } = await supabase
        .from('hand_workers')
        .delete()
        .eq('id', registrationId);
      
      if (error) {
        console.error('[AdminValideHandWorkerReservations] Error deleting worker:', error);
        setError(`Erreur lors de la suppression: ${error.message}`);
        return;
      }
      
      console.log('[AdminValideHandWorkerReservations] Delete successful');
      setSuccess('Travailleur validé supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);
      await loadData();
    } catch (e) {
      console.error('[AdminValideHandWorkerReservations] Exception deleting worker:', e);
      setError(`Erreur: ${e.message}`);
    }
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'N/A';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? (category.name || category.name_fr || category.name_ar || category.name_en || 'N/A') : 'N/A';
  };

  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch = 
      registration.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.phone?.includes(searchTerm);
    
    const matchesCategory = categoryFilter === 'all' || registration.category_id === parseInt(categoryFilter);
    
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-hand-worker-registrations">
      <div className="admin-header">
        <h2>العمّال المعتمدون - عمال الحرف</h2>
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-label">إجمالي</span>
            <span className="stat-value">{registrations.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">معتمدين</span>
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
              <th>تاريخ الاعتماد</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistrations.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  لا توجد تسجيلات معتمدة
                </td>
              </tr>
            ) : (
              filteredRegistrations.map(registration => (
                <tr key={registration.id}>
                  <td className="photo-cell">
                    {registration.photo || registration.photo_url ? (
                      <img 
                        src={registration.photo_url || registration.photo} 
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
                    {registration.category_name || getCategoryName(registration.category_id)}
                  </td>
                  <td>
                    {registration.address && `${registration.address}, `}
                    {registration.city}
                  </td>
                  <td className="experience-cell">{registration.experience_years} سنة</td>
                  <td>
                    <span className={`status-badge status-approved`}>
                      معتمدة
                    </span>
                  </td>
                  <td>
                    {registration.approved_at ? new Date(registration.approved_at).toLocaleDateString('ar-MA') : '-'}
                  </td>
                  <td className="actions-cell">
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


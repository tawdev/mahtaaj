import React, { useEffect, useMemo, useState } from 'react';
import './AdminSecurityEmployees.css';
import { supabase } from '../../lib/supabase';

export default function AdminSecurityEmployees({ token, onAuthError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[AdminSecurityEmployees] Loading security employees from Supabase...');
      
      // Load employees from Supabase
      // Note: Security employees are stored in the employees table
      // Load only non-validated employees (status != 'active' OR is_active != true)
      // These are the employees waiting for validation
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[AdminSecurityEmployees] Error loading employees:', error);
        setError(`Erreur lors du chargement: ${error.message}`);
        return;
      }
      
      // Filter in JavaScript to get only non-validated employees
      // (status != 'active' OR is_active != true)
      const nonValidatedData = Array.isArray(data) ? data.filter(emp => {
        return emp.status !== 'active' || emp.is_active !== true;
      }) : [];
      
      console.log('[AdminSecurityEmployees] Loaded employees:', nonValidatedData?.length || 0, '(non-validated)');
      
      // Transform data to match expected format
      const transformedData = Array.isArray(nonValidatedData) ? nonValidatedData.map(emp => {
        const metadata = emp.metadata || {};
        return {
          id: emp.id,
          first_name: metadata.first_name || emp.full_name?.split(' ')[0] || '',
          last_name: metadata.last_name || emp.full_name?.split(' ').slice(1).join(' ') || '',
          email: emp.email || '',
          phone: emp.phone || '',
          location: metadata.location || emp.address || '',
          is_active: emp.status === 'active' || emp.is_active === true,
          status: emp.status || 'pending',
          ...emp
        };
      }) : [];
      
      setItems(transformedData);
    } catch (e) {
      console.error('[AdminSecurityEmployees] Exception loading employees:', e);
      setError(e.message || 'Impossible de charger les employés');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'active') return items.filter(i => i.is_active);
    if (filter === 'inactive') return items.filter(i => !i.is_active);
    return items;
  }, [items, filter]);

  const toggleActive = async (id, next) => {
    try {
      console.log('[AdminSecurityEmployees] Toggling active status for employee:', id, 'to', next);
      
      const { error } = await supabase
        .from('employees')
        .update({ 
          is_active: !!next,
          status: next ? 'active' : 'inactive'
        })
        .eq('id', id);
      
      if (error) {
        console.error('[AdminSecurityEmployees] Error updating employee:', error);
        setError(`Erreur lors de la mise à jour: ${error.message}`);
        return;
      }
      
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: !!next, status: next ? 'active' : 'inactive' } : i));
    } catch (e) {
      console.error('[AdminSecurityEmployees] Exception toggling active:', e);
      setError(`Erreur: ${e.message}`);
    }
  };

  const validateEmployee = async (id) => {
    try {
      console.log('[AdminSecurityEmployees] Validating employee:', id);
      
      // First, get the current employee data to verify
      const { data: currentEmployee, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('[AdminSecurityEmployees] Error fetching employee:', fetchError);
        alert(`Erreur lors de la récupération: ${fetchError.message}`);
        return;
      }
      
      console.log('[AdminSecurityEmployees] Current employee data:', {
        id: currentEmployee.id,
        status: currentEmployee.status,
        is_active: currentEmployee.is_active
      });
      
      // Update employee status to 'active' and is_active to true
      // Also update updated_at to track validation date
      const { data: updatedEmployees, error } = await supabase
        .from('employees')
        .update({ 
          status: 'active',
          is_active: true,
          updated_at: new Date().toISOString() // Explicitly update updated_at for validation date
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('[AdminSecurityEmployees] Error validating employee:', error);
        alert(`Erreur lors de la validation: ${error.message}`);
        return;
      }
      
      if (!updatedEmployees || updatedEmployees.length === 0) {
        console.error('[AdminSecurityEmployees] No employee was updated. Check RLS policies.');
        alert('Erreur: Aucun employé n\'a été mis à jour. Vérifiez les permissions RLS.');
        return;
      }
      
      const updatedEmployee = updatedEmployees[0];
      console.log('[AdminSecurityEmployees] Employee validated successfully:', {
        id: updatedEmployee.id,
        status: updatedEmployee.status,
        is_active: updatedEmployee.is_active,
        updated_at: updatedEmployee.updated_at
      });
      
      // Remove from list (as it's now validated and will appear in employees-valid page)
      setItems(prev => prev.filter(i => i.id !== id));
      alert('Employé validé ✅\nIl apparaîtra maintenant dans la liste des employés validés.');
    } catch (e) {
      console.error('[AdminSecurityEmployees] Exception validating employee:', e);
      alert(`Erreur: ${e.message}`);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer cet employé ?')) return;
    
    try {
      console.log('[AdminSecurityEmployees] Deleting employee:', id);
      
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('[AdminSecurityEmployees] Error deleting employee:', error);
        setError(`Erreur lors de la suppression: ${error.message}`);
        return;
      }
      
      console.log('[AdminSecurityEmployees] Employee deleted successfully');
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error('[AdminSecurityEmployees] Exception deleting employee:', e);
      setError(`Erreur: ${e.message}`);
    }
  };

  return (
    <main className="admin-page security-employees-page">
      <div className="security-employees-header">
        <h1>Employés Sécurité</h1>
        <div className="security-employees-actions">
          <select 
            className="security-employees-filter"
            value={filter} 
            onChange={e=>setFilter(e.target.value)}
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
          <button className="security-employees-refresh-btn" onClick={load}>🔄 Rafraîchir</button>
        </div>
      </div>

      {error && (
        <div className="security-employees-alert error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {loading ? (
        <div className="security-employees-loading">Chargement…</div>
      ) : (
        <div className="security-employees-table-wrapper">
          <table className="security-employees-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Ville</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id}>
                  <td>#{emp.id}</td>
                  <td>{`${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '-'}</td>
                  <td>
                    <a href={`mailto:${emp.email}`} className="security-employees-email">{emp.email || '-'}</a>
                  </td>
                  <td>{emp.phone || '-'}</td>
                  <td>{emp.location || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        className="security-employees-checkbox"
                        checked={!!emp.is_active} 
                        onChange={e=>toggleActive(emp.id, e.target.checked)} 
                      />
                      <span className={`security-employees-status ${emp.is_active ? 'active' : 'inactive'}`}>
                        {emp.is_active ? '✓ Actif' : '✗ Inactif'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{display:'flex', gap:8}}>
                      <button className="security-employees-validate-btn" onClick={()=>validateEmployee(emp.id)}>✅ Valider</button>
                      <button className="security-employees-delete-btn" onClick={()=>remove(emp.id)}>🗑️ Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="security-employees-empty">Aucun employé trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}



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
      
      console.log('[AdminSecurityEmployees] Loading security employees from security_employees table...');
      
      // Load employees from security_employees table
      const { data, error } = await supabase
        .from('security_employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[AdminSecurityEmployees] Error loading employees:', error);
        setError(`Erreur lors du chargement: ${error.message}`);
        return;
      }
      
      console.log('[AdminSecurityEmployees] Loaded employees:', data?.length || 0);
      
      // Transform data to match expected format
      const transformedData = Array.isArray(data) ? data.map(emp => ({
        id: emp.id,
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        email: emp.email || '',
        phone: emp.phone || '',
        address: emp.address || '',
        location: emp.location || '',
        birth_date: emp.birth_date || '',
        age: emp.age || null,
        expertise: emp.expertise || '',
        auto_entrepreneur: emp.auto_entrepreneur || '',
        last_experience: emp.last_experience || '',
        company_name: emp.company_name || '',
        preferred_work_time: emp.preferred_work_time || '',
        photo: emp.photo || emp.photo_url || '',
        availability: emp.availability || {},
        is_active: emp.is_active || false,
        status: emp.status || 'pending',
        ...emp
      })) : [];
      
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
        .from('security_employees')
        .update({ 
          is_active: !!next,
          status: next ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
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
      
      // First, get the employee data
      const { data: employee, error: fetchError } = await supabase
        .from('security_employees')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !employee) {
        console.error('[AdminSecurityEmployees] Error fetching employee:', fetchError);
        alert('Erreur lors de la récupération des données: ' + (fetchError?.message || 'Employé non trouvé'));
        return;
      }
      
      // Insert into security_employees_valid table
      const { error: insertError } = await supabase
        .from('security_employees_valid')
        .insert([{
          employee_id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          birth_date: employee.birth_date,
          age: employee.age,
          email: employee.email,
          phone: employee.phone,
          address: employee.address,
          location: employee.location,
          expertise: employee.expertise,
          auto_entrepreneur: employee.auto_entrepreneur,
          last_experience: employee.last_experience,
          company_name: employee.company_name,
          preferred_work_time: employee.preferred_work_time,
          photo: employee.photo,
          photo_url: employee.photo_url,
          availability: employee.availability || {},
          is_active: true
        }]);
      
      if (insertError) {
        console.error('[AdminSecurityEmployees] Error inserting into valid table:', insertError);
        alert('Erreur lors de l\'insertion dans la table validée: ' + insertError.message);
        return;
      }
      
      // Update the original employee record
      const { error: updateError } = await supabase
        .from('security_employees')
        .update({ 
          status: 'active',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('[AdminSecurityEmployees] Error updating employee:', updateError);
        alert('Erreur lors de la mise à jour: ' + updateError.message);
        return;
      }
      
      console.log('[AdminSecurityEmployees] Validation successful');
      // Remove from current list after successful validation
      setItems(prev => prev.filter(i => i.id !== id));
      alert('Employé validé ✅');
    } catch (e) {
      console.error('[AdminSecurityEmployees] Exception validating employee:', e);
      alert('Erreur lors de la validation: ' + e.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer cet employé ?')) return;
    
    try {
      console.log('[AdminSecurityEmployees] Deleting employee:', id);
      
      const { error } = await supabase
        .from('security_employees')
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



import React, { useEffect, useMemo, useState } from 'react';
import './AdminJardinageEmployees.css';
import { supabase } from '../../lib/supabase';

export default function AdminJardinageEmployees({ token, onAuthError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[AdminJardinageEmployees] Loading employees from jardinage_employees table...');
      
      // Load all employees from jardinage_employees table
      const { data: jardinageEmployees, error: loadError } = await supabase
        .from('jardinage_employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (loadError) {
        console.error('[AdminJardinageEmployees] Error loading employees:', loadError);
        throw new Error(loadError.message || 'Erreur lors du chargement');
      }
      
      // Transform data to match expected format
      const transformed = Array.isArray(jardinageEmployees) ? jardinageEmployees.map(emp => ({
        id: emp.id,
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        full_name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        email: emp.email || '',
        phone: emp.phone || '',
        expertise: emp.expertise || '',
        location: emp.location || '',
        address: emp.address || '',
        birth_date: emp.birth_date || '',
        age: emp.age || null,
        auto_entrepreneur: emp.auto_entrepreneur || '',
        last_experience: emp.last_experience || '',
        company_name: emp.company_name || '',
        photo: emp.photo || emp.photo_url || '',
        is_active: emp.is_active || false,
        status: emp.status || 'pending',
        ...emp
      })) : [];
      
      console.log('[AdminJardinageEmployees] Loaded employees:', transformed.length);
      setItems(transformed);
    } catch (e) {
      console.error('[AdminJardinageEmployees] Exception loading:', e);
      setError(e.message || 'Erreur lors du chargement');
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
      console.log('[AdminJardinageEmployees] Toggling active:', id, next);
      
      const { error } = await supabase
        .from('jardinage_employees')
        .update({ 
          is_active: !!next,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        console.error('[AdminJardinageEmployees] Error toggling active:', error);
        return;
      }
      
      console.log('[AdminJardinageEmployees] Toggle successful');
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: !!next } : i));
    } catch (e) {
      console.error('[AdminJardinageEmployees] Exception toggling active:', e);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer cet employé ?')) return;
    try {
      console.log('[AdminJardinageEmployees] Deleting employee:', id);
      
      const { error } = await supabase
        .from('jardinage_employees')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('[AdminJardinageEmployees] Error deleting employee:', error);
        return;
      }
      
      console.log('[AdminJardinageEmployees] Delete successful');
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error('[AdminJardinageEmployees] Exception deleting employee:', e);
    }
  };

  const validateEmployee = async (id) => {
    try {
      console.log('[AdminJardinageEmployees] Validating employee:', id);
      
      // First, get the employee data
      const { data: employee, error: fetchError } = await supabase
        .from('jardinage_employees')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !employee) {
        console.error('[AdminJardinageEmployees] Error fetching employee:', fetchError);
        alert('Erreur lors de la récupération des données: ' + (fetchError?.message || 'Employé non trouvé'));
        return;
      }
      
      // Insert into jardinage_employees_valid table
      const { error: insertError } = await supabase
        .from('jardinage_employees_valid')
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
          photo: employee.photo,
          photo_url: employee.photo_url,
          is_active: true
        }]);
      
      if (insertError) {
        console.error('[AdminJardinageEmployees] Error inserting into valid table:', insertError);
        alert('Erreur lors de l\'insertion dans la table validée: ' + insertError.message);
        return;
      }
      
      // Update the original employee record
      const { error: updateError } = await supabase
        .from('jardinage_employees')
        .update({ 
          status: 'active',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('[AdminJardinageEmployees] Error updating employee:', updateError);
        alert('Erreur lors de la mise à jour: ' + updateError.message);
        return;
      }
      
      console.log('[AdminJardinageEmployees] Validation successful');
      // Remove from current list after successful validation
      setItems(prev => prev.filter(i => i.id !== id));
      alert('Employé validé ✅');
    } catch (e) {
      console.error('[AdminJardinageEmployees] Exception validating employee:', e);
      alert('Erreur lors de la validation: ' + e.message);
    }
  };

  return (
    <main className="admin-page jardinage-employees-page">
      <div className="jardinage-employees-header">
        <h1>Employés Jardinage</h1>
        <div className="jardinage-employees-actions">
          <select 
            className="jardinage-employees-filter"
            value={filter} 
            onChange={e=>setFilter(e.target.value)}
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
          <button 
            className="jardinage-employees-refresh-btn"
            onClick={load}
          >
            🔄 Rafraîchir
          </button>
        </div>
      </div>

      {error && (
        <div className="jardinage-employees-alert error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {loading ? (
        <div className="jardinage-employees-loading">Chargement…</div>
      ) : (
        <div className="jardinage-employees-table-wrapper">
          <table className="jardinage-employees-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Expertise</th>
                <th>Ville</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id}>
                  <td>#{emp.id}</td>
                  <td>
                    <span className="jardinage-employees-name">
                      {`${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '-'}
                    </span>
                  </td>
                  <td>
                    <a 
                      href={`mailto:${emp.email}`} 
                      className="jardinage-employees-email"
                    >
                      {emp.email || '-'}
                    </a>
                  </td>
                  <td>{emp.phone || '-'}</td>
                  <td>
                    {emp.expertise ? (
                      <span className="jardinage-employees-expertise">
                        {emp.expertise}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span className="jardinage-employees-location">
                      {emp.location || '-'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        className="jardinage-employees-checkbox"
                        checked={!!emp.is_active} 
                        onChange={e=>toggleActive(emp.id, e.target.checked)} 
                      />
                      <span className={`jardinage-employees-status ${emp.is_active ? 'active' : 'inactive'}`}>
                        {emp.is_active ? '✓ Actif' : '✗ Inactif'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{display:'flex', gap:8}}>
                      <button 
                        className="jardinage-employees-delete-btn"
                        onClick={()=>remove(emp.id)}
                      >
                        🗑️ Supprimer
                      </button>
                      <button 
                        className="jardinage-employees-refresh-btn"
                        onClick={()=>validateEmployee(emp.id)}
                      >
                        ✅ Valider
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="jardinage-employees-empty">
                    Aucun employé trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}



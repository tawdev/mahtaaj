import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import './AdminJardinageEmployees.css';

export default function AdminJardinageEmployeesValid({ token, onAuthError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[AdminJardinageEmployeesValid] Loading validated employees from Supabase...');
      
      // Load all employees, then filter in JavaScript
      const { data: allEmployees, error: loadError } = await supabase
        .from('employees')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (loadError) {
        console.error('[AdminJardinageEmployeesValid] Error loading employees:', loadError);
        throw new Error(loadError.message || 'Erreur lors du chargement');
      }
      
      // Filter for validated jardinage employees
      const validatedEmployees = Array.isArray(allEmployees) ? allEmployees.filter(emp => {
        const metadata = emp.metadata || {};
        const isJardinage = metadata.type === 'jardinage';
        const isValidated = emp.status === 'active' && emp.is_active === true;
        return isJardinage && isValidated;
      }) : [];
      
      // Transform data to match expected format
      const transformed = validatedEmployees.map(emp => {
        const metadata = emp.metadata || {};
        return {
          id: emp.id,
          first_name: metadata.first_name || '',
          last_name: metadata.last_name || '',
          full_name: emp.full_name || `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim(),
          email: emp.email || '',
          phone: emp.phone || '',
          expertise: metadata.expertise || '',
          location: metadata.location || '',
          is_active: emp.is_active || false,
          status: emp.status || 'active',
          ...emp
        };
      });
      
      console.log('[AdminJardinageEmployeesValid] Loaded validated employees:', transformed.length);
      setItems(transformed);
    } catch (e) {
      console.error('[AdminJardinageEmployeesValid] Exception loading:', e);
      setError(e.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); }, []);

  const remove = async (id) => {
    if (!window.confirm('Supprimer cet enregistrement validé ?')) return;
    try {
      console.log('[AdminJardinageEmployeesValid] Deactivating employee:', id);
      
      // Instead of deleting, deactivate the employee
      const { error } = await supabase
        .from('employees')
        .update({ 
          status: 'inactive',
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        console.error('[AdminJardinageEmployeesValid] Error deactivating employee:', error);
        return;
      }
      
      console.log('[AdminJardinageEmployeesValid] Deactivation successful');
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error('[AdminJardinageEmployeesValid] Exception deactivating employee:', e);
    }
  };

  return (
    <main className="admin-page jardinage-employees-page">
      <div className="jardinage-employees-header">
        <h1>Employés Jardinage Validés</h1>
        <div className="jardinage-employees-actions">
          <button className="jardinage-employees-refresh-btn" onClick={load}>🔄 Rafraîchir</button>
        </div>
      </div>

      {error && <div className="jardinage-employees-alert error">{error}</div>}
      {loading ? (
        <div className="jardinage-employees-loading">Chargement…</div>
      ) : (
        <div className="jardinage-employees-table-wrapper">
          <table className="jardinage-employees-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Expertise</th>
                <th>Ville</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td>#{it.id}</td>
                  <td>{`${it.first_name || ''} ${it.last_name || ''}`.trim() || '-'}</td>
                  <td>{it.email || '-'}</td>
                  <td>{it.phone || '-'}</td>
                  <td>{it.expertise || '-'}</td>
                  <td>{it.location || '-'}</td>
                  <td>
                    <button className="jardinage-employees-delete-btn" onClick={()=>remove(it.id)}>🗑️ Supprimer</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} className="jardinage-employees-empty">Aucun élément</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}



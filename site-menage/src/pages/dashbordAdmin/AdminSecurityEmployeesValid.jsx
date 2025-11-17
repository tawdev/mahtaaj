import React, { useEffect, useState } from 'react';
import './AdminSecurityEmployees.css';
import { supabase } from '../../lib/supabase';

export default function AdminSecurityEmployeesValid({ token, onAuthError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[AdminSecurityEmployeesValid] Loading validated security employees from Supabase...');
      
      // Load all employees first, then filter in JavaScript
      // This is more reliable than using .eq() which might not work with NULL values
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('[AdminSecurityEmployeesValid] Error loading employees:', error);
        setError(`Erreur lors du chargement: ${error.message}`);
        return;
      }
      
      console.log('[AdminSecurityEmployeesValid] Total employees loaded:', data?.length || 0);
      
      // Filter validated employees: status = 'active' AND is_active = true
      const validatedData = Array.isArray(data) ? data.filter(emp => {
        const isStatusActive = emp.status === 'active';
        const isActive = emp.is_active === true;
        const isValidated = isStatusActive && isActive;
        
        if (isValidated) {
          console.log('[AdminSecurityEmployeesValid] Found validated employee:', {
            id: emp.id,
            name: emp.full_name,
            status: emp.status,
            is_active: emp.is_active
          });
        }
        
        return isValidated;
      }) : [];
      
      console.log('[AdminSecurityEmployeesValid] Validated employees:', validatedData?.length || 0);
      
      // Transform data to match expected format
      const transformedData = Array.isArray(validatedData) ? validatedData.map(emp => {
        const metadata = emp.metadata || {};
        return {
          id: emp.id,
          first_name: metadata.first_name || emp.full_name?.split(' ')[0] || '',
          last_name: metadata.last_name || emp.full_name?.split(' ').slice(1).join(' ') || '',
          email: emp.email || '',
          phone: emp.phone || '',
          location: metadata.location || emp.address || '',
          expertise: metadata.expertise || '-',
          is_active: emp.is_active === true,
          validated_at: emp.updated_at || emp.created_at, // Use updated_at as validation date
          ...emp
        };
      }) : [];
      
      setItems(transformedData);
    } catch (e) {
      console.error('[AdminSecurityEmployeesValid] Exception loading employees:', e);
      setError(e.message || 'Impossible de charger les employés validés');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm('Supprimer cette validation ? (L\'employé sera désactivé)')) return;
    
    try {
      console.log('[AdminSecurityEmployeesValid] Deactivating employee:', id);
      
      // Instead of deleting, we'll deactivate the employee
      const { error } = await supabase
        .from('employees')
        .update({ 
          status: 'inactive',
          is_active: false
        })
        .eq('id', id);
      
      if (error) {
        console.error('[AdminSecurityEmployeesValid] Error deactivating employee:', error);
        setError(`Erreur lors de la désactivation: ${error.message}`);
        return;
      }
      
      console.log('[AdminSecurityEmployeesValid] Employee deactivated successfully');
      // Remove from list (as it's no longer validated)
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error('[AdminSecurityEmployeesValid] Exception during deactivation:', e);
      setError(`Erreur: ${e.message}`);
    }
  };

  return (
    <main className="admin-page security-employees-page">
      <div className="security-employees-header">
        <h1>Employés Sécurité Validés</h1>
        <div className="security-employees-actions">
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
                <th>Expertise</th>
                <th>Actif</th>
                <th>Validé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(row => (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  <td>{`${row.first_name || ''} ${row.last_name || ''}`.trim() || '-'}</td>
                  <td>
                    <a href={`mailto:${row.email}`} className="security-employees-email">{row.email || '-'}</a>
                  </td>
                  <td>{row.phone || '-'}</td>
                  <td>{row.location || '-'}</td>
                  <td>{row.expertise || '-'}</td>
                  <td>{row.is_active ? '✓' : '✗'}</td>
                  <td>{row.validated_at ? new Date(row.validated_at).toLocaleString() : '-'}</td>
                  <td>
                    <button className="security-employees-delete-btn" onClick={()=>remove(row.id)}>🗑️ Supprimer</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="security-employees-empty">Aucun enregistrement</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}



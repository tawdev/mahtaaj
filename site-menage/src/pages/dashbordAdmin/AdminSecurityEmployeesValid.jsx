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
      
      console.log('[AdminSecurityEmployeesValid] Loading validated security employees from security_employees_valid table...');
      
      // Load validated employees from security_employees_valid table
      const { data, error } = await supabase
        .from('security_employees_valid')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[AdminSecurityEmployeesValid] Error loading employees:', error);
        setError(`Erreur lors du chargement: ${error.message}`);
        return;
      }
      
      console.log('[AdminSecurityEmployeesValid] Loaded validated employees:', data?.length || 0);
      
      // Transform data to match expected format
      const transformedData = Array.isArray(data) ? data.map(emp => ({
        id: emp.id,
        employee_id: emp.employee_id,
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        email: emp.email || '',
        phone: emp.phone || '',
        address: emp.address || '',
        city: emp.city || '',
        quartier: emp.quartier || '',
        location: emp.location || '',
        birth_date: emp.birth_date || '',
        age: emp.age || null,
        expertise: emp.expertise || '-',
        auto_entrepreneur: emp.auto_entrepreneur || '',
        last_experience: emp.last_experience || '',
        company_name: emp.company_name || '',
        preferred_work_time: emp.preferred_work_time || '',
        photo: emp.photo || emp.photo_url || '',
        availability: emp.availability || {},
        is_active: emp.is_active === true,
        validated_at: emp.created_at, // Use created_at as validation date
        ...emp
      })) : [];
      
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
      console.log('[AdminSecurityEmployeesValid] Removing validated employee:', id);
      
      // Get employee_id to update the original record
      const { data: validEmployee, error: fetchError } = await supabase
        .from('security_employees_valid')
        .select('employee_id')
        .eq('id', id)
        .single();
      
      if (fetchError || !validEmployee) {
        console.error('[AdminSecurityEmployeesValid] Error fetching employee:', fetchError);
        setError(`Erreur lors de la récupération: ${fetchError?.message || 'Employé non trouvé'}`);
        return;
      }
      
      // Update the original employee record to inactive
      if (validEmployee.employee_id) {
        const { error: updateError } = await supabase
          .from('security_employees')
          .update({ 
            status: 'inactive',
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', validEmployee.employee_id);
        
        if (updateError) {
          console.error('[AdminSecurityEmployeesValid] Error updating employee:', updateError);
          // Continue with deletion even if update fails
        }
      }
      
      // Delete from validated table
      const { error: deleteError } = await supabase
        .from('security_employees_valid')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('[AdminSecurityEmployeesValid] Error deleting validated employee:', deleteError);
        setError(`Erreur lors de la suppression: ${deleteError.message}`);
        return;
      }
      
      console.log('[AdminSecurityEmployeesValid] Validated employee removed successfully');
      // Remove from list
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error('[AdminSecurityEmployeesValid] Exception during removal:', e);
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



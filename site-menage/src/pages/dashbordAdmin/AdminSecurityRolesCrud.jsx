import React, { useEffect, useState } from 'react';
import './AdminCrud.css';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';

export default function AdminSecurityRolesCrud({ token, onAuthError }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', name_ar: '', name_fr: '', name_en: '', description: '', description_ar: '', description_fr: '', description_en: '', is_active: true });

  const load = async () => {
    try {
      setLoading(true); 
      setError('');
      
      console.log('[AdminSecurityRoles] Loading security roles from Supabase...');
      
      const { data, error } = await supabase
        .from('security_roles')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) {
        console.error('[AdminSecurityRoles] Error loading roles:', error);
        setError(`Erreur lors du chargement: ${error.message}`);
        return;
      }
      
      console.log('[AdminSecurityRoles] Loaded roles:', data?.length || 0);
      setRoles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[AdminSecurityRoles] Exception loading roles:', e);
      setError(`Erreur: ${e.message || 'Impossible de charger les rôles'}`);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', name_ar: '', name_fr: '', name_en: '', description: '', description_ar: '', description_fr: '', description_en: '', is_active: true });
    setShowForm(true);
  };

  const openEdit = (role) => {
    setEditing(role);
    setForm({
      name: role.name || '',
      name_ar: role.name_ar || '',
      name_fr: role.name_fr || '',
      name_en: role.name_en || '',
      description: role.description || '',
      description_ar: role.description_ar || '',
      description_fr: role.description_fr || '',
      description_en: role.description_en || '',
      is_active: !!role.is_active
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      console.log('[AdminSecurityRoles] Saving role:', { editing: !!editing, form });
      
      const roleData = {
        name: form.name || null,
        name_ar: form.name_ar || null,
        name_fr: form.name_fr || null,
        name_en: form.name_en || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        description_fr: form.description_fr || null,
        description_en: form.description_en || null,
        is_active: form.is_active,
        order: editing?.order || 0
      };
      
      let result;
      if (editing) {
        // Update existing
        const { data, error } = await supabase
          .from('security_roles')
          .update(roleData)
          .eq('id', editing.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('security_roles')
          .insert(roleData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      console.log('[AdminSecurityRoles] Save successful:', result);
      
      await load();
      setShowForm(false);
      setEditing(null);
    } catch (e2) {
      console.error('[AdminSecurityRoles] Error saving role:', e2);
      setError(e2.message || 'Erreur lors de la sauvegarde');
    }
  };

  const removeItem = async (role) => {
    if (!window.confirm('Supprimer ce rôle ?')) return;
    
    try {
      console.log('[AdminSecurityRoles] Deleting role:', role.id);
      
      const { error } = await supabase
        .from('security_roles')
        .delete()
        .eq('id', role.id);
      
      if (error) {
        console.error('[AdminSecurityRoles] Delete error:', error);
        setError(`Erreur lors de la suppression: ${error.message}`);
        return;
      }
      
      console.log('[AdminSecurityRoles] Delete successful');
      await load();
    } catch (e) {
      console.error('[AdminSecurityRoles] Exception during delete:', e);
      setError(`Erreur: ${e.message}`);
    }
  };

  return (
    <section className="admin-card">
      <div className="admin-toolbar">
        <h2>Rôles Sécurité</h2>
        <div style={{display:'flex',gap:8}}>
          <button className="admin-crud-add-button" onClick={load} disabled={loading}>{loading? 'Chargement…' : 'Actualiser'}</button>
          <button className="admin-crud-add-button" onClick={openCreate}>+ Nouveau</button>
        </div>
      </div>

      {error && (<div className="admin-crud-error">{error}</div>)}

      <div style={{overflow:'auto'}}>
        <table className="admin-table">
          <thead className="admin-thead">
            <tr>
              <th className="admin-th">#</th>
              <th className="admin-th">Nom</th>
              <th className="admin-th">Description</th>
              <th className="admin-th">Actif</th>
              <th className="admin-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.id}>
                <td className="admin-td">{r.id}</td>
                <td className="admin-td">{r.name || r.name_fr || r.name_ar || r.name_en || '-'}</td>
                <td className="admin-td">{r.description || r.description_fr || r.description_ar || r.description_en || '-'}</td>
                <td className="admin-td">{r.is_active ? 'Actif' : 'Inactif'}</td>
                <td className="admin-td">
                  <div style={{display:'flex',gap:8}}>
                    <button className="security-edit-btn" onClick={() => openEdit(r)}>Éditer</button>
                    <button className="security-delete-btn" onClick={() => removeItem(r)}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="security-form-overlay">
          <div className="security-form">
            <div className="security-form-header">
              <h3>{editing? `Modifier le rôle: ${editing.name}` : 'Nouveau rôle'}</h3>
              <button className="security-modal-close" onClick={()=>{setShowForm(false); setEditing(null);}}>×</button>
            </div>
            <form onSubmit={save} className="security-form-grid">
              <div className="security-form-group">
                <label>Nom</label>
                <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required/>
              </div>

              <div className="security-form-group" style={{gridColumn:'1 / -1'}}>
                <LanguageFields
                  value={{
                    name_ar: form.name_ar,
                    name_fr: form.name_fr,
                    name_en: form.name_en,
                    description_ar: form.description_ar,
                    description_fr: form.description_fr,
                    description_en: form.description_en,
                  }}
                  onChange={(v)=>setForm({...form, ...v})}
                  includeDescription={true}
                  required={false}
                />
              </div>

              <div className="security-form-group" style={{gridColumn:'1 / -1'}}>
                <label>Description</label>
                <textarea value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})}/>
              </div>
              <div className="security-form-group">
                <label>Statut</label>
                <select value={form.is_active? '1':'0'} onChange={(e)=>setForm({...form, is_active:e.target.value==='1'})}>
                  <option value="1">Actif</option>
                  <option value="0">Inactif</option>
                </select>
              </div>
              <div className="security-form-actions">
                <button type="button" className="security-cancel-btn" onClick={()=>{setShowForm(false); setEditing(null);}}>Annuler</button>
                <button type="submit" className="security-save-btn">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

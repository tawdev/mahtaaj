import React, { useEffect, useState } from 'react';
import './AdminCrud.css';
import './AdminSecurityCrud.css';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';

export default function AdminSecurityCrud({ token, onAuthError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', name_ar:'', name_fr:'', name_en:'', role_id:'', experience_years:0, description:'', description_ar:'', description_fr:'', description_en:'', is_active:true, photo:null });
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true); 
      setError('');
      
      console.log('[AdminSecurityCrud] Loading securities from Supabase...');
      
      // Load securities from Supabase
      // Note: If role_id column exists, we can join with security_roles
      // Otherwise, we'll load roles separately and match them
      const { data, error } = await supabase
        .from('securities')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[AdminSecurityCrud] Error loading securities:', error);
        setError(`Erreur lors du chargement: ${error.message}`);
        return;
      }
      
      console.log('[AdminSecurityCrud] Loaded securities:', data?.length || 0);
      
      // Map roles to securities if role_id exists
      // Note: roles might not be loaded yet, so we'll map them in a separate effect
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[AdminSecurityCrud] Exception loading securities:', e);
      setError(`Erreur: ${e.message || 'Impossible de charger les agents de sécurité'}`);
    } finally { 
      setLoading(false); 
    }
  };

  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      console.log('[AdminSecurityCrud] Loading security roles from Supabase...');
      
      const { data, error } = await supabase
        .from('security_roles')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) {
        console.error('[AdminSecurityCrud] Error loading roles:', error);
        setRoles([]);
        return;
      }
      
      console.log('[AdminSecurityCrud] Loaded roles:', data?.length || 0);
      setRoles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[AdminSecurityCrud] Exception loading roles:', e);
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => { 
    // Load roles and securities
    loadRoles();
    load();
  }, [token]); // Recharger si le token change

  const openCreate = () => { setEditing(null); setForm({ name:'', name_ar:'', name_fr:'', name_en:'', role_id:'', experience_years:0, description:'', description_ar:'', description_fr:'', description_en:'', is_active:true, photo:null }); setShowForm(true); };
  const openEdit = (item) => { 
    console.log('[AdminSecurityCrud] Édition de l\'item:', item);
    setEditing(item); 
    setForm({ 
      name: item.name || item.full_name || '', 
      name_ar: item.name_ar || '',
      name_fr: item.name_fr || '',
      name_en: item.name_en || '',
      role_id: item.role_id || (item.role?.id ? item.role.id : ''), 
      experience_years: item.experience_years || 0, 
      description: item.description || '', 
      description_ar: item.description_ar || '',
      description_fr: item.description_fr || '',
      description_en: item.description_en || '',
      is_active: !!item.is_active, 
      photo: null 
    }); 
    console.log('[AdminSecurityCrud] Formulaire pré-rempli:', { 
      name: item.name || item.full_name || '', 
      role_id: item.role_id || (item.role?.id ? item.role.id : ''), 
      experience_years: item.experience_years || 0, 
      description: item.description || '', 
      is_active: !!item.is_active 
    });
    setShowForm(true); 
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `security_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;
      
      console.log('[AdminSecurityCrud] Uploading image to Supabase Storage:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('employees')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('[AdminSecurityCrud] Upload error:', uploadError);
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error('Bucket "employees" غير موجود. يرجى إنشاء bucket "employees" في Supabase Storage أولاً.');
        }
        throw new Error(uploadError.message || 'Erreur lors du téléchargement de l\'image');
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('employees')
        .getPublicUrl(filePath);
      
      console.log('[AdminSecurityCrud] Image uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('[AdminSecurityCrud] Error uploading image:', err);
      throw err;
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      // Upload image if provided
      let photoUrl = editing?.photo || editing?.photo_url || '';
      if (form.photo instanceof File) {
        console.log('[AdminSecurityCrud] Uploading new photo...');
        photoUrl = await uploadImage(form.photo);
      }
      
      // Prepare data for Supabase
      const securityData = {
        full_name: form.name,
        name: form.name, // Keep both for compatibility
        name_ar: form.name_ar || null,
        name_fr: form.name_fr || null,
        name_en: form.name_en || null,
        role_id: form.role_id || null,
        experience_years: form.experience_years || 0,
        description: form.description || null,
        description_ar: form.description_ar || null,
        description_fr: form.description_fr || null,
        description_en: form.description_en || null,
        is_active: form.is_active,
        photo: photoUrl || null,
        photo_url: photoUrl || null
      };
      
      console.log('[AdminSecurityCrud] Saving security agent:', { editing: !!editing, data: securityData });
      
      let result;
      if (editing) {
        // Update existing
        const { data, error } = await supabase
          .from('securities')
          .update(securityData)
          .eq('id', editing.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('securities')
          .insert(securityData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      console.log('[AdminSecurityCrud] Save successful:', result);
      
      setShowForm(false); 
      setEditing(null); 
      setForm({ name:'', name_ar:'', name_fr:'', name_en:'', role_id:'', experience_years:0, description:'', description_ar:'', description_fr:'', description_en:'', is_active:true, photo:null });
      await load();
    } catch (e2) { 
      console.error('[AdminSecurityCrud] Erreur de sauvegarde:', e2);
      setError(e2.message || 'Erreur lors de la sauvegarde'); 
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm('Supprimer cet agent ?')) return;
    
    try {
      console.log('[AdminSecurityCrud] Deleting security agent:', item.id);
      
      const { error } = await supabase
        .from('securities')
        .delete()
        .eq('id', item.id);
      
      if (error) {
        console.error('[AdminSecurityCrud] Delete error:', error);
        setError(`Erreur lors de la suppression: ${error.message}`);
        return;
      }
      
      console.log('[AdminSecurityCrud] Delete successful');
      await load();
    } catch (e) {
      console.error('[AdminSecurityCrud] Exception during delete:', e);
      setError(`Erreur: ${e.message}`);
    }
  };

  return (
    <section className="admin-card">
      <div className="admin-toolbar">
        <h2>Sécurité</h2>
        <div style={{display:'flex',gap:8}}>
          <button className="admin-crud-add-button" onClick={load} disabled={loading}>{loading? 'Chargement…' : 'Actualiser'}</button>
          <button className="admin-crud-add-button" onClick={openCreate}>+ Nouveau</button>
        </div>
      </div>

      {error && (
        <div className="admin-crud-error" style={{
          padding: '16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          marginBottom: '16px',
          color: '#dc2626'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ display: 'block', marginBottom: '8px', fontSize: '16px' }}>
              ⚠️ Erreur de connexion
            </strong>
            <div style={{ 
              whiteSpace: 'pre-line', 
              lineHeight: '1.6',
              fontSize: '14px',
              color: '#991b1b'
            }}>
              {error}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={load} 
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Chargement...' : '🔄 Réessayer'}
            </button>
            <button 
              onClick={() => {
                console.log('[AdminSecurityCrud] Supabase connection test');
                console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
                console.log('Table: securities');
              }}
              style={{
                padding: '8px 16px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🔍 Voir les détails
            </button>
          </div>
        </div>
      )}
      
      {loading && items.length === 0 && (
        <div style={{padding: '20px', textAlign: 'center', color: '#64748b'}}>
          Chargement en cours...
        </div>
      )}
      
      {!loading && items.length === 0 && !error && (
        <div style={{padding: '20px', textAlign: 'center', color: '#64748b'}}>
          Aucun agent de sécurité trouvé. Cliquez sur "+ Nouveau" pour en ajouter un.
        </div>
      )}

      {items.length > 0 && (
        <div style={{overflow:'auto'}}>
          <table className="security-admin-table">
            <thead className="admin-thead">
              <tr>
                <th className="admin-th">#</th>
                <th className="admin-th">Photo</th>
                <th className="admin-th">Nom</th>
                <th className="admin-th">Rôle</th>
                <th className="admin-th">Expérience</th>
                <th className="admin-th">Actif</th>
                <th className="admin-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td className="admin-td">{it.id}</td>
                  <td className="admin-td">
                    {it.photo || it.photo_url ? (
                      <img 
                        src={it.photo_url || it.photo} 
                        alt={it.name || it.full_name} 
                        className="security-agent-photo" 
                        width={40} 
                        height={40}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="security-agent-photo placeholder" style={{display: it.photo || it.photo_url ? 'none' : 'flex'}}>👤</div>
                  </td>
                  <td className="admin-td">{it.name || it.full_name}</td>
                  <td className="admin-td">
                    {it.role_id ? (
                      (() => {
                        const role = roles.find(r => r.id === it.role_id);
                        return role ? (role.name || role.name_fr || role.name_ar || '-') : '-';
                      })()
                    ) : '-'}
                  </td>
                  <td className="admin-td"><span className="security-experience">{it.experience_years||0} ans</span></td>
                  <td className="admin-td"><span className={`security-status-badge ${it.is_active ? 'active' : 'inactive'}`}>{it.is_active? 'Actif':'Inactif'}</span></td>
                  <td className="admin-td">
                    <div className="security-actions">
                      <button className="security-edit-btn" onClick={()=>openEdit(it)}>Éditer</button>
                      <button className="security-delete-btn" onClick={()=>removeItem(it)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="security-form-overlay">
          <div className="security-form">
            <div className="security-form-header">
              <h3>{editing? `Modifier l'agent: ${editing.name}` : 'Nouvel agent'}</h3>
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
              <div className="security-form-group">
                <label>Rôle</label>
                <select 
                  value={form.role_id} 
                  onChange={(e)=>setForm({...form, role_id:e.target.value})}
                  disabled={rolesLoading}
                >
                  <option value="">
                    {rolesLoading ? 'Chargement des rôles...' : 'Sélectionner un rôle'}
                  </option>
                  {roles && roles.length > 0 ? (
                    roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))
                  ) : !rolesLoading && (
                    <option disabled>Aucun rôle disponible</option>
                  )}
                </select>
                {roles && roles.length > 0 && (
                  <small style={{color: '#6b7280', fontSize: '12px'}}>
                    {roles.length} rôle(s) disponible(s)
                  </small>
                )}
                {rolesLoading && (
                  <small style={{color: '#3b82f6', fontSize: '12px'}}>
                    Chargement en cours...
                  </small>
                )}
              </div>
              <div className="security-form-group">
                <label>Années d'expérience</label>
                <input type="number" min="0" max="80" value={form.experience_years} onChange={(e)=>setForm({...form, experience_years:Number(e.target.value)})}/>
              </div>
              <div className="security-form-group">
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
              <div className="security-form-group">
                <label>Photo</label>
                <input type="file" accept="image/*" onChange={(e)=>setForm({...form, photo:e.target.files?.[0]||null})}/>
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



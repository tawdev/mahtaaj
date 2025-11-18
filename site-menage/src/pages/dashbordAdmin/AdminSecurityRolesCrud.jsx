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
  const [form, setForm] = useState({ name: '', name_ar: '', name_fr: '', name_en: '', description: '', description_ar: '', description_fr: '', description_en: '', is_active: true, image: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  // Upload image to Supabase Storage
  const uploadImage = async (file) => {
    try {
      setUploadingImage(true);
      
      const cleanFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
      const fileName = `security_role_${Date.now()}_${cleanFileName}`;
      const filePath = fileName;

      console.log('[AdminSecurityRoles] Uploading image:', fileName, 'to bucket: employees');

      const { data, error } = await supabase.storage
        .from('employees')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('[AdminSecurityRoles] Upload error:', error);
        if (error.message?.includes('Bucket not found')) {
          throw new Error('Bucket "employees" غير موجود. يرجى إنشاء bucket "employees" في Supabase Storage أولاً.');
        }
        throw error;
      }

      console.log('[AdminSecurityRoles] Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('employees')
        .getPublicUrl(filePath);

      console.log('[AdminSecurityRoles] Image uploaded successfully, public URL:', publicUrl);

      if (publicUrl) {
        setForm(prev => ({ ...prev, image: publicUrl }));
        setImageFile(null);
        return publicUrl;
      }
      
      throw new Error('Aucune URL d\'image retournée');
    } catch (err) {
      console.error('[AdminSecurityRoles] Erreur lors du téléchargement de l\'image:', err);
      setError('Erreur lors du téléchargement de l\'image: ' + err.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image file selection
  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('La taille du fichier ne doit pas dépasser 5MB');
      return;
    }

    setImageFile(file);
    setError('');

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload image immediately
    await uploadImage(file);
  };

  // Remove image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm(prev => ({
      ...prev,
      image: ''
    }));
    // Reset file input
    const fileInput = document.getElementById('security_role_image_upload');
    if (fileInput) fileInput.value = '';
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', name_ar: '', name_fr: '', name_en: '', description: '', description_ar: '', description_fr: '', description_en: '', is_active: true, image: '' });
    setImageFile(null);
    setImagePreview(null);
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
      is_active: !!role.is_active,
      image: role.image || ''
    });
    setImageFile(null);
    setImagePreview(role.image ? role.image : null);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      // If a new file is selected but hasn't been uploaded yet, upload it first
      let imageUrl = form.image;
      if (imageFile && !uploadingImage) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          return; // Stop save if upload failed
        }
      }
      
      console.log('[AdminSecurityRoles] Saving role:', { editing: !!editing, form, imageUrl });
      
      // Build roleData with all fields including image
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
      
      // Always include image field - use the uploaded URL or existing form image
      // Make sure we don't use null if we have a valid URL
      if (imageUrl && imageUrl.trim() !== '') {
        roleData.image = imageUrl.trim();
      } else if (form.image && form.image.trim() !== '') {
        roleData.image = form.image.trim();
      } else {
        roleData.image = null;
      }
      
      console.log('[AdminSecurityRoles] Role data to save:', roleData);
      console.log('[AdminSecurityRoles] Image value in roleData:', roleData.image);
      console.log('[AdminSecurityRoles] imageUrl value:', imageUrl);
      console.log('[AdminSecurityRoles] form.image value:', form.image);
      
      // Update or insert without select first (to avoid empty array issues)
      if (editing) {
        // Update existing
        console.log('[AdminSecurityRoles] Updating role ID:', editing.id);
        console.log('[AdminSecurityRoles] Full roleData being sent:', JSON.stringify(roleData, null, 2));
        
        // Try updating with explicit image field
        const updatePayload = { ...roleData };
        // Ensure image is explicitly set (not undefined)
        if (updatePayload.image === undefined) {
          updatePayload.image = roleData.image;
        }
        
        const { error: updateError } = await supabase
          .from('security_roles')
          .update(updatePayload)
          .eq('id', editing.id);
        
        if (updateError) {
          console.error('[AdminSecurityRoles] Update error:', updateError);
          console.error('[AdminSecurityRoles] Update error details:', JSON.stringify(updateError, null, 2));
          throw updateError;
        }
        
        console.log('[AdminSecurityRoles] Update successful');
        
        // Verify the update by fetching the updated record
        const { data: verifyData, error: verifyError } = await supabase
          .from('security_roles')
          .select('*')
          .eq('id', editing.id)
          .single();
        
        if (verifyError) {
          console.warn('[AdminSecurityRoles] Could not verify update, but update succeeded:', verifyError);
        } else {
          console.log('[AdminSecurityRoles] Verified update, role data:', verifyData);
          console.log('[AdminSecurityRoles] All columns in verifyData:', Object.keys(verifyData || {}));
          console.log('[AdminSecurityRoles] Image URL we tried to save:', roleData.image);
          
          // Check if image column exists and was saved
          if (verifyData && typeof verifyData === 'object') {
            if ('image' in verifyData) {
              console.log('[AdminSecurityRoles] ✅ Image column exists, saved value:', verifyData.image);
              if (!verifyData.image && roleData.image) {
                console.warn('[AdminSecurityRoles] ⚠️ Image was sent but not saved! Column might not exist or RLS policy issue.');
                setError('⚠️ L\'image n\'a pas été sauvegardée. Vérifiez que la colonne "image" existe dans la table security_roles. Exécutez le script SQL add-image-to-security-roles.sql dans Supabase.');
              } else if (verifyData.image) {
                console.log('[AdminSecurityRoles] ✅ Image successfully saved:', verifyData.image);
              }
            } else {
              console.error('[AdminSecurityRoles] ❌ Image column does NOT exist in the table!');
              console.error('[AdminSecurityRoles] Available columns:', Object.keys(verifyData));
              setError('❌ La colonne "image" n\'existe pas dans la table security_roles. Veuillez exécuter le script SQL add-image-to-security-roles.sql dans Supabase SQL Editor.');
            }
          }
        }
      } else {
        // Insert new
        console.log('[AdminSecurityRoles] Inserting new role');
        const { data: insertData, error: insertError } = await supabase
          .from('security_roles')
          .insert(roleData)
          .select();
        
        if (insertError) {
          console.error('[AdminSecurityRoles] Insert error:', insertError);
          // If select fails, try without select
          if (insertError.code === 'PGRST116' || insertError.message?.includes('406') || insertError.message?.includes('Not Acceptable') || insertError.message?.includes('column')) {
            console.warn('[AdminSecurityRoles] Insert with select failed, trying without select');
            const { error: insertError2 } = await supabase
              .from('security_roles')
              .insert(roleData);
            
            if (insertError2) {
              console.error('[AdminSecurityRoles] Insert without select also failed:', insertError2);
              throw insertError2;
            }
            console.log('[AdminSecurityRoles] Insert successful (without select)');
          } else {
            throw insertError;
          }
        } else {
          console.log('[AdminSecurityRoles] Insert successful, data:', insertData);
        }
      }
      
      console.log('[AdminSecurityRoles] Save operation completed successfully');
      
      await load();
      setShowForm(false);
      setEditing(null);
      setImageFile(null);
      setImagePreview(null);
    } catch (e2) {
      console.error('[AdminSecurityRoles] Error saving role:', e2);
      const errorMessage = e2.message || e2.code || String(e2) || 'Erreur lors de la sauvegarde';
      
      // Check if it's a column error (image column might not exist)
      if (errorMessage.includes('column') && (errorMessage.includes('image') || errorMessage.includes('does not exist'))) {
        setError('❌ La colonne "image" n\'existe pas dans la table security_roles. Veuillez exécuter le script SQL add-image-to-security-roles.sql dans Supabase SQL Editor.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('RLS') || errorMessage.includes('row-level security')) {
        setError('❌ Erreur de permissions. Vérifiez les politiques RLS (Row Level Security) dans Supabase.');
      } else {
        setError(`❌ Erreur lors de la sauvegarde: ${errorMessage}`);
      }
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
              <th className="admin-th">Image</th>
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
                <td className="admin-td">
                  {r.image ? (
                    <img 
                      src={r.image} 
                      alt={r.name || 'Role image'} 
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span style={{ color: '#999' }}>-</span>
                  )}
                </td>
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
              <button className="security-modal-close" onClick={()=>{
                setShowForm(false); 
                setEditing(null);
                setImageFile(null);
                setImagePreview(null);
              }}>×</button>
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

              <div className="security-form-group" style={{gridColumn:'1 / -1'}}>
                <label>Image</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e)=>setForm({...form, image:e.target.value})}
                    placeholder="URL de l'image ou téléchargez un fichier"
                    style={{ flex: 1, minWidth: '200px', padding: '8px' }}
                  />
                  <input
                    type="file"
                    id="security_role_image_upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="security_role_image_upload"
                    style={{
                      padding: '8px 16px',
                      background: uploadingImage ? '#94a3b8' : '#2563eb',
                      color: '#fff',
                      borderRadius: '8px',
                      cursor: uploadingImage ? 'not-allowed' : 'pointer',
                      display: 'inline-block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {uploadingImage ? '⏳ Téléchargement...' : '📁 Télécharger une image'}
                  </label>
                  {(imagePreview || form.image) && (
                    <button
                      type="button"
                      onClick={removeImage}
                      style={{
                        padding: '8px 16px',
                        background: '#ef4444',
                        color: '#fff',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      🗑️ Supprimer
                    </button>
                  )}
                </div>
                <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.875rem' }}>
                  Entrez une URL complète ou téléchargez une image (Max 5MB)
                </small>
                {(imagePreview || form.image) && (
                  <div style={{ marginTop: '10px' }}>
                    <img 
                      src={imagePreview || form.image} 
                      alt="Preview" 
                      style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd' }}
                      onError={(e) => {
                        console.error('[AdminSecurityRoles] Preview image load error:', imagePreview || form.image);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="security-form-group">
                <label>Statut</label>
                <select value={form.is_active? '1':'0'} onChange={(e)=>setForm({...form, is_active:e.target.value==='1'})}>
                  <option value="1">Actif</option>
                  <option value="0">Inactif</option>
                </select>
              </div>
              <div className="security-form-actions">
                <button type="button" className="security-cancel-btn" onClick={()=>{
                  setShowForm(false); 
                  setEditing(null);
                  setImageFile(null);
                  setImagePreview(null);
                }}>Annuler</button>
                <button type="submit" className="security-save-btn">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

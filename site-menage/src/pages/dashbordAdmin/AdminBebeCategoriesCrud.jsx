import React, { useState, useEffect } from 'react';
import './AdminBebeCategoriesCrud.css';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

const AdminBebeCategoriesCrud = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    name_fr: '',
    name_en: '',
    description: '',
    description_ar: '',
    description_fr: '',
    description_en: '',
    image: '',
    is_active: true,
    order: 0
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState({ type: '', message: '' });

  useEffect(() => {
    loadCategories();
  }, []);

  // Helper function to get image URL from Supabase Storage
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a Supabase URL, return it
    if (imagePath.includes('supabase.co/storage')) {
      return imagePath;
    }
    
    // If it's an old Laravel path, extract filename and try to get from Supabase
    if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000') || imagePath.startsWith('/storage/') || imagePath.startsWith('/images/')) {
      const filename = imagePath.split('/').pop();
      if (filename) {
        const { data: { publicUrl } } = supabase.storage
          .from('employees')
          .getPublicUrl(filename);
        return publicUrl;
      }
      return null;
    }
    
    // If it's just a filename, try to get from Supabase Storage
    if (!imagePath.includes('/') && !imagePath.includes('http')) {
      const { data: { publicUrl } } = supabase.storage
        .from('employees')
        .getPublicUrl(imagePath);
      return publicUrl;
    }
    
    // Return as-is if it's a valid URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    return null;
  };

  // Update image preview when formData.image changes
  useEffect(() => {
    if (formData.image && formData.image.startsWith('data:')) {
      setImagePreview(formData.image);
    } else if (formData.image && formData.image.startsWith('http')) {
      setImagePreview(formData.image);
    } else if (formData.image) {
      const url = getImageUrl(formData.image);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  }, [formData.image]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[AdminBebeCategories] Loading categories from Supabase');
      
      const { data, error } = await supabase
        .from('bebe_categories')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        console.error('[AdminBebeCategories] Error loading categories:', error);
        setError('Erreur lors du chargement des catégories: ' + error.message);
        return;
      }

      console.log('[AdminBebeCategories] Loaded categories:', data?.length || 0);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[AdminBebeCategories] Exception loading categories:', err);
      setError('Erreur de connexion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner un fichier image valide');
        return;
      }
      
      // Check file size (3MB)
      if (file.size > 3 * 1024 * 1024) {
        setError('La taille du fichier ne doit pas dépasser 3MB');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
  };

  const getWriteClient = () => {
    if (supabaseAdmin) {
      return supabaseAdmin;
    }
    console.warn('[AdminBebeCategories] Using public client - RLS may block writes. Set REACT_APP_SUPABASE_SERVICE_ROLE_KEY in .env');
    return supabase;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(''); setToast({ type:'', message:'' });
      // basic required validation
      const hasAnyName = (formData.name || formData.name_fr || formData.name_ar || formData.name_en);
      if (!hasAnyName) {
        setError('Veuillez renseigner au moins un nom (FR/AR/EN).');
        return;
      }
      // Avoid submitting when no changes while editing
      if (editingCategory) {
        const fields = ['name','name_ar','name_fr','name_en','description','description_ar','description_fr','description_en','image','is_active','order'];
        const before = JSON.stringify(fields.reduce((o,k)=>({ ...o, [k]: editingCategory[k] ?? (k.startsWith('description')? '' : (k==='order'?0: (k==='is_active'?false:''))) }),{}));
        const after = JSON.stringify(fields.reduce((o,k)=>({ ...o, [k]: formData[k] }),{}));
        if (before === after) {
          setToast({ type:'info', message:'لم يتم حفظ التعديلات' });
          return;
        }
      }

      // Handle image upload to Supabase Storage if imageFile exists
      let imageUrl = formData.image || '';
      
      if (imageFile) {
        console.log('[AdminBebeCategories] Uploading image to Supabase Storage');
        // Clean filename: remove special characters and spaces
        const cleanFileName = imageFile.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_')
          .toLowerCase();
        const fileName = `bebe_category_${Date.now()}_${cleanFileName}`;
        const filePath = fileName;
        
        // Upload to Supabase Storage (employees bucket)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employees')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('[AdminBebeCategories] Error uploading image:', uploadError);
          // If upload fails, try to use base64 if available
          if (formData.image && formData.image.startsWith('data:')) {
            imageUrl = formData.image;
            console.log('[AdminBebeCategories] Using base64 image as fallback');
          } else {
            setError('Erreur lors du téléchargement de l\'image: ' + uploadError.message);
            return;
          }
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('employees')
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
          console.log('[AdminBebeCategories] Image uploaded successfully:', imageUrl);
        }
      }

      // Build payload
      const sanitize = (data) => {
        const fields = ['name','name_ar','name_fr','name_en','description','description_ar','description_fr','description_en','image','is_active','order'];
        const out = {};
        fields.forEach((k) => {
          let v = data[k];
          if (v === undefined || v === null) v = '';
          out[k] = v;
        });
        out.is_active = !!out.is_active;
        out.order = Number.isFinite(Number(out.order)) ? Number(out.order) : 0;
        out.image = imageUrl; // Use uploaded URL or existing image
        return out;
      };
      let payload = sanitize(formData);

      // Fallback base name from localized if empty
      if (!payload.name) {
        payload.name = formData.name_fr || formData.name_ar || formData.name_en || '';
      }

      console.log('[AdminBebeCategories] Submitting category:', { editing: !!editingCategory, id: editingCategory?.id, payload });

      const db = getWriteClient();
      if (!supabaseAdmin) {
        console.warn('[AdminBebeCategories] Service role key not configured, falling back to public client (writes may fail).');
      }

      let data, error;
      if (editingCategory) {
        // Update existing category
        const { data: updateData, error: updateError } = await db
          .from('bebe_categories')
          .update(payload)
          .eq('id', editingCategory.id)
          .select();
        data = updateData;
        error = updateError;
      } else {
        // Insert new category
        const { data: insertData, error: insertError } = await db
          .from('bebe_categories')
          .insert(payload)
          .select();
        data = insertData;
        error = insertError;
      }

      if (error) {
        console.error('[AdminBebeCategories] Error saving category:', error);
        setError('Erreur lors de la sauvegarde: ' + error.message);
        setToast({ type:'error', message: 'Erreur lors de la sauvegarde: ' + error.message });
        return;
      }

      console.log('[AdminBebeCategories] Category saved successfully:', data);
      await loadCategories();
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', name_ar:'', name_fr:'', name_en:'', description: '', description_ar:'', description_fr:'', description_en:'', image: '', is_active: true, order: 0 });
      setImagePreview(null);
      setImageFile(null);
      setToast({ type:'success', message: 'تم حفظ التعديلات بنجاح' });
    } catch (err) {
      console.error('Erreur lors de la modification:', err);
      setError('لم يتم حفظ التعديلات، تحقق من console لمعرفة السبب');
      setToast({ type:'error', message:'لم يتم حفظ التعديلات، تحقق من console لمعرفة السبب' });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    const imagePath = category.image || '';
    const imageUrl = imagePath ? getImageUrl(imagePath) : '';
    setFormData({
      name: category.name,
      name_ar: category.name_ar || '',
      name_fr: category.name_fr || '',
      name_en: category.name_en || '',
      description: category.description,
      description_ar: category.description_ar || '',
      description_fr: category.description_fr || '',
      description_en: category.description_en || '',
      image: imageUrl || imagePath || '',
      is_active: category.is_active,
      order: category.order || 0
    });
    setImagePreview(imageUrl || imagePath || null);
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        console.log('[AdminBebeCategories] Deleting category:', id);
        
        const db = getWriteClient();
        if (!supabaseAdmin) {
          console.warn('[AdminBebeCategories] Service role key not configured, falling back to public client (writes may fail).');
        }

        // Delete with select to verify deletion
        const { data, error } = await db
          .from('bebe_categories')
          .delete()
          .eq('id', id)
          .select();

        if (error) {
          console.error('[AdminBebeCategories] Error deleting category:', error);
          setError('Erreur lors de la suppression: ' + error.message);
          setToast({ type:'error', message: 'Erreur lors de la suppression: ' + error.message });
          return;
        }

        // Verify deletion was successful
        if (!data || data.length === 0) {
          let errorMsg = '';
          if (supabaseAdmin) {
            errorMsg = 'La catégorie n\'a pas pu être supprimée. Elle n\'existe peut-être pas.';
          } else {
            errorMsg = '❌ فشل الحذف: RLS يمنع العملية.\n\n' +
              'الحل:\n' +
              '1. افتح Supabase Dashboard\n' +
              '2. اذهب إلى Settings > API\n' +
              '3. انسخ service_role key\n' +
              '4. أضف في ملف .env:\n' +
              '   REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your_key_here\n' +
              '5. أعد تشغيل التطبيق';
          }
          console.warn('[AdminBebeCategories] No rows deleted - category may not exist or RLS blocked deletion');
          console.error('[AdminBebeCategories] Deletion failed. If using public client, RLS is blocking. Add REACT_APP_SUPABASE_SERVICE_ROLE_KEY to .env file.');
          setError(errorMsg);
          setToast({ type:'error', message: 'فشل الحذف - راجع رسالة الخطأ' });
          return;
        }

        console.log('[AdminBebeCategories] Category deleted successfully:', data);
        await loadCategories();
        setToast({ type:'success', message: 'تم حذف الفئة بنجاح' });
        setError(''); // Clear any previous errors
      } catch (err) {
        console.error('[AdminBebeCategories] Exception deleting category:', err);
        setError('Erreur de connexion: ' + err.message);
        setToast({ type:'error', message: 'Erreur de connexion: ' + err.message });
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', name_ar:'', name_fr:'', name_en:'', description: '', description_ar:'', description_fr:'', description_en:'', image: '', is_active: true, order: 0 });
    setImagePreview(null);
    setImageFile(null);
    setError('');
  };

  const filteredCategories = categories.filter(category => {
    const categoryName = category.name || '';
    const categoryDescription = category.description || '';
    const matchesSearch = categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         categoryDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && category.is_active) ||
                         (filterStatus === 'inactive' && !category.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-bebe-categories">
        <div className="loading">Chargement des catégories...</div>
      </div>
    );
  }

  return (
    <div className="admin-bebe-categories">
      <div className="admin-header">
        <h2>🍼 Gestion des Catégories Bébé Setting</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          ➕ Ajouter une catégorie
        </button>
      </div>

      {!supabaseAdmin && (
        <div className="warning-message" style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          color: '#856404',
          lineHeight: '1.6'
        }}>
          <strong>⚠️ تحذير: Service Role Key غير معرّف</strong>
          <br />
          <p style={{ margin: '10px 0' }}>
            عمليات الحذف والتعديل قد تفشل بسبب RLS (Row Level Security).
          </p>
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <strong>الحل:</strong>
            <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>افتح Supabase Dashboard</li>
              <li>اذهب إلى <code>Settings → API</code></li>
              <li>انسخ <code>service_role</code> key</li>
              <li>أنشئ ملف <code>.env</code> في مجلد <code>site-menage</code></li>
              <li>أضف السطر التالي:
                <pre style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  marginTop: '5px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
                </pre>
              </li>
              <li>أعد تشغيل التطبيق (<code>npm start</code>)</li>
            </ol>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message" style={{
          whiteSpace: 'pre-line',
          lineHeight: '1.6'
        }}>
          {error}
        </div>
      )}
      {toast.message && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">Toutes les catégories</option>
          <option value="active">Actives</option>
          <option value="inactive">Inactives</option>
        </select>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <div className="form-header">
              <h3>{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
              <button className="close-btn" onClick={handleCancel}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label htmlFor="name">Nom de la catégorie *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Soins du bébé"
                />
              </div>

              <LanguageFields
                value={{
                  name_ar: formData.name_ar,
                  name_fr: formData.name_fr,
                  name_en: formData.name_en,
                  description_ar: formData.description_ar,
                  description_fr: formData.description_fr,
                  description_en: formData.description_en,
                }}
                onChange={(v) => setFormData(prev => ({ ...prev, ...v }))}
                includeDescription={true}
                required={false}
              />

              <div className="form-group">
                <label htmlFor="image">Image de la catégorie</label>
                <div className="image-upload-container">
                  <div className="image-input-row">
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="image-input"
                    />
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="remove-image-btn"
                        title="Supprimer l'image"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="image-preview">
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="preview-img"
                        onError={(e) => {
                          console.error('[AdminBebeCategories] Preview image failed to load');
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  Catégorie active
                </label>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="categories-table-container">
        <table className="categories-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Nom</th>
              <th>Description</th>
              <th>Statut</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  Aucune catégorie trouvée
                </td>
              </tr>
            ) : (
              filteredCategories.map(category => {
                const imagePath = category.image;
                const imageUrl = imagePath ? getImageUrl(imagePath) : null;
                return (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td className="category-image-cell">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={category.name}
                          className="category-table-img"
                          onError={(e) => {
                            console.log('[AdminBebeCategories] Image failed to load:', imageUrl);
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'block';
                            }
                          }}
                        />
                      ) : null}
                      <div className="category-img-placeholder" style={{display: imageUrl ? 'none' : 'block'}}>
                        👶
                      </div>
                    </td>
                    <td className="category-name">{category.name}</td>
                    <td className="category-description">
                      {category.description || 'Aucune description'}
                    </td>
                    <td>
                      <span className={`status ${category.is_active ? 'active' : 'inactive'}`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(category.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="actions">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(category)}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(category.id)}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{categories.length}</div>
            <div className="stat-label">Total des catégories</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{categories.filter(c => c.is_active).length}</div>
            <div className="stat-label">Catégories actives</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">{categories.filter(c => !c.is_active).length}</div>
            <div className="stat-label">Catégories inactives</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBebeCategoriesCrud;

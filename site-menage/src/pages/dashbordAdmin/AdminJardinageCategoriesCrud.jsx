import React, { useState, useEffect } from 'react';
import './AdminJardinageCategoriesCrud.css';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

const AdminJardinageCategoriesCrud = () => {
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
    icon: '',
    image: '',
    is_active: true,
    order: 0
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadCategories();
  }, []);

  // Helper function to get image URL from Supabase Storage
  // Memoized to avoid recalculating on every render
  const getImageUrl = React.useCallback((imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a Supabase URL, return it as-is
    if (imagePath.includes('supabase.co/storage')) {
      return imagePath;
    }
    
    // If it's a full HTTP/HTTPS URL, return it
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a data URL (base64), return it
    if (imagePath.startsWith('data:')) {
      return imagePath;
    }
    
    // Handle old Laravel paths or relative paths
    if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000') || 
        imagePath.startsWith('/storage/') || imagePath.startsWith('/images/') || 
        imagePath.startsWith('/uploads/')) {
      // Extract filename from path
      const filename = imagePath.split('/').pop();
      if (filename) {
        // Try to get from employees bucket
        const { data: { publicUrl } } = supabase.storage
          .from('employees')
          .getPublicUrl(filename);
        return publicUrl;
      }
      return null;
    }
    
    // If it's just a filename (no path, no http), try to get from Supabase Storage
    if (!imagePath.includes('/') && !imagePath.includes('http')) {
      const { data: { publicUrl } } = supabase.storage
        .from('employees')
        .getPublicUrl(imagePath);
      return publicUrl;
    }
    
    // If it contains a path but no http, try to extract and use filename
    if (imagePath.includes('/') && !imagePath.startsWith('http')) {
      const filename = imagePath.split('/').pop();
      if (filename) {
        const { data: { publicUrl } } = supabase.storage
          .from('employees')
          .getPublicUrl(filename);
        return publicUrl;
      }
    }
    
    return null;
  }, []);

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
      
      console.log('[AdminJardinageCategories] Loading categories from Supabase');
      
      const { data, error } = await supabase
        .from('jardinage_categories')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) {
        console.error('[AdminJardinageCategories] Error loading categories:', error);
        setError('Erreur lors du chargement des catégories: ' + error.message);
        return;
      }
      
      console.log('[AdminJardinageCategories] Loaded categories:', data?.length || 0);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[AdminJardinageCategories] Exception loading categories:', err);
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
    console.warn('[AdminJardinageCategories] Using public client - RLS may block writes. Set REACT_APP_SUPABASE_SERVICE_ROLE_KEY in .env');
    return supabase;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      // Handle image upload to Supabase Storage if imageFile exists
      let imageUrl = formData.image || '';
      
      if (imageFile) {
        console.log('[AdminJardinageCategories] Uploading image to Supabase Storage');
        // Clean filename: remove special characters and spaces
        const cleanFileName = imageFile.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_')
          .toLowerCase();
        const fileName = `jardinage_category_${Date.now()}_${cleanFileName}`;
        const filePath = fileName;
        
        // Upload to Supabase Storage (employees bucket)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employees')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('[AdminJardinageCategories] Error uploading image:', uploadError);
          // If upload fails, try to use base64 if available
          if (formData.image && formData.image.startsWith('data:')) {
            imageUrl = formData.image;
            console.log('[AdminJardinageCategories] Using base64 image as fallback');
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
          console.log('[AdminJardinageCategories] Image uploaded successfully:', imageUrl);
        }
      }
      
      const payload = {
        name: formData.name || formData.name_fr || formData.name_ar || formData.name_en || '',
        name_ar: formData.name_ar || '',
        name_fr: formData.name_fr || '',
        name_en: formData.name_en || '',
        description: formData.description || '',
        description_ar: formData.description_ar || '',
        description_fr: formData.description_fr || '',
        description_en: formData.description_en || '',
        icon: formData.icon || null,
        image: imageUrl,
        is_active: formData.is_active || true,
        order: formData.order || 0
      };
      
      console.log('[AdminJardinageCategories] Submitting category:', { editing: !!editingCategory, id: editingCategory?.id, payload });
      
      const db = getWriteClient();
      let data, error;
      if (editingCategory) {
        const { data: updateData, error: updateError } = await db
          .from('jardinage_categories')
          .update(payload)
          .eq('id', editingCategory.id)
          .select();
        data = updateData;
        error = updateError;
      } else {
        const { data: insertData, error: insertError } = await db
          .from('jardinage_categories')
          .insert(payload)
          .select();
        data = insertData;
        error = insertError;
      }
      
      if (error) {
        console.error('[AdminJardinageCategories] Error saving category:', error);
        setError('Erreur lors de la sauvegarde: ' + error.message);
        return;
      }
      
      console.log('[AdminJardinageCategories] Category saved successfully:', data);
      await loadCategories();
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', name_ar:'', name_fr:'', name_en:'', description: '', description_ar:'', description_fr:'', description_en:'', icon: '', image: '', is_active: true, order: 0 });
      setImagePreview(null);
      setImageFile(null);
    } catch (err) {
      console.error('[AdminJardinageCategories] Exception saving category:', err);
      setError('Erreur de connexion: ' + err.message);
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
      icon: category.icon || '',
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
        console.log('[AdminJardinageCategories] Deleting category:', id);
        
        const db = getWriteClient();
        const { error } = await db
          .from('jardinage_categories')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('[AdminJardinageCategories] Error deleting category:', error);
          setError('Erreur lors de la suppression: ' + error.message);
          return;
        }
        
        console.log('[AdminJardinageCategories] Category deleted successfully');
        await loadCategories();
      } catch (err) {
        console.error('[AdminJardinageCategories] Exception deleting category:', err);
        setError('Erreur de connexion: ' + err.message);
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
      <div className="admin-jardinage-categories">
        <div className="loading">Chargement des catégories...</div>
      </div>
    );
  }

  return (
    <div className="admin-jardinage-categories">
      <div className="admin-header">
        <h2>🌿 Gestion des Catégories Jardinage</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          ➕ Ajouter une catégorie
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

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
          <strong>⚠️ Note sur les images</strong>
          <br />
          <p style={{ margin: '10px 0', fontSize: '14px' }}>
            Si les images ne s'affichent pas, cela signifie que les fichiers n'existent pas encore dans le bucket Supabase Storage.
            <br />
            <strong>Solution:</strong> Utilisez le formulaire d'édition pour uploader les images. Les images seront automatiquement sauvegardées dans le bucket "employees".
          </p>
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
                  placeholder="Ex: Entretien du jardin"
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
                <label htmlFor="icon">Icône</label>
                <input
                  type="text"
                  id="icon"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  placeholder="Ex: 🌱"
                />
              </div>

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
                          e.target.style.display = 'none';
                          // Show error message if not already shown
                          if (!e.target.parentElement.querySelector('.image-error')) {
                            const errorMsg = document.createElement('div');
                            errorMsg.className = 'image-error';
                            errorMsg.textContent = 'Image non disponible';
                            errorMsg.style.cssText = 'color: #ef4444; padding: 8px; text-align: center; font-size: 12px;';
                            e.target.parentElement.appendChild(errorMsg);
                          }
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
              <th>Icône</th>
              <th>Statut</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
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
                            // Silently hide failed images - they don't exist in storage yet
                            e.target.style.display = 'none';
                            const placeholder = e.target.nextElementSibling;
                            if (placeholder) {
                              placeholder.style.display = 'block';
                            }
                          }}
                        />
                      ) : null}
                      <div className="category-img-placeholder" style={{display: imageUrl ? 'none' : 'block'}}>
                        🌱
                      </div>
                    </td>
                  <td className="category-name">{category.name}</td>
                  <td className="category-description">
                    {category.description || 'Aucune description'}
                  </td>
                  <td className="category-icon">{category.icon || '🌱'}</td>
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

export default AdminJardinageCategoriesCrud;

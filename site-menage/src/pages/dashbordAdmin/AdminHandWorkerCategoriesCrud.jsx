import React, { useState, useEffect } from 'react';
import './AdminHandWorkerCategoriesCrud.css';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';

export default function AdminHandWorkerCategoriesCrud({ token, onAuthError }) {
  // Resolve preferred UI language (used only for a few labels)
  const getUiLang = () => {
    try {
      const saved = localStorage.getItem('currentLang') || localStorage.getItem('i18nextLng');
      if (saved) return String(saved).split(/[-_]/)[0].toLowerCase();
    } catch {}
    return 'fr';
  };
  const uiLang = getUiLang();
  const tr = (fr, ar, en) => (uiLang === 'ar' ? ar : uiLang === 'en' ? en : fr);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
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
    price_per_hour: '',
    minimum_hours: '',
    is_active: true,
    order: 0
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

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
    if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000') || imagePath.startsWith('/storage/') || imagePath.startsWith('/images/') || imagePath.startsWith('/uploads/')) {
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
      const url = getImageUrl(formData.image);
      setImagePreview(url || formData.image);
    } else if (formData.image) {
      const url = getImageUrl(formData.image);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  }, [formData.image]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide');
        return;
      }
      
      // Check file size (3MB)
      if (file.size > 3 * 1024 * 1024) {
        alert('La taille du fichier ne doit pas dépasser 3MB');
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

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[AdminHandWorkerCategories] Loading categories from Supabase');
      
      const { data, error } = await supabase
        .from('hand_worker_categories')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) {
        console.error('[AdminHandWorkerCategories] Error loading categories:', error);
        setError('Erreur lors du chargement des catégories: ' + error.message);
        return;
      }
      
      console.log('[AdminHandWorkerCategories] Loaded categories:', data?.length || 0);
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[AdminHandWorkerCategories] Exception loading categories:', e);
      setError('Erreur lors du chargement des catégories: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      
      // Ensure base name/description mirror the active language when provided
      // Create payload without id to avoid duplicate key errors
      // Explicitly exclude id from formData
      const { id: formId, ...formDataWithoutId } = formData;
      const payload = { ...formDataWithoutId };
      
      // Double-check: ensure payload doesn't have id
      if ('id' in payload) {
        delete payload.id;
        console.warn('[AdminHandWorkerCategories] Removed id from payload:', formId);
      }
      const activeLang = (localStorage.getItem('currentLang') || localStorage.getItem('i18nextLng') || 'fr').split(/[-_]/)[0].toLowerCase();
      if (!payload.name) {
        if (activeLang === 'ar' && payload.name_ar) payload.name = payload.name_ar;
        if (activeLang === 'fr' && payload.name_fr) payload.name = payload.name_fr;
        if (activeLang === 'en' && payload.name_en) payload.name = payload.name_en;
      }
      if (!payload.description) {
        if (activeLang === 'ar' && payload.description_ar) payload.description = payload.description_ar;
        if (activeLang === 'fr' && payload.description_fr) payload.description = payload.description_fr;
        if (activeLang === 'en' && payload.description_en) payload.description = payload.description_en;
      }
      
      // Convert price_per_hour and minimum_hours to numbers
      if (payload.price_per_hour) payload.price_per_hour = parseFloat(payload.price_per_hour);
      if (payload.minimum_hours) payload.minimum_hours = parseInt(payload.minimum_hours);
      
      // Handle image upload to Supabase Storage if imageFile exists
      let imageUrl = formData.image || '';
      
      if (imageFile) {
        // Check if admin is logged in (adminToken exists)
        const adminToken = localStorage.getItem('adminToken');
        const adminData = localStorage.getItem('adminData');
        
        // Check Supabase Auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Try to upload image regardless of Supabase Auth session
        // We have a public upload policy that allows uploads without Supabase Auth
        console.log('[AdminHandWorkerCategories] Attempting to upload image to Supabase Storage');
        if (!session) {
          console.log('[AdminHandWorkerCategories] No Supabase Auth session, but trying upload anyway (public policy should allow it)');
        }
        
        // Clean filename: remove special characters and spaces
        const cleanFileName = imageFile.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_')
          .toLowerCase();
        const fileName = `hand_worker_category_${Date.now()}_${cleanFileName}`;
        const filePath = fileName;
        
        // Upload to Supabase Storage (employees bucket)
        // This should work even without Supabase Auth session if public upload policy is set
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employees')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('[AdminHandWorkerCategories] Error uploading image:', uploadError);
          // If upload fails, try to use base64 if available
          if (formData.image && formData.image.startsWith('data:')) {
            imageUrl = formData.image;
            console.log('[AdminHandWorkerCategories] Using base64 image as fallback');
          } else {
            // More detailed error message for RLS issues
            if (uploadError.message.includes('row-level security') || uploadError.message.includes('RLS')) {
              setError('Erreur RLS: Veuillez exécuter FIX_EMPLOYEES_STORAGE_RLS.sql dans Supabase SQL Editor');
              alert('❌ Erreur RLS lors du téléchargement.\n\nVeuillez exécuter FIX_EMPLOYEES_STORAGE_RLS.sql dans Supabase SQL Editor pour permettre رفع الصور.');
            } else {
              setError('Erreur lors du téléchargement de l\'image: ' + uploadError.message);
              alert('❌ Erreur lors du téléchargement de l\'image: ' + uploadError.message);
            }
            // Don't return - allow saving category without image
            imageUrl = formData.image || '';
          }
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('employees')
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
          console.log('[AdminHandWorkerCategories] Image uploaded successfully:', imageUrl);
        }
      }
      
      // Update payload with image URL
      payload.image = imageUrl;
      
      // Final check: ensure payload doesn't have id, created_at, updated_at, or any other auto-generated fields
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      
      console.log('[AdminHandWorkerCategories] Submitting category:', { 
        editing: !!editingCategory, 
        editingId: editingCategory?.id, 
        formDataId: formId,
        payloadKeys: Object.keys(payload),
        payloadHasId: 'id' in payload,
        payload 
      });
      
      let data, error;
      if (editingCategory) {
        // Update existing category (use editingCategory.id, not formData.id)
        const { data: updateData, error: updateError } = await supabase
          .from('hand_worker_categories')
          .update(payload)
          .eq('id', editingCategory.id)
          .select();
        data = updateData;
        error = updateError;
      } else {
        // Insert new category (payload already doesn't have id)
        // Create a clean payload without any auto-generated fields
        const cleanPayload = {
          name: payload.name,
          name_ar: payload.name_ar,
          name_fr: payload.name_fr,
          name_en: payload.name_en,
          description: payload.description,
          description_ar: payload.description_ar,
          description_fr: payload.description_fr,
          description_en: payload.description_en,
          icon: payload.icon,
          image: payload.image,
          price_per_hour: payload.price_per_hour,
          minimum_hours: payload.minimum_hours,
          is_active: payload.is_active !== undefined ? payload.is_active : true,
          order: payload.order || 0
        };
        
        console.log('[AdminHandWorkerCategories] Inserting with clean payload:', cleanPayload);
        
        const { data: insertData, error: insertError } = await supabase
          .from('hand_worker_categories')
          .insert(cleanPayload)
          .select();
        data = insertData;
        error = insertError;
      }
      
      if (error) {
        console.error('[AdminHandWorkerCategories] Error saving category:', error);
        setError('Erreur lors de la sauvegarde: ' + error.message);
        alert(`❌ Échec de la sauvegarde: ${error.message}`);
        return;
      }
      
      console.log('[AdminHandWorkerCategories] Category saved successfully:', data);
      await loadCategories();
      resetForm();
      setImagePreview(null);
      setImageFile(null);
      setShowForm(false);
      alert('✔️ Catégorie enregistrée avec succès');
    } catch (e) {
      console.error('[AdminHandWorkerCategories] Exception saving category:', e);
      setError('Erreur lors de la sauvegarde: ' + e.message);
      alert(`❌ Erreur réseau: ${e.message}`);
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
      description: category.description || '',
      description_ar: category.description_ar || '',
      description_fr: category.description_fr || '',
      description_en: category.description_en || '',
      icon: category.icon || '',
      image: imageUrl || imagePath || '',
      price_per_hour: category.price_per_hour,
      minimum_hours: category.minimum_hours,
      is_active: category.is_active,
      order: category.order || 0
    });
    setImagePreview(imageUrl || imagePath || null);
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }

    try {
      console.log('[AdminHandWorkerCategories] Deleting category:', id);
      
      const { error } = await supabase
        .from('hand_worker_categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('[AdminHandWorkerCategories] Error deleting category:', error);
        setError('Erreur lors de la suppression: ' + error.message);
        alert('❌ Erreur lors de la suppression: ' + error.message);
        return;
      }
      
      console.log('[AdminHandWorkerCategories] Category deleted successfully');
      await loadCategories();
      alert('✔️ Catégorie supprimée avec succès');
    } catch (e) {
      console.error('[AdminHandWorkerCategories] Exception deleting category:', e);
      setError('Erreur lors de la suppression: ' + e.message);
      alert('❌ Erreur: ' + e.message);
    }
  };

  const resetForm = () => {
    setFormData({
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
      price_per_hour: '',
      minimum_hours: '',
      is_active: true,
      order: 0
    });
    setImagePreview(null);
    setImageFile(null);
    setEditingCategory(null);
    setError('');
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-hand-worker-categories-crud">
      <div className="admin-header">
        <h2>Gestion des Catégories Travaux Manuels</h2>
        <button 
          className="add-button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Ajouter une catégorie
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h3>
              {editingCategory
                ? tr('Modifier la catégorie', 'تعديل الفئة', 'Edit Category')
                : tr('Nouvelle catégorie', 'فئة جديدة', 'New Category')}
            </h3>
            <form onSubmit={handleSubmit}>
              <LanguageFields
                value={{
                  name_ar: formData.name_ar,
                  name_fr: formData.name_fr,
                  name_en: formData.name_en,
                  description_ar: formData.description_ar,
                  description_fr: formData.description_fr,
                  description_en: formData.description_en,
                }}
                onChange={(v) => setFormData({ ...formData, ...v })}
                includeDescription={true}
                required={true}
              />

              <div className="form-group">
                <label>Icône (FontAwesome)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  placeholder="fas fa-hammer"
                />
              </div>

              <div className="form-group">
                <label>Image</label>
                <div className="image-upload-container">
                  <div className="image-input-row">
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      placeholder="URL de l'image ou téléchargez un fichier"
                      className="image-url-input"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('image-file-input').click()}
                      className="upload-image-btn"
                      title="Télécharger une image"
                    >
                      📁 Choisir un fichier
                    </button>
                    <input
                      type="file"
                      id="image-file-input"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
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
                          console.error('[AdminHandWorkerCategories] Preview image failed to load');
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Prix par heure (DH) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_per_hour}
                    onChange={(e) => setFormData({...formData, price_per_hour: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Heures minimum *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimum_hours}
                    onChange={(e) => setFormData({...formData, minimum_hours: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  Actif
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-button">
                  {editingCategory ? 'Modifier' : 'Créer'}
                </button>
                <button type="button" onClick={handleCancel} className="cancel-button">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="categories-list">
        {categories.length === 0 ? (
          <div className="no-data">Aucune catégorie trouvée</div>
        ) : (
          <div className="categories-grid">
            {categories.map(category => (
              <div key={category.id} className="category-card">
                <div className="category-header">
                  <div className="category-icon">
                    {category.icon ? (
                      <i className={category.icon}></i>
                    ) : (
                      <i className="fas fa-tools"></i>
                    )}
                  </div>
                  <div className="category-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(category)}
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(category.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="category-content">
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  
                  <div className="category-details">
                    <div className="detail-item">
                      <span className="label">Prix/heure:</span>
                      <span className="value">{category.price_per_hour} DH</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Minimum:</span>
                      <span className="value">{category.minimum_hours}h</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Statut:</span>
                      <span className={`status ${category.is_active ? 'active' : 'inactive'}`}>
                        {category.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

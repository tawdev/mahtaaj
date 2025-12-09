import React, { useState, useEffect } from 'react';
import './AdminHandWorkerCategoriesCrud.css';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';

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
    price_per_day: '',
    minimum_jours: '',
    is_active: true,
    order: 0
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Get admin client for write operations (bypasses RLS)
  const supabaseAdmin = getSupabaseAdmin();

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
      
      // Remove any auto-generated fields
      delete payload.created_at;
      delete payload.updated_at;
      
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
      
      // Convert price_per_day to number (handle empty strings)
      if (payload.price_per_day !== '' && payload.price_per_day !== null && payload.price_per_day !== undefined) {
        payload.price_per_day = parseFloat(payload.price_per_day);
        if (isNaN(payload.price_per_day) || payload.price_per_day < 0) {
          setError('Le prix par jour doit être un nombre valide');
          alert('❌ Le prix par jour doit être un nombre valide');
          return;
        }
      } else {
        setError('Le prix par jour est requis');
        alert('❌ Le prix par jour est requis');
        return;
      }
      
      // Convert minimum_jours to number (handle empty strings)
      if (payload.minimum_jours !== '' && payload.minimum_jours !== null && payload.minimum_jours !== undefined) {
        payload.minimum_jours = parseInt(payload.minimum_jours);
        if (isNaN(payload.minimum_jours) || payload.minimum_jours < 1) {
          setError('Le nombre minimum de jours doit être un nombre valide (minimum 1)');
          alert('❌ Le nombre minimum de jours doit être un nombre valide (minimum 1)');
          return;
        }
      } else {
        setError('Le nombre minimum de jours est requis');
        alert('❌ Le nombre minimum de jours est requis');
        return;
      }
      
      // Ensure order is a number
      if (payload.order !== undefined && payload.order !== null && payload.order !== '') {
        payload.order = parseInt(payload.order) || 0;
      } else {
        payload.order = 0;
      }
      
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
        // Use admin client for upload to bypass RLS
        const storageClient = supabaseAdmin?.storage || supabase.storage;
        const { data: uploadData, error: uploadError } = await storageClient
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
      
      // Update payload with image URL (can be empty string)
      payload.image = imageUrl || null;
      
      // Clean empty strings to null for optional fields
      if (payload.icon === '') payload.icon = null;
      if (payload.name_ar === '') payload.name_ar = null;
      if (payload.name_fr === '') payload.name_fr = null;
      if (payload.name_en === '') payload.name_en = null;
      if (payload.description_ar === '') payload.description_ar = null;
      if (payload.description_fr === '') payload.description_fr = null;
      if (payload.description_en === '') payload.description_en = null;
      
      // Ensure is_active is boolean
      payload.is_active = payload.is_active !== undefined ? Boolean(payload.is_active) : true;
      
      console.log('[AdminHandWorkerCategories] Submitting category:', { 
        editing: !!editingCategory, 
        editingId: editingCategory?.id, 
        formDataId: formId,
        payloadKeys: Object.keys(payload),
        payloadHasId: 'id' in payload,
        payload 
      });
      
      let data, error;
      // Use admin client for write operations to bypass RLS
      const writeClient = supabaseAdmin || supabase;
      
      if (editingCategory && editingCategory.id) {
        // Update existing category (use editingCategory.id, not formData.id)
        console.log('[AdminHandWorkerCategories] Updating category with ID:', editingCategory.id);
        const { data: updateData, error: updateError } = await writeClient
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
          name: payload.name || null,
          name_ar: payload.name_ar || null,
          name_fr: payload.name_fr || null,
          name_en: payload.name_en || null,
          description: payload.description || null,
          description_ar: payload.description_ar || null,
          description_fr: payload.description_fr || null,
          description_en: payload.description_en || null,
          icon: payload.icon || null,
          image: payload.image || null,
          price_per_day: payload.price_per_day,
          minimum_jours: payload.minimum_jours,
          is_active: payload.is_active !== undefined ? payload.is_active : true,
          order: payload.order || 0
        };
        
        console.log('[AdminHandWorkerCategories] Inserting with clean payload:', cleanPayload);
        
        const { data: insertData, error: insertError } = await writeClient
          .from('hand_worker_categories')
          .insert(cleanPayload)
          .select();
        data = insertData;
        error = insertError;
      }
      
      if (error) {
        console.error('[AdminHandWorkerCategories] Error saving category:', error);
        const errorMessage = error.message || 'Erreur inconnue';
        setError('Erreur lors de la sauvegarde: ' + errorMessage);
        alert(`❌ Échec de la sauvegarde: ${errorMessage}`);
        return;
      }
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.error('[AdminHandWorkerCategories] No data returned after save');
        setError('Aucune donnée retournée après la sauvegarde');
        alert('❌ Aucune donnée retournée après la sauvegarde');
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
    if (!category || !category.id) {
      console.error('[AdminHandWorkerCategories] Cannot edit: invalid category', category);
      alert('❌ Erreur: Catégorie invalide');
      return;
    }
    
    console.log('[AdminHandWorkerCategories] Editing category:', category);
    setEditingCategory(category);
    setError('');
    
    const imagePath = category.image || '';
    const imageUrl = imagePath ? getImageUrl(imagePath) : '';
    
    setFormData({
      name: category.name || '',
      name_ar: category.name_ar || '',
      name_fr: category.name_fr || '',
      name_en: category.name_en || '',
      description: category.description || '',
      description_ar: category.description_ar || '',
      description_fr: category.description_fr || '',
      description_en: category.description_en || '',
      icon: category.icon || '',
      image: imageUrl || imagePath || '',
      price_per_day: category.price_per_day || category.price_per_hour || '',
      minimum_jours: category.minimum_jours || '',
      is_active: category.is_active !== undefined ? category.is_active : true,
      order: category.order || 0
    });
    
    setImagePreview(imageUrl || imagePath || null);
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!id) {
      console.error('[AdminHandWorkerCategories] Cannot delete: no ID provided');
      alert('❌ Erreur: ID de catégorie manquant');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.')) {
      return;
    }

    try {
      setError('');
      console.log('[AdminHandWorkerCategories] Deleting category:', id);
      
      // First check if category exists
      const { data: categoryData, error: checkError } = await supabase
        .from('hand_worker_categories')
        .select('id, name')
        .eq('id', id)
        .single();
      
      if (checkError || !categoryData) {
        console.error('[AdminHandWorkerCategories] Category not found:', checkError);
        setError('Catégorie non trouvée');
        alert('❌ Catégorie non trouvée');
        return;
      }
      
      // Delete the category
      // Use admin client for delete operation to bypass RLS
      const writeClient = supabaseAdmin || supabase;
      const { error } = await writeClient
        .from('hand_worker_categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('[AdminHandWorkerCategories] Error deleting category:', error);
        const errorMessage = error.message || 'Erreur inconnue';
        setError('Erreur lors de la suppression: ' + errorMessage);
        alert('❌ Erreur lors de la suppression: ' + errorMessage);
        return;
      }
      
      console.log('[AdminHandWorkerCategories] Category deleted successfully');
      await loadCategories();
      alert('✔️ Catégorie supprimée avec succès');
    } catch (e) {
      console.error('[AdminHandWorkerCategories] Exception deleting category:', e);
      const errorMessage = e.message || 'Erreur inconnue';
      setError('Erreur lors de la suppression: ' + errorMessage);
      alert('❌ Erreur: ' + errorMessage);
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
      price_per_day: '',
      minimum_jours: '',
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
            عمليات الحفظ والتعديل قد تفشل بسبب RLS (Row Level Security).
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
                  <label>Prix par jour (DH) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_per_day}
                    onChange={(e) => setFormData({...formData, price_per_day: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Jours minimum *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimum_jours}
                    onChange={(e) => setFormData({...formData, minimum_jours: e.target.value})}
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
                  <div className="category-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(category)}
                      title="Modifier cette catégorie"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}
                    >
                      <span className="button-icon">✏️</span>
                      <span className="button-text">Modifier</span>
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(category.id)}
                      title="Supprimer cette catégorie"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}
                    >
                      <span className="button-icon">🗑️</span>
                      <span className="button-text">Supprimer</span>
                    </button>
                  </div>
                </div>

                <div className="category-content">
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  
                  <div className="category-details">
                    <div className="detail-item">
                      <span className="label">Prix/jour:</span>
                      <span className="value">{category.price_per_day || category.price_per_hour || 0} DH</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Minimum:</span>
                      <span className="value">{category.minimum_jours || '-'} jour{category.minimum_jours > 1 ? 's' : ''}</span>
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

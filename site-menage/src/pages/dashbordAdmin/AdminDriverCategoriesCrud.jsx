import React, { useEffect, useState } from 'react';
import { 
  getDriverCategories, 
  createDriverCategory, 
  updateDriverCategory, 
  deleteDriverCategory
} from '../../api-supabase';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import './AdminCrud.css';

export default function AdminDriverCategoriesCrud({ token, onAuthError }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({ 
    category_name: '', // Legacy field
    name_ar: '',
    name_fr: '',
    name_en: '',
    description: '', // Legacy field
    description_ar: '',
    description_fr: '',
    description_en: '',
    image: ''
  });

  const getToken = () => token || localStorage.getItem('adminToken');

  // Get the appropriate Supabase client for uploads (prefer admin client)
  const getUploadClient = () => {
    if (supabaseAdmin) {
      return supabaseAdmin;
    }
    console.warn('[AdminDriverCategories] Using public client for upload - RLS may block writes. Set REACT_APP_SUPABASE_SERVICE_ROLE_KEY in .env');
    return supabase;
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getDriverCategories();
      setCategories(data || []);
    } catch (e) {
      console.error('Error loading driver categories:', e);
      if (e.message?.includes('JWT') || e.message?.includes('expired')) {
        if (onAuthError) onAuthError();
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError(e.message || 'Erreur de connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get image URL from Supabase Storage
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a Supabase URL, return it
    if (imagePath.includes('supabase.co/storage')) {
      return imagePath;
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

  const showNotification = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      // Validate that at least one name is provided
      const hasAnyName = formData.name_ar || formData.name_fr || formData.name_en || formData.category_name;
      if (!hasAnyName) {
        setError('Veuillez renseigner au moins un nom (FR/AR/EN).');
        return;
      }
      
      // Handle image upload to Supabase Storage if imageFile exists
      let imageUrl = formData.image || '';
      
      if (imageFile) {
        console.log('[AdminDriverCategories] Uploading image to Supabase Storage');
        
        // Get the appropriate client for upload
        const uploadClient = getUploadClient();
        
        // Check if user has a session (for public client)
        if (!supabaseAdmin) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (!session) {
            console.warn('[AdminDriverCategories] No Supabase Auth session, but trying upload anyway');
          }
        }
        
        // Clean filename: remove special characters and spaces
        const cleanFileName = imageFile.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_')
          .toLowerCase();
        const fileName = `driver_category_${Date.now()}_${cleanFileName}`;
        const filePath = fileName;
        
        // Upload to Supabase Storage (employees bucket)
        const { data: uploadData, error: uploadError } = await uploadClient.storage
          .from('employees')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('[AdminDriverCategories] Upload error details:', {
            message: uploadError.message,
            statusCode: uploadError.statusCode,
            error: uploadError
          });
          
          // Handle specific error cases
          if (uploadError.message?.includes('Bucket not found') || uploadError.statusCode === 404) {
            setError('Bucket "employees" غير موجود. يرجى إنشاء bucket "employees" في Supabase Storage أولاً.');
            return;
          }
          
          if (uploadError.statusCode === 401 || uploadError.statusCode === 403) {
            setError('خطأ في الصلاحيات (401/403). تأكد من:\n1. أن bucket "employees" موجود و public\n2. أن RLS policies موجودة للـ INSERT\n3. أن REACT_APP_SUPABASE_SERVICE_ROLE_KEY مضبوط في .env');
            return;
          }
          
          // If upload fails, try to use base64 if available
          if (formData.image && formData.image.startsWith('data:')) {
            imageUrl = formData.image;
            console.log('[AdminDriverCategories] Using base64 image as fallback');
          } else {
            setError('Erreur lors du téléchargement de l\'image: ' + (uploadError.message || 'Unknown error'));
            return;
          }
        } else {
          // Get public URL (use the same client)
          const { data: { publicUrl } } = uploadClient.storage
            .from('employees')
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
          console.log('[AdminDriverCategories] Image uploaded successfully:', publicUrl);
        }
      }
      
      // Prepare payload with multilingual fields
      const payload = {
        name_ar: formData.name_ar || null,
        name_fr: formData.name_fr || null,
        name_en: formData.name_en || null,
        description_ar: formData.description_ar || null,
        description_fr: formData.description_fr || null,
        description_en: formData.description_en || null,
        image: imageUrl || null
      };
      
      // Set legacy fields for backward compatibility
      // category_name: use first available multilingual name or empty string
      payload.category_name = formData.category_name || 
                              formData.name_fr || 
                              formData.name_ar || 
                              formData.name_en || 
                              '';
      
      // description: use first available multilingual description or empty string
      payload.description = formData.description || 
                            formData.description_fr || 
                            formData.description_ar || 
                            formData.description_en || 
                            '';
      
      if (editingCategory) {
        await updateDriverCategory(editingCategory.id, payload);
        showNotification('Catégorie modifiée avec succès');
      } else {
        await createDriverCategory(payload);
        showNotification('Catégorie créée avec succès');
      }
      
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ 
        category_name: '', 
        name_ar: '',
        name_fr: '',
        name_en: '',
        description: '', 
        description_ar: '',
        description_fr: '',
        description_en: '',
        image: '' 
      });
      setImageFile(null);
      setImagePreview(null);
      loadCategories();
    } catch (e) {
      const errorMsg = e.message || 'Erreur lors de la sauvegarde';
      showNotification(errorMsg, 'error');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    const imagePath = category.image || '';
    const imageUrl = imagePath ? getImageUrl(imagePath) : '';
    setFormData({ 
      category_name: category.category_name || '',
      name_ar: category.name_ar || '',
      name_fr: category.name_fr || '',
      name_en: category.name_en || '',
      description: category.description || '',
      description_ar: category.description_ar || '',
      description_fr: category.description_fr || '',
      description_en: category.description_en || '',
      image: imageUrl || imagePath || ''
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
      setError('');
      await deleteDriverCategory(id);
      showNotification('Catégorie supprimée avec succès');
      loadCategories();
    } catch (e) {
      const errorMsg = e.message || 'Erreur lors de la suppression';
      showNotification(errorMsg, 'error');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ 
      category_name: '', 
      name_ar: '',
      name_fr: '',
      name_en: '',
      description: '', 
      description_ar: '',
      description_fr: '',
      description_en: '',
      image: '' 
    });
    setImageFile(null);
    setImagePreview(null);
    setError('');
    setSuccess('');
  };

  // Helper function to get display name (prefer multilingual, fallback to legacy)
  const getDisplayName = (category) => {
    return category.name_fr || category.name_ar || category.name_en || category.category_name || '-';
  };

  // Helper function to get display description (prefer multilingual, fallback to legacy)
  const getDisplayDescription = (category) => {
    const desc = category.description_fr || category.description_ar || category.description_en || category.description || '';
    return desc.length > 50 ? desc.substring(0, 50) + '...' : desc || '-';
  };

  const filteredCategories = categories.filter(category => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (category.category_name || '').toLowerCase().includes(searchLower) ||
      (category.name_ar || '').toLowerCase().includes(searchLower) ||
      (category.name_fr || '').toLowerCase().includes(searchLower) ||
      (category.name_en || '').toLowerCase().includes(searchLower) ||
      (category.description || '').toLowerCase().includes(searchLower) ||
      (category.description_ar || '').toLowerCase().includes(searchLower) ||
      (category.description_fr || '').toLowerCase().includes(searchLower) ||
      (category.description_en || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading && categories.length === 0) {
    return (
      <div className="admin-crud">
        <div className="admin-crud-loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="admin-crud">
      <div className="admin-crud-header">
        <h2>Gestion des Catégories Chauffeurs</h2>
        <button 
          onClick={() => { 
            setShowForm(true); 
            setEditingCategory(null); 
            setFormData({ 
              category_name: '', 
              name_ar: '',
              name_fr: '',
              name_en: '',
              description: '', 
              description_ar: '',
              description_fr: '',
              description_en: '',
              image: '' 
            }); 
            setImageFile(null);
            setImagePreview(null);
          }}
          className="admin-crud-add-button"
        >
          + Ajouter une Catégorie
        </button>
      </div>

      {(error || success) && (
        <div className={`admin-crud-notification ${error ? 'error' : 'success'}`}>
          {error || success}
        </div>
      )}

      {showForm && (
        <div className="admin-crud-form-overlay">
          <div className="admin-crud-form">
            <div className="admin-crud-form-header">
              <h3>{editingCategory ? 'Modifier' : 'Créer'} une Catégorie</h3>
              <button type="button" className="admin-crud-close-button" onClick={handleCancel} aria-label="Fermer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-crud-field">
                <LanguageFields
                  value={formData}
                  onChange={(updated) => setFormData({...formData, ...updated})}
                  includeDescription={true}
                  required={true}
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="image">Image</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  {imagePreview && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        style={{ 
                          maxWidth: '200px', 
                          maxHeight: '200px', 
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #ddd'
                        }} 
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Supprimer l'image"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="admin-crud-form-actions">
                <button type="submit" className="admin-crud-save-button">
                  {editingCategory ? 'Modifier' : 'Créer'}
                </button>
                <button type="button" onClick={handleCancel} className="admin-crud-cancel-button">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-crud-filters">
        <input
          type="text"
          placeholder="Rechercher (nom, description)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-crud-search-input"
        />
      </div>

      <div className="admin-crud-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom (AR/FR/EN)</th>
              <th>Description (AR/FR/EN)</th>
              <th>Image</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">Aucune catégorie trouvée</td>
              </tr>
            ) : (
              filteredCategories.map((category) => {
                const displayName = getDisplayName(category);
                const displayDesc = getDisplayDescription(category);
                return (
                  <tr key={category.id}>
                    <td style={{ fontSize: '12px' }}>{category.id.substring(0, 8)}...</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {category.name_ar && <span style={{ fontSize: '12px', color: '#059669' }}>🇸🇦 {category.name_ar}</span>}
                        {category.name_fr && <span style={{ fontSize: '12px', color: '#2563eb' }}>🇫🇷 {category.name_fr}</span>}
                        {category.name_en && <span style={{ fontSize: '12px', color: '#dc2626' }}>🇬🇧 {category.name_en}</span>}
                        {!category.name_ar && !category.name_fr && !category.name_en && <span>{displayName}</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '300px' }}>
                        {category.description_ar && <span style={{ fontSize: '11px', color: '#059669' }}>🇸🇦 {category.description_ar.length > 40 ? category.description_ar.substring(0, 40) + '...' : category.description_ar}</span>}
                        {category.description_fr && <span style={{ fontSize: '11px', color: '#2563eb' }}>🇫🇷 {category.description_fr.length > 40 ? category.description_fr.substring(0, 40) + '...' : category.description_fr}</span>}
                        {category.description_en && <span style={{ fontSize: '11px', color: '#dc2626' }}>🇬🇧 {category.description_en.length > 40 ? category.description_en.substring(0, 40) + '...' : category.description_en}</span>}
                        {!category.description_ar && !category.description_fr && !category.description_en && <span>{displayDesc}</span>}
                      </div>
                    </td>
                    <td>
                      {category.image ? (
                        <img src={category.image} alt={displayName} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : '-'}
                    </td>
                    <td>{category.created_at ? new Date(category.created_at).toLocaleDateString() : '-'}</td>
                    <td>
                      <button 
                        onClick={() => handleEdit(category)}
                        className="admin-crud-edit-button"
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)}
                        className="admin-crud-delete-button"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


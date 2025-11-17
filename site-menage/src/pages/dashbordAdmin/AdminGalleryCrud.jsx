import React, { useState, useEffect } from 'react';
import './AdminGalleryCrud.css';
import { supabase } from '../../lib/supabase';

const AdminGalleryCrud = ({ token, onAuthError }) => {
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  const [formData, setFormData] = useState({
    category_gallery_id: '',
    order: 0,
    is_active: true,
    image: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadCategories();
    loadImages();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('category_gallery')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (err) {
      console.error('Exception loading categories:', err);
    }
  };

  // Helper function to get image URL from Supabase Storage
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a Supabase Storage path
    if (imagePath.includes('supabase.co/storage') || imagePath.includes('supabase.in/storage')) {
      return imagePath;
    }
    
    // Remove leading slash and 'gallery/' prefix if present
    let cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    if (cleanPath.startsWith('gallery/')) {
      cleanPath = cleanPath.replace('gallery/', '');
    }
    
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(cleanPath);
      return publicUrl;
    } catch (err) {
      console.warn('Error getting public URL:', err);
      return imagePath;
    }
  };

  const loadImages = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('gallery')
        .select(`
          *,
          category_gallery:category_gallery_id (
            id,
            name_ar,
            name_fr,
            name_en
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        setError('Erreur lors du chargement des images: ' + error.message);
        return;
      }

      // Map images with proper URLs and category data
      const mappedImages = (data || []).map(img => ({
        ...img,
        image_url: getImageUrl(img.image_path),
        categoryGallery: img.category_gallery || null
      }));

      setImages(mappedImages);
    } catch (err) {
      console.error('Exception loading images:', err);
      setError('Erreur de connexion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file || null
      }));
      
      // Show preview
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        // If file is cleared and we're editing, show original image
        if (editingImage && !file) {
          setPreviewImage(editingImage.image_url || null);
        } else {
          setPreviewImage(null);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
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

  // Upload image to Supabase Storage
  const uploadImage = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `gallery_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName; // Upload to root of gallery bucket
      
      console.log('[Gallery] Uploading image:', fileName, 'to bucket: gallery');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('[Gallery] Upload error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          error: uploadError
        });
        
        if (uploadError.message?.includes('Bucket not found') || uploadError.statusCode === 404) {
          throw new Error('Bucket "gallery" غير موجود. يرجى إنشاء bucket "gallery" في Supabase Storage أولاً.');
        }
        
        if (uploadError.statusCode === 400) {
          throw new Error('خطأ في رفع الصورة (400). تأكد من:\n1. أن bucket "gallery" موجود و public\n2. أن RLS policies موجودة للـ INSERT\n3. أنك مسجل الدخول في التطبيق');
        }
        
        if (uploadError.statusCode === 403) {
          throw new Error('لا توجد صلاحيات لرفع الصورة (403). تأكد من:\n1. أن bucket "gallery" هو public\n2. أن RLS policy للـ INSERT موجودة للمستخدمين المسجلين');
        }
        
        throw new Error(uploadError.message || 'Erreur lors du téléchargement de l\'image');
      }
      
      console.log('[Gallery] Upload successful:', uploadData);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);
      
      console.log('[Gallery] Image uploaded successfully, public URL:', publicUrl);
      return `gallery/${fileName}`; // Return path as stored in database
    } catch (err) {
      console.error('[Gallery] Error uploading image:', err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      // Frontend validation
      if (!formData.category_gallery_id) {
        setError('Veuillez sélectionner une catégorie');
        return;
      }
      
      if (!editingImage && !formData.image) {
        setError('Veuillez sélectionner une image');
        return;
      }
      
      let imagePath = editingImage?.image_path || null;
      
      // Upload new image if provided
      if (formData.image) {
        try {
          imagePath = await uploadImage(formData.image);
        } catch (uploadErr) {
          showNotification('Erreur lors du téléchargement de l\'image: ' + uploadErr.message, 'error');
          return;
        }
      }
      
      const galleryData = {
        category_gallery_id: parseInt(formData.category_gallery_id),
        order: parseInt(formData.order) || 0,
        is_active: formData.is_active,
        ...(imagePath && { image_path: imagePath })
      };

      console.log('[Gallery] Saving gallery data:', galleryData);
      
      // التحقق من تسجيل الدخول
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[Gallery] Session error:', sessionError);
      }
      console.log('[Gallery] User session:', sessionData?.session ? 'Authenticated' : 'Not authenticated');
      console.log('[Gallery] User ID:', sessionData?.session?.user?.id);

      let data, error;
      
      if (editingImage) {
        // Update existing image
        console.log('[Gallery] Updating image ID:', editingImage.id);
        const { data: updateData, error: updateError } = await supabase
          .from('gallery')
          .update(galleryData)
          .eq('id', editingImage.id)
          .select(`
            *,
            category_gallery:category_gallery_id (
              id,
              name_ar,
              name_fr,
              name_en
            )
          `);
        data = updateData && updateData.length > 0 ? updateData[0] : null;
        error = updateError;
      } else {
        // Create new image
        console.log('[Gallery] Creating new image');
        console.log('[Gallery] Insert data:', JSON.stringify(galleryData, null, 2));
        const { data: insertData, error: insertError } = await supabase
          .from('gallery')
          .insert([galleryData])
          .select(`
            *,
            category_gallery:category_gallery_id (
              id,
              name_ar,
              name_fr,
              name_en
            )
          `);
        console.log('[Gallery] Insert response:', { 
          insertData, 
          insertError,
          hasData: !!insertData,
          dataLength: insertData?.length,
          errorDetails: insertError ? {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
            statusCode: insertError.statusCode,
            status: insertError.status
          } : null
        });
        data = insertData && insertData.length > 0 ? insertData[0] : null;
        error = insertError;
      }

      if (error) {
        // عرض تفاصيل الخطأ الكاملة
        const errorDetails = {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          statusCode: error.statusCode,
          status: error.status,
          galleryData,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        };
        
        console.error('[Gallery] Error saving gallery image:', errorDetails);
        console.error('[Gallery] Full error object:', error);
        console.error('[Gallery] Error keys:', Object.keys(error));
        
        // محاولة الحصول على رسالة خطأ أكثر تفصيلاً
        let detailedMessage = error.message || 'Unknown error';
        if (error.details) {
          detailedMessage += ` | Details: ${error.details}`;
        }
        if (error.hint) {
          detailedMessage += ` | Hint: ${error.hint}`;
        }
        console.error('[Gallery] Detailed error message:', detailedMessage);
        
        let errorMessage = 'Erreur lors de la sauvegarde: ' + error.message;
        
        if (error.code === '23503') {
          errorMessage = 'Erreur: La catégorie sélectionnée n\'existe pas. Veuillez sélectionner une catégorie valide.';
        } else if (error.code === '42501' || error.message?.includes('row-level security')) {
          errorMessage = 'Erreur: Pas de permission. Vérifiez les RLS policies pour la table "gallery".';
        } else if (error.code === '409' || error.statusCode === 409) {
          errorMessage = 'Erreur: Conflit (409). Vérifiez que la catégorie existe et que vous avez les permissions nécessaires.';
        }
        
        showNotification(errorMessage, 'error');
        return;
      }

      showNotification(editingImage ? 'Image mise à jour avec succès' : 'Image créée avec succès');
      await loadImages();
      setShowForm(false);
      setEditingImage(null);
      setPreviewImage(null);
      resetForm();
    } catch (err) {
      console.error('Exception saving gallery image:', err);
      showNotification('Erreur de connexion: ' + err.message, 'error');
    }
  };

  const handleEdit = (image) => {
    setEditingImage(image);
    setFormData({
      category_gallery_id: image.category_gallery_id || '',
      order: image.order || 0,
      is_active: image.is_active !== undefined ? image.is_active : true,
      image: null
    });
    // Get image URL for preview
    const imageUrl = getImageUrl(image.image_path || image.image_url);
    setPreviewImage(imageUrl);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      try {
        setError('');
        
        // Find the image to get its path for storage deletion
        const imageToDelete = images.find(img => img.id === id);
        
        const { error } = await supabase
          .from('gallery')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting gallery image:', error);
          showNotification('Erreur lors de la suppression: ' + error.message, 'error');
          return;
        }

        // Optionally delete from storage (optional - you might want to keep files)
        if (imageToDelete?.image_path) {
          try {
            let filePath = imageToDelete.image_path;
            if (filePath.startsWith('gallery/')) {
              filePath = filePath.replace('gallery/', '');
            }
            await supabase.storage
              .from('gallery')
              .remove([filePath]);
            console.log('[Gallery] Image file deleted from storage:', filePath);
          } catch (storageErr) {
            console.warn('[Gallery] Could not delete file from storage:', storageErr);
            // Don't fail the operation if storage deletion fails
          }
        }

        showNotification('Image supprimée avec succès');
        await loadImages();
      } catch (err) {
        console.error('Exception deleting gallery image:', err);
        showNotification('Erreur de connexion: ' + err.message, 'error');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingImage(null);
    setPreviewImage(null);
    resetForm();
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setFormData({
      category_gallery_id: '',
      order: 0,
      is_active: true,
      image: null
    });
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = 
      (image.categoryGallery?.name_ar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (image.categoryGallery?.name_fr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (image.categoryGallery?.name_en || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && image.is_active) ||
      (filterStatus === 'inactive' && !image.is_active);
    const matchesCategory = 
      filterCategory === 'all' || 
      image.category_gallery_id?.toString() === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading && images.length === 0) {
    return (
      <div className="admin-gallery-images">
        <div className="loading">Chargement des images...</div>
      </div>
    );
  }

  return (
    <div className="admin-gallery-images">
      <div className="admin-crud-header">
        <h2>Gestion des Images de Galerie</h2>
        <button className="btn-add" onClick={() => { setShowForm(true); setEditingImage(null); setPreviewImage(null); resetForm(); }}>
          + Ajouter une Image
        </button>
      </div>

      {(error || success) && (
        <div className={`notification ${error ? 'error' : 'success'}`}>
          {error || success}
        </div>
      )}

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h3>{editingImage ? 'Modifier l\'Image' : 'Ajouter une Image'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Catégorie *</label>
                <select
                  name="category_gallery_id"
                  value={formData.category_gallery_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name_fr} ({category.name_ar})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Image {!editingImage && '*'}
                  {editingImage && (
                    <span className="label-hint">(Laisser vide pour conserver l'image actuelle)</span>
                  )}
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleInputChange}
                  required={!editingImage}
                  key={editingImage ? `edit-${editingImage.id}` : 'new'}
                />
                {previewImage && (
                  <div className="image-preview">
                    <img src={previewImage} alt="Preview" />
                    {editingImage && formData.image && (
                      <button
                        type="button"
                        className="btn-remove-preview"
                        onClick={() => {
                          // Restore original image preview
                          setPreviewImage(editingImage.image_url || null);
                          setFormData(prev => ({ ...prev, image: null }));
                          // Reset file input
                          const fileInput = document.querySelector('input[name="image"]');
                          if (fileInput) fileInput.value = '';
                        }}
                      >
                        Retirer la nouvelle image (conserver l'originale)
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ordre</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Actif
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">
                  {editingImage ? 'Mettre à jour' : 'Créer'}
                </button>
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="filters-section">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id.toString()}>
              {category.name_fr}
            </option>
          ))}
        </select>
      </div>

      <div className="gallery-grid">
        {filteredImages.length === 0 ? (
          <div className="no-data">Aucune image trouvée</div>
        ) : (
          filteredImages.map((image) => (
            <div key={image.id} className="gallery-item">
              <div className="gallery-image-container">
                <img 
                  src={image.image_url || getImageUrl(image.image_path) || '/placeholder.jpg'} 
                  alt={image.categoryGallery?.name_fr || image.category_gallery?.name_fr || 'Gallery Image'}
                  onError={(e) => {
                    e.target.src = '/placeholder.jpg';
                  }}
                />
                <div className="gallery-overlay">
                  <button className="btn-edit" onClick={() => handleEdit(image)}>
                    Modifier
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(image.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
              <div className="gallery-info">
                <p className="gallery-category">{image.categoryGallery?.name_fr || 'N/A'}</p>
                <span className={`status ${image.is_active ? 'active' : 'inactive'}`}>
                  {image.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminGalleryCrud;


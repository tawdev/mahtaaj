import React, { useState, useEffect } from 'react';
import './AdminJardinageCategoriesCrud.css';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';

export default function AdminCategoryHouseCrud({ token, onAuthError }) {
  const [categoriesHouse, setCategoriesHouse] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategoryHouse, setEditingCategoryHouse] = useState(null);
  const [formData, setFormData] = useState({
    service_id: '',
    name: '',
    name_ar: '',
    name_fr: '',
    name_en: '',
    image: '',
    is_active: true,
    order: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadServices();
    loadCategoriesHouse();
  }, []);

  // Helper function to get image URL from Supabase Storage
  const getImageUrl = React.useCallback((imagePath) => {
    if (!imagePath) return null;

    // If it's already a Supabase URL, return it
    if (imagePath.includes('supabase.co/storage')) {
      // Fix double bucket name in URL (category_house/category_house/...)
      if (imagePath.includes('/category_house/category_house/')) {
        const fixedUrl = imagePath.replace('/category_house/category_house/', '/category_house/');
        console.log('[CategoryHouse] Fixed double bucket name:', imagePath, '->', fixedUrl);
        return fixedUrl;
      }
      // Fix if image is in products bucket but URL points to category_house
      if (imagePath.includes('/category_house/') && imagePath.includes('/products/')) {
        // Already correct, return as-is
        return imagePath;
      }
      return imagePath;
    }

    // Extract filename from any path
    const extractFilename = (path) => {
      if (path.includes('/')) {
        return path.split('/').pop();
      }
      return path;
    };

    // If it's an old Laravel path, extract filename and try to get from Supabase
    if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000') || imagePath.startsWith('/storage/')) {
      console.log('[CategoryHouse] Ignoring Laravel path:', imagePath);
      const filename = extractFilename(imagePath);
      if (filename) {
        // Try category_house first, then products as fallback
        const { data: { publicUrl: categoryHouseUrl } } = supabase.storage
          .from('category_house')
          .getPublicUrl(filename);
        console.log('[CategoryHouse] Trying category_house bucket for filename:', filename, '->', categoryHouseUrl);
        
        // Also try products bucket (some images might be there)
        const { data: { publicUrl: productsUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filename);
        console.log('[CategoryHouse] Also trying products bucket for filename:', filename, '->', productsUrl);
        
        // Return category_house URL (user can manually move images if needed)
        return categoryHouseUrl;
      }
      return null;
    }

    // If it's just a filename (UUID or similar), try to get from Supabase (root of bucket)
    if (!imagePath.includes('/') && !imagePath.includes('http')) {
      // Try category_house first
      const { data: { publicUrl: categoryHouseUrl } } = supabase.storage
        .from('category_house')
        .getPublicUrl(imagePath);
      console.log('[CategoryHouse] Using filename as-is (category_house):', imagePath, '->', categoryHouseUrl);
      
      // Also try products bucket as fallback
      const { data: { publicUrl: productsUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(imagePath);
      console.log('[CategoryHouse] Also trying products bucket:', imagePath, '->', productsUrl);
      
      // Return category_house URL (preferred bucket for category_house images)
      return categoryHouseUrl;
    }

    // If it's a relative path starting with /, try to get from Supabase
    if (imagePath.startsWith('/')) {
      const filename = imagePath.replace(/^\//, '').replace(/^category_house\//, '').replace(/^products\//, '');
      const { data: { publicUrl: categoryHouseUrl } } = supabase.storage
        .from('category_house')
        .getPublicUrl(filename);
      console.log('[CategoryHouse] Using relative path (category_house):', imagePath, '->', categoryHouseUrl);
      
      // Also try products bucket
      const { data: { publicUrl: productsUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filename);
      console.log('[CategoryHouse] Also trying products bucket:', imagePath, '->', productsUrl);
      
      // Return category_house URL
      return categoryHouseUrl;
    }

    // Otherwise, return as-is (might be a full URL)
    return imagePath;
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error loading services:', error);
        return;
      }

      setServices(data || []);
    } catch (err) {
      console.error('Exception loading services:', err);
    }
  };

  const loadCategoriesHouse = async () => {
    try {
      setLoading(true);
      setError('');
      
      let query = supabase
        .from('categories_house')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filterService !== 'all') {
        query = query.eq('service_id', filterService);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading categories house:', error);
        setError('Erreur lors du chargement des catégories house: ' + error.message);
        return;
      }

      setCategoriesHouse(data || []);
    } catch (err) {
      console.error('Exception loading categories house:', err);
      setError('Erreur de connexion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoriesHouse();
  }, [filterService]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file) => {
    try {
      setUploadingImage(true);
      
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      // Upload to root of bucket, not in a subfolder
      const filePath = fileName;

      console.log('[CategoryHouse] Uploading image:', fileName, 'to bucket: category_house (root)');

      const { data, error } = await supabase.storage
        .from('category_house')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('[CategoryHouse] Upload error:', error);
        
        // إذا كان Bucket غير موجود، حاول استخدام bucket آخر أو أعط رسالة واضحة
        if (error.message?.includes('Bucket not found') || error.statusCode === '404') {
          throw new Error('Bucket "category_house" غير موجود. يرجى إنشاء bucket "category_house" في Supabase Storage أولاً.');
        }
        
        throw error;
      }

      console.log('[CategoryHouse] Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('category_house')
        .getPublicUrl(filePath);

      console.log('[CategoryHouse] Image uploaded successfully, public URL:', publicUrl);

      if (publicUrl) {
        // Update formData with the uploaded image URL
        setFormData(prev => ({ ...prev, image: publicUrl }));
        setImageFile(null); // Clear file after successful upload
        return publicUrl;
      }
      
      throw new Error('Aucune URL d\'image retournée');
    } catch (err) {
      console.error('[CategoryHouse] Erreur lors du téléchargement de l\'image:', err);
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
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
    // Reset file input
    const fileInput = document.getElementById('category_house_image_upload');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      // If a new file is selected but hasn't been uploaded yet, upload it first
      let imageUrl = formData.image;
      if (imageFile && !uploadingImage) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          return; // Stop save if upload failed
        }
      }
      
      const submitData = {
        ...formData,
        image: imageUrl || formData.image || null
      };
      
      let data, error;
      
      if (editingCategoryHouse) {
        // Update existing category
        const { data: updateData, error: updateError } = await supabase
          .from('categories_house')
          .update(submitData)
          .eq('id', editingCategoryHouse.id)
          .select();
        data = updateData && updateData.length > 0 ? updateData[0] : null;
        error = updateError;
      } else {
        // Create new category
        const { data: insertData, error: insertError } = await supabase
          .from('categories_house')
          .insert([submitData])
          .select();
        data = insertData && insertData.length > 0 ? insertData[0] : null;
        error = insertError;
      }

      if (error) {
        console.error('Error saving category house:', error);
        setError('Erreur lors de la sauvegarde: ' + error.message);
        return;
      }

      await loadCategoriesHouse();
      setShowForm(false);
      setEditingCategoryHouse(null);
      setFormData({ 
        service_id: '',
        name: '', 
        name_ar: '', 
        name_fr: '', 
        name_en: '',
        image: '',
        is_active: true, 
        order: 0 
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error('Exception saving category house:', err);
      setError('Erreur de connexion: ' + err.message);
    }
  };

  const handleEdit = (categoryHouse) => {
    setEditingCategoryHouse(categoryHouse);
    setFormData({
      service_id: categoryHouse.service_id || '',
      name: categoryHouse.name || '',
      name_ar: categoryHouse.name_ar || '',
      name_fr: categoryHouse.name_fr || '',
      name_en: categoryHouse.name_en || '',
      image: categoryHouse.image || '',
      is_active: categoryHouse.is_active !== undefined ? categoryHouse.is_active : true,
      order: categoryHouse.order || 0
    });
    // Set image preview if image exists
    if (categoryHouse.image || categoryHouse.image_url) {
      const imgUrl = getImageUrl(categoryHouse.image || categoryHouse.image_url);
      setImagePreview(imgUrl);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie house ?')) {
      try {
        setError('');
        
        const { error } = await supabase
          .from('categories_house')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting category house:', error);
          setError('Erreur lors de la suppression: ' + error.message);
          return;
        }

        await loadCategoriesHouse();
      } catch (err) {
        console.error('Exception deleting category house:', err);
        setError('Erreur de connexion: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategoryHouse(null);
    setFormData({ 
      service_id: '',
      name: '', 
      name_ar: '', 
      name_fr: '', 
      name_en: '',
      image: '',
      is_active: true, 
      order: 0 
    });
    setImageFile(null);
    setImagePreview(null);
    setError('');
    // Reset file input
    const fileInput = document.getElementById('category_house_image_upload');
    if (fileInput) fileInput.value = '';
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? (service.title || service.name_fr || service.name_ar || service.name_en || `Service #${serviceId}`) : `Service #${serviceId}`;
  };

  const filteredCategoriesHouse = categoriesHouse.filter(categoryHouse => {
    const categoryName = categoryHouse.name || '';
    const matchesSearch = categoryName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && categoryHouse.is_active) ||
                         (filterStatus === 'inactive' && !categoryHouse.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-jardinage-categories">
        <div className="loading">Chargement des catégories house...</div>
      </div>
    );
  }

  return (
    <div className="admin-jardinage-categories">
      <div className="admin-header">
        <h2>🏠 Gestion des Catégories House</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          ➕ Ajouter une catégorie house
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher une catégorie house..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tous les services</option>
          {services.map(service => (
            <option key={service.id} value={service.id}>
              {service.title || service.name_fr || service.name_ar || service.name_en || `Service #${service.id}`}
            </option>
          ))}
        </select>
        
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
              <h3>{editingCategoryHouse ? 'Modifier la catégorie house' : 'Nouvelle catégorie house'}</h3>
              <button className="close-btn" onClick={handleCancel}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="service_id">Service *</label>
                  <select
                    id="service_id"
                    name="service_id"
                    value={formData.service_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionner un service</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.title || service.name_fr || service.name_ar || service.name_en || `Service #${service.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name">Nom de la catégorie *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Maison"
                />
              </div>

              <LanguageFields
                value={{
                  name_ar: formData.name_ar,
                  name_fr: formData.name_fr,
                  name_en: formData.name_en,
                }}
                onChange={(v) => setFormData(prev => ({ ...prev, ...v }))}
                includeDescription={false}
                required={false}
              />

              <div className="form-group">
                <label htmlFor="image">Image (URL ou chemin relatif)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="Ex: /serveces/Ménage1.jpeg ou URL complète"
                    style={{ flex: 1, minWidth: '200px' }}
                  />
                  <input
                    type="file"
                    id="category_house_image_upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="category_house_image_upload"
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
                  {(imagePreview || formData.image) && (
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
                <small className="form-help">
                  Entrez une URL complète, un chemin relatif, ou téléchargez une image (Max 5MB)
                </small>
                {(imagePreview || formData.image) && (() => {
                  const previewUrl = imagePreview || getImageUrl(formData.image) || formData.image;
                  const previewFilename = formData.image ? (formData.image.includes('/') ? formData.image.split('/').pop() : formData.image) : null;
                  
                  return (
                    <div className="image-preview" style={{ marginTop: '10px' }}>
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd' }}
                        onError={(e) => {
                          console.error('[CategoryHouse] Preview image load error:', previewUrl);
                          // Try products bucket as fallback
                          if (previewFilename && !previewUrl.includes('/products/')) {
                            const { data: { publicUrl: productsUrl } } = supabase.storage
                              .from('products')
                              .getPublicUrl(previewFilename);
                            console.log('[CategoryHouse] Trying products bucket for preview:', previewFilename, '->', productsUrl);
                            if (productsUrl && productsUrl !== previewUrl) {
                              e.target.src = productsUrl;
                              return;
                            }
                          }
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  );
                })()}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="order">Ordre</label>
                  <input
                    type="number"
                    id="order"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                  />
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
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategoryHouse ? 'Modifier' : 'Ajouter'}
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
              <th>Service</th>
              <th>Nom</th>
              <th>Nom (AR)</th>
              <th>Nom (FR)</th>
              <th>Nom (EN)</th>
              <th>Statut</th>
              <th>Ordre</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategoriesHouse.length === 0 ? (
              <tr>
                <td colSpan="11" className="no-data">
                  Aucune catégorie house trouvée
                </td>
              </tr>
            ) : (
              filteredCategoriesHouse.map(categoryHouse => {
                const imageUrl = getImageUrl(categoryHouse.image || categoryHouse.image_url);
                // Extract filename for fallback to products bucket
                const getFilename = (path) => {
                  if (!path) return null;
                  if (path.includes('/')) {
                    return path.split('/').pop();
                  }
                  return path;
                };
                const filename = getFilename(categoryHouse.image || categoryHouse.image_url);
                
                return (
                  <tr key={categoryHouse.id}>
                    <td>{categoryHouse.id}</td>
                    <td>
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={categoryHouse.name || 'Category'} 
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            objectFit: 'cover', 
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                          }}
                          onError={(e) => {
                            console.error('[CategoryHouse] Image load error from category_house:', imageUrl);
                            // Try products bucket as fallback
                            if (filename && !imageUrl.includes('/products/')) {
                              const { data: { publicUrl: productsUrl } } = supabase.storage
                                .from('products')
                                .getPublicUrl(filename);
                              console.log('[CategoryHouse] Trying products bucket as fallback:', filename, '->', productsUrl);
                              if (productsUrl && productsUrl !== imageUrl) {
                                e.target.src = productsUrl;
                                return;
                              }
                            }
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>Aucune image</span>
                      )}
                    </td>
                    <td>{getServiceName(categoryHouse.service_id)}</td>
                    <td className="category-name">{categoryHouse.name || '-'}</td>
                    <td className="category-name">{categoryHouse.name_ar || '-'}</td>
                    <td className="category-name">{categoryHouse.name_fr || '-'}</td>
                    <td className="category-name">{categoryHouse.name_en || '-'}</td>
                    <td>
                      <span className={`status ${categoryHouse.is_active ? 'active' : 'inactive'}`}>
                        {categoryHouse.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{categoryHouse.order || 0}</td>
                    <td>{new Date(categoryHouse.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="actions">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(categoryHouse)}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(categoryHouse.id)}
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
            <div className="stat-number">{categoriesHouse.length}</div>
            <div className="stat-label">Total des catégories house</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{categoriesHouse.filter(c => c.is_active).length}</div>
            <div className="stat-label">Catégories actives</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">{categoriesHouse.filter(c => !c.is_active).length}</div>
            <div className="stat-label">Catégories inactives</div>
          </div>
        </div>
      </div>
    </div>
  );
}


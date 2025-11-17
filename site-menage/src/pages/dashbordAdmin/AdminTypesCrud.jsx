import React, { useState, useEffect } from 'react';
import './AdminJardinageCategoriesCrud.css';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';

export default function AdminTypesCrud({ token, onAuthError }) {
  const [types, setTypes] = useState([]);
  const [categoriesHouse, setCategoriesHouse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    category_house_id: '',
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategoryHouse, setFilterCategoryHouse] = useState('all');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Type Options management
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [typeOptions, setTypeOptions] = useState([]);
  const [showOptionForm, setShowOptionForm] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [optionFormData, setOptionFormData] = useState({
    type_id: '',
    name_ar: '',
    name_fr: '',
    name_en: '',
    description_ar: '',
    description_fr: '',
    description_en: '',
    image: ''
  });
  const [optionImageFile, setOptionImageFile] = useState(null);
  const [optionImagePreview, setOptionImagePreview] = useState(null);
  const [uploadingOptionImage, setUploadingOptionImage] = useState(false);

  useEffect(() => {
    loadCategoriesHouse();
    loadTypes();
  }, []);

  const loadCategoriesHouse = async () => {
    try {
      const { data, error } = await supabase
        .from('categories_house')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        console.error('Error loading categories house:', error);
        return;
      }

      setCategoriesHouse(data || []);
    } catch (err) {
      console.error('Exception loading categories house:', err);
    }
  };


  const loadTypes = async () => {
    try {
      setLoading(true);
      setError('');
      
      let query = supabase
        .from('types')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filterCategoryHouse !== 'all') {
        query = query.eq('category_house_id', filterCategoryHouse);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AdminTypesCrud] Error loading types:', error);
        setError('Erreur lors du chargement des types: ' + error.message);
        return;
      }

      console.log('[AdminTypesCrud] Loaded types:', data?.length || 0, 'types');
      console.log('[AdminTypesCrud] Types data:', data);
      setTypes(data || []);
    } catch (err) {
      console.error('[AdminTypesCrud] Exception loading types:', err);
      setError('Erreur de connexion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, [filterCategoryHouse]);

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
      // Upload to root of bucket
      const filePath = fileName;

      console.log('[Types] Uploading image:', fileName, 'to bucket: types (root)');

      const { data, error } = await supabase.storage
        .from('types')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('[Types] Upload error:', error);
        
        if (error.message?.includes('Bucket not found') || error.statusCode === '404') {
          throw new Error('Bucket "types" غير موجود. يرجى إنشاء bucket "types" في Supabase Storage أولاً.');
        }
        
        throw error;
      }

      console.log('[Types] Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('types')
        .getPublicUrl(filePath);

      console.log('[Types] Image uploaded successfully, public URL:', publicUrl);

      if (publicUrl) {
        // Update formData with the uploaded image URL
        setFormData(prev => ({ ...prev, image: publicUrl }));
        setImageFile(null); // Clear file after successful upload
        return publicUrl;
      }
      
      throw new Error('Aucune URL d\'image retournée');
    } catch (err) {
      console.error('[Types] Erreur lors du téléchargement de l\'image:', err);
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
    const fileInput = document.getElementById('type_image_upload');
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
      
      const insertData = {
        ...formData,
        image: imageUrl || formData.image || null
      };

      let data, error;
      if (editingType) {
        const result = await supabase
          .from('types')
          .update(insertData)
          .eq('id', editingType.id)
          .select();
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from('types')
          .insert(insertData)
          .select();
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error saving type:', error);
        setError('Erreur lors de la sauvegarde: ' + error.message);
        return;
      }

      await loadTypes();
      setShowForm(false);
      setEditingType(null);
      setFormData({ 
        category_house_id: '',
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
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error('Error saving type:', err);
      setError('Erreur de connexion');
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      category_house_id: type.category_house_id || '',
      name: type.name || '',
      name_ar: type.name_ar || '',
      name_fr: type.name_fr || '',
      name_en: type.name_en || '',
      description: type.description || '',
      description_ar: type.description_ar || '',
      description_fr: type.description_fr || '',
      description_en: type.description_en || '',
      image: type.image || '',
      is_active: type.is_active !== undefined ? type.is_active : true,
      order: type.order || 0
    });
    // Set image preview if image exists
    if (type.image) {
      const imgUrl = type.image.startsWith('/') 
        ? (process.env.PUBLIC_URL || '') + type.image 
        : type.image;
      setImagePreview(imgUrl);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce type ?')) {
      try {
        setError('');
        
        const { error } = await supabase
          .from('types')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting type:', error);
          setError('Erreur lors de la suppression: ' + error.message);
          return;
        }

        await loadTypes();
      } catch (err) {
        console.error('Exception deleting type:', err);
        setError('Erreur de connexion: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingType(null);
    setFormData({ 
      category_house_id: '',
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
    setImageFile(null);
    setImagePreview(null);
    setError('');
    // Reset file input
    const fileInput = document.getElementById('type_image_upload');
    if (fileInput) fileInput.value = '';
  };

  const getCategoryHouseName = (categoryHouseId) => {
    const categoryHouse = categoriesHouse.find(ch => ch.id === categoryHouseId);
    return categoryHouse ? (categoryHouse.name || categoryHouse.name_fr || categoryHouse.name_ar || categoryHouse.name_en || `Catégorie House #${categoryHouseId}`) : `Catégorie House #${categoryHouseId}`;
  };

  // Load type options
  const loadTypeOptions = async (typeId) => {
    try {
      console.log('[AdminTypesCrud] Loading type options for type_id:', typeId);
      
      const { data, error } = await supabase
        .from('type_options')
        .select('*')
        .eq('type_id', typeId)
        .order('order', { ascending: true });

      if (error) {
        console.error('[AdminTypesCrud] Error loading type options:', error);
        setError('Erreur lors du chargement des options: ' + error.message);
        return;
      }

      console.log('[AdminTypesCrud] Loaded type options:', data?.length || 0, 'options');
      console.log('[AdminTypesCrud] Type options data:', data);
      setTypeOptions(data || []);
    } catch (err) {
      console.error('[AdminTypesCrud] Exception loading type options:', err);
      setError('Erreur lors du chargement des options: ' + err.message);
    }
  };

  // Open options modal
  const handleManageOptions = (type) => {
    setSelectedType(type);
    setShowOptionsModal(true);
    loadTypeOptions(type.id);
  };

  // Close options modal
  const handleCloseOptionsModal = () => {
    setShowOptionsModal(false);
    setSelectedType(null);
    setTypeOptions([]);
    setShowOptionForm(false);
    setEditingOption(null);
    setOptionFormData({
      type_id: '',
      name_ar: '',
      name_fr: '',
      name_en: '',
      description_ar: '',
      description_fr: '',
      description_en: '',
      image: ''
    });
    setOptionImageFile(null);
    setOptionImagePreview(null);
  };

  // Handle option image upload
  const handleOptionImageUpload = async (e) => {
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

    setOptionImageFile(file);
    setError('');

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setOptionImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload image immediately
    await uploadOptionImage(file);
  };

  // Upload option image to Supabase Storage
  const uploadOptionImage = async (file) => {
    try {
      setUploadingOptionImage(true);
      
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      const filePath = fileName;

      console.log('[TypeOptions] Uploading image:', fileName, 'to bucket: types (root)');

      const { data, error } = await supabase.storage
        .from('types')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('[TypeOptions] Upload error:', error);
        
        if (error.message?.includes('Bucket not found') || error.statusCode === '404') {
          throw new Error('Bucket "types" غير موجود. يرجى إنشاء bucket "types" في Supabase Storage أولاً.');
        }
        
        throw error;
      }

      console.log('[TypeOptions] Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('types')
        .getPublicUrl(filePath);

      console.log('[TypeOptions] Image uploaded successfully, public URL:', publicUrl);

      if (publicUrl) {
        setOptionFormData(prev => ({ ...prev, image: publicUrl }));
        setOptionImageFile(null);
        return publicUrl;
      }
      
      throw new Error('Aucune URL d\'image retournée');
    } catch (err) {
      console.error('[TypeOptions] Erreur lors du téléchargement de l\'image:', err);
      setError('Erreur lors du téléchargement de l\'image: ' + err.message);
      return null;
    } finally {
      setUploadingOptionImage(false);
    }
  };

  // Remove option image
  const removeOptionImage = () => {
    setOptionImageFile(null);
    setOptionImagePreview(null);
    setOptionFormData(prev => ({
      ...prev,
      image: ''
    }));
    // Reset file input
    const fileInput = document.getElementById('option_image_upload');
    if (fileInput) fileInput.value = '';
  };

  // Handle option form submit
  const handleOptionSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      // If a new file is selected but hasn't been uploaded yet, upload it first
      let imageUrl = optionFormData.image;
      if (optionImageFile && !uploadingOptionImage) {
        imageUrl = await uploadOptionImage(optionImageFile);
        if (!imageUrl) {
          return; // Stop save if upload failed
        }
      }
      
      const insertData = {
        ...optionFormData,
        type_id: selectedType.id,
        image: imageUrl || optionFormData.image || null
      };

      let data, error;
      if (editingOption) {
        const result = await supabase
          .from('type_options')
          .update(insertData)
          .eq('id', editingOption.id)
          .select();
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from('type_options')
          .insert(insertData)
          .select();
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error saving option:', error);
        setError('Erreur lors de la sauvegarde: ' + error.message);
        return;
      }

      await loadTypeOptions(selectedType.id);
      setShowOptionForm(false);
      setEditingOption(null);
      setOptionFormData({
        type_id: '',
        name_ar: '',
        name_fr: '',
        name_en: '',
        description_ar: '',
        description_fr: '',
        description_en: '',
        image: ''
      });
      setOptionImageFile(null);
      setOptionImagePreview(null);
    } catch (err) {
      console.error('Error saving option:', err);
      setError('Erreur de connexion');
    }
  };

  // Handle edit option
  const handleEditOption = (option) => {
    setEditingOption(option);
    setOptionFormData({
      type_id: option.type_id,
      name_ar: option.name_ar || '',
      name_fr: option.name_fr || '',
      name_en: option.name_en || '',
      description_ar: option.description_ar || '',
      description_fr: option.description_fr || '',
      description_en: option.description_en || '',
      image: option.image || ''
    });
    // Set image preview if image exists
    if (option.image) {
      const imgUrl = option.image.startsWith('/') 
        ? (process.env.PUBLIC_URL || '') + option.image 
        : option.image;
      setOptionImagePreview(imgUrl);
    } else {
      setOptionImagePreview(null);
    }
    setOptionImageFile(null);
    setShowOptionForm(true);
  };

  // Handle delete option
  const handleDeleteOption = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette option ?')) {
      try {
        setError('');
        
        const { error } = await supabase
          .from('type_options')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting option:', error);
          setError('Erreur lors de la suppression: ' + error.message);
          return;
        }

        await loadTypeOptions(selectedType.id);
      } catch (err) {
        console.error('Exception deleting option:', err);
        setError('Erreur de connexion: ' + err.message);
      }
    }
  };

  // Cancel option form
  const handleCancelOptionForm = () => {
    setShowOptionForm(false);
    setEditingOption(null);
    setOptionFormData({
      type_id: '',
      name_ar: '',
      name_fr: '',
      name_en: '',
      description_ar: '',
      description_fr: '',
      description_en: '',
      image: ''
    });
    setOptionImageFile(null);
    setOptionImagePreview(null);
  };

  const filteredTypes = types.filter(type => {
    // Use name or fallback to name_fr, name_ar, or name_en
    const typeName = type.name || type.name_fr || type.name_ar || type.name_en || '';
    const matchesSearch = typeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && type.is_active) ||
                         (filterStatus === 'inactive' && !type.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-jardinage-categories">
        <div className="loading">Chargement des types...</div>
      </div>
    );
  }

  return (
    <div className="admin-jardinage-categories">
      <div className="admin-header">
        <h2>🏷️ Gestion des Types</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          ➕ Ajouter un type
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
            placeholder="Rechercher un type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <select
          value={filterCategoryHouse}
          onChange={(e) => setFilterCategoryHouse(e.target.value)}
          className="filter-select"
        >
          <option value="all">Toutes les catégories house</option>
          {categoriesHouse.map(categoryHouse => (
            <option key={categoryHouse.id} value={categoryHouse.id}>
              {categoryHouse.name || categoryHouse.name_fr || categoryHouse.name_ar || categoryHouse.name_en || `Catégorie House #${categoryHouse.id}`}
            </option>
          ))}
        </select>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tous les types</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <div className="form-header">
              <h3>{editingType ? 'Modifier le type' : 'Nouveau type'}</h3>
              <button className="close-btn" onClick={handleCancel}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category_house_id">Catégories House *</label>
                  <select
                    id="category_house_id"
                    name="category_house_id"
                    value={formData.category_house_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionner une catégorie house</option>
                    {categoriesHouse.map(categoryHouse => (
                      <option key={categoryHouse.id} value={categoryHouse.id}>
                        {categoryHouse.name || categoryHouse.name_fr || categoryHouse.name_ar || categoryHouse.name_en || `Catégorie House #${categoryHouse.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name">Nom du type *</label>
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
                  description_ar: formData.description_ar,
                  description_fr: formData.description_fr,
                  description_en: formData.description_en,
                }}
                onChange={(v) => setFormData(prev => ({ ...prev, ...v }))}
                includeDescription={true}
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
                    id="type_image_upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="type_image_upload"
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
                {(imagePreview || formData.image) && (
                  <div className="image-preview" style={{ marginTop: '10px' }}>
                    <img 
                      src={imagePreview || (formData.image.startsWith('/') 
                        ? (process.env.PUBLIC_URL || '') + formData.image 
                        : formData.image)} 
                      alt="Preview" 
                      style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
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
                    Type actif
                  </label>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingType ? 'Modifier' : 'Ajouter'}
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
              <th>Actions</th>
              <th>ID</th>
              <th>Catégorie House</th>
              <th>Nom</th>
              <th>Nom (AR)</th>
              <th>Nom (FR)</th>
              <th>Nom (EN)</th>
              <th>Description (FR)</th>
              <th>Image</th>
              <th>Statut</th>
              <th>Ordre</th>
              <th>Créé le</th>
            </tr>
          </thead>
          <tbody>
            {filteredTypes.length === 0 ? (
              <tr>
                <td colSpan="12" className="no-data">
                  Aucun type trouvé
                </td>
              </tr>
            ) : (
              filteredTypes.map(type => (
                <tr key={type.id}>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(type)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-edit"
                      onClick={() => handleManageOptions(type)}
                      title="Gérer les options"
                      style={{ marginLeft: '5px', backgroundColor: '#8b5cf6' }}
                    >
                      ⚙️
                    </button>
                    <button
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(type.id)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                  <td>{type.id}</td>
                  <td>{getCategoryHouseName(type.category_house_id)}</td>
                  <td className="category-name">{type.name || '-'}</td>
                  <td className="category-name">{type.name_ar || '-'}</td>
                  <td className="category-name">{type.name_fr || '-'}</td>
                  <td className="category-name">{type.name_en || '-'}</td>
                  <td className="category-description">{type.description_fr || type.description || '-'}</td>
                  <td>
                    {type.image_url || type.image ? (
                      <img 
                        src={type.image_url || (type.image?.startsWith('/') 
                          ? (process.env.PUBLIC_URL || '') + type.image 
                          : type.image)} 
                        alt={type.name || 'Type'} 
                        style={{ 
                          width: '50px', 
                          height: '50px', 
                          objectFit: 'cover', 
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px' }}>Aucune image</span>
                    )}
                  </td>
                  <td>
                    <span className={`status ${type.is_active ? 'active' : 'inactive'}`}>
                      {type.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{type.order || 0}</td>
                  <td>{new Date(type.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{types.length}</div>
            <div className="stat-label">Total des types</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{types.filter(t => t.is_active).length}</div>
            <div className="stat-label">Types actifs</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">{types.filter(t => !t.is_active).length}</div>
            <div className="stat-label">Types inactifs</div>
          </div>
        </div>
      </div>

      {/* Options Management Modal */}
      {showOptionsModal && selectedType && (
        <div className="form-modal" style={{ zIndex: 1000 }}>
          <div className="form-container" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="form-header">
              <h3>Gestion des options - {selectedType.name || selectedType.name_fr || selectedType.name_ar || selectedType.name_en}</h3>
              <button className="close-btn" onClick={handleCloseOptionsModal}>✕</button>
            </div>

            {!showOptionForm ? (
              <>
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: '#666' }}>
                    {typeOptions.length} option{typeOptions.length > 1 ? 's' : ''} trouvée{typeOptions.length > 1 ? 's' : ''}
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setOptionFormData({
                        type_id: selectedType.id,
                        name_ar: '',
                        name_fr: '',
                        name_en: '',
                        description_ar: '',
                        description_fr: '',
                        description_en: '',
                        image: ''
                      });
                      setOptionImageFile(null);
                      setOptionImagePreview(null);
                      setShowOptionForm(true);
                    }}
                  >
                    ➕ Ajouter une option
                  </button>
                </div>

                {typeOptions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    Aucune option trouvée. Cliquez sur "Ajouter une option" pour en créer une.
                  </div>
                ) : (
                  <div className="categories-table-container">
                    <table className="categories-table">
                      <thead>
                        <tr>
                          <th>Actions</th>
                          <th>ID</th>
                          <th>Image</th>
                          <th>Nom (AR)</th>
                          <th>Nom (FR)</th>
                          <th>Nom (EN)</th>
                          <th>Description (FR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {typeOptions.map(option => (
                          <tr key={option.id}>
                            <td className="actions">
                              <button
                                className="btn btn-sm btn-edit"
                                onClick={() => handleEditOption(option)}
                                title="Modifier"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn btn-sm btn-delete"
                                onClick={() => handleDeleteOption(option.id)}
                                title="Supprimer"
                              >
                                🗑️
                              </button>
                            </td>
                            <td>{option.id}</td>
                            <td>
                              {option.image_url || option.image ? (
                                <img 
                                  src={option.image_url || (option.image?.startsWith('/') 
                                    ? (process.env.PUBLIC_URL || '') + option.image 
                                    : option.image)} 
                                  alt={option.name_fr || option.name_ar || option.name_en || 'Option'} 
                                  style={{ 
                                    width: '50px', 
                                    height: '50px', 
                                    objectFit: 'cover', 
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span style={{ color: '#999', fontSize: '12px' }}>Aucune image</span>
                              )}
                            </td>
                            <td>{option.name_ar || '-'}</td>
                            <td>{option.name_fr || '-'}</td>
                            <td>{option.name_en || '-'}</td>
                            <td className="category-description">{option.description_fr || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleOptionSubmit} className="category-form">
                <div className="form-header" style={{ marginBottom: '20px' }}>
                  <h4>{editingOption ? 'Modifier l\'option' : 'Nouvelle option'}</h4>
                </div>

                <LanguageFields
                  value={{
                    name_ar: optionFormData.name_ar,
                    name_fr: optionFormData.name_fr,
                    name_en: optionFormData.name_en,
                    description_ar: optionFormData.description_ar,
                    description_fr: optionFormData.description_fr,
                    description_en: optionFormData.description_en,
                  }}
                  onChange={(v) => setOptionFormData(prev => ({ ...prev, ...v }))}
                  includeDescription={true}
                  required={false}
                />

                <div className="form-group">
                  <label htmlFor="option_image">Image (URL ou chemin relatif)</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      id="option_image"
                      name="image"
                      value={optionFormData.image}
                      onChange={(e) => setOptionFormData(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="Ex: /serveces/Ménage1.jpeg ou URL complète"
                      style={{ flex: 1, minWidth: '200px' }}
                    />
                    <input
                      type="file"
                      id="option_image_upload"
                      accept="image/*"
                      onChange={handleOptionImageUpload}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="option_image_upload"
                      style={{
                        padding: '8px 16px',
                        background: uploadingOptionImage ? '#94a3b8' : '#2563eb',
                        color: '#fff',
                        borderRadius: '8px',
                        cursor: uploadingOptionImage ? 'not-allowed' : 'pointer',
                        display: 'inline-block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {uploadingOptionImage ? '⏳ Téléchargement...' : '📁 Télécharger une image'}
                    </label>
                    {(optionImagePreview || optionFormData.image) && (
                      <button
                        type="button"
                        onClick={removeOptionImage}
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
                  {(optionImagePreview || optionFormData.image) && (
                    <div className="image-preview" style={{ marginTop: '10px' }}>
                      <img 
                        src={optionImagePreview || (optionFormData.image.startsWith('/') 
                          ? (process.env.PUBLIC_URL || '') + optionFormData.image 
                          : optionFormData.image)} 
                        alt="Preview" 
                        style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button type="button" onClick={handleCancelOptionForm} className="btn btn-secondary">
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingOption ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


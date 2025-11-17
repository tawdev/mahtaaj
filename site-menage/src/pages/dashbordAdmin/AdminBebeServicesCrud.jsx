import React, { useState, useEffect } from 'react';
import './AdminBebeServicesCrud.css';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';

const AdminBebeServicesCrud = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    name_fr: '',
    name_en: '',
    description: '',
    description_ar: '',
    description_fr: '',
    description_en: '',
    slug: '',
    price: '',
    duration: '',
    bebe_category_id: '',
    is_active: true,
    image_url: '',
    order: 0
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadServices();
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
        console.log('[AdminBebeServices] Converting Laravel path to Supabase:', imagePath, '-> filename:', filename);
        // Try employees bucket first (where we upload bebe images)
        const { data: { publicUrl } } = supabase.storage
          .from('employees')
          .getPublicUrl(filename);
        console.log('[AdminBebeServices] Generated Supabase URL:', publicUrl);
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
  
  // تحديث معاينة الصورة عند تغيير image_url
  useEffect(() => {
    if (formData.image_url && formData.image_url.startsWith('data:')) {
      setImagePreview(formData.image_url);
    } else if (formData.image_url && formData.image_url.startsWith('http')) {
      setImagePreview(formData.image_url);
    } else {
      setImagePreview(null);
    }
  }, [formData.image_url]);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[AdminBebeServices] Loading services from Supabase');
      
      const { data, error } = await supabase
        .from('bebe_settings')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        console.error('[AdminBebeServices] Error loading services:', error);
        setError('Erreur lors du chargement des services: ' + error.message);
        return;
      }

      console.log('[AdminBebeServices] Loaded services:', data?.length || 0);
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[AdminBebeServices] Exception loading services:', err);
      setError('Erreur de connexion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      console.log('[AdminBebeServices] Loading categories from Supabase');
      
      const { data, error } = await supabase
        .from('bebe_categories')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });

      if (error) {
        console.error('[AdminBebeServices] Error loading categories:', error);
        return;
      }

      console.log('[AdminBebeServices] Loaded categories:', data?.length || 0);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[AdminBebeServices] Exception loading categories:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const compressImage = (file, maxWidth = 400, quality = 0.5) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // حساب الأبعاد الجديدة مع الحفاظ على النسبة
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // رسم الصورة المضغوطة
        ctx.drawImage(img, 0, 0, width, height);
        
        // تحويل إلى base64 مع ضغط أكثر
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // تحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner un fichier image valide');
        return;
      }
      
      // تحقق من حجم الملف (3MB)
      if (file.size > 3 * 1024 * 1024) {
        setError('La taille du fichier ne doit pas dépasser 3MB');
        return;
      }
      
      setImageFile(file);
      
      try {
        // ضغط الصورة بشكل أكثر عدوانية
        let compressedImage = await compressImage(file, 400, 0.5);
        
        // إذا كان الحجم لا يزال كبيراً جداً، جرب ضغط أكثر
        if (compressedImage.length > 500000) { // أكثر من 500KB
          console.log('Image trop grande, compression supplémentaire...');
          compressedImage = await compressImage(file, 300, 0.3);
        }
        
        // إذا كان لا يزال كبيراً، جرب ضغط أقصى
        if (compressedImage.length > 500000) {
          console.log('Compression maximale...');
          compressedImage = await compressImage(file, 200, 0.2);
        }
        
        // إذا كان لا يزال كبيراً جداً، تجاهل الصورة
        if (compressedImage.length > 1000000) { // أكثر من 1MB
          console.log('Image trop grande même après compression, ignorée');
          setError('L\'image est trop grande même après compression. Veuillez choisir une image plus petite.');
          setImageFile(null);
          setImagePreview(null);
          setFormData(prev => ({
            ...prev,
            image_url: ''
          }));
          return;
        }
        
        setImagePreview(compressedImage);
        
        // حفظ base64 المضغوط في formData
        setFormData(prev => ({
          ...prev,
          image_url: compressedImage
        }));
        
        console.log('Image compressée avec succès, taille:', compressedImage.length);
      } catch (error) {
        console.error('Erreur lors de la compression:', error);
        setError('Erreur lors du traitement de l\'image');
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      image_url: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // تحقق من صحة البيانات
    if (!formData.name.trim() && !formData.name_fr.trim()) {
      setError('Le nom du service est requis');
      return;
    }
    const priceValue = typeof formData.price === 'string' ? formData.price.trim() : String(formData.price || '');
    if (!priceValue || isNaN(parseFloat(priceValue))) {
      setError('Le prix est requis et doit être un nombre valide');
      return;
    }
    if (!formData.duration.trim()) {
      setError('La durée est requise');
      return;
    }
    if (!formData.bebe_category_id) {
      setError('La catégorie est requise');
      return;
    }
    
    // تحقق إضافي من صحة البيانات
    if (formData.name.trim().length < 2) {
      setError('Le nom du service doit contenir au moins 2 caractères');
      return;
    }
    if (formData.duration.trim().length < 1) {
      setError('La durée est requise');
      return;
    }
    
    // تحقق من صحة bebe_category_id
    const categoryId = parseInt(formData.bebe_category_id);
    if (isNaN(categoryId) || categoryId <= 0) {
      setError('Veuillez sélectionner une catégorie valide');
      return;
    }
    
    try {
      setError('');
      
      // Handle image upload to Supabase Storage if imageFile exists
      let photoUrl = formData.image_url || '';
      
      if (imageFile) {
        console.log('[AdminBebeServices] Uploading image to Supabase Storage');
        // Clean filename: remove special characters and spaces
        const cleanFileName = imageFile.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_')
          .toLowerCase();
        const fileName = `bebe_${Date.now()}_${cleanFileName}`;
        const filePath = fileName;
        
        // Upload to Supabase Storage (employees bucket)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employees')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('[AdminBebeServices] Error uploading image:', uploadError);
          // If upload fails, try to use base64 if available
          if (formData.image_url && formData.image_url.startsWith('data:')) {
            photoUrl = formData.image_url;
            console.log('[AdminBebeServices] Using base64 image as fallback');
          } else {
            setError('Erreur lors du téléchargement de l\'image: ' + uploadError.message);
            return;
          }
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('employees')
            .getPublicUrl(filePath);
          photoUrl = publicUrl;
          console.log('[AdminBebeServices] Image uploaded successfully:', photoUrl);
        }
      }
      
      // تحضير البيانات للإرسال (تطابق مع هيكل قاعدة البيانات)
      const submitData = {
        nom: (formData.name_fr || formData.name || '').trim(),
        name_ar: formData.name_ar?.trim() || null,
        name_fr: formData.name_fr?.trim() || null,
        name_en: formData.name_en?.trim() || null,
        description: formData.description?.trim() || null,
        description_ar: formData.description_ar?.trim() || null,
        description_fr: formData.description_fr?.trim() || null,
        description_en: formData.description_en?.trim() || null,
        slug: formData.slug?.trim() || null,
        price: parseFloat(typeof formData.price === 'string' ? formData.price.trim() : String(formData.price || '0')) || 0,
        duration: formData.duration.trim(),
        category_id: parseInt(formData.bebe_category_id),
        photo: photoUrl,
        is_active: Boolean(formData.is_active),
        order: parseInt(formData.order) || 0
      };
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('[AdminBebeServices] User not authenticated:', sessionError);
        setError('Vous devez être connecté pour sauvegarder. Veuillez vous reconnecter.');
        return;
      }
      
      console.log('[AdminBebeServices] User authenticated:', session.user.email);
      console.log('[AdminBebeServices] Submitting service:', { editing: !!editingService, id: editingService?.id, submitData });
      
      let data, error;
      if (editingService) {
        // Update existing service
        const { data: updateData, error: updateError } = await supabase
          .from('bebe_settings')
          .update(submitData)
          .eq('id', editingService.id)
          .select();
        data = updateData;
        error = updateError;
      } else {
        // Insert new service
        const { data: insertData, error: insertError } = await supabase
          .from('bebe_settings')
          .insert(submitData)
          .select();
        data = insertData;
        error = insertError;
      }

      if (error) {
        console.error('[AdminBebeServices] Error saving service:', error);
        if (error.code === '42501') {
          setError('Erreur de permissions RLS. Veuillez exécuter FIX_BEBE_SETTINGS_RLS.sql dans Supabase SQL Editor.');
        } else {
          setError('Erreur lors de la sauvegarde: ' + error.message);
        }
        return;
      }

      console.log('[AdminBebeServices] Service saved successfully:', data);
      await loadServices();
      setShowForm(false);
      setEditingService(null);
      setFormData({ 
        name: '', 
        name_ar: '',
        name_fr: '',
        name_en: '',
        description: '', 
        description_ar: '',
        description_fr: '',
        description_en: '',
        slug: '',
        price: '', 
        duration: '', 
        bebe_category_id: '', 
        is_active: true, 
        image_url: '',
        order: 0
      });
      setImagePreview(null);
      setImageFile(null);
      setError('');
    } catch (err) {
      console.error('[AdminBebeServices] Exception saving service:', err);
      setError('Erreur inattendue: ' + err.message);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    const photoPath = service.photo || '';
    const photoUrl = photoPath ? getImageUrl(photoPath) : '';
    setFormData({
      name: service.nom || service.name || '',
      name_ar: service.name_ar || '',
      name_fr: service.name_fr || '',
      name_en: service.name_en || '',
      description: service.description || '',
      description_ar: service.description_ar || '',
      description_fr: service.description_fr || '',
      description_en: service.description_en || '',
      price: service.price || '',
      duration: service.duration || '',
      bebe_category_id: service.category_id || '',
      is_active: service.is_active !== undefined ? service.is_active : true,
      image_url: photoUrl || photoPath || '',
      slug: service.slug || '',
      order: service.order || 0
    });
    setImagePreview(photoUrl || photoPath || null);
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        console.log('[AdminBebeServices] Deleting service:', id);
        
        const { error } = await supabase
          .from('bebe_settings')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('[AdminBebeServices] Error deleting service:', error);
          setError('Erreur lors de la suppression: ' + error.message);
          return;
        }

        console.log('[AdminBebeServices] Service deleted successfully');
        await loadServices();
      } catch (err) {
        console.error('[AdminBebeServices] Exception deleting service:', err);
        setError('Erreur de connexion: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
    setFormData({ 
      name: '', 
      name_ar: '',
      name_fr: '',
      name_en: '',
      description: '', 
      description_ar: '',
      description_fr: '',
      description_en: '',
      slug: '',
      price: '', 
      duration: '', 
      bebe_category_id: '', 
      is_active: true, 
      image_url: '',
      order: 0
    });
    setImagePreview(null);
    setImageFile(null);
    setError('');
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Catégorie inconnue';
  };

  const filteredServices = services.filter(service => {
    const serviceName = service.name || '';
    const serviceDescription = service.description || '';
    const matchesSearch = serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         serviceDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || service.bebe_category_id == filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && service.is_active) ||
                         (filterStatus === 'inactive' && !service.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-bebe-services">
        <div className="loading">Chargement des services...</div>
      </div>
    );
  }

  return (
    <div className="admin-bebe-services">
      <div className="admin-header">
        <h2>🍼 Gestion des Services Bébé Setting</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          ➕ Ajouter un service
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
            placeholder="Rechercher un service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">Toutes les catégories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <div className="form-header">
              <h3>{editingService ? 'Modifier le service' : 'Nouveau service'}</h3>
              <button className="close-btn" onClick={handleCancel}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="service-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Nom du service *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Soins du nouveau-né"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="price">Prix (MAD) *</label>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: 150.00"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Durée *</label>
                  <input
                    type="text"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: 2-3 heures, 4 heures, etc."
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="bebe_category_id">Catégorie *</label>
                  <select
                    id="bebe_category_id"
                    name="bebe_category_id"
                    value={formData.bebe_category_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Description du service..."
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
                <label htmlFor="image_url">Image du service</label>
                <div className="image-upload-container">
                  <div className="image-input-row">
                    <input
                      type="url"
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      className="image-url-input"
                    />
                    <div className="upload-buttons">
                      <input
                        type="file"
                        id="image_upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="image_upload" className="upload-btn">
                        📁 Choisir une image
                      </label>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={removeImage}
                          className="remove-image-btn"
                        >
                          🗑️ Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                  {imagePreview && (
                    <div className="image-preview">
                      <img 
                        src={imagePreview} 
                        alt="Aperçu" 
                        onError={(e) => {
                          console.log('Preview image failed to load:', imagePreview);
                          e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Preview image loaded successfully');
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
                  Service actif
                </label>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingService ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="services-table-container">
        <table className="services-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Durée</th>
              <th>Statut</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  Aucun service trouvé
                </td>
              </tr>
            ) : (
              filteredServices.map(service => (
                <tr key={service.id}>
                  <td>{service.id}</td>
                  <td className="service-image">
                    {(() => {
                      const imagePath = service.photo || service.image_url;
                      const imageUrl = imagePath ? getImageUrl(imagePath) : null;
                      return imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={service.nom || service.name}
                          className="service-img"
                          onError={(e) => {
                            console.log('[AdminBebeServices] Image failed to load:', imageUrl, 'Original path:', imagePath);
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'block';
                            }
                          }}
                          onLoad={() => {
                            console.log('[AdminBebeServices] Image loaded successfully:', imageUrl);
                          }}
                        />
                      ) : null;
                    })()}
                    <div className="service-img-placeholder" style={{display: (service.photo || service.image_url) ? 'none' : 'block'}}>
                      👶
                    </div>
                  </td>
                  <td className="service-name">{service.nom || service.name || 'N/A'}</td>
                  <td className="service-category">{getCategoryName(service.category_id || service.bebe_category_id)}</td>
                  <td className="service-price">{service.price || 'N/A'} MAD</td>
                  <td className="service-duration">{service.duration || 'N/A'}</td>
                  <td>
                    <span className={`status ${service.is_active ? 'active' : 'inactive'}`}>
                      {service.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>{new Date(service.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(service)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(service.id)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
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
            <div className="stat-number">{services.length}</div>
            <div className="stat-label">Total des services</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{services.filter(s => s.is_active).length}</div>
            <div className="stat-label">Services actifs</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-number">
              {services.reduce((sum, service) => sum + parseFloat(service.price || 0), 0).toFixed(0)}
            </div>
            <div className="stat-label">Prix total (MAD)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBebeServicesCrud;

import React, { useState, useEffect } from 'react';
import './AdminJardinageServicesCrud.css';
import { supabase } from '../../lib/supabase';

const AdminJardinageServicesCrud = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    jardinage_category_id: '',
    is_active: true,
    image_url: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadServices();
    loadCategories();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[AdminJardinageServices] Loading services from Supabase');
      
      const { data, error } = await supabase
        .from('jardins')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[AdminJardinageServices] Error loading services:', error);
        setError('Erreur lors du chargement des services: ' + error.message);
        return;
      }
      
      console.log('[AdminJardinageServices] Loaded services:', data?.length || 0);
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[AdminJardinageServices] Exception loading services:', err);
      setError('Erreur de connexion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      console.log('[AdminJardinageServices] Loading categories from Supabase');
      
      const { data, error } = await supabase
        .from('jardinage_categories')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) {
        console.error('[AdminJardinageServices] Error loading categories:', error);
        return;
      }
      
      console.log('[AdminJardinageServices] Loaded categories:', data?.length || 0);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[AdminJardinageServices] Exception loading categories:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // If URL is entered, clear file selection
    if (name === 'image_url' && value.trim() !== '') {
      setSelectedImage(null);
      setImagePreview(value.trim());
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner un fichier image valide');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Le fichier est trop volumineux. Taille maximale: 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear URL field when file is selected
      setFormData(prev => ({
        ...prev,
        image_url: ''
      }));
      
      // Show success message
      setError('');
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      image_url: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      // Validate required fields
      if (!formData.name || !formData.price || !formData.duration || !formData.jardinage_category_id) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }
      
      // Handle image upload to Supabase Storage if selectedImage exists
      let imageUrl = formData.image_url || '';
      
      if (selectedImage) {
        console.log('[AdminJardinageServices] Uploading image to Supabase Storage');
        // Clean filename
        const cleanFileName = selectedImage.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_')
          .toLowerCase();
        const fileName = `jardin_${Date.now()}_${cleanFileName}`;
        const filePath = fileName;
        
        // Upload to Supabase Storage (employees bucket)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employees')
          .upload(filePath, selectedImage, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('[AdminJardinageServices] Error uploading image:', uploadError);
          setError('Erreur lors du téléchargement de l\'image: ' + uploadError.message);
          return;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('employees')
          .getPublicUrl(filePath);
        imageUrl = publicUrl;
        console.log('[AdminJardinageServices] Image uploaded successfully:', imageUrl);
      }
      
      // Prepare data for submission
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        jardinage_category_id: parseInt(formData.jardinage_category_id),
        is_active: formData.is_active || true,
        image_url: imageUrl || null
      };
      
      console.log('[AdminJardinageServices] Submitting service:', { editing: !!editingService, id: editingService?.id, payload });
      
      let data, error;
      if (editingService) {
        const { data: updateData, error: updateError } = await supabase
          .from('jardins')
          .update(payload)
          .eq('id', editingService.id)
          .select();
        data = updateData;
        error = updateError;
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('jardins')
          .insert(payload)
          .select();
        data = insertData;
        error = insertError;
      }
      
      if (error) {
        console.error('[AdminJardinageServices] Error saving service:', error);
        setError('Erreur lors de la sauvegarde: ' + error.message);
        return;
      }
      
      console.log('[AdminJardinageServices] Service saved successfully:', data);
      await loadServices();
      setShowForm(false);
      setEditingService(null);
      setSelectedImage(null);
      setImagePreview(null);
      setFormData({ 
        name: '', 
        description: '', 
        price: '', 
        duration: '', 
        jardinage_category_id: '', 
        is_active: true, 
        image_url: '' 
      });
      setError('');
    } catch (err) {
      console.error('[AdminJardinageServices] Exception saving service:', err);
      setError('Erreur de connexion: ' + err.message);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      jardinage_category_id: service.jardinage_category_id,
      is_active: service.is_active,
      image_url: service.image_url || ''
    });
    setSelectedImage(null);
    // Set preview to existing image URL if available
    if (service.image_url) {
      setImagePreview(service.image_url);
    } else {
      setImagePreview(null);
    }
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        console.log('[AdminJardinageServices] Deleting service:', id);
        
        const { error } = await supabase
          .from('jardins')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('[AdminJardinageServices] Error deleting service:', error);
          setError('Erreur lors de la suppression: ' + error.message);
          return;
        }
        
        console.log('[AdminJardinageServices] Service deleted successfully');
        await loadServices();
      } catch (err) {
        console.error('[AdminJardinageServices] Exception deleting service:', err);
        setError('Erreur de connexion: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
    setFormData({ 
      name: '', 
      description: '', 
      price: '', 
      duration: '', 
      jardinage_category_id: '', 
      is_active: true, 
      image_url: '' 
    });
    setSelectedImage(null);
    setImagePreview(null);
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
    const matchesCategory = filterCategory === 'all' || service.jardinage_category_id == filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && service.is_active) ||
                         (filterStatus === 'inactive' && !service.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-jardinage-services">
        <div className="loading">Chargement des services...</div>
      </div>
    );
  }

  return (
    <div className="admin-jardinage-services">
      <div className="admin-header">
        <h2>🌿 Gestion des Services Jardinage</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          ➕ Ajouter un service
        </button>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div className="error-text">
              {error.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          </div>
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
                    placeholder="Ex: Taille des haies"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="price">Prix (MAD) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Ex: 200.00"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Durée (heures) *</label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="12"
                    placeholder="Ex: 3"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="jardinage_category_id">Catégorie *</label>
                  <select
                    id="jardinage_category_id"
                    name="jardinage_category_id"
                    value={formData.jardinage_category_id}
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
              
              <div className="form-group">
                <label htmlFor="image_url">📁 Image du service</label>
                <div className="unified-image-upload">
                  <button
                    type="button"
                    className="unified-upload-button"
                    onClick={() => document.getElementById('file-input').click()}
                  >
                    <span className="upload-icon">📁</span>
                    <span className="upload-text">Choisir une image ou coller un lien</span>
                  </button>
                  
                  <input
                    type="file"
                    id="file-input"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  
                  <div className="url-input-container">
                    <input
                      type="url"
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      placeholder="Ou collez un lien d'image ici..."
                      className="url-input"
                    />
                  </div>
                  
                  {(imagePreview || selectedImage) && (
                    <div className="image-preview-container">
                      <div className="preview-header">
                        <span className="preview-title">Aperçu de l'image</span>
                        <button
                          type="button"
                          onClick={removeSelectedImage}
                          className="remove-image-btn"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                      <div className="image-preview">
                        <img 
                          src={imagePreview} 
                          alt="Aperçu" 
                          className="preview-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="image-error" style={{display: 'none'}}>
                          ❌ Impossible de charger l'image
                        </div>
                      </div>
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
                    {service.image_url ? (
                      <img 
                        src={service.image_url} 
                        alt={service.name}
                        className="service-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <div className="service-img-placeholder" style={{display: service.image_url ? 'none' : 'block'}}>
                      🌱
                    </div>
                  </td>
                  <td className="service-name">{service.name}</td>
                  <td className="service-category">{getCategoryName(service.jardinage_category_id)}</td>
                  <td className="service-price">{service.price} MAD</td>
                  <td className="service-duration">{service.duration}h</td>
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

export default AdminJardinageServicesCrud;

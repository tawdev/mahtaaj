import React, { useState, useEffect } from 'react';
import LanguageFields from '../../components/LanguageFields';
import { getServicesAdmin, createServiceAdmin, updateServiceAdmin, deleteServiceAdmin } from '../../api-supabase';
import { supabase } from '../../lib/supabase';
import getServiceIcon from '../../utils/serviceIcons';
import './AdminServicesCrud.css';

export default function AdminServicesCrud({ token }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    name_ar: '',
    name_fr: '',
    name_en: '',
    description_ar: '',
    description_fr: '',
    description_en: '',
    slug: '',
    image: '',
    is_active: true,
    sort_order: 0,
    order: 0
  });


  useEffect(() => {
    loadServices();
  }, [token]);

  // Upload image to Supabase Storage
  const uploadImage = async (file) => {
    try {
      setUploadingImage(true);
      
      const fileName = `service_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      const filePath = fileName;

      console.log('[AdminServices] Uploading image:', fileName, 'to bucket: employees');

      const { data, error } = await supabase.storage
        .from('employees')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('[AdminServices] Upload error:', error);
        
        if (error.message?.includes('Bucket not found') || error.statusCode === '404') {
          throw new Error('Bucket "employees" غير موجود. يرجى إنشاء bucket "employees" في Supabase Storage أولاً.');
        }
        
        throw error;
      }

      console.log('[AdminServices] Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('employees')
        .getPublicUrl(filePath);

      console.log('[AdminServices] Image uploaded successfully, public URL:', publicUrl);

      if (publicUrl) {
        setFormData(prev => ({ ...prev, image: publicUrl }));
        setImageFile(null);
        return publicUrl;
      }
      
      throw new Error('Aucune URL d\'image retournée');
    } catch (err) {
      console.error('[AdminServices] Erreur lors du téléchargement de l\'image:', err);
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
    const fileInput = document.getElementById('service_image_upload');
    if (fileInput) fileInput.value = '';
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getServicesAdmin(token);
      setServices(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      console.error('Error loading services:', e);
      setError('Impossible de charger les services: ' + (e.message || 'Erreur inconnue'));
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // At least one name field is required
    if (!formData.name_fr && !formData.name_ar && !formData.name_en && !formData.title) {
      setError('Veuillez entrer au moins un nom (FR, AR, EN ou titre)');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      // Handle image upload if imageFile exists
      let imageUrl = formData.image || null;
      if (imageFile && !uploadingImage) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          setSubmitting(false);
          return;
        }
      }

      // Prepare data - remove empty strings and null values
      const cleanData = {
        name_fr: formData.name_fr?.trim() || null,
        name_ar: formData.name_ar?.trim() || null,
        name_en: formData.name_en?.trim() || null,
        description_fr: formData.description_fr?.trim() || null,
        description_ar: formData.description_ar?.trim() || null,
        description_en: formData.description_en?.trim() || null,
        slug: formData.slug?.trim() || null,
        image: imageUrl || null,
        is_active: formData.is_active !== false,
        sort_order: parseInt(formData.sort_order) || 0,
        order: parseInt(formData.order) || 0
      };

      // Add title and description as fallback if provided
      if (formData.title?.trim()) {
        cleanData.title = formData.title.trim();
      }
      if (formData.description?.trim()) {
        cleanData.description = formData.description.trim();
      }

      if (editingService) {
        await updateServiceAdmin(token, editingService.id, cleanData);
        setSuccessMessage('Service modifié avec succès!');
      } else {
        await createServiceAdmin(token, cleanData);
        setSuccessMessage('Service créé avec succès!');
      }
      
      setShowForm(false);
      setEditingService(null);
      setImageFile(null);
      setImagePreview(null);
      setFormData({ title: '', description: '', name_ar:'', name_fr:'', name_en:'', description_ar:'', description_fr:'', description_en:'', slug:'', image: '', is_active: true, sort_order: 0, order: 0 });
      
      setTimeout(() => {
        setSuccessMessage('');
        loadServices();
      }, 1000);
    } catch (e) {
      console.error('Error saving service:', e);
      const errorMessage = e.message || e.error?.message || 'Erreur lors de la sauvegarde';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title || '',
      description: service.description || '',
      name_ar: service.name_ar || '',
      name_fr: service.name_fr || '',
      name_en: service.name_en || '',
      description_ar: service.description_ar || '',
      description_fr: service.description_fr || '',
      description_en: service.description_en || '',
      slug: service.slug || '',
      image: service.image || '',
      is_active: service.is_active !== false,
      sort_order: service.sort_order || 0,
      order: service.order || 0
    });
    setImageFile(null);
    setImagePreview(service.image || null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.')) {
      return;
    }
    
    setError('');
    setSuccessMessage('');
    
    try {
      console.log('Deleting service with ID:', id);
      const result = await deleteServiceAdmin(token, id);
      
      if (result && result.deleted) {
        // Remove from local state immediately for better UX
        setServices(prevServices => prevServices.filter(service => service.id !== id));
        
        // Show appropriate message based on deletion type
        if (result.softDeleted) {
          setSuccessMessage('Service désactivé avec succès! (Note: Vérifiez les permissions RLS pour la suppression complète)');
        } else {
          setSuccessMessage('Service supprimé avec succès!');
        }
        
        // Reload services to ensure sync with database
        setTimeout(() => {
          setSuccessMessage('');
          loadServices();
        }, 2000);
      } else {
        // If deletion didn't confirm, reload to check
        loadServices();
        setError('Impossible de confirmer la suppression. Actualisation de la liste...');
        setTimeout(() => setError(''), 3000);
      }
    } catch (e) {
      console.error('Error deleting service:', e);
      const errorMessage = e.message || e.error?.message || 'Erreur lors de la suppression';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
      
      // Reload services even on error to ensure UI is in sync
      loadServices();
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
    setImageFile(null);
    setImagePreview(null);
    setFormData({ title: '', description: '', name_ar:'', name_fr:'', name_en:'', description_ar:'', description_fr:'', description_en:'', slug:'', image: '', is_active: true, sort_order: 0, order: 0 });
  };


  const toggleActive = async (service) => {
    setError('');
    setSuccessMessage('');
    
    try {
      const newStatus = !service.is_active;
      await updateServiceAdmin(token, service.id, { is_active: newStatus });
      setSuccessMessage(`Service ${newStatus ? 'activé' : 'désactivé'} avec succès!`);
      setTimeout(() => {
        setSuccessMessage('');
        loadServices();
      }, 1000);
    } catch (e) {
      console.error('Error toggling service status:', e);
      const errorMessage = e.message || e.error?.message || 'Erreur lors de la modification';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) return <div className="admin-services-loading">Chargement des services...</div>;

  return (
    <div className="admin-services-crud">
      {error && (
        <div className="admin-services-error" onClick={() => setError('')}>
          {error}
          <span className="admin-services-error-close">×</span>
        </div>
      )}
      {successMessage && (
        <div className="admin-services-success">
          {successMessage}
          <span className="admin-services-success-close" onClick={() => setSuccessMessage('')}>×</span>
        </div>
      )}
      <div className="admin-services-header">
        <h2 className="admin-services-title">Gestion des Services</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="admin-services-add-button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nouveau Service
        </button>
      </div>

      {showForm && (
        <div className="admin-services-form-overlay">
          <div className="admin-services-form">
            <h3>{editingService ? 'Modifier' : 'Créer'} un Service</h3>
            <form onSubmit={handleSubmit}>
              <div className="admin-services-field">
                <label>Icône affichée</label>
                <div className="admin-services-icon-display">
                  <span className="admin-services-selected-icon" title="Icône dérivée automatiquement">
                    {getServiceIcon({
                      slug: formData.slug,
                      name_fr: formData.name_fr,
                      name_en: formData.name_en,
                      name_ar: formData.name_ar,
                      title: formData.title
                    })}
                  </span>
                  <small style={{color:'#64748b'}}>
                    L'icône est déterminée automatiquement selon le nom/slug du service.
                  </small>
                </div>
              </div>

              <div className="admin-services-field">
                <label htmlFor="service_image_upload">Image du service</label>
                <div className="image-upload-container">
                  {imagePreview && (
                    <div className="image-preview-container">
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                      <button type="button" onClick={removeImage} className="remove-image-btn">×</button>
                    </div>
                  )}
                  <input
                    type="file"
                    id="service_image_upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="service_image_upload"
                    className="upload-image-btn"
                    style={{
                      background: uploadingImage ? '#94a3b8' : '#2563eb',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: uploadingImage ? 'not-allowed' : 'pointer',
                      display: 'inline-block',
                      marginTop: '10px'
                    }}
                  >
                    {uploadingImage ? '⏳ Téléchargement...' : '📁 Télécharger une image'}
                  </label>
                  {formData.image && !imagePreview && (
                    <div className="image-preview-container" style={{ marginTop: '10px' }}>
                      <img src={formData.image} alt="Current" className="image-preview" />
                      <button type="button" onClick={removeImage} className="remove-image-btn">×</button>
                    </div>
                  )}
                </div>
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
                onChange={(v) => setFormData({
                  ...formData,
                  ...v
                })}
                includeDescription={true}
                required={false}
              />

              <div className="admin-services-field">
                <label htmlFor="title">Titre (fallback)</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Nom du service (fallback)"
                />
              </div>

              <div className="admin-services-field">
                <label htmlFor="description">Description (fallback)</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                  placeholder="Description du service (fallback)"
                />
              </div>
              
              <div className="admin-services-field">
                <label htmlFor="sort_order">Ordre d'affichage</label>
                <input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>

              <div className="admin-services-field">
                <label htmlFor="order">Ordre secondaire</label>
                <input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>
              
              <div className="admin-services-field">
                <label className="admin-services-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  Service actif
                </label>
              </div>
              
              <div className="admin-services-form-actions">
                <button 
                  type="submit" 
                  className="admin-services-save-button"
                  disabled={submitting}
                >
                  {submitting ? 'Enregistrement...' : (editingService ? 'Modifier' : 'Créer')}
                </button>
                <button 
                  type="button" 
                  onClick={handleCancel} 
                  className="admin-services-cancel-button"
                  disabled={submitting}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <div className="admin-services-empty">
          <p>Aucun service disponible. Cliquez sur "Nouveau Service" pour en créer un.</p>
        </div>
      ) : (
        <div className="admin-services-grid">
          {services.map((service) => {
            // Get the service name - prioritize multilingual fields, fallback to title
            const serviceName = service.name_fr || service.name_ar || service.name_en || service.title || 'Service sans nom';
            
            // Get the service description - prioritize multilingual fields, fallback to description
            const serviceDescription = service.description_fr || service.description_ar || service.description_en || service.description || 'Aucune description';
            
            return (
              <div key={service.id} className={`admin-services-card ${!service.is_active ? 'inactive' : ''}`}>
                {service.image && (
                  <div className="admin-services-card-image">
                    <img src={service.image} alt={serviceName} />
                  </div>
                )}
                <div className="admin-services-card-header">
                  <span className="admin-services-icon" title="Icône dérivée automatiquement">
                    {getServiceIcon(service)}
                  </span>
                  <div className="admin-services-actions">
                    <button 
                      onClick={() => toggleActive(service)}
                      className={`admin-services-toggle ${service.is_active ? 'active' : 'inactive'}`}
                      title={service.is_active ? 'Désactiver' : 'Activer'}
                    >
                      {service.is_active ? '✓' : '✗'}
                    </button>
                    <button 
                      onClick={() => handleEdit(service)}
                      className="admin-services-edit-button"
                    >
                      Modifier
                    </button>
                    <button 
                      onClick={() => handleDelete(service.id)}
                      className="admin-services-delete-button"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <h4 className="admin-services-card-title">{serviceName}</h4>
                <p className="admin-services-card-description">{serviceDescription}</p>
                <div className="admin-services-card-meta">
                  <span className="admin-services-order">Ordre: {service.sort_order || service.order || 0}</span>
                  <span className={`admin-services-status ${service.is_active ? 'active' : 'inactive'}`}>
                    {service.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

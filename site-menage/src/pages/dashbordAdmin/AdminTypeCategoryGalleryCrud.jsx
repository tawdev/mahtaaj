import React, { useState, useEffect } from 'react';
import './AdminTypeCategoryGalleryCrud.css';
import { supabase } from '../../lib/supabase';

const AdminTypeCategoryGalleryCrud = ({ token, onAuthError }) => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name_ar: '',
    name_fr: '',
    name_en: '',
    slug: '',
    description_ar: '',
    description_fr: '',
    description_en: '',
    is_active: true,
    order: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('type_category_gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading types:', error);
        setError('Erreur lors du chargement des types: ' + error.message);
        return;
      }

      setTypes(data || []);
    } catch (err) {
      console.error('Exception loading types:', err);
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
      
      let data, error;
      
      if (editingType) {
        // Update existing type
        const { data: updateData, error: updateError } = await supabase
          .from('type_category_gallery')
          .update(formData)
          .eq('id', editingType.id)
          .select();
        data = updateData && updateData.length > 0 ? updateData[0] : null;
        error = updateError;
      } else {
        // Create new type
        const { data: insertData, error: insertError } = await supabase
          .from('type_category_gallery')
          .insert([formData])
          .select();
        data = insertData && insertData.length > 0 ? insertData[0] : null;
        error = insertError;
      }

      if (error) {
        console.error('Error saving type:', error);
        showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
        return;
      }

      showNotification(editingType ? 'Type mis à jour avec succès' : 'Type créé avec succès');
      await loadTypes();
      setShowForm(false);
      setEditingType(null);
      resetForm();
    } catch (err) {
      console.error('Exception saving type:', err);
      showNotification('Erreur de connexion: ' + err.message, 'error');
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name_ar: type.name_ar || '',
      name_fr: type.name_fr || '',
      name_en: type.name_en || '',
      slug: type.slug || '',
      description_ar: type.description_ar || '',
      description_fr: type.description_fr || '',
      description_en: type.description_en || '',
      is_active: type.is_active !== undefined ? type.is_active : true,
      order: type.order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce type ?')) {
      try {
        setError('');
        
        const { error } = await supabase
          .from('type_category_gallery')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting type:', error);
          showNotification('Erreur lors de la suppression: ' + error.message, 'error');
          return;
        }

        showNotification('Type supprimé avec succès');
        await loadTypes();
      } catch (err) {
        console.error('Exception deleting type:', err);
        showNotification('Erreur de connexion: ' + err.message, 'error');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingType(null);
    resetForm();
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setFormData({
      name_ar: '',
      name_fr: '',
      name_en: '',
      slug: '',
      description_ar: '',
      description_fr: '',
      description_en: '',
      is_active: true,
      order: 0
    });
  };

  const filteredTypes = types.filter(type => {
    const matchesSearch = 
      (type.name_ar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (type.name_fr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (type.name_en || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && type.is_active) ||
      (filterStatus === 'inactive' && !type.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-gallery-types">
        <div className="loading">Chargement des types...</div>
      </div>
    );
  }

  return (
    <div className="admin-gallery-types">
      <div className="admin-crud-header">
        <h2>Gestion des Types de Galerie</h2>
        <button className="btn-add" onClick={() => { setShowForm(true); setEditingType(null); resetForm(); }}>
          + Ajouter un Type
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
            <h3>{editingType ? 'Modifier le Type' : 'Ajouter un Type'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom (Arabe) *</label>
                  <input
                    type="text"
                    name="name_ar"
                    value={formData.name_ar}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nom (Français) *</label>
                  <input
                    type="text"
                    name="name_fr"
                    value={formData.name_fr}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nom (Anglais) *</label>
                  <input
                    type="text"
                    name="name_en"
                    value={formData.name_en}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Slug (optionnel)</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="Auto-généré si vide"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Description (Arabe)</label>
                  <textarea
                    name="description_ar"
                    value={formData.description_ar}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Description (Français)</label>
                  <textarea
                    name="description_fr"
                    value={formData.description_fr}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Description (Anglais)</label>
                  <textarea
                    name="description_en"
                    value={formData.description_en}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
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
                  {editingType ? 'Mettre à jour' : 'Créer'}
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
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom (FR)</th>
              <th>Nom (AR)</th>
              <th>Slug</th>
              <th>Ordre</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTypes.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">Aucun type trouvé</td>
              </tr>
            ) : (
              filteredTypes.map((type) => (
                <tr key={type.id}>
                  <td>{type.id}</td>
                  <td>{type.name_fr}</td>
                  <td>{type.name_ar}</td>
                  <td>{type.slug}</td>
                  <td>{type.order}</td>
                  <td>
                    <span className={`status ${type.is_active ? 'active' : 'inactive'}`}>
                      {type.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(type)}>
                      Modifier
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(type.id)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTypeCategoryGalleryCrud;


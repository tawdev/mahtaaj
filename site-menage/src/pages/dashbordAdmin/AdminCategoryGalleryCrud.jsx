import React, { useState, useEffect } from 'react';
import './AdminCategoryGalleryCrud.css';
import { supabase } from '../../lib/supabase';

const AdminCategoryGalleryCrud = ({ token, onAuthError }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
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
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('category_gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading categories:', error);
        setError('Erreur lors du chargement des catégories: ' + error.message);
        return;
      }

      setCategories(data || []);
    } catch (err) {
      console.error('Exception loading categories:', err);
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
      
      const categoryData = {
        name_ar: formData.name_ar || null,
        name_fr: formData.name_fr || null,
        name_en: formData.name_en || null,
        slug: formData.slug || null,
        description_ar: formData.description_ar || null,
        description_fr: formData.description_fr || null,
        description_en: formData.description_en || null,
        is_active: formData.is_active,
        order: parseInt(formData.order) || 0
      };

      let data, error;
      
      if (editingCategory) {
        // Update existing category
        const { data: updateData, error: updateError } = await supabase
          .from('category_gallery')
          .update(categoryData)
          .eq('id', editingCategory.id)
          .select();
        data = updateData && updateData.length > 0 ? updateData[0] : null;
        error = updateError;
      } else {
        // Create new category
        const { data: insertData, error: insertError } = await supabase
          .from('category_gallery')
          .insert([categoryData])
          .select();
        data = insertData && insertData.length > 0 ? insertData[0] : null;
        error = insertError;
      }

      if (error) {
        console.error('Error saving category:', error);
        showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
        return;
      }

      showNotification(editingCategory ? 'Catégorie mise à jour avec succès' : 'Catégorie créée avec succès');
      await loadCategories();
      setShowForm(false);
      setEditingCategory(null);
      resetForm();
    } catch (err) {
      console.error('Exception saving category:', err);
      showNotification('Erreur de connexion: ' + err.message, 'error');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name_ar: category.name_ar || '',
      name_fr: category.name_fr || '',
      name_en: category.name_en || '',
      slug: category.slug || '',
      description_ar: category.description_ar || '',
      description_fr: category.description_fr || '',
      description_en: category.description_en || '',
      is_active: category.is_active !== undefined ? category.is_active : true,
      order: category.order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        setError('');
        
        const { error } = await supabase
          .from('category_gallery')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting category:', error);
          showNotification('Erreur lors de la suppression: ' + error.message, 'error');
          return;
        }

        showNotification('Catégorie supprimée avec succès');
        await loadCategories();
      } catch (err) {
        console.error('Exception deleting category:', err);
        showNotification('Erreur de connexion: ' + err.message, 'error');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
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

  const filteredCategories = categories.filter(category => {
    const matchesSearch = 
      (category.name_ar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.name_fr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.name_en || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && category.is_active) ||
      (filterStatus === 'inactive' && !category.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading && categories.length === 0) {
    return (
      <div className="admin-gallery-categories">
        <div className="loading">Chargement des catégories...</div>
      </div>
    );
  }

  return (
    <div className="admin-gallery-categories">
      <div className="admin-crud-header">
        <h2>Gestion des Catégories de Galerie</h2>
        <button className="btn-add" onClick={() => { setShowForm(true); setEditingCategory(null); resetForm(); }}>
          + Ajouter une Catégorie
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
            <h3>{editingCategory ? 'Modifier la Catégorie' : 'Ajouter une Catégorie'}</h3>
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
                  {editingCategory ? 'Mettre à jour' : 'Créer'}
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
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">Aucune catégorie trouvée</td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td>{category.id}</td>
                  <td>{category.name_fr}</td>
                  <td>{category.name_ar}</td>
                  <td>{category.slug}</td>
                  <td>{category.order}</td>
                  <td>
                    <span className={`status ${category.is_active ? 'active' : 'inactive'}`}>
                      {category.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(category)}>
                      Modifier
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(category.id)}>
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

export default AdminCategoryGalleryCrud;


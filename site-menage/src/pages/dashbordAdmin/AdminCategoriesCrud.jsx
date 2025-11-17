import React, { useState, useEffect } from 'react';
import './AdminJardinageCategoriesCrud.css';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';

export default function AdminCategoriesCrud({ token, onAuthError }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
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
        .from('categories')
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      let data, error;
      
      if (editingCategory) {
        // Update existing category
        const { data: updateData, error: updateError } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id)
          .select();
        data = updateData && updateData.length > 0 ? updateData[0] : null;
        error = updateError;
      } else {
        // Create new category
        const { data: insertData, error: insertError } = await supabase
          .from('categories')
          .insert([formData])
          .select();
        data = insertData && insertData.length > 0 ? insertData[0] : null;
        error = insertError;
      }

      if (error) {
        console.error('Error saving category:', error);
        setError('Erreur lors de la sauvegarde: ' + error.message);
        return;
      }

      await loadCategories();
      setShowForm(false);
      setEditingCategory(null);
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
        is_active: true, 
        order: 0 
      });
    } catch (err) {
      console.error('Exception saving category:', err);
      setError('Erreur de connexion: ' + err.message);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      name_ar: category.name_ar || '',
      name_fr: category.name_fr || '',
      name_en: category.name_en || '',
      description: category.description || '',
      description_ar: category.description_ar || '',
      description_fr: category.description_fr || '',
      description_en: category.description_en || '',
      slug: category.slug || '',
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
          .from('categories')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting category:', error);
          setError('Erreur lors de la suppression: ' + error.message);
          return;
        }

        await loadCategories();
      } catch (err) {
        console.error('Exception deleting category:', err);
        setError('Erreur de connexion: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
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
      is_active: true, 
      order: 0 
    });
    setError('');
  };

  const filteredCategories = categories.filter(category => {
    const categoryName = category.name || '';
    const categoryDescription = category.description || '';
    const matchesSearch = categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         categoryDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && category.is_active) ||
                         (filterStatus === 'inactive' && !category.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-jardinage-categories">
        <div className="loading">Chargement des catégories...</div>
      </div>
    );
  }

  return (
    <div className="admin-jardinage-categories">
      <div className="admin-header">
        <h2>📁 Gestion des Catégories</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          ➕ Ajouter une catégorie
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
            placeholder="Rechercher une catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
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
              <h3>{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
              <button className="close-btn" onClick={handleCancel}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label htmlFor="name">Nom de la catégorie *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Accessoire"
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
                <label htmlFor="slug">Slug</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="Ex: accessoire (auto-généré si vide)"
                />
              </div>

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
              
              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Modifier' : 'Ajouter'}
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
              <th>Nom</th>
              <th>Nom (AR)</th>
              <th>Nom (FR)</th>
              <th>Nom (EN)</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Statut</th>
              <th>Ordre</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="11" className="no-data">
                  Aucune catégorie trouvée
                </td>
              </tr>
            ) : (
              filteredCategories.map(category => (
                <tr key={category.id}>
                  <td>{category.id}</td>
                  <td className="category-name">{category.name || '-'}</td>
                  <td className="category-name">{category.name_ar || '-'}</td>
                  <td className="category-name">{category.name_fr || '-'}</td>
                  <td className="category-name">{category.name_en || '-'}</td>
                  <td className="category-slug">{category.slug || '-'}</td>
                  <td className="category-description">
                    {category.description || 'Aucune description'}
                  </td>
                  <td>
                    <span className={`status ${category.is_active ? 'active' : 'inactive'}`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{category.order || 0}</td>
                  <td>{new Date(category.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(category)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(category.id)}
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
            <div className="stat-number">{categories.length}</div>
            <div className="stat-label">Total des catégories</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{categories.filter(c => c.is_active).length}</div>
            <div className="stat-label">Catégories actives</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">{categories.filter(c => !c.is_active).length}</div>
            <div className="stat-label">Catégories inactives</div>
          </div>
        </div>
      </div>
    </div>
  );
}


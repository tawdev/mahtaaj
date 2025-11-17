import React, { useState, useEffect } from 'react';
import './AdminJardinageCategoriesCrud.css';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';

const AdminJardinageCategoriesCrud = () => {
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
    icon: '',
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
      
      console.log('[AdminJardinageCategories] Loading categories from Supabase');
      
      const { data, error } = await supabase
        .from('jardinage_categories')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) {
        console.error('[AdminJardinageCategories] Error loading categories:', error);
        setError('Erreur lors du chargement des catégories: ' + error.message);
        return;
      }
      
      console.log('[AdminJardinageCategories] Loaded categories:', data?.length || 0);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[AdminJardinageCategories] Exception loading categories:', err);
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
      
      const payload = {
        name: formData.name || formData.name_fr || formData.name_ar || formData.name_en || '',
        name_ar: formData.name_ar || '',
        name_fr: formData.name_fr || '',
        name_en: formData.name_en || '',
        description: formData.description || '',
        description_ar: formData.description_ar || '',
        description_fr: formData.description_fr || '',
        description_en: formData.description_en || '',
        icon: formData.icon || '',
        is_active: formData.is_active || true,
        order: formData.order || 0
      };
      
      console.log('[AdminJardinageCategories] Submitting category:', { editing: !!editingCategory, id: editingCategory?.id, payload });
      
      let data, error;
      if (editingCategory) {
        const { data: updateData, error: updateError } = await supabase
          .from('jardinage_categories')
          .update(payload)
          .eq('id', editingCategory.id)
          .select();
        data = updateData;
        error = updateError;
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('jardinage_categories')
          .insert(payload)
          .select();
        data = insertData;
        error = insertError;
      }
      
      if (error) {
        console.error('[AdminJardinageCategories] Error saving category:', error);
        setError('Erreur lors de la sauvegarde: ' + error.message);
        return;
      }
      
      console.log('[AdminJardinageCategories] Category saved successfully:', data);
      await loadCategories();
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', name_ar:'', name_fr:'', name_en:'', description: '', description_ar:'', description_fr:'', description_en:'', icon: '', is_active: true, order: 0 });
    } catch (err) {
      console.error('[AdminJardinageCategories] Exception saving category:', err);
      setError('Erreur de connexion: ' + err.message);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_ar: category.name_ar || '',
      name_fr: category.name_fr || '',
      name_en: category.name_en || '',
      description: category.description,
      description_ar: category.description_ar || '',
      description_fr: category.description_fr || '',
      description_en: category.description_en || '',
      icon: category.icon,
      is_active: category.is_active,
      order: category.order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        console.log('[AdminJardinageCategories] Deleting category:', id);
        
        const { error } = await supabase
          .from('jardinage_categories')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('[AdminJardinageCategories] Error deleting category:', error);
          setError('Erreur lors de la suppression: ' + error.message);
          return;
        }
        
        console.log('[AdminJardinageCategories] Category deleted successfully');
        await loadCategories();
      } catch (err) {
        console.error('[AdminJardinageCategories] Exception deleting category:', err);
        setError('Erreur de connexion: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', name_ar:'', name_fr:'', name_en:'', description: '', description_ar:'', description_fr:'', description_en:'', icon: '', is_active: true, order: 0 });
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
        <h2>🌿 Gestion des Catégories Jardinage</h2>
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
                  placeholder="Ex: Entretien du jardin"
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
                <label htmlFor="icon">Icône</label>
                <input
                  type="text"
                  id="icon"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  placeholder="Ex: 🌱"
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
              <th>Description</th>
              <th>Icône</th>
              <th>Statut</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  Aucune catégorie trouvée
                </td>
              </tr>
            ) : (
              filteredCategories.map(category => (
                <tr key={category.id}>
                  <td>{category.id}</td>
                  <td className="category-name">{category.name}</td>
                  <td className="category-description">
                    {category.description || 'Aucune description'}
                  </td>
                  <td className="category-icon">{category.icon || '🌱'}</td>
                  <td>
                    <span className={`status ${category.is_active ? 'active' : 'inactive'}`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
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
};

export default AdminJardinageCategoriesCrud;

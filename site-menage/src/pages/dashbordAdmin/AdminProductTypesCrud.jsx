import React, { useEffect, useMemo, useState } from 'react';
import './AdminProductTypesCrud.css';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';

export default function AdminProductTypesCrud({ token, onAuthError }) {
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    name_ar: '',
    name_fr: '',
    name_en: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadTypes();
    loadCategories();
  }, []);

  const loadTypes = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('product_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading product types:', err);
      setError(err.message || 'Erreur lors du chargement des types');
      if (err.status === 401) {
        onAuthError?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTypes = useMemo(() => {
    const q = search.toLowerCase();
    return types.filter((type) => {
      const matchesSearch = !q
        ? true
        : [type.name, type.name_fr, type.name_en, type.name_ar, type.description]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(q));
      const matchesCategory =
        selectedCategoryFilter === 'all' ||
        String(type.category_id) === String(selectedCategoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [types, search, selectedCategoryFilter]);

  const total = types.length;
  const activeCount = types.filter((t) => t.is_active).length;
  const inactiveCount = total - activeCount;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, name_fr, name_en, name_ar')
        .order('name', { ascending: true });
      if (error) throw error;

      const normalized = (Array.isArray(data) ? data : []).map((cat) => ({
        ...cat,
        translated_name:
          cat.translated_name ||
          cat.name_fr ||
          cat.name_en ||
          cat.name_ar ||
          cat.name
      }));

      setCategories(normalized);
    } catch (err) {
      console.warn('Error loading categories:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      name: '',
      name_ar: '',
      name_fr: '',
      name_en: '',
      description: '',
      is_active: true
    });
    setEditingType(null);
    setShowForm(false);
    setIsSaving(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      const payload = {
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        name: formData.name || formData.name_fr || formData.name_en || formData.name_ar || null,
        name_ar: formData.name_ar || null,
        name_fr: formData.name_fr || null,
        name_en: formData.name_en || null,
        description: formData.description || null,
        is_active: !!formData.is_active
      };

      if (!payload.name) {
        throw new Error('Le nom principal est requis (au moins dans une langue).');
      }

      if (editingType) {
        const { error } = await supabase
          .from('product_types')
          .update(payload)
          .eq('id', editingType.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_types').insert(payload);
        if (error) throw error;
      }

      await loadTypes();
      resetForm();
    } catch (err) {
      console.error('Error saving product type:', err);
      alert(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      category_id: type.category_id || '',
      name: type.name || '',
      name_ar: type.name_ar || '',
      name_fr: type.name_fr || '',
      name_en: type.name_en || '',
      description: type.description || '',
      is_active: !!type.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (typeId) => {
    if (!window.confirm('Supprimer ce type de produit ?')) return;
    try {
      const { error } = await supabase
        .from('product_types')
        .delete()
        .eq('id', typeId);
      if (error) throw error;
      await loadTypes();
    } catch (err) {
      console.error('Error deleting product type:', err);
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return '—';
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return `ID ${categoryId}`;
    return category.translated_name || category.name || `ID ${categoryId}`;
  };

  return (
    <section className="product-types-card">
      <div className="admin-product-types">
        <div className="product-types-header">
          <div>
            <h1>Types de produits</h1>
            <p>Créez et traduisez les familles de produits utilisées par la boutique</p>
          </div>
          <div className="product-types-actions">
            <button className="product-types-btn btn-secondary" onClick={loadTypes}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 21v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Actualiser
            </button>
            <button className="product-types-btn btn-primary" onClick={() => setShowForm(true)}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Nouveau type
            </button>
          </div>
        </div>

        <div className="product-types-stats">
          <div className="product-types-stat-card">
            <div className="product-types-stat-label">Total</div>
            <div className="product-types-stat-value">{total}</div>
          </div>
          <div className="product-types-stat-card">
            <div className="product-types-stat-label">Actifs</div>
            <div className="product-types-stat-value" style={{ color: '#059669' }}>
              {activeCount}
            </div>
          </div>
          <div className="product-types-stat-card">
            <div className="product-types-stat-label">Inactifs</div>
            <div className="product-types-stat-value" style={{ color: '#b91c1c' }}>
              {inactiveCount}
            </div>
          </div>
        </div>

        <div className="product-types-toolbar">
          <input
            type="text"
            placeholder="Rechercher un type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.translated_name || cat.name || `Catégorie ${cat.id}`}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="empty-state">
            <strong>Chargement...</strong>
            <span>Récupération des types de produits</span>
          </div>
        ) : error ? (
          <div className="error-state">
            <strong>Erreur</strong>
            <span>{error}</span>
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="empty-state">
            <strong>Aucun type</strong>
            <span>Ajoutez votre premier type de produit</span>
          </div>
        ) : (
          <div className="product-types-table-wrapper">
            <table className="product-types-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Catégorie</th>
                  <th>Nom</th>
                  <th>Traductions</th>
                  <th>Description</th>
                  <th>Statut</th>
                  <th>Créé</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTypes.map((type) => (
                  <tr key={type.id}>
                    <td>{type.id}</td>
                    <td>{getCategoryName(type.category_id)}</td>
                    <td>
                      <div className="product-type-badge">
                        <strong>{type.name || '—'}</strong>
                        <span>{type.slug || ''}</span>
                      </div>
                    </td>
                    <td>
                      <div className="product-type-badge">
                        <span>FR</span>
                        <strong>{type.name_fr || '—'}</strong>
                      </div>
                      <div className="product-type-badge">
                        <span>EN</span>
                        <strong>{type.name_en || '—'}</strong>
                      </div>
                      <div className="product-type-badge">
                        <span>AR</span>
                        <strong>{type.name_ar || '—'}</strong>
                      </div>
                    </td>
                    <td>{type.description || '—'}</td>
                    <td>
                      <span className={`badge ${type.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {type.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>{type.created_at ? new Date(type.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                    <td>
                      <div className="product-type-actions">
                        <button className="edit" onClick={() => handleEdit(type)}>
                          Modifier
                        </button>
                        <button className="delete" onClick={() => handleDelete(type.id)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingType ? 'Modifier le type' : 'Nouveau type de produit'}</h2>
              <button className="modal-close" onClick={resetForm}>
                ×
              </button>
            </div>

            <form className="product-type-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Catégorie *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => handleChange('category_id', e.target.value)}
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.translated_name || cat.name || `Catégorie ${cat.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Nom principal *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Nom par défaut"
                  required={!formData.name_fr && !formData.name_en && !formData.name_ar}
                />
              </div>

              <LanguageFields
                includeDescription={false}
                required={false}
                value={{
                  name_ar: formData.name_ar,
                  name_fr: formData.name_fr,
                  name_en: formData.name_en
                }}
                onChange={(values) => setFormData((prev) => ({ ...prev, ...values }))}
              />

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Description interne (optionnelle)"
                />
              </div>

              <div className="form-group toggle-group">
                <label>Statut</label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                  />
                  <span>{formData.is_active ? 'Actif' : 'Inactif'}</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Enregistrement…' : editingType ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}


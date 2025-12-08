import React, { useState, useEffect } from 'react';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';

export default function AdminTypesMenageCrud({ token, onAuthError }) {
  const [typesMenage, setTypesMenage] = useState([]);
  const [menageItems, setMenageItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMenage, setFilterMenage] = useState('all');

  const [formData, setFormData] = useState({
    menage_id: '',
    name_ar: '',
    name_fr: '',
    name_en: '',
    description_ar: '',
    description_fr: '',
    description_en: '',
    image: '',
    price: ''
  });

  useEffect(() => {
    loadMenage();
    loadTypesMenage();
  }, []);

  const loadMenage = async () => {
    try {
      const { data, error } = await supabase
        .from('menage')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AdminTypesMenage] Error loading menage:', error);
        return;
      }

      setMenageItems(data || []);
    } catch (err) {
      console.error('[AdminTypesMenage] Exception loading menage:', err);
    }
  };

  const loadTypesMenage = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('types_menage')
        .select('*, menage:menage_id(*)')
        .order('created_at', { ascending: false });

      if (filterMenage !== 'all') {
        query = query.eq('menage_id', filterMenage);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AdminTypesMenage] Error loading types_menage:', error);
        setError('Erreur lors du chargement des types ménage: ' + error.message);
        return;
      }

      setTypesMenage(data || []);
    } catch (err) {
      console.error('[AdminTypesMenage] Exception loading types_menage:', err);
      setError('Erreur de connexion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTypesMenage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMenage]);

  // Upload image to Supabase Storage (bucket: category_house)
  const uploadImage = async (file) => {
    try {
      setUploadingImage(true);

      const fileName = `types_menage_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${file.name.split('.').pop()}`;
      const filePath = fileName;

      console.log('[AdminTypesMenage] Uploading image:', fileName, 'to bucket: category_house');

      const { data, error } = await supabase.storage
        .from('category_house')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('[AdminTypesMenage] Upload error:', error);

        if (error.message?.includes('Bucket not found') || error.statusCode === '404') {
          throw new Error('Bucket "category_house" غير موجود. يرجى إنشاء bucket "category_house" في Supabase Storage أولاً.');
        }

        throw error;
      }

      console.log('[AdminTypesMenage] Upload successful:', data);

      const {
        data: { publicUrl }
      } = supabase.storage.from('category_house').getPublicUrl(filePath);

      console.log('[AdminTypesMenage] Image uploaded successfully, public URL:', publicUrl);

      if (publicUrl) {
        setFormData((prev) => ({ ...prev, image: publicUrl }));
        setImageFile(null);
        return publicUrl;
      }

      throw new Error("Aucune URL d'image retournée");
    } catch (err) {
      console.error('[AdminTypesMenage] Erreur lors du téléchargement de l\'image:', err);
      setError('Erreur lors du téléchargement de l\'image: ' + err.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La taille du fichier ne doit pas dépasser 5MB');
      return;
    }

    setImageFile(file);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    await uploadImage(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      image: ''
    }));
    const fileInput = document.getElementById('types_menage_image_upload');
    if (fileInput) fileInput.value = '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (!formData.menage_id) {
        setError('Veuillez choisir un service ménage parent');
        return;
      }

      if (!formData.name_fr && !formData.name_ar && !formData.name_en) {
        setError('Veuillez entrer au moins un nom (AR, FR ou EN)');
        return;
      }

      let imageUrl = formData.image || null;
      if (imageFile && !uploadingImage) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          return;
        }
      }

      const submitData = {
        menage_id: Number(formData.menage_id),
        name_ar: formData.name_ar?.trim() || null,
        name_fr: formData.name_fr?.trim() || null,
        name_en: formData.name_en?.trim() || null,
        description_ar: formData.description_ar?.trim() || null,
        description_fr: formData.description_fr?.trim() || null,
        description_en: formData.description_en?.trim() || null,
        image: imageUrl || null,
        price: formData.price ? parseFloat(formData.price) : null
      };

      let data;
      let error;

      if (editingItem) {
        const { data: updateData, error: updateError } = await supabase
          .from('types_menage')
          .update(submitData)
          .eq('id', editingItem.id)
          .select();
        data = updateData && updateData.length > 0 ? updateData[0] : null;
        error = updateError;
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('types_menage')
          .insert([submitData])
          .select();
        data = insertData && insertData.length > 0 ? insertData[0] : null;
        error = insertError;
      }

      if (error) {
        console.error('[AdminTypesMenage] Error saving types_menage:', error);
        setError('Erreur lors de la sauvegarde: ' + error.message);
        return;
      }

      setSuccess('Enregistré avec succès');
      setShowForm(false);
      setEditingItem(null);
      setFormData({
        menage_id: '',
        name_ar: '',
        name_fr: '',
        name_en: '',
        description_ar: '',
        description_fr: '',
        description_en: '',
        image: '',
        price: ''
      });
      setImageFile(null);
      setImagePreview(null);
      await loadTypesMenage();
    } catch (err) {
      console.error('[AdminTypesMenage] Exception saving types_menage:', err);
      setError('Erreur de connexion: ' + err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      menage_id: item.menage_id || '',
      name_ar: item.name_ar || '',
      name_fr: item.name_fr || '',
      name_en: item.name_en || '',
      description_ar: item.description_ar || '',
      description_fr: item.description_fr || '',
      description_en: item.description_en || '',
      image: item.image || '',
      price: item.price || ''
    });
    setImageFile(null);
    setImagePreview(item.image || null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce type ménage ?')) {
      return;
    }
    try {
      setError('');
      const { error } = await supabase.from('types_menage').delete().eq('id', id);
      if (error) {
        console.error('[AdminTypesMenage] Error deleting types_menage:', error);
        setError('Erreur lors de la suppression: ' + error.message);
        return;
      }
      await loadTypesMenage();
    } catch (err) {
      console.error('[AdminTypesMenage] Exception deleting types_menage:', err);
      setError('Erreur de connexion: ' + err.message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      menage_id: '',
      name_ar: '',
      name_fr: '',
      name_en: '',
      description_ar: '',
      description_fr: '',
      description_en: '',
      image: '',
      price: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setError('');
  };

  const getMenageName = (menageId) => {
    const m = menageItems.find((x) => x.id === menageId);
    return m ? m.name_fr || m.name_ar || m.name_en || `Ménage #${menageId}` : `Ménage #${menageId}`;
  };

  const filteredTypes = typesMenage.filter((item) => {
    const text = (item.name_fr || item.name_ar || item.name_en || '').toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="admin-jardinage-categories">
        <div className="loading">Chargement des types ménage...</div>
      </div>
    );
  }

  return (
    <div className="admin-jardinage-categories">
      <div className="admin-header">
        <h2>🏠 Gestion des Types Ménage</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          ➕ Ajouter un type ménage
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher un type ménage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <select
          value={filterMenage}
          onChange={(e) => setFilterMenage(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tous les services ménage</option>
          {menageItems.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name_fr || m.name_ar || m.name_en || `Ménage #${m.id}`}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <div className="form-header">
              <h3>{editingItem ? 'Modifier le type ménage' : 'Nouveau type ménage'}</h3>
              <button className="close-btn" onClick={handleCancel}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="menage_id">Service Ménage *</label>
                  <select
                    id="menage_id"
                    name="menage_id"
                    value={formData.menage_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionner un service ménage</option>
                    {menageItems.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name_fr || m.name_ar || m.name_en || `Ménage #${m.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <LanguageFields
                value={{
                  name_ar: formData.name_ar,
                  name_fr: formData.name_fr,
                  name_en: formData.name_en,
                  description_ar: formData.description_ar,
                  description_fr: formData.description_fr,
                  description_en: formData.description_en
                }}
                onChange={(v) => setFormData((prev) => ({ ...prev, ...v }))}
                includeDescription={true}
                required={false}
              />

              <div className="form-group">
                <label htmlFor="image">Image (URL ou upload)</label>
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap'
                  }}
                >
                  <input
                    type="text"
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="URL complète (optionnel si upload)"
                    style={{ flex: 1, minWidth: '200px' }}
                  />
                  <input
                    type="file"
                    id="types_menage_image_upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="types_menage_image_upload"
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
                    {uploadingImage ? '⏳ Téléchargement...' : '📁 Uploader une image'}
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
                  Entrez une URL complète ou téléchargez une image (Max 5MB). Les fichiers sont stockés
                  dans le bucket Supabase "category_house".
                </small>
                {(imagePreview || formData.image) && (
                  <div className="image-preview" style={{ marginTop: '10px' }}>
                    <img
                      src={imagePreview || formData.image}
                      alt="Preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Prix (DH)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="Ex: 150.00"
                  />
                  <small className="form-help">
                    Prix de base pour ce type de ménage (optionnel). Utilisé dans les calculs de réservation.
                  </small>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Modifier' : 'Ajouter'}
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
              <th>Service Ménage</th>
              <th>Nom (FR)</th>
              <th>Nom (AR)</th>
              <th>Nom (EN)</th>
              <th>Description (FR)</th>
              <th>Prix (DH)</th>
              <th>Image</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTypes.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  Aucun type ménage trouvé
                </td>
              </tr>
            ) : (
              filteredTypes.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td className="category-name">{getMenageName(item.menage_id)}</td>
                  <td className="category-name">{item.name_fr || '-'}</td>
                  <td className="category-name">{item.name_ar || '-'}</td>
                  <td className="category-name">{item.name_en || '-'}</td>
                  <td className="category-name">
                    {item.description_fr || item.description_ar || item.description_en || '-'}
                  </td>
                  <td className="category-name">
                    {item.price ? `${parseFloat(item.price).toFixed(2)} DH` : '-'}
                  </td>
                  <td>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name_fr || item.name_en || 'Type ménage'}
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
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(item)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(item.id)}
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
    </div>
  );
}



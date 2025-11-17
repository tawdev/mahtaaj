import React, { useState, useEffect } from 'react';
import './AdminHandWorkersCrud.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

export default function AdminHandWorkersCrud({ token, onAuthError }) {
  const [handWorkers, setHandWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingWorker, setEditingWorker] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    category_id: '',
    photo: '',
    status: 'available',
    experience_years: '',
    rating: '',
    bio: '',
    address: '',
    city: '',
    is_available: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories first
      const categoriesResponse = await fetch(`${API_BASE_URL}/api/admin/hand-worker-categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (categoriesResponse.status === 401) {
        onAuthError();
        return;
      }

      const categoriesData = await categoriesResponse.json();
      if (categoriesData.success) {
        setCategories(categoriesData.data);
      }

      // Load hand workers
      const workersResponse = await fetch(`${API_BASE_URL}/api/admin/hand-workers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (workersResponse.status === 401) {
        onAuthError();
        return;
      }

      const workersData = await workersResponse.json();
      if (workersData.success) {
        setHandWorkers(workersData.data);
      } else {
        setError('Erreur lors du chargement des employés');
      }
    } catch (e) {
      console.error('Error loading data:', e);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingWorker 
        ? `${API_BASE_URL}/api/admin/hand-workers/${editingWorker.id}`
        : `${API_BASE_URL}/api/admin/hand-workers`;
      
      const method = editingWorker ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.status === 401) {
        onAuthError();
        return;
      }

      const data = await response.json();
      if (data.success) {
        await loadData();
        resetForm();
        setShowForm(false);
      } else {
        setError(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (e) {
      console.error('Error saving worker:', e);
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setFormData({
      first_name: worker.first_name,
      last_name: worker.last_name,
      email: worker.email,
      phone: worker.phone,
      category_id: worker.category_id,
      photo: worker.photo || '',
      status: worker.status,
      experience_years: worker.experience_years,
      rating: worker.rating,
      bio: worker.bio || '',
      address: worker.address || '',
      city: worker.city || '',
      is_available: worker.is_available
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/hand-workers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        onAuthError();
        return;
      }

      const data = await response.json();
      if (data.success) {
        await loadData();
      } else {
        setError(data.message || 'Erreur lors de la suppression');
      }
    } catch (e) {
      console.error('Error deleting worker:', e);
      setError('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      category_id: '',
      photo: '',
      status: 'available',
      experience_years: '',
      rating: '',
      bio: '',
      address: '',
      city: '',
      is_available: true
    });
    setEditingWorker(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Catégorie inconnue';
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-hand-workers-crud">
      <div className="admin-header">
        <h2>Gestion des Employés Travaux Manuels</h2>
        <button 
          className="add-button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Ajouter un employé
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h3>{editingWorker ? 'Modifier l\'employé' : 'Nouvel employé'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Téléphone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Catégorie *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
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

              <div className="form-group">
                <label>Photo (URL)</label>
                <input
                  type="url"
                  value={formData.photo}
                  onChange={(e) => setFormData({...formData, photo: e.target.value})}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="available">Disponible</option>
                    <option value="busy">Occupé</option>
                    <option value="unavailable">Indisponible</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Années d'expérience</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Note (0-5)</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Biographie</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows="3"
                  placeholder="Description de l'employé..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Adresse</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Ville</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                  />
                  Disponible pour les réservations
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-button">
                  {editingWorker ? 'Modifier' : 'Créer'}
                </button>
                <button type="button" onClick={handleCancel} className="cancel-button">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="workers-list">
        {handWorkers.length === 0 ? (
          <div className="no-data">Aucun employé trouvé</div>
        ) : (
          <div className="workers-grid">
            {handWorkers.map(worker => (
              <div key={worker.id} className="worker-card">
                <div className="worker-header">
                  <div className="worker-photo">
                    {worker.photo ? (
                      <img src={worker.photo} alt={worker.full_name} />
                    ) : (
                      <div className="default-photo">
                        <i className="fas fa-user"></i>
                      </div>
                    )}
                  </div>
                  <div className="worker-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(worker)}
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(worker.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="worker-content">
                  <h3>{worker.full_name}</h3>
                  <p className="worker-category">{getCategoryName(worker.category_id)}</p>
                  
                  <div className="worker-details">
                    <div className="detail-item">
                      <span className="label">Email:</span>
                      <span className="value">{worker.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Téléphone:</span>
                      <span className="value">{worker.phone}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Expérience:</span>
                      <span className="value">{worker.experience_years} ans</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Note:</span>
                      <span className="value">{worker.rating}/5</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Statut:</span>
                      <span className={`status ${worker.status}`}>
                        {worker.status === 'available' ? 'Disponible' : 
                         worker.status === 'busy' ? 'Occupé' : 'Indisponible'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Disponible:</span>
                      <span className={`status ${worker.is_available ? 'active' : 'inactive'}`}>
                        {worker.is_available ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  </div>

                  {worker.bio && (
                    <div className="worker-bio">
                      <p>{worker.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

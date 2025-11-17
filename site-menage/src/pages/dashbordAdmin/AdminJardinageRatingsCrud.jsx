import React, { useState, useEffect } from 'react';
import './AdminJardinageRatingsCrud.css';

const AdminJardinageRatingsCrud = () => {
  const [ratings, setRatings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [selectedRating, setSelectedRating] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    loadRatings();
    loadServices();
  }, []);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/jardinage-ratings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      let list = [];
      try {
        const data = await response.json();
        list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.ratings)
            ? data.ratings
            : Array.isArray(data?.evaluations)
              ? data.evaluations
              : (Array.isArray(data) ? data : []);
      } catch (_) {
        try {
          const text = await response.text();
          if (text) {
            setError(`Erreur serveur (${response.status}): ${text.substring(0, 200)}`);
          }
        } catch {}
      }
      setRatings(Array.isArray(list) ? list : []);
      setError('');
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/jardinages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des services:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette évaluation ?')) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/jardinage-ratings/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          await loadRatings();
        } else {
          setError('Erreur lors de la suppression');
        }
      } catch (err) {
        setError('Erreur de connexion');
      }
    }
  };

  const showDetails = (rating) => {
    setSelectedRating(rating);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRating(null);
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Service inconnu';
  };

  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`star ${star <= rating ? 'filled' : ''}`}>
            ⭐
          </span>
        ))}
      </div>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'excellent';
    if (rating >= 3) return 'good';
    if (rating >= 2) return 'average';
    return 'poor';
  };

  const getRatingLabel = (rating) => {
    if (rating >= 4) return 'Excellent';
    if (rating >= 3) return 'Bon';
    if (rating >= 2) return 'Moyen';
    return 'Mauvais';
  };

  const filteredRatings = ratings.filter(rating => {
    const clientName = rating.client_name || '';
    const comment = rating.comment || '';
    const serviceId = rating.jardinage_service_id ?? rating.jardinage_id;
    const serviceName = getServiceName(serviceId) || '';
    
    const matchesSearch = 
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesService = filterService === 'all' || String(serviceId) == String(filterService);
    const matchesRating = filterRating === 'all' || rating.rating == filterRating;
    
    return matchesSearch && matchesService && matchesRating;
  });

  if (loading) {
    return (
      <div className="admin-jardinage-ratings">
        <div className="loading">Chargement des évaluations...</div>
      </div>
    );
  }

  return (
    <div className="admin-jardinage-ratings">
      <div className="admin-header">
        <h2>🌿 Gestion des Évaluations Jardinage</h2>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={loadRatings}
          >
            🔄 Actualiser
          </button>
        </div>
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
            placeholder="Rechercher par nom, commentaire ou service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tous les services</option>
          {services.map(service => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
        
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          className="filter-select"
        >
          <option value="all">Toutes les notes</option>
          <option value="5">5 étoiles</option>
          <option value="4">4 étoiles</option>
          <option value="3">3 étoiles</option>
          <option value="2">2 étoiles</option>
          <option value="1">1 étoile</option>
        </select>
      </div>

      <div className="ratings-table-container">
        <table className="ratings-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Service</th>
              <th>Note</th>
              <th>Commentaire</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRatings.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  Aucune évaluation trouvée
                </td>
              </tr>
            ) : (
              filteredRatings.map(rating => (
                <tr key={rating.id}>
                  <td>{rating.id}</td>
                  <td className="client-name">{rating.client_name}</td>
                  <td className="service-name">{getServiceName(rating.jardinage_service_id ?? rating.jardinage_id)}</td>
                  <td className="rating-stars">
                    <div className="rating-display">
                      {renderStars(rating.rating)}
                      <span className={`rating-label ${getRatingColor(rating.rating)}`}>
                        {getRatingLabel(rating.rating)}
                      </span>
                    </div>
                  </td>
                  <td className="comment">
                    {rating.comment ? (
                      <div className="comment-preview">
                        {rating.comment.length > 50 
                          ? `${rating.comment.substring(0, 50)}...` 
                          : rating.comment
                        }
                      </div>
                    ) : (
                      <span className="no-comment">Aucun commentaire</span>
                    )}
                  </td>
                  <td className="rating-date">
                    {new Date(rating.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => showDetails(rating)}
                      title="Voir les détails"
                    >
                      👁️
                    </button>
                    <button
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(rating.id)}
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
            <div className="stat-number">{ratings.length}</div>
            <div className="stat-label">Total des évaluations</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-number">
              {ratings.length > 0 
                ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
                : '0.0'
              }
            </div>
            <div className="stat-label">Note moyenne</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <div className="stat-number">{ratings.filter(r => r.comment).length}</div>
            <div className="stat-label">Avec commentaires</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{ratings.filter(r => r.rating >= 4).length}</div>
            <div className="stat-label">Évaluations positives</div>
          </div>
        </div>
      </div>

      {showDetailsModal && selectedRating && (
        <div className="details-modal">
          <div className="details-container">
            <div className="details-header">
              <h3>Détails de l'évaluation #{selectedRating.id}</h3>
              <button className="close-btn" onClick={closeDetailsModal}>✕</button>
            </div>
            
            <div className="details-content">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Nom du client:</label>
                  <span>{selectedRating.client_name}</span>
                </div>
                
                <div className="detail-item">
                  <label>Service:</label>
                  <span>{getServiceName(selectedRating.jardinage_service_id)}</span>
                </div>
                
                <div className="detail-item">
                  <label>Note:</label>
                  <div className="rating-detail">
                    {renderStars(selectedRating.rating)}
                    <span className={`rating-label ${getRatingColor(selectedRating.rating)}`}>
                      {selectedRating.rating}/5 - {getRatingLabel(selectedRating.rating)}
                    </span>
                  </div>
                </div>
                
                <div className="detail-item">
                  <label>Date:</label>
                  <span>{new Date(selectedRating.created_at).toLocaleString('fr-FR')}</span>
                </div>
              </div>
              
              {selectedRating.comment && (
                <div className="comment-section">
                  <label>Commentaire:</label>
                  <div className="comment-content">
                    "{selectedRating.comment}"
                  </div>
                </div>
              )}
            </div>
            
            <div className="details-actions">
              <button className="btn btn-secondary" onClick={closeDetailsModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJardinageRatingsCrud;

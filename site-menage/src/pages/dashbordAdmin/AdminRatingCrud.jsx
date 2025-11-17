import React, { useState, useEffect } from 'react';
import { getRatingsAdmin, createRatingAdmin, updateRatingAdmin, deleteRatingAdmin } from '../../api-supabase';
import './AdminRatingCrud.css';

export default function AdminRatingCrud({ token }) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRating, setEditingRating] = useState(null);
  const [formData, setFormData] = useState({
    user_ip: '',
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    loadRatings();
  }, [token]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getRatingsAdmin(token);
      
      // Gérer différentes structures de réponse
      let ratingsData = [];
      if (Array.isArray(response)) {
        ratingsData = response;
      } else if (response && Array.isArray(response.data)) {
        ratingsData = response.data;
      } else if (response && response.success && Array.isArray(response.data)) {
        ratingsData = response.data;
      }
      
      setRatings(ratingsData);
    } catch (e) {
      console.error('Error loading ratings:', e);
      setError('Impossible de charger les évaluations');
      setRatings([]); // S'assurer que ratings reste un tableau
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRating) {
        await updateRatingAdmin(token, editingRating.id, formData);
      } else {
        await createRatingAdmin(token, formData);
      }
      setShowForm(false);
      setEditingRating(null);
      resetForm();
      loadRatings();
    } catch (e) {
      setError(e.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (rating) => {
    setEditingRating(rating);
    setFormData({
      user_ip: rating.user_ip || '',
      rating: rating.rating || 5,
      comment: rating.comment || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette évaluation ?')) {
      return;
    }
    try {
      await deleteRatingAdmin(token, id);
      loadRatings();
    } catch (e) {
      setError(e.message || 'Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      user_ip: '',
      rating: 5,
      comment: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRating(null);
    resetForm();
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span
        key={index}
        className={`star ${index < rating ? 'filled' : 'empty'}`}
      >
        ★
      </span>
    ));
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return '#10b981'; // Vert
    if (rating >= 3) return '#f59e0b'; // Orange
    return '#ef4444'; // Rouge
  };

  if (loading) return <div className="admin-ratings-loading">Chargement des évaluations...</div>;
  if (error) return <div className="admin-ratings-error">{error}</div>;

  return (
    <div className="admin-ratings-crud">
      <div className="admin-ratings-header">
        <h2 className="admin-ratings-title">Gestion des Évaluations</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="admin-ratings-add-button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nouvelle Évaluation
        </button>
      </div>

      {showForm && (
        <div className="admin-ratings-form-overlay">
          <div className="admin-ratings-form">
            <h3>{editingRating ? 'Modifier' : 'Créer'} une Évaluation</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="user_ip">Adresse IP *</label>
                <input
                  id="user_ip"
                  type="text"
                  value={formData.user_ip}
                  onChange={(e) => setFormData({...formData, user_ip: e.target.value})}
                  required
                  placeholder="Ex: 192.168.1.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="rating">Note *</label>
                <select
                  id="rating"
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
                  required
                >
                  <option value={1}>1 étoile</option>
                  <option value={2}>2 étoiles</option>
                  <option value={3}>3 étoiles</option>
                  <option value={4}>4 étoiles</option>
                  <option value={5}>5 étoiles</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="comment">Commentaire</label>
                <textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  rows="4"
                  placeholder="Commentaire de l'utilisateur..."
                  maxLength="500"
                />
                <div className="comment-counter">
                  {formData.comment.length}/500 caractères
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-button">
                  {editingRating ? 'Modifier' : 'Créer'}
                </button>
                <button type="button" onClick={handleCancel} className="cancel-button">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-ratings-grid">
        {Array.isArray(ratings) && ratings.map((rating) => (
          <div key={rating.id} className="admin-rating-card">
            <div className="rating-header">
              <div className="rating-info">
                <div className="rating-stars">
                  {renderStars(rating.rating)}
                </div>
                <div className="rating-value" style={{ color: getRatingColor(rating.rating) }}>
                  {rating.rating}/5
                </div>
              </div>
              <div className="rating-ip">
                <span className="ip-label">IP:</span>
                <span className="ip-value">{rating.user_ip}</span>
              </div>
            </div>
            
            <div className="rating-details">
              {rating.comment && (
                <div className="rating-comment">
                  <strong>Commentaire:</strong>
                  <p>"{rating.comment}"</p>
                </div>
              )}
              
              <div className="rating-meta">
                <small className="rating-date">
                  Créé le {new Date(rating.created_at).toLocaleString()}
                </small>
                {rating.updated_at !== rating.created_at && (
                  <small className="rating-updated">
                    Modifié le {new Date(rating.updated_at).toLocaleString()}
                  </small>
                )}
              </div>
            </div>

            <div className="rating-actions">
              <button 
                onClick={() => handleEdit(rating)}
                className="edit-button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Modifier
              </button>
              <button 
                onClick={() => handleDelete(rating.id)}
                className="delete-button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {Array.isArray(ratings) && ratings.length === 0 && (
        <div className="admin-ratings-empty">
          <div className="empty-icon">⭐</div>
          <h3>Aucune évaluation</h3>
          <p>Il n'y a pas encore d'évaluations à afficher.</p>
        </div>
      )}
    </div>
  );
}

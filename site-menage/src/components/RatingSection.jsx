import React, { useState, useEffect } from 'react';
import './RatingSection.css';

const RatingSection = ({ serviceId, serviceType }) => {
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUserRated, setHasUserRated] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadRatings();
    checkUserRating();
  }, [serviceId]);

  const checkUserRating = async () => {
    try {
      const userId = localStorage.getItem('userId');

      const endpoint = serviceType === 'bebe' 
        ? '/api/bebe/rating/check'
        : '/api/jardinage/rating/check';
      
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId ? parseInt(userId) : null,
          [`${serviceType === 'bebe' ? 'bebe_setting_id' : 'jardinage_id'}`]: serviceId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setHasUserRated(data.has_rated);
        setUserRating(data.rating);
      }
    } catch (error) {
      console.error('Error checking user rating:', error);
    }
  };

  const loadRatings = async () => {
    try {
      setIsLoading(true);
      const endpoint = serviceType === 'bebe' 
        ? `/api/bebe/ratings/service/${serviceId}`
        : `/api/jardinage/ratings/service/${serviceId}`;
      
      const response = await fetch(`http://localhost:8000${endpoint}`);
      const data = await response.json();
      
      if (data.success) {
        setRatings(data.data.ratings || []);
        setAverageRating(data.data.average_rating || 0);
        setTotalRatings(data.data.total_ratings || 0);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating: rating
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Veuillez sélectionner une note';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const endpoint = serviceType === 'bebe' 
        ? '/api/bebe/rating' 
        : '/api/jardinage/rating';
      
      const userId = localStorage.getItem('userId');
      const payload = {
        [`${serviceType === 'bebe' ? 'bebe_setting_id' : 'jardinage_id'}`]: serviceId,
        user_id: userId ? parseInt(userId) : null,
        ...formData,
        rating: parseInt(formData.rating)
      };
      
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reload ratings to show the new one
        await loadRatings();
        await checkUserRating();
        setShowForm(false);
        setFormData({
          rating: 5,
          comment: ''
        });
        setErrors({});
        
        // Show success toast
        if (window.showToast) {
          window.showToast('Évaluation ajoutée avec succès !', 'success');
        }
      } else {
        // Handle different types of errors
        if (data.error === 'DUPLICATE_RATING') {
          // Show duplicate rating message and disable form
          setHasUserRated(true);
          setShowForm(false);
          if (window.showToast) {
            window.showToast('Vous avez déjà évalué ce produit.', 'warning');
          }
        } else {
          // Handle other errors
          setErrors(data.errors || { general: data.message });
          if (window.showToast) {
            window.showToast(data.message || 'Erreur lors de l\'ajout de l\'évaluation', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setErrors({ general: 'Erreur de connexion. Veuillez réessayer.' });
      if (window.showToast) {
        window.showToast('Erreur de connexion. Veuillez réessayer.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    return (
      <div className={`stars ${interactive ? 'interactive' : ''}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={interactive ? () => onStarClick(star) : undefined}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="rating-section">
        <div className="loading">Chargement des évaluations...</div>
      </div>
    );
  }

  return (
    <div className="rating-section">
      <div className="rating-header">
        <h3>⭐ Avis et évaluations des clients</h3>
        <div className="rating-summary">
          <div className="average-rating">
            {renderStars(Math.round(averageRating))}
            <span className="rating-number">{averageRating.toFixed(1)}</span>
            <span className="rating-count">({totalRatings} avis)</span>
          </div>
        </div>
      </div>

      {ratings.length > 0 ? (
        <div className="ratings-list">
          {ratings.map((rating) => (
            <div key={rating.id} className="rating-item">
              <div className="rating-item-header">
                <div className="client-info">
                  <span className="client-name">{rating.client_name}</span>
                  <span className="rating-date">{formatDate(rating.created_at)}</span>
                </div>
                <div className="rating-stars">
                  {renderStars(rating.rating)}
                </div>
              </div>
              {rating.comment && (
                <div className="rating-comment">
                  "{rating.comment}"
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-ratings">
          <p>Aucune évaluation pour ce service pour le moment.</p>
          <p>Soyez le premier à laisser un avis !</p>
        </div>
      )}

      <div className="rating-form-section">
        {hasUserRated ? (
          <div className="user-already-rated">
            <div className="already-rated-content">
              <span className="already-rated-icon">✅</span>
              <div className="already-rated-text">
                <p className="already-rated-title">Vous avez déjà évalué ce produit</p>
                {userRating && (
                  <div className="user-rating-display">
                    <span className="user-rating-stars">
                      {renderStars(userRating.rating)}
                    </span>
                    <span className="user-rating-date">
                      Le {formatDate(userRating.created_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : !showForm ? (
          <button
            className="btn btn-primary add-rating-btn"
            onClick={() => setShowForm(true)}
          >
            ✍️ Ajouter un avis
          </button>
        ) : (
          <div className="rating-form-container">
            <div className="rating-form-header">
              <h4>Votre avis compte !</h4>
              <button 
                type="button" 
                className="close-btn"
                onClick={() => setShowForm(false)}
                aria-label="Fermer le formulaire"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="rating-form">
              {errors.general && (
                <div className="error-message general-error">
                  {errors.general}
                </div>
              )}
              
              <div className="form-group">
                <label>Votre note *</label>
                <div className="rating-input">
                  {renderStars(formData.rating, true, handleRatingChange)}
                  <span className="rating-text">
                    {formData.rating === 1 && 'Très déçu'}
                    {formData.rating === 2 && 'Déçu'}
                    {formData.rating === 3 && 'Moyen'}
                    {formData.rating === 4 && 'Satisfait'}
                    {formData.rating === 5 && 'Très satisfait'}
                  </span>
                </div>
                {errors.rating && (
                  <span className="error-text">{errors.rating}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="comment">Votre commentaire (optionnel)</label>
                <textarea
                  id="comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="Partagez votre expérience..."
                  rows="3"
                  maxLength="500"
                />
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Envoi...' : 'Envoyer l\'avis'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingSection;

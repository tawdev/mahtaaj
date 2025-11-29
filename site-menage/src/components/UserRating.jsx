import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getRatings, getAllRatings, submitRating, hasUserRatedSite } from '../api-supabase';
import './UserRating.css';

export default function UserRating() {
  const { t, i18n } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [checkingRating, setCheckingRating] = useState(true);
  const [stats, setStats] = useState({
    total_ratings: 0,
    average_rating: 0,
    recent_comments: []
  });
  const [allRatings, setAllRatings] = useState([]);
  // Afficher tout par défaut (peut être masqué avec le bouton Masquer)
  const [showAllComments, setShowAllComments] = useState(true);

  useEffect(() => {
    loadStats();
    checkUserRating();
  }, []);

  const checkUserRating = async () => {
    try {
      setCheckingRating(true);
      const result = await hasUserRatedSite();
      setHasRated(result.hasRated);
      setUserRating(result.rating);
    } catch (e) {
      console.error('Erreur lors de la vérification de l\'évaluation utilisateur:', e);
    } finally {
      setCheckingRating(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getRatings();
      if (response.success) {
        setStats(response.data);
      }
    } catch (e) {
      console.error('Erreur lors du chargement des statistiques d\'évaluation:', e);
    }
  };

  const loadAll = async () => {
    try {
      const response = await getAllRatings();
      // Accepter soit {success,data:{ratings:[]}} soit un tableau
      const list = Array.isArray(response?.data) ? response.data : (response?.data?.ratings || response?.ratings || []);
      setAllRatings(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Erreur lors du chargement de toutes les évaluations:', e);
    }
  };

  const handleStarClick = (starRating) => {
    setRating(starRating);
    setError('');
  };

  const handleStarHover = (starRating) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError(t('user_rating.select_rating_error'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await submitRating({
        rating: rating,
        comment: comment.trim() || null
      });

      if (response.success) {
        setSubmitted(true);
        setHasRated(true);
        setStats(response.data.stats);
        setRating(0);
        setComment('');
        
        // Recharger l'évaluation utilisateur pour obtenir les nouvelles données
        await checkUserRating();
        
        // Réinitialiser l'état de soumission après 3 secondes
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      } else {
        setError(response.message || t('user_rating.submit_error'));
        // Si l'erreur concerne une évaluation déjà effectuée, mettre à jour l'état hasRated
        if (response.message?.includes('déjà soumis') || response.message?.toLowerCase().includes('already')) {
          await checkUserRating();
        }
      }
    } catch (e) {
      console.error('Erreur lors de la soumission de l\'évaluation:', e);
      setError(e.message || t('user_rating.submit_error_full'));
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => {
      const isActive = star <= (hoveredRating || rating);
      return (
        <button
          key={star}
          type="button"
          className={`star ${isActive ? 'active' : ''}`}
          onClick={() => handleStarClick(star)}
          onMouseEnter={() => handleStarHover(star)}
          onMouseLeave={handleStarLeave}
          disabled={submitted}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={isActive ? '#fbbf24' : 'none'}
              stroke={isActive ? '#f59e0b' : '#d1d5db'}
              strokeWidth="2"
            />
          </svg>
        </button>
      );
    });
  };

  const renderRecentComments = () => {
    if (!stats.recent_comments || stats.recent_comments.length === 0) {
      return null;
    }
    const sorted = [...stats.recent_comments].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return db - da; // plus récent en premier
    });

    return (
      <div className="recent-comments">
        <div className="recent-header">
          <h4>{t('user_rating.recent_comments')}</h4>
          <button
            type="button"
            className="outline-toggle"
            onClick={() => {
              setShowAllComments((v) => {
                const next = !v;
                if (next && allRatings.length === 0) {
                  loadAll();
                }
                return next;
              });
            }}
            style={{
              marginLeft: 'auto'
            }}
          >
            {showAllComments ? t('user_rating.hide') : t('user_rating.show_all')}
          </button>
        </div>
        {showAllComments && (
          <div className="comments-grid">
            {(allRatings.length ? allRatings : sorted).sort((a,b)=> new Date(b.created_at)-new Date(a.created_at)).map((comment, index) => (
              <div key={index} className="comment-card">
                <div className="comment-rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`comment-star ${i < comment.rating ? 'filled' : ''}`}>★</span>
                  ))}
                </div>
                <div className="comment-text-area">
                  <p>"{comment.comment}"</p>
                </div>
                <small className="comment-date">{new Date(comment.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'en' ? 'en-US' : 'fr-FR')}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="user-rating-section">
      <div className="rating-container">
        <div className="rating-header">
          <h2 className="rating-title">{t('user_rating.title')}</h2>
          <p className="rating-subtitle">
            {t('user_rating.subtitle')}
          </p>
        </div>

        <div className="rating-stats">
          <div className="stats-item">
            <div className="stats-value">{stats.average_rating.toFixed(1)}</div>
            <div className="stats-label">{t('user_rating.average_rating')}</div>
          </div>
          <div className="stats-item">
            <div className="stats-value">{stats.total_ratings}</div>
            <div className="stats-label">{t('user_rating.total_ratings')}</div>
          </div>
        </div>

        {checkingRating ? (
          <div className="rating-loading">
            <div className="loading-spinner"></div>
            <p>{t('user_rating.checking')}</p>
          </div>
        ) : hasRated ? (
          <div className="rating-already-submitted">
            <div className="already-rated-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2"/>
              </svg>
            </div>
            <h3>{t('user_rating.already_rated_title')}</h3>
            {userRating && (
              <div className="user-rating-display">
                <div className="user-rating-stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < userRating.rating ? 'filled' : ''}>★</span>
                  ))}
                </div>
                {userRating.comment && (
                  <p className="user-rating-comment">"{userRating.comment}"</p>
                )}
                <small className="user-rating-date">
                  {t('user_rating.rated_on')} {new Date(userRating.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'en' ? 'en-US' : 'fr-FR')}
                </small>
              </div>
            )}
            <p className="already-rated-message">{t('user_rating.already_rated_message')}</p>
          </div>
        ) : submitted ? (
          <div className="rating-success">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3>{t('user_rating.success_title')}</h3>
            <p>{t('user_rating.success_message')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rating-form">
            <div className="stars-container">
              <div className="stars-wrapper">
                {renderStars()}
              </div>
              <div className="rating-text">
                {rating > 0 && (
                  <span className="selected-rating">
                    {rating} {rating > 1 ? t('user_rating.stars') : t('user_rating.star')}
                  </span>
                )}
              </div>
            </div>

            <div className="comment-section">
              <label htmlFor="comment" className="comment-label">
                {t('user_rating.comment_label')}
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('user_rating.comment_placeholder')}
                className="comment-textarea"
                rows="4"
                maxLength="500"
              />
              <div className="comment-counter">
                {comment.length}/500 {t('user_rating.characters')}
              </div>
            </div>

            {error && (
              <div className="rating-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                  <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="submit-rating-button"
              disabled={loading || rating === 0}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  {t('user_rating.sending')}
                </>
              ) : (
                t('user_rating.submit')
              )}
            </button>
          </form>
        )}

        {renderRecentComments()}
      </div>
    </section>
  );
}

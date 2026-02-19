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

  // Fonction pour formater les dates selon la langue
  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const lang = (i18n.language || 'fr').split(/[-_]/)[0].toLowerCase();

    // Extraire les composants de la date
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Formater avec zéro devant si nécessaire
    const dayStr = day.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString();

    if (lang === 'ar') {
      // Format arabe : JJ/MM/AAAA (identique au français)
      return `${dayStr}/${monthStr}/${yearStr}`;
    } else if (lang === 'en') {
      // Format américain : MM/DD/YYYY
      return `${monthStr}/${dayStr}/${yearStr}`;
    } else {
      // Format français : JJ/MM/AAAA
      return `${dayStr}/${monthStr}/${yearStr}`;
    }
  };
  const [stats, setStats] = useState({
    total_ratings: 0,
    average_rating: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recent_comments: []
  });
  const [allRatings, setAllRatings] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(3);

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
        await checkUserRating();
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        setError(response.message || t('user_rating.submit_error'));
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

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return t('user_rating.just_now');
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const agoStr = t('user_rating.ago');
    const isPrefixAgo = ['fr', 'ar'].includes(i18n.language);

    if (diffInMinutes < 60) {
      return isPrefixAgo ? `${agoStr} ${diffInMinutes}m` : `${diffInMinutes}m ${agoStr}`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return isPrefixAgo ? `${agoStr} ${diffInHours}h` : `${diffInHours}h ${agoStr}`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      const unit = i18n.language === 'fr' ? 'j' : 'd';
      return isPrefixAgo ? `${agoStr} ${diffInDays}${unit}` : `${diffInDays}${unit} ${agoStr}`;
    }
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      const unit = i18n.language === 'fr' ? 'mois' : 'months';
      return isPrefixAgo ? `${agoStr} ${diffInMonths} ${unit}` : `${diffInMonths} ${unit} ${agoStr}`;
    }
    return formatDate(dateString);
  };

  const renderStars = (score, size = 16) => {
    return (
      <div className="stars-row">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={`star-icon ${s <= score ? 'filled' : ''}`}>★</span>
        ))}
      </div>
    );
  };

  const categories = [
    { key: 'cleanliness', label: t('user_rating.cleanliness'), score: (stats.average_rating || 4.2).toFixed(1) },
    { key: 'safety', label: t('user_rating.safety'), score: (stats.average_rating || 4.5).toFixed(1) },
    { key: 'staff', label: t('user_rating.staff'), score: (stats.average_rating || 4.3).toFixed(1) },
    { key: 'amenities', label: t('user_rating.amenities'), score: (stats.average_rating - 0.5 || 3.5).toFixed(1) },
    { key: 'location', label: t('user_rating.location'), score: (stats.average_rating - 1.0 || 3.8).toFixed(1) },
  ];

  const commentsToShow = showAllComments ? (allRatings.length ? allRatings : stats.recent_comments) : stats.recent_comments.slice(0, visibleCommentsCount);

  return (
    <section className="user-rating-section">
      <div className="rating-container">
        <h2 className="section-title">{t('user_rating.section_title')}</h2>

        <div className="rating-overview-grid">
          <div className="rating-summary-card">
            <div className="main-category-badge">{t('user_rating.title_main')}</div>
            <div className="big-score">{stats.average_rating.toFixed(1)}</div>
            {renderStars(Math.round(stats.average_rating))}
            <div className="total-ratings-label">
              {stats.total_ratings >= 1000 ? `${(stats.total_ratings / 1000).toFixed(1)}K` : stats.total_ratings} {t('user_rating.total_ratings')}
            </div>
          </div>

          <div className="distribution-bars">
            {[5, 4, 3, 2, 1].map((s) => {
              const count = stats.distribution[s] || 0;
              const percentage = stats.total_ratings > 0 ? (count / stats.total_ratings) * 100 : 0;
              return (
                <div key={s} className="distribution-row">
                  <div className="progress-bg">
                    <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                  </div>
                  <div className="row-label">
                    <span className="star-level">{s}.0</span>
                    <span className="review-count">{count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count} reviews</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="categories-grid">
          {categories.map((cat) => (
            <div key={cat.key} className="category-badge">
              <span className="cat-score">{cat.score}</span>
              <span className="cat-label">{cat.label}</span>
            </div>
          ))}
        </div>

        <div className="reviews-list">
          {commentsToShow.map((c, i) => (
            <div key={i} className="review-card">
              <div className="reviewer-info">
                <div className="reviewer-avatar">
                  {c.name ? c.name.charAt(0) : t('user_rating.anonymous').charAt(0)}
                </div>
                <div className="reviewer-details">
                  <div className="reviewer-name">{c.name || t('user_rating.anonymous')}</div>
                  <div className="review-time">{getRelativeTime(c.created_at)}</div>
                </div>
                <div className="review-score">
                  <span className="score-num">{c.rating.toFixed(1)}</span>
                  {renderStars(c.rating)}
                </div>
              </div>
              <p className="review-text">{c.comment || 'Great service, highly recommended!'}</p>
            </div>
          ))}
        </div>

        <button
          className="read-all-btn"
          onClick={() => {
            if (!showAllComments) {
              setShowAllComments(true);
              if (allRatings.length === 0) loadAll();
            } else {
              setShowAllComments(false);
            }
          }}
        >
          {showAllComments ? t('user_rating.hide_reviews') : t('user_rating.read_all')}
          <span className={`arrow ${showAllComments ? 'up' : 'down'}`}>∨</span>
        </button>

        {!hasRated && !submitted && (
          <div className="submit-rating-invitation">
            <h3>{t('user_rating.subtitle')}</h3>
            <form onSubmit={handleSubmit} className="minimal-rating-form">
              <div className="interactive-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`interactive-star ${(hoveredRating || rating) >= s ? 'active' : ''}`}
                    onClick={() => handleStarClick(s)}
                    onMouseEnter={() => handleStarHover(s)}
                    onMouseLeave={handleStarLeave}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('user_rating.comment_placeholder')}
                rows="2"
              />
              {error && <div className="error-msg">{error}</div>}
              <button type="submit" className="submit-btn" disabled={loading || rating === 0}>
                {loading ? t('user_rating.sending') : t('user_rating.submit')}
              </button>
            </form>
          </div>
        )}

        {submitted && (
          <div className="rating-success-message">
            {t('user_rating.success_title')}
          </div>
        )}
      </div>
    </section>
  );
}

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './HandWorkerStats.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function HandWorkerStats() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalWorkers: 0,
    totalReservations: 0,
    activeReservations: 0,
    completedReservations: 0,
    totalRevenue: 0,
    averageRating: 0,
    topCategories: [],
    recentReservations: [],
    workersByStatus: {
      available: 0,
      busy: 0,
      unavailable: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      // Charger toutes les données en parallèle
      const [categoriesRes, workersRes, reservationsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/hand-worker-categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/hand-workers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/hand-worker-reservations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [categoriesData, workersData, reservationsData] = await Promise.all([
        categoriesRes.json(),
        workersRes.json(),
        reservationsRes.json()
      ]);

      if (categoriesData.success && workersData.success && reservationsData.success) {
        const categories = categoriesData.data;
        const workers = workersData.data;
        const reservations = reservationsData.data;

        // Calculer les statistiques
        const totalRevenue = reservations.reduce((sum, res) => sum + parseFloat(res.total_price || 0), 0);
        const completedReservations = reservations.filter(res => res.status === 'completed').length;
        const activeReservations = reservations.filter(res => ['pending', 'confirmed', 'in_progress'].includes(res.status)).length;
        
        // Calculer la note moyenne des travailleurs
        const workersWithRating = workers.filter(w => w.rating > 0);
        const averageRating = workersWithRating.length > 0 
          ? workersWithRating.reduce((sum, w) => sum + parseFloat(w.rating), 0) / workersWithRating.length 
          : 0;

        // Statistiques par statut des travailleurs
        const workersByStatus = {
          available: workers.filter(w => w.status === 'available').length,
          busy: workers.filter(w => w.status === 'busy').length,
          unavailable: workers.filter(w => w.status === 'unavailable').length
        };

        // Top catégories par nombre de réservations
        const categoryStats = {};
        reservations.forEach(res => {
          const categoryId = res.category_id;
          if (!categoryStats[categoryId]) {
            categoryStats[categoryId] = { count: 0, revenue: 0, category: null };
          }
          categoryStats[categoryId].count++;
          categoryStats[categoryId].revenue += parseFloat(res.total_price || 0);
        });

        // Trouver les noms des catégories
        Object.keys(categoryStats).forEach(categoryId => {
          const category = categories.find(c => c.id == categoryId);
          if (category) {
            categoryStats[categoryId].category = category;
          }
        });

        const topCategories = Object.values(categoryStats)
          .filter(stat => stat.category)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Réservations récentes
        const recentReservations = reservations
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);

        setStats({
          totalCategories: categories.length,
          totalWorkers: workers.length,
          totalReservations: reservations.length,
          activeReservations,
          completedReservations,
          totalRevenue,
          averageRating,
          topCategories,
          recentReservations,
          workersByStatus
        });
      } else {
        setError('Erreur lors du chargement des statistiques');
      }
    } catch (e) {
      console.error('Error loading stats:', e);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      in_progress: '#8b5cf6',
      completed: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="hand-worker-stats-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hand-worker-stats-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="hand-worker-stats">
      <div className="stats-header">
        <h2>
          <i className="fas fa-tools"></i>
          Statistiques des Travaux Manuels
        </h2>
        <p>Vue d'ensemble des performances des services de travaux manuels</p>
      </div>

      {/* Statistiques principales */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <i className="fas fa-list"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalCategories}</h3>
            <p>Catégories</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalWorkers}</h3>
            <p>Travailleurs</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalReservations}</h3>
            <p>Réservations</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.activeReservations}</h3>
            <p>En cours</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.completedReservations}</h3>
            <p>Terminées</p>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">
            <i className="fas fa-coins"></i>
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Chiffre d'affaires</p>
          </div>
        </div>
      </div>

      {/* Graphiques et détails */}
      <div className="stats-details">
        <div className="stats-section">
          <h3>
            <i className="fas fa-star"></i>
            Performance des Travailleurs
          </h3>
          <div className="performance-grid">
            <div className="performance-card">
              <div className="performance-header">
                <h4>Note Moyenne</h4>
                <div className="rating-display">
                  <span className="rating-value">{stats.averageRating.toFixed(1)}</span>
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`fas fa-star ${i < Math.floor(stats.averageRating) ? 'filled' : ''}`}
                      ></i>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="performance-card">
              <h4>Répartition par Statut</h4>
              <div className="status-distribution">
                <div className="status-item">
                  <span className="status-dot available"></span>
                  <span>Disponibles: {stats.workersByStatus.available}</span>
                </div>
                <div className="status-item">
                  <span className="status-dot busy"></span>
                  <span>Occupés: {stats.workersByStatus.busy}</span>
                </div>
                <div className="status-item">
                  <span className="status-dot unavailable"></span>
                  <span>Indisponibles: {stats.workersByStatus.unavailable}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h3>
            <i className="fas fa-trophy"></i>
            Top Catégories
          </h3>
          <div className="top-categories">
            {stats.topCategories.map((categoryStat, index) => (
              <div key={index} className="category-item">
                <div className="category-rank">#{index + 1}</div>
                <div className="category-info">
                  <h4>{categoryStat.category.name}</h4>
                  <p>{categoryStat.count} réservations</p>
                </div>
                <div className="category-revenue">
                  {formatCurrency(categoryStat.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-section">
          <h3>
            <i className="fas fa-history"></i>
            Réservations Récentes
          </h3>
          <div className="recent-reservations">
            {stats.recentReservations.map((reservation, index) => (
              <div key={index} className="reservation-item">
                <div className="reservation-client">
                  <strong>{reservation.client_first_name} {reservation.client_last_name}</strong>
                  <span className="reservation-service">{reservation.service_description.substring(0, 30)}...</span>
                </div>
                <div className="reservation-details">
                  <span className="reservation-date">{formatDate(reservation.preferred_date)}</span>
                  <span 
                    className="reservation-status"
                    style={{ color: getStatusColor(reservation.status) }}
                  >
                    {getStatusLabel(reservation.status)}
                  </span>
                  <span className="reservation-price">{formatCurrency(reservation.total_price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import './AdminBebeReservationsCrud.css';

const AdminBebeReservationsCrud = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:8000/api/admin/bebe-reservations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReservations(data.data || []);
      } else {
        setError('Erreur lors du chargement des réservations');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:8000/api/admin/bebe-reservations/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await loadReservations();
      } else {
        setError('Erreur lors de la mise à jour du statut');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:8000/api/admin/bebe-reservations/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          await loadReservations();
        } else {
          setError('Erreur lors de la suppression');
        }
      } catch (err) {
        setError('Erreur de connexion');
      }
    }
  };

  const showDetails = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedReservation(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'completed': return 'info';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const clientName = reservation.client_name || '';
    const clientPhone = reservation.client_phone || '';
    
    const matchesSearch = 
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientPhone.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || reservation.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-bebe-reservations">
        <div className="loading">Chargement des réservations...</div>
      </div>
    );
  }

  return (
    <div className="admin-bebe-reservations">
      <div className="admin-header">
        <h2>🍼 Gestion des Réservations Bébé Setting</h2>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={loadReservations}
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
            placeholder="Rechercher par nom ou téléphone..."
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
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmées</option>
          <option value="completed">Terminées</option>
          <option value="cancelled">Annulées</option>
        </select>
      </div>

      <div className="reservations-table-container">
        <table className="reservations-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Téléphone</th>
              <th>Date</th>
              <th>Heures</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  Aucune réservation trouvée
                </td>
              </tr>
            ) : (
              filteredReservations.map(reservation => (
                <tr key={reservation.id}>
                  <td>{reservation.id}</td>
                  <td className="client-name">{reservation.client_name}</td>
                  <td className="client-phone">{reservation.client_phone}</td>
                  <td className="reservation-date">
                    {new Date(reservation.reservation_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="reservation-hours">{reservation.hours}h</td>
                  <td className="reservation-total">{reservation.total_price} MAD</td>
                  <td>
                    <select
                      value={reservation.status}
                      onChange={(e) => handleStatusChange(reservation.id, e.target.value)}
                      className={`status-select ${getStatusColor(reservation.status)}`}
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmée</option>
                      <option value="completed">Terminée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </td>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => showDetails(reservation)}
                      title="Voir les détails"
                    >
                      👁️
                    </button>
                    <button
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(reservation.id)}
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
            <div className="stat-number">{reservations.length}</div>
            <div className="stat-label">Total des réservations</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{reservations.filter(r => r.status === 'pending').length}</div>
            <div className="stat-label">En attente</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{reservations.filter(r => r.status === 'confirmed').length}</div>
            <div className="stat-label">Confirmées</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-number">
              {reservations.reduce((sum, r) => sum + parseFloat(r.total_price || 0), 0).toFixed(0)}
            </div>
            <div className="stat-label">Revenus totaux (MAD)</div>
          </div>
        </div>
      </div>

      {showDetailsModal && selectedReservation && (
        <div className="details-modal">
          <div className="details-container">
            <div className="details-header">
              <h3>Détails de la réservation #{selectedReservation.id}</h3>
              <button className="close-btn" onClick={closeDetailsModal}>✕</button>
            </div>
            
            <div className="details-content">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Nom du client:</label>
                  <span>{selectedReservation.client_name}</span>
                </div>
                
                <div className="detail-item">
                  <label>Téléphone:</label>
                  <span>{selectedReservation.client_phone}</span>
                </div>
                
                <div className="detail-item">
                  <label>Date de réservation:</label>
                  <span>{new Date(selectedReservation.reservation_date).toLocaleDateString('fr-FR')}</span>
                </div>
                
                <div className="detail-item">
                  <label>Durée:</label>
                  <span>{selectedReservation.hours} heures</span>
                </div>
                
                <div className="detail-item">
                  <label>Prix total:</label>
                  <span className="price">{selectedReservation.total_price} MAD</span>
                </div>
                
                <div className="detail-item">
                  <label>Statut:</label>
                  <span className={`status ${getStatusColor(selectedReservation.status)}`}>
                    {getStatusLabel(selectedReservation.status)}
                  </span>
                </div>
                
                <div className="detail-item">
                  <label>Date de création:</label>
                  <span>{new Date(selectedReservation.created_at).toLocaleString('fr-FR')}</span>
                </div>
              </div>
              
              {selectedReservation.notes && (
                <div className="notes-section">
                  <label>Notes:</label>
                  <div className="notes-content">
                    {selectedReservation.notes}
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

export default AdminBebeReservationsCrud;

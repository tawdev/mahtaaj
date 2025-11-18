import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './AdminBebeReservationsCrud.css';

const AdminBebeReservationsCrud = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [useBebeTable, setUseBebeTable] = useState(null); // null = not checked yet, true/false = cached result

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[AdminBebeReservations] Loading reservations from Supabase');
      
      let data = [];
      let tableName = '';
      
      // Check if we should use bebe_reservations table (only check once)
      if (useBebeTable === null) {
        // Try bebe_reservations table first with limit 1 to check existence
        const { error: bebeError } = await supabase
          .from('bebe_reservations')
          .select('id')
          .limit(1);
        
        if (bebeError && (bebeError.code === 'PGRST116' || bebeError.message?.includes('does not exist'))) {
          // Table doesn't exist (404)
          console.log('[AdminBebeReservations] bebe_reservations table not found, using reservations table');
          setUseBebeTable(false);
        } else if (!bebeError) {
          // Table exists
          setUseBebeTable(true);
        }
      }
      
      // Load data based on which table to use
      if (useBebeTable === true) {
        // Load from bebe_reservations table
        const { data: bebeData, error: bebeError } = await supabase
          .from('bebe_reservations')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (bebeError) {
          console.error('[AdminBebeReservations] Error loading from bebe_reservations:', bebeError);
          // Fallback to reservations
          setUseBebeTable(false);
        } else {
          data = bebeData || [];
          tableName = 'bebe_reservations';
        }
      }
      
      // If bebe_reservations doesn't exist or failed, use reservations table
      if (useBebeTable === false || (useBebeTable !== true && data.length === 0)) {
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .eq('service', 'bebe')
          .order('created_at', { ascending: false });
        
        if (reservationsError) {
          console.error('[AdminBebeReservations] Error loading reservations:', reservationsError);
          setError('Erreur lors du chargement des réservations: ' + reservationsError.message);
          return;
        }
        
        // Transform reservations data to match expected format
        data = (reservationsData || []).map(res => ({
          id: res.id,
          client_name: res.firstname || res.client_name || 'N/A',
          client_phone: res.phone || res.client_phone || 'N/A',
          location: res.location || 'Non spécifié',
          reservation_date: res.preferred_date || res.reservation_date || res.created_at,
          hours: res.hours || null,
          days: res.days || null,
          booking_type: res.booking_type || 'heures',
          start_time: res.start_time || null,
          start_date: res.start_date || null,
          end_date: res.end_date || null,
          total_price: res.total_price || 0,
          status: res.status || 'pending',
          notes: res.message || res.notes || null,
          created_at: res.created_at
        }));
        tableName = 'reservations';
        if (useBebeTable === null) {
          setUseBebeTable(false);
        }
      } else if (tableName === 'bebe_reservations') {
        // Transform bebe_reservations data
        data = (data || []).map(res => ({
          id: res.id,
          client_name: res.client_name || 'N/A',
          client_phone: res.client_phone || 'N/A',
          location: res.location || 'Non spécifié',
          reservation_date: res.reservation_date || res.start_date || res.created_at,
          hours: res.hours || null,
          days: res.days || null,
          booking_type: res.booking_type || 'heures',
          start_time: res.start_time || null,
          start_date: res.start_date || null,
          end_date: res.end_date || null,
          total_price: res.total_price || 0,
          status: res.status || 'pending',
          notes: res.notes || null,
          created_at: res.created_at
        }));
      }
      
      console.log(`[AdminBebeReservations] Loaded ${data?.length || 0} reservations from ${tableName || 'reservations'} table`);
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[AdminBebeReservations] Exception loading reservations:', err);
      setError('Erreur de connexion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      setError('');
      console.log('[AdminBebeReservations] Updating status:', reservationId, newStatus);
      
      const tableName = useBebeTable ? 'bebe_reservations' : 'reservations';
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ status: newStatus })
        .eq('id', reservationId);
      
      if (updateError) {
        console.error('[AdminBebeReservations] Error updating status:', updateError);
        setError('Erreur lors de la mise à jour du statut: ' + updateError.message);
        return;
      }
      
      await loadReservations();
    } catch (err) {
      console.error('[AdminBebeReservations] Exception updating status:', err);
      setError('Erreur de connexion: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      try {
        setError('');
        console.log('[AdminBebeReservations] Deleting reservation:', id);
        
        const tableName = useBebeTable ? 'bebe_reservations' : 'reservations';
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);
        
        if (deleteError) {
          console.error('[AdminBebeReservations] Error deleting reservation:', deleteError);
          setError('Erreur lors de la suppression: ' + deleteError.message);
          return;
        }
        
        await loadReservations();
      } catch (err) {
        console.error('[AdminBebeReservations] Exception deleting reservation:', err);
        setError('Erreur de connexion: ' + err.message);
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
                    {reservation.reservation_date 
                      ? new Date(reservation.reservation_date).toLocaleDateString('fr-FR')
                      : 'N/A'}
                  </td>
                  <td className="reservation-hours">
                    {reservation.booking_type === 'jours' 
                      ? `${reservation.days || 'N/A'} jour(s)`
                      : `${reservation.hours || 'N/A'}h`}
                  </td>
                  <td className="reservation-total">{reservation.total_price || 0} MAD</td>
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
                  <span>
                    {selectedReservation.reservation_date 
                      ? new Date(selectedReservation.reservation_date).toLocaleDateString('fr-FR')
                      : 'N/A'}
                  </span>
                </div>
                
                <div className="detail-item">
                  <label>Type de réservation:</label>
                  <span>{selectedReservation.booking_type === 'jours' ? 'Par jours' : 'Par heures'}</span>
                </div>
                
                <div className="detail-item">
                  <label>Durée:</label>
                  <span>
                    {selectedReservation.booking_type === 'jours' 
                      ? `${selectedReservation.days || 'N/A'} jour(s)`
                      : `${selectedReservation.hours || 'N/A'} heure(s)`}
                    {selectedReservation.start_time && ` (Début: ${selectedReservation.start_time})`}
                  </span>
                </div>
                
                {selectedReservation.booking_type === 'jours' && (
                  <>
                    {selectedReservation.start_date && (
                      <div className="detail-item">
                        <label>Date de début:</label>
                        <span>{new Date(selectedReservation.start_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    {selectedReservation.end_date && (
                      <div className="detail-item">
                        <label>Date de fin:</label>
                        <span>{new Date(selectedReservation.end_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </>
                )}
                
                {selectedReservation.location && (
                  <div className="detail-item">
                    <label>Lieu:</label>
                    <span>{selectedReservation.location}</span>
                  </div>
                )}
                
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

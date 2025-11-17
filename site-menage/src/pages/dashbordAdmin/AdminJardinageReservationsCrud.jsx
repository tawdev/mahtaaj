import React, { useState, useEffect } from 'react';
import './AdminJardinageReservationsCrud.css';
import { supabase } from '../../lib/supabase';

const AdminJardinageReservationsCrud = () => {
  const [reservations, setReservations] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadReservations();
    loadServices();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[AdminJardinageReservations] Loading reservations from Supabase...');
      
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('jardinage_reservations')
        .select(`
          *,
          service:jardins (
            id,
            name,
            name_fr,
            name_ar,
            name_en,
            price,
            duration
          )
        `)
        .order('created_at', { ascending: false });
      
      if (reservationsError) {
        console.error('[AdminJardinageReservations] Error loading reservations:', reservationsError);
        setError(`Erreur lors du chargement: ${reservationsError.message}`);
      } else {
        console.log('[AdminJardinageReservations] Loaded reservations:', reservationsData?.length || 0);
        setReservations(Array.isArray(reservationsData) ? reservationsData : []);
      }
    } catch (err) {
      console.error('[AdminJardinageReservations] Exception loading reservations:', err);
      setError(`Erreur: ${err.message || 'Erreur de connexion'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      console.log('[AdminJardinageReservations] Loading services from Supabase...');
      
      const { data: servicesData, error: servicesError } = await supabase
        .from('jardins')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });
      
      if (servicesError) {
        console.error('[AdminJardinageReservations] Error loading services:', servicesError);
      } else {
        console.log('[AdminJardinageReservations] Loaded services:', servicesData?.length || 0);
        setServices(Array.isArray(servicesData) ? servicesData : []);
      }
    } catch (err) {
      console.error('[AdminJardinageReservations] Exception loading services:', err);
    }
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      console.log('[AdminJardinageReservations] Updating status:', reservationId, newStatus);
      
      const { error } = await supabase
        .from('jardinage_reservations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId);
      
      if (error) {
        console.error('[AdminJardinageReservations] Error updating status:', error);
        setError(`Erreur lors de la mise à jour: ${error.message}`);
      } else {
        console.log('[AdminJardinageReservations] Status updated successfully');
        await loadReservations();
      }
    } catch (err) {
      console.error('[AdminJardinageReservations] Exception updating status:', err);
      setError(`Erreur: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      try {
        console.log('[AdminJardinageReservations] Deleting reservation:', id);
        
        const { error } = await supabase
          .from('jardinage_reservations')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('[AdminJardinageReservations] Error deleting reservation:', error);
          setError(`Erreur lors de la suppression: ${error.message}`);
        } else {
          console.log('[AdminJardinageReservations] Reservation deleted successfully');
          await loadReservations();
        }
      } catch (err) {
        console.error('[AdminJardinageReservations] Exception deleting reservation:', err);
        setError(`Erreur: ${err.message}`);
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

  const getServiceName = (serviceId, serviceData) => {
    // Try to get name from joined service data first
    if (serviceData) {
      return serviceData.name || serviceData.name_fr || serviceData.name_ar || serviceData.name_en || 'Service inconnu';
    }
    // Fallback to services list
    const service = services.find(s => s.id === serviceId);
    return service ? (service.name || service.name_fr || service.name_ar || service.name_en || 'Service inconnu') : 'Service inconnu';
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
    const serviceName = getServiceName(reservation.jardinage_service_id, reservation.service) || '';
    
    const matchesSearch = 
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientPhone.includes(searchTerm) ||
      serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || reservation.status === filterStatus;
    const matchesService = filterService === 'all' || reservation.jardinage_service_id == filterService;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  if (loading) {
    return (
      <div className="admin-jardinage-reservations">
        <div className="loading">Chargement des réservations...</div>
      </div>
    );
  }

  return (
    <div className="admin-jardinage-reservations">
      <div className="admin-header">
        <h2>🌿 Gestion des Réservations Jardinage</h2>
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
            placeholder="Rechercher par nom, téléphone ou service..."
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
      </div>

      <div className="reservations-table-container">
        <table className="reservations-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Téléphone</th>
              <th>Service</th>
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
                <td colSpan="9" className="no-data">
                  Aucune réservation trouvée
                </td>
              </tr>
            ) : (
              filteredReservations.map(reservation => (
                <tr key={reservation.id}>
                  <td>{reservation.id}</td>
                  <td className="client-name">{reservation.client_name}</td>
                  <td className="client-phone">{reservation.client_phone}</td>
                  <td className="service-name">{getServiceName(reservation.jardinage_service_id, reservation.service)}</td>
                  <td className="reservation-date">
                    {reservation.reservation_date ? new Date(reservation.reservation_date).toLocaleDateString('fr-FR') : '-'}
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
                  <label>Service:</label>
                  <span>{getServiceName(selectedReservation.jardinage_service_id, selectedReservation.service)}</span>
                </div>
                
                <div className="detail-item">
                  <label>Date de réservation:</label>
                  <span>{selectedReservation.reservation_date ? new Date(selectedReservation.reservation_date).toLocaleDateString('fr-FR') : '-'}</span>
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

export default AdminJardinageReservationsCrud;

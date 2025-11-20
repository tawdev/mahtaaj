import React, { useEffect, useState } from 'react';
import { 
  getDriverReservations, 
  createDriverReservation, 
  updateDriverReservation, 
  deleteDriverReservation,
  getDriverEmployees
} from '../../api-supabase';
import './AdminCrud.css';

export default function AdminDriverReservationsCrud({ token, onAuthError }) {
  const [reservations, setReservations] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [formData, setFormData] = useState({ 
    driver_id: '',
    reservation_date: '', 
    reservation_time: '',
    status: 'pending',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    message: ''
  });

  const getToken = () => token || localStorage.getItem('adminToken');

  useEffect(() => {
    loadReservations();
    loadDrivers();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getDriverReservations();
      setReservations(data || []);
    } catch (e) {
      console.error('Error loading driver reservations:', e);
      if (e.message?.includes('JWT') || e.message?.includes('expired')) {
        if (onAuthError) onAuthError();
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError(e.message || 'Erreur de connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const data = await getDriverEmployees();
      setDrivers(data || []);
    } catch (e) {
      console.error('Error loading drivers:', e);
    }
  };

  const showNotification = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      if (editingReservation) {
        await updateDriverReservation(editingReservation.id, formData);
        showNotification('Réservation modifiée avec succès');
      } else {
        await createDriverReservation(formData);
        showNotification('Réservation créée avec succès');
      }
      
      setShowForm(false);
      setEditingReservation(null);
      setFormData({ 
        driver_id: '', 
        reservation_date: '', 
        reservation_time: '',
        status: 'pending',
        full_name: '',
        email: '',
        phone: '',
        address: '',
        message: ''
      });
      loadReservations();
    } catch (e) {
      const errorMsg = e.message || 'Erreur lors de la sauvegarde';
      showNotification(errorMsg, 'error');
    }
  };

  const handleEdit = (reservation) => {
    setEditingReservation(reservation);
    // Format date for input (YYYY-MM-DD)
    const dateValue = reservation.reservation_date 
      ? (reservation.reservation_date.includes('T') 
          ? reservation.reservation_date.split('T')[0] 
          : reservation.reservation_date)
      : '';
    // Format time for input (HH:MM)
    const timeValue = reservation.reservation_time 
      ? (reservation.reservation_time.includes('T') 
          ? reservation.reservation_time.split('T')[1]?.substring(0, 5)
          : reservation.reservation_time.substring(0, 5))
      : '';
    setFormData({ 
      driver_id: reservation.driver_id || '', 
      reservation_date: dateValue,
      reservation_time: timeValue,
      status: reservation.status || 'pending',
      full_name: reservation.full_name || '',
      email: reservation.email || '',
      phone: reservation.phone || '',
      address: reservation.address || '',
      message: reservation.message || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      return;
    }
    try {
      setError('');
      await deleteDriverReservation(id);
      showNotification('Réservation supprimée avec succès');
      loadReservations();
    } catch (e) {
      const errorMsg = e.message || 'Erreur lors de la suppression';
      showNotification(errorMsg, 'error');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReservation(null);
    setFormData({ 
      driver_id: '', 
      reservation_date: '', 
      reservation_time: '',
      status: 'pending',
      full_name: '',
      email: '',
      phone: '',
      address: '',
      message: ''
    });
    setError('');
    setSuccess('');
  };

  const filteredReservations = reservations.filter(reservation => {
    const searchLower = searchTerm.toLowerCase();
    const driver = reservation.driver_employees || {};
    const matchesSearch = 
      (reservation.full_name || '').toLowerCase().includes(searchLower) ||
      (reservation.phone || '').toLowerCase().includes(searchLower) ||
      (reservation.email || '').toLowerCase().includes(searchLower) ||
      (driver.full_name || '').toLowerCase().includes(searchLower) ||
      (driver.phone || '').toLowerCase().includes(searchLower) ||
      (reservation.id || '').toString().includes(searchLower);
    const matchesStatus = filterStatus === 'all' || reservation.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading && reservations.length === 0) {
    return (
      <div className="admin-crud">
        <div className="admin-crud-loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="admin-crud">
      <div className="admin-crud-header">
        <h2>Gestion des Réservations Chauffeurs</h2>
        <button 
          onClick={() => { 
            setShowForm(true); 
            setEditingReservation(null); 
            setFormData({ 
              driver_id: '', 
              reservation_date: '', 
              reservation_time: '',
              status: 'pending',
              full_name: '',
              email: '',
              phone: '',
              address: '',
              message: ''
            }); 
          }}
          className="admin-crud-add-button"
        >
          + Ajouter une Réservation
        </button>
      </div>

      {(error || success) && (
        <div className={`admin-crud-notification ${error ? 'error' : 'success'}`}>
          {error || success}
        </div>
      )}

      {showForm && (
        <div className="admin-crud-form-overlay">
          <div className="admin-crud-form">
            <div className="admin-crud-form-header">
              <h3>{editingReservation ? 'Modifier' : 'Créer'} une Réservation</h3>
              <button type="button" className="admin-crud-close-button" onClick={handleCancel} aria-label="Fermer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-crud-field">
                <label htmlFor="driver_id">Chauffeur</label>
                <select
                  id="driver_id"
                  value={formData.driver_id}
                  onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                >
                  <option value="">Sélectionner un chauffeur (optionnel)</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name} - {driver.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-crud-field">
                <label htmlFor="full_name">Nom Complet *</label>
                <input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                  placeholder="Nom complet du client"
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="phone">Téléphone *</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  placeholder="+212 6 12 34 56 78"
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="client@email.com"
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="address">Adresse</label>
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Adresse complète"
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="reservation_date">Date de Réservation *</label>
                <input
                  id="reservation_date"
                  type="date"
                  value={formData.reservation_date}
                  onChange={(e) => setFormData({...formData, reservation_date: e.target.value})}
                  required
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="reservation_time">Heure</label>
                <input
                  id="reservation_time"
                  type="time"
                  value={formData.reservation_time}
                  onChange={(e) => setFormData({...formData, reservation_time: e.target.value})}
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="message">Message Supplémentaire</label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Message supplémentaire du client"
                  rows="4"
                />
              </div>
              <div className="admin-crud-field">
                <label htmlFor="status">Statut *</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  required
                >
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="cancelled">Annulé</option>
                  <option value="completed">Terminé</option>
                </select>
              </div>
              <div className="admin-crud-form-actions">
                <button type="submit" className="admin-crud-save-button">
                  {editingReservation ? 'Modifier' : 'Créer'}
                </button>
                <button type="button" onClick={handleCancel} className="admin-crud-cancel-button">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-crud-filters">
        <input
          type="text"
          placeholder="Rechercher (nom, téléphone, ID)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-crud-search-input"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="admin-crud-filter-select"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmé</option>
          <option value="cancelled">Annulé</option>
          <option value="completed">Terminé</option>
        </select>
      </div>

      <div className="admin-crud-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom Complet</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Date</th>
              <th>Heure</th>
              <th>Statut</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">Aucune réservation trouvée</td>
              </tr>
            ) : (
              filteredReservations.map((reservation) => {
                const driver = reservation.driver_employees || {};
                return (
                  <tr key={reservation.id}>
                    <td style={{ fontSize: '12px' }}>{reservation.id.substring(0, 8)}...</td>
                    <td>{reservation.full_name || driver.full_name || '-'}</td>
                    <td>{reservation.phone || driver.phone || '-'}</td>
                    <td>{reservation.email || '-'}</td>
                    <td>{reservation.reservation_date ? new Date(reservation.reservation_date).toLocaleDateString() : '-'}</td>
                    <td>{reservation.reservation_time ? reservation.reservation_time.substring(0, 5) : '-'}</td>
                    <td>
                      <span className={`status-badge ${reservation.status === 'confirmed' ? 'active' : reservation.status === 'completed' ? 'active' : 'inactive'}`}>
                        {reservation.status === 'pending' ? 'En attente' : 
                         reservation.status === 'confirmed' ? 'Confirmé' :
                         reservation.status === 'cancelled' ? 'Annulé' :
                         reservation.status === 'completed' ? 'Terminé' : reservation.status}
                      </span>
                    </td>
                    <td>{reservation.created_at ? new Date(reservation.created_at).toLocaleDateString() : '-'}</td>
                    <td>
                      <button 
                        onClick={() => handleEdit(reservation)}
                        className="admin-crud-edit-button"
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => handleDelete(reservation.id)}
                        className="admin-crud-delete-button"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


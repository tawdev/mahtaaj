import React, { useState, useEffect } from 'react';
import { getReservationsAdmin, createReservationAdmin, updateReservationAdmin, deleteReservationAdmin, updateReservationStatus } from '../../api-supabase';
import './AdminReservationCrud.css';

export default function AdminReservationCrud({ token }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [formData, setFormData] = useState({
    firstname: '',
    phone: '',
    location: '',
    service: '',
    type: '',
    size: '',
    total_price: '',
    message: '',
    email: '',
    status: 'pending',
    preferred_date: '',
    admin_notes: ''
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  const statusOptions = [
    { value: 'pending', label: 'En attente', color: '#f59e0b' },
    { value: 'confirmed', label: 'Confirmée', color: '#10b981' },
    { value: 'cancelled', label: 'Annulée', color: '#ef4444' },
    { value: 'completed', label: 'Terminée', color: '#6b7280' }
  ];

  useEffect(() => {
    loadReservations();
  }, [token]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await getReservationsAdmin(token);
      setReservations(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      setError('Impossible de charger les réservations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReservation) {
        await updateReservationAdmin(token, editingReservation.id, formData);
      } else {
        await createReservationAdmin(token, formData);
      }
      setShowForm(false);
      setEditingReservation(null);
      resetForm();
      loadReservations();
    } catch (e) {
      setError(e.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (reservation) => {
    setEditingReservation(reservation);
    setFormData({
      firstname: reservation.firstname || '',
      phone: reservation.phone || '',
      location: reservation.location || '',
      service: reservation.service || '',
      type: reservation.type || '',
      size: reservation.size || '',
      total_price: reservation.total_price || '',
      message: reservation.message || '',
      email: reservation.email || '',
      status: reservation.status || 'pending',
      preferred_date: reservation.preferred_date ? reservation.preferred_date.split('T')[0] : '',
      admin_notes: reservation.admin_notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      return;
    }
    try {
      await deleteReservationAdmin(token, id);
      loadReservations();
    } catch (e) {
      setError(e.message || 'Erreur lors de la suppression');
    }
  };

  const handleStatusChange = async (reservation, newStatus) => {
    try {
      await updateReservationStatus(token, reservation.id, newStatus);
      loadReservations();
    } catch (e) {
      setError(e.message || 'Erreur lors de la modification du statut');
    }
  };

  const resetForm = () => {
    setFormData({
      firstname: '',
      phone: '',
      location: '',
      service: '',
      type: '',
      size: '',
      total_price: '',
      message: '',
      email: '',
      status: 'pending',
      preferred_date: '',
      admin_notes: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReservation(null);
    resetForm();
  };

  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: statusOption?.color || '#6b7280' }}
      >
        {statusOption?.label || status}
      </span>
    );
  };

  if (loading) return <div className="admin-reservations-loading">Chargement des réservations...</div>;
  if (error) return <div className="admin-reservations-error">{error}</div>;

  return (
    <div className="admin-reservations-crud">
      <div className="admin-reservations-header">
        <h2 className="admin-reservations-title">Gestion des Réservations</h2>
        <div className="header-actions">
          <div className="view-mode-toggle">
            <button
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'active' : ''}
            >
              📊 Tableau
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={viewMode === 'cards' ? 'active' : ''}
            >
              🎴 Cartes
            </button>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="admin-reservations-add-button"
          >
            + Nouvelle Réservation
          </button>
        </div>
      </div>

      {error && <div className="admin-reservations-error">{error}</div>}

      {showForm && (
        <div className="admin-reservations-form-overlay">
          <div className="admin-reservations-form">
            <h3>{editingReservation ? 'Modifier' : 'Créer'} une Réservation</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstname">Prénom *</label>
                  <input
                    id="firstname"
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => setFormData({...formData, firstname: e.target.value})}
                    required
                    placeholder="Prénom du client"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Téléphone *</label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                    placeholder="Numéro de téléphone"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">Lieu *</label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                  placeholder="Lieu de la prestation"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="service">Service *</label>
                  <input
                    id="service"
                    type="text"
                    value={formData.service}
                    onChange={(e) => setFormData({...formData, service: e.target.value})}
                    required
                    placeholder="Type de service"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="type">Type</label>
                  <input
                    id="type"
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    placeholder="Type (ex: Maison, Villa, etc.)"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="size">Taille (m²)</label>
                  <input
                    id="size"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                    placeholder="Surface en m²"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="total_price">Prix total (€)</label>
                  <input
                    id="total_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_price}
                    onChange={(e) => setFormData({...formData, total_price: e.target.value})}
                    placeholder="Prix en euros"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required
                  rows="4"
                  placeholder="Détails de la prestation..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Email du client"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Statut *</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    required
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="preferred_date">Date préférée</label>
                  <input
                    id="preferred_date"
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({...formData, preferred_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="admin_notes">Notes admin</label>
                <textarea
                  id="admin_notes"
                  value={formData.admin_notes}
                  onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                  rows="3"
                  placeholder="Notes internes..."
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="save-button">
                  {editingReservation ? 'Modifier' : 'Créer'}
                </button>
                <button type="button" onClick={handleCancel} className="cancel-button">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'table' ? (
        <div className="admin-reservations-table-container">
          <table className="admin-reservations-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Prénom</th>
                <th>Téléphone</th>
                <th>Lieu</th>
                <th>Service</th>
                <th>Type</th>
                <th>Taille</th>
                <th>Prix Total</th>
                <th>Message</th>
                <th>Email</th>
                <th>Statut</th>
                <th>Date Préférée</th>
                <th>Notes Admin</th>
                <th>Créé le</th>
                <th>Modifié le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan="16" className="no-data">Aucune réservation trouvée</td>
                </tr>
              ) : (
                reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td>{reservation.id}</td>
                    <td>{reservation.firstname || '-'}</td>
                    <td>{reservation.phone || '-'}</td>
                    <td>{reservation.location || '-'}</td>
                    <td>{reservation.service || '-'}</td>
                    <td>{reservation.type || '-'}</td>
                    <td>{reservation.size || '-'}</td>
                    <td>{reservation.total_price ? parseFloat(reservation.total_price).toFixed(2) + ' €' : '-'}</td>
                    <td className="message-cell" title={reservation.message || ''}>
                      {reservation.message ? (reservation.message.length > 30 ? reservation.message.substring(0, 30) + '...' : reservation.message) : '-'}
                    </td>
                    <td>{reservation.email || '-'}</td>
                    <td>{getStatusBadge(reservation.status || 'pending')}</td>
                    <td>{reservation.preferred_date ? new Date(reservation.preferred_date).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="notes-cell" title={reservation.admin_notes || ''}>
                      {reservation.admin_notes ? (reservation.admin_notes.length > 20 ? reservation.admin_notes.substring(0, 20) + '...' : reservation.admin_notes) : '-'}
                    </td>
                    <td>{new Date(reservation.created_at).toLocaleString('fr-FR')}</td>
                    <td>{new Date(reservation.updated_at).toLocaleString('fr-FR')}</td>
                    <td className="actions-cell">
                      <button 
                        onClick={() => handleEdit(reservation)}
                        className="btn-edit"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(reservation.id)}
                        className="btn-delete"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                      <select
                        value={reservation.status || 'pending'}
                        onChange={(e) => handleStatusChange(reservation, e.target.value)}
                        className="status-select"
                        title="Changer le statut"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-reservations-grid">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="admin-reservation-card">
              <div className="reservation-header">
                <div className="reservation-info">
                  <h4 className="reservation-name">{reservation.firstname}</h4>
                  <p className="reservation-phone">{reservation.phone}</p>
                  <p className="reservation-service">{reservation.service}</p>
                </div>
                <div className="reservation-status">
                  {getStatusBadge(reservation.status)}
                </div>
              </div>
              
              <div className="reservation-details">
                <p className="reservation-location">
                  <strong>Lieu:</strong> {reservation.location}
                </p>
                {reservation.type && (
                  <p className="reservation-type">
                    <strong>Type:</strong> {reservation.type}
                  </p>
                )}
                {reservation.size && (
                  <p className="reservation-size">
                    <strong>Taille:</strong> {reservation.size} m²
                  </p>
                )}
                {reservation.total_price && (
                  <p className="reservation-price">
                    <strong>Prix:</strong> {parseFloat(reservation.total_price).toFixed(2)} €
                  </p>
                )}
                <p className="reservation-message">
                  <strong>Message:</strong> {reservation.message}
                </p>
                {reservation.email && (
                  <p className="reservation-email">
                    <strong>Email:</strong> {reservation.email}
                  </p>
                )}
                {reservation.preferred_date && (
                  <p className="reservation-date">
                    <strong>Date préférée:</strong> {new Date(reservation.preferred_date).toLocaleDateString()}
                  </p>
                )}
                {reservation.admin_notes && (
                  <p className="reservation-notes">
                    <strong>Notes:</strong> {reservation.admin_notes}
                  </p>
                )}
              </div>

              <div className="reservation-actions">
                <div className="status-buttons">
                  {statusOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(reservation, option.value)}
                      className={`status-button ${reservation.status === option.value ? 'active' : ''}`}
                      style={{ backgroundColor: option.color }}
                      title={`Marquer comme ${option.label}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="action-buttons">
                  <button 
                    onClick={() => handleEdit(reservation)}
                    className="edit-button"
                  >
                    Modifier
                  </button>
                  <button 
                    onClick={() => handleDelete(reservation.id)}
                    className="delete-button"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="reservation-meta">
                <small>Créé le {new Date(reservation.created_at).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './AdminReservationCrud.css';

export default function AdminHousekeepingReservations({ tableName, title, token, onAuthError }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const statusOptions = [
    { value: 'pending', label: 'En attente', color: '#f59e0b' },
    { value: 'confirmed', label: 'Confirmée', color: '#10b981' },
    { value: 'cancelled', label: 'Annulée', color: '#ef4444' },
    { value: 'completed', label: 'Terminée', color: '#6b7280' }
  ];

  useEffect(() => {
    loadReservations();
  }, [tableName, token]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error: supabaseError } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error(`Error loading ${tableName}:`, supabaseError);
        setError(`Erreur lors du chargement: ${supabaseError.message}`);
        return;
      }

      setReservations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(`Exception loading ${tableName}:`, e);
      setError(`Erreur: ${e.message || 'Impossible de charger les réservations'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reservation, newStatus) => {
    try {
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', reservation.id);

      if (updateError) {
        console.error(`Error updating status:`, updateError);
        setError(`Erreur lors de la modification du statut: ${updateError.message}`);
        return;
      }

      loadReservations();
    } catch (e) {
      console.error(`Exception updating status:`, e);
      setError(`Erreur: ${e.message || 'Impossible de modifier le statut'}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      return;
    }
    try {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error(`Error deleting reservation:`, deleteError);
        setError(`Erreur lors de la suppression: ${deleteError.message}`);
        return;
      }

      loadReservations();
    } catch (e) {
      console.error(`Exception deleting reservation:`, e);
      setError(`Erreur: ${e.message || 'Impossible de supprimer la réservation'}`);
    }
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
        <h2 className="admin-reservations-title">{title}</h2>
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
            onClick={loadReservations}
            className="admin-reservations-add-button"
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {error && <div className="admin-reservations-error">{error}</div>}

      {viewMode === 'table' ? (
        <div className="admin-reservations-table-container">
          <table className="admin-reservations-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Prénom</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>Lieu</th>
                <th>Prix</th>
                <th>Statut</th>
                <th>Date préférée</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan="10" className="no-data">Aucune réservation trouvée</td>
                </tr>
              ) : (
                reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td>{reservation.id}</td>
                    <td>{reservation.firstname || '-'}</td>
                    <td>{reservation.phone || '-'}</td>
                    <td>{reservation.email || '-'}</td>
                    <td>{reservation.location || '-'}</td>
                    <td>
                      {reservation.total_price || reservation.final_price
                        ? parseFloat(reservation.total_price || reservation.final_price).toFixed(2) + ' €'
                        : '-'}
                    </td>
                    <td>{getStatusBadge(reservation.status || 'pending')}</td>
                    <td>{reservation.preferred_date ? new Date(reservation.preferred_date).toLocaleDateString('fr-FR') : '-'}</td>
                    <td>{reservation.created_at ? new Date(reservation.created_at).toLocaleString('fr-FR') : '-'}</td>
                    <td className="actions-cell">
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
          {reservations.length === 0 ? (
            <div className="no-data">Aucune réservation trouvée</div>
          ) : (
            reservations.map((reservation) => (
              <div key={reservation.id} className="admin-reservation-card">
                <div className="reservation-header">
                  <div className="reservation-info">
                    <h4 className="reservation-name">{reservation.firstname || 'N/A'}</h4>
                    <p className="reservation-phone">{reservation.phone || '-'}</p>
                    {reservation.email && <p className="reservation-email">{reservation.email}</p>}
                  </div>
                  <div className="reservation-status">
                    {getStatusBadge(reservation.status)}
                  </div>
                </div>
                
                <div className="reservation-details">
                  {reservation.location && (
                    <p className="reservation-location">
                      <strong>Lieu:</strong> {reservation.location}
                    </p>
                  )}
                  {(reservation.total_price || reservation.final_price) && (
                    <p className="reservation-price">
                      <strong>Prix:</strong> {parseFloat(reservation.total_price || reservation.final_price).toFixed(2)} €
                    </p>
                  )}
                  {reservation.preferred_date && (
                    <p className="reservation-date">
                      <strong>Date préférée:</strong> {new Date(reservation.preferred_date).toLocaleDateString()}
                    </p>
                  )}
                  {reservation.message && (
                    <p className="reservation-message">
                      <strong>Message:</strong> {reservation.message}
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
                      onClick={() => handleDelete(reservation.id)}
                      className="delete-button"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="reservation-meta">
                  <small>Créé le {reservation.created_at ? new Date(reservation.created_at).toLocaleString() : '-'}</small>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}


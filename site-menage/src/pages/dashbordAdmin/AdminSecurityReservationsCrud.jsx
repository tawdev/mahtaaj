import React, { useEffect, useState } from 'react';
import './AdminSecurityReservationsCrud.css';
import { supabase } from '../../lib/supabase';

export default function AdminSecurityReservationsCrud({ token, onAuthError }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReservations();
  }, [token]);

  const loadReservations = async () => {
    try {
      setError('');
      setLoading(true);
      console.log('[AdminSecurityReservations] Loading security reservations from Supabase...');
      
      // Load reservations with related data (security)
      // Note: user data is stored in the reservation itself (firstname, email)
      // We'll load roles separately and match them
      const { data, error } = await supabase
        .from('reserve_security')
        .select(`
          *,
          security:securities (
            id,
            full_name,
            name,
            role_id
          )
        `)
        .order('created_at', { ascending: false});
      
      if (error) {
        console.error('[AdminSecurityReservations] Error loading reservations:', error);
        setError(`Erreur lors du chargement: ${error.message}`);
        return;
      }
      
      // Load security roles separately
      let roles = [];
      if (data && data.length > 0) {
        const { data: rolesData } = await supabase
          .from('security_roles')
          .select('*');
        roles = rolesData || [];
      }
      
      console.log('[AdminSecurityReservations] Loaded reservations:', data?.length || 0);
      
      // Transform data to match expected format
      const transformedData = Array.isArray(data) ? data.map(res => {
        // Extract type_reservation, heure_debut, heure_fin from admin_notes if not in columns
        let typeReservation = res.type_reservation || 'jour';
        let heureDebut = res.heure_debut || '';
        let heureFin = res.heure_fin || '';
        
        // If not in columns, try to extract from admin_notes
        if (!res.type_reservation && res.admin_notes) {
          const notes = res.admin_notes;
          if (notes.includes('Type: jour')) typeReservation = 'jour';
          else if (notes.includes('Type: heure')) typeReservation = 'heure';
          
          const startMatch = notes.match(/Start:\s*([0-9]{2}:[0-9]{2})/);
          const endMatch = notes.match(/End:\s*([0-9]{2}:[0-9]{2})/);
          if (startMatch) heureDebut = startMatch[1];
          if (endMatch) heureFin = endMatch[1];
        }
        
        // Extract date_reservation from preferred_date if not in column
        let dateReservation = res.date_reservation;
        if (!dateReservation && res.preferred_date) {
          dateReservation = new Date(res.preferred_date).toISOString().split('T')[0];
        }
        
        // Find role for this security
        const securityRoleId = res.security?.role_id;
        const securityRole = securityRoleId ? roles.find(r => r.id === securityRoleId) : null;
        
        return {
          id: res.id,
          user_name: res.firstname || 'N/A',
          user_email: res.email || 'N/A',
          security_name: res.security?.full_name || res.security?.name || 'Non assigné',
          security_role: securityRole ? (securityRole.name || securityRole.name_fr || securityRole.name_ar || 'N/A') : 'N/A',
          type_reservation: typeReservation,
          date_reservation: dateReservation || '',
          heure_debut: heureDebut,
          heure_fin: heureFin,
          prix_total: res.total_price || 0,
          status: res.status || 'pending',
          created_at: res.created_at,
          ...res
        };
      }) : [];
      
      setReservations(transformedData);
    } catch (e) {
      console.error('[AdminSecurityReservations] Exception loading reservations:', e);
      setError(`Erreur: ${e.message || 'Impossible de charger les réservations'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesType = filterType === 'all' || reservation.type_reservation === filterType;
    const matchesSearch = searchTerm === '' || 
      reservation.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.security_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  };

  const getTypeLabel = (type) => {
    return type === 'jour' ? 'Journée' : 'Heure';
  };

  const getTypeIcon = (type) => {
    return type === 'jour' ? '📅' : '⏰';
  };

  return (
    <div className="admin-security-reservations">
      <div className="admin-header">
        <h2>Gestion des Réservations Sécurité</h2>
        <div className="admin-actions">
          <button onClick={loadReservations} className="refresh-btn">
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
        <div className="filter-group">
          <label>Type de réservation:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Toutes</option>
            <option value="jour">Journée</option>
            <option value="heure">Heure</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Rechercher:</label>
          <input
            type="text"
            placeholder="Nom utilisateur, agent ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Chargement des réservations...</div>
      ) : (
        <div className="reservations-grid">
          {filteredReservations.length > 0 ? (
            filteredReservations.map((reservation) => (
              <div key={reservation.id} className="reservation-card">
                <div className="reservation-header">
                  <div className="reservation-type">
                    <span className="type-icon">{getTypeIcon(reservation.type_reservation)}</span>
                    <span className="type-label">{getTypeLabel(reservation.type_reservation)}</span>
                  </div>
                  <div className="reservation-price">
                    {parseFloat(reservation.prix_total || 0).toFixed(2)} DH
                  </div>
                </div>

                <div className="reservation-details">
                  <div className="detail-row">
                    <span className="detail-label">👤 Client:</span>
                    <span className="detail-value">{reservation.user_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📧 Email:</span>
                    <span className="detail-value">{reservation.user_email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">🛡️ Agent:</span>
                    <span className="detail-value">{reservation.security_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">🎭 Rôle:</span>
                    <span className="detail-value">{reservation.security_role}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📅 Date:</span>
                    <span className="detail-value">{formatDate(reservation.date_reservation)}</span>
                  </div>
                  {reservation.type_reservation === 'heure' && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">🕐 Début:</span>
                        <span className="detail-value">{formatTime(reservation.heure_debut)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">🕕 Fin:</span>
                        <span className="detail-value">{formatTime(reservation.heure_fin)}</span>
                      </div>
                    </>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">📝 Créé le:</span>
                    <span className="detail-value">{formatDate(reservation.created_at)}</span>
                  </div>
                </div>

                <div className="reservation-status">
                  <span className="status-badge active">Confirmée</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-reservations">
              <div className="no-reservations-icon">📋</div>
              <h3>Aucune réservation trouvée</h3>
              <p>Il n'y a pas de réservations correspondant à vos critères.</p>
            </div>
          )}
        </div>
      )}

      <div className="reservations-summary">
        <div className="summary-card">
          <h4>📊 Résumé</h4>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total réservations:</span>
              <span className="stat-value">{reservations.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">À la journée:</span>
              <span className="stat-value">{reservations.filter(r => r.type_reservation === 'jour').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">À l'heure:</span>
              <span className="stat-value">{reservations.filter(r => r.type_reservation === 'heure').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Revenus totaux:</span>
              <span className="stat-value">{reservations.reduce((sum, r) => sum + parseFloat(r.prix_total || 0), 0).toFixed(2)} DH</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

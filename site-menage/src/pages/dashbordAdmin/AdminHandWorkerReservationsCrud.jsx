import React, { useState, useEffect } from 'react';
import './AdminHandWorkerReservationsCrud.css';
import { supabase } from '../../lib/supabase';

export default function AdminHandWorkerReservationsCrud({ token, onAuthError }) {
  const [reservations, setReservations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [handWorkers, setHandWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReservation, setEditingReservation] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    client_first_name: '',
    client_last_name: '',
    client_email: '',
    client_phone: '',
    category_id: '',
    hand_worker_id: '',
    service_description: '',
    preferred_date: '',
    preferred_time: '',
    duration_hours: '',
    location: '',
    address: '',
    city: '',
    total_price: '',
    status: 'pending',
    admin_notes: '',
    client_notes: '',
    estimated_completion_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[AdminHandWorkerReservations] Loading data from Supabase...');
      
      // Load categories from Supabase
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('hand_worker_categories')
        .select('*')
        .order('order', { ascending: true });
      
      if (categoriesError) {
        console.error('[AdminHandWorkerReservations] Error loading categories:', categoriesError);
      } else {
        console.log('[AdminHandWorkerReservations] Loaded categories:', categoriesData?.length || 0);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      }

      // Load hand workers from Supabase
      const { data: workersData, error: workersError } = await supabase
        .from('hand_workers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (workersError) {
        console.error('[AdminHandWorkerReservations] Error loading workers:', workersError);
      } else {
        console.log('[AdminHandWorkerReservations] Loaded workers:', workersData?.length || 0);
        setHandWorkers(Array.isArray(workersData) ? workersData : []);
      }

      // Load reservations from Supabase with related data
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('hand_worker_reservations')
        .select(`
          *,
          category:hand_worker_categories (
            id,
            name,
            name_fr,
            name_ar,
            name_en
          ),
          hand_worker:hand_workers (
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (reservationsError) {
        console.error('[AdminHandWorkerReservations] Error loading reservations:', reservationsError);
        setError(`Erreur lors du chargement des réservations: ${reservationsError.message}`);
      } else {
        console.log('[AdminHandWorkerReservations] Loaded reservations:', reservationsData?.length || 0);
        
        // Transform data to include client_full_name
        const transformedReservations = Array.isArray(reservationsData) ? reservationsData.map(res => ({
          ...res,
          client_full_name: `${res.client_first_name || ''} ${res.client_last_name || ''}`.trim()
        })) : [];
        
        setReservations(transformedReservations);
      }
    } catch (e) {
      console.error('[AdminHandWorkerReservations] Exception loading data:', e);
      setError(`Erreur: ${e.message || 'Erreur lors du chargement des données'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      
      console.log('[AdminHandWorkerReservations] Saving reservation:', { editing: !!editingReservation, formData });
      
      // Prepare data for Supabase
      const reservationData = {
        client_first_name: formData.client_first_name,
        client_last_name: formData.client_last_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone,
        category_id: formData.category_id || null,
        hand_worker_id: formData.hand_worker_id || null,
        service_description: formData.service_description,
        preferred_date: formData.preferred_date || null,
        preferred_time: formData.preferred_time || null,
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
        location: formData.location,
        address: formData.address,
        city: formData.city,
        total_price: formData.total_price ? parseFloat(formData.total_price) : null,
        status: formData.status || 'pending',
        admin_notes: formData.admin_notes || null,
        client_notes: formData.client_notes || null,
        estimated_completion_date: formData.estimated_completion_date || null
      };
      
      let result;
      if (editingReservation) {
        // Update existing
        const { data, error } = await supabase
          .from('hand_worker_reservations')
          .update(reservationData)
          .eq('id', editingReservation.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('hand_worker_reservations')
          .insert(reservationData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      console.log('[AdminHandWorkerReservations] Save successful:', result);
      
      await loadData();
      resetForm();
      setShowForm(false);
    } catch (e) {
      console.error('[AdminHandWorkerReservations] Error saving reservation:', e);
      setError(e.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (reservation) => {
    setEditingReservation(reservation);
    setFormData({
      client_first_name: reservation.client_first_name,
      client_last_name: reservation.client_last_name,
      client_email: reservation.client_email,
      client_phone: reservation.client_phone,
      category_id: reservation.category_id,
      hand_worker_id: reservation.hand_worker_id || '',
      service_description: reservation.service_description,
      preferred_date: reservation.preferred_date ? reservation.preferred_date.split('T')[0] : '',
      preferred_time: reservation.preferred_time || '',
      duration_hours: reservation.duration_hours,
      location: reservation.location,
      address: reservation.address,
      city: reservation.city,
      total_price: reservation.total_price,
      status: reservation.status,
      admin_notes: reservation.admin_notes || '',
      client_notes: reservation.client_notes || '',
      estimated_completion_date: reservation.estimated_completion_date ? reservation.estimated_completion_date.split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      return;
    }

    try {
      console.log('[AdminHandWorkerReservations] Deleting reservation:', id);
      
      const { error } = await supabase
        .from('hand_worker_reservations')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('[AdminHandWorkerReservations] Error deleting reservation:', error);
        setError(`Erreur lors de la suppression: ${error.message}`);
        return;
      }
      
      console.log('[AdminHandWorkerReservations] Delete successful');
      await loadData();
    } catch (e) {
      console.error('[AdminHandWorkerReservations] Exception deleting reservation:', e);
      setError(`Erreur: ${e.message}`);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      console.log('[AdminHandWorkerReservations] Updating status:', { id, newStatus });
      
      const { error } = await supabase
        .from('hand_worker_reservations')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) {
        console.error('[AdminHandWorkerReservations] Error updating status:', error);
        setError(`Erreur lors de la mise à jour du statut: ${error.message}`);
        return;
      }
      
      console.log('[AdminHandWorkerReservations] Status update successful');
      await loadData();
    } catch (e) {
      console.error('[AdminHandWorkerReservations] Exception updating status:', e);
      setError(`Erreur: ${e.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      client_first_name: '',
      client_last_name: '',
      client_email: '',
      client_phone: '',
      category_id: '',
      hand_worker_id: '',
      service_description: '',
      preferred_date: '',
      preferred_time: '',
      duration_hours: '',
      location: '',
      address: '',
      city: '',
      total_price: '',
      status: 'pending',
      admin_notes: '',
      client_notes: '',
      estimated_completion_date: ''
    });
    setEditingReservation(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Non spécifiée';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? (category.name || category.name_fr || category.name_ar || category.name_en || 'Catégorie inconnue') : 'Catégorie inconnue';
  };

  const getWorkerName = (workerId) => {
    if (!workerId) return 'Non assigné';
    const worker = handWorkers.find(w => w.id === workerId);
    return worker ? `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || 'Non assigné' : 'Non assigné';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-hand-worker-reservations-crud">
      <div className="admin-header">
        <h2>Gestion des Réservations Travaux Manuels</h2>
        <button 
          className="add-button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Ajouter une réservation
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h3>{editingReservation ? 'Modifier la réservation' : 'Nouvelle réservation'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h4>Informations Client</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Prénom *</label>
                    <input
                      type="text"
                      value={formData.client_first_name}
                      onChange={(e) => setFormData({...formData, client_first_name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Nom *</label>
                    <input
                      type="text"
                      value={formData.client_last_name}
                      onChange={(e) => setFormData({...formData, client_last_name: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Téléphone *</label>
                    <input
                      type="tel"
                      value={formData.client_phone}
                      onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Détails du Service</h4>
                <div className="form-group">
                  <label>Catégorie *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Employé assigné</label>
                  <select
                    value={formData.hand_worker_id}
                    onChange={(e) => setFormData({...formData, hand_worker_id: e.target.value})}
                  >
                    <option value="">Non assigné</option>
                    {handWorkers.map(worker => (
                      <option key={worker.id} value={worker.id}>
                        {worker.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Description du service *</label>
                  <textarea
                    value={formData.service_description}
                    onChange={(e) => setFormData({...formData, service_description: e.target.value})}
                    rows="3"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date préférée *</label>
                    <input
                      type="date"
                      value={formData.preferred_date}
                      onChange={(e) => setFormData({...formData, preferred_date: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Heure préférée</label>
                    <input
                      type="time"
                      value={formData.preferred_time}
                      onChange={(e) => setFormData({...formData, preferred_time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Durée (heures) *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData({...formData, duration_hours: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Prix total (DH)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.total_price}
                      onChange={(e) => setFormData({...formData, total_price: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Localisation</h4>
                <div className="form-group">
                  <label>Nom du lieu *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Adresse *</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows="2"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ville *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Statut et Notes</h4>
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmée</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notes client</label>
                  <textarea
                    value={formData.client_notes}
                    onChange={(e) => setFormData({...formData, client_notes: e.target.value})}
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Notes admin</label>
                  <textarea
                    value={formData.admin_notes}
                    onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Date d'achèvement estimée</label>
                  <input
                    type="date"
                    value={formData.estimated_completion_date}
                    onChange={(e) => setFormData({...formData, estimated_completion_date: e.target.value})}
                  />
                </div>
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

      <div className="reservations-list">
        {reservations.length === 0 ? (
          <div className="no-data">Aucune réservation trouvée</div>
        ) : (
          <div className="reservations-grid">
            {reservations.map(reservation => (
              <div key={reservation.id} className="reservation-card">
                <div className="reservation-header">
                  <div className="reservation-info">
                    <h3>{reservation.client_full_name || `${reservation.client_first_name} ${reservation.client_last_name}`.trim()}</h3>
                    <p className="reservation-category">
                      {reservation.category 
                        ? (reservation.category.name || reservation.category.name_fr || reservation.category.name_ar || reservation.category.name_en || 'Catégorie inconnue')
                        : getCategoryName(reservation.category_id)}
                    </p>
                  </div>
                  <div className="reservation-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(reservation)}
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(reservation.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="reservation-content">
                  <div className="reservation-details">
                    <div className="detail-item">
                      <span className="label">Email:</span>
                      <span className="value">{reservation.client_email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Téléphone:</span>
                      <span className="value">{reservation.client_phone}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Employé:</span>
                      <span className="value">
                        {reservation.hand_worker 
                          ? `${reservation.hand_worker.first_name || ''} ${reservation.hand_worker.last_name || ''}`.trim() || 'Non assigné'
                          : getWorkerName(reservation.hand_worker_id)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Date:</span>
                      <span className="value">
                        {reservation.preferred_date 
                          ? new Date(reservation.preferred_date).toLocaleDateString('fr-FR')
                          : '-'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Durée:</span>
                      <span className="value">{reservation.duration_hours}h</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Prix:</span>
                      <span className="value">{reservation.total_price} DH</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Statut:</span>
                      <span 
                        className="status"
                        style={{ backgroundColor: getStatusColor(reservation.status) }}
                      >
                        {getStatusLabel(reservation.status)}
                      </span>
                    </div>
                  </div>

                  <div className="reservation-description">
                    <h4>Description du service:</h4>
                    <p>{reservation.service_description}</p>
                  </div>

                  <div className="reservation-location">
                    <h4>Localisation:</h4>
                    <p><strong>{reservation.location}</strong></p>
                    <p>{reservation.address}, {reservation.city}</p>
                  </div>

                  {reservation.client_notes && (
                    <div className="reservation-notes">
                      <h4>Notes client:</h4>
                      <p>{reservation.client_notes}</p>
                    </div>
                  )}

                  {reservation.admin_notes && (
                    <div className="reservation-admin-notes">
                      <h4>Notes admin:</h4>
                      <p>{reservation.admin_notes}</p>
                    </div>
                  )}

                  <div className="reservation-status-actions">
                    <h4>Actions rapides:</h4>
                    <div className="status-buttons">
                      <button 
                        className={`status-btn ${reservation.status === 'confirmed' ? 'active' : ''}`}
                        onClick={() => handleStatusUpdate(reservation.id, 'confirmed')}
                      >
                        Confirmer
                      </button>
                      <button 
                        className={`status-btn ${reservation.status === 'in_progress' ? 'active' : ''}`}
                        onClick={() => handleStatusUpdate(reservation.id, 'in_progress')}
                      >
                        En cours
                      </button>
                      <button 
                        className={`status-btn ${reservation.status === 'completed' ? 'active' : ''}`}
                        onClick={() => handleStatusUpdate(reservation.id, 'completed')}
                      >
                        Terminer
                      </button>
                      <button 
                        className={`status-btn ${reservation.status === 'cancelled' ? 'active' : ''}`}
                        onClick={() => handleStatusUpdate(reservation.id, 'cancelled')}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

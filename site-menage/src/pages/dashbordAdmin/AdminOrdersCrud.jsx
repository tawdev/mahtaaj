import React, { useEffect, useState } from 'react';
import './AdminOrdersCrud.css';
import { supabase } from '../../lib/supabase';

export default function AdminOrdersCrud({ token, onAuthError }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderCard, setShowOrderCard] = useState(false);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minTotal, setMinTotal] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        setError('Impossible de charger les commandes: ' + error.message);
        return;
      }

      setOrders(data || []);
    } catch (e) {
      console.error('Exception loading orders:', e);
      setError('Impossible de charger les commandes: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      setStatusUpdating(orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        alert('Échec de la mise à jour du statut: ' + error.message);
        return;
      }

      await loadOrders();
    } catch (e) {
      console.error('Exception updating order status:', e);
      alert('Échec de la mise à jour du statut: ' + e.message);
    } finally {
      setStatusUpdating(null);
    }
  };

  const statusOptions = ['pending','confirmed','processing','shipped','completed','cancelled'];

  const showOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderCard(true);
  };

  const closeOrderCard = () => {
    setShowOrderCard(false);
    setSelectedOrder(null);
  };

  // Filtering and sorting functions
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPaymentFilter('');
    setDateFrom('');
    setDateTo('');
    setMinTotal('');
    setMaxTotal('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const getFilteredAndSortedOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone?.includes(searchTerm) ||
        order.id?.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Payment method filter
    if (paymentFilter) {
      filtered = filtered.filter(order => order.payment_method === paymentFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) <= new Date(dateTo + 'T23:59:59')
      );
    }

    // Total range filter
    if (minTotal) {
      filtered = filtered.filter(order => 
        parseFloat(order.total || 0) >= parseFloat(minTotal)
      );
    }
    if (maxTotal) {
      filtered = filtered.filter(order => 
        parseFloat(order.total || 0) <= parseFloat(maxTotal)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'full_name':
          aValue = a.full_name?.toLowerCase() || '';
          bValue = b.full_name?.toLowerCase() || '';
          break;
        case 'total':
          aValue = parseFloat(a.total || 0);
          bValue = parseFloat(b.total || 0);
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredOrders = getFilteredAndSortedOrders();

  return (
    <section className="admin-card admin-orders">
      <div className="admin-toolbar orders-toolbar">
        <h2 className="orders-title">
          <span className="orders-title-icon" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7H21M6 11H18M6 15H14M4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          Commandes ({filteredOrders.length})
        </h2>
        <div className="toolbar-actions">
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Afficher/Masquer les filtres"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4H21M7 8H17M9 12H15M11 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Filtres
          </button>
          <button className="admin-refresh" onClick={loadOrders} disabled={loading} title="Actualiser">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4V10H7M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M22.99 14A9 9 0 0 1 3.64 18.36L7 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            {/* Search */}
            <div className="filter-group">
              <label className="filter-label">Recherche</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Nom, email, téléphone, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label className="filter-label">Statut</label>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="filter-group">
              <label className="filter-label">Paiement</label>
              <select
                className="filter-select"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="">Toutes les méthodes</option>
                <option value="credit_card">Carte de crédit</option>
                <option value="cash">Espèces</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Virement bancaire</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="filter-group">
              <label className="filter-label">Date de début</label>
              <input
                type="date"
                className="filter-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Date de fin</label>
              <input
                type="date"
                className="filter-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Total Range */}
            <div className="filter-group">
              <label className="filter-label">Total minimum (€)</label>
              <input
                type="number"
                className="filter-input"
                placeholder="0"
                value={minTotal}
                onChange={(e) => setMinTotal(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Total maximum (€)</label>
              <input
                type="number"
                className="filter-input"
                placeholder="1000"
                value={maxTotal}
                onChange={(e) => setMaxTotal(e.target.value)}
              />
            </div>

            {/* Sort */}
            <div className="filter-group">
              <label className="filter-label">Trier par</label>
              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_at">Date de création</option>
                <option value="id">ID</option>
                <option value="full_name">Nom du client</option>
                <option value="total">Total</option>
                <option value="status">Statut</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Ordre</label>
              <select
                className="filter-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Décroissant</option>
                <option value="asc">Croissant</option>
              </select>
            </div>
          </div>

          <div className="filters-actions">
            <button className="clear-filters-btn" onClick={clearFilters}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Effacer les filtres
            </button>
          </div>
        </div>
      )}

      {error && <div className="admin-error">{error}</div>}

      <div className="orders-table-wrapper">
        <table className="admin-table orders-table">
          <thead className="admin-thead">
            <tr>
              <th className="admin-th">#</th>
              <th className="admin-th">Client</th>
              <th className="admin-th">Email</th>
              <th className="admin-th">Téléphone</th>
              <th className="admin-th">Articles</th>
              <th className="admin-th">Total</th>
              <th className="admin-th">Paiement</th>
              <th className="admin-th">Statut</th>
              <th className="admin-th">Créé</th>
              <th className="admin-th">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o) => (
              <tr key={o.id}>
                <td className="admin-td">{o.id}</td>
                <td className="admin-td">{o.full_name}</td>
                <td className="admin-td">{o.email}</td>
                <td className="admin-td">{o.phone}</td>
                <td className="admin-td items-count">{Array.isArray(o.items) ? o.items.length : (o.items ? Object.keys(o.items || {}).length : 0)}</td>
                <td className="admin-td">{parseFloat(o.total || 0).toFixed(2)} €</td>
                <td className="admin-td">
                  <span className={`payment-chip ${String(o.payment_method||'').toLowerCase()}`}>
                    <span className="chip-icon" aria-hidden>
                      {String(o.payment_method||'').toLowerCase() === 'cash' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <rect x="2" y="9" width="20" height="4" fill="currentColor"/>
                        </svg>
                      )}
                    </span>
                    {o.payment_method || '-'}
                  </span>
                </td>
                <td className="admin-td">
                  <div className="status-cell">
                    <span className={`status-badge status-${String(o.status||'pending').toLowerCase()}`}>
                      <span className="badge-icon" aria-hidden>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      {o.status || 'pending'}
                    </span>
                    <select
                      className="status-select"
                      value={o.status || 'pending'}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      disabled={statusUpdating === o.id}
                    >
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </td>
                <td className="admin-td">{o.created_at ? new Date(o.created_at).toLocaleString() : ''}</td>
                <td className="admin-td">
                  <button 
                    className="details-button"
                    onClick={() => showOrderDetails(o)}
                    title="Voir les détails de la commande"
                  >
                    <span className="details-icon" aria-hidden>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 20L3 11L7 7L12 12L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Details Card Modal */}
      {showOrderCard && selectedOrder && (
        <div className="order-card-overlay" onClick={closeOrderCard}>
          <div className="order-card" onClick={(e) => e.stopPropagation()}>
            <div className="order-card-header">
              <h3 className="order-card-title">
                <span className="order-card-icon" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 7H21M6 11H18M6 15H14M4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                Commande #{selectedOrder.id}
              </h3>
              <button className="close-button" onClick={closeOrderCard} title="Fermer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="order-card-content">
              {/* Articles */}
              <div className="order-section">
                <h4 className="section-title">
                  <span className="section-icon" aria-hidden>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 7H21M6 11H18M6 15H14M4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  Articles commandés
                </h4>
                <div className="items-list">
                  {Array.isArray(selectedOrder.items) ? selectedOrder.items.map((item, index) => (
                    <div key={index} className="item-card">
                      <div className="item-info">
                        <div className="item-name">{item.name || `Produit #${item.product_id}`}</div>
                        <div className="item-details">
                          <span className="item-price">{parseFloat(item.price || 0).toFixed(2)} €</span>
                          <span className="item-quantity">x{item.quantity || 1}</span>
                          <span className="item-total">= {(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)} €</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="no-items">Aucun article trouvé</div>
                  )}
                </div>
              </div>

              {/* Adresse de livraison */}
              <div className="order-section">
                <h4 className="section-title">
                  <span className="section-icon" aria-hidden>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  Adresse de livraison
                </h4>
                <div className="address-info">
                  <div className="address-line">{selectedOrder.address || 'Non renseignée'}</div>
                  <div className="address-line">{selectedOrder.city || ''} {selectedOrder.zip || ''}</div>
                  {selectedOrder.notes && (
                    <div className="order-notes">
                      <strong>Notes:</strong> {selectedOrder.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Résumé de la commande */}
              <div className="order-section">
                <h4 className="section-title">
                  <span className="section-icon" aria-hidden>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  Résumé
                </h4>
                <div className="order-summary">
                  <div className="summary-line">
                    <span>Client:</span>
                    <span>{selectedOrder.full_name}</span>
                  </div>
                  <div className="summary-line">
                    <span>Email:</span>
                    <span>{selectedOrder.email}</span>
                  </div>
                  <div className="summary-line">
                    <span>Téléphone:</span>
                    <span>{selectedOrder.phone}</span>
                  </div>
                  <div className="summary-line">
                    <span>Nombre d'articles:</span>
                    <span>{Array.isArray(selectedOrder.items) ? selectedOrder.items.length : 0}</span>
                  </div>
                  <div className="summary-line">
                    <span>Total:</span>
                    <span className="total-amount">{parseFloat(selectedOrder.total || 0).toFixed(2)} €</span>
                  </div>
                  <div className="summary-line">
                    <span>Méthode de paiement:</span>
                    <span className="payment-method">{selectedOrder.payment_method || 'Non spécifiée'}</span>
                  </div>
                  <div className="summary-line">
                    <span>Statut:</span>
                    <span className={`status-badge status-${String(selectedOrder.status||'pending').toLowerCase()}`}>
                      {selectedOrder.status || 'pending'}
                    </span>
                  </div>
                  <div className="summary-line">
                    <span>Date de commande:</span>
                    <span>{selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

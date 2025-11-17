import React, { useState, useEffect } from 'react';
import './AdminCartCrud.css';

const AdminCartCrud = ({ token }) => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  const [selectedCart, setSelectedCart] = useState(null);
  const [showCartDetails, setShowCartDetails] = useState(false);

  const statusOptions = ['Tous', 'Actif', 'Vide', 'Commande'];

  useEffect(() => {
    loadCarts();
  }, []);

  const loadCarts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/carts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des paniers');
      }

      const data = await response.json();
      setCarts(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCart = async (cartId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/carts/${cartId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du panier');
      }

      const data = await response.json();
      setSelectedCart(data.data || data);
      setShowCartDetails(true);
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleRemoveItem = async (cartId, itemId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article du panier ?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/carts/${cartId}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await loadCarts();
      if (selectedCart && selectedCart.id === cartId) {
        await handleViewCart(cartId);
      }
      alert('Article supprimé avec succès');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleClearCart = async (cartId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir vider ce panier ?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/carts/${cartId}/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du vidage du panier');
      }

      await loadCarts();
      setShowCartDetails(false);
      setSelectedCart(null);
      alert('Panier vidé avec succès');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const filteredCarts = carts.filter(cart => {
    const matchesSearch = 
      (cart.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cart.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      cart.id.toString().includes(searchTerm);
    
    const matchesStatus = selectedStatus === 'Tous' || 
      (selectedStatus === 'Actif' && cart.items_count > 0) ||
      (selectedStatus === 'Vide' && cart.items_count === 0) ||
      (selectedStatus === 'Commande' && cart.status === 'ordered');
    
    return matchesSearch && matchesStatus;
  });

  const calculateTotalItems = () => {
    return carts.reduce((total, cart) => total + cart.items_count, 0);
  };

  const calculateTotalValue = () => {
    return carts.reduce((total, cart) => total + (cart.total_value || 0), 0);
  };

  if (loading) {
    return (
      <div className="admin-cart-crud">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des paniers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-cart-crud">
      <div className="admin-cart-header">
        <h2>Gestion des Paniers</h2>
        <button 
          className="admin-cart-refresh-button"
          onClick={loadCarts}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4V10H7M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M22.99 14A9 9 0 0 1 3.64 18.36L7 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Actualiser
        </button>
      </div>

      <div className="admin-cart-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher par utilisateur ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="status-filter">
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="status-select"
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-cart-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13M17 13H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{carts.length}</div>
            <div className="stat-label">Paniers total</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{calculateTotalItems()}</div>
            <div className="stat-label">Articles total</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6312 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6312 13.6815 18 14.5717 18 15.5C18 16.4283 17.6312 17.3185 16.9749 17.9749C16.3185 18.6312 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{calculateTotalValue().toFixed(2)} €</div>
            <div className="stat-label">Valeur totale</div>
          </div>
        </div>
      </div>

      <div className="admin-cart-list">
        {filteredCarts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13M17 13H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Aucun panier trouvé</h3>
            <p>Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="cart-grid">
            {filteredCarts.map(cart => (
              <div key={cart.id} className="cart-card">
                <div className="cart-card-header">
                  <div className="cart-user-info">
                    <h3 className="cart-user-name">{cart.user?.name || 'Utilisateur supprimé'}</h3>
                    <p className="cart-user-email">{cart.user?.email || 'N/A'}</p>
                  </div>
                  <div className={`cart-status ${cart.items_count > 0 ? 'active' : 'empty'}`}>
                    {cart.items_count > 0 ? 'Actif' : 'Vide'}
                  </div>
                </div>
                
                <div className="cart-card-content">
                  <div className="cart-info-row">
                    <span className="cart-info-label">Articles:</span>
                    <span className="cart-info-value">{cart.items_count}</span>
                  </div>
                  <div className="cart-info-row">
                    <span className="cart-info-label">Valeur:</span>
                    <span className="cart-info-value">{cart.total_value?.toFixed(2) || '0.00'} €</span>
                  </div>
                  <div className="cart-info-row">
                    <span className="cart-info-label">Créé:</span>
                    <span className="cart-info-value">
                      {cart.created_at ? new Date(cart.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="cart-info-row">
                    <span className="cart-info-label">Modifié:</span>
                    <span className="cart-info-value">
                      {cart.updated_at ? new Date(cart.updated_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="cart-card-actions">
                  <button 
                    className="view-cart-button"
                    onClick={() => handleViewCart(cart.id)}
                    disabled={cart.items_count === 0}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Voir le panier
                  </button>
                  {cart.items_count > 0 && (
                    <button 
                      className="clear-cart-button"
                      onClick={() => handleClearCart(cart.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Vider
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCartDetails && selectedCart && (
        <div className="cart-details-overlay">
          <div className="cart-details-container">
            <div className="cart-details-header">
              <h3>Détails du panier - {selectedCart.user?.name || 'Utilisateur supprimé'}</h3>
              <button className="close-button" onClick={() => setShowCartDetails(false)}>×</button>
            </div>
            
            <div className="cart-details-content">
              {selectedCart.items && selectedCart.items.length > 0 ? (
                <>
                  <div className="cart-items-list">
                    {selectedCart.items.map(item => (
                      <div key={item.id} className="cart-detail-item">
                        <div className="item-image">
                          {item.product?.image ? (
                            <img src={item.product.image} alt={item.product.name} />
                          ) : (
                            <div className="no-image">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="item-info">
                          <h4>{item.product?.name || 'Produit supprimé'}</h4>
                          <p>Quantité: {item.quantity}</p>
                          <p>Prix unitaire: {item.price.toFixed(2)} €</p>
                        </div>
                        
                        <div className="item-total">
                          {(item.quantity * item.price).toFixed(2)} €
                        </div>
                        
                        <button 
                          className="remove-item-button"
                          onClick={() => handleRemoveItem(selectedCart.id, item.id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="cart-details-summary">
                    <div className="summary-row">
                      <span>Total articles:</span>
                      <span>{selectedCart.items.reduce((total, item) => total + item.quantity, 0)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Valeur totale:</span>
                      <span>{selectedCart.items.reduce((total, item) => total + (item.quantity * item.price), 0).toFixed(2)} €</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-cart-message">
                  <p>Ce panier est vide</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCartCrud;

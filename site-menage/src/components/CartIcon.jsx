import React, { useState, useEffect } from 'react';
import './CartIcon.css';
import { supabase } from '../lib/supabase';

const CartIcon = ({ onClick, token, count }) => {
  const [itemsCount, setItemsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof count === 'number') {
      setItemsCount(count);
      return;
    }
    loadCartItemsCount();
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCartItemsCount();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [token, count]);

  const loadCartItemsCount = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Load cart count from Supabase
        const { data, error } = await supabase
          .from('carts')
          .select('quantity')
          .eq('user_id', session.user.id);
        
        if (!error && data) {
          const count = data.reduce((total, item) => total + (parseInt(item.quantity, 10) || 0), 0);
          setItemsCount(count);
        }
      } else {
        // Guest cart from localStorage
        const cartKey = 'guest_cart';
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        const count = cart.reduce((total, item) => total + (parseInt(item.quantity, 10) || 0), 0);
        setItemsCount(count);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du panier:', err);
      // Fallback to localStorage
      const cartKey = 'guest_cart';
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      const count = cart.reduce((total, item) => total + (parseInt(item.quantity, 10) || 0), 0);
      setItemsCount(count);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="cart-icon-button" onClick={onClick}>
      <div className="cart-icon-container">
        🛒
        {itemsCount > 0 && (
          <span className="cart-badge">
            {itemsCount > 99 ? '99+' : itemsCount}
          </span>
        )}
        {loading && (
          <div className="cart-loading-indicator"></div>
        )}
      </div>
    </button>
  );
};

export default CartIcon;

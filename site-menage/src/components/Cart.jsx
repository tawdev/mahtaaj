import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Cart.css';
import { supabase } from '../lib/supabase';

const Cart = ({ isOpen, onClose, token }) => {
  const { t } = useTranslation();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helpers pour fiabiliser les valeurs numériques
  const toNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };

  const formatPrice = (value) => toNumber(value).toFixed(2);

  useEffect(() => {
    if (isOpen) {
      loadCartItems();
    }
  }, [isOpen]);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Load cart from Supabase
        const { data, error } = await supabase
          .from('carts')
          .select(`
            *,
            products (*)
          `)
          .eq('user_id', session.user.id);
        
        if (error) {
          throw error;
        }
        
        // Transform Supabase data to match expected format
        const items = (data || []).map(cartItem => ({
          id: cartItem.id,
          product_id: cartItem.product_id,
          quantity: cartItem.quantity || 1,
          price: cartItem.products?.price || 0,
          product: cartItem.products ? {
            id: cartItem.products.id,
            name: cartItem.products.name || cartItem.products.name_fr || cartItem.products.name_en || cartItem.products.name_ar || t('cart_page.product_deleted'),
            description: cartItem.products.description || cartItem.products.description_fr || cartItem.products.description_en || cartItem.products.description_ar || '',
            image: cartItem.products.image || null
          } : {
            id: cartItem.product_id,
            name: t('cart_page.product_deleted'),
            description: '',
            image: null
          }
        }));
        
        // Filter out deleted products
        const validItems = items.filter(item => 
          item.product && 
          item.product.name !== t('cart_page.product_deleted') && 
          item.price > 0
        );
        
        setCartItems(validItems);
      } else {
        // Guest cart from localStorage
        const cartKey = 'guest_cart';
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        setCartItems([]); // For now, guest cart is empty in this component
      }
    } catch (err) {
      setError(err.message || t('cart_page.error'));
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeItem(cartItemId);
      return;
    }

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { error } = await supabase
          .from('carts')
          .update({ quantity: newQuantity })
          .eq('id', cartItemId)
          .eq('user_id', session.user.id);
        
        if (error) {
          throw error;
        }
        
        await loadCartItems();
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        // Guest cart - update localStorage
        const cartKey = 'guest_cart';
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        const item = cart.find(item => item.product_id === cartItemId);
        if (item) {
          item.quantity = newQuantity;
          localStorage.setItem(cartKey, JSON.stringify(cart));
          window.dispatchEvent(new CustomEvent('cartUpdated'));
        }
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { error } = await supabase
          .from('carts')
          .delete()
          .eq('id', cartItemId)
          .eq('user_id', session.user.id);
        
        if (error) {
          throw error;
        }
        
        await loadCartItems();
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        // Guest cart - remove from localStorage
        const cartKey = 'guest_cart';
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        const filteredCart = cart.filter(item => item.product_id !== cartItemId);
        localStorage.setItem(cartKey, JSON.stringify(filteredCart));
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const clearCart = async () => {
    if (!window.confirm(t('cart_page.confirm_clear'))) {
      return;
    }

    try {
      // Supprimer tous les éléments un par un
      for (const item of cartItems) {
        await removeItem(item.id);
      }
    } catch (err) {
      alert(t('cart_page.clear_error'));
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const qty = toNumber(item.quantity);
      const price = toNumber(item.price);
      return total + qty * price;
    }, 0);
  };

  const calculateItemsCount = () => {
    return cartItems.reduce((count, item) => count + toNumber(item.quantity), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="cart-overlay">
      <div className="cart-container">
        <div className="cart-header">
          <h2>{t('cart_page.my_cart')}</h2>
          <button className="cart-close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="cart-content">
          {loading ? (
            <div className="cart-loading">
              <div className="loading-spinner"></div>
              <p>{t('cart_page.loading')}</p>
            </div>
          ) : error ? (
            <div className="cart-error">
              <div className="error-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>{t('cart_page.error')}</h3>
              <p>{error}</p>
              <button className="retry-button" onClick={loadCartItems}>
                {t('cart_page.retry')}
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="cart-empty">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13M17 13H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>{t('cart_page.empty')}</h3>
              <p>{t('cart_page.empty_description')}</p>
              <button className="continue-shopping-button" onClick={onClose}>
                {t('cart_page.continue_shopping')}
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      {(() => {
                        const imagePath = item.product?.image;
                        if (!imagePath || imagePath === 'null' || imagePath === 'undefined' || imagePath === '') {
                          return (
                            <div className="no-image" style={{display: 'flex'}}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          );
                        }
                        
                        // Initialize imageUrl
                        let imageUrl = imagePath;
                        
                        // Old Laravel storage path - extract filename and try to load from Supabase
                        if (imagePath.includes('/storage/images/products/') || 
                            imagePath.includes('127.0.0.1') || 
                            imagePath.includes('localhost:8000') || 
                            imagePath.startsWith('/storage/')) {
                          console.log('[Cart] Detected Laravel path, extracting filename:', imagePath);
                          
                          // Extract filename from Laravel path
                          let filename = '';
                          if (imagePath.includes('/storage/images/products/')) {
                            const parts = imagePath.split('/storage/images/products/');
                            filename = parts[parts.length - 1];
                          } else if (imagePath.includes('/products/')) {
                            const parts = imagePath.split('/products/');
                            filename = parts[parts.length - 1];
                          } else {
                            const parts = imagePath.split('/');
                            filename = parts[parts.length - 1];
                          }
                          
                          // Remove query parameters if any
                          if (filename.includes('?')) {
                            filename = filename.split('?')[0];
                          }
                          
                          if (filename) {
                            // Use filename only - getPublicUrl will construct the correct path
                            console.log('[Cart] Trying to load from Supabase Storage:', filename);
                            
                            try {
                              const { data: { publicUrl } } = supabase.storage
                                .from('products')
                                .getPublicUrl(filename);
                              
                              if (publicUrl) {
                                // Check if URL is valid (doesn't contain double 'products/')
                                if (publicUrl.includes('products/products/')) {
                                  console.warn('[Cart] ⚠️ Double products/ in URL, fixing:', publicUrl);
                                  // Fix by removing one 'products/'
                                  imageUrl = publicUrl.replace('/products/products/', '/products/');
                                  console.log('[Cart] Using fixed URL:', imageUrl);
                                } else {
                                  imageUrl = publicUrl;
                                  console.log('[Cart] ✅ Found image in Supabase Storage:', imageUrl);
                                }
                              } else {
                                console.warn('[Cart] ⚠️ No public URL for:', filename);
                                imageUrl = null;
                              }
                            } catch (err) {
                              console.error('[Cart] ❌ Error loading from Supabase:', err);
                              imageUrl = null;
                            }
                          } else {
                            imageUrl = null;
                          }
                        }
                        
                        // If it's already a full URL (Supabase or external) and not Laravel, use it directly
                        if (imageUrl && /^https?:\/\//i.test(imagePath) && !imagePath.includes('127.0.0.1') && !imagePath.includes('localhost:8000')) {
                          // Already a full URL (Supabase or external)
                          imageUrl = imagePath;
                        } else if (!imageUrl || imageUrl === imagePath) {
                          // Try to get public URL from Supabase Storage for relative paths
                          let storagePath = imagePath;
                          
                          // Remove leading slash if present
                          if (storagePath.startsWith('/')) {
                            storagePath = storagePath.substring(1);
                          }
                          
                          // If path doesn't start with "products/", add it
                          if (!storagePath.startsWith('products/')) {
                            // If it's just a filename (no slashes), add "products/" prefix
                            if (!storagePath.includes('/')) {
                              storagePath = `products/${storagePath}`;
                            } else {
                              // If it contains slashes but doesn't start with "products/", extract filename
                              const parts = storagePath.split('/');
                              const filename = parts[parts.length - 1];
                              storagePath = `products/${filename}`;
                            }
                          }
                          
                          try {
                            const { data: { publicUrl } } = supabase.storage
                              .from('products')
                              .getPublicUrl(storagePath);
                            if (publicUrl) {
                              imageUrl = publicUrl;
                              console.log('[Cart] Generated Supabase URL:', publicUrl, 'from path:', imagePath);
                            } else {
                              imageUrl = null;
                            }
                          } catch (err) {
                            console.warn('[Cart] Error getting public URL:', err);
                            imageUrl = null;
                          }
                        }
                        
                        // If no valid image URL, show placeholder
                        if (!imageUrl) {
                          return (
                            <div className="no-image" style={{display: 'flex'}}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          );
                        }
                        
                        return (
                          <>
                            <img 
                              src={imageUrl} 
                              alt={item.product.name} 
                              onError={(e) => {
                                console.warn('[Cart] Image load error:', imageUrl);
                                e.target.style.display = 'none';
                                if (e.target.nextElementSibling) {
                                  e.target.nextElementSibling.style.display = 'flex';
                                }
                              }}
                              onLoad={() => {
                                console.log('[Cart] Image loaded:', imageUrl);
                              }}
                            />
                            <div className="no-image" style={{display: 'none'}}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    
                    <div className="cart-item-info">
                      <h4 className="cart-item-name">{item.product?.name || t('cart_page.product_deleted')}</h4>
                      <p className="cart-item-price">{formatPrice(item.price)} DH</p>
                    </div>
                    
                    <div className="cart-item-controls">
                      <div className="quantity-controls">
                        <button 
                          className="quantity-button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button 
                          className="quantity-button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                      
                      <button 
                        className="remove-item-button"
                        onClick={() => removeItem(item.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="cart-item-total">
                      {(toNumber(item.quantity) * toNumber(item.price)).toFixed(2)} DH
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="cart-summary">
                <div className="cart-summary-row">
                  <span>{t('cart_page.articles')} ({calculateItemsCount()})</span>
                  <span>{calculateTotal().toFixed(2)} DH</span>
                </div>
                <div className="cart-summary-row">
                  <span>{t('cart_page.delivery')}</span>
                  <span>{t('cart_page.free')}</span>
                </div>
                <div className="cart-summary-total">
                  <span>{t('cart_page.total')}</span>
                  <span>{calculateTotal().toFixed(2)} DH</span>
                </div>
              </div>
              
              <div className="cart-actions">
                <button className="clear-cart-button" onClick={clearCart}>
                  {t('cart_page.clear_cart')}
                </button>
                <button className="checkout-button">
                  {t('cart_page.checkout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Shop.css';
import './CartPage.css';
import { supabase } from '../lib/supabase';

export default function CartPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [productsCache, setProductsCache] = useState({}); // Cache pour les détails des produits
  const [imageUrlCache, setImageUrlCache] = useState({}); // Cache pour les URLs des images

  const toNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };
  const formatPrice = (value) => toNumber(value).toFixed(2);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Helper function to get product image URL
  const getProductImageUrl = (product) => {
    if (!product) {
      console.log('[CartPage] getProductImageUrl: No product provided');
      return null;
    }
    
    const imagePath = String(product.image || '').trim();
    
    console.log('[CartPage] getProductImageUrl called:', {
      productId: product.id,
      productName: product.name,
      imagePath: imagePath,
      imagePathLength: imagePath.length
    });
    
    // Empty or invalid URL
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined' || imagePath === '' || imagePath === 'NULL') {
      console.log('[CartPage] getProductImageUrl: Empty or invalid image path');
      return null;
    }
    
    // Old Laravel storage path - extract filename and try to load from Supabase
    if (imagePath.includes('/storage/images/products/') || 
        imagePath.includes('127.0.0.1:8000') || 
        imagePath.includes('localhost:8000') ||
        imagePath.startsWith('/storage/')) {
      console.log('[CartPage] Detected Laravel path, extracting filename:', imagePath);
      
      // Extract filename from Laravel path
      // Examples:
      // http://127.0.0.1:8000/storage/images/products/filename.jpg
      // /storage/images/products/filename.jpg
      let filename = '';
      
      if (imagePath.includes('/storage/images/products/')) {
        const parts = imagePath.split('/storage/images/products/');
        filename = parts[parts.length - 1];
      } else if (imagePath.includes('/products/')) {
        const parts = imagePath.split('/products/');
        filename = parts[parts.length - 1];
      } else {
        // Fallback: extract last part after last slash
        const parts = imagePath.split('/');
        filename = parts[parts.length - 1];
      }
      
      // Remove query parameters if any
      if (filename.includes('?')) {
        filename = filename.split('?')[0];
      }
      
      if (filename) {
        // Check cache first
        if (imageUrlCache[filename]) {
          console.log('[CartPage] Using cached image URL for:', filename);
          return imageUrlCache[filename];
        }
        
        // Try both paths: root and products/ folder
        // Note: We can't verify file existence without async, so we'll try both and cache the working one
        const pathsToTry = [
          { path: filename, description: 'root' },
          { path: `products/${filename}`, description: 'products/ folder' },
        ];
        
        for (const { path: storagePath, description } of pathsToTry) {
          console.log('[CartPage] Trying path:', storagePath, `(${description})`);
          
          try {
            const { data: { publicUrl } } = supabase.storage
              .from('products')
              .getPublicUrl(storagePath);
            
            if (publicUrl) {
              // Check if URL is valid (doesn't contain double 'products/')
              let finalUrl = publicUrl;
              if (publicUrl.includes('products/products/')) {
                console.warn('[CartPage] ⚠️ Double products/ in URL, fixing:', publicUrl);
                finalUrl = publicUrl.replace('/products/products/', '/products/');
                console.log('[CartPage] Fixed URL:', finalUrl);
              }
              
              // Cache the URL for future use
              setImageUrlCache(prev => ({ ...prev, [filename]: finalUrl }));
              console.log('[CartPage] ✅ Generated URL:', finalUrl, `(${description})`);
              return finalUrl;
            }
          } catch (err) {
            console.warn('[CartPage] Path failed:', storagePath, err);
            continue;
          }
        }
        
        console.error('[CartPage] ❌ All paths failed for filename:', filename);
      }
      
      // If we can't load from Supabase, return null (will show placeholder)
      console.warn('[CartPage] Could not extract or load image from Laravel path');
      return null;
    }
    
    // If it's already an absolute URL (Supabase Storage URLs or external URLs)
    if (/^https?:\/\//i.test(imagePath)) {
      // Supabase Storage URLs
      if (imagePath.includes('supabase.co') || imagePath.includes('supabase.in')) {
        return imagePath;
      }
      // Other external URLs - return as is
      return imagePath;
    }
    
    // Supabase Storage path format: "products/filename.jpg" or just "filename.jpg"
    // Try to get public URL from Supabase Storage
    let storagePath = imagePath;
    
    console.log('[CartPage] Processing image path:', {
      originalPath: imagePath,
      startsWithSlash: imagePath.startsWith('/'),
      includesProducts: imagePath.includes('products/')
    });
    
    // Remove leading slash if present
    if (storagePath.startsWith('/')) {
      storagePath = storagePath.substring(1);
      console.log('[CartPage] Removed leading slash, new path:', storagePath);
    }
    
    // If path doesn't start with "products/", add it
    if (!storagePath.startsWith('products/')) {
      // If it's just a filename (no slashes), add "products/" prefix
      if (!storagePath.includes('/')) {
        storagePath = `products/${storagePath}`;
        console.log('[CartPage] Added products/ prefix, new path:', storagePath);
      } else {
        // If it contains slashes but doesn't start with "products/", extract filename
        const parts = storagePath.split('/');
        const filename = parts[parts.length - 1];
        storagePath = `products/${filename}`;
        console.log('[CartPage] Extracted filename, new path:', storagePath);
      }
    } else {
      console.log('[CartPage] Path already starts with products/, using as is:', storagePath);
    }
    
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(storagePath);
      
      if (publicUrl) {
        console.log('[CartPage] ✅ Generated Supabase URL:', {
          originalPath: imagePath,
          storagePath: storagePath,
          publicUrl: publicUrl
        });
        return publicUrl;
      } else {
        console.warn('[CartPage] ⚠️ No public URL returned from Supabase for:', storagePath);
      }
    } catch (err) {
      console.error('[CartPage] ❌ Error getting public URL:', {
        storagePath: storagePath,
        error: err,
        errorMessage: err.message
      });
    }
    
    // If it's a relative path starting with /, try to use it (for local images)
    if (imagePath.startsWith('/') && !imagePath.startsWith('/storage/')) {
      return imagePath;
    }
    
    return null;
  };

  // Charger les détails d'un produit depuis Supabase
  const fetchProductDetails = async (productId) => {
    // Si déjà en cache, retourner directement
    if (productsCache[productId]) {
      return productsCache[productId];
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', parseInt(productId))
        .single();
      
      if (!error && data) {
        setProductsCache(prev => ({ ...prev, [productId]: data }));
        return data;
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
    
    return null;
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Utilisateur connecté: charger depuis Supabase
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
        const cartItems = (data || []).map(cartItem => {
          const product = cartItem.products ? {
            id: cartItem.products.id,
            name: cartItem.products.name || cartItem.products.name_fr || cartItem.products.name_en || cartItem.products.name_ar || t('cart_page.product_deleted'),
            description: cartItem.products.description || cartItem.products.description_fr || cartItem.products.description_en || cartItem.products.description_ar || '',
            image: cartItem.products.image || null
          } : {
            id: cartItem.product_id,
            name: t('cart_page.product_deleted'),
            description: '',
            image: null
          };
          
          // Debug: log product image path
          if (product.image) {
            console.log('[CartPage] Product image from DB:', {
              productId: product.id,
              productName: product.name,
              imagePath: product.image,
              imageType: typeof product.image
            });
          } else {
            console.warn('[CartPage] No image for product:', {
              productId: product.id,
              productName: product.name
            });
          }
          
          return {
            id: cartItem.id,
            product_id: cartItem.product_id,
            quantity: cartItem.quantity || 1,
            price: cartItem.products?.price || 0,
            product: product
          };
        });
        
        // Filter out deleted products (products that don't exist or have no price)
        const validItems = cartItems.filter(item => 
          item.product && 
          item.product.name !== t('cart_page.product_deleted') && 
          toNumber(item.price) > 0
        );
        setItems(validItems);
      } else {
        // Utilisateur non connecté: charger depuis localStorage
        await loadGuestCart();
      }
    } catch (e) {
      console.error('Error loading cart:', e);
      setError(e.message || 'Erreur lors du chargement du panier');
      // Essayer de charger depuis localStorage en cas d'erreur
      await loadGuestCart();
    } finally {
      setLoading(false);
    }
  };

  const loadGuestCart = async () => {
    try {
      const cartKey = 'guest_cart';
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      
      if (cart.length === 0) {
        setItems([]);
        return;
      }

      // Charger les détails des produits depuis Supabase
      const itemsWithDetails = await Promise.all(
        cart.map(async (item) => {
          const product = await fetchProductDetails(item.product_id);
          
          return {
            id: `guest_${item.product_id}_${item.added_at}`, // ID unique pour les éléments guest
            product_id: item.product_id,
            quantity: item.quantity || 1,
            price: product?.price || 0,
            product: product ? {
              id: product.id,
              name: product.name || product.name_fr || product.name_en || product.name_ar || t('cart_page.product_deleted'),
              description: product.description || product.description_fr || product.description_en || product.description_ar || '',
              image: product.image || null
            } : {
              id: item.product_id,
              name: t('cart_page.product_deleted'),
              description: '',
              image: null
            }
          };
        })
      );

      // Filter out deleted products (products that don't exist or have no price)
      const validItems = itemsWithDetails.filter(item => 
        item.product && 
        item.product.name !== t('cart_page.product_deleted') && 
        item.price > 0
      );
      
      setItems(validItems);
      
      // Update localStorage to remove deleted products
      if (validItems.length !== itemsWithDetails.length) {
        const cartKey = 'guest_cart';
        const updatedCart = validItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          added_at: item.id.split('_')[2] || Date.now()
        }));
        localStorage.setItem(cartKey, JSON.stringify(updatedCart));
      }
    } catch (error) {
      console.error('Error loading guest cart:', error);
      setItems([]);
    }
  };

  useEffect(() => { 
    load();
    
    // Écouter les événements de mise à jour du panier
    const handleCartUpdate = () => {
      load();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity <= 0) return removeItem(cartItemId);
    
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Utilisateur connecté: utiliser Supabase
        const { error } = await supabase
          .from('carts')
          .update({ quantity })
          .eq('id', cartItemId)
          .eq('user_id', session.user.id);
        
        if (error) {
          throw error;
        }
        
        await load();
        showNotification(t('cart_page.update_success'));
      } else {
        // Utilisateur non connecté: utiliser localStorage
        const cartKey = 'guest_cart';
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        
        // Trouver l'élément par product_id (car cartItemId pour guest est une string comme "guest_1_timestamp")
        const cartItemIdStr = String(cartItemId);
        let productId;
        
        if (cartItemIdStr.startsWith('guest_')) {
          // Format: guest_productId_timestamp
          const parts = cartItemIdStr.split('_');
          productId = parseInt(parts[1]);
        } else {
          // Si ce n'est pas un ID guest, utiliser directement
          productId = parseInt(cartItemId);
        }
        
        const itemIndex = cart.findIndex(item => item.product_id === productId);
        
        if (itemIndex >= 0) {
          cart[itemIndex].quantity = quantity;
          localStorage.setItem(cartKey, JSON.stringify(cart));
          window.dispatchEvent(new CustomEvent('cartUpdated'));
          await load();
          showNotification(t('cart_page.update_success'));
        }
      }
    } catch (e) {
      showNotification(t('cart_page.update_error'), 'error');
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Utilisateur connecté: utiliser Supabase
        const { error } = await supabase
          .from('carts')
          .delete()
          .eq('id', cartItemId)
          .eq('user_id', session.user.id);
        
        if (error) {
          throw error;
        }
        
        await load();
        showNotification(t('cart_page.remove_success'));
      } else {
        // Utilisateur non connecté: utiliser localStorage
        const cartKey = 'guest_cart';
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        
        // Trouver l'élément par product_id (car cartItemId pour guest est une string comme "guest_1_timestamp")
        const cartItemIdStr = String(cartItemId);
        let productId;
        
        if (cartItemIdStr.startsWith('guest_')) {
          // Format: guest_productId_timestamp
          const parts = cartItemIdStr.split('_');
          productId = parseInt(parts[1]);
        } else {
          // Si ce n'est pas un ID guest, utiliser directement
          productId = parseInt(cartItemId);
        }
        
        const filteredCart = cart.filter(item => item.product_id !== productId);
        
        localStorage.setItem(cartKey, JSON.stringify(filteredCart));
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        await load();
        showNotification(t('cart_page.remove_success'));
      }
    } catch (e) {
      showNotification(t('cart_page.remove_error'), 'error');
    }
  };

  // Filter out items with deleted products or zero price
  const validItems = (items || []).filter(item => 
    item && 
    item.product && 
    item.product.name !== t('cart_page.product_deleted') && 
    toNumber(item.price) > 0
  );
  
  const total = validItems.reduce((t, it) => t + toNumber(it.quantity) * toNumber(it.price), 0);
  const count = validItems.reduce((c, it) => c + toNumber(it.quantity), 0);
  // Livraison gratuite à partir de 50DH, ou si le total est 0
  const shippingCost = (total > 50 || total === 0) ? 0 : 9.99;
  const finalTotal = total + shippingCost;

  return (
    <div className="cart-page">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`cart-notification ${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="cart-container">
        <header className="cart-header">
          <div className="cart-header-content">
            <h1 className="cart-title" data-aos="fade-up" data-aos-delay="100">
              🛒 {t('cart_page.my_cart')}
            </h1>
            <p className="cart-description" data-aos="fade-up" data-aos-delay="200">
              {t('cart_page.description')}
            </p>
            {count > 0 && (
              <div className="cart-count-badge" data-aos="fade-up" data-aos-delay="300">
                {count} {t('cart_page.article')}{count > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </header>

        {loading ? (
          <div className="cart-loading">
            <div className="loading-spinner"></div>
            <p>{t('cart_page.loading')}</p>
          </div>
        ) : error ? (
          <div className="cart-error">
            <div className="error-icon">⚠️</div>
            <h3>{t('cart_page.error')}</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={load}>
              {t('cart_page.retry')}
            </button>
          </div>
        ) : validItems.length === 0 ? (
          <div className="cart-empty">
            <div className="empty-icon">🛒</div>
            <h3>{t('cart_page.empty')}</h3>
            <p>{t('cart_page.empty_description')}</p>
            <button 
              className="shop-button" 
              onClick={() => window.location.href = '/shop'}
            >
              🛍️ {t('cart_page.discover_shop')}
            </button>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items-section">
              <div className="cart-items-header">
                <h2>{t('cart_page.articles_in_cart')}</h2>
                <span className="items-count">{count} {t('cart_page.article')}{count > 1 ? 's' : ''}</span>
              </div>
              
              <div className="cart-items-list">
                {validItems.map((item, index) => (
                  <div key={item.id} className="cart-item-card" data-aos="fade-up" data-aos-delay={`${100 + index * 50}`}>
                    <div className="cart-item-image">
                      {(() => {
                        const imageUrl = getProductImageUrl(item.product);
                        console.log('[CartPage] Rendering image for product:', {
                          productId: item.product?.id,
                          productName: item.product?.name,
                          imageUrl: imageUrl,
                          hasImage: !!imageUrl
                        });
                        
                        if (imageUrl) {
                          return (
                            <img 
                              src={imageUrl} 
                              alt={item.product?.name || 'Produit'}
                              style={{ maxWidth: '100%', height: 'auto' }}
                              onError={(e) => {
                                const img = e.target;
                                console.error('[CartPage] ❌ Image load error:', {
                                  imageUrl: imageUrl,
                                  imageSrc: img.src,
                                  productId: item.product?.id,
                                  productName: item.product?.name,
                                  originalImagePath: item.product?.image,
                                  errorType: e.type,
                                  errorTarget: e.target?.tagName
                                });
                                
                                // Try to fetch the image to see the actual error
                                fetch(imageUrl, { method: 'HEAD' })
                                  .then(response => {
                                    console.error('[CartPage] Image fetch response:', {
                                      status: response.status,
                                      statusText: response.statusText,
                                      headers: Object.fromEntries(response.headers.entries())
                                    });
                                  })
                                  .catch(fetchError => {
                                    console.error('[CartPage] Image fetch error:', fetchError);
                                  });
                                
                                img.style.display = 'none';
                                const placeholder = img.nextElementSibling;
                                if (placeholder) {
                                  placeholder.style.display = 'flex';
                                }
                              }}
                              onLoad={() => {
                                console.log('[CartPage] ✅ Image loaded successfully:', {
                                  imageUrl: imageUrl,
                                  productId: item.product?.id,
                                  productName: item.product?.name
                                });
                              }}
                            />
                          );
                        } else {
                          console.warn('[CartPage] No image URL for product:', {
                            productId: item.product?.id,
                            productName: item.product?.name,
                            originalImage: item.product?.image
                          });
                          return (
                            <div className="product-placeholder" style={{display: 'flex'}}>
                              <span className="placeholder-icon">📦</span>
                            </div>
                          );
                        }
                      })()}
                      <div className="product-placeholder" style={{display: 'none'}}>
                        <span className="placeholder-icon">📦</span>
                      </div>
                    </div>
                    
                    <div className="cart-item-details">
                      <h3 className="product-name">{item.product?.name || t('cart_page.product_deleted')}</h3>
                      <p className="product-description">{item.product?.description || t('cart_page.description_unavailable')}</p>
                      <div className="product-price">{t('cart_page.unit_price')}: {formatPrice(item.price)} DH</div>
                    </div>
                    
                    <div className="cart-item-quantity">
                      <label>{t('cart_page.quantity')}</label>
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn decrease" 
                          onClick={() => updateQuantity(item.id, toNumber(item.quantity) - 1)}
                          disabled={toNumber(item.quantity) <= 1}
                        >
                          −
                        </button>
                        <span className="quantity-display">{toNumber(item.quantity)}</span>
                        <button 
                          className="quantity-btn increase" 
                          onClick={() => updateQuantity(item.id, toNumber(item.quantity) + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <div className="cart-item-total">
                      <div className="total-label">{t('cart_page.total')}</div>
                      <div className="total-amount">{(toNumber(item.quantity) * toNumber(item.price)).toFixed(2)} DH</div>
                    </div>
                    
                    <div className="cart-item-actions">
                      <button 
                        className="remove-btn" 
                        onClick={() => removeItem(item.id)}
                        title={t('cart_page.remove_from_cart')}
                      >
                        🗑️ {t('cart_page.remove')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="cart-summary-section">
              <div className="cart-summary-card">
                <h3>{t('cart_page.order_summary')}</h3>
                
                <div className="summary-details">
                  <div className="summary-row">
                    <span>{t('cart_page.subtotal')} ({count} {t('cart_page.article')}{count > 1 ? 's' : ''})</span>
                    <span>{total.toFixed(2)} DH</span>
                  </div>
                  
                  <div className="summary-row shipping">
                    <span>
                      {t('cart_page.delivery')}
                      {shippingCost === 0 && <span className="free-shipping"> ({t('cart_page.free')})</span>}
                    </span>
                    <span className={shippingCost === 0 ? 'free' : ''}>
                      {shippingCost === 0 ? t('cart_page.free') : `${shippingCost.toFixed(2)} DH`}
                    </span>
                  </div>
                  
                  {shippingCost > 0 && (
                    <div className="shipping-info">
                      <span className="shipping-note">
                        💡 {t('cart_page.free_shipping_note')}
                      </span>
                    </div>
                  )}
                  
                  <div className="summary-total">
                    <span>{t('cart_page.total')}</span>
                    <span>{finalTotal.toFixed(2)} DH</span>
                  </div>
                </div>
                
                <div className="summary-actions">
                  <button 
                    className="checkout-btn"
                    onClick={() => window.location.href = '/order-summary'}
                  >
                    💳 {t('cart_page.view_summary')}
                  </button>
                  
                  <button 
                    className="continue-shopping-btn"
                    onClick={() => window.location.href = '/shop'}
                  >
                    🛍️ {t('cart_page.continue_shopping')}
                  </button>
                </div>
                
                <div className="summary-benefits">
                  <div className="benefit-item">
                    <span className="benefit-icon">🚚</span>
                    <span>{t('cart_page.fast_delivery')}</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">🔒</span>
                    <span>{t('cart_page.secure_payment')}</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">↩️</span>
                    <span>{t('cart_page.free_return')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



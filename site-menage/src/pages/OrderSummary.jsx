import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import './OrderSummary.css';

export default function OrderSummary() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [productsCache, setProductsCache] = useState({}); // Cache pour les détails des produits

  const toNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };

  // Charger les détails d'un produit depuis Supabase
  const fetchProductDetails = async (productId) => {
    // Si déjà en cache, retourner directement
    if (productsCache[productId]) {
      return productsCache[productId];
    }

    try {
      console.log('[OrderSummary] Fetching product details for:', productId);
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', parseInt(productId))
        .single();
      
      if (error) {
        console.error('[OrderSummary] Error fetching product:', error);
        return null;
      }
      
      if (product) {
        setProductsCache(prev => ({ ...prev, [productId]: product }));
        return product;
      }
    } catch (error) {
      console.error('[OrderSummary] Exception fetching product details:', error);
    }
    
    return null;
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
            id: `guest_${item.product_id}_${item.added_at}`,
            product_id: item.product_id,
            quantity: item.quantity || 1,
            price: product?.price || 0,
            product: product ? {
              id: product.id,
              name: product.name || product.name_fr || product.name_en || product.name_ar || t('order_summary.product_deleted'),
              description: product.description || product.description_fr || product.description_en || product.description_ar || '',
              image: product.image || null
            } : {
              id: item.product_id,
              name: t('order_summary.product_deleted'),
              description: '',
              image: null
            }
          };
        })
      );

      // Filter out deleted products (products that don't exist or have no price)
      const validItems = itemsWithDetails.filter(item => 
        item.product && 
        item.product.name !== t('order_summary.product_deleted') && 
        item.price > 0
      );

      setItems(validItems);
      
      // Update localStorage to remove deleted products
      if (validItems.length !== itemsWithDetails.length) {
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

  const loadCartItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check Supabase Auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session && !sessionError) {
        // Utilisateur connecté: charger depuis Supabase
        console.log('[OrderSummary] Loading cart for authenticated user:', session.user.id);
        
        const { data: cartData, error: cartError } = await supabase
          .from('carts')
          .select(`
            *,
            products (*)
          `)
          .eq('user_id', session.user.id);
        
        if (cartError) {
          console.error('[OrderSummary] Error loading cart:', cartError);
          throw new Error('Erreur lors du chargement du panier');
        }
        
        // Transform cart data to match expected format
        const cartItems = (cartData || []).map(item => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity || 1,
          price: item.products?.price || 0,
          product: item.products ? {
            id: item.products.id,
            name: item.products.name || item.products.name_fr || item.products.name_en || item.products.name_ar || t('order_summary.product_deleted'),
            description: item.products.description || item.products.description_fr || item.products.description_en || item.products.description_ar || '',
            image: item.products.image || null
          } : null
        })).filter(item => item.product && item.price > 0); // Filter out deleted/zero-price products
        
        setItems(cartItems);
      } else {
        // Utilisateur non connecté: charger depuis localStorage
        console.log('[OrderSummary] Loading guest cart from localStorage');
        await loadGuestCart();
      }
    } catch (e) {
      console.error('[OrderSummary] Error loading cart:', e);
      setError(e.message || 'Erreur lors du chargement du panier');
      // Essayer de charger depuis localStorage en cas d'erreur
      await loadGuestCart();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadCartItems();
    
    // Écouter les événements de mise à jour du panier
    const handleCartUpdate = () => {
      loadCartItems();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setApplyingPromo(true);
    try {
      // Calculate current total
      const currentTotal = items.reduce((t, it) => t + toNumber(it.quantity) * toNumber(it.price), 0);
      
      // Check Supabase Auth session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Fetch promo code from Supabase
      const { data: promoData, error: promoError } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();
      
      if (promoError || !promoData) {
        alert('Code promo invalide');
        return;
      }
      
      // Check if promo is still valid
      const now = new Date();
      const startDate = promoData.start_date ? new Date(promoData.start_date) : null;
      const endDate = promoData.end_date ? new Date(promoData.end_date) : null;
      
      if (startDate && now < startDate) {
        alert('Ce code promo n\'est pas encore valide');
        return;
      }
      
      if (endDate && now > endDate) {
        alert('Ce code promo a expiré');
        return;
      }
      
      setPromoApplied({
        code: promoCode.trim().toUpperCase(),
        discount: toNumber(promoData.discount) || 0,
        message: 'Code promo appliqué'
      });
    } catch (e) {
      console.error('[OrderSummary] Error applying promo code:', e);
      alert('Erreur lors de l\'application du code promo');
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromoCode = () => {
    setPromoApplied(null);
    setPromoCode('');
  };

  const total = items.reduce((t, it) => t + toNumber(it.quantity) * toNumber(it.price), 0);
  const count = items.reduce((c, it) => c + toNumber(it.quantity), 0);
  const shippingCost = total > 50 ? 0 : 9.99;
  
  let discountAmount = 0;
  if (promoApplied?.discount) {
    discountAmount = total * (promoApplied.discount / 100);
  }
  
  const finalTotal = total + shippingCost - discountAmount;

  const proceedToCheckout = () => {
    window.location.href = '/checkout';
  };

  const goBackToCart = () => {
    window.location.href = '/cart';
  };

  return (
    <div className="order-summary-page">
      <div className="order-summary-container">
        <header className="order-summary-header">
          <div className="header-content">
            <h1 className="page-title" data-aos="fade-up" data-aos-delay="100">
              💳 {t('order_summary.title')}
            </h1>
            <p className="page-description" data-aos="fade-up" data-aos-delay="200">
              {t('order_summary.description')}
            </p>
          </div>
        </header>

        {loading ? (
          <div className="summary-loading">
            <div className="loading-spinner"></div>
            <p>{t('order_summary.loading')}</p>
          </div>
        ) : error ? (
          <div className="summary-error">
            <div className="error-icon">⚠️</div>
            <h3>{t('order_summary.error')}</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={loadCartItems}>
              {t('order_summary.retry')}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="summary-empty">
            <div className="empty-icon">🛒</div>
            <h3>{t('order_summary.empty')}</h3>
            <p>{t('order_summary.empty_description')}</p>
            <button 
              className="shop-button" 
              onClick={() => window.location.href = '/shop'}
            >
              🛍️ {t('order_summary.discover_shop')}
            </button>
          </div>
        ) : (
          <div className="summary-content">
            <div className="summary-main">
              {/* Items Summary */}
              <div className="items-summary-section">
                <h2>{t('order_summary.ordered_items')} ({count} {t('order_summary.article')}{count > 1 ? 's' : ''})</h2>
                <div className="items-list">
                  {items.map((item, index) => (
                    <div key={item.id} className="summary-item" data-aos="fade-up" data-aos-delay={`${100 + index * 50}`}>
                      <div className="item-info">
                        <h4>{item.product?.name || t('order_summary.product_deleted')}</h4>
                        <p>{t('order_summary.quantity')}: {toNumber(item.quantity)} × {toNumber(item.price).toFixed(2)} DH</p>
                      </div>
                      <div className="item-total">
                        {(toNumber(item.quantity) * toNumber(item.price)).toFixed(2)} DH
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promo Code Section */}
              <div className="promo-section">
                <h3>{t('order_summary.promo_code')}</h3>
                {!promoApplied ? (
                  <div className="promo-input-group">
                    <input
                      type="text"
                      placeholder={t('order_summary.enter_promo')}
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="promo-input"
                    />
                    <button 
                      className="apply-promo-btn"
                      onClick={applyPromoCode}
                      disabled={applyingPromo || !promoCode.trim()}
                    >
                      {applyingPromo ? t('order_summary.applying') : t('order_summary.apply')}
                    </button>
                  </div>
                ) : (
                  <div className="promo-applied">
                    <div className="promo-info">
                      <span className="promo-code">{t('order_summary.code')}: {promoApplied.code}</span>
                      <span className="promo-discount">-{promoApplied.discount}%</span>
                    </div>
                    <button className="remove-promo-btn" onClick={removePromoCode}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Card */}
            <div className="order-summary-card">
              <h3>{t('order_summary.order_summary_label')}</h3>
              
              <div className="summary-details">
                <div className="summary-row">
                  <span>{t('order_summary.subtotal')} ({count} {t('order_summary.article')}{count > 1 ? 's' : ''})</span>
                  <span>{total.toFixed(2)} DH</span>
                </div>
                
                {promoApplied && (
                  <div className="summary-row discount">
                    <span>{t('order_summary.discount')} ({promoApplied.code})</span>
                    <span>-{discountAmount.toFixed(2)} DH</span>
                  </div>
                )}
                
                <div className="summary-row shipping">
                  <span>
                    {t('order_summary.delivery')}
                    {shippingCost === 0 && <span className="free-shipping"> ({t('order_summary.free')})</span>}
                  </span>
                  <span className={shippingCost === 0 ? 'free' : ''}>
                    {shippingCost === 0 ? t('order_summary.free') : `${shippingCost.toFixed(2)} DH`}
                  </span>
                </div>
                
                {shippingCost > 0 && (
                  <div className="shipping-info">
                    <span className="shipping-note">
                      💡 {t('order_summary.free_shipping_note')}
                    </span>
                  </div>
                )}
                
                <div className="summary-total">
                  <span>{t('order_summary.total')}</span>
                  <span>{finalTotal.toFixed(2)} DH</span>
                </div>
              </div>
              
              <div className="summary-actions">
                <button 
                  className="checkout-btn"
                  onClick={proceedToCheckout}
                >
                  🛒 {t('order_summary.proceed_payment')}
                </button>
                
                <button 
                  className="back-to-cart-btn"
                  onClick={goBackToCart}
                >
                  ← {t('order_summary.back_to_cart')}
                </button>
              </div>
              
              <div className="summary-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">🚚</span>
                  <span>{t('order_summary.fast_delivery')}</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🔒</span>
                  <span>{t('order_summary.secure_payment')}</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">↩️</span>
                  <span>{t('order_summary.free_return')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

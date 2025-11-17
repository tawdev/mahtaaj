import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import './Shop.css';
import PromoCode from '../components/PromoCode';

export default function Checkout() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [promo, setPromo] = useState(null); // { code, discount }
  const [productsCache, setProductsCache] = useState({}); // Cache pour les détails des produits

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    notes: '',
    paymentMethod: 'cod', // 'online' | 'cod'
  });

  // Payment mode UI state (mirrors form.paymentMethod)
  const [paymentMode, setPaymentMode] = useState('cod');
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const toNumber = (v) => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const subtotal = useMemo(() => items.reduce((t, it) => t + toNumber(it.quantity) * toNumber(it.price), 0), [items]);
  const total = useMemo(() => {
    if (!promo?.discount) return subtotal;
    const d = Math.max(0, Math.min(100, Number(promo.discount)));
    return subtotal * (1 - d / 100);
  }, [subtotal, promo]);

  // Charger les détails d'un produit depuis Supabase
  const fetchProductDetails = async (productId) => {
    if (productsCache[productId]) {
      return productsCache[productId];
    }

    try {
      console.log('[Checkout] Fetching product details for:', productId);
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', parseInt(productId))
        .single();
      
      if (error) {
        console.error('[Checkout] Error fetching product:', error);
        return null;
      }
      
      if (product) {
        setProductsCache(prev => ({ ...prev, [productId]: product }));
        return product;
      }
    } catch (error) {
      console.error('[Checkout] Exception fetching product details:', error);
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

      // Charger les détails des produits depuis l'API
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
              name: product.name || product.name_fr || product.name_en || product.name_ar || t('checkout.product'),
              description: product.description || product.description_fr || product.description_en || product.description_ar || '',
              image: product.image || null
            } : {
              id: item.product_id,
              name: t('checkout.product'),
              description: '',
              image: null
            }
          };
        })
      );

      setItems(itemsWithDetails);
    } catch (error) {
      console.error('Error loading guest cart:', error);
      setItems([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Check Supabase Auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session && !sessionError) {
          // Utilisateur connecté: charger depuis Supabase
          console.log('[Checkout] Loading cart for authenticated user:', session.user.id);
          
          const { data: cartData, error: cartError } = await supabase
            .from('carts')
            .select(`
              *,
              products (*)
            `)
            .eq('user_id', session.user.id);
          
          if (cartError) {
            console.error('[Checkout] Error loading cart:', cartError);
            throw new Error(t('checkout.load_cart_error'));
          }
          
          // Transform cart data to match expected format
          const cartItems = (cartData || []).map(item => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity || 1,
            price: item.products?.price || 0,
            product: item.products ? {
              id: item.products.id,
              name: item.products.name || item.products.name_fr || item.products.name_en || item.products.name_ar || t('checkout.product'),
              description: item.products.description || item.products.description_fr || item.products.description_en || item.products.description_ar || '',
              image: item.products.image || null
            } : null
          })).filter(item => item.product && item.price > 0); // Filter out deleted/zero-price products
          
          setItems(cartItems);

          // Charger le profil pour récupérer le nom de l'utilisateur
          const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || '';
          if (userName) setProfileName(userName);
        } else {
          // Utilisateur non connecté: charger depuis localStorage
          console.log('[Checkout] Loading guest cart from localStorage');
          await loadGuestCart();
        }
      } catch (e) {
        console.error('[Checkout] Error loading cart:', e);
        setError(e.message || t('checkout.load_cart_error'));
        // Essayer de charger depuis localStorage en cas d'erreur
        await loadGuestCart();
      } finally {
        setLoading(false);
      }
    };
    load();
    
    // Écouter les événements de mise à jour du panier
    const handleCartUpdate = () => {
      load();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Auto location for Address (uses browser geolocation + nominatim)
  const handleAutoLocate = async () => {
    try {
      if (!navigator.geolocation) {
        setError(t('checkout.geo_not_supported'));
        return;
      }
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      }).then(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
          headers: { 'Accept': 'application/json' }
        });
        const data = await resp.json();
        const a = data.address || {};
        const city = a.city || a.town || a.village || '';
        const road = a.road || '';
        const pc = a.postcode || '';
        const country = a.country || '';
        const value = [road, city, pc, country].filter(Boolean).join(', ');
        setForm((f) => ({ ...f, address: value || city || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
      }).catch(() => {
        setError(t('checkout.geo_unavailable'));
      });
    } catch (e) {
      setError(t('checkout.geo_error'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // Check Supabase Auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Prepare items array
      let itemsArray = [];
      
      if (session && !sessionError) {
        // For authenticated users, get items from Supabase cart
        const { data: cartData, error: cartError } = await supabase
          .from('carts')
          .select('product_id, quantity')
          .eq('user_id', session.user.id);
        
        if (cartError) {
          console.error('[Checkout] Error loading cart items:', cartError);
          throw new Error(t('checkout.load_cart_error'));
        }
        
        itemsArray = (cartData || []).map(item => ({
          product_id: item.product_id,
          quantity: item.quantity || 1
        }));
      } else {
        // For guest users, get items from localStorage
        const cartKey = 'guest_cart';
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        itemsArray = cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity || 1
        }));
      }

      // Calculate total from items
      const calculatedTotal = items.reduce((sum, item) => {
        return sum + (toNumber(item.quantity) * toNumber(item.price));
      }, 0);
      
      const finalTotal = promo?.discount 
        ? calculatedTotal * (1 - Math.max(0, Math.min(100, Number(promo.discount))) / 100)
        : calculatedTotal;

      // Prepare order data
      const orderData = {
        user_id: session?.user?.id || null,
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        zip: form.zip || null,
        notes: form.notes || null,
        payment_method: form.paymentMethod,
        status: 'pending',
        total: finalTotal,
        items: itemsArray // Store as JSONB
      };

      console.log('[Checkout] Submitting order:', orderData);

      // Insert order into Supabase
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('[Checkout] Error creating order:', orderError);
        throw new Error(orderError.message || t('checkout.confirm_error'));
      }

      console.log('[Checkout] Order created successfully:', orderResult);
      
      // Clear cart after successful order
      if (session && !sessionError) {
        // Delete cart items for authenticated user
        const { error: deleteError } = await supabase
          .from('carts')
          .delete()
          .eq('user_id', session.user.id);
        
        if (deleteError) {
          console.error('[Checkout] Error clearing cart:', deleteError);
        }
      } else {
        // Clear localStorage for guest user
        localStorage.removeItem('guest_cart');
      }
      
      // Dispatch cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      setOrderSuccess(true);
    } catch (e) {
      console.error('[Checkout] Exception submitting order:', e);
      setError(e.message || t('checkout.confirm_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shop-page">
      {/* Local styles to improve visual presentation and responsiveness */}
      <style>{`
        .checkout-grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; }
        @media (max-width: 900px) { .checkout-grid { grid-template-columns: 1fr; } }

        .checkout-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .checkout-form h3, .cart-summary h3 { margin: 0 0 12px 0; }

        .form-label { color: #475569; font-weight: 500; margin-bottom: 6px; display: inline-block; }
        .form-input { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; outline: none; background: #fff; transition: box-shadow .2s, border-color .2s; }
        .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,.15); }

        .checkout-button { width: 100%; background: #111827; color: #fff; border: none; border-radius: 10px; padding: 12px 16px; font-weight: 600; cursor: pointer; transition: transform .08s ease, background .2s ease, box-shadow .2s ease; }
        .checkout-button:hover { background: #0b1220; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(0,0,0,.12); }
        .checkout-button:disabled { opacity: .7; cursor: not-allowed; transform: none; box-shadow: none; }

        .loading-container, .error-container { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center; }
        .error-icon { font-size: 20px; }
        .cart-summary-total { margin-top: 12px; display: flex; justify-content: space-between; font-weight: 600; }
      `}</style>
      <div className="shop-container">
        <header className="shop-header" style={{marginBottom: 24}}>
          <div className="shop-header-content">
            <h1 className="shop-title" data-aos="fade-up" data-aos-delay="100">{t('checkout.title')}</h1>
            <p className="shop-description" data-aos="fade-up" data-aos-delay="200">
              {t('checkout.description')}
            </p>
          </div>
        </header>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>{t('checkout.loading')}</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>{t('checkout.error')}</h3>
            <p>{error}</p>
          </div>
        ) : (
          orderSuccess ? (
            <div className="checkout-card" style={{textAlign:'center'}}>
              <div style={{fontSize:48, lineHeight:1}}>✅</div>
              <h2 style={{margin:'8px 0 4px'}}>{t('checkout.order_confirmed')}</h2>
              <p style={{margin:0}}>{t('checkout.thanks')} {profileName ? `, ${profileName}` : ''} {t('checkout.order_saved')}</p>
              <p style={{margin:'8px 0 0', color:'#059669', fontWeight:'500', fontSize:'1rem'}}>
                {t('checkout.response_24h')}
              </p>
              <a href="/shop" className="checkout-button" style={{display:'inline-block',marginTop:20,width:'auto',padding:'10px 16px'}}>{t('checkout.back_to_shop')}</a>
            </div>
          ) : (
          <div className="checkout-grid">
            <form onSubmit={handleSubmit} className="checkout-form checkout-card">
              <h3>{t('checkout.shipping_info')}</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label className="form-label">{t('checkout.full_name')}</label>
                  <input className="form-input" name="fullName" value={form.fullName} onChange={handleChange} required />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} required />
                </div>
                <div>
                  <label className="form-label">{t('checkout.phone')}</label>
                  <input className="form-input" name="phone" value={form.phone} onChange={handleChange} required />
                </div>
                <div>
                  <label className="form-label">{t('checkout.city')}</label>
                  <input className="form-input" name="city" value={form.city} onChange={handleChange} required />
                </div>
                <div style={{gridColumn:'1 / -1'}}>
                  <label className="form-label">{t('checkout.address')}</label>
                  <div style={{display:'flex', gap:8}}>
                    <input className="form-input" style={{flex:1}} name="address" value={form.address} onChange={handleChange} required />
                    <button type="button" onClick={handleAutoLocate} className="checkout-button" style={{width:'auto', padding:'10px 12px', background:'#2563eb'}}>📍 {t('checkout.locate')}</button>
                  </div>
                </div>
                <div>
                  <label className="form-label">{t('checkout.zip')}</label>
                  <input className="form-input" name="zip" value={form.zip} onChange={handleChange} />
                </div>
                <div>
                  <label className="form-label">{t('checkout.notes')}</label>
                  <input className="form-input" name="notes" value={form.notes} onChange={handleChange} />
                </div>
              </div>

              <h3 style={{margin:'20px 0 8px'}}>{t('checkout.payment_mode')}</h3>
              <div style={{display:'grid',gap:10}}>
                <label className="form-label" style={{display:'flex',alignItems:'center',gap:10}}>
                  <input type="radio" name="paymentMethod" value="online" checked={form.paymentMethod==='online'} onChange={(e)=>{handleChange(e); setPaymentMode('carte');}} />
                  {t('checkout.pay_online')}
                </label>
                <label className="form-label" style={{display:'flex',alignItems:'center',gap:10}}>
                  <input type="radio" name="paymentMethod" value="cod" checked={form.paymentMethod==='cod'} onChange={(e)=>{handleChange(e); setPaymentMode('livraison');}} />
                  {t('checkout.pay_on_delivery')}
                </label>
              </div>

              {paymentMode === 'carte' && (
                <div style={{marginTop:12}}>
                  <div style={{background:'rgba(255,255,255,0.6)', border:'1px solid rgba(226,232,240,0.8)', borderRadius:12, padding:16, backdropFilter:'blur(6px)'}} className="transition-all">
                    <div style={{display:'flex', flexDirection:'column', gap:12, maxWidth:480, margin:'0 auto'}}>
                      <div>
                        <label className="form-label">💳 {t('checkout.card_number')}</label>
                        <input className="form-input" inputMode="numeric" placeholder="1234 5678 9012 3456" value={cardForm.number} onChange={(e)=>setCardForm({...cardForm, number:e.target.value})} />
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                        <div>
                          <label className="form-label">📅 {t('checkout.card_expiry')}</label>
                          <input className="form-input" placeholder="MM/AA" value={cardForm.expiry} onChange={(e)=>setCardForm({...cardForm, expiry:e.target.value})} />
                        </div>
                        <div>
                          <label className="form-label">🔒 {t('checkout.card_cvv')}</label>
                          <input className="form-input" inputMode="numeric" placeholder="123" value={cardForm.cvv} onChange={(e)=>setCardForm({...cardForm, cvv:e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">👤 {t('checkout.card_holder')}</label>
                        <input className="form-input" placeholder={t('checkout.card_holder_placeholder')} value={cardForm.name} onChange={(e)=>setCardForm({...cardForm, name:e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="checkout-button" disabled={submitting} style={{marginTop:16}}>
                {submitting ? t('checkout.validating') : t('checkout.confirm_order')}
              </button>
            </form>

            <aside className="cart-summary checkout-card">
              <h3>{t('checkout.summary')}</h3>
              {items.length > 0 ? (
                <>
                  <div style={{display:'grid',gap:10}}>
                    {items.map((it) => (
                      <div key={it.id} style={{display:'flex',justifyContent:'space-between',gap:10}}>
                        <span style={{color:'#334155'}}>{it.product?.name || t('checkout.product')}</span>
                        <span style={{fontWeight:600}}>{(toNumber(it.quantity) * toNumber(it.price)).toFixed(2)} DH</span>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:12}}>
                    <PromoCode onApplied={setPromo} />
                  </div>
                  {total > 0 && (
                    <div className="cart-summary-total">
                      <span>{t('checkout.total')}</span>
                      <span>{total.toFixed(2)} DH</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{textAlign:'center', padding:'20px 0', color:'#64748b'}}>
                  <p>{t('checkout.empty_cart') || 'Votre panier est vide'}</p>
                  <a href="/shop" style={{color:'#2563eb', textDecoration:'none', marginTop:'8px', display:'inline-block'}}>
                    {t('checkout.back_to_shop') || 'Retourner au magasin'}
                  </a>
                </div>
              )}
            </aside>
          </div>
          )
        )}
      </div>
    </div>
  );
}




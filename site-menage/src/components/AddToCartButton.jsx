import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AddToCartButton.css';
import { supabase } from '../lib/supabase';

const AddToCartButton = ({ 
  productId, 
  quantity = 1, 
  className = '', 
  disabled = false,
  onSuccess = () => {},
  onError = () => {}
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleAddToCart = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    setIsPressed(true);

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Utilisateur connecté: utiliser Supabase
        // Check if product already exists in cart
        const { data: existingCart } = await supabase
          .from('carts')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('product_id', productId)
          .single();
        
        if (existingCart) {
          // Update quantity if product already exists
          const { error: updateError } = await supabase
            .from('carts')
            .update({ quantity: (existingCart.quantity || 1) + quantity })
            .eq('id', existingCart.id);
          
          if (updateError) {
            throw updateError;
          }
        } else {
          // Insert new cart item
          const { error: insertError } = await supabase
            .from('carts')
            .insert({
              user_id: session.user.id,
              product_id: productId,
              quantity: quantity
            });
          
          if (insertError) {
            throw insertError;
          }
        }
        
        // Déclencher un événement pour mettre à jour le compteur du panier
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
          showNotification('✅ Vous recevrez notre réponse dans les 24h suivant votre commande', 'success');
        onSuccess({ success: true, message: 'Produit ajouté au panier' });
      } else {
        // Pour les utilisateurs non connectés, utiliser localStorage
        const cartKey = 'guest_cart';
        let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        
        // Vérifier si le produit existe déjà dans le panier
        const existingItemIndex = cart.findIndex(item => item.product_id === productId);
        
        if (existingItemIndex >= 0) {
          // Mettre à jour la quantité
          cart[existingItemIndex].quantity += quantity;
        } else {
          // Ajouter un nouveau produit
          cart.push({
            product_id: productId,
            quantity: quantity,
            added_at: new Date().toISOString()
          });
        }
        
        localStorage.setItem(cartKey, JSON.stringify(cart));
        
        // Déclencher un événement pour mettre à jour le compteur du panier
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        showNotification('✅ Vous recevrez notre réponse dans les 24h suivant votre commande', 'success');
        onSuccess({ success: true, message: 'Produit ajouté au panier' });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      showNotification('Erreur de connexion', 'error');
      onError(error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsPressed(false), 150);
    }
  };

  const showNotification = (message, type) => {
    // Créer une notification toast
    const notification = document.createElement('div');
    notification.className = `cart-notification ${type}`;
    
    // Créer le contenu HTML avec icône et message
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0;">
          ${type === 'success' ? 
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>' :
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
          }
        </div>
        <div style="flex: 1; line-height: 1.4;">
          <div style="font-weight: 600; margin-bottom: 2px;">
            ${type === 'success' ? 'Commande confirmée !' : 'Erreur'}
          </div>
          <div style="font-size: 0.9rem; opacity: 0.9;">
            ${message.replace('✅ ', '').replace('❌ ', '')}
          </div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none; border: none; color: inherit; cursor: pointer; 
          padding: 4px; border-radius: 4px; display: flex; align-items: center; 
          justify-content: center; opacity: 0.7; transition: opacity 0.2s;
        " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;
    
    // Styles pour la notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px 20px',
      borderRadius: '12px',
      color: 'white',
      fontWeight: '500',
      zIndex: '9999',
      transform: 'translateX(100%)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      maxWidth: '400px',
      minWidth: '320px'
    });

    document.body.appendChild(notification);

    // Animation d'entrée
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Supprimer après 5 secondes (plus longtemps pour le message important)
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 400);
    }, 5000);
  };

  return (
    <>
      <button
        className={`add-to-cart-btn ${className} ${isLoading ? 'loading' : ''} ${isPressed ? 'pressed' : ''}`}
        onClick={handleAddToCart}
        disabled={disabled || isLoading}
        aria-label={isLoading ? t('shop_page.loading_cart', 'إضافة...') : t('shop.add_to_cart')}
      >
        <div className="btn-content">
          <div className="cart-icon">
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3h2l3.6 7.59c.16.34.5.56.87.56h7.48c.46 0 .86-.31.97-.76L21 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="20" r="1.5" fill="currentColor"/>
                <circle cx="17" cy="20" r="1.5" fill="currentColor"/>
                {/* plus badge */}
                <path d="M16 3h4M18 1v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          <span className="btn-text">
            {isLoading ? t('shop_page.loading_cart', 'إضافة...') : t('shop.add_to_cart')}
          </span>
        </div>
      </button>
    </>
  );
};

export default AddToCartButton;

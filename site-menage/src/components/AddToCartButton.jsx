import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AddToCartButton.css';
import { supabase } from '../lib/supabase';

const AddToCartButton = ({
  productId,
  quantity = 1,
  className = '',
  disabled = false,
  onSuccess = () => { },
  onError = () => { }
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

        // No popup notification
        onSuccess({ success: true, message: t('shop_page.added_to_cart') });
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

        // No popup notification
        onSuccess({ success: true, message: t('shop_page.added_to_cart') });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      onError(error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsPressed(false), 150);
    }
  };

  return (
    <>
      <button
        className={`add-to-cart-btn ${className} ${isLoading ? 'loading' : ''} ${isPressed ? 'pressed' : ''}`}
        onClick={handleAddToCart}
        disabled={disabled || isLoading}
        aria-label={isLoading ? t('shop_page.loading_cart') : t('shop.add_to_cart')}
      >
        <div className="btn-content">
          <div className="cart-icon">
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3h2l3.6 7.59c.16.34.5.56.87.56h7.48c.46 0 .86-.31.97-.76L21 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                <circle cx="17" cy="20" r="1.5" fill="currentColor" />
                {/* plus badge */}
                <path d="M16 3h4M18 1v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <span className="btn-text">
            {isLoading ? t('shop_page.loading_cart') : t('shop.add_to_cart')}
          </span>
        </div>
      </button>
    </>
  );
};

export default AddToCartButton;

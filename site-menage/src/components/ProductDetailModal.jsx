import React from 'react';
import { useTranslation } from 'react-i18next';
import { LuX, LuStar, LuCheck, LuShieldCheck, LuTruck } from 'react-icons/lu';
import AddToCartButton from './AddToCartButton';
import './ProductDetailModal.css';
import { supabase } from '../lib/supabase';

const ProductDetailModal = ({ product, isOpen, onClose }) => {
    const { t } = useTranslation();

    if (!isOpen || !product) return null;

    // Helper to get image URL (same as Shop.jsx)
    const getImageUrl = (p) => {
        if (!p || !p.image) return '/produitNettoyage.jpg';
        const path = String(p.image).trim();
        if (path.startsWith('http')) return path;
        if (path.startsWith('/')) return path;
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path);
        return publicUrl || '/produitNettoyage.jpg';
    };

    return (
        <div className="product-modal-overlay" onClick={onClose}>
            <div className="product-modal-content" onClick={e => e.stopPropagation()}>
                <button className="product-modal-close" onClick={onClose}>
                    <LuX />
                </button>

                <div className="pdm-grid">
                    <div className="pdm-image-container">
                        <img src={getImageUrl(product)} alt={product.name} />
                    </div>

                    <div className="pdm-details">
                        <div className="pdm-header">
                            <span className="pdm-category-badge">
                                {product.category_name || t('shop.category_cleaning', 'Nettoyage')}
                            </span>
                            <h2 className="pdm-title">{product.name}</h2>
                            <div className="pdm-rating">
                                <div className="pdm-stars">
                                    <LuStar fill="#fbbf24" stroke="#fbbf24" size={18} />
                                    <span className="pdm-rating-val">{product.rating || '4.8'}</span>
                                </div>
                                <span className="pdm-review-count">(120 {t('shop.reviews', 'avis')})</span>
                            </div>
                        </div>

                        <div className="pdm-price-section">
                            <span className="pdm-price">{product.price} <small>MAD</small></span>
                            {product.old_price && (
                                <span className="pdm-old-price">{product.old_price} MAD</span>
                            )}
                        </div>

                        <p className="pdm-description">
                            {product.description || t('shop.no_description', 'Aucune description disponible pour ce produit.')}
                        </p>

                        <div className="pdm-features">
                            <div className="pdm-feature-item">
                                <LuCheck className="pdm-feature-icon" />
                                <span>{t('shop.feature_quality', 'Qualité professionnelle')}</span>
                            </div>
                            <div className="pdm-feature-item">
                                <LuShieldCheck className="pdm-feature-icon" />
                                <span>{t('shop.feature_warranty', 'Garantie satisfait ou remboursé')}</span>
                            </div>
                            <div className="pdm-feature-item">
                                <LuTruck className="pdm-feature-icon" />
                                <span>{t('shop.feature_delivery', 'Livraison rapide partout au Maroc')}</span>
                            </div>
                        </div>

                        <div className="pdm-actions">
                            <div className="pdm-add-btn">
                                <AddToCartButton productId={product.id} className="pdm-full-width-btn" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LuSearch, LuFilter, LuShoppingCart, LuStar, LuEye, LuArrowRight, LuCheckCircle } from 'react-icons/lu';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';
import Cart from '../components/Cart';
import CartIcon from '../components/CartIcon';
import ProductDetailModal from '../components/ProductDetailModal';
import AddToCartButton from '../components/AddToCartButton';
import './Shop.css';

// Helper function to get correct product image URL (centralized logic)
const getProductImageUrl = (product) => {
  if (!product || !product.image) return '/produitNettoyage.jpg';
  const path = String(product.image).trim();
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return path;
  const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path);
  return publicUrl || '/produitNettoyage.jpg';
};

export default function Shop() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [i18n.language]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: prodData } = await supabase.from('products').select('*, category:categories(*)');
      const { data: catData } = await supabase.from('categories').select('*');
      setProducts(prodData || []);
      setCategories(catData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedText = (obj, field) => {
    if (!obj) return '';
    const lang = i18n.language || 'fr';
    return obj[`${field}_${lang}`] || obj[field] || obj[`${field}_fr`] || '';
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
    const name = getLocalizedText(p, 'name');
    const description = getLocalizedText(p, 'description');
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className={`shop-page ${isRTL ? 'rtl' : ''}`}>
      <SEO
        title={t('nav.shop') || 'Shop'}
        description="Découvrez notre sélection de produits de nettoyage professionnels mahtaaj pour votre maison."
      />

      <div className="shop-hero-section">
        <div className="shop-container">
          <div className="shop-header-content">

            <h1 className="shop-main-title">{t('shop_page.title', 'Our Shop')}</h1>
            <p className="shop-hero-subtitle">
              {t('shop_page.subtitle', 'Professional grade cleaning solutions for a pristine environment.')}
            </p>
          </div>
        </div>
        <div className="shop-visual-accents">
          <div className="accent-circle blue"></div>
          <div className="accent-circle green"></div>
        </div>
      </div>

      <div className="shop-container main-content">
        <div className="shop-controls-bar">
          <div className="search-wrapper">
            <LuSearch className="search-icon" />
            <input
              type="text"
              placeholder={t('shop_page.search_placeholder', 'Search products...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-wrapper">
            <div className="categories-scroll">
              <button
                className={`filter-chip ${!selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                {t('shop_page.all_categories', 'All')}
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`filter-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {getLocalizedText(cat, 'name')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="shop-loading-state">
            <div className="premium-spinner"></div>
            <p>{t('shop_page.loading', 'Loading products...')}</p>
          </div>
        ) : (
          <div className="products-premium-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-premium-card">
                <div className="product-visual-box">
                  <img src={getProductImageUrl(product)} alt={product.name} />
                  <div className="product-card-overlay">
                    <button
                      className="preview-action-btn"
                      onClick={() => setSelectedProduct(product)}
                      aria-label="Voir le produit"
                    >
                      <LuEye />
                    </button>
                  </div>
                  {product.is_new && <span className="badge-new">NEW</span>}
                </div>

                <div className="product-info-box">
                  <div className="product-meta-top">
                    <span className="product-cat-name">
                      {getLocalizedText(categories.find(c => c.id === product.category_id), 'name') || product.category_name || 'Cleaning'}
                    </span>
                    <div className="product-rating">
                      <LuStar fill="#fbbf24" stroke="#fbbf24" size={14} />
                      <span>{product.rating || '4.5'}</span>
                    </div>
                  </div>

                  <h3 className="product-item-name">{getLocalizedText(product, 'name')}</h3>
                  <p className="product-item-desc">{getLocalizedText(product, 'description')}</p>

                  <div className="product-footer-actions">
                    <span className="product-item-price">{product.price} <small>MAD</small></span>
                    <div className="cart-btn-wrapper">
                      <AddToCartButton productId={product.id} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="shop-empty-state">
            <LuFilter size={48} />
            <h2>{t('shop_page.no_products', 'No products found')}</h2>
            <p>{t('shop_page.empty_desc', 'Try adjusting your filters or search query.')}</p>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Cart components */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <div className="floating-cart-anchor">
        <CartIcon onClick={() => navigate('/cart')} />
      </div>

    </main>
  );
}

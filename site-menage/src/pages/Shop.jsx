import React, { useState, useEffect, useRef } from 'react';
import './Shop.css';
import AddToCartButton from '../components/AddToCartButton';
import Cart from '../components/Cart';
import CartIcon from '../components/CartIcon';
import { useTranslation } from 'react-i18next';
import ElectricBorder from '../components/ElectricBorder';
import { supabase } from '../lib/supabase';

// Helper function to get correct product image URL
const getProductImageUrl = (product) => {
  if (!product || !product.image) {
    // Default images from public folder
    const defaultImages = [
      '/produitNettoyage.jpg',
      '/nettoyage1.jpg',
      '/nettoyage2.jpg',
      '/nettoyage3.jpg',
      '/canaper.jpg'
    ];
    const imageIndex = (product?.id || 0) % defaultImages.length;
    return defaultImages[imageIndex];
  }
  
  const imagePath = String(product.image || '').trim();
  
  // Empty or invalid URL
  if (!imagePath || imagePath === 'null' || imagePath === 'undefined' || imagePath === '') {
    const defaultImages = [
      '/produitNettoyage.jpg',
      '/nettoyage1.jpg',
      '/nettoyage2.jpg',
      '/nettoyage3.jpg',
      '/canaper.jpg'
    ];
    const imageIndex = (product.id || 0) % defaultImages.length;
    return defaultImages[imageIndex];
  }
  
  // Old Laravel storage path (ancien backend Laravel)
  // → On ESSAIE de récupérer l'image depuis Supabase Storage à partir du filename,
  //   et on NE demande plus jamais directement l'URL Laravel (pour éviter ERR_CONNECTION_REFUSED)
  if (imagePath.includes('/storage/images/products/') || 
      imagePath.includes('127.0.0.1:8000') || 
      imagePath.includes('localhost:8000') ||
      imagePath.startsWith('/storage/')) {
    console.log('[Shop] Detected legacy Laravel image URL in DB, converting to Supabase:', imagePath);
    
    // Extraire le filename depuis l'URL Laravel
    let filename = '';
    if (imagePath.includes('/storage/images/products/')) {
      const parts = imagePath.split('/storage/images/products/');
      filename = parts[parts.length - 1];
    } else {
      const parts = imagePath.split('/');
      filename = parts[parts.length - 1];
    }
    
    // Supprimer les éventuels paramètres de requête
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }
    
    if (filename) {
      try {
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filename);
        
        if (publicUrl) {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log('[Shop] Converted Laravel filename to Supabase URL:', filename);
          }
          return publicUrl;
        }
      } catch (err) {
        // Silently fall back to default image
      }
    }
    
    // Si on ne peut pas convertir, on retournera plus bas une image par défaut
  }
  
  // If it's already an absolute URL (Supabase Storage URLs ou autres)
  if (/^https?:\/\//i.test(imagePath)) {
    // Si c'est encore une URL Laravel, la branch précédente aura déjà essayé de la convertir.
    // Ici, on garde uniquement les URLs non-Laravel.
    if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000')) {
      console.warn('[Shop] Ignoring unreachable Laravel URL, falling back to default image:', imagePath);
      // On laisse continuer vers le fallback plus bas.
    } else {
      return imagePath;
    }
  }
  
  // Supabase Storage path - get public URL
  if (imagePath.includes('supabase.co/storage') || imagePath.includes('supabase.in/storage')) {
    return imagePath;
  }
  
  // If it's a path like "products/filename.jpg" or just "filename.jpg", get public URL
  if (imagePath.startsWith('products/') || (!imagePath.includes('/') && imagePath.includes('.'))) {
    const path = imagePath.startsWith('products/') ? imagePath : imagePath;
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(path);
      return publicUrl;
    } catch (err) {
      console.warn('Error getting public URL for:', path, err);
      const defaultImages = [
        '/produitNettoyage.jpg',
        '/nettoyage1.jpg',
        '/nettoyage2.jpg',
        '/nettoyage3.jpg',
        '/canaper.jpg'
      ];
      const imageIndex = (product.id || 0) % defaultImages.length;
      return defaultImages[imageIndex];
    }
  }
  
  // Relative path starting with / - use as is (for local images)
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  
  // Default - return default image
  const defaultImages = [
    '/produitNettoyage.jpg',
    '/nettoyage1.jpg',
    '/nettoyage2.jpg',
    '/nettoyage3.jpg',
    '/canaper.jpg'
  ];
  const imageIndex = (product.id || 0) % defaultImages.length;
  return defaultImages[imageIndex];
};

// Component for product image with error handling
const ProductImage = ({ product }) => {
  const { t } = useTranslation();
  
  // Memoize image URL and default image to prevent unnecessary recalculations
  const imageUrl = React.useMemo(() => getProductImageUrl(product), [product.id, product.image]);
  
  const defaultImages = React.useMemo(() => [
    '/produitNettoyage.jpg',
    '/nettoyage1.jpg',
    '/nettoyage2.jpg',
    '/nettoyage3.jpg',
    '/canaper.jpg'
  ], []);
  
  const defaultImage = React.useMemo(() => {
    const defaultImageIndex = (product.id || 0) % defaultImages.length;
    return defaultImages[defaultImageIndex];
  }, [product.id, defaultImages]);
  
  // Initialize with the final image URL once
  const initialImageSrc = React.useMemo(() => imageUrl || defaultImage, [imageUrl, defaultImage]);
  
  const [imgSrc, setImgSrc] = useState(initialImageSrc);
  const [attemptCount, setAttemptCount] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef(null);
  
  // Only reset when product ID actually changes (not on every render)
  useEffect(() => {
    const newImageUrl = getProductImageUrl(product);
    const newDefaultImage = defaultImages[(product.id || 0) % defaultImages.length];
    const newInitialSrc = newImageUrl || newDefaultImage;
    
    // Only update if the source actually changed
    if (newInitialSrc !== imgSrc) {
      setImgSrc(newInitialSrc);
      setAttemptCount(0);
      setImageLoaded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]); // Only depend on product.id, not on computed values
  
  const handleImageError = React.useCallback((ev) => {
    // Prevent multiple error handlers from firing
    if (ev.currentTarget.dataset.errorHandled === 'true') {
      return;
    }
    ev.currentTarget.dataset.errorHandled = 'true';
    
    // Only log error if it's not a Supabase 404 (expected when files aren't uploaded yet)
    const isSupabase404 = ev.currentTarget.src.includes('supabase.co/storage') || 
                          ev.currentTarget.src.includes('supabase.in/storage');
    if (!isSupabase404) {
      console.warn('[Shop] Image load error:', {
        currentSrc: ev.currentTarget.src,
        originalUrl: imageUrl,
        productId: product.id,
        attempt: attemptCount
      });
    }
    
    // If Supabase URL failed, immediately use default image (don't try other defaults)
    if (isSupabase404 && attemptCount === 0) {
      setImgSrc(defaultImage);
      setAttemptCount(1);
      setTimeout(() => {
        if (imgRef.current) {
          imgRef.current.dataset.errorHandled = 'false';
        }
      }, 100);
      return;
    }
    
    // Try default images if original failed
    if (attemptCount < defaultImages.length - 1) {
      const nextIndex = (attemptCount + 1) % defaultImages.length;
      const nextImage = defaultImages[nextIndex];
      setImgSrc(nextImage);
      setAttemptCount(prev => prev + 1);
      // Reset error flag for next attempt
      setTimeout(() => {
        if (imgRef.current) {
          imgRef.current.dataset.errorHandled = 'false';
        }
      }, 100);
    } else {
      // All images failed, show placeholder
      ev.currentTarget.style.display = 'none';
      const placeholder = ev.currentTarget.nextElementSibling;
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    }
  }, [attemptCount, defaultImages, imageUrl, product.id, defaultImage]);
  
  const handleImageLoad = React.useCallback(() => {
    setImageLoaded(true);
    // Ensure image stays visible
    if (imgRef.current) {
      imgRef.current.style.display = 'block';
      imgRef.current.style.opacity = '1';
      imgRef.current.style.visibility = 'visible';
    }
    // Only log in development and for non-default images
    if (process.env.NODE_ENV === 'development' && !imgSrc.startsWith('/')) {
      console.log('[Shop] ✅ Image loaded:', product.id);
    }
  }, [imgSrc, product.id]);
  
  if (!imageUrl && !defaultImage) {
    return (
      <div className="product-image-placeholder" style={{display: 'flex'}}>
        <div className="placeholder-content">
          <div className="placeholder-text">{t('shop_page.image_not_available')}</div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <img 
        ref={imgRef}
        key={`product-image-${product.id}-${imgSrc}`}
        src={imgSrc} 
        alt={product.name || 'Product'}
        className="product-image"
        loading="lazy"
        decoding="async"
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{
          display: 'block',
          opacity: 1,
          visibility: 'visible'
        }}
      />
    </>
  );
};

export default function Shop() {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState(t('shop_page.all_categories'));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [authToken, setAuthToken] = useState(localStorage.getItem('auth_token'));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState([t('shop_page.all_categories')]);
  const [dbCategories, setDbCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [productTypes, setProductTypes] = useState([]); // types for selected category
  const [selectedType, setSelectedType] = useState(t('shop_page.all_categories'));
  const [ratingMap, setRatingMap] = useState({}); // { productId: {avg, count} }
  const [toast, setToast] = useState({ show: false, message: '' });
  const [ratedNotice, setRatedNotice] = useState({ productId: null, message: '' });
  const [reviewsModal, setReviewsModal] = useState({ open: false, loading: false, productId: null, productName: '', reviews: [], error: '' });
  const [productDetailModal, setProductDetailModal] = useState({ open: false, product: null });
  const [userRatedProducts, setUserRatedProducts] = useState([]); // Array of product IDs the user has rated
  const [isSubmittingRating, setIsSubmittingRating] = useState({}); // Track which product is being rated
  const [reviewsForm, setReviewsForm] = useState({ open: false, rating: 5, comment: '' }); // Inline form inside reviews modal

  useEffect(() => {
    // Don't change language automatically - respect user's current language selection
    // Only load data with the current language
    loadProducts();
    loadCategories();
    loadUserRatings();
  }, []);

  // Reload translated data when language changes (but don't change language automatically)
  useEffect(() => {
    // Reset labels depending on language
    setSelectedCategory(t('shop_page.all_categories'));
    setSelectedType(t('shop_page.all_categories'));
    // The language should already be set by i18n's LanguageDetector or user selection
    // Don't persist here to avoid conflicts
    loadProducts();
    loadCategories();
    if (selectedCategoryId) loadProductTypes(selectedCategoryId);
  }, [i18n.language]);

  const fetchRatings = async () => {
    try {
      // Load ratings from Supabase
      const { data, error } = await supabase
        .from('ratings')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // Group ratings by product_id and calculate averages
      const ratingMap = {};
      if (data && Array.isArray(data)) {
        data.forEach(rating => {
          if (rating.product_id) {
            if (!ratingMap[rating.product_id]) {
              ratingMap[rating.product_id] = { sum: 0, count: 0, ratings: [] };
            }
            ratingMap[rating.product_id].sum += rating.rating || 0;
            ratingMap[rating.product_id].count += 1;
            ratingMap[rating.product_id].ratings.push(rating);
          }
        });
        
        // Calculate averages
        Object.keys(ratingMap).forEach(productId => {
          const stats = ratingMap[productId];
          ratingMap[productId] = {
            avg: stats.count > 0 ? (stats.sum / stats.count).toFixed(1) : 0,
            count: stats.count,
            ratings: stats.ratings
          };
        });
      }
      
      setRatingMap(ratingMap);
    } catch (err) {
      console.error('Error loading ratings:', err);
    }
  };


  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
  };

  // Helpers to normalize DB labels to current language
  const translateKnownCategory = (name) => {
    const n = String(name || '').toLowerCase();
    if (['produit', 'product', 'produits', 'products'].includes(n)) return t('shop_page.product_category');
    if (['accessoire', 'accessory', 'accessories'].includes(n)) return t('shop_page.accessory_category');
    return null;
  };

  const getCategoryDisplay = (cat) => {
    if (!cat) return t('shop_page.not_defined');
    return cat.translated_name || translateKnownCategory(cat.name) || cat.name;
  };

  const getTypeDisplay = (type) => {
    if (!type) return t('shop_page.not_defined');
    
    // Get current language
    const lang = (i18n.language || 'fr').toString().split(/[-_]/)[0].toLowerCase();
    
    // Prefer direct per-language DB columns if present
    if (lang === 'ar' && type.name_ar) return type.name_ar;
    if (lang === 'fr' && type.name_fr) return type.name_fr;
    if (lang === 'en' && type.name_en) return type.name_en;
    
    // Fallback to name field
    return type.name || t('shop_page.not_defined');
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load products from Supabase
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message || 'Erreur lors du chargement des produits');
      }

      setProducts(data || []);
      await fetchRatings();
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des produits');
      console.error('Erreur lors du chargement des produits:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // Load categories from Supabase
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      if (data && Array.isArray(data)) {
        setDbCategories(data);
        const categoryNames = [t('shop_page.all_categories'), ...data.map(getCategoryDisplay)];
          setCategories(categoryNames);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
      // Fallback to default categories if API fails
      setCategories([t('shop_page.all_categories'), t('shop_page.product_category'), t('shop_page.accessory_category')]);
    }
  };

  const loadProductTypes = async (categoryId) => {
    try {
      if (!categoryId) { 
        setProductTypes([]); 
        return; 
      }
      
      // Load only the product types that belong to the selected category
      const { data, error } = await supabase
        .from('product_types')
        .select('*')
        .eq('category_id', categoryId)
        .order('name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setProductTypes(data || []);
    } catch (err) {
      console.error('Error loading product types:', err);
      setProductTypes([]);
    }
  };

  // Charger le nombre d'articles du panier pour l'icône
  const loadCartCount = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Load cart from Supabase for authenticated users
        const { data, error } = await supabase
          .from('carts')
          .select('quantity')
          .eq('user_id', session.user.id);
        
        if (!error && data) {
          const count = data.reduce((total, item) => total + (parseInt(item.quantity, 10) || 0), 0);
          setCartCount(count);
        }
      } else {
        // Pour les utilisateurs non connectés, charger depuis localStorage
        const cartKey = 'guest_cart';
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        const count = cart.reduce((total, item) => total + (parseInt(item.quantity, 10) || 0), 0);
        setCartCount(count);
      }
    } catch (err) {
      console.error('Error loading cart count:', err);
      // Fallback to localStorage
      const cartKey = 'guest_cart';
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      const count = cart.reduce((total, item) => total + (parseInt(item.quantity, 10) || 0), 0);
      setCartCount(count);
    }
  };

  useEffect(() => {
    loadCartCount();
    loadUserRatings();
    
    // Écouter les événements de mise à jour du panier
    const handleCartUpdate = () => {
      loadCartCount();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [authToken]);

  const loadUserRatings = async () => {
    try {
      // Check localStorage first
      const ratedList = JSON.parse(localStorage.getItem('rated_products') || '[]');
      if (Array.isArray(ratedList)) {
        setUserRatedProducts(ratedList);
      }
      
      // Also check from Supabase if authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('ratings')
          .select('product_id')
          .eq('user_id', session.user.id);
        
        if (!error && data) {
            // Get product IDs from user's ratings
          const productIds = [...new Set(data.map(rating => rating.product_id).filter(id => id))];
            setUserRatedProducts(prev => [...new Set([...prev, ...productIds])]);
        }
      }
    } catch (error) {
      console.error('Error loading user ratings:', error);
    }
  };

  // Allow other components (like Cart) to open the reviews modal via CustomEvent
  useEffect(() => {
    const handler = (e) => {
      const { productId, productName } = e.detail || {};
      if (productId) openReviewsModal(productId, productName || 'Produit');
    };
    window.addEventListener('openProductReviews', handler);
    return () => window.removeEventListener('openProductReviews', handler);
  }, []);

  const openReviewsModal = async (productId, productName = 'Produit') => {
    setReviewsModal({ open: true, loading: true, productId, productName, reviews: [], error: '' });
    try {
      // Load ratings from Supabase
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      let reviews = [];
      if (!error && data) {
        reviews = Array.isArray(data) ? data : [];
      } else {
        console.warn('Failed to load ratings:', error);
      }
      setReviewsModal((m) => ({ ...m, loading: false, reviews }));
    } catch (e) {
      console.error('Ratings load error:', e);
      setReviewsModal((m) => ({ ...m, loading: false, reviews: [], error: '' }));
    }
  };

  const closeReviewsModal = () => setReviewsModal({ open: false, loading: false, productId: null, productName: '', reviews: [], error: '' });

  const openProductDetailModal = (product) => setProductDetailModal({ open: true, product });
  const closeProductDetailModal = () => setProductDetailModal({ open: false, product: null });

  const filteredProducts = products.filter(product => {
    // Category filter
    let matchCategory = true;
    if (selectedCategory !== t('shop_page.all_categories')) {
      if (selectedCategoryId) {
        matchCategory = product.category_id == selectedCategoryId;
      } else {
        matchCategory = product.category === selectedCategory;
      }
    }
    if (!matchCategory) return false;
    // Type filter
    if (selectedType !== t('shop_page.all_categories')) {
      // Find type by comparing displayed name (using getTypeDisplay)
      const typeObj = productTypes.find(t => getTypeDisplay(t) === selectedType);
      if (typeObj) {
        return product.type_id == typeObj.id;
      }
      // Fallback: try to match by ID if selectedType is a number
      const typeId = parseInt(selectedType, 10);
      if (!isNaN(typeId)) {
        return product.type_id == typeId;
      }
      return false;
    }
    return true;
  });

  const submitRating = async (productId, ratingValue, commentValue) => {
    // Check if user already rated this product
    if (userRatedProducts.includes(productId)) {
      setRatedNotice({ productId, message: t('shop_page.already_evaluated') });
      setTimeout(() => setRatedNotice({ productId: null, message: '' }), 2500);
      return;
    }

    // Set loading state
    setIsSubmittingRating(prev => ({ ...prev, [productId]: true }));

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      
      // Insert rating into Supabase
      const { data, error } = await supabase
        .from('ratings')
        .insert({
          product_id: productId,
          rating: ratingValue,
          comment: commentValue || null,
          user_id: userId
        })
        .select();
      
      if (error) {
        // Check if it's a duplicate rating error
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          setRatedNotice({ productId, message: t('shop_page.already_evaluated') });
          setTimeout(() => setRatedNotice({ productId: null, message: '' }), 2500);
          setIsSubmittingRating(prev => ({ ...prev, [productId]: false }));
          return;
        }
        throw error;
      }
      
      // Success - rating was inserted
      if (data && data.length > 0) {
      // Mark as rated in state
      setUserRatedProducts(prev => [...prev, productId]);
      
      // Mark as rated in localStorage
      try {
        const ratedList = JSON.parse(localStorage.getItem('rated_products') || '[]');
        const updated = Array.from(new Set([...(Array.isArray(ratedList)?ratedList:[]), productId]));
        localStorage.setItem('rated_products', JSON.stringify(updated));
      } catch {}
      
      // Show success toast
      showToast(t('shop_page.rating_submitted'));
      
      // Refresh ratings
      await fetchRatings();
        
        // Reload reviews modal if open
        if (reviewsModal.open && reviewsModal.productId === productId) {
          await openReviewsModal(productId, reviewsModal.productName);
        }
      } else {
        throw new Error('Erreur enregistrement évaluation');
      }
      
      // Clear form
      const commentInput = document.getElementById(`comment_${productId}`);
      if (commentInput) commentInput.value = '';
      
    } catch (e) {
      showToast(t('shop_page.rating_error'));
      console.error('Rating error:', e);
    } finally {
      setIsSubmittingRating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleCartToggle = () => {
    setIsCartOpen(!isCartOpen);
  };

  const handleCartClose = () => {
    setIsCartOpen(false);
  };

  const handleSelectCategory = (label) => {
    setSelectedCategory(label);
    if (label === t('shop_page.all_categories')) {
      setSelectedCategoryId(null);
      setSelectedType(t('shop_page.all_categories'));
      setProductTypes([]);
      return;
    }
    const c = dbCategories.find(cat => 
      cat.translated_name === label ||
      cat.name === label ||
      getCategoryDisplay(cat) === label
    );
    const cid = c?.id || null;
    setSelectedCategoryId(cid);
    setSelectedType(t('shop_page.all_categories'));
    loadProductTypes(cid);
  };

  const handleAddToCartSuccess = () => {
    // Mettre à jour le compteur du panier
    loadCartCount();
  };

  const handleAddToCartError = (error) => {
    console.error('Erreur lors de l\'ajout au panier:', error);
    // Optionnel: afficher une notification d'erreur
  };

  // Helper functions for product information
  const getProductName = (product) => {
    const lang = (i18n.language || 'fr').toString().split(/[-_]/)[0].toLowerCase();
    // Prefer direct per-language DB columns if present
    if (lang === 'ar' && product.name_ar) return product.name_ar;
    if (lang === 'fr' && product.name_fr) return product.name_fr;
    if (lang === 'en' && product.name_en) return product.name_en;
    // Fallbacks: API may already alias to `name`
    if (product.translated_name && product.translated_name !== product.name) return product.translated_name;
    return product.name || product.name_fr || product.name_en || product.name_ar || '';
  };

  const getProductDescription = (product) => {
    const lang = (i18n.language || 'fr').toString().split(/[-_]/)[0].toLowerCase();
    if (lang === 'ar' && product.description_ar) return product.description_ar;
    if (lang === 'fr' && product.description_fr) return product.description_fr;
    if (lang === 'en' && product.description_en) return product.description_en;
    if (product.translated_description && product.translated_description !== product.description) return product.translated_description;
    return product.description || product.description_fr || product.description_en || product.description_ar || '';
  };

  const getCategoryName = (product) => {
    if (product.category?.translated_name) return product.category.translated_name;
    if (product.category?.name) {
      // Check if there's a translation key for this category
      const catKey = product.category.name.toLowerCase().replace(/\s+/g, '_');
      const translated = t(`categories.${catKey}`, product.category.name);
      return translated !== `categories.${catKey}` ? translated : product.category.name;
    }
    if (product.category) return product.category;
    const category = dbCategories.find(cat => cat.id === product.category_id);
    if (category) {
      if (category.translated_name) return category.translated_name;
      const catKey = category.name.toLowerCase().replace(/\s+/g, '_');
      const translated = t(`categories.${catKey}`, category.name);
      return translated !== `categories.${catKey}` ? translated : category.name;
    }
    return t('shop_page.not_defined');
  };

  const getTypeName = (product) => {
    // Get current language
    const lang = (i18n.language || 'fr').toString().split(/[-_]/)[0].toLowerCase();
    
    // Check if product has nested type object
    if (product.product_type) {
      if (lang === 'ar' && product.product_type.name_ar) return product.product_type.name_ar;
      if (lang === 'fr' && product.product_type.name_fr) return product.product_type.name_fr;
      if (lang === 'en' && product.product_type.name_en) return product.product_type.name_en;
      if (product.product_type.name) return product.product_type.name;
    }
    
    if (product.type) {
      if (lang === 'ar' && product.type.name_ar) return product.type.name_ar;
      if (lang === 'fr' && product.type.name_fr) return product.type.name_fr;
      if (lang === 'en' && product.type.name_en) return product.type.name_en;
      if (product.type.name) return product.type.name;
    }
    
    // Find type from productTypes array
    const type = productTypes.find(t => t.id === product.type_id);
    if (type) {
      if (lang === 'ar' && type.name_ar) return type.name_ar;
      if (lang === 'fr' && type.name_fr) return type.name_fr;
      if (lang === 'en' && type.name_en) return type.name_en;
      if (type.name) return type.name;
    }
    
    return t('shop_page.not_defined');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="shop-page">
      {toast.show && (
        <div style={{
          position:'fixed',
          top:16,
          right:16,
          background:'#111827',
          color:'#fff',
          padding:'12px 14px',
          borderRadius:12,
          boxShadow:'0 10px 25px rgba(0,0,0,0.25)',
          zIndex: 100000
        }}>
          {toast.message}
        </div>
      )}
      <div className="shop-container">
        <header className="shop-header">
          <div className="shop-header-content">
            <h1 className="shop-title" data-aos="fade-up" data-aos-delay="100">{t('shop_page.title')}</h1>
            <p className="shop-description" data-aos="fade-up" data-aos-delay="200">
              {t('shop_page.subtitle')}
            </p>
          </div>
          <div className="shop-cart-icon" data-aos="fade-up" data-aos-delay="300">
            <div className="shop-icons-container">
              <CartIcon 
                onClick={() => {
                  // Rediriger vers la page panier
                  window.location.href = '/cart';
                }} 
                token={authToken} 
                count={cartCount}
              />
            </div>
          </div>
        </header>

        <div className="shop-filters" data-aos="fade-up" data-aos-delay="300">
          {categories.map((category, index) => (
            <button
              key={category}
              className={`filter-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => handleSelectCategory(category)}
              data-aos="zoom-in"
              data-aos-delay={`${400 + index * 50}`}
            >
              {category}
            </button>
          ))}
        </div>

        {selectedCategory !== t('shop_page.all_categories') && productTypes.length > 0 && (
          <div className="shop-filters" data-aos="fade-up" data-aos-delay="350">
            {[ t('shop_page.all_categories'), ...productTypes.map(tp => getTypeDisplay(tp)) ].map((typeName, idx) => (
              <button
                key={typeName}
                className={`filter-button ${selectedType === typeName ? 'active' : ''}`}
                onClick={() => setSelectedType(typeName)}
                data-aos="zoom-in"
                data-aos-delay={`${450 + idx * 50}`}
              >
                {typeName}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('shop_page.loading')}</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">!</div>
            <h3>{t('shop_page.error')}</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={loadProducts}>
              {t('shop_page.retry')}
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <h3>{t('shop_page.no_products')}</h3>
                <p>{t('shop_page.modify_search')}</p>
              </div>
            ) : (
              filteredProducts.map((product, index) => (
                <ElectricBorder key={product.id} intensity={0.5} baseFrequency={0.04} numOctaves={3}>
                  <div className="product-card" data-aos="fade-up" data-aos-delay={`${500 + index * 100}`}>
                    {/* Product Image */}
                    <div className="product-image-container">
                    <ProductImage product={product} />
                    <div className="product-image-placeholder" style={{display: 'none'}}>
                      <div className="placeholder-content">
                        <div className="placeholder-text">{t('shop_page.image_not_available')}</div>
                      </div>
                    </div>
                    {!product.in_stock && (
                      <div className="out-of-stock-badge">{t('shop_page.out_of_stock')}</div>
                    )}
                    {/* View Details Button (hover reveal) */}
                    <button 
                      type="button" 
                      className="view-details-btn"
                      onClick={() => openProductDetailModal(product)}
                    >
                      {t('shop_page.view_details')}
                    </button>
                  </div>

                  {/* Product Title */}
                  <div className="product-title-section">
                    <h3 className="product-name">{getProductName(product)}</h3>
                    {/* <span className="product-id">#{product.id}</span> */}
                  </div>
                  
                  

                  

                  {/* Footer: Price + Add to Cart (anchored at bottom) */}
                  <div className="product-footer">
                    <div className="product-footer-price">
                      <span className="price-label-inline">{t('shop_page.price')}</span>
                      <span className="price-value">{parseFloat(product.price).toFixed(2)} DH</span>
                    </div>
                    <AddToCartButton
                      productId={product.id}
                      quantity={1}
                      disabled={!product.in_stock}
                      onSuccess={handleAddToCartSuccess}
                      onError={handleAddToCartError}
                    />
                  </div>
                  </div>
                </ElectricBorder>
              ))
            )}
          </div>
        )}

        <section className="shop-info" data-aos="fade-up" data-aos-delay="600">
          <div className="info-card">
            <h2 data-aos="fade-up" data-aos-delay="700">{t('shop_page.delivery_returns')}</h2>
            <div className="info-grid">
              <div className="info-item" data-aos="fade-up" data-aos-delay="800">
                <h3>{t('shop_page.fast_delivery')}</h3>
                <p>{t('shop_page.fast_delivery_desc')}</p>
              </div>
              <div className="info-item" data-aos="fade-up" data-aos-delay="900">
                <h3>{t('shop_page.easy_returns')}</h3>
                <p>{t('shop_page.easy_returns_desc')}</p>
              </div>
              <div className="info-item" data-aos="fade-up" data-aos-delay="1000">
                <h3>{t('shop_page.secure_payment')}</h3>
                <p>{t('shop_page.secure_payment_desc')}</p>
              </div>
              <div className="info-item" data-aos="fade-up" data-aos-delay="1100">
                <h3>{t('shop_page.quality_guarantee')}</h3>
                <p>{t('shop_page.quality_guarantee_desc')}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <Cart 
        isOpen={isCartOpen} 
        onClose={handleCartClose} 
        token={authToken} 
      />

      {/* Reviews Modal */}
      {reviewsModal.open && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:100000
        }} onClick={closeReviewsModal}>
          <div style={{
            width:'min(620px, 92vw)', maxHeight:'80vh', overflowY:'auto',
            background:'#fff', borderRadius:16, padding:16, boxShadow:'0 20px 40px rgba(0,0,0,0.2)'
          }} onClick={(e)=>e.stopPropagation()}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
              <h3 style={{margin:0}}>{t('shop_page.reviews_title')} {reviewsModal.productName}</h3>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                {authToken ? (
                  userRatedProducts.includes(reviewsModal.productId) ? (
                    <span style={{color:'#2563eb', fontWeight:600}}>{t('shop_page.rating_submitted_success')}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReviewsForm((f) => ({ ...f, open: !f.open }))}
                      style={{ background:'#111827', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px', cursor:'pointer' }}
                    >
                      {t('shop_page.evaluate_product')}
                    </button>
                  )
                ) : (
                  <span style={{color:'#ef4444'}}>{t('shop_page.login_required')}</span>
                )}
                <button onClick={closeReviewsModal} style={{border:'none', background:'transparent', fontSize:18, cursor:'pointer'}}>×</button>
              </div>
            </div>

            {reviewsForm.open && authToken && !userRatedProducts.includes(reviewsModal.productId) && (
              <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:12, marginBottom:12, background:'#ffffff' }}>
                <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                  <select
                    value={reviewsForm.rating}
                    onChange={(e)=>setReviewsForm(f=>({ ...f, rating: parseInt(e.target.value, 10) }))}
                    className="rating-select"
                    style={{padding:'8px 10px', borderRadius:8, border:'1px solid #cbd5e1'}}
                    disabled={isSubmittingRating[reviewsModal.productId]}
                  >
                    {[5,4,3,2,1].map(v => (<option key={v} value={v}>{v} {t('shop_page.stars')}</option>))}
                  </select>
                  <input
                    value={reviewsForm.comment}
                    onChange={(e)=>setReviewsForm(f=>({ ...f, comment: e.target.value }))}
                    placeholder={t('shop_page.your_review')}
                    className="rating-input"
                    style={{flex:1, minWidth:160, padding:'8px 10px', borderRadius:8, border:'1px solid #cbd5e1'}}
                    disabled={isSubmittingRating[reviewsModal.productId]}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await submitRating(reviewsModal.productId, reviewsForm.rating, reviewsForm.comment);
                      setReviewsForm({ open: false, rating: 5, comment: '' });
                      openReviewsModal(reviewsModal.productId, reviewsModal.productName);
                    }}
                    className="rating-submit-btn"
                    style={{padding:'8px 12px'}}
                    disabled={isSubmittingRating[reviewsModal.productId]}
                  >
                    {isSubmittingRating[reviewsModal.productId] ? '...' : t('shop_page.send')}
                  </button>
                </div>
              </div>
            )}
            {reviewsModal.loading ? (
              <div style={{padding:20, textAlign:'center'}}>{t('shop_page.loading_reviews')}</div>
            ) : reviewsModal.error ? (
              <div style={{padding:20, color:'#ef4444'}}>{reviewsModal.error}</div>
            ) : reviewsModal.reviews.length === 0 ? (
              <div style={{padding:20, color:'#64748b'}}>{t('shop_page.no_evaluations')}</div>
            ) : (
              <div style={{display:'grid', gap:12}}>
                {reviewsModal.reviews.map((r, idx) => (
                  <div key={idx} style={{border:'1px solid #e5e7eb', borderRadius:12, padding:12}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <strong>{r.user_name || t('shop_page.user')}</strong>
                      <small style={{color:'#6b7280'}}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</small>
                    </div>
                    <div style={{color:'#f59e0b', margin:'4px 0'}}>
                      {Array.from({length:5}).map((_,i)=> (
                        <span key={i}>{(i+1) <= (r.rating || 0) ? '★' : '☆'}</span>
                      ))}
                    </div>
                    {r.comment && <p style={{margin:0, color:'#374151'}}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {productDetailModal.open && productDetailModal.product && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:100001,
          padding:'16px'
        }} onClick={closeProductDetailModal}>
          <div style={{
            width:'min(1000px, 95vw)', maxHeight:'90vh', overflowY:'auto',
            background:'#fff', borderRadius:24, padding:28, boxShadow:'0 20px 40px rgba(0,0,0,0.3)'
          }} onClick={(e)=>e.stopPropagation()}>
            {/* Header */}
            <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, paddingBottom:16, borderBottom:'2px solid #e5e7eb'}}>
              <h2 style={{margin:0, fontSize:'1.75rem', color:'#111'}}>{getProductName(productDetailModal.product)}</h2>
              <button onClick={closeProductDetailModal} style={{border:'none', background:'transparent', fontSize:24, cursor:'pointer', color:'#64748b', padding:4}}>×</button>
            </div>

            {/* Content Grid */}
            <div className="product-detail-grid">
              {/* Left Column: Image + Rating */}
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                {/* Product Image */}
                {(() => {
                  const imageUrl = getProductImageUrl(productDetailModal.product);
                  if (imageUrl) {
                    return (
                      <div style={{
                        position:'relative',
                        width:'100%',
                        height:'auto',
                        borderRadius:16,
                        overflow:'hidden',
                        boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
                        background:'#fff'
                      }}>
                        <img 
                          src={imageUrl} 
                          alt={productDetailModal.product.name}
                          style={{width:'100%', height:'auto', display:'block'}}
                          onError={(ev) => {
                            ev.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div style={{
                        width:'100%',
                        aspectRatio:'4/3',
                        background:'linear-gradient(135deg, #f0f4f8, #e2e8f0)',
                        borderRadius:16,
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        color:'#64748b',
                        border:'2px dashed #cbd5e1'
                      }}>
                        <div style={{textAlign:'center'}}>
                          <div style={{fontSize:'2rem', marginBottom:8}}>📦</div>
                          <div style={{fontSize:'0.875rem'}}>{t('shop_page.image_not_available')}</div>
                        </div>
                      </div>
                    );
                  }
                })()}
                
                {/* Product Rating Section */}
                {ratingMap[productDetailModal.product.id] && (
                  <div style={{
                    background:'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(251, 191, 36, 0.12))',
                    border:'2px solid rgba(251, 191, 36, 0.25)',
                    borderRadius:16,
                    padding:'1.25rem 1.5rem',
                    display:'flex',
                    flexDirection:'column',
                    alignItems:'center',
                    gap:'1rem',
                    boxShadow:'0 4px 16px rgba(251, 191, 36, 0.1)'
                  }}>
                    <div style={{
                      fontSize:'0.7rem',
                      color:'#f59e0b',
                      fontWeight:700,
                      textTransform:'uppercase',
                      letterSpacing:'1px',
                      paddingBottom:'0.5rem',
                      borderBottom:'1px solid rgba(251, 191, 36, 0.2)',
                      width:'100%',
                      textAlign:'center'
                    }}>
                      {t('shop_page.average_rating')}
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
                      <div style={{display:'flex', gap:'0.125rem'}}>
                        {Array.from({length:5}).map((_,i) => (
                          <span key={i} style={{fontSize:'2rem', color:(i+1) <= Math.round(ratingMap[productDetailModal.product.id].avg) ? '#fbbf24' : '#e5e7eb'}}>
                            ★
                          </span>
                        ))}
                      </div>
                      <div style={{
                        fontSize:'2rem',
                        fontWeight:900,
                        color:'#f59e0b',
                        fontFamily:'system-ui, -apple-system'
                      }}>
                        {ratingMap[productDetailModal.product.id].avg.toFixed(1)}
                      </div>
                    </div>
                    <div style={{
                      fontSize:'0.9rem',
                      color:'#64748b',
                      fontWeight:600,
                      display:'flex',
                      alignItems:'center',
                      gap:'0.5rem',
                      background:'rgba(255,255,255,0.5)',
                      padding:'0.5rem 1rem',
                      borderRadius:20,
                      marginTop:'0.25rem'
                    }}>
                      <span style={{fontSize:'1.1rem'}}>👥</span>
                      <span>{t('shop_page.based_on')}</span>
                      <span style={{color:'#059669', fontWeight:800, fontSize:'1.05rem'}}>{ratingMap[productDetailModal.product.id].count}</span>
                      <span>{t('shop_page.reviews_count')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Details + Description + Actions */}
              <div style={{display:'flex', flexDirection:'column', gap:20}}>
                {/* Price Card - Featured */}
                <div style={{
                  background:'linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(16, 185, 129, 0.15))',
                  border:'2px solid rgba(5, 150, 105, 0.2)',
                  borderRadius:16,
                  padding:'1.5rem',
                  display:'flex',
                  flexDirection:'column',
                  alignItems:'center',
                  justifyContent:'center',
                  gap:'0.5rem',
                  boxShadow:'0 4px 16px rgba(5, 150, 105, 0.1)'
                }}>
                  <div style={{fontSize:'0.7rem', color:'#059669', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px'}}>
                    {t('shop_page.price')}
                  </div>
                  <div style={{fontSize:'2.5rem', fontWeight:900, color:'#059669', fontFamily:'system-ui'}}>
                    {parseFloat(productDetailModal.product.price).toFixed(2)} DH
                  </div>
                </div>

                {/* Quick Info Cards */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12}}>
                  <div style={{
                    background:'linear-gradient(135deg, #ffffff, #f8fafc)',
                    border:'1px solid #e5e7eb',
                    borderRadius:12,
                    padding:'1rem',
                    transition:'all 0.2s'
                  }}>
                    <div style={{fontSize:'0.65rem', color:'#64748b', marginBottom:8, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px'}}>
                      {t('shop_page.category')}
                    </div>
                    <div style={{fontSize:'1rem', fontWeight:700, color:'#111'}}>{getCategoryName(productDetailModal.product)}</div>
                  </div>

                  <div style={{
                    background:'linear-gradient(135deg, #ffffff, #f8fafc)',
                    border:'1px solid #e5e7eb',
                    borderRadius:12,
                    padding:'1rem',
                    transition:'all 0.2s'
                  }}>
                    <div style={{fontSize:'0.65rem', color:'#64748b', marginBottom:8, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px'}}>
                      {t('shop_page.type')}
                    </div>
                    <div style={{fontSize:'1rem', fontWeight:700, color:'#111'}}>{getTypeName(productDetailModal.product)}</div>
                  </div>

                  <div style={{
                    background:'linear-gradient(135deg, #ffffff, #f8fafc)',
                    border:'1px solid #e5e7eb',
                    borderRadius:12,
                    padding:'1rem',
                    transition:'all 0.2s'
                  }}>
                    <div style={{fontSize:'0.65rem', color:'#64748b', marginBottom:8, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px'}}>
                      {t('shop_page.stock')}
                    </div>
                    <div style={{
                      fontSize:'1.25rem',
                      fontWeight:800,
                      color:productDetailModal.product.stock_quantity > 0 ? '#10b981' : '#ef4444'
                    }}>
                      {productDetailModal.product.stock_quantity || 0} {productDetailModal.product.stock_quantity > 0 ? '✓' : '✗'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {productDetailModal.product.description && (
                  <div style={{
                    background:'linear-gradient(135deg, #ffffff, #f8fafc)',
                    border:'1px solid #e5e7eb',
                    borderRadius:16,
                    padding:'1.25rem',
                    boxShadow:'0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{
                      fontSize:'0.7rem',
                      color:'#64748b',
                      marginBottom:12,
                      fontWeight:700,
                      textTransform:'uppercase',
                      letterSpacing:'0.5px',
                      display:'flex',
                      alignItems:'center',
                      gap:8
                    }}>
                      <span>📄</span> {t('shop_page.description')}
                    </div>
                    <div style={{
                      fontSize:'1rem',
                      color:'#374151',
                      lineHeight:1.8,
                      fontWeight:500
                    }}>
                      {getProductDescription(productDetailModal.product)}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  display:'flex',
                  flexDirection:'column',
                  gap:12,
                  paddingTop:8
                }}>
                  <AddToCartButton
                    productId={productDetailModal.product.id}
                    quantity={1}
                    disabled={!productDetailModal.product.in_stock}
                    onSuccess={handleAddToCartSuccess}
                    onError={handleAddToCartError}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      closeProductDetailModal();
                      openReviewsModal(productDetailModal.product.id, productDetailModal.product.name);
                    }}
                    style={{
                      width:'100%',
                      padding:'0.875rem 1.5rem',
                      borderRadius:12,
                      background:'#111827',
                      color:'#fff',
                      border:'none',
                      fontSize:'0.875rem',
                      fontWeight:700,
                      cursor:'pointer',
                      transition:'all 0.3s ease',
                      boxShadow:'0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    onMouseOver={(e)=>e.currentTarget.style.background='#1f2937'}
                    onMouseOut={(e)=>e.currentTarget.style.background='#111827'}
                  >
                    ⭐ {t('shop_page.view_evaluations')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import './AdminProductCrud.css';
import LanguageFields from '../../components/LanguageFields';
import { supabase } from '../../lib/supabase';

const AdminProductCrud = ({ token }) => {
  // States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    name_fr: '',
    name_en: '',
    description: '',
    description_ar: '',
    description_fr: '',
    description_en: '',
    slug: '',
    price: '',
    image: '',
    category_id: '',
    type_id: '',
    in_stock: true,
    stock_quantity: 0,
    order: 0
  });

  // Load data on component mount
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Load products from Supabase
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setProducts(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load categories from Supabase
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  // Load product types for a category from Supabase
  const loadTypes = async (categoryId) => {
    // Load all types (product_types doesn't have category_id column)
    try {
      const { data, error } = await supabase
        .from('product_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading types:', error);
      setTypes([]);
      return;
    }

      setTypes(data || []);
    } catch (err) {
      console.error('Error loading types:', err);
      setTypes([]);
    }
  };

  // Get product image URL
  const getProductImageUrl = (product) => {
    // Helper function to get default image
    const getDefaultImage = (productId) => {
      const defaultImages = [
        '/produitNettoyage.jpg',
        '/nettoyage1.jpg',
        '/nettoyage2.jpg',
        '/nettoyage3.jpg',
        '/canaper.jpg'
      ];
      const imageIndex = (productId || 0) % defaultImages.length;
      return defaultImages[imageIndex];
    };

    if (!product) {
      return getDefaultImage(0);
    }

    // If no image, return default
    if (!product.image) {
      return getDefaultImage(product.id);
    }

    const imageUrl = String(product.image).trim();
    
    // Empty or invalid URL
    if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined' || imageUrl === '') {
      return getDefaultImage(product.id);
    }
    
    // Old Laravel storage path - ignore it and return default
    if (imageUrl.includes('/storage/images/products/') || 
        imageUrl.includes('127.0.0.1:8000') || 
        imageUrl.includes('localhost:8000') ||
        imageUrl.startsWith('/storage/')) {
      console.log(`[Product ${product.id}] Ignoring Laravel path: ${imageUrl}`);
      return getDefaultImage(product.id);
    }
    
    // Absolute URL (includes Supabase Storage URLs) - use directly
    if (/^https?:\/\//i.test(imageUrl)) {
      // Verify it's a valid Supabase URL or external URL
      if (imageUrl.includes('supabase.co') || imageUrl.includes('supabase.in')) {
        return imageUrl;
      }
      // For other external URLs, return as is
      return imageUrl;
    }
    
    // Supabase Storage path - get public URL
    if (imageUrl.includes('supabase.co/storage') || imageUrl.includes('supabase.in/storage')) {
      return imageUrl;
    }
    
    // If it's a path like "products/filename.jpg" or just "filename.jpg", get public URL
    if (imageUrl.startsWith('products/') || (!imageUrl.includes('/') && imageUrl.includes('.'))) {
      const path = imageUrl.startsWith('products/') ? imageUrl : imageUrl;
      try {
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(path);
        return publicUrl;
      } catch (err) {
        console.warn(`[Product ${product.id}] Error getting public URL for:`, path, err);
        return getDefaultImage(product.id);
      }
    }
    
    // Relative path starting with / - try to use it (for local images)
    if (imageUrl.startsWith('/')) {
      // If it's a local path, return as is
      return imageUrl;
    }
    
    // Default - return default image for safety
    console.log(`[Product ${product.id}] Using default image for:`, imageUrl);
    return getDefaultImage(product.id);
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`; // Path inside bucket (without bucket name prefix)
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        // Check if bucket doesn't exist
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          throw new Error('Bucket "products" غير موجود. يرجى إنشاء bucket "products" في Supabase Storage أولاً.');
        }
        throw new Error(uploadError.message || 'Erreur lors du téléchargement de l\'image');
          }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
      
            // Mirror to text field immediately
      setFormData(prev => ({ ...prev, image: publicUrl }));
      return publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      alert("Erreur lors du téléchargement de l'image: " + err.message);
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isSaving) return;
      setIsSaving(true);
      // If a file is selected, upload it first
      let imageUrl = formData.image;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          setIsSaving(false);
          return; // stop save if upload failed
        }
      }

      const productData = {
          name: formData.name,
          name_ar: formData.name_ar || null,
          name_fr: formData.name_fr || null,
          name_en: formData.name_en || null,
        description: formData.description || null,
          description_ar: formData.description_ar || null,
          description_fr: formData.description_fr || null,
          description_en: formData.description_en || null,
          slug: formData.slug || null,
        price: parseFloat(formData.price) || 0,
          image: imageUrl || formData.image || null,
          category_id: formData.category_id || null,
          type_id: formData.type_id || null,
          in_stock: !!formData.in_stock,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          order: parseInt(formData.order) || 0,
      };

      let data, error;
      if (editingProduct) {
        // Update existing product
        const { data: updateData, error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select();
        data = updateData && updateData.length > 0 ? updateData[0] : null;
        error = updateError;
      } else {
        // Create new product
        const { data: insertData, error: insertError } = await supabase
          .from('products')
          .insert([productData])
          .select();
        data = insertData && insertData.length > 0 ? insertData[0] : null;
        error = insertError;
      }

      if (error) {
        throw new Error(error.message || 'Erreur lors de la sauvegarde');
      }

      // Force reload from server to get accurate data
      await loadProducts();

      resetForm();
      setSuccessMessage(editingProduct ? 'Produit modifié avec succès' : 'Produit créé avec succès');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Save error:', err);
      alert('Erreur: ' + err.message);
    }
    finally {
      setIsSaving(false);
    }
  };

  // Handle product deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message || 'Erreur lors de la suppression');
      }

      await loadProducts();
      alert('Produit supprimé avec succès');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Erreur: ' + err.message);
    }
  };

  // Handle product edit
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      name_ar: product.name_ar || '',
      name_fr: product.name_fr || '',
      name_en: product.name_en || '',
      description: product.description,
      description_ar: product.description_ar || '',
      description_fr: product.description_fr || '',
      description_en: product.description_en || '',
      price: product.price.toString(),
      image: product.image || '',
      category_id: product.category_id || '',
      type_id: product.type_id || '',
      in_stock: product.in_stock,
      stock_quantity: product.stock_quantity || 0,
      slug: product.slug || '',
      order: product.order || 0
    });
    if (product.image) {
      setImagePreview(product.image);
    } else {
      setImagePreview(null);
    }
    
    if (product.category_id) {
      loadTypes(product.category_id);
    }
    
    setShowForm(true);
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    // Show file name in the text field until upload returns the final URL
    setFormData(prev => ({...prev, image: file.name }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      name_fr: '',
      name_en: '',
      description: '',
      description_ar: '',
      description_fr: '',
      description_en: '',
      price: '',
      image: '',
      category_id: '',
      type_id: '',
      in_stock: true,
      stock_quantity: 0,
      slug: '',
      order: 0
    });
    setEditingProduct(null);
    setShowForm(false);
    setTypes([]);
    setImageFile(null);
    setImagePreview(null);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || 
                           (product.category?.name || product.category) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get category name
  const getCategoryName = (product) => {
    return product.category?.name || product.category || 'Non défini';
  };

  // Get type name
  const getTypeName = (product) => {
    return product.product_type?.name || product.type?.name || 'Non défini';
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Loading component
  if (loading) {
    return (
      <div className="admin-product-crud">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-product-crud">
      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <div className="success-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)}>×</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <h1>Gestion des Produits</h1>
          <p>Gérez vos produits et leur stock</p>
        </div>
        <div className="header-right">
          <button 
            className="btn-secondary"
            onClick={loadProducts}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12A9 9 0 0 1 12 3A9 9 0 0 1 21 12A9 9 0 0 1 12 21A9 9 0 0 1 3 12Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 3V12L16 16" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Actualiser
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Ajouter un produit
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="category-filter">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="Tous">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{filteredProducts.length}</div>
            <div className="stat-label">Produits total</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{filteredProducts.filter(p => p.in_stock).length}</div>
            <div className="stat-label">En stock</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{filteredProducts.filter(p => !p.in_stock).length}</div>
            <div className="stat-label">Rupture de stock</div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-state">
          <div className="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadProducts}>
            Réessayer
          </button>
        </div>
      )}

      {/* Empty State */}
      {!error && filteredProducts.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Aucun produit trouvé</h3>
          <p>Essayez de modifier vos critères de recherche</p>
          <button className="btn-primary" onClick={loadProducts}>
            Actualiser
          </button>
        </div>
      )}

      {/* Products Grid */}
      {!error && filteredProducts.length > 0 && (
        <div className="admin-products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="admin-product-card">
              {/* 🖼️ Product Image - في الأعلى */}
              <div className="admin-product-image-container">
                <img 
                  src={getProductImageUrl(product)} 
                  alt={product.name || 'Product'}
                  className="admin-product-image"
                  onError={(e) => {
                    // Try different default images if one fails
                    const defaultImages = [
                      '/produitNettoyage.jpg',
                      '/nettoyage1.jpg',
                      '/nettoyage2.jpg',
                      '/nettoyage3.jpg',
                      '/canaper.jpg',
                      'https://via.placeholder.com/300x300?text=No+Image'
                    ];
                    const currentSrc = e.target.src;
                    const currentIndex = defaultImages.findIndex(img => currentSrc.includes(img));
                    const nextIndex = currentIndex < defaultImages.length - 1 ? currentIndex + 1 : 0;
                    e.target.src = defaultImages[nextIndex];
                  }}
                  loading="lazy"
                />
                <div className={`admin-stock-badge ${product.in_stock ? 'in-stock' : 'out-of-stock'}`}>
                  {product.in_stock ? 'En stock' : 'Rupture'}
                </div>
              </div>

              {/* 🏷️ Product Title - تحت الصورة مباشرة */}
              <div className="admin-product-title-section">
                <h3 className="admin-product-name">{product.name}</h3>
                <span className="admin-product-id">#{product.id}</span>
              </div>

              {/* 📋 Product Details Section */}
              <div className="admin-product-details-section">
                <div className="admin-details-grid">
                  <div className="admin-detail-item">
                    <div className="admin-detail-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="admin-detail-content">
                      <span className="admin-detail-label">Type</span>
                      <span className="admin-detail-value">{getTypeName(product)}</span>
                    </div>
                  </div>

                  <div className="admin-detail-item">
                    <div className="admin-detail-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3.27 6.96L12 12.01L20.73 6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="admin-detail-content">
                      <span className="admin-detail-label">Catégorie</span>
                      <span className="admin-detail-value">{getCategoryName(product)}</span>
                    </div>
                  </div>

                  <div className="admin-detail-item">
                    <div className="admin-detail-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 14H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="admin-detail-content">
                      <span className="admin-detail-label">Stock</span>
                      <span className="admin-detail-value">{product.stock_quantity || 0}</span>
                    </div>
                  </div>

                  <div className="admin-detail-item">
                    <div className="admin-detail-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="admin-detail-content">
                      <span className="admin-detail-label">Date d'ajout</span>
                      <span className="admin-detail-value">{formatDate(product.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 💰 Product Price */}
              <div className="admin-product-price-section">
                <div className="admin-price-label">Prix</div>
                <div className="admin-product-price">
                  {product.price} €
                </div>
              </div>

              {/* 📝 Product Description */}
              <div className="admin-product-description-section">
                <p className="admin-product-description">{product.description}</p>
              </div>

              {/* ⚙️ Product Actions */}
              <div className="admin-product-actions">
                <button 
                  className="admin-btn-edit"
                  onClick={() => handleEdit(product)}
                  title="Modifier le produit"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Modifier</span>
                </button>
                <button 
                  className="admin-btn-delete"
                  onClick={() => handleDelete(product.id)}
                  title="Supprimer le produit"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}</h2>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nom du produit *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Nom du produit"
                  />
                </div>
                
                <div className="form-group">
                  <label>Prix (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <LanguageFields
                value={{
                  name_ar: formData.name_ar,
                  name_fr: formData.name_fr,
                  name_en: formData.name_en,
                  description_ar: formData.description_ar,
                  description_fr: formData.description_fr,
                  description_en: formData.description_en,
                }}
                onChange={(v) => setFormData({ ...formData, ...v })}
                includeDescription={true}
                required={false}
              />

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  required
                  placeholder="Description du produit"
                />
              </div>

              <div className="form-group">
                <label>Image du produit</label>
                {/* Preview */}
                {imagePreview && (
                  <div style={{marginBottom:'1rem'}}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{width:'200px', height:'200px', objectFit:'cover', borderRadius:'8px', border:'2px solid #e5e7eb'}}
                    />
                  </div>
                )}
                {/* Hidden file input + button */}
                <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                  <input
                    id="adminImageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{display:'none'}}
                  />
                  <label
                    htmlFor="adminImageUpload"
                    style={{
                      padding:'0.5rem 1rem',
                      background:'#2563eb',
                      color:'#fff',
                      borderRadius:'8px',
                      cursor:'pointer',
                      display:'inline-block',
                      fontSize:'0.875rem',
                      fontWeight:600
                    }}
                  >
                    📁 Choisir une image
                  </label>
                  {imageFile && (
                    <span style={{fontSize:'0.875rem', color:'#64748b'}}>{imageFile.name}</span>
                  )}
                </div>
                {/* URL fallback */}
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  placeholder="Ou entrez l'URL de l'image (optionnel)"
                  style={{marginTop:'0.5rem'}}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Catégorie *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => {
                      setFormData({...formData, category_id: e.target.value, type_id: ''});
                      loadTypes(e.target.value);
                    }}
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                {formData.category_id && (
                  <div className="form-group">
                    <label>Type de produit</label>
                    <select
                      value={formData.type_id}
                      onChange={(e) => setFormData({...formData, type_id: e.target.value})}
                    >
                      <option value="">Sélectionner un type</option>
                      {types.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantité en stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})}
                    required
                    placeholder="0"
                  />
                </div>
                
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.in_stock}
                      onChange={(e) => setFormData({...formData, in_stock: e.target.checked})}
                    />
                    <span className="checkbox-text">En stock</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductCrud;

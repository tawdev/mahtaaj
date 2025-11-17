import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import './Gallery.css';

export default function Gallery() {
  const { t, i18n } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get image URL from Supabase Storage
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a Supabase Storage path
    if (imagePath.includes('supabase.co/storage') || imagePath.includes('supabase.in/storage')) {
      return imagePath;
    }
    
    // Remove leading slash and 'gallery/' prefix if present
    let cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    if (cleanPath.startsWith('gallery/')) {
      cleanPath = cleanPath.replace('gallery/', '');
    }
    
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(cleanPath);
      return publicUrl;
    } catch (err) {
      console.warn('Error getting public URL:', err);
      return imagePath;
    }
  };

  useEffect(() => {
    loadGalleryImages();
  }, []);

  const loadGalleryImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch images from gallery table where is_active = true
      const { data, error: fetchError } = await supabase
        .from('gallery')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error loading gallery images:', fetchError);
        setError(fetchError.message || t('gallery.error_loading', 'Error loading gallery'));
        setLoading(false);
        return;
      }

      // Map images with proper URLs
      const mappedImages = (data || []).map(img => ({
        ...img,
        image_url: getImageUrl(img.image_path)
      }));

      setGalleryImages(mappedImages);
      setLoading(false);
    } catch (err) {
      console.error('Error loading gallery data:', err);
      setError(err.message || t('gallery.error_loading', 'Error loading gallery'));
      setLoading(false);
    }
  };

  const openModal = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  if (loading && galleryImages.length === 0) {
    return (
      <div className="gallery-page">
        <div className="gallery-container">
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p>{t('gallery.loading', 'Loading...')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gallery-page">
        <div className="gallery-container">
          <div style={{ textAlign: 'center', padding: '4rem', color: 'red' }}>
            <p>{error}</p>
            <button onClick={loadGalleryImages} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
              {t('gallery.retry', 'إعادة المحاولة')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-page">
      <div className="gallery-container">
        <header className="gallery-header">
          <h1 className="gallery-title" data-aos="fade-up" data-aos-delay="100">
            {t('gallery.title', 'معرض الصور')}
          </h1>
          <p className="gallery-description" data-aos="fade-up" data-aos-delay="200">
            {t('gallery.description', 'استمتع بمجموعة من أجمل الصور')}
          </p>
        </header>

        <div className="gallery-grid">
          {galleryImages.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
              <p>{t('gallery.no_images', 'لا توجد صور متاحة')}</p>
            </div>
          ) : (
            galleryImages.map((image, index) => (
              <div 
                key={image.id} 
                className="gallery-item" 
                onClick={() => openModal(image)}
                data-aos="fade-up"
                data-aos-delay={`${300 + index * 50}`}
              >
                <img 
                  src={image.image_url || image.image_path}
                  alt={t('gallery.image', 'صورة المعرض')}
                  className="gallery-image"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Image load error:', image.image_url);
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
              </div>
            ))
          )}
        </div>

        {selectedImage && (
          <div className="gallery-modal" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModal}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <img 
                src={selectedImage.image_url || selectedImage.image_path}
                alt={t('gallery.image', 'صورة المعرض')}
                className="modal-image"
                onError={(e) => {
                  console.error('Modal image load error:', selectedImage.image_url);
                  e.target.src = '/placeholder-image.jpg';
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

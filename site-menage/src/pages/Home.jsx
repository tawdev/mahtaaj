import React, { useState, useEffect } from 'react';
import './Home.css';
import ServiceCard from '../components/ServiceCard';
import Contact from './Contact';
import UserRating from '../components/UserRating';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import TousLesServices from './TousLesServices';


export default function Home() {
  const { t, i18n } = useTranslation();
  
  // Dynamic gallery data
  const [categories, setCategories] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hiddenButtons, setHiddenButtons] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Gallery slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Scroll-to-top button state
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Ensure component is mounted before rendering dynamic content
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Helper function to get image URL from Supabase Storage
  const getImageUrl = React.useCallback((imagePath) => {
    if (!imagePath) {
      console.warn('[Home] No image path provided');
      return null;
    }
    
    console.log('[Home] Processing image path:', imagePath);
    
    // If it's already a full URL (Supabase Storage)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log('[Home] Already a full URL:', imagePath);
      return imagePath;
    }
    
    // If it's a Supabase Storage path
    if (imagePath.includes('supabase.co/storage') || imagePath.includes('supabase.in/storage')) {
      console.log('[Home] Supabase Storage URL:', imagePath);
      return imagePath;
    }
    
    // If it's a relative path, try to get from Supabase Storage
    // Remove leading slash if present
    let cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    // Path in database is like "gallery/filename.jpg"
    // We need to use just "filename.jpg" for getPublicUrl
    // Because the bucket name is already "gallery"
    if (cleanPath.startsWith('gallery/')) {
      cleanPath = cleanPath.replace('gallery/', '');
    }
    
    console.log('[Home] Cleaned path for Supabase Storage:', cleanPath);
    
    try {
      const { data: { publicUrl }, error } = supabase.storage
        .from('gallery')
        .getPublicUrl(cleanPath);
      
      if (error) {
        console.error('[Home] Error getting public URL:', error);
        return null;
      }
      
      console.log('[Home] ✅ Generated Supabase URL:', publicUrl, 'from path:', imagePath);
      return publicUrl;
    } catch (err) {
      console.error('[Home] Exception getting public URL:', err);
      return null;
    }
  }, []);
  
  // Load categories and gallery images from Supabase
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const locale = i18n.language || 'fr';
        
        // Load categories from Supabase
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('category_gallery')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });
        
        if (!isMounted) return;
        
        if (categoriesError) {
          console.error('Error loading categories:', categoriesError);
        } else if (categoriesData && categoriesData.length > 0) {
          // Map categories with localized names
          const mappedCategories = categoriesData.map(cat => ({
            ...cat,
            name: cat[`name_${locale}`] || cat.name || cat.name_fr || '',
            description: cat[`description_${locale}`] || cat.description || cat.description_fr || ''
          }));
          
          setCategories(mappedCategories);
          
          // Select first category by default
          if (mappedCategories.length > 0 && !selectedCategory) {
            setSelectedCategory(mappedCategories[0]);
          }
        }
        
        // Load all gallery images from Supabase
        const { data: imagesData, error: imagesError } = await supabase
          .from('gallery')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!isMounted) return;
        
        if (imagesError) {
          console.error('Error loading gallery images:', imagesError);
        } else if (imagesData) {
          // Map images with proper URLs
          const mappedImages = imagesData.map(img => ({
            ...img,
            image_url: getImageUrl(img.image_path || img.image_url)
          }));
          setGalleryImages(mappedImages);
        }
      } catch (error) {
        console.error('Error loading gallery data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [i18n.language, getImageUrl]);

  // Load images for selected category
  useEffect(() => {
    const loadCategoryImages = async () => {
      if (!selectedCategory) {
        console.log('[Home] No selected category');
        return;
      }
      
      console.log('[Home] Loading images for category:', selectedCategory.id, selectedCategory.name);
      
      try {
        const { data: imagesData, error } = await supabase
          .from('gallery')
          .select('*')
          .eq('category_gallery_id', selectedCategory.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('[Home] Error loading category images:', error);
          setCurrentImage(null);
          return;
        }
        
        console.log('[Home] Loaded images:', imagesData?.length || 0);
        
        if (imagesData && imagesData.length > 0) {
          // Map images with proper URLs
          const mappedImages = imagesData.map(img => {
            const imageUrl = getImageUrl(img.image_path || img.image_url);
            console.log('[Home] Image mapping:', {
              id: img.id,
              originalPath: img.image_path || img.image_url,
              generatedUrl: imageUrl
            });
            return {
              ...img,
              image_url: imageUrl
            };
          }).filter(img => img.image_url); // Filter out images without valid URLs
          
          console.log('[Home] Mapped images with valid URLs:', mappedImages.length);
          
          if (mappedImages.length > 0) {
            // Select random image from category
            const randomImage = mappedImages[Math.floor(Math.random() * mappedImages.length)];
            console.log('[Home] Selected random image:', randomImage);
            setCurrentImage(randomImage);
          } else {
            console.warn('[Home] No images with valid URLs found');
            setCurrentImage(null);
          }
        } else {
          console.warn('[Home] No images found for category');
          setCurrentImage(null);
        }
      } catch (error) {
        console.error('[Home] Exception loading category images:', error);
        setCurrentImage(null);
      }
    };
    
    loadCategoryImages();
  }, [selectedCategory, i18n.language, getImageUrl]);

  // Auto-slide functionality (for gallery slider section - currently commented)
  useEffect(() => {
    if (!isPlaying || galleryImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
    }, 1000); // Change slide every 1 second

    return () => clearInterval(interval);
  }, [isPlaying, galleryImages.length]);

  // Scroll-to-top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextSlide = () => {
    if (galleryImages.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
    }
  };

  const prevSlide = () => {
    if (galleryImages.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    }
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Category selection handler
  const handleCategorySelect = async (category) => {
    if (category.id === selectedCategory?.id || isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Add fade out animation for clicked button
    setHiddenButtons(prev => new Set([...prev, category.id]));
    
    try {
      const { data: imagesData, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('category_gallery_id', category.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading category images:', error);
        setIsTransitioning(false);
        setHiddenButtons(prev => {
          const newSet = new Set(prev);
          newSet.delete(category.id);
          return newSet;
        });
        return;
      }
      
      if (imagesData && imagesData.length > 0) {
        // Map images with proper URLs
        const mappedImages = imagesData.map(img => ({
          ...img,
          image_url: getImageUrl(img.image_path || img.image_url)
        }));
        
        // Select random image from category
        const randomImage = mappedImages[Math.floor(Math.random() * mappedImages.length)];
        
        setTimeout(() => {
          setSelectedCategory(category);
          setCurrentImage(randomImage);
          setIsTransitioning(false);
          
          // Remove fade out animation after 1 second
          setTimeout(() => {
            setHiddenButtons(prev => {
              const newSet = new Set(prev);
              newSet.delete(category.id);
              return newSet;
            });
          }, 1000);
        }, 300);
      } else {
        setIsTransitioning(false);
        setHiddenButtons(prev => {
          const newSet = new Set(prev);
          newSet.delete(category.id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error loading category images:', error);
      setIsTransitioning(false);
      setHiddenButtons(prev => {
        const newSet = new Set(prev);
        newSet.delete(category.id);
        return newSet;
      });
    }
  };

  // Auto-rotate through categories
  useEffect(() => {
    if (!isPlaying || categories.length === 0 || isTransitioning) return;
    
    const interval = setInterval(() => {
      const currentIndex = categories.findIndex(cat => cat.id === selectedCategory?.id);
      const nextIndex = (currentIndex + 1) % categories.length;
      const nextCategory = categories[nextIndex];
      
      if (nextCategory) {
        handleCategorySelect(nextCategory);
      }
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length, selectedCategory?.id, isPlaying, isTransitioning]);
  
  // Don't render dynamic content until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="Home">
        <header className="home-hero">
          <div className="hero-background">
            <div className="background-image" style={{ background: '#1e293b' }} />
          </div>
          <div className="home-hero-content">
            <h1 className="hero-title fade-in">
              {t('home_page.hero.title', 'Bienvenue')}
            </h1>
            <p className="hero-description fade-in">
              {t('home_page.hero.subtitle', 'Services de nettoyage professionnels')}
            </p>
            <div className="button-container">
              <Link to="/tous-les-services" className="home-primary-button" aria-label={t('home_page.buttons.book_now')}>
                <span className="icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                {t('home_page.buttons.book_now')}
              </Link>
            </div>
          </div>
        </header>
        <main>
          <section className="home-services" id="nos-services">
            <TousLesServices />
          </section>
        </main>
      </div>
    );
  }
  
  return (
    <div className="Home">
      <header className="home-hero">
        {/* Animated Background */}
        {loading ? (
          <div className="hero-background">
            <div className="background-image" style={{ background: '#1e293b' }} />
          </div>
        ) : currentImage && currentImage.image_url ? (
          <div className="hero-background">
            <div 
              className="background-image"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${currentImage.image_url})`
              }}
            />
          </div>
        ) : (
          <div className="hero-background">
            <div className="background-image" style={{ background: '#1e293b' }} />
          </div>
        )}

        {/* Category Selection Buttons */}
        {loading ? (
          <div className="service-buttons-container category-buttons-container">
            {[1, 2, 3].map((i) => (
              <div key={i} className="category-button skeleton-button" aria-hidden="true">
                <span className="service-label skeleton-text"></span>
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="service-buttons-container category-buttons-container">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`service-button category-button ${selectedCategory?.id === category.id ? 'active' : ''} ${hiddenButtons.has(category.id) ? 'fade-out' : 'fade-in'}`}
                onClick={() => handleCategorySelect(category)}
                title={category.name}
                aria-label={category.name}
                type="button"
              >
                <span className="service-label">{category.name}</span>
              </button>
            ))}
          </div>
        ) : null}

        {/* Hero Content */}
        {loading ? (
          <div className="home-hero-content">
            <div className="hero-title skeleton-text" style={{ width: '60%', margin: '0 auto 16px', height: '48px' }} aria-hidden="true"></div>
            <div className="hero-description skeleton-text" style={{ width: '80%', margin: '0 auto 24px', height: '24px' }} aria-hidden="true"></div>
            <div className="button-container">
              <div className="home-primary-button skeleton-button" style={{ width: '180px', height: '48px' }} aria-hidden="true"></div>
            </div>
          </div>
        ) : selectedCategory && currentImage ? (
          <div className="home-hero-content">
            <h1 className={`hero-title ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
              {selectedCategory.name}
            </h1>
            {selectedCategory.description && (
              <p className={`hero-description ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
                {selectedCategory.description}
              </p>
            )}
            <div className="button-container">
              <Link to="/tous-les-services" className="home-primary-button" aria-label={t('home_page.buttons.book_now')}>
                <span className="icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                {t('home_page.buttons.book_now')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="home-hero-content">
            <h1 className="hero-title fade-in">
              {t('home_page.hero.title', 'Bienvenue')}
            </h1>
            <p className="hero-description fade-in">
              {t('home_page.hero.subtitle', 'Services de nettoyage professionnels')}
            </p>
            <div className="button-container">
              <Link to="/tous-les-services" className="home-primary-button" aria-label={t('home_page.buttons.book_now')}>
                <span className="icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                {t('home_page.buttons.book_now')}
              </Link>
            </div>
          </div>
        )}
      </header>
      <main>
        <section className="home-services" id="nos-services">
          
          <TousLesServices />
        </section>
        <section className="about-us" id="about" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
          <div className="about-container" data-aos="fade-up" data-aos-delay="100" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
            <h2 className="gallery-title" style={{marginBottom: 8, display: 'block', visibility: 'visible', opacity: 1}}>{t('home_page.about.title')}</h2>
            <div className="gallery-description" style={{maxWidth: 820, margin: '0 auto 16px', display: 'block', visibility: 'visible', opacity: 1}}>
              <p className="about-tagline" data-aos="fade-up" data-aos-delay="120" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
                {t('home_page.about.tagline')}
              </p>
              <div style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
                {t('home_page.about.description')}
              </div>
            </div>
            
            <div className="about-highlights" style={{ display: 'grid', visibility: 'visible', opacity: 1 }}>
              <div className="about-card" data-aos="fade-up" data-aos-delay="150" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
                <div className="icon" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>✅</div>
                <h3 style={{ display: 'block', visibility: 'visible', opacity: 1 }}>{t('home_page.about.highlights.guaranteed_quality.title')}</h3>
                <p style={{ display: 'block', visibility: 'visible', opacity: 1 }}>{t('home_page.about.highlights.guaranteed_quality.description')}</p>
              </div>
              <div className="about-card" data-aos="fade-up" data-aos-delay="200" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
                <div className="icon" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>🧪</div>
                <h3 style={{ display: 'block', visibility: 'visible', opacity: 1 }}>{t('home_page.about.highlights.ecological_products.title')}</h3>
                <p style={{ display: 'block', visibility: 'visible', opacity: 1 }}>{t('home_page.about.highlights.ecological_products.description')}</p>
              </div>
              <div className="about-card" data-aos="fade-up" data-aos-delay="250" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
                <div className="icon" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>⏱️</div>
                <h3 style={{ display: 'block', visibility: 'visible', opacity: 1 }}>{t('home_page.about.highlights.rapid_intervention.title')}</h3>
                <p style={{ display: 'block', visibility: 'visible', opacity: 1 }}>{t('home_page.about.highlights.rapid_intervention.description')}</p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="process">
          <p className="process-eyebrow" data-aos="fade-up" data-aos-delay="100">{t('home_page.process.eyebrow')}</p>
          <h2 className="process-title" data-aos="fade-up" data-aos-delay="200">{t('home_page.process.title')}</h2>
          <p className="process-intro" data-aos="fade-up" data-aos-delay="300">
            {t('home_page.process.intro')}
          </p>
          <div className="process-steps">
            <div className="process-step" data-aos="fade-up" data-aos-delay="400">
              <div
                className="step-photo"
                style={{ backgroundImage: `url(${(process.env.PUBLIC_URL || '') + '/galerie/' + encodeURIComponent('حجز عبر الإنترنت.jpeg')})` }}
              />
              <div className="step-number">1</div>
              <h3>{t('home_page.process.steps.step1')}</h3>
            </div>
            <div className="process-step" data-aos="fade-up" data-aos-delay="500">
              <div
                className="step-photo"
                style={{ backgroundImage: `url(${(process.env.PUBLIC_URL || '') + '/galerie/' + encodeURIComponent('مكالمة مع وكالتنا لمزيد من المعلومات.jpeg')})` }}
              />
              <div className="step-number">2</div>
              <h3>{t('home_page.process.steps.step2')}</h3>
            </div>
            <div className="process-step" data-aos="fade-up" data-aos-delay="600">
              <div
                className="step-photo"
                style={{ backgroundImage: `url(${(process.env.PUBLIC_URL || '') + '/galerie/' + encodeURIComponent('استمتع بعرضنا الترويجي.jpeg')})` }}
              />
              <div className="step-number">3</div>
              <h3>{t('home_page.process.steps.step3')}</h3>
            </div>
          </div>
        </section>
        <section className="expertise">
          <h2 className="expertise-title" data-aos="fade-up" data-aos-delay="100">{t('home_page.expertise.title')}</h2>
          <div className="expertise-content">
            <p className="expertise-intro" data-aos="fade-right" data-aos-delay="200">
              {t('home_page.expertise.description')}
            </p>
           
            <div className="expertise-image" data-aos="fade-left" data-aos-delay="300">
              <img 
                src={`${(process.env.PUBLIC_URL || '') + '/galerie/' + encodeURIComponent('خبرتي – نهجنا البيئي.jpeg')}`} 
                alt={t('home_page.expertise.image_alt')}
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </section>
        <section>
          <UserRating />
        </section>
        <section>
          <Contact />
        </section>
      </main>
      
      {/* Floating scroll-to-top button */}
      {showScrollTop && (
        <button
          type="button"
          className="scroll-to-top-home"
          aria-label={t('home_page.buttons.scroll_to_top')}
          onClick={handleScrollToTop}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}



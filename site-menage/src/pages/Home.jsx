import React, { useState, useEffect } from 'react';
import './Home.css';
import Contact from './Contact';
import UserRating from '../components/UserRating';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import TousLesServices from './TousLesServices';


export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Dynamic gallery data
  const [categories, setCategories] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);


  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Index for hero slider
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Gallery slider state
  const [, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Scroll-to-top button state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Ensure component is mounted before rendering dynamic content
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to format category name for Hero section
  const formatCategoryName = (categoryName) => {
    if (!categoryName) return categoryName;
    const locale = i18n.language || 'fr';
    const trimmedName = categoryName.trim();

    // Change 'Ménage' to 'Ménage + Cuisine' in Hero section (French)
    if (locale === 'fr' && (categoryName === 'Ménage' || trimmedName === 'Ménage')) {
      return 'Ménage + Cuisine';
    }

    // Change Arabic cleaning category names to 'التنظيف + الطبخ' in Hero section
    if (locale === 'ar') {
      if (trimmedName.includes('التنظيف') || trimmedName.includes('خدمات التنظيف') ||
        trimmedName.includes('منزل') || trimmedName === 'تنظيف') {
        return 'التنظيف + الطبخ';
      }
    }

    return categoryName;
  };

  // Helper function to fix Arabic category name (replace "حماية" with "الأمن")
  const fixArabicCategoryName = (categoryName, locale) => {
    if (!categoryName || locale !== 'ar') return categoryName;
    // Replace "حماية" with "الأمن" for Arabic language
    if (categoryName.includes('حماية')) {
      return categoryName.replace(/حماية/g, 'الأمن');
    }
    return categoryName;
  };

  // Helper function to sort categories in the specified order
  // Uses slug or database name fields to ensure consistent ordering regardless of language
  // This ensures the order remains the same when language changes
  const sortCategoriesByOrder = (categories) => {
    // Order map based on slug (language-independent) and fallback to name patterns
    // This ensures the order remains consistent when language changes
    const getCategoryOrder = (category) => {
      // Use slug first (most reliable, language-independent)
      const slug = (category.slug || '').toLowerCase().trim();

      // Check slug first (most reliable, language-independent)
      if (slug.includes('menage') || slug.includes('menage-cuisine') || slug.includes('house') || slug.includes('cleaning')) {
        return 1; // Ménage et cuisine
      }
      if (slug.includes('securite') || slug.includes('security') || slug.includes('sécurité')) {
        return 2; // Sécurité
      }
      if (slug.includes('bebe') || slug.includes('bébé') || slug.includes('baby')) {
        return 3; // Bébé Setting
      }
      if (slug.includes('jardinage') || slug.includes('gardening')) {
        return 4; // Jardinage
      }
      if (slug.includes('travaux') || slug.includes('manuels') || slug.includes('hand') || slug.includes('worker')) {
        return 5; // Travaux Manuels
      }
      if (slug.includes('chauffeur') || slug.includes('driver')) {
        return 6; // Chauffeur
      }

      // Fallback to database name fields (not localized name)
      // Use original database fields to avoid language-dependent sorting
      const nameFr = ((category.name_fr || '') + '').toLowerCase().trim();
      const nameEn = ((category.name_en || '') + '').toLowerCase().trim();
      const nameAr = ((category.name_ar || '') + '').toLowerCase().trim();
      const allNames = [nameFr, nameEn, nameAr].join(' ');

      if (allNames.includes('menage') || allNames.includes('house') || allNames.includes('cleaning') ||
        allNames.includes('تنظيف') || allNames.includes('منزل')) {
        return 1; // Ménage et cuisine
      }
      if (allNames.includes('sécurité') || allNames.includes('security') ||
        allNames.includes('أمن') || allNames.includes('الأمن')) {
        return 2; // Sécurité
      }
      if (allNames.includes('bébé') || allNames.includes('bebe') || allNames.includes('baby') ||
        allNames.includes('طفل') || allNames.includes('رعاية') || allNames.includes('أطفال')) {
        return 3; // Bébé Setting
      }
      if (allNames.includes('jardinage') || allNames.includes('gardening') ||
        allNames.includes('تنسيق') || allNames.includes('الحدائق')) {
        return 4; // Jardinage
      }
      if (allNames.includes('travaux') || allNames.includes('manuels') ||
        allNames.includes('hand') || allNames.includes('worker') ||
        allNames.includes('أعمال') || allNames.includes('يدوية')) {
        return 5; // Travaux Manuels
      }
      if (allNames.includes('chauffeur') || allNames.includes('driver') ||
        allNames.includes('سائق') || allNames.includes('السائق')) {
        return 6; // Chauffeur
      }

      // Use order field from database if available, otherwise default to end
      return category.order !== undefined && category.order !== null ? category.order + 100 : 999;
    };

    return [...categories].sort((a, b) => {
      const orderA = getCategoryOrder(a);
      const orderB = getCategoryOrder(b);

      // If same order, use database order field or maintain original order
      if (orderA === orderB) {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // If no order field, maintain original order by ID
        return (a.id || 0) - (b.id || 0);
      }

      return orderA - orderB;
    });
  };

  // Helper function to get category path based on category name
  const getCategoryPath = (categoryName) => {
    if (!categoryName) return '/';

    const nameLower = categoryName.toLowerCase().trim();
    const nameOriginal = categoryName.trim();

    // Map category names to their corresponding routes
    // Ménage / Cleaning / التنظيف
    if (nameLower.includes('ménage') || nameLower.includes('menage') ||
      nameLower.includes('house') || nameOriginal.includes('تنظيف') ||
      nameOriginal.includes('منزل')) {
      return '/menage-et-cuisine';
    }
    // Sécurité / Security / الأمن
    if (nameLower.includes('sécurité') || nameLower.includes('security') ||
      nameOriginal.includes('أمن') || nameOriginal.includes('الأمن')) {
      return '/security';
    }
    // Bébé / Baby / رعاية الأطفال
    if (nameLower.includes('bébé') || nameLower.includes('bebe') ||
      nameLower.includes('child') || nameOriginal.includes('طفل') ||
      nameOriginal.includes('رعاية') || nameOriginal.includes('أطفال')) {
      return '/bebe-setting';
    }
    // Jardinage / Gardening / البستنة
    if (nameLower.includes('jardinage') || nameLower.includes('gardening') ||
      nameOriginal.includes('تنسيق') || nameOriginal.includes('الحدائق')) {
      return '/jardinage';
    }
    // Travaux manuels / Hand workers / الأعمال اليدوية
    if (nameLower.includes('travaux') || nameLower.includes('manuels') ||
      nameLower.includes('main') || nameLower.includes('hand') ||
      nameLower.includes('worker') || nameOriginal.includes('أعمال') ||
      nameOriginal.includes('يدوية') || nameOriginal.includes('الأعمال اليدوية')) {
      return '/hand-workers';
    }
    // Chauffeur / Driver / سائق
    if (nameLower.includes('chauffeur') || nameLower.includes('driver') ||
      nameOriginal.includes('سائق') || nameOriginal.includes('السائق')) {
      return '/driver';
    }

    // Default fallback
    return '/';
  };

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
          // First, sort categories by their stable identifiers (slug/order) BEFORE mapping names
          // This ensures the order remains consistent regardless of language
          const preSortedCategories = sortCategoriesByOrder(categoriesData);

          // Then map categories with localized names (order is already fixed)
          const mappedCategories = preSortedCategories.map(cat => {
            let categoryName = cat[`name_${locale}`] || cat.name || cat.name_fr || '';
            categoryName = fixArabicCategoryName(categoryName, locale);

            return {
              ...cat,
              name: categoryName,
              description: cat[`description_${locale}`] || cat.description || cat.description_fr || ''
            };
          });

          // Categories are already sorted, just set them
          setCategories(mappedCategories);

          // Select first category by default
          if (mappedCategories.length > 0 && !selectedCategory) {
            setSelectedCategory(mappedCategories[0]);
          }
        }

        // Load all active gallery images from Supabase for slider
        const { data: imagesData, error: imagesError } = await supabase
          .from('gallery')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!isMounted) return;

        if (imagesError) {
          console.error('Error loading gallery images:', imagesError);
        } else if (imagesData) {
          // Map images with proper URLs
          const mappedImages = imagesData.map(img => ({
            ...img,
            image_url: getImageUrl(img.image_path || img.image_url)
          })).filter(img => img.image_url); // Filter out images without valid URLs
          setGalleryImages(mappedImages);
          console.log('[Home] Loaded', mappedImages.length, 'active gallery images for slider');
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
  }, [i18n.language, getImageUrl, selectedCategory]);

  // Update selectedCategory when language changes to reflect localized names
  useEffect(() => {
    if (!selectedCategory || categories.length === 0) return;

    // Find the updated category with the same ID in the new categories array
    const updatedCategory = categories.find(cat => cat.id === selectedCategory.id);

    if (updatedCategory) {
      // Check if name or description changed (language change)
      const nameChanged = updatedCategory.name !== selectedCategory.name;
      const descriptionChanged = updatedCategory.description !== selectedCategory.description;

      if (nameChanged || descriptionChanged) {
        // Update selectedCategory with new localized name/description while preserving other properties
        // Use functional update to avoid unnecessary re-renders
        setSelectedCategory(prevCategory => {
          // Only update if there's an actual change to avoid infinite loops
          if (prevCategory.name === updatedCategory.name &&
            prevCategory.description === updatedCategory.description) {
            return prevCategory;
          }
          return {
            ...prevCategory,
            name: updatedCategory.name,
            description: updatedCategory.description
          };
        });
      }
    }
  }, [i18n.language, categories, selectedCategory, selectedCategory?.id]);



  // --- SAFE SLIDER LOGIC ---

  // Track if the user is hovering/interacting to pause slider
  const [isPaused, setIsPaused] = useState(false);

  // Combine images into a single stable list for the slider
  const sliderImages = React.useMemo(() => {
    if (!galleryImages.length) return [];

    // Sort categories to get stable order
    const sortedCategories = sortCategoriesByOrder(categories);
    const organizedImages = [];

    // Add images by category order
    sortedCategories.forEach(category => {
      const categoryImgs = galleryImages.filter(img =>
        img.category_gallery_id === category.id && img.image_url
      );
      organizedImages.push(...categoryImgs);
    });

    // Add remaining images
    const remainingImages = galleryImages.filter(img =>
      !organizedImages.some(org => org.id === img.id) && img.image_url
    );

    return [...organizedImages, ...remainingImages];
  }, [galleryImages, categories]);

  // Derive current image from index - Source of Truth
  // If index is out of bounds, fallback to 0
  const activeImage = sliderImages[currentImageIndex] || sliderImages[0];

  // Auto-slide effect
  useEffect(() => {
    // Don't slide if paused, not mounted, or not enough images
    if (isPaused || !mounted || sliderImages.length <= 1) return;

    console.log('[Home] Slider: Interval started');
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => {
        const next = (prev + 1) % sliderImages.length;
        console.log('[Home] Slider: Tick ->', next);
        return next;
      });
    }, 4000); // 4 seconds for better readability

    return () => clearInterval(interval);
  }, [sliderImages.length, isPaused, mounted]);

  // Sync Selected Category with Active Image
  // This is a "reaction" to the slide change, separate from the tick
  useEffect(() => {
    if (!activeImage || !categories.length || !activeImage.category_gallery_id) return;

    // Only update if strictly different to prevent loops
    if (selectedCategory?.id !== activeImage.category_gallery_id) {
      const matchedCat = categories.find(c => c.id === activeImage.category_gallery_id);
      if (matchedCat) {
        setSelectedCategory(matchedCat);
      }
    }
  }, [activeImage, categories, selectedCategory?.id]);



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

  // Auto-rotate through categories - DISABLED: Now buttons navigate to pages instead of changing images
  // useEffect(() => {
  //   if (!isPlaying || categories.length === 0 || isTransitioning) return;
  //   
  //   const interval = setInterval(() => {
  //     const currentIndex = categories.findIndex(cat => cat.id === selectedCategory?.id);
  //     const nextIndex = (currentIndex + 1) % categories.length;
  //     const nextCategory = categories[nextIndex];
  //     
  //     if (nextCategory) {
  //       handleCategorySelect(nextCategory);
  //     }
  //   }, 5000); // Change every 5 seconds

  //   return () => clearInterval(interval);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [categories.length, selectedCategory?.id, isPlaying, isTransitioning]);

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
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
        {/* Animated Background - Stable Structure */}
        <div className="hero-background">
          {loading ? (
            <div className="background-image" style={{ background: '#1e293b' }} />
          ) : activeImage && activeImage.image_url ? (
            <div
              key={currentImageIndex} /* Unstable keys on the parent can cause crashes, keep it simple */
              className="background-image fade-in"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${activeImage.image_url})`
              }}
            />
          ) : (
            <div className="background-image" style={{ background: '#1e293b' }} />
          )}
        </div>

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
            {categories.map((category) => {
              const displayName = formatCategoryName(category.name);
              const categoryPath = getCategoryPath(category.name);
              const isChauffeur = category.name?.toLowerCase().includes('chauffeur') ||
                category.name?.toLowerCase().includes('driver') ||
                category.name?.includes('سائق');

              // For Chauffeur button, use onClick to navigate to /driver
              if (isChauffeur) {
                return (
                  <button
                    key={category.id}
                    onClick={() => navigate('/driver')}
                    className={`service-button category-button ${selectedCategory?.id === category.id ? 'active' : ''}`}
                    title={displayName}
                    aria-label={displayName}
                  >
                    <span className="service-label">{displayName}</span>
                  </button>
                );
              }

              // For other categories, use Link
              return (
                <Link
                  key={category.id}
                  to={categoryPath}
                  className={`service-button category-button ${selectedCategory?.id === category.id ? 'active' : ''}`}
                  title={displayName}
                  aria-label={displayName}
                >
                  <span className="service-label">{displayName}</span>
                </Link>
              );
            })}
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
        ) : selectedCategory && activeImage ? (
          <div className="home-hero-content">
            <h1 key={`title-${selectedCategory.id}`} className="hero-title fade-in">
              {formatCategoryName(selectedCategory.name)}
            </h1>

            <div className="button-container">
              <Link to="/tous-les-services" className="home-primary-button" aria-label={t('home_page.buttons.book_now')}>
                <span className="icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
        <section className="about-us" id="about">
          {/* Section À propos simplifiée pour éviter tout blocage de scroll */}
          <div className="about-container">
            <h2 className="gallery-title" style={{ marginBottom: 8 }}>{t('home_page.about.title')}</h2>
            <div className="gallery-description" style={{ maxWidth: 820, margin: '0 auto 16px' }}>
              <p className="about-tagline">
                {t('home_page.about.tagline')}
              </p>
              <div>
                {t('home_page.about.description')}
              </div>
            </div>

            <div className="about-highlights">
              <div className="about-card">
                <div className="icon">✅</div>
                <h3>{t('home_page.about.highlights.guaranteed_quality.title')}</h3>
                <p>{t('home_page.about.highlights.guaranteed_quality.description')}</p>
              </div>
              <div className="about-card">
                <div className="icon">🧪</div>
                <h3>{t('home_page.about.highlights.ecological_products.title')}</h3>
                <p>{t('home_page.about.highlights.ecological_products.description')}</p>
              </div>
              <div className="about-card">
                <div className="icon">⏱️</div>
                <h3>{t('home_page.about.highlights.rapid_intervention.title')}</h3>
                <p>{t('home_page.about.highlights.rapid_intervention.description')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="process">
          {/* Removed AOS animations here to éviter les micro-blocages de scroll sur certaines machines */}
          <p className="process-eyebrow">{t('home_page.process.eyebrow')}</p>
          <h2 className="process-title">{t('home_page.process.title')}</h2>
          <p className="process-intro">
            {t('home_page.process.intro')}
          </p>
          <div className="process-steps">
            <div className="process-step">
              <div
                className="step-photo"
                style={{ backgroundImage: `url(${(process.env.PUBLIC_URL || '') + '/galerie/' + encodeURIComponent('حجز عبر الإنترنت.jpeg')})` }}
              />
              <div className="step-number">1</div>
              <h3>{t('home_page.process.steps.step1')}</h3>
            </div>
            <div className="process-step">
              <div
                className="step-photo"
                style={{ backgroundImage: `url(${(process.env.PUBLIC_URL || '') + '/galerie/' + encodeURIComponent('مكالمة مع وكالتنا لمزيد من المعلومات.jpeg')})` }}
              />
              <div className="step-number">2</div>
              <h3>{t('home_page.process.steps.step2')}</h3>
            </div>
            <div className="process-step">
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
            <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}



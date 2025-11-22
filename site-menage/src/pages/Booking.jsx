import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { postContact, getServices, getTypes, getTypeById, getServiceById, createReservation, getCategoryHouseById, getTypeOptions } from '../api-supabase';
import PromoCode from '../components/PromoCode';
import getServiceIcon from '../utils/serviceIcons';
import './Booking.css';

export default function Booking() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get type ID from URL if route is /reservation/:id
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [bgUrl, setBgUrl] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedService, setSelectedService] = useState('');
  const [showSizeField, setShowSizeField] = useState(false);
  const [sizeValue, setSizeValue] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [typeValue, setTypeValue] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [types, setTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typeError, setTypeError] = useState('');
  const [serviceAutoFillError, setServiceAutoFillError] = useState('');
  const [promo, setPromo] = useState(null); // { code, discount }
  const [extraServices, setExtraServices] = useState([]); // [{title, size, type, details, estimate}]
  const [selectedCategory, setSelectedCategory] = useState(null); // Category House information
  const [selectedTypes, setSelectedTypes] = useState([]); // Selected types from Ménage + cuisine
  const [choixtypeId, setChoixtypeId] = useState(null); // Selected TypeOption ID for Asian Cuisine
  const [typeOptions, setTypeOptions] = useState([]); // TypeOptions for Asian Cuisine
  const [selectedTypeOption, setSelectedTypeOption] = useState(null); // Selected TypeOption
  const [loadingTypeOptions, setLoadingTypeOptions] = useState(false);
  const [messageValue, setMessageValue] = useState(''); // Track message value to detect changes
  const locationRef = useRef(null);
  const serviceSelectRef = useRef(null);
  const messageRef = useRef(null);

  // Check if selected category is Cuisine
  const isCuisineCategory = selectedCategory && (
    selectedCategory.name_fr === 'Cuisine' ||
    selectedCategory.name_en === 'Kitchen' ||
    selectedCategory.name_ar === 'مطبخ'
  );

  // Check if message contains "Catégorie: غسيل" or "Catégorie: كيّ"
  const isWashingOrIroningFromMessage = (() => {
    const message = messageValue || (messageRef.current?.value || '');
    if (!message) return false;
    
    // Check for exact patterns: "Catégorie: غسيل" or "Catégorie: كيّ"
    // Also check for variations with different spacing and case
    const washingPatterns = [
      /catégorie:\s*غسيل/i,
      /catégorie:\s*الغسيل/i,
      /catégorie:\s*غسيل/i,
      /catégorie:\s*lavage/i,
      /category:\s*غسيل/i,
      /category:\s*الغسيل/i,
      /category:\s*washing/i
    ];
    
    const ironingPatterns = [
      /catégorie:\s*كيّ/i,
      /catégorie:\s*الكي/i,
      /catégorie:\s*كي/i,
      /catégorie:\s*repassage/i,
      /category:\s*كيّ/i,
      /category:\s*الكي/i,
      /category:\s*ironing/i
    ];
    
    // Check if message contains any washing pattern
    const hasWashing = washingPatterns.some(pattern => pattern.test(message));
    
    // Check if message contains any ironing pattern
    const hasIroning = ironingPatterns.some(pattern => pattern.test(message));
    
    // Also check for Arabic text with "Catégorie:" prefix
    if (!hasWashing && !hasIroning) {
      // More flexible check: if message contains "Catégorie:" followed by Arabic washing/ironing text
      const categoryMatch = /catégorie:\s*([^\n,]+)/i.exec(message);
      if (categoryMatch) {
        const categoryValue = categoryMatch[1].trim();
        if (categoryValue.includes('غسيل') || categoryValue.includes('الغسيل')) {
          return true;
        }
        if (categoryValue.includes('كيّ') || categoryValue.includes('كي') || categoryValue.includes('الكي')) {
          return true;
        }
      }
    }
    
    return hasWashing || hasIroning;
  })();

  // Check if selected category is Asian Cuisine
  const isAsianCuisineCategory = selectedCategory && (
    selectedCategory.name_fr === 'Cuisine Asiatique' ||
    selectedCategory.name_en === 'Asian Cuisine' ||
    selectedCategory.name_ar === 'المطبخ الآسيوي' ||
    selectedCategory.name === 'Cuisine Asiatique' ||
    selectedCategory.name === 'Asian Cuisine' ||
    selectedCategory.name === 'المطبخ الآسيوي' ||
    (selectedCategory.name_fr && selectedCategory.name_fr.toLowerCase().includes('asiatique')) ||
    (selectedCategory.name_en && selectedCategory.name_en.toLowerCase().includes('asian')) ||
    (selectedCategory.name_ar && selectedCategory.name_ar.includes('آسيوي'))
  );

  // Check if current type is a cuisine type (legacy check)
  const isCuisineType = ['Italienne', 'Marocaine', 'Française', 'Arabe du Golfe'].includes(typeValue);

  // Check if selected service is one of the services that should hide size and type fields
  // Services to hide fields for:
  // 1. السجاد والأرائك / Carpets and Sofas / Tapis et Canapés
  // 2. الغسيل والكي / Washing and Ironing / Lavage et Repassage
  // 3. تنظيف السيارات / Car Cleaning / Nettoyage de voiture
  const hideFields = (() => {
    if (!selectedService) return false;
    
    const serviceLower = selectedService.toLowerCase().trim();
    
    const hideServices = [
      // Arabic names
      'السجاد والأرائك',
      'السجاد والارائك',
      'تنظيف السجاد',
      'تنظيف الأرائك',
      'الغسيل والكي',
      'تنظيف السيارات',
      'غسيل السيارات',
      // French names
      'tapis et canapés',
      'tapis et canapes',
      'nettoyage de tapis',
      'nettoyage de canapés',
      'nettoyage de canapes',
      'lavage et repassage',
      'nettoyage de voiture',
      'lavage de voiture',
      // English names
      'carpets and sofas',
      'carpet and sofa',
      'carpet cleaning',
      'sofa cleaning',
      'washing and ironing',
      'car cleaning',
      'car wash',
      // Common variations
      'nettoyage canapé',
      'nettoyage canape',
      'repassage',
      'ironing',
      'washing',
      'lavage'
    ];
    
    return hideServices.some(hideService => 
      serviceLower.includes(hideService.toLowerCase()) ||
      hideService.toLowerCase().includes(serviceLower)
    );
  })();

  // Load category house when type is selected
  useEffect(() => {
    const loadCategoryFromType = async () => {
      if (!selectedTypeId) {
        setSelectedCategory(null);
        return;
      }

      try {
        const typeData = await getTypeById(selectedTypeId, i18n.language);
        const type = typeData.data || typeData;
        
        if (type && type.category_house_id) {
          // Load category house information
          const categoryData = await getCategoryHouseById(type.category_house_id, i18n.language);
          const category = categoryData.data || categoryData;
          if (category) {
            setSelectedCategory(category);
            console.log('Loaded category:', category);
            console.log('Category name_fr:', category.name_fr);
            console.log('Category name_ar:', category.name_ar);
            console.log('Category name_en:', category.name_en);
            console.log('Category name:', category.name);
            
            // Auto-fill surface size from prefill if category is NOT Cuisine
            const isCuisine = (
              category.name_fr === 'Cuisine' ||
              category.name_en === 'Kitchen' ||
              category.name_ar === 'مطبخ'
            );
            
            if (!isCuisine) {
              // Try to get surface from prefill data (stored in pending_surface_value or from location.state)
              try {
                // Check location.state first (from TypeDetails navigation)
                let surfaceValue = null;
                if (location.state?.prefill?.surface) {
                  surfaceValue = location.state.prefill.surface.toString();
                } else {
                  // Check localStorage for pending surface value
                  const pendingSurface = localStorage.getItem('pending_surface_value');
                  if (pendingSurface) {
                    surfaceValue = pendingSurface;
                    localStorage.removeItem('pending_surface_value'); // Clean up after use
                  }
                }
                
                if (surfaceValue) {
                  setSizeValue(surfaceValue);
                  setShowSizeField(true);
                }
              } catch (err) {
                console.warn('Error reading prefill for surface:', err);
              }
            } else {
              // Hide surface field for Cuisine
              setShowSizeField(false);
              setSizeValue('');
              setCalculatedPrice(0);
            }
          } else {
            setSelectedCategory(null);
          }
        } else {
          setSelectedCategory(null);
        }
      } catch (error) {
        console.error('Error loading category from type:', error);
        setSelectedCategory(null);
      }
    };

    if (selectedTypeId) {
      loadCategoryFromType();
    } else {
      setSelectedCategory(null);
    }
  }, [selectedTypeId, i18n.language, location]);

  // Load TypeOptions for Asian Cuisine
  useEffect(() => {
    const loadTypeOptions = async () => {
      // Check if it's Asian Cuisine category
      const isAsian = selectedCategory && (
        selectedCategory.name_fr === 'Cuisine Asiatique' ||
        selectedCategory.name_en === 'Asian Cuisine' ||
        selectedCategory.name_ar === 'المطبخ الآسيوي' ||
        selectedCategory.name === 'Cuisine Asiatique' ||
        selectedCategory.name === 'Asian Cuisine' ||
        selectedCategory.name === 'المطبخ الآسيوي' ||
        (selectedCategory.name_fr && selectedCategory.name_fr.toLowerCase().includes('asiatique')) ||
        (selectedCategory.name_en && selectedCategory.name_en.toLowerCase().includes('asian')) ||
        (selectedCategory.name_ar && selectedCategory.name_ar.includes('آسيوي'))
      );

      console.log('Loading TypeOptions - selectedCategory:', selectedCategory);
      console.log('Loading TypeOptions - isAsian:', isAsian);
      console.log('Loading TypeOptions - selectedTypeId:', selectedTypeId);

      if (!selectedTypeId || !isAsian) {
        setTypeOptions([]);
        setSelectedTypeOption(null);
        // Don't reset choixtypeId here as it might be from prefill
        return;
      }

        try {
          setLoadingTypeOptions(true);
          const options = await getTypeOptions(selectedTypeId, i18n.language);
          const optionsArray = options.data || options || [];
          setTypeOptions(optionsArray);
          console.log('Loaded TypeOptions:', optionsArray);
          
          // If choixtypeId is set from prefill, find and select the option
          // Check localStorage for prefill choixtype_id
          const prefillData = localStorage.getItem('booking_prefill');
          let prefillChoixtypeId = choixtypeId;
          if (prefillData) {
            try {
              const prefill = JSON.parse(prefillData);
              if (prefill?.choixtype_id) {
                prefillChoixtypeId = prefill.choixtype_id;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
          
          if (prefillChoixtypeId && optionsArray.length > 0) {
            const prefillOption = optionsArray.find(opt => opt.id === prefillChoixtypeId);
            if (prefillOption) {
              setSelectedTypeOption(prefillOption);
              setChoixtypeId(prefillChoixtypeId);
            }
          }
        } catch (error) {
          console.error('Error loading type options:', error);
          setTypeOptions([]);
        } finally {
          setLoadingTypeOptions(false);
        }
    };

    loadTypeOptions();
  }, [selectedTypeId, selectedCategory, i18n.language]);

  // Handle TypeOption selection
  const handleTypeOptionSelect = (option) => {
    setSelectedTypeOption(option);
    setChoixtypeId(option.id);
  };

  // Load service when type is selected
  useEffect(() => {
    const loadServiceFromType = async () => {
      if (!selectedTypeId) {
        setServiceAutoFillError('');
        return;
      }

      // Don't auto-fill if service is already manually selected OR if we have a pending service from prefill
      // Check if there's a pending service that should take priority
      const hasPendingService = localStorage.getItem('pending_service_selection') || 
                                location.state?.prefill?.serviceTitle ||
                                (() => {
                                  try {
                                    const prefill = JSON.parse(localStorage.getItem('booking_prefill') || '{}');
                                    return prefill?.serviceTitle;
                                  } catch {
                                    return null;
                                  }
                                })();
      
      // If service is already selected and we don't have a pending service from prefill, don't override
      if (selectedService && !hasPendingService) {
        return;
      }
      
      // If we have a pending service from prefill, don't override it with type-based service
      // The pending service will be handled by the other useEffect
      if (hasPendingService) {
        return;
      }

      try {
        setServiceAutoFillError('');
        const typeData = await getTypeById(selectedTypeId, i18n.language);
        const type = typeData.data || typeData;
        
        if (!type) {
          setServiceAutoFillError(t('booking.service_not_found', 'Type non trouvé'));
          return;
        }

        if (!type.service_id) {
          setServiceAutoFillError(t('booking.no_service_for_type', 'Aucun service associé à ce type'));
          return;
        }

        // Get service by ID
        const serviceData = await getServiceById(type.service_id, i18n.language);
        const service = serviceData.data || serviceData;
        
        if (!service) {
          setServiceAutoFillError(t('booking.service_not_found', 'Service non trouvé'));
          return;
        }

        // Find and set the service in the services list
        // Use name first (translated), then fallback to title
        const serviceTitle = service.name || service.title || '';
        if (serviceTitle) {
          // Check if service exists in loaded services
          // Match by ID first, then by name (translated) or title
          const existingService = services.find(s => {
            if (s.id === type.service_id) return true;
            const sName = (s.name || '').toLowerCase().trim();
            const sTitle = (s.title || '').toLowerCase().trim();
            const target = serviceTitle.toLowerCase().trim();
            return sName === target || sTitle === target;
          });

          if (existingService) {
            // Use name first (translated), then fallback to title
            const finalTitle = existingService.name || existingService.title;
            setSelectedService(finalTitle);
            setShowSizeField(true);
            setServiceAutoFillError('');
          } else {
            // If service is not in the list, try to add it or show error
            setServiceAutoFillError(t('booking.service_not_in_list', 'Le service associé n\'est pas disponible dans la liste'));
          }
        }
      } catch (error) {
        console.error('Error loading service from type:', error);
        setServiceAutoFillError(t('booking.error_loading_service', 'Erreur lors du chargement du service'));
      }
    };

    if (selectedTypeId && services.length > 0 && !selectedService) {
      loadServiceFromType();
    }
  }, [selectedTypeId, services, i18n.language, selectedService]);

  useEffect(() => {
    loadServices();
    loadTypes();
    // Enable fade-in on mount
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, [i18n.language]);

  // Auto-fill user data (firstname and email) from localStorage on page load
  useEffect(() => {
    // Use setTimeout to ensure React has rendered the form fields
    const timeoutId = setTimeout(() => {
      try {
        // Get user data from localStorage
        const userDataStr = localStorage.getItem('user_data') || localStorage.getItem('user');
        const rememberedEmail = localStorage.getItem('remembered_email');
        
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            
            // Fill firstname field if available and not already filled
            const firstnameInput = document.getElementById('firstname');
            if (firstnameInput && userData.name) {
              // Only fill if the field is empty
              if (!firstnameInput.value || firstnameInput.value.trim() === '') {
                // Extract first name from full name (take first word)
                const firstName = userData.name.split(' ')[0] || userData.name;
                firstnameInput.value = firstName;
              }
            }
            
            // Fill email field if available and not already filled
            const emailInput = document.getElementById('email');
            if (emailInput && userData.email) {
              // Only fill if the field is empty
              if (!emailInput.value || emailInput.value.trim() === '') {
                emailInput.value = userData.email;
              }
            }
          } catch (parseError) {
            console.warn('Error parsing user data:', parseError);
          }
        }
        
        // If no user_data but remembered_email exists, fill email field
        if (rememberedEmail) {
          const emailInput = document.getElementById('email');
          if (emailInput) {
            // Only fill if the field is empty
            if (!emailInput.value || emailInput.value.trim() === '') {
              emailInput.value = rememberedEmail;
            }
          }
        }
      } catch (error) {
        console.warn('Error loading user data for auto-fill:', error);
      }
    }, 100); // Small delay to ensure DOM is ready
    
    return () => clearTimeout(timeoutId);
  }, []); // Run only once on mount

  // Choose best-quality background and optimize behavior per device
  useEffect(() => {
    try {
      setIsMobile(window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    } catch {}

    const base = process.env.PUBLIC_URL || '';
    const webp = `${base}/galerie/reservation.webp`;
    const jpg = `${base}/galerie/reservation.jpg`;

    const probe = new Image();
    probe.onload = () => {
      setBgUrl(webp);
      const pre = new Image();
      pre.src = webp;
    };
    probe.onerror = () => {
      setBgUrl(jpg);
      const pre = new Image();
      pre.src = jpg;
    };
    probe.src = webp;

    return () => {
      // no-op cleanup
    };
  }, []);

  // Handle pending service selection after services are loaded
  // This should run BEFORE loadServiceFromType to ensure prefill services take priority
  useEffect(() => {
    if (services.length > 0 && selectedService === '') {
      // Priority order: location.state > booking_prefill > pending_service_selection
      let serviceToSelect = null;
      let source = '';
      
      // 1. Check location.state first (highest priority)
      if (location.state?.prefill?.serviceTitle) {
        serviceToSelect = location.state.prefill.serviceTitle;
        source = 'location.state';
        console.log('📌 Service from location.state:', serviceToSelect);
      }
      // 2. Check booking_prefill from localStorage (this is the main source from Services.jsx)
      else {
        try {
          const prefillData = localStorage.getItem('booking_prefill');
          if (prefillData) {
            const prefill = JSON.parse(prefillData);
            if (prefill?.serviceTitle) {
              serviceToSelect = prefill.serviceTitle;
              source = 'booking_prefill';
              console.log('📌 Service from booking_prefill:', serviceToSelect);
            }
          }
        } catch (e) {
          console.warn('Error reading booking_prefill:', e);
        }
      }
      
      // 3. Fallback to pending_service_selection (backup from other sources)
      if (!serviceToSelect) {
        const pendingService = localStorage.getItem('pending_service_selection');
        if (pendingService) {
          serviceToSelect = pendingService;
          source = 'pending_service_selection';
          console.log('📌 Service from pending_service_selection:', serviceToSelect);
        }
      }
      
      if (serviceToSelect) {
        // Try to match the service title with loaded services
        // Use more precise matching to avoid false positives
        const target = serviceToSelect.toLowerCase().trim();
        const targetClean = target.replace(/^[🧹🧼🧽🧺🪟👕🛋️🏠🏢]\s*/, '').trim();
        
        // First, try exact matches (highest priority)
        let matchedService = services.find(s => {
          const serviceName = (s.name || '').toLowerCase().trim();
          const serviceTitle = (s.title || '').toLowerCase().trim();
          
          // Exact match
          if (serviceName === target || serviceTitle === target) {
            return true;
          }
          
          // Exact match without emoji
          const serviceNameClean = serviceName.replace(/^[🧹🧼🧽🧺🪟👕🛋️🏠🏢]\s*/, '').trim();
          const serviceTitleClean = serviceTitle.replace(/^[🧹🧼🧽🧺🪟👕🛋️🏠🏢]\s*/, '').trim();
          
          if (serviceNameClean === targetClean || serviceTitleClean === targetClean) {
            return true;
          }
          
          return false;
        });
        
        // If no exact match, try partial match but be VERY strict to avoid false positives
        if (!matchedService) {
          // Only try partial match if target is a complete phrase (contains spaces or is a known service name)
          const isCompletePhrase = targetClean.includes(' ') || targetClean.length > 8;
          
          if (isCompletePhrase) {
            matchedService = services.find(s => {
              const serviceName = (s.name || '').toLowerCase().trim();
              const serviceTitle = (s.title || '').toLowerCase().trim();
              const serviceNameClean = serviceName.replace(/^[🧹🧼🧽🧺🪟👕🛋️🏠🏢]\s*/, '').trim();
              const serviceTitleClean = serviceTitle.replace(/^[🧹🧼🧽🧺🪟👕🛋️🏠🏢]\s*/, '').trim();
              
              // For partial match, the target must be a significant part (at least 50% of the service name)
              // AND the service name must contain the full target as a distinct phrase
              const targetWords = targetClean.split(/\s+/).filter(w => w.length > 2);
              
              if (targetWords.length === 0) return false;
              
              // Check if ALL target words are present in the service name
              const allWordsMatch = targetWords.every(word => 
                serviceNameClean.includes(word) || serviceTitleClean.includes(word)
              );
              
              if (!allWordsMatch) return false;
              
              // Additional check: the match should be significant (not just one common word)
              // For example, "الغسيل والكي" contains "الغسيل" and "الكي" - both should be in service name
              // But "التنظيف المنزلي" should NOT match "الغسيل والكي"
              
              // Check if service name starts with target or contains it as a complete phrase
              const startsWithTarget = serviceNameClean.startsWith(targetClean) || serviceTitleClean.startsWith(targetClean);
              const containsAsPhrase = serviceNameClean.includes(' ' + targetClean) || 
                                      serviceTitleClean.includes(' ' + targetClean) ||
                                      serviceNameClean.includes(targetClean + ' ') ||
                                      serviceTitleClean.includes(targetClean + ' ');
              
              // Also check reverse: if service name is contained in target (for cases like "Lavage et Repassage" matching "Lavage")
              const serviceInTarget = targetClean.includes(serviceNameClean) || targetClean.includes(serviceTitleClean);
              
              // Only match if it's a clear, unambiguous match
              if (startsWithTarget || containsAsPhrase || (serviceInTarget && targetWords.length <= 2)) {
                return true;
              }
              
              return false;
            });
          }
        }
        
        // If still no match, try keyword-based matching for known service patterns
        if (!matchedService) {
          // Define service keywords mapping
          const serviceKeywords = {
            // Arabic keywords
            'الغسيل والكي': ['lavage', 'repassage', 'washing', 'ironing', 'laundry', 'linge'],
            'غسيل': ['lavage', 'washing', 'laundry'],
            'كي': ['repassage', 'ironing'],
            'تنظيف السيارات': ['voiture', 'car', 'automobile', 'vehicle'],
            'السجاد والأرائك': ['tapis', 'canapé', 'canape', 'carpet', 'sofa', 'sofas'],
            'التنظيف المنزلي': ['ménage', 'menage', 'domicile', 'home', 'housekeeping'],
            'تنظيف المكاتب': ['bureau', 'bureaux', 'office', 'offices'],
            'تنظيف المصانع': ['usine', 'factory', 'industrial'],
            'تنظيف المسابح': ['piscine', 'pool', 'swimming'],
            'تنظيف airbnb': ['airbnb', 'check-in', 'check-out', 'checkin', 'checkout'],
            // French keywords
            'lavage et repassage': ['lavage', 'repassage', 'washing', 'ironing', 'laundry'],
            'nettoyage de voiture': ['voiture', 'car', 'automobile'],
            'tapis et canapés': ['tapis', 'canapé', 'carpet', 'sofa'],
            'ménage à domicile': ['ménage', 'menage', 'domicile', 'home'],
            // English keywords
            'washing and ironing': ['lavage', 'repassage', 'washing', 'ironing', 'laundry'],
            'car cleaning': ['voiture', 'car', 'automobile'],
            'carpets and sofas': ['tapis', 'canapé', 'carpet', 'sofa'],
            'housekeeping': ['ménage', 'menage', 'domicile', 'home']
          };
          
          // Find matching keywords
          const targetLower = targetClean.toLowerCase();
          const matchingKeywords = Object.keys(serviceKeywords).find(key => {
            const keyLower = key.toLowerCase();
            return targetLower.includes(keyLower) || keyLower.includes(targetLower);
          });
          
          if (matchingKeywords && serviceKeywords[matchingKeywords]) {
            // Search for service that contains any of the keywords
            matchedService = services.find(s => {
              const serviceName = (s.name || '').toLowerCase();
              const serviceTitle = (s.title || '').toLowerCase();
              const serviceText = serviceName + ' ' + serviceTitle;
              
              return serviceKeywords[matchingKeywords].some(keyword => 
                serviceText.includes(keyword.toLowerCase())
              );
            });
            
            if (matchedService) {
              console.log('🔑 Service matched by keywords:', matchingKeywords, '→', matchedService.name || matchedService.title);
            }
          }
        }
        
        // If still no match, log all available services for debugging
        if (!matchedService) {
          console.log('🔍 Service matching debug:', {
            target: serviceToSelect,
            targetClean: targetClean,
            availableServices: services.map(s => ({
              name: s.name,
              title: s.title,
              nameClean: (s.name || '').toLowerCase().trim().replace(/^[🧹🧼🧽🧺🪟👕🛋️🏠🏢]\s*/, ''),
              titleClean: (s.title || '').toLowerCase().trim().replace(/^[🧹🧼🧽🧺🪟👕🛋️🏠🏢]\s*/, '')
            }))
          });
        }
        
        if (matchedService) {
          // Use name first (translated), then fallback to title
          const serviceTitle = matchedService.name || matchedService.title;
          setSelectedService(serviceTitle);
          setShowSizeField(true);
          console.log('✅ Service auto-selected:', serviceTitle, 'from:', source, 'original:', serviceToSelect);
        } else {
          console.warn('⚠️ Could not match service:', serviceToSelect, 'from:', source, 'Available services:', services.map(s => s.name || s.title));
        }
        
        // Clean up after use
        if (source === 'pending_service_selection') {
          localStorage.removeItem('pending_service_selection');
        }
        
        // Also clean up booking_prefill after service is successfully selected
        // This prevents it from being used again on re-renders
        if (source === 'booking_prefill' || source === 'location.state') {
          try {
            const prefillData = localStorage.getItem('booking_prefill');
            if (prefillData) {
              const prefill = JSON.parse(prefillData);
              // Only remove if serviceTitle was successfully matched
              if (prefill?.serviceTitle && matchedService) {
                // Keep other prefill data but mark serviceTitle as used
                // Or remove entirely if all data is used
                localStorage.removeItem('booking_prefill');
                console.log('🧹 Cleaned up booking_prefill after service selection');
              }
            }
          } catch (e) {
            console.warn('Error cleaning booking_prefill:', e);
          }
        }
      }
      
      // Handle pending message
      const pendingMessage = localStorage.getItem('pending_message');
      if (pendingMessage && messageRef.current) {
        // Validate message before filling
        const isValid = isValidMessage(pendingMessage);
        if (isValid) {
          messageRef.current.value = pendingMessage;
          setMessageValue(pendingMessage); // Update message value state
          // Mark that message was filled from pending, not auto-filled
          setMessageAutoFilled(false);
        } else {
          console.log('Invalid pending message, skipping:', pendingMessage);
          // Clear invalid message
          messageRef.current.value = '';
          setMessageValue('');
        }
        localStorage.removeItem('pending_message');
      }
    }
  }, [services, selectedService]);

  // Handle type ID from URL route (/reservation/:id) or location state
  useEffect(() => {
    const loadTypeFromUrl = async () => {
      // Priority: location.state > URL param > localStorage
      let typeId = null;
      let typeData = null;
      
      // Check location state first (from TypeDetails navigation)
      if (location.state?.type?.id) {
        typeId = location.state.type.id;
        typeData = location.state.type;
      } else if (location.state?.prefill?.typeId) {
        typeId = location.state.prefill.typeId;
      } else if (id) {
        // Use URL parameter if available
        typeId = parseInt(id);
      }
      
      if (typeId && !isNaN(typeId)) {
        try {
          // If we have typeData from state, use it directly
          if (typeData) {
            setSelectedTypeId(typeData.id);
            setTypeValue(typeData.name || '');
            if (typeData.service_id) {
              // Load the associated service
              const serviceData = await getServiceById(typeData.service_id, i18n.language);
              const service = serviceData.data || serviceData;
              if (service) {
                // Find service in services list or wait for services to load
                const serviceTitle = service.name || service.title || '';
                if (serviceTitle) {
                  localStorage.setItem('pending_service_selection', serviceTitle);
                }
              }
            }
          } else {
            // Load type from API
            const fetchedType = await getTypeById(typeId, i18n.language);
            const type = fetchedType.data || fetchedType;
            if (type) {
              setSelectedTypeId(type.id);
              setTypeValue(type.name || '');
              if (type.service_id) {
                // Load the associated service
                const serviceData = await getServiceById(type.service_id, i18n.language);
                const service = serviceData.data || serviceData;
                if (service) {
                  const serviceTitle = service.name || service.title || '';
                  if (serviceTitle) {
                    localStorage.setItem('pending_service_selection', serviceTitle);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error loading type from URL:', error);
        }
      }
    };
    
    loadTypeFromUrl();
  }, [id, location.state, i18n.language]);

  // Prefill from Services subcategory selection
  useEffect(() => {
    try {
      // Clean up any invalid data from localStorage first
      const cleanInvalidData = () => {
        try {
          const draft = localStorage.getItem('booking_draft');
          if (draft) {
            const d = JSON.parse(draft);
            if (d.message && !isValidMessage(d.message)) {
              console.log('Cleaning invalid draft message');
              d.message = '';
              localStorage.setItem('booking_draft', JSON.stringify(d));
            }
          }
        } catch (e) {
          console.warn('Error cleaning draft data:', e);
        }
        
        try {
          const pendingMsg = localStorage.getItem('pending_message');
          if (pendingMsg && !isValidMessage(pendingMsg)) {
            console.log('Cleaning invalid pending message');
            localStorage.removeItem('pending_message');
          }
        } catch (e) {
          console.warn('Error cleaning pending message:', e);
        }
      };
      
      cleanInvalidData();
      
      const raw = localStorage.getItem('booking_prefill');
      if (!raw) return;
      const prefill = JSON.parse(raw);
      console.log('Received prefill data:', prefill);
      
      // Handle selectedTypes from Ménage + cuisine category
      if (prefill?.selectedTypes && Array.isArray(prefill.selectedTypes) && prefill.selectedTypes.length > 0) {
        setSelectedTypes(prefill.selectedTypes);
        
        // Build type display value from selected types
        const typeDisplay = prefill.selectedTypes.map(t => t.name).join(' + ');
        setTypeValue(typeDisplay);
        
        // Set message if provided and valid
        if (prefill.message && messageRef.current) {
          const isValid = isValidMessage(prefill.message);
          if (isValid) {
            messageRef.current.value = prefill.message;
            // Mark that message was filled from prefill, not auto-filled
            setMessageAutoFilled(false);
          } else {
            console.log('Invalid prefill message, skipping:', prefill.message);
            messageRef.current.value = '';
          }
        }
        
        // Show size field if surface is provided
        if (prefill.size || prefill.surface) {
          const surfaceValue = (prefill.size || prefill.surface).toString();
          setSizeValue(surfaceValue);
          setShowSizeField(true);
        }
      }
      
      // Store prefill service title for matching after services load
      // This will be picked up by the useEffect that handles pending_service_selection
      // IMPORTANT: Store it BEFORE services are loaded so it can be matched when services array is ready
      if (prefill?.serviceTitle) {
        localStorage.setItem('pending_service_selection', prefill.serviceTitle);
        console.log('📝 Stored service title from prefill:', prefill.serviceTitle);
      }
      
      // Prefill other fields immediately
      // Support both 'size' (from Services.jsx) and 'surface' (from TypeDetails.jsx)
      if (!prefill?.selectedTypes) {
        // Only prefill size if not from Ménage + cuisine
        if (typeof prefill?.size === 'string' || typeof prefill?.size === 'number') {
          setSizeValue(prefill.size.toString());
        } else if (typeof prefill?.surface === 'string' || typeof prefill?.surface === 'number') {
          // Store surface value in a separate key so it can be accessed later when category loads
          localStorage.setItem('pending_surface_value', prefill.surface.toString());
          setSizeValue(prefill.surface.toString());
        }
      }
      
      // Handle type prefill - wait for types to load
      if (prefill?.typeId && typeof prefill.typeId === 'number') {
        setSelectedTypeId(prefill.typeId);
      } else if (typeof prefill?.type === 'string' && !prefill?.selectedTypes) {
        // Only set typeValue if not from selectedTypes
        setTypeValue(prefill.type);
        // Store type name for later matching when types load
        localStorage.setItem('pending_type_name', prefill.type);
      }
      
      if (typeof prefill?.totalPrice === 'number' && prefill.totalPrice > 0) {
        setCalculatedPrice(prefill.totalPrice);
      }
      
      if (prefill?.message && messageRef.current && !prefill?.selectedTypes) {
        // Only set message if not from selectedTypes (already handled above)
        const isValid = isValidMessage(prefill.message);
        if (isValid) {
          messageRef.current.value = prefill.message;
          setMessageValue(prefill.message); // Update message value state
          // Mark that message was filled from prefill, not auto-filled
          setMessageAutoFilled(false);
        } else {
          console.log('Invalid prefill message, skipping:', prefill.message);
          messageRef.current.value = '';
          setMessageValue('');
        }
      }
      
      // Handle choixtype_id prefill for Asian cuisine
      if (prefill?.choixtype_id) {
        setChoixtypeId(prefill.choixtype_id);
        console.log('Choixtype ID from prefill:', prefill.choixtype_id);
        // Note: selectedTypeOption will be set when typeOptions are loaded
      }
      
      // Load draft (from multi-services page) - but only if no prefill data
      const es = localStorage.getItem('booking_extra_services');
      if (es) {
        try { setExtraServices(JSON.parse(es) || []); } catch {}
      }
      const draft = localStorage.getItem('booking_draft');
      if (draft && !prefill?.serviceTitle && !prefill?.selectedTypes) {
        try {
          const d = JSON.parse(draft);
          console.log('Loading draft data:', d);
          if (d.firstname && document.getElementById('firstname')) document.getElementById('firstname').value = d.firstname;
          if (d.phone && document.getElementById('phone')) document.getElementById('phone').value = d.phone;
          if (d.location && document.getElementById('location')) document.getElementById('location').value = d.location;
          if (typeof d.type === 'string') setTypeValue(d.type);
          if (typeof d.sizeValue === 'string') setSizeValue(d.sizeValue);
          if (typeof d.selectedService === 'string') { setSelectedService(d.selectedService); setShowSizeField(!!d.selectedService); }
          if (d.message && messageRef.current) {
            const isValid = isValidMessage(d.message);
            if (isValid) {
              messageRef.current.value = d.message;
              setMessageValue(d.message); // Update message value state
              // Mark that message was filled from draft, not auto-filled
              setMessageAutoFilled(false);
            } else {
              console.log('Invalid draft message, skipping:', d.message);
              messageRef.current.value = '';
              setMessageValue('');
            }
          }
          if (d.promo) setPromo(d.promo);
        } catch {}
      }
      
        // Don't remove booking_prefill here - it's needed for service selection
        // It will be cleaned up after service is selected by the service selection useEffect
    } catch {}
  }, []);

  // Fonction pour calculer le prix basé sur la taille
  const calculatePrice = (serviceTitle, size) => {
    if (!serviceTitle || !size || size <= 0) return 0;
    
    // Prix par m² selon le service (cohérent avec Services.jsx)
    const pricePerM2 = {
      // Services existants
      'Ménage à domicile': 2.50,
      'Ménage et cuisine': 2.50,
      'Nettoyage de bureaux': 3.00,
      'Lavage de vitres': 1.50,
      'Lavage des vitres': 1.50,
      'Repassage': 0, // Pas de prix au m² pour le repassage
      'Nettoyage Canapé': 15.00, // Prix fixe par canapé
      
      // Nouveaux services
      'bureaux ou usine': 3.00, // Par défaut bureaux, sera ajusté selon le type
      'Ligne des maisons et repassage': 1.5, // Par défaut lavage, sera ajusté selon le type
      'Airbnb Cleaning': 3.0, // Par défaut check-in, sera ajusté selon le type
      'Pool Cleaning': 1.8, // Par défaut standard, sera ajusté selon le type
    };
    
    const price = pricePerM2[serviceTitle];
    if (price === 0) return 0; // Service sans prix au m²
    
    let base = parseFloat(size) * price;
    
    // Ajustement selon le type pour les nouveaux services
    if (serviceTitle === 'bureaux ou usine') {
      if (typeValue === 'Usine') base = parseFloat(size) * 4.0;
      else if (typeValue === 'Bureaux') base = parseFloat(size) * 3.0;
    } else if (serviceTitle === 'Lavage de vitres' || serviceTitle === 'Lavage des vitres') {
      if (typeValue === 'Extérieur') base = parseFloat(size) * 2.8;
      else if (typeValue === 'Intérieur') base = parseFloat(size) * 2.0;
    } else if (serviceTitle === 'Ligne des maisons et repassage') {
      if (typeValue === 'Repassage') base = parseFloat(size) * 2.2;
      else if (typeValue === 'Lavage') base = parseFloat(size) * 1.5;
    } else if (serviceTitle === 'Airbnb Cleaning') {
      if (typeValue === 'Check-out') base = parseFloat(size) * 3.5;
      else if (typeValue === 'Check-in') base = parseFloat(size) * 3.0;
    } else if (serviceTitle === 'Pool Cleaning') {
      if (typeValue === 'Nettoyage profond') base = parseFloat(size) * 2.6;
      else if (typeValue === 'Standard') base = parseFloat(size) * 1.8;
    }
    
    if (promo?.discount) {
      const d = Math.max(0, Math.min(100, Number(promo.discount)));
      base = base * (1 - d / 100);
    }
    return base;
  };

  // Track if message was auto-filled to allow updates when type/size changes
  const [messageAutoFilled, setMessageAutoFilled] = useState(false);

  // Helper function to validate if message looks like valid data (not random characters)
  // This should be defined before it's used in other functions
  const isValidMessage = useCallback((message) => {
    if (!message || message.trim().length === 0) return false;
    
    // Check if message contains valid patterns (type, size, etc.)
    const validPatterns = [
      /type|نوع|taille|حجم|surface|سطح|m²|m2/i,
      /[0-9]+\s*m²?/i,
      /[a-z]{2,}/i, // At least 2 consecutive letters (not random chars)
      /[\u0600-\u06FF]{2,}/ // At least 2 consecutive Arabic letters
    ];
    
    // If message is too short or looks like random characters, it's invalid
    if (message.length < 5) return false;
    
    // Check if it contains valid patterns
    const hasValidPattern = validPatterns.some(pattern => pattern.test(message));
    
    // Check if it's not just random characters (too many consonants in a row)
    const randomCharPattern = /[bcdfghjklmnpqrstvwxyz]{5,}/i;
    if (randomCharPattern.test(message) && !hasValidPattern) return false;
    
    return true;
  }, []);

  // Helper function to check if selected service is "Ménage à domicile" (supports all languages)
  const isMenageService = useCallback((serviceName) => {
    if (!serviceName) return false;
    
    const serviceLower = serviceName.toLowerCase().trim();
    
    // Check in all possible languages
    const menageKeywords = [
      // Arabic
      'التنظيف المنزلي',
      'تنظيف منزلي',
      'منزلي',
      // French
      'ménage à domicile',
      'menage a domicile',
      'ménage',
      'domicile',
      // English
      'home cleaning',
      'house cleaning',
      'domestic cleaning',
      'housekeeping',
      'home service'
    ];
    
    return menageKeywords.some(keyword => 
      serviceLower.includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(serviceLower)
    );
  }, []);

  // Helper function to fill message for Ménage service
  const fillMenageMessage = useCallback(() => {
    if (!messageRef.current || !selectedService) return;
    
    // Check if this is "Ménage à domicile" or similar services (supports all languages)
    if (!isMenageService(selectedService)) {
      // Reset auto-filled flag for other services
      if (messageAutoFilled) {
        setMessageAutoFilled(false);
      }
      return;
    }
    
    const currentMessage = messageRef.current.value.trim();
    
    // Clean invalid messages (random characters, test data, etc.)
    if (currentMessage.length > 0 && !isValidMessage(currentMessage)) {
      console.log('Cleaning invalid message:', currentMessage);
      messageRef.current.value = '';
      setMessageValue(''); // Update message value state
      setMessageAutoFilled(false);
    }
    
    // Build message based on available information
    let messageParts = [];
    
    // Add type if available and valid
    // Only add if typeValue is valid and not random characters
    if (typeValue && typeValue.trim() && typeValue.trim().length > 0) {
      // Validate type value (should not be random characters)
      // Check if it's a valid type name (not too long, contains valid characters)
      const typeTrimmed = typeValue.trim();
      const isValidType = typeTrimmed.length > 0 && 
                         typeTrimmed.length < 50 && 
                         (isValidMessage(typeTrimmed) || 
                          /^[a-zA-Z\u0600-\u06FF\s]+$/.test(typeTrimmed)); // Only letters and spaces
      
      if (isValidType) {
        messageParts.push(`${t('booking.type_label', 'Type')}: ${typeTrimmed}`);
      }
    }
    
    // Add size if available and valid
    if (sizeValue && sizeValue.trim() && parseFloat(sizeValue) > 0) {
      const sizeNum = parseFloat(sizeValue);
      if (!isNaN(sizeNum) && sizeNum > 0 && sizeNum < 10000) {
        messageParts.push(`${t('booking.size_label', 'Taille de la surface (m²)')}: ${sizeValue} m²`);
      }
    }
    
    // Only auto-fill if:
    // 1. Message is empty or invalid, OR
    // 2. Message was previously auto-filled (to allow updates when type/size changes)
    const shouldFill = currentMessage.length === 0 || 
                      !isValidMessage(currentMessage) || 
                      messageAutoFilled;
    
    if (shouldFill) {
      // If we have any valid information, build the message
      if (messageParts.length > 0) {
        const autoMessage = messageParts.join(', ');
        messageRef.current.value = autoMessage;
        setMessageValue(autoMessage); // Update message value state
        setMessageAutoFilled(true);
      } else if (currentMessage.length === 0 || !isValidMessage(currentMessage)) {
        // Default message for Ménage à domicile (only if message is empty or invalid)
        const defaultMessage = t('booking.default_menage_message', 'Service de ménage à domicile demandé');
        messageRef.current.value = defaultMessage;
        setMessageValue(defaultMessage); // Update message value state
        setMessageAutoFilled(true);
      }
    }
  }, [selectedService, typeValue, sizeValue, t, messageAutoFilled, isMenageService]);

  // Auto-fill message field when service, type, or size changes (especially for Ménage à domicile)
  useEffect(() => {
    if (!selectedService) return;
    
    let timeoutId;
    let retryTimeout;
    
    // Use requestAnimationFrame to ensure DOM is ready, then setTimeout for state updates
    const rafId = requestAnimationFrame(() => {
      timeoutId = setTimeout(() => {
        // Double-check that ref is ready and clean any invalid data first
        if (messageRef.current) {
          const currentValue = messageRef.current.value.trim();
          // Clean invalid messages before filling
          if (currentValue.length > 0 && !isValidMessage(currentValue)) {
            console.log('Cleaning invalid message before auto-fill:', currentValue);
            messageRef.current.value = '';
            setMessageValue(''); // Update message value state
            setMessageAutoFilled(false);
          }
          fillMenageMessage();
        } else {
          // Retry after a short delay if ref is not ready
          retryTimeout = setTimeout(() => {
            if (messageRef.current && selectedService) {
              const currentValue = messageRef.current.value.trim();
              // Clean invalid messages before filling
              if (currentValue.length > 0 && !isValidMessage(currentValue)) {
                console.log('Cleaning invalid message before auto-fill (retry):', currentValue);
                messageRef.current.value = '';
                setMessageValue(''); // Update message value state
                setMessageAutoFilled(false);
              }
              fillMenageMessage();
            }
          }, 150);
        }
      }, 100); // Increased delay to ensure state is fully updated
    });
    
    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [selectedService, typeValue, sizeValue, fillMenageMessage, isValidMessage, i18n.language]);

  // Effet pour recalculer le prix quand la taille, le service ou le type change
  useEffect(() => {
    if (selectedService && sizeValue) {
      // Pour les catégories non-Cuisine avec Category House sélectionnée, utiliser la formule: Surface × 2.5
      if (!isCuisineCategory && selectedCategory && sizeValue) {
        const surfaceNum = parseFloat(sizeValue);
        if (!isNaN(surfaceNum) && surfaceNum > 0) {
          let basePrice = surfaceNum * 2.5;
          if (promo?.discount) {
            const d = Math.max(0, Math.min(100, Number(promo.discount)));
            basePrice = basePrice * (1 - d / 100);
          }
          setCalculatedPrice(basePrice);
          return;
        }
      }
      // Pour les autres cas (sans Category House ou autres services), utiliser la fonction calculatePrice existante
      const price = calculatePrice(selectedService, sizeValue);
      setCalculatedPrice(price);
    } else {
      setCalculatedPrice(0);
    }
  }, [selectedService, sizeValue, typeValue, promo, isCuisineCategory, selectedCategory]);

  const totalWithExtras = (() => {
    const base = calculatedPrice || 0;
    const extras = extraServices.reduce((sum, s) => sum + (Number(s.estimate) || 0), 0);
    return base + extras;
  })();

  const saveDraftAndGoServices = () => {
    const firstname = document.getElementById('firstname')?.value || '';
    const phone = document.getElementById('phone')?.value || '';
    const location = document.getElementById('location')?.value || '';
    const message = messageRef.current?.value || '';
    const draft = {
      firstname, phone, location, message,
      selectedService, sizeValue, type: typeValue,
      promo, extraServices
    };
    localStorage.setItem('booking_draft', JSON.stringify(draft));
    navigate('/services?mode=add');
  };

  const loadServices = async () => {
    try {
      setServicesLoading(true);
      const data = await getServices(i18n.language);
      const servicesArray = Array.isArray(data) ? data : data.data || [];
      console.log('Loaded services:', servicesArray.map(s => s.title || s.name));
      setServices(servicesArray);
      
      // If we have a selectedService, try to find it in the new language and update it
      if (selectedService && servicesArray.length > 0) {
        // Find the service by matching the current selectedService with the new language services
        // We need to find by ID if possible, or by matching the service name
        const currentService = servicesArray.find(s => {
          const sName = (s.name || '').toLowerCase().trim();
          const sTitle = (s.title || '').toLowerCase().trim();
          const selected = selectedService.toLowerCase().trim();
          return sName === selected || sTitle === selected;
        });
        
        // If we found the service, update selectedService with the translated name
        if (currentService) {
          const translatedName = currentService.name || currentService.title;
          if (translatedName && translatedName !== selectedService) {
            setSelectedService(translatedName);
          }
        }
      }
    } catch (e) {
      console.error('Error loading services:', e);
      // En cas d'erreur, utiliser les services par défaut
      setServices([
        { id: 1, title: 'Ménage à domicile', icon: '🏠', is_active: true },
        { id: 2, title: 'Nettoyage de bureaux', icon: '🏢', is_active: true },
        { id: 3, title: 'Lavage de vitres', icon: '🪟', is_active: true },
        { id: 4, title: 'Repassage', icon: '👕', is_active: true },
        { id: 5, title: 'Nettoyage Canapé', icon: '🛋️', is_active: true }
      ]);
    } finally {
      setServicesLoading(false);
    }
  };

  const loadTypes = async () => {
    try {
      setTypesLoading(true);
      setTypeError('');
      const data = await getTypes(i18n.language);
      const typesArray = Array.isArray(data) ? data : data.data || [];
      console.log('Loaded types:', typesArray.map(t => t.name));
      setTypes(typesArray);
      
      // If we have a selectedTypeId, reload the type name in the current language
      if (selectedTypeId) {
        try {
          const typeData = await getTypeById(selectedTypeId, i18n.language);
          const type = typeData.data || typeData;
          if (type && type.name) {
            setTypeValue(type.name);
          }
        } catch (err) {
          console.warn('Error reloading type name for language:', err);
        }
      }
      
      // Try to match pending type name
      const pendingTypeName = localStorage.getItem('pending_type_name');
      if (pendingTypeName && typesArray.length > 0) {
        const foundType = typesArray.find(t => 
          (t.name || '').toLowerCase().trim() === pendingTypeName.toLowerCase().trim()
        );
        if (foundType) {
          setSelectedTypeId(foundType.id);
          setTypeValue(foundType.name || '');
        }
        localStorage.removeItem('pending_type_name');
      }
    } catch (e) {
      console.error('Error loading types:', e);
      setTypeError(t('booking.types_load_error', 'Erreur lors du chargement des types'));
    } finally {
      setTypesLoading(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    // Validate TypeOption selection for Asian Cuisine
    if (isAsianCuisineCategory && selectedTypeId && !selectedTypeOption) {
      alert(i18n.language === 'ar' 
        ? 'يرجى اختيار نوع المطبخ' 
        : i18n.language === 'fr'
        ? 'Veuillez sélectionner un type de cuisine'
        : 'Please select a cuisine type');
      return;
    }
    
    setLoading(true);
    const payload = {
      firstname: form.firstname.value.trim(),
      phone: form.phone.value.trim(),
      location: form.location.value.trim(),
      service: form.service.value,
      message: form.message.value.trim(),
    };
    
    // Add optional fields only if they have values
    if (typeValue) payload.type = typeValue;
    if (selectedTypeId) payload.type_id = selectedTypeId;
    if (choixtypeId) payload.choixtype_id = choixtypeId;
    if (form.email && form.email.value.trim()) payload.email = form.email.value.trim();
    if (form.size && form.size.value.trim()) payload.size = form.size.value.trim();
    if (calculatedPrice > 0) payload.total_price = calculatedPrice;
    // Store selected_types in admin_notes as JSON if needed for reference
    if (selectedTypes.length > 0) {
      const selectedTypesInfo = selectedTypes.map(t => ({ id: t.id, name: t.name, category: t.category }));
      payload.admin_notes = (payload.admin_notes || '') + 
        (payload.admin_notes ? '\n\n' : '') + 
        `Selected Types: ${JSON.stringify(selectedTypesInfo)}`;
    }
    
    try {
      // Sauvegarder en tant que réservation
      await createReservation(payload);
      setSubmitted(true);
    } catch (err) {
      console.error('Erreur lors de la création de la réservation:', err);
      const errorMessage = err?.message || err?.error || 'Erreur lors de l\'envoi. Vérifiez les champs.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Background style using public image path to avoid bundler resolution issues
  const bgStyle = {
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.45) 0%, rgba(2, 6, 23, 0.35) 100%), url(${bgUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: isMobile ? 'scroll' : 'fixed',
    minHeight: '100vh'
  };

  // Glassmorphism style for the form container
  const cardStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.25)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '18px',
    transition: 'opacity 600ms ease, transform 600ms ease',
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(6px)'
  };

  // Additional transparency specifically around the form area
  const formSectionStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '16px',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)'
  };

  return (
    <main className="booking-page" style={bgStyle}>
      <div className="booking-container" style={cardStyle}>
        <div className="booking-header">
          <div className="booking-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 13h.01M12 17h.01M8 13h.01M8 17h.01M16 13h.01M16 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="booking-title">{t('booking.title', 'Réserver un Service')}</h1>
          <p className="booking-description">
            {t('booking.subtitle', 'Remplissez ce formulaire pour réserver votre service de nettoyage. Nous vous contacterons dans les plus brefs délais pour confirmer votre rendez-vous.')}
          </p>
        </div>

        <div className="booking-form-section" style={formSectionStyle}>
          {submitted ? (
            <div className="booking-success">
              <div className="success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>{t('booking.success_title', 'Demande envoyée avec succès !')}</h3>
              <p>{t('booking.success_message', 'Merci pour votre confiance. Nous vous contacterons dans les plus brefs délais pour confirmer votre rendez-vous.')}</p>
              <button onClick={() => setSubmitted(false)} className="new-request-button">
                {t('booking.new_request', 'Nouvelle demande')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstname">{t('booking.firstname', 'Prénom')} *</label>
                  <input 
                    id="firstname" 
                    name="firstname" 
                    type="text"
                    required 
                    minLength={2} 
                    placeholder={t('booking.firstname_placeholder', 'Votre prénom')}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">{t('booking.phone', 'Téléphone')} *</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    inputMode="numeric"
                    pattern="^(\+33|\+212|0)[0-9\s\-]{6,}$"
                    title={t('booking.phone_help', 'Uniquement des chiffres (et espaces / tirets). Doit commencer par +33, +212 ou 0.')}
                    placeholder={t('booking.phone_placeholder', 'Ex: +212 6 12 34 56 78')}
                    onInput={(e) => { e.target.value = e.target.value.replace(/[A-Za-z]/g, ''); }}
                    className="form-input"
                  />
                  <small className="form-help">{t('booking.phone_help', 'Veuillez préciser si +33 ou +212')}</small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">{t('booking.location', 'Lieu de la prestation')} *</label>
                <div className="location-group">
                  <input 
                    ref={locationRef} 
                    id="location" 
                    name="location" 
                    type="text"
                    required 
                    minLength={2} 
                    placeholder={t('booking.location_placeholder', 'Ville / Adresse complète')}
                    className="form-input"
                  />
                  <button 
                    type="button" 
                    className="location-button" 
                    onClick={async () => {
                      setLocError('');
                      if (!navigator.geolocation) { 
                        setLocError(t('booking.geolocation_not_supported', 'La géolocalisation n\'est pas supportée.')); 
                        return; 
                      }
                      setLocLoading(true);
                      navigator.geolocation.getCurrentPosition(async (pos) => {
                        try {
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
                          if (locationRef.current) {
                            locationRef.current.value = value || city || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
                          }
                        } catch (err) {
                          setLocError(t('booking.location_error', 'Impossible de récupérer la localisation.'));
                        } finally {
                          setLocLoading(false);
                        }
                      }, (err) => { 
                        setLocError(t('booking.permission_error', 'Permission refusée ou indisponible.')); 
                        setLocLoading(false); 
                      });
                    }}
                    disabled={locLoading}
                  >
                    {locLoading ? t('booking.locating', 'Localisation...') : t('booking.use_location', '📍 Utiliser ma localisation')}
                  </button>
                </div>
                {locError && <small className="form-error">{locError}</small>}
              </div>

              <div className="form-group">
                <label htmlFor="service">{t('booking.service_label', 'Service souhaité')} *</label>
                <select 
                  id="service" 
                  name="service" 
                  required 
                  value={selectedService}
                  className="form-select"
                  ref={serviceSelectRef}
                  onChange={(e) => {
                    const newService = e.target.value;
                    setSelectedService(newService);
                    
                    // Check if this service should hide size and type fields
                    const serviceLower = newService.toLowerCase().trim();
                    const shouldHide = [
                      'السجاد والأرائك', 'السجاد والارائك', 'تنظيف السجاد', 'تنظيف الأرائك',
                      'الغسيل والكي', 'تنظيف السيارات', 'غسيل السيارات',
                      'tapis et canapés', 'tapis et canapes', 'nettoyage de tapis', 'nettoyage de canapés', 'nettoyage de canapes',
                      'lavage et repassage', 'nettoyage de voiture', 'lavage de voiture',
                      'carpets and sofas', 'carpet and sofa', 'carpet cleaning', 'sofa cleaning',
                      'washing and ironing', 'car cleaning', 'car wash',
                      'nettoyage canapé', 'nettoyage canape', 'repassage', 'ironing', 'washing', 'lavage'
                    ].some(hideService => 
                      serviceLower.includes(hideService.toLowerCase()) ||
                      hideService.toLowerCase().includes(serviceLower)
                    );
                    
                    // Show size field only if service is selected AND category is NOT Cuisine AND not in hide list
                    setShowSizeField(newService !== '' && !isCuisineCategory && !shouldHide);
                    if (newService === '' || shouldHide) {
                      setSizeValue('');
                      setCalculatedPrice(0);
                    }
                    
                    // Trigger message auto-fill after state update
                    // Use setTimeout to ensure state is updated and DOM is ready
                    // The useEffect will handle this, but we trigger it immediately for better UX
                    // Also ensure we wait for language-specific data to load
                    setTimeout(() => {
                      if (isMenageService(newService)) {
                        fillMenageMessage();
                      }
                    }, 150);
                  }}
                >
                  <option value="" disabled>
                    {servicesLoading ? t('booking.loading_services', 'Chargement des services...') : t('booking.select_service', 'Choisir un service')}
                  </option>
                  {services.map((service) => {
                    // API returns 'name' field already translated based on locale
                    // Use name first (translated), then fallback to title
                    const displayName = service.name || service.title || '';
                    const serviceValue = service.name || service.title || '';
                    return (
                      <option key={service.id} value={serviceValue}>
                        {getServiceIcon(service)} {displayName}
                      </option>
                    );
                  })}
                </select>
              </div>

              {showSizeField && !isCuisineType && !isCuisineCategory && !hideFields && !isWashingOrIroningFromMessage && (
                <div className="form-group">
                  <label htmlFor="size">{t('booking.size_label', 'Taille de la surface (m²)')}</label>
                  <div className="size-input-group">
                    <input 
                      id="size" 
                      name="size" 
                      type="number"
                      min="1"
                      step="0.5"
                      placeholder={t('booking.size_placeholder', 'Ex: 50')}
                      className="form-input"
                      value={sizeValue}
                      onChange={(e) => setSizeValue(e.target.value)}
                    />
                    <span className="size-unit">m²</span>
                  </div>
                  <small className="form-help">
                    {t('booking.size_help', 'Indiquez la surface à nettoyer pour un devis plus précis')}
                  </small>
                </div>
              )}

              {/* Display selected types from Ménage + cuisine */}
              {selectedTypes.length > 0 && (
                <div className="form-group">
                  <label>{t('booking.selected_types', 'Types sélectionnés')}</label>
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    {selectedTypes.map((type, idx) => (
                      <div key={type.id || idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: idx < selectedTypes.length - 1 ? '8px' : '0',
                        paddingBottom: idx < selectedTypes.length - 1 ? '8px' : '0',
                        borderBottom: idx < selectedTypes.length - 1 ? '1px solid rgba(16, 185, 129, 0.2)' : 'none'
                      }}>
                        <span style={{ color: '#10b981', fontSize: '18px' }}>✓</span>
                        <span style={{ fontWeight: '500' }}>{type.name}</span>
                        {type.category && (
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            {type.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <small className="form-help">
                    {t('booking.selected_types_help', 'Vous avez sélectionné ces types depuis la catégorie Ménage + cuisine')}
                  </small>
                </div>
              )}

              {/* Type de prestation - Select dropdown (only show if not from Ménage + cuisine and not in hideFields services and not washing/ironing from message) */}
              {selectedTypes.length === 0 && !hideFields && !isWashingOrIroningFromMessage && (
                <div className="form-group">
                  <label htmlFor="type">{t('booking.type_label', 'Type (optionnel)')}</label>
                  <select
                    id="type"
                    name="type"
                    className="form-select"
                    value={selectedTypeId || ''}
                    onChange={(e) => {
                      const typeId = e.target.value ? parseInt(e.target.value) : null;
                      setSelectedTypeId(typeId);
                      
                      if (typeId) {
                        const selectedType = types.find(t => t.id === typeId);
                        if (selectedType) {
                          setTypeValue(selectedType.name || '');
                        }
                      } else {
                        setTypeValue('');
                        setSelectedCategory(null);
                        setSelectedService('');
                        setShowSizeField(false);
                        setServiceAutoFillError('');
                        setSizeValue('');
                        setCalculatedPrice(0);
                      }
                    }}
                    disabled={typesLoading}
                  >
                    <option value="">
                      {typesLoading 
                        ? t('booking.loading_types', 'Chargement des types...') 
                        : t('booking.select_type', 'Choisir un type (optionnel)')}
                    </option>
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {serviceAutoFillError && (
                    <small className="form-error">{serviceAutoFillError}</small>
                  )}
                  {!serviceAutoFillError && selectedTypeId && (
                    <small className="form-help">
                      {t('booking.type_help_auto', 'Le service associé sera sélectionné automatiquement')}
                    </small>
                  )}
                  {!selectedTypeId && (
                    <small className="form-help">{t('booking.type_help', 'Renseignez le type si pertinent (ex: Villa, Italienne…)')}</small>
                  )}
                </div>
              )}

              {/* Type Options Selection for Asian Cuisine */}
              {isAsianCuisineCategory && selectedTypeId && (
                <div className="form-group" style={{ marginTop: '24px' }}>
                  {console.log('Rendering TypeOptions - isAsianCuisineCategory:', isAsianCuisineCategory, 'selectedTypeId:', selectedTypeId, 'typeOptions:', typeOptions.length, 'selectedCategory:', selectedCategory)}
                  <label style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    marginBottom: '16px',
                    display: 'block',
                    color: '#1f2937'
                  }}>
                    {i18n.language === 'ar' ? 'اختيار النوع' : i18n.language === 'fr' ? 'Choix Type' : 'Type Selection'}
                  </label>
                  
                  {loadingTypeOptions ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px',
                      color: '#6b7280'
                    }}>
                      {i18n.language === 'ar' ? 'جاري التحميل...' : i18n.language === 'fr' ? 'Chargement...' : 'Loading...'}
                    </div>
                  ) : typeOptions.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '16px',
                      marginTop: '12px'
                    }}>
                      {typeOptions.map((option) => {
                        const isSelected = selectedTypeOption && selectedTypeOption.id === option.id;
                        const optionImage = option.image_url || option.image;
                        let imageUrl = optionImage;
                        
                        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                          imageUrl = `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/storage/${imageUrl}`;
                        }
                        
                        const optionName = i18n.language === 'ar' 
                          ? (option.name_ar || option.name_fr || option.name_en || option.name)
                          : i18n.language === 'fr'
                          ? (option.name_fr || option.name_ar || option.name_en || option.name)
                          : (option.name_en || option.name_fr || option.name_ar || option.name);
                        
                        const optionDescription = i18n.language === 'ar'
                          ? (option.description_ar || option.description_fr || option.description_en || option.description)
                          : i18n.language === 'fr'
                          ? (option.description_fr || option.description_ar || option.description_en || option.description)
                          : (option.description_en || option.description_fr || option.description_ar || option.description);

                        return (
                          <div
                            key={option.id}
                            onClick={() => handleTypeOptionSelect(option)}
                            style={{
                              backgroundColor: isSelected ? '#dbeafe' : '#ffffff',
                              border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                              borderRadius: '16px',
                              padding: '20px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: isSelected 
                                ? '0 10px 25px rgba(59, 130, 246, 0.2)' 
                                : '0 4px 6px rgba(0, 0, 0, 0.1)',
                              transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                              position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }
                            }}
                          >
                            {/* Selected indicator */}
                            {isSelected && (
                              <div style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                width: '32px',
                                height: '32px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
                              }}>
                                <span style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>✓</span>
                              </div>
                            )}
                            
                            {/* Image */}
                            {imageUrl && (
                              <div style={{
                                width: '100%',
                                height: '180px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                marginBottom: '16px',
                                backgroundColor: '#f3f4f6'
                              }}>
                                <img
                                  src={imageUrl}
                                  alt={optionName}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Name */}
                            <h4 style={{
                              fontSize: '20px',
                              fontWeight: '600',
                              color: '#1f2937',
                              marginBottom: '10px',
                              marginTop: imageUrl ? '0' : '0'
                            }}>
                              {optionName}
                            </h4>
                            
                            {/* Description */}
                            {optionDescription && (
                              <p style={{
                                fontSize: '14px',
                                color: '#6b7280',
                                lineHeight: '1.6',
                                margin: 0,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {optionDescription}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{
                      padding: '40px',
                      textAlign: 'center',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      color: '#6b7280'
                    }}>
                      {i18n.language === 'ar' 
                        ? 'لا توجد خيارات متاحة' 
                        : i18n.language === 'fr'
                        ? 'Aucune option disponible'
                        : 'No options available'}
                    </div>
                  )}
                  
                  {!selectedTypeOption && typeOptions.length > 0 && (
                    <small className="form-error" style={{ display: 'block', marginTop: '12px' }}>
                      {i18n.language === 'ar' 
                        ? 'يرجى اختيار نوع المطبخ' 
                        : i18n.language === 'fr'
                        ? 'Veuillez sélectionner un type de cuisine'
                        : 'Please select a cuisine type'}
                    </small>
                  )}
                </div>
              )}

              {calculatedPrice > 0 && (
                <div className="form-group price-calculation">
                  <div className="price-display">
                    <div className="price-label">{t('booking.estimated_price', 'Prix estimé :')}</div>
                  <div className="price-value">{totalWithExtras.toFixed(2)} DH</div>
                  </div>
                  <small className="form-help">
                  {!isCuisineCategory && selectedCategory && sizeValue ? (
                    // For non-Cuisine categories, show: Surface × 2.5 DH/m²
                    t('booking.price_breakdown_simple', 'Estimation basée sur {{size}} m² × 2.5 DH/m²{{extras}}', { 
                      size: sizeValue,
                      extras: extraServices.length > 0 ? ` + services ajoutés` : ''
                    })
                  ) : (
                    // For other cases, use the existing breakdown
                    t('booking.price_breakdown', 'Estimation basée sur {{size}} m² × {{rate}} DH/m² + services ajoutés', { 
                      size: sizeValue, 
                      rate: (() => {
                        if (selectedService === 'bureaux ou usine') {
                          return typeValue === 'Usine' ? '4.00' : '3.00';
                        } else if (selectedService === 'Lavage de vitres' || selectedService === 'Lavage des vitres') {
                          return typeValue === 'Extérieur' ? '2.80' : '2.00';
                        } else if (selectedService === 'Ligne des maisons et repassage') {
                          return typeValue === 'Repassage' ? '2.20' : '1.50';
                        } else if (selectedService === 'Airbnb Cleaning') {
                          return typeValue === 'Check-out' ? '3.50' : '3.00';
                        } else if (selectedService === 'Pool Cleaning') {
                          return typeValue === 'Nettoyage profond' ? '2.60' : '1.80';
                        }
                        return calculatePrice(selectedService, 1).toFixed(2);
                      })()
                    })
                  )}
                  </small>
                </div>
              )}

              <div className="form-group">
                <PromoCode onApplied={setPromo} />
              </div>

            {extraServices.length > 0 && (
              <div className="form-group">
                <label>{t('booking.extra_services', 'Services ajoutés')}</label>
                <ul style={{margin:0,paddingLeft:18}}>
                  {extraServices.map((s, idx) => (
                    <li key={idx}>
                      {s.title} — {s.type || '-'} — {s.size || '-'} — {Number(s.estimate||0).toFixed(2)} DH
                    </li>
                  ))}
                </ul>
              </div>
            )}

              <div className="form-group">
                <label htmlFor="message">{t('booking.message_label', 'Détails de la prestation')} *</label>
                <textarea 
                  id="message" 
                  name="message" 
                  rows="5" 
                  required 
                  minLength={10} 
                  placeholder={t('booking.message_placeholder', 'Décrivez la prestation souhaitée : lieu précis, surfaces à nettoyer, poils d\'animaux, fumeur, sièges très tachés, sable, etc.')}
                  className="form-textarea"
                  ref={messageRef}
                  onInput={(e) => {
                    // Update message value state to detect washing/ironing categories
                    setMessageValue(e.target.value || '');
                    
                    // If user manually edits the message, reset auto-filled flag
                    // This prevents overwriting user input when type/size changes
                    if (messageAutoFilled) {
                      setMessageAutoFilled(false);
                    }
                  }}
                />
                <small className="form-help">{t('booking.message_help', 'Plus vous êtes précis, mieux nous pourrons vous servir')}</small>
              </div>

              <div className="form-group">
                <label htmlFor="email">{t('booking.email_label', 'Email (optionnel)')}</label>
                <input 
                  id="email" 
                  name="email" 
                  type="email"
                  placeholder={t('booking.email_placeholder', 'votre@email.com')}
                  className="form-input"
                />
                <small className="form-help">{t('booking.email_help', 'Pour recevoir la confirmation par email')}</small>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? t('booking.submitting', 'Envoi en cours...') : t('booking.submit', 'Envoyer la demande')}
                </button>
                <button 
                  type="button" 
                  className="submit-button" 
                  style={{background:'#10b981'}}
                  onClick={saveDraftAndGoServices}
                >
                  {t('booking.add_service', '+ Ajouter un service')}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="booking-info">
          <div className="info-card">
            <div className="info-icon">📞</div>
            <div className="info-content">
              <h4>Contact direct</h4>
              <p>Appelez-nous au <a href="tel:+33666262106">06 66 26 21 06</a></p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">⏰</div>
            <div className="info-content">
              <h4>Horaires</h4>
              <p>24h/7j</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">✅</div>
            <div className="info-content">
              <h4>Confirmation</h4>
              <p>Nous vous confirmons sous 24h</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
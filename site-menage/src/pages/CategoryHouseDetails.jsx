import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getServices, getCategoryHouseById, getTypes, getCategoriesHouse, getTypeOptions } from '../api-supabase';
import './Services.css';

export default function CategoryHouseDetails() {
  const { serviceSlug, categorySlug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // i18n is used in useEffect dependency
  const [service, setService] = useState(null);
  const [category, setCategory] = useState(null);
  const [types, setTypes] = useState([]);
  const [allTypes, setAllTypes] = useState([]); // Store all types for kitchen category
  const [showAllTypes, setShowAllTypes] = useState(false); // Toggle to show all types
  const [selectedTypes, setSelectedTypes] = useState([]); // Store selected types for Ménage + cuisine
  const [categoriesHouseMap, setCategoriesHouseMap] = useState({}); // Map category_house_id to category info
  const [warningMessage, setWarningMessage] = useState(''); // Warning message for selection limits
  const [typeOptionsMap, setTypeOptionsMap] = useState({}); // Map type_id to options array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [surface, setSurface] = useState('');
  const [price, setPrice] = useState(0);
  
  // Special form state for carpets/sofas categories (service 7, categories 14, 15, 16)
  const [carpetSofaForm, setCarpetSofaForm] = useState({
    serviceType: '', // 'carpets', 'sofas', 'both'
    count: '',
    items: [] // Array of {length: '', width: ''}
  });

  useEffect(() => {
    loadData();
  }, [serviceSlug, categorySlug, i18n.language]);

  useEffect(() => {
    // Calculate price based on surface (example: 1 m² = 2.5 DH)
    if (surface && !isNaN(parseFloat(surface))) {
      setPrice(parseFloat(surface) * 2.5);
    } else {
      setPrice(0);
    }
  }, [surface]);

  // Check if this is a carpet/sofa category (service 7, categories 14, 15, 16)
  const isCarpetSofaCategory = () => {
    const serviceId = parseInt(serviceSlug);
    const categoryId = parseInt(categorySlug);
    return serviceId === 7 && (categoryId === 14 || categoryId === 15 || categoryId === 16);
  };

  // Determine service type based on category ID
  const getCarpetSofaServiceType = () => {
    const categoryId = parseInt(categorySlug);
    if (categoryId === 14) return 'carpets'; // tapis
    if (categoryId === 15) return 'sofas'; // canapés
    if (categoryId === 16) return 'both'; // tapis & canapés
    return '';
  };

  // Handle count change - generate dynamic fields
  const handleCountChange = (count) => {
    const numCount = parseInt(count) || 0;
    const validCount = Math.min(Math.max(numCount, 0), 10); // Limit to 10
    
    const newItems = Array(validCount).fill(null).map((_, index) => 
      carpetSofaForm.items[index] || { length: '', width: '' }
    );
    
    setCarpetSofaForm({
      ...carpetSofaForm,
      count: validCount > 0 ? validCount.toString() : '',
      items: newItems
    });
  };

  // Handle item dimension change
  const handleItemChange = (index, field, value) => {
    const numValue = parseFloat(value) || '';
    const validValue = numValue === '' ? '' : Math.max(0.1, numValue);
    
    const newItems = [...carpetSofaForm.items];
    newItems[index] = {
      ...newItems[index],
      [field]: validValue
    };
    
    setCarpetSofaForm({
      ...carpetSofaForm,
      items: newItems
    });
  };

  // Calculate total area for carpets/sofas
  const calculateCarpetSofaArea = () => {
    return carpetSofaForm.items.reduce((total, item) => {
      const length = parseFloat(item.length) || 0;
      const width = parseFloat(item.width) || 0;
      return total + (length * width);
    }, 0);
  };

  // Calculate price for carpets/sofas (using 2.5 DH per m² as default)
  const calculateCarpetSofaPrice = () => {
    const totalArea = calculateCarpetSofaArea();
    return totalArea * 2.5;
  };

  // Initialize service type when category loads
  useEffect(() => {
    if (isCarpetSofaCategory() && category) {
      const serviceType = getCarpetSofaServiceType();
      setCarpetSofaForm(prev => {
        if (prev.serviceType !== serviceType) {
          return {
            serviceType: serviceType,
            count: '',
            items: []
          };
        }
        return prev;
      });
    }
  }, [category, categorySlug, serviceSlug]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get service
      const servicesData = await getServices(i18n.language);
      const servicesArray = Array.isArray(servicesData) ? servicesData : servicesData.data || [];
      const foundService = servicesArray.find(s => 
        s.id === parseInt(serviceSlug) || 
        s.slug === serviceSlug ||
        (s.name || s.title || '').toLowerCase().replace(/\s+/g, '-') === serviceSlug.toLowerCase()
      );

      if (!foundService) {
        setError('Service non trouvé');
        return;
      }

      setService(foundService);

      // Get category by ID or slug
      let foundCategory = null;
      const categoryId = parseInt(categorySlug);
      if (!isNaN(categoryId)) {
        const categoryData = await getCategoryHouseById(categoryId, i18n.language);
        // Parse response: can be {success: true, data: {...}} or directly an object
        foundCategory = categoryData.data || categoryData;
      } else {
        // Try to find by slug from all categories
        const categoriesData = await getCategoriesHouse(i18n.language, foundService.id);
        const categoriesArray = Array.isArray(categoriesData) 
          ? categoriesData 
          : (categoriesData.data || []);
        foundCategory = categoriesArray.find(c => 
          c.id.toString() === categorySlug ||
          (c.name || '').toLowerCase().replace(/\s+/g, '-') === categorySlug.toLowerCase()
        );
      }
      
      if (!foundCategory) {
        setError('Catégorie non trouvée');
        return;
      }

      setCategory(foundCategory);

      // Load types for this category-house
      const typesData = await getTypes(i18n.language, null, foundCategory.id);
      // Parse response: can be {success: true, data: [...]} or directly an array
      let typesArray = Array.isArray(typesData) 
        ? typesData 
        : (typesData.data || []);
      
      // Check if this is Ménage + cuisine category
      const isMenageCuisineCategory = foundCategory && (
        foundCategory.name_fr === 'Ménage + cuisine' ||
        foundCategory.name_fr === 'Ménage et cuisine' ||
        foundCategory.name_en === 'Housekeeping + kitchen' ||
        foundCategory.name_en === 'Housekeeping and kitchen' ||
        foundCategory.name_ar === 'المنزل + المطبخ' ||
        foundCategory.name_ar === 'المنزل والمطبخ' ||
        foundCategory.name === 'Ménage + cuisine' ||
        foundCategory.name === 'Ménage et cuisine' ||
        foundCategory.name === 'Housekeeping + kitchen' ||
        foundCategory.name === 'Housekeeping and kitchen'
      );

      // Check if this is a kitchen/cuisine category
      const isKitchenCategory = foundCategory && (
        foundCategory.name_fr === 'Cuisine' ||
        foundCategory.name_en === 'Kitchen' ||
        foundCategory.name_ar === 'المطبخ' ||
        foundCategory.name === 'Cuisine' ||
        foundCategory.name === 'Kitchen' ||
        foundCategory.name === 'المطبخ'
      );
      
      // For Ménage + cuisine category, load all types for service 1
      if (isMenageCuisineCategory) {
        const allServiceTypes = await getTypes(i18n.language, foundService.id, null);
        const allTypesArray = Array.isArray(allServiceTypes) 
          ? allServiceTypes 
          : (allServiceTypes.data || []);
        
        // Load all categories house to map types to their categories
        const categoriesData = await getCategoriesHouse(i18n.language, foundService.id);
        const categoriesArray = Array.isArray(categoriesData) 
          ? categoriesData 
          : (categoriesData.data || []);
        
        // Create a map of category_house_id to category info
        const categoriesMap = {};
        categoriesArray.forEach(cat => {
          categoriesMap[cat.id] = cat;
        });
        setCategoriesHouseMap(categoriesMap);
        
        setAllTypes(allTypesArray);
        typesArray = allTypesArray;
      } else if (isKitchenCategory) {
        // Store all types for kitchen category
        setAllTypes(typesArray);
        
        // Helper function to filter and sort default kitchen types (local to loadData)
        const filterDefaultKitchenTypesLocal = (typesArray) => {
          const defaultKitchenTypes = [
            {
              keywords: ['المغربية', 'مغربية', 'Marocaine', 'Moroccan'],
              order: 1
            },
            {
              keywords: ['الإيطالية', 'إيطالية', 'Italienne', 'Italian'],
              order: 2
            },
            {
              keywords: ['العربية الخليجية', 'خليجية', 'Arabe du Golfe', 'Gulf Arab'],
              order: 3
            },
            {
              keywords: ['الدولية', 'دولية', 'Internationale', 'International'],
              order: 4
            }
          ];
          
          return typesArray
            .filter(type => {
              const typeName = (type.name || '').toLowerCase();
              const typeNameAr = (type.name_ar || '').toLowerCase();
              const typeNameFr = (type.name_fr || '').toLowerCase();
              const typeNameEn = (type.name_en || '').toLowerCase();
              
              return defaultKitchenTypes.some(allowed => {
                return allowed.keywords.some(keyword => {
                  const keywordLower = keyword.toLowerCase();
                  return typeName.includes(keywordLower) ||
                         typeNameAr.includes(keywordLower) ||
                         typeNameFr.includes(keywordLower) ||
                         typeNameEn.includes(keywordLower);
                });
              });
            })
            .map(type => {
              const typeName = (type.name || '').toLowerCase();
              const typeNameAr = (type.name_ar || '').toLowerCase();
              const typeNameFr = (type.name_fr || '').toLowerCase();
              const typeNameEn = (type.name_en || '').toLowerCase();
              
              for (const allowed of defaultKitchenTypes) {
                const matches = allowed.keywords.some(keyword => {
                  const keywordLower = keyword.toLowerCase();
                  return typeName.includes(keywordLower) ||
                         typeNameAr.includes(keywordLower) ||
                         typeNameFr.includes(keywordLower) ||
                         typeNameEn.includes(keywordLower);
                });
                
                if (matches) {
                  return { ...type, _sortOrder: allowed.order };
                }
              }
              return { ...type, _sortOrder: 999 };
            })
            .sort((a, b) => (a._sortOrder || 999) - (b._sortOrder || 999))
            .map(({ _sortOrder, ...type }) => type);
        };
        
        // Filter to show only 4 default types initially
        typesArray = filterDefaultKitchenTypesLocal(typesArray);
      } else {
        setAllTypes([]);
      }
      
      setTypes(typesArray);
      setShowAllTypes(false); // Reset to default view when loading new data
      setSelectedTypes([]); // Reset selected types when loading new data
      setCategoriesHouseMap({}); // Reset categories map
      setWarningMessage(''); // Reset warning message
      
      // Load options for all types
      await loadTypeOptions(typesArray);
      
      // Also load options for allTypes if available
      if (allTypes.length > 0) {
        await loadTypeOptions(allTypes);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Load options for all types
  const loadTypeOptions = async (typesArray) => {
    try {
      const optionsMap = {};
      for (const type of typesArray) {
        if (type.id) {
          try {
            const options = await getTypeOptions(type.id, i18n.language);
            if (options && options.length > 0) {
              optionsMap[type.id] = options;
            }
          } catch (err) {
            console.error(`Error loading options for type ${type.id}:`, err);
          }
        }
      }
      setTypeOptionsMap(optionsMap);
    } catch (err) {
      console.error('Error loading type options:', err);
    }
  };

  const handleReserve = () => {
    const prefill = {
      serviceTitle: service?.name || service?.title,
      message: `Catégorie: ${category?.name}${surface ? `, Surface: ${surface} m²` : ''}`,
      type: category?.name || '',
      size: surface || '',
      totalPrice: price || 0,
    };
    
    try {
      localStorage.setItem('booking_prefill', JSON.stringify(prefill));
      navigate('/booking');
    } catch (err) {
      console.error('Error saving prefill:', err);
      navigate('/booking');
    }
  };

  // Check if a type is one of the 4 default types
  const isDefaultKitchenType = (type) => {
    const typeName = (type.name || '').toLowerCase();
    const typeNameAr = (type.name_ar || '').toLowerCase();
    const typeNameFr = (type.name_fr || '').toLowerCase();
    const typeNameEn = (type.name_en || '').toLowerCase();
    
    const defaultKeywords = [
      'المغربية', 'مغربية', 'Marocaine', 'Moroccan',
      'الإيطالية', 'إيطالية', 'Italienne', 'Italian',
      'العربية الخليجية', 'خليجية', 'Arabe du Golfe', 'Gulf Arab',
      'الدولية', 'دولية', 'Internationale', 'International'
    ];
    
    return defaultKeywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      return typeName.includes(keywordLower) ||
             typeNameAr.includes(keywordLower) ||
             typeNameFr.includes(keywordLower) ||
             typeNameEn.includes(keywordLower);
    });
  };

  // Check if a type is "الدولية" / "Internationale" / "International"
  const isInternationalType = (type) => {
    const typeName = (type.name || '').toLowerCase();
    const typeNameAr = (type.name_ar || '').toLowerCase();
    const typeNameFr = (type.name_fr || '').toLowerCase();
    const typeNameEn = (type.name_en || '').toLowerCase();
    
    const internationalKeywords = ['الدولية', 'دولية', 'Internationale', 'International'];
    return internationalKeywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      return typeName.includes(keywordLower) ||
             typeNameAr.includes(keywordLower) ||
             typeNameFr.includes(keywordLower) ||
             typeNameEn.includes(keywordLower);
    });
  };

  // Handle click on International type to show only other types (excluding the 4 default types)
  const handleInternationalClick = (e) => {
    e.preventDefault();
    if (!showAllTypes && allTypes.length > 0) {
      // Filter out the 4 default types and show only the remaining types
      const otherTypes = allTypes.filter(type => !isDefaultKitchenType(type));
      setShowAllTypes(true);
      setTypes(otherTypes);
    }
  };

  // Determine if a type belongs to Cuisine category
  const isCuisineType = (type) => {
    // First check if we have category_house_id and map
    if (type.category_house_id && categoriesHouseMap[type.category_house_id]) {
      const categoryHouse = categoriesHouseMap[type.category_house_id];
      const categoryName = (categoryHouse.name || '').toLowerCase();
      const categoryNameFr = (categoryHouse.name_fr || '').toLowerCase();
      const categoryNameEn = (categoryHouse.name_en || '').toLowerCase();
      const categoryNameAr = (categoryHouse.name_ar || '').toLowerCase();
      
      if (categoryName.includes('cuisine') ||
          categoryName.includes('kitchen') ||
          categoryName.includes('مطبخ') ||
          categoryNameFr === 'cuisine' ||
          categoryNameEn === 'kitchen' ||
          categoryNameAr === 'المطبخ') {
        return true;
      }
    }
    
    // Fallback: check type name directly for kitchen-related keywords
    const typeName = (type.name || '').toLowerCase();
    const typeNameFr = (type.name_fr || '').toLowerCase();
    const typeNameEn = (type.name_en || '').toLowerCase();
    const typeNameAr = (type.name_ar || '').toLowerCase();
    
    const cuisineKeywords = [
      'المغربية', 'مغربية', 'Marocaine', 'Moroccan',
      'الإيطالية', 'إيطالية', 'Italienne', 'Italian',
      'العربية الخليجية', 'خليجية', 'Arabe du Golfe', 'Gulf Arab',
      'الدولية', 'دولية', 'Internationale', 'International',
      'Allemande', 'German', 'ألمانية', 'allemande',
      'Coréenne', 'Korean', 'كورية', 'coréenne',
      'Espagnole', 'Spanish', 'إسبانية', 'espagnole',
      'Française', 'French', 'فرنسية', 'française',
      'Indienne', 'Indian', 'هندية', 'indienne',
      'Japonaise', 'Japanese', 'يابانية', 'japonaise',
      'Chinoise', 'Chinese', 'صينية', 'chinoise',
      'Mexicaine', 'Mexican', 'مكسيكية', 'mexicaine',
      'Libanaise', 'Lebanese', 'لبنانية', 'libanaise',
      'Turque', 'Turkish', 'تركية', 'turque',
      'Égyptienne', 'Egyptian', 'مصرية', 'égyptienne'
    ];
    
    return cuisineKeywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      return typeName.includes(keywordLower) ||
             typeNameFr.includes(keywordLower) ||
             typeNameEn.includes(keywordLower) ||
             typeNameAr.includes(keywordLower);
    });
  };

  // Determine if a type belongs to Ménage/Housekeeping category
  const isMenageType = (type) => {
    // First check if we have category_house_id and map
    if (type.category_house_id && categoriesHouseMap[type.category_house_id]) {
      const categoryHouse = categoriesHouseMap[type.category_house_id];
      const categoryName = (categoryHouse.name || '').toLowerCase();
      const categoryNameFr = (categoryHouse.name_fr || '').toLowerCase();
      const categoryNameEn = (categoryHouse.name_en || '').toLowerCase();
      const categoryNameAr = (categoryHouse.name_ar || '').toLowerCase();
      
      if (categoryName.includes('ménage') ||
          categoryName.includes('housekeeping') ||
          categoryName.includes('تنظيف') ||
          categoryName.includes('منزل') ||
          categoryNameFr.includes('ménage') ||
          categoryNameEn.includes('housekeeping') ||
          categoryNameAr.includes('تنظيف') ||
          categoryNameAr.includes('منزل')) {
        return true;
      }
    }
    
    // Fallback: check type name directly for housekeeping-related keywords
    const typeName = (type.name || '').toLowerCase();
    const typeNameFr = (type.name_fr || '').toLowerCase();
    const typeNameEn = (type.name_en || '').toLowerCase();
    const typeNameAr = (type.name_ar || '').toLowerCase();
    
    const menageKeywords = [
      'Appartement', 'Apartment', 'شقة', 'appartement',
      'Villa', 'فيلا', 'villa',
      'Bureau', 'Office', 'مكتب', 'bureau',
      'Maison', 'House', 'منزل', 'maison',
      'Maison d\'hôte', 'Guest House', 'بيت الضيافة', 'maison d\'hôte',
      'Hôtel', 'Hotel', 'فندق', 'hôtel',
      'Nettoyage', 'Cleaning', 'تنظيف', 'nettoyage',
      'Ménage', 'Housekeeping', 'تدبير منزلي', 'ménage'
    ];
    
    return menageKeywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      return typeName.includes(keywordLower) ||
             typeNameFr.includes(keywordLower) ||
             typeNameEn.includes(keywordLower) ||
             typeNameAr.includes(keywordLower);
    });
  };

  // Handle type selection for Ménage + cuisine with restrictions
  const handleTypeSelect = (type) => {
    const isSelected = selectedTypes.some(t => t.id === type.id);
    
    if (isSelected) {
      // Remove if already selected
      const updated = selectedTypes.filter(t => t.id !== type.id);
      setSelectedTypes(updated);
      console.log('Type deselected:', type.name, 'Remaining selected:', updated);
      return;
    }
    
    // Check restrictions before adding
    const isCuisine = isCuisineType(type);
    const isMenage = isMenageType(type);
    
    console.log('=== Type Selection Check ===');
    console.log('Type:', type.name, 'isCuisine:', isCuisine, 'isMenage:', isMenage);
    console.log('Current selected types:', selectedTypes.length);
    
    // Check if user already selected one from the same category
    const selectedCuisine = selectedTypes.find(t => isCuisineType(t));
    const selectedMenage = selectedTypes.find(t => isMenageType(t));
    
    console.log('Already selected Cuisine:', selectedCuisine?.name);
    console.log('Already selected Menage:', selectedMenage?.name);
    
    // Step 1: Check if type is Cuisine AND we already have a Cuisine selected
    if (isCuisine && selectedCuisine) {
      const message = i18n.language === 'ar' 
        ? 'يمكن اختيار عنصر واحد فقط من فئة المطبخ'
        : i18n.language === 'fr'
        ? 'Vous ne pouvez sélectionner qu\'un seul élément de la catégorie Cuisine'
        : 'You can only select one item from the Cuisine category';
      
      console.log('❌ BLOCKED: Cuisine already selected. Showing warning.');
      setWarningMessage(message);
      setTimeout(() => setWarningMessage(''), 3000);
      return; // STOP HERE - don't add to state
    }
    
    // Step 2: Check if type is Menage AND we already have a Menage selected
    if (isMenage && selectedMenage) {
      const message = i18n.language === 'ar' 
        ? 'يمكن اختيار عنصر واحد فقط من فئة التنظيف/التدبير المنزلي'
        : i18n.language === 'fr'
        ? 'Vous ne pouvez sélectionner qu\'un seul élément de la catégorie Ménage'
        : 'You can only select one item from the Housekeeping category';
      
      console.log('❌ BLOCKED: Menage already selected. Showing warning.');
      setWarningMessage(message);
      setTimeout(() => setWarningMessage(''), 3000);
      return; // STOP HERE - don't add to state
    }
    
    // Step 3: If we reach here, it's safe to add
    const updated = [...selectedTypes, type];
    setSelectedTypes(updated);
    console.log('✅ ALLOWED: Type added successfully. Total selected:', updated.length);
    console.log('All selected:', updated.map(t => t.name));
  };

  // Check if a type is selected
  const isTypeSelected = (type) => {
    return selectedTypes.some(t => t.id === type.id);
  };

  // Check if both Cuisine and Menage types are selected (exactly one of each)
  const canReserve = () => {
    if (!isMenageCuisineCategory()) return false;
    
    const selectedCuisine = selectedTypes.find(t => isCuisineType(t));
    const selectedMenage = selectedTypes.find(t => isMenageType(t));
    
    return selectedCuisine !== undefined && selectedMenage !== undefined;
  };

  // Handle reservation for Ménage + cuisine
  const handleReserveMenageCuisine = () => {
    if (!canReserve()) return;
    
    const selectedCuisine = selectedTypes.find(t => isCuisineType(t));
    const selectedMenage = selectedTypes.find(t => isMenageType(t));
    
    const prefill = {
      serviceTitle: service?.name || service?.title,
      categoryTitle: category?.name,
      selectedTypes: selectedTypes.map(t => ({ 
        id: t.id, 
        name: t.name,
        category: isCuisineType(t) ? 'Cuisine' : 'Ménage'
      })),
      message: `Catégorie: ${category?.name}, Cuisine: ${selectedCuisine?.name}, Ménage: ${selectedMenage?.name}${surface ? `, Surface: ${surface} m²` : ''}`,
      type: `${selectedCuisine?.name} + ${selectedMenage?.name}`,
      size: surface || '',
      totalPrice: price || 0,
    };
    
    try {
      localStorage.setItem('booking_prefill', JSON.stringify(prefill));
      navigate('/booking');
    } catch (err) {
      console.error('Error saving prefill:', err);
      navigate('/booking');
    }
  };

  // Check if category is Ménage + cuisine
  const isMenageCuisineCategory = () => {
    return category && (
      category.name_fr === 'Ménage + cuisine' ||
      category.name_fr === 'Ménage et cuisine' ||
      category.name_en === 'Housekeeping + kitchen' ||
      category.name_en === 'Housekeeping and kitchen' ||
      category.name_ar === 'المنزل + المطبخ' ||
      category.name_ar === 'المنزل والمطبخ' ||
      category.name === 'Ménage + cuisine' ||
      category.name === 'Ménage et cuisine' ||
      category.name === 'Housekeeping + kitchen' ||
      category.name === 'Housekeeping and kitchen'
    );
  };

  // Check if category is Car Cleaning
  const isCarCleaningCategory = () => {
    return category && (
      category.name_fr === 'Nettoyage des voitures' ||
      category.name_en === 'Car Cleaning' ||
      category.name_ar === 'تنظيف السيارات' ||
      category.name === 'Nettoyage des voitures' ||
      category.name === 'Car Cleaning' ||
      category.name === 'تنظيف السيارات' ||
      (category.name_fr && category.name_fr.toLowerCase().includes('nettoyage des voitures')) ||
      (category.name_en && category.name_en.toLowerCase().includes('car cleaning')) ||
      (category.name_ar && category.name_ar.includes('تنظيف السيارات'))
    );
  };

  // Get types to display based on showAllTypes state
  const getDisplayTypes = () => {
    if (isMenageCuisineCategory()) {
      // For Ménage + cuisine, always show all types
      return allTypes.length > 0 ? allTypes : types;
    }
    if (showAllTypes) {
      // Show only other types (excluding the 4 default types)
      return allTypes.filter(type => !isDefaultKitchenType(type));
    }
    return types;
  };

  // Helper function to get the 4 default kitchen types configuration
  const getDefaultKitchenTypesConfig = () => [
    {
      keywords: ['المغربية', 'مغربية', 'Marocaine', 'Moroccan'],
      order: 1
    },
    {
      keywords: ['الإيطالية', 'إيطالية', 'Italienne', 'Italian'],
      order: 2
    },
    {
      keywords: ['العربية الخليجية', 'خليجية', 'Arabe du Golfe', 'Gulf Arab'],
      order: 3
    },
    {
      keywords: ['الدولية', 'دولية', 'Internationale', 'International'],
      order: 4
    }
  ];

  // Helper function to filter and sort default kitchen types
  const filterDefaultKitchenTypes = (typesArray) => {
    const defaultKitchenTypes = getDefaultKitchenTypesConfig();
    
    return typesArray
      .filter(type => {
        const typeName = (type.name || '').toLowerCase();
        const typeNameAr = (type.name_ar || '').toLowerCase();
        const typeNameFr = (type.name_fr || '').toLowerCase();
        const typeNameEn = (type.name_en || '').toLowerCase();
        
        return defaultKitchenTypes.some(allowed => {
          return allowed.keywords.some(keyword => {
            const keywordLower = keyword.toLowerCase();
            return typeName.includes(keywordLower) ||
                   typeNameAr.includes(keywordLower) ||
                   typeNameFr.includes(keywordLower) ||
                   typeNameEn.includes(keywordLower);
          });
        });
      })
      .map(type => {
        const typeName = (type.name || '').toLowerCase();
        const typeNameAr = (type.name_ar || '').toLowerCase();
        const typeNameFr = (type.name_fr || '').toLowerCase();
        const typeNameEn = (type.name_en || '').toLowerCase();
        
        for (const allowed of defaultKitchenTypes) {
          const matches = allowed.keywords.some(keyword => {
            const keywordLower = keyword.toLowerCase();
            return typeName.includes(keywordLower) ||
                   typeNameAr.includes(keywordLower) ||
                   typeNameFr.includes(keywordLower) ||
                   typeNameEn.includes(keywordLower);
          });
          
          if (matches) {
            return { ...type, _sortOrder: allowed.order };
          }
        }
        return { ...type, _sortOrder: 999 };
      })
      .sort((a, b) => (a._sortOrder || 999) - (b._sortOrder || 999))
      .map(({ _sortOrder, ...type }) => type);
  };

  if (loading) {
    return (
      <main className="services-page">
        <div className="loading-state">{t('services_page.loading')}</div>
      </main>
    );
  }

  if (error || !service || !category) {
    return (
      <main className="services-page">
        <div className="error-state">{error || t('services_page.loading_error')}</div>
        <Link to="/services" className="back-button">{t('services_page.category_details.back_to_services')}</Link>
      </main>
    );
  }

  return (
    <main className="services-page">
      <div className="category-details-header">
        <Link to={`/services/${serviceSlug}`} className="back-button">
          ← {t('services_page.back')}
        </Link>
        {isCarCleaningCategory() ? (
          <>
            <h1>🧾 {t('services_page.category_details.car_cleaning.title')}</h1>
            <h2>{t('services_page.category_details.car_cleaning.subtitle')}</h2>
          </>
        ) : (
          <>
        <h1>🧾 {t('services_page.category_details.title')}</h1>
        <h2>{category.name}</h2>
          </>
        )}
      </div>

      {/* Info banner for Ménage + cuisine selection rule */}
      {isMenageCuisineCategory() && (
        <div
          style={{
            margin: '12px 0 20px',
            padding: '10px 14px',
            backgroundColor: '#eff6ff',
            color: '#1e3a8a',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: 1.5
          }}
        >
          {t('services_page.menage_cuisine.selection_hint')}
        </div>
      )}

      {/* Warning message */}
      {warningMessage && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#ef4444',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
            zIndex: 10000,
            fontSize: '14px',
            fontWeight: '500',
            animation: 'fadeIn 0.3s ease-in',
            maxWidth: '90%',
            textAlign: 'center',
            pointerEvents: 'none'
          }}
        >
          {warningMessage}
        </div>
      )}

      {getDisplayTypes().length > 0 ? (
        <div className="types-grid">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3>{t('services_page.category_details.available_types')}</h3>
            {showAllTypes && allTypes.length > 0 && !isMenageCuisineCategory() && (
              <button
                onClick={() => {
                  setShowAllTypes(false);
                  // Reset to show only the 4 default types
                  const defaultTypes = filterDefaultKitchenTypes(allTypes);
                  setTypes(defaultTypes);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2563eb';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#3b82f6';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                }}
              >
                {i18n.language === 'ar' ? '← العودة للأنواع الأساسية' : 
                 i18n.language === 'fr' ? '← Retour aux types principaux' : 
                 '← Back to main types'}
              </button>
            )}
          </div>
          <div className="types-grid-container">
            {getDisplayTypes().map((type) => {
              const typeSlug = type.id ? type.id.toString() : (type.name || '').toLowerCase().replace(/\s+/g, '-');
              // Use image_url first, then fallback to image, then null
              let bgImage = type.image_url || type.image || null;
              
              if (bgImage) {
                // If image_url is relative path (starts with /serveces), add PUBLIC_URL
                if (bgImage.startsWith('/serveces')) {
                  bgImage = (process.env.PUBLIC_URL || '') + bgImage;
                }
                // If it's already a full URL (starts with http:// or https://), use as is
                // If it's from storage, API should return full URL, but handle relative paths too
                if (bgImage.startsWith('/') && !bgImage.startsWith('/serveces')) {
                  // Relative path from API root, construct full URL
                  const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
                  bgImage = apiBase + bgImage;
                }
              }
              
              // For Ménage + cuisine category, show cards with selection checkbox in top corner
              if (isMenageCuisineCategory()) {
                const selected = isTypeSelected(type);
                return (
                  <div
                    key={type.id}
                    className="type-card"
                    style={{
                      backgroundImage: bgImage 
                        ? `url(${bgImage})` 
                        : undefined,
                      backgroundSize: bgImage ? 'cover' : undefined,
                      backgroundPosition: bgImage ? 'center' : undefined,
                      backgroundRepeat: bgImage ? 'no-repeat' : undefined,
                      cursor: 'default',
                      position: 'relative'
                    }}
                  >
                    {/* Checkbox icon in top-right corner */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTypeSelect(type);
                      }}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '32px',
                        height: '32px',
                        backgroundColor: selected ? '#10b981' : 'rgba(255, 255, 255, 0.95)',
                        border: selected ? '2px solid #10b981' : '2px solid #3b82f6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        transition: 'all 0.3s ease',
                        boxShadow: selected 
                          ? '0 2px 8px rgba(16, 185, 129, 0.4)' 
                          : '0 2px 6px rgba(0, 0, 0, 0.2)'
                      }}
                      onMouseEnter={(e) => {
                        if (!selected) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                          e.currentTarget.style.borderColor = '#2563eb';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        } else {
                          e.currentTarget.style.backgroundColor = '#059669';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.transform = 'scale(1)';
                        } else {
                          e.currentTarget.style.backgroundColor = '#10b981';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      {selected && (
                        <span style={{
                          color: '#fff',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          lineHeight: '1'
                        }}>✓</span>
                      )}
                    </div>
                    <h4>{type.name}</h4>
                    {/* Display options if available */}
                    {typeOptionsMap[type.id] && typeOptionsMap[type.id].length > 0 && (
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#fff',
                          marginBottom: '8px',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                        }}>
                          {i18n.language === 'ar' ? 'الخيارات:' : 
                           i18n.language === 'fr' ? 'Choix:' : 
                           'Options:'}
                        </div>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}>
                          {typeOptionsMap[type.id].map((option, idx) => (
                            <div
                              key={option.id || idx}
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                color: '#1f2937',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '500',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                              }}
                            >
                              {option.name || option.name_fr || option.name_ar || option.name_en}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              
              // Check if this is the International type and we're not showing all types yet
              const isInternational = isInternationalType(type);
              const shouldHandleClick = isInternational && !showAllTypes && allTypes.length > 0;
              
              const cardContent = (
                <div
                  className={`type-card ${shouldHandleClick ? 'type-card-clickable' : ''}`}
                  style={{
                    backgroundImage: bgImage 
                      ? `url(${bgImage})` 
                      : undefined,
                    backgroundSize: bgImage ? 'cover' : undefined,
                    backgroundPosition: bgImage ? 'center' : undefined,
                    backgroundRepeat: bgImage ? 'no-repeat' : undefined,
                    cursor: shouldHandleClick ? 'pointer' : undefined
                  }}
                  onClick={shouldHandleClick ? handleInternationalClick : undefined}
                >
                  <h4>{type.name}</h4>
                  {shouldHandleClick && (
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '12px',
                      color: '#fff',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      {i18n.language === 'ar' ? 'عرض الأنواع الأخرى' : 
                       i18n.language === 'fr' ? 'Afficher les autres types' : 
                       'Show other types'}
                    </div>
                  )}
                </div>
              );
              
              // If it's International and we haven't shown all types, make it clickable but not a link
              if (shouldHandleClick) {
                return (
                  <div key={type.id}>
                    {cardContent}
                  </div>
                );
              }
              
              // Otherwise, render as a normal link
              const typeOptions = typeOptionsMap[type.id];
              return (
                <div key={type.id} style={{ position: 'relative' }}>
                  <Link
                    to={`/services/${serviceSlug}/${categorySlug}/${typeSlug}`}
                    className="type-card"
                    style={{
                      backgroundImage: bgImage 
                        ? `url(${bgImage})` 
                        : undefined,
                      backgroundSize: bgImage ? 'cover' : undefined,
                      backgroundPosition: bgImage ? 'center' : undefined,
                      backgroundRepeat: bgImage ? 'no-repeat' : undefined
                    }}
                  >
                    <h4>{type.name}</h4>
                  </Link>
                  {/* Display options below the card if available */}
                  {typeOptions && typeOptions.length > 0 && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '6px'
                      }}>
                        {i18n.language === 'ar' ? 'الخيارات:' : 
                         i18n.language === 'fr' ? 'Choix:' : 
                         'Options:'}
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        {typeOptions.map((option, idx) => (
                          <div
                            key={option.id || idx}
                            style={{
                              backgroundColor: '#fff',
                              color: '#1f2937',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500',
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                            }}
                          >
                            {option.name || option.name_fr || option.name_ar || option.name_en}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Reserve button for Ménage + cuisine - shows only when both types are selected */}
          {isMenageCuisineCategory() && canReserve() && (
            <div style={{
              marginTop: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px'
            }}>
              <button
                onClick={handleReserveMenageCuisine}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
                }}
              >
                <span>✓</span>
                {i18n.language === 'ar' ? 'احجز الآن' : 
                 i18n.language === 'fr' ? 'Réserver' : 
                 'Reserve'}
              </button>
            </div>
          )}

          {/* Reserve button for Car Cleaning category when there are types */}
          {isCarCleaningCategory() && getDisplayTypes().length > 0 && (
            <div style={{
              marginTop: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              flexDirection: 'column'
            }}>
              <button
                onClick={handleReserve}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
                }}
              >
                <span>✓</span>
                {t('services_page.forms.reserve')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="category-details-content">
          {/* Special Section for Car Cleaning Category */}
          {isCarCleaningCategory() ? (
            <>
              <div className="description-section">
                <h3>🧹 {t('services_page.category_details.description_label')}</h3>
                <p>{category.description || t('services_page.category_details.car_cleaning.description')}</p>
              </div>

              <div className="actions-section" style={{ marginTop: '2rem' }}>
                <button 
                  onClick={handleReserve}
                  className="reserve-button"
                  style={{
                    padding: '14px 32px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#059669';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#10b981';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
                  }}
                >
                  <span>✓</span>
                  {t('services_page.forms.reserve')}
                </button>
                <Link to="/services" className="back-services-button" style={{ marginTop: '16px', display: 'block', textAlign: 'center' }}>
                  {t('services_page.category_details.back_to_services')}
                </Link>
              </div>
            </>
          ) : (
            <>
          <div className="description-section">
            <h3>🧹 {t('services_page.category_details.description_label')}</h3>
            <p>{category.description || t('services_page.category_details.description_text')}</p>
          </div>

          {/* Special Dynamic Form for Carpets/Sofas Categories */}
          {isCarpetSofaCategory() ? (
            <div className="carpet-sofa-form-container" style={{ direction: 'rtl' }}>
              {/* Special Offer Card for "Both" Option (category 16) */}
              {carpetSofaForm.serviceType === 'both' && (
                <div className="special-offer-card">
                  <div className="offer-header">
                    <span className="offer-icon">✨</span>
                    <h3>العرض الشامل</h3>
                  </div>
                  <div className="offer-items">
                    <div className="offer-item">
                      <span className="item-icon">🛋️</span>
                      <span className="item-text">6م أرائك</span>
                    </div>
                    <div className="offer-item">
                      <span className="item-icon">🧶</span>
                      <span className="item-text">3 × 2.5م سجاد</span>
                    </div>
                    <div className="offer-item">
                      <span className="item-icon">🛏️</span>
                      <span className="item-text">2 أسرّة مضادة للبكتيريا</span>
                    </div>
                  </div>
                  <div className="offer-price">
                    <span className="price-label">💰 السعر:</span>
                    <span className="price-value">800 د.م</span>
                  </div>
                </div>
              )}

              {/* Dynamic Form for Carpets or Sofas Only */}
              {(carpetSofaForm.serviceType === 'carpets' || carpetSofaForm.serviceType === 'sofas') && (
                <div className="dynamic-form-container">
                  <div className="count-input-group">
                    <label htmlFor="item-count">
                      {carpetSofaForm.serviceType === 'carpets' ? '📏 عدد السجاد' : '📏 عدد الأرائك'}
                    </label>
                    <input
                      id="item-count"
                      type="number"
                      min="1"
                      max="10"
                      value={carpetSofaForm.count}
                      onChange={(e) => handleCountChange(e.target.value)}
                      placeholder="أدخل العدد"
                      className="count-input"
                    />
                  </div>

                  {/* Dynamic Items Fields */}
                  {carpetSofaForm.items.length > 0 && (
                    <div className="items-fields-container">
                      {carpetSofaForm.items.map((item, index) => (
                        <div key={index} className="item-field-group">
                          <h4 className="item-title">
                            {carpetSofaForm.serviceType === 'carpets' 
                              ? `السجادة ${index + 1}:` 
                              : `الأريكة ${index + 1}:`}
                          </h4>
                          <div className="dimensions-inputs">
                            <div className="dimension-input">
                              <label>الطول (م):</label>
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={item.length}
                                onChange={(e) => handleItemChange(index, 'length', e.target.value)}
                                placeholder="0.0"
                              />
                            </div>
                            <div className="dimension-input">
                              <label>العرض (م):</label>
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={item.width}
                                onChange={(e) => handleItemChange(index, 'width', e.target.value)}
                                placeholder="0.0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Calculation Result */}
                  {calculateCarpetSofaArea() > 0 && (
                    <div className="calculation-result-card">
                      <div className="result-item">
                        <span className="result-icon">📐</span>
                        <span className="result-label">المساحة الإجمالية:</span>
                        <span className="result-value">{calculateCarpetSofaArea().toFixed(2)} م²</span>
                      </div>
                      <div className="result-item">
                        <span className="result-icon">💰</span>
                        <span className="result-label">السعر المقدر:</span>
                        <span className="result-value price-value">{calculateCarpetSofaPrice().toFixed(2)} د.م</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reserve Button */}
              <div className="actions-section" style={{ marginTop: '2rem' }}>
                <button 
                  onClick={() => {
                    const prefill = {
                      serviceTitle: service?.name || service?.title,
                      message: `Catégorie: ${category?.name}${carpetSofaForm.serviceType === 'both' ? ', العرض الشامل' : calculateCarpetSofaArea() > 0 ? `, المساحة: ${calculateCarpetSofaArea().toFixed(2)} م²` : ''}`,
                      type: category?.name || '',
                      size: carpetSofaForm.serviceType === 'both' ? 'عرض شامل' : calculateCarpetSofaArea().toFixed(2) || '',
                      totalPrice: carpetSofaForm.serviceType === 'both' ? 800 : calculateCarpetSofaPrice() || 0,
                    };
                    try {
                      localStorage.setItem('booking_prefill', JSON.stringify(prefill));
                      navigate('/booking');
                    } catch (err) {
                      console.error('Error saving prefill:', err);
                      navigate('/booking');
                    }
                  }}
                  className="reserve-button"
                  disabled={carpetSofaForm.serviceType !== 'both' && calculateCarpetSofaArea() === 0}
                >
                  {t('services_page.forms.reserve')}
                </button>
                <Link to="/services" className="back-services-button">
                  {t('services_page.category_details.back_to_services')}
                </Link>
              </div>
            </div>
          ) : (
            /* Standard Form for Other Categories */
            <>
              <div className="form-section">
                <label htmlFor="surface">
                  📏 {t('services_page.forms.estimated_surface')}
                </label>
                <input
                  type="number"
                  id="surface"
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                  placeholder={t('services_page.forms.surface_placeholder')}
                  min="0"
                  step="0.5"
                />
              </div>

              <div className="price-section">
                <h3>💰 {t('services_page.forms.estimated_price')}</h3>
                <p className="price-value">{price.toFixed(2)} DH</p>
              </div>

              <div className="actions-section">
                <button onClick={handleReserve} className="reserve-button">
                  {t('services_page.forms.reserve')}
                </button>
                <Link to="/services" className="back-services-button">
                  {t('services_page.category_details.back_to_services')}
                </Link>
              </div>
            </>
          )}
            </>
          )}
        </div>
      )}
    </main>
  );
}


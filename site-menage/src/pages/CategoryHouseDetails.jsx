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
  const [selectedSingleType, setSelectedSingleType] = useState(null); // Store single selected type for menage/1 page
  const [categoriesHouseMap, setCategoriesHouseMap] = useState({}); // Map category_house_id to category info
  const [warningMessage, setWarningMessage] = useState(''); // Warning message for selection limits
  const [typeOptionsMap, setTypeOptionsMap] = useState({}); // Map type_id to options array
  const [menageTypes, setMenageTypes] = useState([]); // Types for Menage category
  const [cuisineTypes, setCuisineTypes] = useState([]); // Types for Cuisine category
  const [menageCategory, setMenageCategory] = useState(null); // Menage category info
  const [cuisineCategory, setCuisineCategory] = useState(null); // Cuisine category info
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

  // Helper: récupérer le tarif/m² basé sur la catégorie (si défini en base), sinon 2.5 par défaut
  const getCategoryRate = () => {
    if (category && category.price !== null && category.price !== undefined) {
      const p = parseFloat(category.price);
      if (!isNaN(p) && p > 0) {
        return p;
      }
    }
    return 2.5;
  };

  useEffect(() => {
    // Calculer le prix en fonction de la surface avec le tarif de la catégorie (ou 2.5 par défaut)
    if (surface && !isNaN(parseFloat(surface))) {
      setPrice(parseFloat(surface) * getCategoryRate());
    } else {
      setPrice(0);
    }
  }, [surface, category]);

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

  // Calculate price for carpets/sofas
  const calculateCarpetSofaPrice = () => {
    const totalArea = calculateCarpetSofaArea();
    const categoryId = parseInt(categorySlug);
    
    // For tapis (category 14), use 15 DH per m²
    if (categoryId === 14) {
      return totalArea * 15;
    }
    
    // For canapés (category 15), special pricing
    if (categoryId === 15) {
      // If area ≤ 8 m², fixed price of 800 DH
      if (totalArea <= 8) {
        return 800;
      }
      // If area > 8 m², price = area × 100 DH
      return totalArea * 100;
    }
    
    // Default price for other categories (both, etc.)
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
      
      // For Ménage + cuisine category, load types for Menage and Cuisine separately
      if (isMenageCuisineCategory) {
        // Load all categories house to find Menage and Cuisine categories
        const categoriesData = await getCategoriesHouse(i18n.language, foundService.id);
        const categoriesArray = Array.isArray(categoriesData) 
          ? categoriesData 
          : (categoriesData.data || []);
        
        // Find Menage category
        const menageCat = categoriesArray.find(cat => 
          cat.name_fr === 'Ménage' ||
          cat.name_en === 'Housekeeping' ||
          cat.name_ar === 'التنظيف' ||
          cat.name_ar === 'التدبير المنزلي' ||
          cat.name === 'Ménage' ||
          cat.name === 'Housekeeping' ||
          cat.name === 'التنظيف' ||
          (cat.name_fr && cat.name_fr.toLowerCase().includes('ménage')) ||
          (cat.name_en && cat.name_en.toLowerCase().includes('housekeeping')) ||
          (cat.name_ar && (cat.name_ar.includes('تنظيف') || cat.name_ar.includes('تدبير')))
        );
        
        // Find Cuisine category
        const cuisineCat = categoriesArray.find(cat => 
          cat.name_fr === 'Cuisine' ||
          cat.name_en === 'Kitchen' ||
          cat.name_ar === 'المطبخ' ||
          cat.name === 'Cuisine' ||
          cat.name === 'Kitchen' ||
          cat.name === 'المطبخ' ||
          (cat.name_fr && cat.name_fr.toLowerCase().includes('cuisine')) ||
          (cat.name_en && cat.name_en.toLowerCase().includes('kitchen')) ||
          (cat.name_ar && cat.name_ar.includes('مطبخ'))
        );
        
        // Store category info
        setMenageCategory(menageCat || null);
        setCuisineCategory(cuisineCat || null);
        
        // Fetch types for Menage category
        let menageTypesArray = [];
        if (menageCat) {
          const menageTypesData = await getTypes(i18n.language, null, menageCat.id);
          menageTypesArray = Array.isArray(menageTypesData) 
            ? menageTypesData 
            : (menageTypesData.data || []);
          setMenageTypes(menageTypesArray);
        } else {
          setMenageTypes([]);
        }
        
        // Fetch types for Cuisine category
        let cuisineTypesArray = [];
        if (cuisineCat) {
          const cuisineTypesData = await getTypes(i18n.language, null, cuisineCat.id);
          cuisineTypesArray = Array.isArray(cuisineTypesData) 
            ? cuisineTypesData 
            : (cuisineTypesData.data || []);
          setCuisineTypes(cuisineTypesArray);
        } else {
          setCuisineTypes([]);
        }
        
        // Create a map of category_house_id to category info
        const categoriesMap = {};
        categoriesArray.forEach(cat => {
          categoriesMap[cat.id] = cat;
        });
        setCategoriesHouseMap(categoriesMap);
        
        // For backward compatibility, also set allTypes
        const allMenageAndCuisineTypes = [...menageTypesArray, ...cuisineTypesArray];
        setAllTypes(allMenageAndCuisineTypes);
        typesArray = allMenageAndCuisineTypes;
        
        // Load options for Menage and Cuisine types separately
        if (menageTypesArray.length > 0) {
          await loadTypeOptions(menageTypesArray);
        }
        if (cuisineTypesArray.length > 0) {
          await loadTypeOptions(cuisineTypesArray);
        }
      } else if (isKitchenCategory) {
        // Store all types for kitchen category
        setAllTypes(typesArray);
        // For Cuisine category, show all types directly (no filtering)
        // typesArray already contains all types for this category
      } else {
        setAllTypes([]);
      }
      
      setTypes(typesArray);
      setShowAllTypes(false); // Reset to default view when loading new data
      setSelectedTypes([]); // Reset selected types when loading new data
      setCategoriesHouseMap({}); // Reset categories map
      setWarningMessage(''); // Reset warning message
      
      // Reset Menage and Cuisine types if not in Ménage + cuisine category
      if (!isMenageCuisineCategory) {
        setMenageTypes([]);
        setCuisineTypes([]);
        setMenageCategory(null);
        setCuisineCategory(null);
      }
      
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

  // Handle type selection for Ménage + cuisine with restrictions, or simple selection for kitchen category
  const handleTypeSelect = (type) => {
    const isSelected = selectedTypes.some(t => t.id === type.id);
    
    if (isSelected) {
      // Remove if already selected
      const updated = selectedTypes.filter(t => t.id !== type.id);
      setSelectedTypes(updated);
      console.log('Type deselected:', type.name, 'Remaining selected:', updated);
      return;
    }
    
    // For kitchen category only (not Ménage + cuisine), allow multiple selections
    if (isKitchenCategoryCheck() && !isMenageCuisineCategory()) {
      const updated = [...selectedTypes, type];
      setSelectedTypes(updated);
      console.log('✅ Kitchen type selected:', type.name, 'Total selected:', updated.length);
      return;
    }
    
    // Check restrictions before adding (for Ménage + cuisine category)
    const isCuisine = isCuisineType(type);
    const isMenage = isMenageType(type);
    
    console.log('=== Type Selection Check ===');
    console.log('Type:', {
      id: type.id,
      name: type.name,
      name_fr: type.name_fr,
      name_en: type.name_en,
      name_ar: type.name_ar,
      category_house_id: type.category_house_id
    });
    console.log('Type classification:', { isCuisine, isMenage });
    console.log('Current selected types:', selectedTypes.length);
    console.log('Selected types details:', selectedTypes.map(t => ({
      id: t.id,
      name: t.name,
      isCuisine: isCuisineType(t),
      isMenage: isMenageType(t)
    })));
    
    // Check if user already selected one from the same category
    const selectedCuisine = selectedTypes.find(t => isCuisineType(t));
    const selectedMenage = selectedTypes.find(t => isMenageType(t));
    
    console.log('Already selected Cuisine:', selectedCuisine ? { id: selectedCuisine.id, name: selectedCuisine.name } : null);
    console.log('Already selected Menage:', selectedMenage ? { id: selectedMenage.id, name: selectedMenage.name } : null);
    
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
    const isMenageCuisine = isMenageCuisineCategory();
    console.log('🔍 canReserve check:', {
      isMenageCuisine,
      selectedTypesCount: selectedTypes.length,
      selectedTypes: selectedTypes.map(t => ({ id: t.id, name: t.name }))
    });
    
    if (!isMenageCuisine) {
      console.log('❌ Not Ménage + cuisine category');
      return false;
    }
    
    const selectedCuisine = selectedTypes.find(t => isCuisineType(t));
    const selectedMenage = selectedTypes.find(t => isMenageType(t));
    
    // Must have exactly one Cuisine type and exactly one Menage type
    const cuisineCount = selectedTypes.filter(t => isCuisineType(t)).length;
    const menageCount = selectedTypes.filter(t => isMenageType(t)).length;
    
    console.log('🔍 Selection details:', {
      selectedCuisine: selectedCuisine ? { id: selectedCuisine.id, name: selectedCuisine.name } : null,
      selectedMenage: selectedMenage ? { id: selectedMenage.id, name: selectedMenage.name } : null,
      cuisineCount,
      menageCount
    });
    
    const canReserveResult = selectedCuisine !== undefined && 
           selectedMenage !== undefined && 
           cuisineCount === 1 && 
           menageCount === 1;
    
    console.log('✅ canReserve result:', canReserveResult);
    return canReserveResult;
  };

  // Check if at least one kitchen type is selected (for kitchen category only)
  const canReserveKitchen = () => {
    if (!isKitchenCategoryCheck() || isMenageCuisineCategory()) return false;
    return selectedTypes.length > 0;
  };

  // Check if a type is selected for menage/1 page (single selection)
  const canReserveMenageSingle = () => {
    if (!isMenageSingleSelectionPage()) return false;
    return selectedSingleType !== null;
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

  // Handle reservation for Kitchen category only
  const handleReserveKitchen = () => {
    if (!canReserveKitchen()) return;
    
    const prefill = {
      serviceTitle: service?.name || service?.title,
      categoryTitle: category?.name,
      selectedTypes: selectedTypes.map(t => ({ 
        id: t.id, 
        name: t.name,
        category: 'Cuisine'
      })),
      message: `Catégorie: ${category?.name}, Types sélectionnés: ${selectedTypes.map(t => t.name).join(', ')}${surface ? `, Surface: ${surface} m²` : ''}`,
      type: selectedTypes.map(t => t.name).join(' + '),
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

  // Handle reservation for menage/1 page (single selection)
  const handleReserveMenageSingle = () => {
    if (!canReserveMenageSingle()) return;
    
    const prefill = {
      serviceTitle: service?.name || service?.title,
      categoryTitle: category?.name,
      selectedTypes: [{
        id: selectedSingleType.id,
        name: selectedSingleType.name,
        category: 'Ménage'
      }],
      message: `Catégorie: ${category?.name}, Type sélectionné: ${selectedSingleType.name}${surface ? `, Surface: ${surface} m²` : ''}`,
      type: selectedSingleType.name,
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

  // Check if this is menage/1 page (single selection mode)
  const isMenageSingleSelectionPage = () => {
    return serviceSlug === 'menage' && categorySlug === '1';
  };

  // Handle single type selection for menage/1 page (only one card can be selected)
  const handleSingleTypeSelect = (type) => {
    if (isMenageSingleSelectionPage()) {
      // If clicking the same card, deselect it
      if (selectedSingleType && selectedSingleType.id === type.id) {
        setSelectedSingleType(null);
      } else {
        // Select only this card (replace any previous selection)
        setSelectedSingleType(type);
      }
    }
  };

  // Check if a type is selected (for single selection mode)
  const isSingleTypeSelected = (type) => {
    return selectedSingleType && selectedSingleType.id === type.id;
  };

  // Check if category is Ménage + cuisine
  const isMenageCuisineCategory = () => {
    if (!category) {
      console.log('❌ isMenageCuisineCategory: No category');
      return false;
    }
    
    const result = (
      category.name_fr === 'Ménage + cuisine' ||
      category.name_fr === 'Ménage et cuisine' ||
      category.name_en === 'Housekeeping + kitchen' ||
      category.name_en === 'Housekeeping and kitchen' ||
      category.name_ar === 'المنزل + المطبخ' ||
      category.name_ar === 'المنزل والمطبخ' ||
      category.name === 'Ménage + cuisine' ||
      category.name === 'Ménage et cuisine' ||
      category.name === 'Housekeeping + kitchen' ||
      category.name === 'Housekeeping and kitchen' ||
      category.id === 13 || // Also check by ID for /services/menage/13
      (serviceSlug === 'menage' && categorySlug === '13')
    );
    
    console.log('🔍 isMenageCuisineCategory check:', {
      categoryId: category.id,
      categoryName: category.name,
      categoryNameFr: category.name_fr,
      categoryNameEn: category.name_en,
      categoryNameAr: category.name_ar,
      serviceSlug,
      categorySlug,
      result
    });
    
    return result;
  };

  // Check if category is Ménage (only, not Ménage + cuisine)
  const isMenageCategory = () => {
    if (!category) {
      return false;
    }
    
    // Check if it's Ménage category (not Ménage + cuisine)
    const isMenage = (
      category.name_fr === 'Ménage' ||
      category.name_en === 'Housekeeping' ||
      category.name_ar === 'التنظيف' ||
      category.name_ar === 'التدبير المنزلي' ||
      category.name === 'Ménage' ||
      category.name === 'Housekeeping' ||
      category.name === 'التنظيف' ||
      (category.name_fr && category.name_fr.toLowerCase().includes('ménage') && !category.name_fr.includes('+') && !category.name_fr.includes('et')) ||
      (category.name_en && category.name_en.toLowerCase().includes('housekeeping') && !category.name_en.includes('+') && !category.name_en.includes('and')) ||
      (category.name_ar && (category.name_ar.includes('تنظيف') || category.name_ar.includes('تدبير')) && !category.name_ar.includes('+') && !category.name_ar.includes('و'))
    );
    
    // Also check by route: /services/menage/1
    const isMenageRoute = serviceSlug === 'menage' && categorySlug === '1';
    
    return isMenage || isMenageRoute;
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

  // Check if category is Washing (Lavage) or Ironing (Repassage)
  const isWashingOrIroningCategory = () => {
    if (!category) return false;
    
    const name = (category.name || '').toLowerCase();
    const nameFr = (category.name_fr || '').toLowerCase();
    const nameEn = (category.name_en || '').toLowerCase();
    const nameAr = (category.name_ar || '').toLowerCase();
    
    // Check for Washing/Lavage/غسيل
    const isWashing = 
      name === 'lavage' ||
      name === 'washing' ||
      name === 'غسيل' ||
      nameFr === 'lavage' ||
      nameFr === 'lavage du linge' ||
      nameEn === 'washing' ||
      nameEn === 'laundry washing' ||
      nameAr === 'غسيل' ||
      nameAr === 'الغسيل' ||
      nameFr.includes('lavage') ||
      nameEn.includes('washing') ||
      nameAr.includes('غسيل');
    
    // Check for Ironing/Repassage/كيّ
    const isIroning = 
      name === 'repassage' ||
      name === 'ironing' ||
      name === 'كيّ' ||
      nameFr === 'repassage' ||
      nameEn === 'ironing' ||
      nameAr === 'كيّ' ||
      nameAr === 'الكي' ||
      nameFr.includes('repassage') ||
      nameEn.includes('ironing') ||
      nameAr.includes('كيّ') ||
      nameAr.includes('كي');
    
    return isWashing || isIroning;
  };

  // Check if category is Cuisine/Kitchen
  const isKitchenCategoryCheck = () => {
    return category && (
      category.name_fr === 'Cuisine' ||
      category.name_en === 'Kitchen' ||
      category.name_ar === 'المطبخ' ||
      category.name === 'Cuisine' ||
      category.name === 'Kitchen' ||
      category.name === 'المطبخ'
    );
  };

  // Get types to display based on showAllTypes state
  const getDisplayTypes = () => {
    if (isMenageCuisineCategory()) {
      // For Ménage + cuisine, always show all types
      return allTypes.length > 0 ? allTypes : types;
    }
    if (isKitchenCategoryCheck()) {
      // For Cuisine category, always show all types
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
        <Link 
          to={isMenageCategory() ? '/services' : (serviceSlug ? `/services/${serviceSlug}` : '/services')} 
          className="back-button"
        >
          {t('services_page.category_details.back_to_services')}
        </Link>
      </main>
    );
  }

  return (
    <main className="services-page">
      <div className="category-details-header">
        <Link 
          to={isMenageCategory() ? '/services' : `/services/${serviceSlug}`} 
          className="back-button"
        >
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

      {/* Special display for Ménage + cuisine category - Two columns */}
      {isMenageCuisineCategory() && (menageTypes.length > 0 || cuisineTypes.length > 0) ? (
        <>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          columnGap: '40px',
          rowGap: '32px',
          marginTop: '32px',
          alignItems: 'flex-start'
        }}>
          {/* Left Column - Menage Types */}
          <div>
            <h3 style={{
              marginBottom: '20px',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              textAlign: 'center'
            }}>
              {i18n.language === 'ar' ? 'التنظيف' : 
               i18n.language === 'fr' ? 'Ménage' : 
               'Cleaning'}
            </h3>
            <div className="types-grid-container" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {menageTypes.map((type) => {
                const selected = isTypeSelected(type);
                let bgImage = type.image_url || type.image || null;
                
                if (bgImage) {
                  if (bgImage.startsWith('/serveces')) {
                    bgImage = (process.env.PUBLIC_URL || '') + bgImage;
                  }
                  if (bgImage.startsWith('/') && !bgImage.startsWith('/serveces')) {
                    const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
                    bgImage = apiBase + bgImage;
                  }
                }
                
                return (
                  <div
                    key={type.id}
                    className="type-card"
                    style={{
                      backgroundImage: bgImage ? `url(${bgImage})` : undefined,
                      backgroundSize: bgImage ? 'cover' : undefined,
                      backgroundPosition: bgImage ? 'center' : undefined,
                      backgroundRepeat: bgImage ? 'no-repeat' : undefined,
                      cursor: 'default',
                      position: 'relative'
                    }}
                  >
                    {/* Selection button */}
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
                    {type.price !== null && type.price !== undefined && !isNaN(parseFloat(type.price)) && (
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#10b981',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                      }}>
                        {parseFloat(type.price).toFixed(2)} DH / m²
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - Cuisine Types */}
          <div>
            <h3 style={{
              marginBottom: '20px',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              textAlign: 'center'
            }}>
              {i18n.language === 'ar' ? 'مطبخ' : 
               i18n.language === 'fr' ? 'Cuisine' : 
               'Cooking'}
            </h3>
            <div className="types-grid-container" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {cuisineTypes.map((type) => {
                const selected = isTypeSelected(type);
                let bgImage = type.image_url || type.image || null;
                
                if (bgImage) {
                  if (bgImage.startsWith('/serveces')) {
                    bgImage = (process.env.PUBLIC_URL || '') + bgImage;
                  }
                  if (bgImage.startsWith('/') && !bgImage.startsWith('/serveces')) {
                    const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
                    bgImage = apiBase + bgImage;
                  }
                }
                
                return (
                  <div
                    key={type.id}
                    className="type-card"
                    style={{
                      backgroundImage: bgImage ? `url(${bgImage})` : undefined,
                      backgroundSize: bgImage ? 'cover' : undefined,
                      backgroundPosition: bgImage ? 'center' : undefined,
                      backgroundRepeat: bgImage ? 'no-repeat' : undefined,
                      cursor: 'default',
                      position: 'relative'
                    }}
                  >
                    {/* Selection button */}
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
                    {type.price !== null && type.price !== undefined && !isNaN(parseFloat(type.price)) && (
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#10b981',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                      }}>
                        {parseFloat(type.price).toFixed(2)} DH 
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Reserve button for Ménage + cuisine - shows only when both types are selected */}
        {/* Button is outside the grid to prevent layout shifts */}
        <div style={{
          width: '100%',
          minHeight: canReserve() ? 'auto' : '0px',
          marginTop: '32px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          opacity: canReserve() ? 1 : 0,
          transform: canReserve() ? 'translateY(0)' : 'translateY(-10px)',
          pointerEvents: canReserve() ? 'auto' : 'none',
          visibility: canReserve() ? 'visible' : 'hidden'
        }}>
          {canReserve() && (
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
              <span>📅</span>
              {i18n.language === 'ar' ? 'احجز الآن' : 
               i18n.language === 'fr' ? 'Réserver maintenant' : 
               'Reserve now'}
            </button>
          )}
        </div>
        </>
      ) : getDisplayTypes().length > 0 ? (
        <div className="types-grid">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3>{t('services_page.category_details.available_types')}</h3>
            {showAllTypes && allTypes.length > 0 && !isMenageCuisineCategory() && !isKitchenCategoryCheck() && (
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
                    {type.price !== null && type.price !== undefined && !isNaN(parseFloat(type.price)) && (
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#10b981',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        zIndex: 5
                      }}>
                        {parseFloat(type.price).toFixed(2)} DH / m²
                      </div>
                    )}
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
              const shouldHandleClick = isInternational && !showAllTypes && allTypes.length > 0 && !isKitchenCategoryCheck();
              
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
              
              // Otherwise, render as a normal link or with select button for kitchen category
              const typeOptions = typeOptionsMap[type.id];
              const isKitchenPage = isKitchenCategoryCheck();
              const selected = isKitchenPage ? isTypeSelected(type) : false;
              
              return (
                <div key={type.id} style={{ position: 'relative' }}>
                  {!isKitchenPage ? (
                    <Link
                      to={`/services/${serviceSlug}/${categorySlug}/${typeSlug}`}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      <div
                        className="type-card"
                        style={{
                          backgroundImage: bgImage 
                            ? `url(${bgImage})` 
                            : undefined,
                          backgroundSize: bgImage ? 'cover' : undefined,
                          backgroundPosition: bgImage ? 'center' : undefined,
                          backgroundRepeat: bgImage ? 'no-repeat' : undefined,
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        <h4>{type.name}</h4>
                        {type.price !== null && type.price !== undefined && !isNaN(parseFloat(type.price)) && (
                          <div style={{
                            position: 'absolute',
                            bottom: '12px',
                            left: '12px',
                            right: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#10b981',
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                          }}>
                            {parseFloat(type.price).toFixed(2)} DH / m²
                          </div>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div
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
                      {/* Selection button for kitchen category */}
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
                      {type.price !== null && type.price !== undefined && !isNaN(parseFloat(type.price)) && (
                        <div style={{
                          position: 'absolute',
                          bottom: '12px',
                          left: '12px',
                          right: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#10b981',
                          textAlign: 'center',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                        }}>
                          {parseFloat(type.price).toFixed(2)} DH
                        </div>
                      )}
                    </div>
                  )}
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

          {/* Reserve button for Kitchen category - shows when at least one type is selected */}
          {isKitchenCategoryCheck() && !isMenageCuisineCategory() && canReserveKitchen() && (
            <div style={{
              marginTop: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px'
            }}>
              <button
                onClick={handleReserveKitchen}
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
                <span>📅</span>
                {i18n.language === 'ar' ? 'احجز الآن' : 
                 i18n.language === 'fr' ? 'Réserver maintenant' : 
                 'Reserve now'}
              </button>
            </div>
          )}

          {/* Reserve button for menage/1 page - shows when a type is selected */}
          {isMenageSingleSelectionPage() && canReserveMenageSingle() && (
            <div style={{
              marginTop: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px'
            }}>
              <button
                onClick={handleReserveMenageSingle}
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
                <span>📅</span>
                {i18n.language === 'ar' ? 'احجز الآن' : 
                 i18n.language === 'fr' ? 'Réserver maintenant' : 
                 'Reserve now'}
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
                <Link 
                  to={isMenageCategory() ? '/services' : `/services/${serviceSlug}`} 
                  className="back-services-button" 
                  style={{ marginTop: '16px', display: 'block', textAlign: 'center' }}
                >
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
                <Link 
                  to={isMenageCategory() ? '/services' : `/services/${serviceSlug}`} 
                  className="back-services-button"
                >
                  {t('services_page.category_details.back_to_services')}
                </Link>
              </div>
            </div>
          ) : (
            /* Standard Form for Other Categories */
            <>
              {/* Hide surface and price estimation for Washing/Lavage and Ironing/Repassage categories */}
              {!isWashingOrIroningCategory() && (
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
                </>
              )}

              <div className="actions-section">
                <button onClick={handleReserve} className="reserve-button">
                  {t('services_page.forms.reserve')}
                </button>
                <Link 
                  to={isMenageCategory() ? '/services' : `/services/${serviceSlug}`} 
                  className="back-services-button"
                >
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


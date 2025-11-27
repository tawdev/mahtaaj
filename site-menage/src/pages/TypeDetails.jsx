import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTypeById, getCategoryHouseById, getTypeOptions, getTypes } from '../api-supabase';
import './Services.css';

export default function TypeDetails() {
  const {
    serviceSlug,
    categorySlug,
    typeSlug,
    categoryId,
    subCategoryId,
    typeId,
  } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [type, setType] = useState(null);
  const [category, setCategory] = useState(null);
  const [typeOptions, setTypeOptions] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [selectedTypeOption, setSelectedTypeOption] = useState(null);
  const [selectedKitchens, setSelectedKitchens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [surface, setSurface] = useState('');
  const [price, setPrice] = useState(0);

  useEffect(() => {
    // Only load if we have a typeSlug or typeId (this is TypeDetails page, not CategoryHouseDetails)
    // Reset state when route changes
    if (typeSlug || typeId) {
      // Reset states to prevent data mixing between routes
      setType(null);
      setCategory(null);
      setTypeOptions([]);
      setCategoryTypes([]);
      setSelectedTypeOption(null);
      setSelectedKitchens([]);
      setError('');
      loadType();
    } else {
      // If no typeSlug, this component shouldn't be active
      // Reset all states to prevent interference
      setType(null);
      setCategory(null);
      setTypeOptions([]);
      setCategoryTypes([]);
      setSelectedTypeOption(null);
      setSelectedKitchens([]);
      setLoading(false);
      setError('');
    }
  }, [serviceSlug, categorySlug, typeSlug, categoryId, subCategoryId, typeId]);

  useEffect(() => {
    if (surface && !isNaN(parseFloat(surface))) {
      setPrice(parseFloat(surface) * 2.5);
    } else {
      setPrice(0);
    }
  }, [surface]);

  const loadType = async () => {
    // Early return if no typeSlug or typeId - this should not happen but safety check
    if (!typeSlug && !typeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const idCandidate = parseInt(typeId || typeSlug);
      if (isNaN(idCandidate)) {
        setError('Type ID invalide');
        setLoading(false);
        return;
      }

      let fetched;
      try {
        fetched = await getTypeById(idCandidate, i18n.language);
        fetched = fetched?.data || fetched;
      } catch (_) {
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${API_BASE_URL}/api/types/${idCandidate}?lang=${i18n.language}`);
        if (!res.ok) throw new Error('Failed to fetch type');
        fetched = await res.json();
        fetched = fetched?.data || fetched;
      }

      if (!fetched) {
        setError('Type non trouvé');
        return;
      }

      setType(fetched);

      // Load category data if category_house_id is available
      const categoryHouseId = fetched?.category_house_id || categoryId || subCategoryId;
      console.log('Category House ID:', categoryHouseId);
      if (categoryHouseId) {
        try {
          const categoryData = await getCategoryHouseById(categoryHouseId, i18n.language);
          const categoryResult = categoryData?.data || categoryData;
          console.log('Category loaded:', categoryResult);
          if (categoryResult) {
            setCategory(categoryResult);
            
            // Check if this is a cuisine category and load all types for this category
            // Only load categoryTypes if we're on a TypeDetails page (typeSlug exists)
            // This prevents interference with CategoryHouseDetails page
            if (typeSlug || typeId) {
              const isCuisine = categoryResult && (
                categoryResult.name_ar === 'مطبخ' ||
                categoryResult.name_fr === 'Cuisine' ||
                categoryResult.name_en === 'Kitchen' ||
                categoryResult.name === 'Cuisine' ||
                categoryResult.name === 'مطبخ' ||
                categoryResult.name === 'Kitchen' ||
                (categoryResult.name_ar && categoryResult.name_ar.includes('مطبخ')) ||
                (categoryResult.name_fr && categoryResult.name_fr.toLowerCase().includes('cuisine')) ||
                (categoryResult.name_en && categoryResult.name_en.toLowerCase().includes('kitchen'))
              );
              
              if (isCuisine) {
                // Load all types for this category
                try {
                  const typesData = await getTypes(i18n.language, null, categoryHouseId);
                  const typesArray = Array.isArray(typesData) ? typesData : (typesData.data || []);
                  console.log('Category Types loaded:', typesArray);
                  setCategoryTypes(typesArray);
                } catch (typesErr) {
                  console.warn('Could not load category types:', typesErr);
                  setCategoryTypes([]);
                }
              }
            }
          }
        } catch (categoryErr) {
          console.warn('Could not load category:', categoryErr);
          // Don't fail the whole page if category loading fails
        }
      } else {
        console.warn('No category_house_id found in type data');
      }

      // Load type options for this type
      try {
        const optionsData = await getTypeOptions(idCandidate, i18n.language);
        const optionsArray = Array.isArray(optionsData) ? optionsData : (optionsData.data || []);
        console.log('Type Options loaded:', optionsArray);
        console.log('Type ID:', idCandidate);
        setTypeOptions(optionsArray);
      } catch (optionsErr) {
        console.warn('Could not load type options:', optionsErr);
        setTypeOptions([]);
      }
    } catch (err) {
      console.error('Error loading type:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = () => {
    // For cuisine categories, use multiple selections if available, otherwise fall back to single selection
    const selectedOptions = (isCuisineCategory() || isAsianCuisineCategory()) && selectedKitchens.length > 0
      ? selectedKitchens
      : selectedTypeOption ? [selectedTypeOption] : [];

    const prefill = {
      typeId: type?.id,
      typeName: type?.name_ar || type?.name || type?.name_fr || type?.name_en || '',
      description: type?.description_ar || type?.description || type?.description_fr || type?.description_en || '',
      surface: surface || '',
      estimatedPrice: price || 0,
      choixtype_id: selectedOptions.length === 1 ? selectedOptions[0]?.id : undefined,
      choixtype_name: selectedOptions.length === 1 
        ? (selectedOptions[0].name || selectedOptions[0].name_fr || selectedOptions[0].name_ar || selectedOptions[0].name_en)
        : undefined,
      choixtype_ids: selectedOptions.length > 0 ? selectedOptions.map(opt => opt.id) : undefined,
      choixtype_names: selectedOptions.length > 0 
        ? selectedOptions.map(opt => opt.name || opt.name_fr || opt.name_ar || opt.name_en)
        : undefined,
      selectedKitchens: selectedOptions,
    };

    try {
      localStorage.setItem('booking_prefill', JSON.stringify(prefill));
      // Also save selected kitchens separately for easy access
      localStorage.setItem('selected_kitchens', JSON.stringify(selectedKitchens));
    } catch (err) {
      console.error('Error saving prefill:', err);
    }

    const idCandidate = type?.id || parseInt(typeId || typeSlug) || '';
    navigate(`/reservation/${idCandidate}`, { state: { type, prefill, selectedKitchens } });
  };

  // Handle type option selection
  const handleTypeOptionSelect = (option) => {
    if (selectedTypeOption && selectedTypeOption.id === option.id) {
      // Deselect if already selected
      setSelectedTypeOption(null);
    } else {
      // Select the option
      setSelectedTypeOption(option);
    }
  };

  // Handle multiple kitchen selection
  const handleKitchenSelect = (option) => {
    setSelectedKitchens(prev => {
      const isSelected = prev.some(kitchen => kitchen.id === option.id);
      if (isSelected) {
        // Remove from selection
        return prev.filter(kitchen => kitchen.id !== option.id);
      } else {
        // Add to selection
        return [...prev, option];
      }
    });
  };

  // Check if a kitchen is selected
  const isKitchenSelected = (optionId) => {
    return selectedKitchens.some(kitchen => kitchen.id === optionId);
  };

  // Check if category is Asian Cuisine
  const isAsianCuisineCategory = () => {
    // Check category name
    const categoryMatch = category && (
      category.name_fr === 'Cuisine Asiatique' ||
      category.name_en === 'Asian Cuisine' ||
      category.name_ar === 'المطبخ الآسيوي' ||
      category.name === 'Cuisine Asiatique' ||
      category.name === 'Asian Cuisine' ||
      category.name === 'المطبخ الآسيوي' ||
      (category.name_ar && category.name_ar.includes('آسيوي')) ||
      (category.name_fr && category.name_fr.toLowerCase().includes('asiatique')) ||
      (category.name_en && category.name_en.toLowerCase().includes('asian'))
    );

    // Also check type name (in case type name contains "Asian" or "آسيوي")
    const typeMatch = type && (
      (type.name_ar && type.name_ar.includes('آسيوي')) ||
      (type.name_fr && type.name_fr.toLowerCase().includes('asiatique')) ||
      (type.name_en && type.name_en.toLowerCase().includes('asian')) ||
      (type.name && type.name.toLowerCase().includes('asian'))
    );

    const result = categoryMatch || typeMatch;
    console.log('Is Asian Cuisine Category:', result);
    console.log('Category:', category);
    console.log('Type:', type);
    console.log('Type Options:', typeOptions);
    return result;
  };

  const pickImageUrl = (t) => {
    return (
      t?.image ||
      t?.image_url ||
      t?.photo_url ||
      t?.featured_image ||
      (Array.isArray(t?.images) ? (t.images[0]?.url || t.images[0]) : null) ||
      null
    );
  };

  const bgStyle = { backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px 12px' };
  const cardStyle = {
    maxWidth: 960,
    margin: '0 auto',
    background: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  };
  const headerStyle = { padding: '20px 24px', borderBottom: '1px solid #eef2f7' };
  const titleStyle = { fontSize: 24, margin: 0, fontWeight: 700 };
  const contentStyle = { display: 'grid', gridTemplateColumns: '1fr', gap: 20, padding: 24 };
  const mediaStyle = { width: '100%', height: 260, objectFit: 'cover', borderRadius: 8, background: '#f1f5f9' };
  const sectionTitle = { fontSize: 18, fontWeight: 700, margin: '10px 0' };
  const descStyle = { color: '#334155', lineHeight: 1.75 };
  const label = { color: '#64748b', fontSize: 12, marginBottom: 4 };
  const value = { color: '#0f172a', fontWeight: 600 };
  const formRow = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
  const input = { 
    width: '100%', 
    padding: '10px 12px', 
    border: '1px solid #e2e8f0', 
    borderRadius: 8,
    fontSize: '16px',
    fontFamily: 'inherit',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    WebkitAppearance: 'none',
    MozAppearance: 'textfield'
  };
  const priceBox = { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#14532d', padding: 12, borderRadius: 8 };
  const actions = { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 };
  const btn = { padding: '12px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700 };
  const btnReserve = { ...btn, background: '#22c55e', color: '#ffffff' };
  const btnBack = { ...btn, background: '#e0f2fe', color: '#075985' };
  const small = { fontSize: 12, color: '#64748b' };

  // Determine back button URL based on current route
  const getBackUrl = () => {
    // If we're on /services/menage/1/1, go back to /services/menage/1
    if (serviceSlug === 'menage' && categorySlug) {
      return `/services/menage/${categorySlug}`;
    }
    // If we have a categorySlug, go back to the category page
    if (categorySlug) {
      return `/services/${serviceSlug}/${categorySlug}`;
    }
    // Otherwise, go to /services
    return '/services';
  };

  // Early return if no typeSlug - this component should not render for CategoryHouseDetails route
  if (!typeSlug && !typeId) {
    return null;
  }

  // Map language to supported languages (needed before error check)
  const mapToSupportedLang = (lng) => {
    if ((lng || '').toLowerCase().startsWith('ar')) return 'ar';
    if ((lng || '').toLowerCase().startsWith('fr')) return 'fr';
    return 'en';
  };

  const selectedLang = mapToSupportedLang(i18n?.language);

  if (loading) {
    return (
      <main style={bgStyle}>
        <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, border: '4px solid #e2e8f0', borderTopColor: '#22c55e', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <div style={{ color: '#475569' }}>{t('services_page.loading') || 'جارٍ التحميل...'}</div>
        </div>
      </main>
    );
  }

  if (error || !type) {
    return (
      <main style={bgStyle}>
        <div style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center' }}>
          <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 8 }}>{t('services_page.loading_error') || 'حدث خطأ أثناء التحميل'}</div>
          <div style={{ color: '#475569', marginBottom: 16 }}>{error}</div>
          <Link to={getBackUrl()} style={{ textDecoration: 'none' }}>
            <button style={btnBack}>
              {selectedLang === 'ar' ? '↩️ العودة' : 
               selectedLang === 'fr' ? '↩️ Retour' : 
               '↩️ Back'}
            </button>
          </Link>
        </div>
      </main>
    );
  }

  const featured = pickImageUrl(type);

  const getNameByLang = (lang) => {
    switch (lang) {
      case 'ar':
        return type?.name_ar || type?.name || '';
      case 'fr':
        return type?.name_fr || type?.name || '';
      case 'en':
      default:
        return type?.name_en || type?.name || '';
    }
  };

  const getDescriptionByLang = (lang) => {
    switch (lang) {
      case 'ar':
        return type?.description_ar || type?.description || '';
      case 'fr':
        return type?.description_fr || type?.description || '';
      case 'en':
      default:
        return type?.description_en || type?.description || '';
    }
  };

  const getLangLabel = (lang) => {
    switch (lang) {
      case 'ar':
        return 'العربية';
      case 'fr':
        return 'Français';
      case 'en':
      default:
        return 'English';
    }
  };

  const currentName = getNameByLang(selectedLang);
  const currentDescription = getDescriptionByLang(selectedLang);

  // Check if the category is Cuisine/مطبخ/Kitchen
  const isCuisineCategory = () => {
    return category && (
      category.name_ar === 'مطبخ' ||
      category.name_fr === 'Cuisine' ||
      category.name_en === 'Kitchen' ||
      category.name === 'Cuisine' ||
      category.name === 'مطبخ' ||
      category.name === 'Kitchen' ||
      (category.name_ar && category.name_ar.includes('مطبخ')) ||
      (category.name_fr && category.name_fr.toLowerCase().includes('cuisine')) ||
      (category.name_en && category.name_en.toLowerCase().includes('kitchen'))
    );
  };

  return (
    <main style={bgStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={titleStyle}>
              {selectedLang === 'ar' ? 'تفاصيل الفئة' : selectedLang === 'fr' ? 'Détails de la catégorie' : 'Category Details'} {currentName}
            </h1>
            <Link to={getBackUrl()} style={{ textDecoration: 'none' }}>
              <button style={btnBack}>
                {selectedLang === 'ar' ? '↩️ العودة' : 
                 selectedLang === 'fr' ? '↩️ Retour' : 
                 '↩️ Back'}
              </button>
            </Link>
          </div>
        </div>

        <div style={contentStyle}>
          {featured && (
            <img src={featured} alt={currentName || 'Cuisine'} style={mediaStyle} />
          )}

          <div>
            <div style={sectionTitle}>
              {selectedLang === 'ar' ? '🖋️ الاسم والوصف المختصر' : selectedLang === 'fr' ? '🖋️ Nom et description courte' : '🖋️ Name and short description'}
              {' '}- {getLangLabel(selectedLang)}
            </div>
            <div style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 12, 
              padding: 20,
              display: 'grid',
              gap: 16,
            }}>
              <div>
                <div style={{ ...label, marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                  {selectedLang === 'ar' ? 'الاسم' : selectedLang === 'fr' ? 'Nom' : 'Name'}
                </div>
                <div style={{ 
                  ...value, 
                  fontSize: 20, 
                  color: '#0f172a',
                  marginBottom: 16,
                }}>
                  {currentName || (selectedLang === 'ar' ? 'لا يوجد اسم متاح' : selectedLang === 'fr' ? 'Aucun nom disponible' : 'No name available')}
                </div>
              </div>

              <div>
                <div style={{ ...label, marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                  {selectedLang === 'ar' ? 'الوصف المختصر' : selectedLang === 'fr' ? 'Description courte' : 'Short Description'}
                </div>
                <div style={descStyle}>
                  {currentDescription || (selectedLang === 'ar' ? 'لا يوجد وصف متاح' : selectedLang === 'fr' ? 'Aucune description disponible' : 'No description available')}
                </div>
              </div>
            </div>
          </div>

          {!isCuisineCategory() && serviceSlug !== 'lavage' && (
            <div>
              <div style={sectionTitle}>
                {selectedLang === 'ar' ? '📏 تقدير المساحة والسعر' : 
                 selectedLang === 'fr' ? '📏 Estimation de la surface et du prix' : 
                 '📏 Surface and Price Estimation'}
              </div>
              <div style={formRow}>
                <div>
                  <div style={{ ...label, marginBottom: 6 }}>
                    {selectedLang === 'ar' ? 'المساحة التقريبية (m²)' : 
                     selectedLang === 'fr' ? 'Surface approximative (m²)' : 
                     'Approximate Area (m²)'}
                  </div>
                  <input 
                    type="number" 
                    min="0" 
                    step="any"
                    value={surface} 
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string, numbers, and decimal points
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setSurface(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Allow: backspace, delete, tab, escape, enter, decimal point
                      if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                        (e.keyCode === 65 && e.ctrlKey === true) ||
                        (e.keyCode === 67 && e.ctrlKey === true) ||
                        (e.keyCode === 86 && e.ctrlKey === true) ||
                        (e.keyCode === 88 && e.ctrlKey === true) ||
                        // Allow: home, end, left, right
                        (e.keyCode >= 35 && e.keyCode <= 39)) {
                        return;
                      }
                      // Ensure that it is a number and stop the keypress
                      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault();
                      }
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder={selectedLang === 'ar' ? 'أدخل المساحة (m²)' : 
                                 selectedLang === 'fr' ? 'Entrez la surface (m²)' : 
                                 'Enter the area (m²)'} 
                    style={input}
                    inputMode="decimal"
                    autoComplete="off"
                  />
                  <div style={small}>
                    {selectedLang === 'ar' ? 'يتم حساب السعر تلقائيًا (2.5 درهم لكل m²)' : 
                     selectedLang === 'fr' ? 'Le prix est calculé automatiquement (2.5 DH par m²)' : 
                     'Price is calculated automatically (2.5 DH per m²)'}
                  </div>
                </div>
                <div>
                  <div style={{ ...label, marginBottom: 6 }}>
                    {selectedLang === 'ar' ? 'السعر التقديري' : 
                     selectedLang === 'fr' ? 'Prix estimé' : 
                     'Estimated Price'}
                  </div>
                  <div style={priceBox}>{price.toFixed(2)} DH</div>
                </div>
              </div>
            </div>
          )}

          <div style={actions}>
            <button onClick={handleReserve} style={btnReserve}>
              {selectedLang === 'ar' ? '🔘 احجز' : 
               selectedLang === 'fr' ? '🔘 Réserver' : 
               '🔘 Book'}
            </button>
            <Link to={getBackUrl()} style={{ textDecoration: 'none' }}>
              <button style={btnBack}>
                {selectedLang === 'ar' ? '↩️ العودة' : 
                 selectedLang === 'fr' ? '↩️ Retour' : 
                 '↩️ Back'}
              </button>
            </Link>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (min-width: 900px) {
          .td-grid-2 { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; }
        }
      `}</style>
    </main>
  );
}


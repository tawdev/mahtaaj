import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTypeById, getCategoryHouseById, getTypeOptions } from '../api-supabase';
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
  const [selectedTypeOption, setSelectedTypeOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [surface, setSurface] = useState('');
  const [price, setPrice] = useState(0);

  useEffect(() => {
    loadType();
  }, [serviceSlug, categorySlug, typeSlug, categoryId, subCategoryId, typeId]);

  useEffect(() => {
    if (surface && !isNaN(parseFloat(surface))) {
      setPrice(parseFloat(surface) * 2.5);
    } else {
      setPrice(0);
    }
  }, [surface]);

  const loadType = async () => {
    try {
      setLoading(true);
      setError('');

      const idCandidate = parseInt(typeId || typeSlug);
      if (isNaN(idCandidate)) {
        setError('Type ID invalide');
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
    const prefill = {
      typeId: type?.id,
      typeName: type?.name_ar || type?.name || type?.name_fr || type?.name_en || '',
      description: type?.description_ar || type?.description || type?.description_fr || type?.description_en || '',
      surface: surface || '',
      estimatedPrice: price || 0,
      choixtype_id: selectedTypeOption?.id || undefined,
      choixtype_name: selectedTypeOption ? (selectedTypeOption.name || selectedTypeOption.name_fr || selectedTypeOption.name_ar || selectedTypeOption.name_en) : undefined,
    };

    try {
      localStorage.setItem('booking_prefill', JSON.stringify(prefill));
    } catch (err) {
      console.error('Error saving prefill:', err);
    }

    const idCandidate = type?.id || parseInt(typeId || typeSlug) || '';
    navigate(`/reservation/${idCandidate}`, { state: { type, prefill } });
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
  const input = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8 };
  const priceBox = { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#14532d', padding: 12, borderRadius: 8 };
  const actions = { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 };
  const btn = { padding: '12px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700 };
  const btnReserve = { ...btn, background: '#22c55e', color: '#ffffff' };
  const btnBack = { ...btn, background: '#e0f2fe', color: '#075985' };
  const small = { fontSize: 12, color: '#64748b' };

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
          <Link to="/services" style={{ textDecoration: 'none' }}>
            <button style={btnBack}>↩️ العودة للخدمات</button>
          </Link>
        </div>
      </main>
    );
  }

  const featured = pickImageUrl(type);

  const mapToSupportedLang = (lng) => {
    if ((lng || '').toLowerCase().startsWith('ar')) return 'ar';
    if ((lng || '').toLowerCase().startsWith('fr')) return 'fr';
    return 'en';
  };

  const selectedLang = mapToSupportedLang(i18n?.language);

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
  const isCuisineCategory = category && (
    category.name_ar === 'مطبخ' ||
    category.name_fr === 'Cuisine' ||
    category.name_en === 'Kitchen' ||
    category.name === 'Cuisine' ||
    category.name === 'مطبخ' ||
    category.name === 'Kitchen'
  );

  return (
    <main style={bgStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={titleStyle}>
              {selectedLang === 'ar' ? 'تفاصيل الفئة' : selectedLang === 'fr' ? 'Détails de la catégorie' : 'Category Details'} {currentName}
            </h1>
            <Link to="/services" style={{ textDecoration: 'none' }}>
              <button style={btnBack}>↩️ العودة للخدمات</button>
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

          {/* Type Options Section for Asian Cuisine */}
          {isAsianCuisineCategory() && (
            <div>
              <div style={sectionTitle}>
                {selectedLang === 'ar' ? '🧩 عرض الأنواع الفرعية (choixType)' : 
                 selectedLang === 'fr' ? '🧩 Afficher les sous-types (choixType)' : 
                 '🧩 Display Sub-types (choixType)'}
              </div>
              {typeOptions.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px',
                  marginTop: '16px'
                }}>
                  {typeOptions.map((option) => {
                    const isSelected = selectedTypeOption && selectedTypeOption.id === option.id;
                    const optionImage = option.image_url || option.image;
                    let imageUrl = optionImage;
                    
                    if (imageUrl) {
                      if (imageUrl.startsWith('/serveces')) {
                        imageUrl = (process.env.PUBLIC_URL || '') + imageUrl;
                      } else if (imageUrl.startsWith('/') && !imageUrl.startsWith('/serveces')) {
                        const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
                        imageUrl = apiBase + imageUrl;
                      }
                    }

                    const optionName = selectedLang === 'ar' 
                      ? (option.name_ar || option.name_fr || option.name_en || option.name)
                      : selectedLang === 'fr'
                      ? (option.name_fr || option.name_ar || option.name_en || option.name)
                      : (option.name_en || option.name_fr || option.name_ar || option.name);

                    const optionDescription = selectedLang === 'ar'
                      ? (option.description_ar || option.description_fr || option.description_en || option.description)
                      : selectedLang === 'fr'
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
                  marginTop: '16px',
                  color: '#6b7280'
                }}>
                  {selectedLang === 'ar' ? 'لا توجد خيارات متاحة حالياً' : 
                   selectedLang === 'fr' ? 'Aucune option disponible pour le moment' : 
                   'No options available at the moment'}
                </div>
              )}
            </div>
          )}

          {!isCuisineCategory && (
            <div>
              <div style={sectionTitle}>📏 تقدير المساحة والسعر</div>
              <div style={formRow}>
                <div>
                  <div style={{ ...label, marginBottom: 6 }}>المساحة التقريبية (m²)</div>
                  <input type="number" min="0" step="0.5" value={surface} onChange={(e) => setSurface(e.target.value)} placeholder="أدخل المساحة" style={input} />
                  <div style={small}>يتم حساب السعر تلقائيًا (2.5 درهم لكل m²)</div>
                </div>
                <div>
                  <div style={{ ...label, marginBottom: 6 }}>السعر التقديري</div>
                  <div style={priceBox}>{price.toFixed(2)} DH</div>
                </div>
              </div>
            </div>
          )}

          <div style={actions}>
            <button onClick={handleReserve} style={btnReserve}>🔘 احجز</button>
            <Link to="/services" style={{ textDecoration: 'none' }}>
              <button style={btnBack}>↩️ العودة للخدمات</button>
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


// Service de traduction pour les catégories de travaux manuels
export const translateHandWorkerCategory = (category, language = 'fr') => {
  if (!category) return category;
  
  const lang = (language || 'fr').toString().split(/[-_]/)[0].toLowerCase();
  
  // Use multilingual fields from Supabase if available
  const translatedCategory = { ...category };
  
  // Get name based on language
  if (lang === 'ar' && category.name_ar) {
    translatedCategory.name = category.name_ar;
  } else if (lang === 'fr' && category.name_fr) {
    translatedCategory.name = category.name_fr;
  } else if (lang === 'en' && category.name_en) {
    translatedCategory.name = category.name_en;
  } else if (category.name) {
    translatedCategory.name = category.name;
  }
  
  // Get description based on language
  if (lang === 'ar' && category.description_ar) {
    translatedCategory.description = category.description_ar;
  } else if (lang === 'fr' && category.description_fr) {
    translatedCategory.description = category.description_fr;
  } else if (lang === 'en' && category.description_en) {
    translatedCategory.description = category.description_en;
  } else if (category.description) {
    translatedCategory.description = category.description;
  }
  
  return translatedCategory;
};

export const translateHandWorkerCategories = (categories, language = 'fr') => {
  return categories.map(category => translateHandWorkerCategory(category, language));
};

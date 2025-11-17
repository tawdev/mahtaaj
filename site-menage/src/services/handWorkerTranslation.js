// Service de traduction pour les catégories de travaux manuels
export const translateHandWorkerCategory = (category, language = 'fr') => {
  const translations = {
    fr: {
      'carreleur': {
        name: 'Carreleur',
        description: 'Pose de carrelage et revêtements de sol'
      },
      'electricien': {
        name: 'Électricien', 
        description: 'Installations et réparations électriques'
      },
      'macon': {
        name: 'Maçon',
        description: 'Travaux de maçonnerie et construction'
      },
      'menuisier': {
        name: 'Menuisier',
        description: 'Menuiserie en bois et construction'
      },
      'peintre': {
        name: 'Peintre',
        description: 'Peinture intérieure et extérieure'
      },
      'platrier': {
        name: 'Plâtrier',
        description: 'Plâtrerie et finition des murs'
      },
      'plombier': {
        name: 'Plombier',
        description: 'Plomberie et réparations'
      },
      'serrurier': {
        name: 'Serrurier',
        description: 'Serrurerie et sécurité'
      }
    },
    ar: {
      'carreleur': {
        name: 'مبلّط',
        description: 'تبليط وتغطية الأرضيات'
      },
      'electricien': {
        name: 'كهربائي',
        description: 'تركيبات وإصلاحات كهربائية'
      },
      'macon': {
        name: 'بنّاء',
        description: 'أعمال البناء والتشييد'
      },
      'menuisier': {
        name: 'نجّار',
        description: 'أعمال النجارة والإنشاءات الخشبية'
      },
      'peintre': {
        name: 'دهّان',
        description: 'دهانات داخلية وخارجية'
      },
      'platrier': {
        name: 'جبّاس',
        description: 'أعمال الجبس وتشطيب الجدران'
      },
      'plombier': {
        name: 'سبّاك',
        description: 'أعمال السباكة والإصلاحات'
      },
      'serrurier': {
        name: 'قفّال',
        description: 'أعمال القفل والأمان'
      }
    },
    en: {
      'carreleur': {
        name: 'Tiler',
        description: 'Tiling and floor coverings'
      },
      'electricien': {
        name: 'Electrician',
        description: 'Electrical installations and repairs'
      },
      'macon': {
        name: 'Mason',
        description: 'Masonry and construction work'
      },
      'menuisier': {
        name: 'Carpenter',
        description: 'Woodwork and construction'
      },
      'peintre': {
        name: 'Painter',
        description: 'Interior and exterior painting'
      },
      'platrier': {
        name: 'Plasterer',
        description: 'Plastering and wall finishing'
      },
      'plombier': {
        name: 'Plumber',
        description: 'Plumbing and repairs'
      },
      'serrurier': {
        name: 'Locksmith',
        description: 'Locksmithing and security'
      }
    }
  };

  const categorySlug = category.slug || category.name?.toLowerCase();
  const translation = translations[language]?.[categorySlug];
  
  if (translation) {
    return {
      ...category,
      name: translation.name,
      description: translation.description
    };
  }
  
  return category;
};

export const translateHandWorkerCategories = (categories, language = 'fr') => {
  return categories.map(category => translateHandWorkerCategory(category, language));
};

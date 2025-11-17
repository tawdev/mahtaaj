const SERVICE_ICON_RULES = [
  { icon: '🧹', keywords: ['menage', 'ménage', 'housekeeping', 'home', 'maison'] },
  { icon: '🍳', keywords: ['cuisine', 'kitchen', 'cooking'] },
  { icon: '🏢', keywords: ['bureau', 'office'] },
  { icon: '🏭', keywords: ['usine', 'factory', 'industrie'] },
  { icon: '🛡️', keywords: ['secur', 'sécur', 'security', 'garde'] },
  { icon: '🧺', keywords: ['lavage', 'linge', 'wash', 'laundry'] },
  { icon: '🧼', keywords: ['nettoy', 'clean', 'propre'] },
  { icon: '🏠', keywords: ['standard', 'basic', 'classic'] },
];

const normalize = (value) => {
  if (!value) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const getMatchingIcon = (text) => {
  if (!text) return null;
  const normalized = normalize(text);
  return (
    SERVICE_ICON_RULES.find((rule) =>
      rule.keywords.some((keyword) => normalized.includes(keyword))
    )?.icon || null
  );
};

export const getServiceIcon = (service, fallback = '🧽') => {
  if (!service) return fallback;

  if (service.icon && String(service.icon).trim()) {
    return service.icon;
  }

  const candidates = [
    service.slug,
    service.name_fr,
    service.name_en,
    service.name_ar,
    service.title,
  ];

  for (const candidate of candidates) {
    const icon = getMatchingIcon(candidate);
    if (icon) return icon;
  }

  return fallback;
};

export default getServiceIcon;


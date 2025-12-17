// Shared data for multi-service employees demo pages

export const SERVICES = [
  { 
    id: 'menage_cuisine', 
    label: '🧹 Ménage et cuisine',
    image: '/image/serveces/Airbnb1.jpeg'
  },
  { 
    id: 'securite', 
    label: '🛡️ Sécurité',
    image: '/image/a_عون_أمن_مغربي_يقف_أم.png'
  },
  { 
    id: 'bebe', 
    label: '👶 Bébé Sitting',
    image: '/image/a_مربية_أطفال_مغربية_ت.png'
  },
  { 
    id: 'jardinage', 
    label: '🌿 Jardinage',
    image: '/image/b_عامل_بستنة_مغربي_يزر.png'
  },
  { 
    id: 'travaux_manuels', 
    label: '🛠️ Travaux Manuels',
    image: '/image/gemini-2.5-flash-image-preview (nano-banana)_a_نجّار_مغربي_يعمل_على.png'
  },
  { 
    id: 'chauffeur', 
    label: '🚗 Chauffeur',
    image: '/image/Gemini_Generated_Image_mw2wgwmw2wgwmw2w.png'
  },
];

// Simple mock data – can be replaced later with Supabase queries
export const EMPLOYEES = [
  {
    id: 1,
    name: 'Fatima El Amrani',
    serviceId: 'menage_cuisine',
    city: 'Casablanca',
    quartier: 'Maarif',
    active: true,
    photo: 'https://via.placeholder.com/300x300?text=Fatima',
  },
  {
    id: 2,
    name: 'Youssef Benali',
    serviceId: 'securite',
    city: 'Casablanca',
    quartier: 'Sidi Maarouf',
    active: true,
    photo: 'https://via.placeholder.com/300x300?text=Youssef',
  },
  {
    id: 3,
    name: 'Sara Boutayeb',
    serviceId: 'bebe',
    city: 'Rabat',
    quartier: 'Agdal',
    active: true,
    photo: 'https://via.placeholder.com/300x300?text=Sara',
  },
  {
    id: 4,
    name: 'Hicham El Idrissi',
    serviceId: 'jardinage',
    city: 'Rabat',
    quartier: 'Hay Ryad',
    active: true,
    photo: 'https://via.placeholder.com/300x300?text=Hicham',
  },
  {
    id: 5,
    name: 'Omar Lahlou',
    serviceId: 'travaux_manuels',
    city: 'Marrakech',
    quartier: 'Gueliz',
    active: true,
    photo: 'https://via.placeholder.com/300x300?text=Omar',
  },
  {
    id: 6,
    name: 'Imane Zahra',
    serviceId: 'chauffeur',
    city: 'Casablanca',
    quartier: 'Ain Diab',
    active: true,
    photo: 'https://via.placeholder.com/300x300?text=Imane',
  },
];



// Shared data for multi-service employees demo pages

export const SERVICES = [
  { id: 'menage_cuisine', label: '🧹 Ménage et cuisine' },
  { id: 'securite', label: '🛡️ Sécurité' },
  { id: 'bebe', label: '👶 Bébé Sitting' },
  { id: 'jardinage', label: '🌿 Jardinage' },
  { id: 'travaux_manuels', label: '🛠️ Travaux Manuels' },
  { id: 'chauffeur', label: '🚗 Chauffeur' },
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



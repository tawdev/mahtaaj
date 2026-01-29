/**
 * Utilitaires de géocodage utilisant l'API Nominatim (OpenStreetMap)
 * Documentation: https://nominatim.org/release-docs/latest/api/Overview/
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const REQUEST_DELAY = 1000; // 1 seconde entre les requêtes (rate limit)

let lastRequestTime = 0;

/**
 * Attendre le délai nécessaire pour respecter le rate limit
 */
const waitForRateLimit = async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < REQUEST_DELAY) {
        await new Promise(resolve =>
            setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest)
        );
    }

    lastRequestTime = Date.now();
};

/**
 * Géocodage inverse: Coordonnées → Adresse
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - Données d'adresse formatées
 */
export const reverseGeocode = async (lat, lng) => {
    try {
        await waitForRateLimit();

        const response = await fetch(
            `${NOMINATIM_BASE_URL}/reverse?` + new URLSearchParams({
                lat: lat.toString(),
                lon: lng.toString(),
                format: 'json',
                addressdetails: '1',
                'accept-language': 'fr'
            }),
            {
                headers: {
                    'User-Agent': 'MahtaajApp/1.0' // Requis par Nominatim
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return formatAddress(data);
    } catch (error) {
        console.error('Erreur géocodage inverse:', error);
        return {
            formatted: 'Adresse non disponible',
            city: null,
            country: null,
            error: error.message
        };
    }
};

/**
 * Géocodage: Adresse → Coordonnées
 * @param {string} address - Adresse à géocoder
 * @returns {Promise<Object>} - { lat, lng } ou null
 */
export const geocode = async (address) => {
    try {
        await waitForRateLimit();

        const response = await fetch(
            `${NOMINATIM_BASE_URL}/search?` + new URLSearchParams({
                q: address,
                format: 'json',
                addressdetails: '1',
                limit: '1',
                'accept-language': 'fr'
            }),
            {
                headers: {
                    'User-Agent': 'MahtaajApp/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                displayName: data[0].display_name
            };
        }

        return null;
    } catch (error) {
        console.error('Erreur géocodage:', error);
        return null;
    }
};

/**
 * Formater les données d'adresse de Nominatim
 * @param {Object} data - Données brutes de Nominatim
 * @returns {Object} - Adresse formatée
 */
export const formatAddress = (data) => {
    if (!data || !data.address) {
        return {
            formatted: 'Adresse non disponible',
            street: null,
            city: null,
            state: null,
            country: null,
            postcode: null
        };
    }

    const addr = data.address;

    // Construire l'adresse formatée
    const parts = [];

    if (addr.road) parts.push(addr.road);
    if (addr.house_number) parts.push(addr.house_number);
    if (addr.suburb || addr.neighbourhood) parts.push(addr.suburb || addr.neighbourhood);
    if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
    if (addr.postcode) parts.push(addr.postcode);
    if (addr.country) parts.push(addr.country);

    return {
        formatted: parts.join(', ') || data.display_name,
        street: addr.road || null,
        city: addr.city || addr.town || addr.village || null,
        state: addr.state || null,
        country: addr.country || null,
        postcode: addr.postcode || null,
        displayName: data.display_name
    };
};

/**
 * Calculer la distance entre deux points (formule de Haversine)
 * @param {number} lat1 - Latitude point 1
 * @param {number} lng1 - Longitude point 1
 * @param {number} lat2 - Latitude point 2
 * @param {number} lng2 - Longitude point 2
 * @returns {number} - Distance en kilomètres
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Arrondir à 1 décimale
};

const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Vérifier si les coordonnées sont au Maroc (approximatif)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
export const isInMorocco = (lat, lng) => {
    // Bounding box approximatif du Maroc
    const moroccoBox = {
        north: 36.0,
        south: 21.0,
        west: -17.5,
        east: -1.0
    };

    return (
        lat >= moroccoBox.south &&
        lat <= moroccoBox.north &&
        lng >= moroccoBox.west &&
        lng <= moroccoBox.east
    );
};

export default {
    reverseGeocode,
    geocode,
    formatAddress,
    calculateDistance,
    isInMorocco
};

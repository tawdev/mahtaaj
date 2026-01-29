import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer la géolocalisation du navigateur
 * @returns {Object} - { location, error, loading, getCurrentPosition, clearError }
 */
export const useGeolocation = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const getCurrentPosition = useCallback(() => {
        // Vérifier si la géolocalisation est supportée
        if (!navigator.geolocation) {
            setError({
                code: 'NOT_SUPPORTED',
                message: 'La géolocalisation n\'est pas supportée par votre navigateur.'
            });
            return;
        }

        setLoading(true);
        setError(null);

        const options = {
            enableHighAccuracy: true, // Utiliser GPS si disponible
            timeout: 10000, // 10 secondes max
            maximumAge: 0 // Pas de cache
        };

        navigator.geolocation.getCurrentPosition(
            // Success callback
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
                setLoading(false);
            },
            // Error callback
            (err) => {
                setLoading(false);

                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError({
                            code: 'PERMISSION_DENIED',
                            message: 'Accès à la localisation refusé. Veuillez placer le marqueur manuellement sur la carte.'
                        });
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError({
                            code: 'POSITION_UNAVAILABLE',
                            message: 'Localisation GPS non disponible. Veuillez placer le marqueur manuellement.'
                        });
                        break;
                    case err.TIMEOUT:
                        setError({
                            code: 'TIMEOUT',
                            message: 'La localisation prend trop de temps. Réessayez ou placez le marqueur manuellement.'
                        });
                        break;
                    default:
                        setError({
                            code: 'UNKNOWN',
                            message: 'Une erreur est survenue lors de la localisation.'
                        });
                }
            },
            options
        );
    }, []);

    return {
        location,
        error,
        loading,
        getCurrentPosition,
        clearError
    };
};

export default useGeolocation;

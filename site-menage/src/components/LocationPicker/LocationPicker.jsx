import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LuMapPin, LuLoader, LuCircleAlert, LuCircleCheck } from 'react-icons/lu';
import { useGeolocation } from './useGeolocation';
import { reverseGeocode, isInMorocco } from '../../utils/geocoding';
import './LocationPicker.css';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet avec Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * Composant de carte pour gérer les événements
 */
function MapEvents({ onPositionChange }) {
    useMapEvents({
        click(e) {
            onPositionChange(e.latlng);
        },
    });
    return null;
}

/**
 * Composant LocationPicker - Sélection de localisation GPS avec carte interactive
 * 
 * @param {Object} props
 * @param {Function} props.onLocationSelect - Callback (lat, lng, address) => void
 * @param {Object} props.initialLocation - Position initiale { lat, lng }
 * @param {Object} props.defaultCenter - Centre par défaut { lat, lng }
 */
export default function LocationPicker({
    onLocationSelect,
    initialLocation = null,
    defaultCenter = { lat: 31.7917, lng: -7.0926 } // Marrakech par défaut
}) {
    const mapRef = useRef(null);

    // Position du marker
    const [position, setPosition] = useState(initialLocation || defaultCenter);

    // Adresse formatée
    const [address, setAddress] = useState('');
    const [addressLoading, setAddressLoading] = useState(false);

    // État de confirmation
    const [isConfirmed, setIsConfirmed] = useState(false);

    // Hook de géolocalisation
    const { location, error: geoError, loading: geoLoading, getCurrentPosition, clearError } = useGeolocation();

    /**
     * Récupérer l'adresse à partir des coordonnées
     */
    const fetchAddress = useCallback(async (lat, lng) => {
        setAddressLoading(true);
        try {
            const addressData = await reverseGeocode(lat, lng);
            setAddress(addressData.formatted);
        } catch (err) {
            console.error('Erreur récupération adresse:', err);
            setAddress('Adresse non disponible');
        } finally {
            setAddressLoading(false);
        }
    }, []);

    /**
     * Gérer le changement de position (drag ou click)
     */
    const handlePositionChange = useCallback((newPos) => {
        setPosition(newPos);
        setIsConfirmed(false);
        fetchAddress(newPos.lat, newPos.lng);
    }, [fetchAddress]);

    /**
     * Utiliser la position actuelle
     */
    const handleUseCurrentLocation = () => {
        clearError();
        getCurrentPosition();
    };

    /**
     * Confirmer la localisation
     */
    const handleConfirm = () => {
        setIsConfirmed(true);
        if (onLocationSelect) {
            onLocationSelect(position.lat, position.lng, address);
        }
    };

    /**
     * Centrer la carte sur une position
     */
    const centerMap = useCallback((lat, lng) => {
        if (mapRef.current) {
            mapRef.current.setView([lat, lng], 15);
        }
    }, []);

    /**
     * Effet: Quand la géolocalisation réussit
     */
    useEffect(() => {
        if (location) {
            setPosition(location);
            centerMap(location.lat, location.lng);
            fetchAddress(location.lat, location.lng);
        }
    }, [location, centerMap, fetchAddress]);

    /**
     * Effet: Charger l'adresse initiale
     */
    useEffect(() => {
        if (position) {
            fetchAddress(position.lat, position.lng);
        }
    }, []); // Seulement au montage

    return (
        <div className="location-picker">
            {/* En-tête */}
            <div className="location-picker-header">
                <div className="header-icon">
                    <LuMapPin />
                </div>
                <div className="header-content">
                    <h3>Définissez votre zone d'intervention</h3>
                    <p>Utilisez votre position actuelle ou placez le marqueur sur la carte</p>
                </div>
            </div>

            {/* Bouton Position Actuelle */}
            <div className="location-actions">
                <button
                    type="button"
                    className="btn-current-location"
                    onClick={handleUseCurrentLocation}
                    disabled={geoLoading}
                >
                    {geoLoading ? (
                        <>
                            <LuLoader className="spin" />
                            <span>Localisation en cours...</span>
                        </>
                    ) : (
                        <>
                            <LuMapPin />
                            <span>📍 Utiliser ma position actuelle</span>
                        </>
                    )}
                </button>
            </div>

            {/* Messages d'erreur */}
            {geoError && (
                <div className="location-error">
                    <LuCircleAlert />
                    <span>{geoError.message}</span>
                </div>
            )}

            {/* Carte */}
            <div className="map-container">
                <MapContainer
                    center={[position.lat, position.lng]}
                    zoom={13}
                    scrollWheelZoom={true}
                    className="leaflet-map"
                    ref={mapRef}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker
                        position={[position.lat, position.lng]}
                        draggable={true}
                        eventHandlers={{
                            dragend: (e) => {
                                const marker = e.target;
                                const newPos = marker.getLatLng();
                                handlePositionChange(newPos);
                            },
                        }}
                    />

                    <MapEvents onPositionChange={handlePositionChange} />
                </MapContainer>

                {/* Instructions sur la carte */}
                <div className="map-instructions">
                    <p>💡 Déplacez le marqueur ou cliquez sur la carte pour ajuster votre position</p>
                </div>
            </div>

            {/* Affichage de l'adresse */}
            <div className="location-info">
                <div className="info-label">Adresse détectée :</div>
                <div className="info-value">
                    {addressLoading ? (
                        <span className="loading-text">
                            <LuLoader className="spin" /> Chargement de l'adresse...
                        </span>
                    ) : (
                        <span>{address || 'Aucune adresse disponible'}</span>
                    )}
                </div>

                {/* Coordonnées */}
                <div className="coordinates">
                    <small>
                        Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
                    </small>
                </div>

                {/* Warning si hors Maroc */}
                {!isInMorocco(position.lat, position.lng) && (
                    <div className="location-warning">
                        <LuCircleAlert />
                        <span>Attention : Vous semblez être en dehors du Maroc</span>
                    </div>
                )}
            </div>

            {/* Bouton de confirmation */}
            <div className="location-confirm">
                <button
                    type="button"
                    className={`btn-confirm ${isConfirmed ? 'confirmed' : ''}`}
                    onClick={handleConfirm}
                    disabled={addressLoading}
                >
                    {isConfirmed ? (
                        <>
                            <LuCircleCheck />
                            <span>Localisation confirmée ✓</span>
                        </>
                    ) : (
                        <>
                            <LuMapPin />
                            <span>Confirmer cette localisation</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

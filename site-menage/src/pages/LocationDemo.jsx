import React, { useState } from 'react';
import LocationPicker from '../components/LocationPicker/LocationPicker';
import './LocationDemo.css';

/**
 * Page de démonstration du LocationPicker
 * Cette page montre comment intégrer le composant dans un formulaire d'inscription
 */
export default function LocationDemo() {
    const [locationData, setLocationData] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        latitude: null,
        longitude: null,
        address: ''
    });

    const handleLocationSelect = (lat, lng, address) => {
        console.log('Localisation sélectionnée:', { lat, lng, address });

        setLocationData({ lat, lng, address });
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: address
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.latitude || !formData.longitude) {
            alert('Veuillez sélectionner votre localisation sur la carte');
            return;
        }

        console.log('Données du formulaire:', formData);

        // Ici, vous enverriez les données à Supabase
        // Exemple:
        // const { data, error } = await supabase
        //   .from('employees')
        //   .insert([{
        //     name: formData.name,
        //     category: formData.category,
        //     latitude: formData.latitude,
        //     longitude: formData.longitude,
        //     location_address: formData.address
        //   }]);

        alert('Inscription réussie! (Démo)');
    };

    return (
        <div className="location-demo-page">
            <div className="demo-container">
                <header className="demo-header">
                    <h1>Inscription Employé - Démo GPS</h1>
                    <p>Testez le système de localisation GPS moderne</p>
                </header>

                <form onSubmit={handleSubmit} className="demo-form">
                    {/* Champs classiques */}
                    <div className="form-section">
                        <h2>Informations personnelles</h2>

                        <div className="form-field">
                            <label htmlFor="name">Nom complet *</label>
                            <input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                                placeholder="Ex: Ahmed Benali"
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="category">Catégorie de service *</label>
                            <select
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                required
                            >
                                <option value="">Sélectionnez une catégorie</option>
                                <option value="menage">🧹 Ménage & Cuisine</option>
                                <option value="securite">🛡️ Sécurité</option>
                                <option value="babysitting">👶 Baby-sitting</option>
                                <option value="jardinage">🌿 Jardinage</option>
                                <option value="travaux">🛠️ Travaux manuels</option>
                                <option value="chauffeur">🚗 Chauffeur</option>
                            </select>
                        </div>
                    </div>

                    {/* Section Localisation GPS */}
                    <div className="form-section">
                        <h2>Localisation GPS *</h2>
                        <LocationPicker
                            onLocationSelect={handleLocationSelect}
                            defaultCenter={{ lat: 31.7917, lng: -7.0926 }} // Marrakech
                        />
                    </div>

                    {/* Résumé des données */}
                    {locationData && (
                        <div className="location-summary">
                            <h3>✅ Localisation enregistrée</h3>
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <strong>Latitude:</strong>
                                    <span>{locationData.lat.toFixed(6)}</span>
                                </div>
                                <div className="summary-item">
                                    <strong>Longitude:</strong>
                                    <span>{locationData.lng.toFixed(6)}</span>
                                </div>
                                <div className="summary-item full-width">
                                    <strong>Adresse:</strong>
                                    <span>{locationData.address}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bouton de soumission */}
                    <div className="form-actions">
                        <button type="submit" className="btn-submit">
                            Valider l'inscription
                        </button>
                    </div>
                </form>

                {/* Instructions */}
                <div className="demo-instructions">
                    <h3>📖 Instructions</h3>
                    <ol>
                        <li>Remplissez vos informations personnelles</li>
                        <li>Cliquez sur "📍 Utiliser ma position actuelle" ou placez le marqueur manuellement</li>
                        <li>Vérifiez l'adresse détectée</li>
                        <li>Cliquez sur "Confirmer cette localisation"</li>
                        <li>Validez le formulaire</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

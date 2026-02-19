import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReservationForm from '../components/ReservationForm';
import { supabase } from '../lib/supabase';
import './JardinageReservation.css';

export default function JardinageReservation() {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, []);

    useEffect(() => {
        document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        if (id) {
            loadCategory();
        }
    }, [id, i18n.language]);

    const loadCategory = async () => {
        try {
            setLoading(true);
            setError('');

            const { data, error } = await supabase
                .from('jardinage_categories')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('[JardinageReservation] Error loading category:', error);
                setError(t('jardinage.errors.category_not_found', 'Catégorie non trouvée'));
                return;
            }

            setCategory(data);
        } catch (err) {
            console.error('[JardinageReservation] Exception loading category:', err);
            setError(t('jardinage.errors.connection', 'Erreur de connexion'));
        } finally {
            setLoading(false);
        }
    };

    const handleReservationSuccess = (data) => {
        // Navigate back to details page with a success flag or just navigate back
        navigate(`/jardinage/details/${id}`, { state: { reservationSuccess: true } });
    };

    const handleReservationCancel = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="jardinage-reservation-page">
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>{t('jardinage.loading.category', 'Chargement...')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="jardinage-reservation-page">
            <div className="jardinage-reservation-container">
                <div className="back-link-top-container">
                    <Link to={`/jardinage/details/${id}`} className="back-link-top">
                        <span className="back-icon">←</span> {t('common.back', 'Back')}
                    </Link>
                </div>

                <header className="reservation-header">
                    <h1>{t('jardinage.reservation.title', 'Réservation')}</h1>
                </header>

                {category && (
                    <div className="category-summary">
                        <h2>{category.name}</h2>
                        <p>{category.description?.substring(0, 150)}...</p>
                    </div>
                )}

                {error && (
                    <div className="error-container">
                        <p className="error-message">⚠️ {error}</p>
                        <button onClick={() => navigate(-1)} className="retry-button">
                            {t('common.go_back', 'Retour')}
                        </button>
                    </div>
                )}

                <div className="reservation-form-wrapper">
                    <ReservationForm
                        serviceId={null} // Can be extended to specific services if needed
                        categoryId={id}
                        serviceType="jardinage"
                        onSuccess={handleReservationSuccess}
                        onCancel={handleReservationCancel}
                        initialClientName={user?.user_metadata?.full_name || user?.user_metadata?.name || ''}
                    />
                </div>
            </div>
        </div>
    );
}

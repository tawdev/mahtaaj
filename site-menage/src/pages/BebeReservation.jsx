import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReservationForm from '../components/ReservationForm';
import { supabase } from '../lib/supabase';
import './BebeReservation.css';

export default function BebeReservation() {
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
                .from('bebe_categories')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('[BebeReservation] Error loading category:', error);
                setError(t('bebe_setting.errors.category_not_found', 'Catégorie non trouvée'));
                return;
            }

            setCategory(data);
        } catch (err) {
            console.error('[BebeReservation] Exception loading category:', err);
            setError(t('bebe_setting.errors.connection', 'Erreur de connexion'));
        } finally {
            setLoading(false);
        }
    };

    const handleReservationSuccess = (data) => {
        // Navigate back to details page or home
        navigate('/bebe-setting', { state: { reservationSuccess: true } });
    };

    const handleReservationCancel = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="bebe-reservation-page">
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>{t('bebe_setting.loading.categories', 'Chargement...')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bebe-reservation-page">
            <div className="bebe-reservation-container">
                <div className="back-link-top-container">
                    <Link to="/bebe-setting" className="back-link-top">
                        <span className="back-icon">←</span> {t('bebe_setting.back_to_categories', 'Back')}
                    </Link>
                </div>

                <header className="reservation-header">
                    <h1>{t('bebe_setting.details.reserve_caregiver', 'Réservation')}</h1>
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
                            {t('bebe_setting.errors.retry', 'Retour')}
                        </button>
                    </div>
                )}

                <div className="reservation-form-wrapper">
                    <ReservationForm
                        serviceId={null}
                        categoryId={id}
                        serviceType="bebe"
                        onSuccess={handleReservationSuccess}
                        onCancel={handleReservationCancel}
                        initialClientName={user?.user_metadata?.full_name || user?.user_metadata?.name || ''}
                    />
                </div>
            </div>
        </div>
    );
}

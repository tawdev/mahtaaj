import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import './SecurityReservation.css';

export default function SecurityReservation() {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [reservationLoading, setReservationLoading] = useState(false);
    const [reservationSuccess, setReservationSuccess] = useState(false);

    const [reservationForm, setReservationForm] = useState({
        type_reservation: 'heures',
        date_reservation: '',
        heure_debut: '',
        nombre_heures: 1,
        date_debut: '',
        date_fin: '',
        fullname: '',
        phone: '',
        location: '',
        prix_total: 150,
        role_id: null,
    });

    const fetchUser = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
            setReservationForm(prev => ({
                ...prev,
                fullname: user.user_metadata?.full_name || user.user_metadata?.name || '',
                phone: user.user_metadata?.phone || '',
                location: user.user_metadata?.location || ''
            }));
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const loadRole = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const { data, error: roleError } = await supabase
                .from('security_roles')
                .select('*')
                .eq('id', id)
                .single();

            if (roleError) {
                console.error('[SecurityReservation] Error loading role:', roleError);
                setError(t('security_page.role_not_available', 'Role non trouvé'));
                return;
            }

            setRole(data);
            setReservationForm(prev => ({ ...prev, role_id: data.id }));
        } catch (err) {
            console.error('[SecurityReservation] Exception loading role:', err);
            setError(t('security_page.load_roles_error', 'Erreur de connexion'));
        } finally {
            setLoading(false);
        }
    }, [id, t]);

    useEffect(() => {
        document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        if (id) {
            loadRole();
        }
    }, [id, loadRole, i18n.language]);

    const calculateReservationPrice = (form) => {
        const PRIX_BASE = 150;
        const PRIX_HEURE_SUPP = 40;
        const HEURES_PAR_JOUR = 8;

        if (form.type_reservation === 'heures') {
            const nombreHeures = parseInt(form.nombre_heures) || 1;
            return nombreHeures <= 4 ? PRIX_BASE : PRIX_BASE + (nombreHeures - 4) * PRIX_HEURE_SUPP;
        } else {
            if (form.date_debut && form.date_fin) {
                const d1 = new Date(form.date_debut);
                const d2 = new Date(form.date_fin);
                const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
                const perDay = PRIX_BASE + (HEURES_PAR_JOUR - 4) * PRIX_HEURE_SUPP;
                return Math.max(0, diff * perDay);
            }
        }
        return 0;
    };

    const updateReservationField = (key, value) => {
        setReservationForm(prev => {
            const next = { ...prev, [key]: value };
            next.prix_total = calculateReservationPrice(next);
            return next;
        });
    };

    const handleAutoLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    updateReservationField('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setError(t('security_page.location_error'));
                }
            );
        } else {
            setError(t('security_page.location_error'));
        }
    };

    const submitReservation = async (e) => {
        e.preventDefault();
        setReservationLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login-register');
                return;
            }

            const insertData = {
                user_id: session.user.id,
                firstname: reservationForm.fullname,
                fullname: reservationForm.fullname,
                phone: reservationForm.phone,
                location: reservationForm.location,
                email: session.user.email,
                total_price: reservationForm.prix_total,
                status: 'pending',
                role_id: reservationForm.role_id,
                type_reservation: reservationForm.type_reservation,
                date_reservation: reservationForm.date_reservation || reservationForm.date_debut || null,
                heure_debut: reservationForm.heure_debut || null,
                date_debut: reservationForm.date_debut || null,
                date_fin: reservationForm.date_fin || null,
                nombre_heures: reservationForm.nombre_heures
            };

            const { error: insertError, data: insertResponse } = await supabase.from('reserve_security').insert(insertData).select();
            if (insertError) {
                console.error('[SecurityReservation] Insert Error Detail:', insertError);
                throw insertError;
            }

            console.log('[SecurityReservation] Success:', insertResponse);
            setReservationSuccess(true);
        } catch (err) {
            console.error('[SecurityReservation] Submit Error:', err);
            // Si c'est une erreur 400, c'est probablement un problème de colonnes dans la base de données
            if (err.code === '42703' || err.status === 400) {
                setError(t('security_page.reservation_error') + ' (Erreur de structure base de données. Veuillez exécuter le script SQL fourni.)');
            } else {
                setError(t('security_page.reservation_error', 'Erreur lors de la réservation'));
            }
        } finally {
            setReservationLoading(false);
        }
    };

    const getTranslatedRole = (roleName) => {
        if (!roleName) return t('security_page.role_not_available');
        const directTranslations = {
            'Chef de sécurité': t('security_page.chef_de_securite'),
            'Agent de sûreté': t('security_page.agent_de_surete'),
            'Agent de sécurité': t('security_page.agent_de_securite'),
            'Superviseur sécurité': t('security_page.superviseur_securite')
        };
        return directTranslations[roleName] || roleName;
    };

    if (loading) {
        return (
            <div className="security-reservation-page">
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>{t('security_page.loading', 'Chargement...')}</p>
                </div>
            </div>
        );
    }

    if (reservationSuccess) {
        return (
            <div className="security-reservation-page">
                <div className="reservation-success-card">
                    <div className="reservation-success-content">
                        <div className="reservation-success-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" />
                            </svg>
                        </div>
                        <h2 className="reservation-success-title">{t('security_page.success_title')}</h2>
                        <p className="reservation-success-message">{t('security_page.success_message')}</p>
                        <button className="reservation-success-button" onClick={() => navigate('/security')}>{t('security_page.back_home')}</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="security-reservation-page">
            <div className="security-reservation-container">
                <div className="back-link-top-container">
                    <Link to="/security" className="back-link-top">
                        <span className="back-icon">←</span> {t('security_page.back_to_list', 'Back')}
                    </Link>
                </div>

                <header className="reservation-header">
                    <h1>{t('security_page.reservation_form_title')}</h1>
                    {role && <p className="reservation-subtitle">{getTranslatedRole(role.name)}</p>}
                </header>

                {error && (
                    <div className="error-container">
                        <p className="error-message">⚠️ {error}</p>
                        <button onClick={() => navigate(-1)} className="retry-button">
                            {t('security_page.back_to_list', 'Retour')}
                        </button>
                    </div>
                )}

                <div className="reservation-form-wrapper">
                    <form onSubmit={submitReservation}>
                        <div className="form-group">
                            <label>{t('security_page.reservation_type')}</label>
                            <select value={reservationForm.type_reservation} onChange={(e) => updateReservationField('type_reservation', e.target.value)}>
                                <option value="heures">{t('security_page.by_hours')}</option>
                                <option value="jours">{t('security_page.by_days')}</option>
                            </select>
                        </div>

                        {reservationForm.type_reservation === 'heures' ? (
                            <>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('security_page.date')}</label>
                                        <input type="date" required value={reservationForm.date_reservation} onChange={e => updateReservationField('date_reservation', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('security_page.start_time')}</label>
                                        <input type="time" required value={reservationForm.heure_debut} onChange={e => updateReservationField('heure_debut', e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('security_page.number_of_hours')}</label>
                                    <input type="number" min="1" required value={reservationForm.nombre_heures} onChange={e => updateReservationField('nombre_heures', e.target.value)} />
                                </div>
                            </>
                        ) : (
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('security_page.start_date')}</label>
                                    <input type="date" required value={reservationForm.date_debut} onChange={e => updateReservationField('date_debut', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className="form-group">
                                    <label>{t('security_page.end_date')}</label>
                                    <input type="date" required value={reservationForm.date_fin} onChange={e => updateReservationField('date_fin', e.target.value)} min={reservationForm.date_debut || new Date().toISOString().split('T')[0]} />
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>{t('security_page.fullname')}</label>
                            <input type="text" required value={reservationForm.fullname} onChange={e => updateReservationField('fullname', e.target.value)} placeholder={t('security_page.fullname_placeholder')} />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('security_page.phone_number')}</label>
                                <input type="tel" required value={reservationForm.phone} onChange={e => updateReservationField('phone', e.target.value)} placeholder={t('security_page.phone_placeholder')} />
                            </div>
                            <div className="form-group location-group">
                                <label>{t('security_page.location')}</label>
                                <div className="location-input-wrapper">
                                    <input
                                        type="text"
                                        required
                                        value={reservationForm.location}
                                        onChange={e => updateReservationField('location', e.target.value)}
                                        placeholder={t('security_page.location_placeholder')}
                                    />
                                    <button
                                        type="button"
                                        className="auto-location-btn"
                                        onClick={handleAutoLocation}
                                        title={t('security_page.auto_location')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="price-box">
                            <span className="price-label">{t('security_page.estimated_total', 'Total estimé')}</span>
                            <span className="price-value">{reservationForm.prix_total} DH</span>
                        </div>

                        <button type="submit" className="submit-reservation-btn" disabled={reservationLoading}>
                            {reservationLoading ? '...' : t('security_page.confirm_reservation')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

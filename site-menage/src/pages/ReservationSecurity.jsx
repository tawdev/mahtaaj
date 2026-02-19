import React, { useEffect, useState, useCallback } from 'react';
import './Security.css';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ReservationSecurity() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();

    const [roleData, setRoleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reservationLoading, setReservationLoading] = useState(false);
    const [reservationSuccess, setReservationSuccess] = useState(false);
    const [reservationForm, setReservationForm] = useState({
        type_reservation: 'heures',
        date_reservation: '',
        heure_debut: '',
        nombre_heures: 1,
        date_debut: '',
        date_fin: '',
        phone: '',
        prix_total: 150
    });
    const [toast, setToast] = useState({ show: false, text: '' });

    const loadRoleDetails = useCallback(async (roleId) => {
        try {
            setLoading(true);
            const { data, error: roleError } = await supabase
                .from('security_roles')
                .select('*')
                .eq('id', roleId)
                .single();

            if (roleError) throw roleError;
            setRoleData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (id) loadRoleDetails(id);

        // Initial check for session to fill phone
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setReservationForm(prev => ({
                    ...prev,
                    phone: session.user.user_metadata?.phone || ''
                }));
            }
        };
        checkSession();
    }, [id, loadRoleDetails]);

    const calculateReservationPrice = (form) => {
        const PRIX_BASE = 150;
        const PRIX_HEURE_SUPP = 40;
        const HEURES_PAR_JOUR = 8;

        if (form.type_reservation === 'heures') {
            const h = parseInt(form.nombre_heures) || 1;
            return h <= 4 ? PRIX_BASE : PRIX_BASE + (h - 4) * PRIX_HEURE_SUPP;
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

    const updateField = (key, val) => {
        setReservationForm(prev => {
            const next = { ...prev, [key]: val };
            next.prix_total = calculateReservationPrice(next);
            return next;
        });
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

            const userInfo = JSON.parse(localStorage.getItem('user_data') || localStorage.getItem('user') || '{}');

            const insertData = {
                user_id: session.user.id,
                firstname: userInfo.name || userInfo.firstname || 'Client',
                phone: reservationForm.phone,
                location: userInfo.location || 'Non spécifié',
                email: session.user.email,
                total_price: reservationForm.prix_total,
                status: 'pending',
                role_id: id,
                type_reservation: reservationForm.type_reservation,
                date_reservation: (reservationForm.date_reservation || reservationForm.date_debut) || null,
                heure_debut: reservationForm.heure_debut || null,
                date_debut: reservationForm.date_debut || null,
                date_fin: reservationForm.date_fin || null,
                nombre_heures: reservationForm.nombre_heures || null
            };

            const { error: insertError } = await supabase.from('reserve_security').insert(insertData);
            if (insertError) throw insertError;

            setReservationSuccess(true);
            sessionStorage.removeItem('security_pending_context');
        } catch (err) {
            console.error(err);
            setToast({ show: true, text: 'Erreur lors de la réservation' });
            setTimeout(() => setToast({ show: false, text: '' }), 3000);
        } finally {
            setReservationLoading(false);
        }
    };

    if (loading) return <div className="loader-container"><div className="admin-loader"></div></div>;
    if (!roleData) return <div className="error-container">Role not found</div>;

    return (
        <div className="reservation-security-page">
            <div className="security-details-hero">
                <div className="security-details-hero-content">
                    <Link to={`/security/role/${id}`} className="back-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12,19 5,12 12,5" />
                        </svg>
                        {t('security_page.back_to_details', 'Retour au détails')}
                    </Link>
                    <h1 className="security-details-title">
                        {t('security_page.reservation_title', 'Réservation')} - {t(`security_roles.${roleData.name.toLowerCase().replace(/\s+/g, '_')}.title`, roleData.name)}
                    </h1>
                    <p className="reservation-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {t('security_page.reservation_subtitle', 'Veuillez remplir les détails de votre protection.')}
                    </p>
                </div>
            </div>

            <div className="reservation-security-content">
                <div className="reservation-security-card" data-aos="fade-up">
                    <form onSubmit={submitReservation} className="security-reservation-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Type de réservation</label>
                                <select value={reservationForm.type_reservation} onChange={e => updateField('type_reservation', e.target.value)}>
                                    <option value="heures">Par heures</option>
                                    <option value="jours">Par jours</option>
                                </select>
                            </div>

                            {reservationForm.type_reservation === 'heures' ? (
                                <>
                                    <div className="form-group">
                                        <label>Date de service</label>
                                        <input type="date" required value={reservationForm.date_reservation} onChange={e => updateField('date_reservation', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div className="form-group">
                                        <label>Heure de début</label>
                                        <input type="time" required value={reservationForm.heure_debut} onChange={e => updateField('heure_debut', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Durée (heures)</label>
                                        <input type="number" min="1" max="24" required value={reservationForm.nombre_heures} onChange={e => updateField('nombre_heures', e.target.value)} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Date de début</label>
                                        <input type="date" required value={reservationForm.date_debut} onChange={e => updateField('date_debut', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div className="form-group">
                                        <label>Date de fin</label>
                                        <input type="date" required value={reservationForm.date_fin} onChange={e => updateField('date_fin', e.target.value)} min={reservationForm.date_debut || new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div className="form-group placeholder-group"></div>
                                </>
                            )}

                            <div className="form-group">
                                <label>Numéro de téléphone</label>
                                <input type="tel" required value={reservationForm.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+212 ..." />
                            </div>
                        </div>

                        <div className="price-summary-box">
                            <div className="price-row">
                                <span className="price-label">Prix Total Estimé</span>
                                <span className="price-value">{reservationForm.prix_total} DH</span>
                            </div>
                        </div>

                        <button type="submit" className="confirm-reservation-btn" disabled={reservationLoading}>
                            {reservationLoading ? <div className="btn-loader"></div> : 'Confirmer la réservation'}
                        </button>
                    </form>
                </div>
            </div>

            {reservationSuccess && (
                <div className="reservation-success-card">
                    <div className="reservation-success-content">
                        <div className="reservation-success-icon">✓</div>
                        <h2 className="reservation-success-title">Merci !</h2>
                        <p className="reservation-success-message">Votre demande a été envoyée avec succès.</p>
                        <button className="reservation-success-button" onClick={() => navigate('/security')}>Retour aux services</button>
                    </div>
                </div>
            )}

            {toast.show && <div className="toast-notification">{toast.text}</div>}
        </div>
    );
}

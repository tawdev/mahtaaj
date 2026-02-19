import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        // Handle the Supabase auth callback
        const handleAuthCallback = async () => {
            try {
                // Build the current URL to process the hash fragment
                // Supabase handles the hash parsing automatically via getSession() or onAuthStateChange
                // But we need to ensure the session is established

                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Auth callback error:", error);
                    navigate('/login-register');
                    return;
                }

                if (session) {
                    // Retrieve information for redirection
                    const savedReturnUrl = localStorage.getItem('auth_return_url');
                    const hasCleaningContext = sessionStorage.getItem('menage_cuisine_pending_context');
                    const hasCuisineContext = sessionStorage.getItem('cuisin_pending_context');
                    const hasSecurityContext = sessionStorage.getItem('security_pending_context');
                    const hasBebeContext = sessionStorage.getItem('bebe_pending_context');
                    const hasJardinageContext = sessionStorage.getItem('jardinage_pending_context');
                    const hasDriverContext = sessionStorage.getItem('driver_pending_context');
                    const hasHandworkerContext = sessionStorage.getItem('handworker_pending_context');

                    // Check for Menage reservation states
                    const airbnbState = sessionStorage.getItem('airbnb_pending_reservation_state');
                    const voitureState = sessionStorage.getItem('voiture_pending_reservation_state');
                    const lavageState = sessionStorage.getItem('lavage_ropassage_pending_reservation_state');
                    const tapisState = sessionStorage.getItem('tapis_canapes_pending_reservation_state');
                    const chaussuresState = sessionStorage.getItem('chaussures_pending_reservation_state');
                    const menageCompliteState = sessionStorage.getItem('menage_complite_pending_reservation_state');
                    const piscineState = sessionStorage.getItem('piscine_pending_reservation_state');
                    const bureauxState = sessionStorage.getItem('bureaux_usin_pending_reservation_state');

                    // Debug logging
                    console.log('[AuthCallback] savedReturnUrl:', savedReturnUrl);
                    console.log('[AuthCallback] voitureState:', voitureState ? 'EXISTS' : 'null');
                    console.log('[AuthCallback] airbnbState:', airbnbState ? 'EXISTS' : 'null');

                    // Priority: 
                    // 1. Explicit returnUrl (if it's not the home page '/')
                    // 2. Specific reservation states (Menage)
                    // 3. Other contexts
                    // 4. Default home

                    let returnUrl = savedReturnUrl;

                    // If returnUrl is just home or missing, try to find a better one from states
                    if (!returnUrl || returnUrl === '/') {
                        if (airbnbState) returnUrl = '/reservation-airbnb';
                        else if (voitureState) returnUrl = '/reservation-voiture';
                        else if (lavageState) returnUrl = '/reservation-lavage-ropassage';
                        else if (tapisState) returnUrl = '/reservation-tapis-canapes';
                        else if (chaussuresState) returnUrl = '/reservation-chaussures';
                        else if (menageCompliteState) returnUrl = '/reservation-menage-complite';
                        else if (piscineState) returnUrl = '/reservation-piscine';
                        else if (bureauxState) returnUrl = '/reservation-bureaux-usin';
                        else if (hasCleaningContext) returnUrl = '/menage-cuisine';
                        else if (hasCuisineContext) returnUrl = '/cuisin';
                        else if (hasSecurityContext) returnUrl = '/security';
                        else if (hasBebeContext) returnUrl = '/bebe-setting';
                        else if (hasJardinageContext) returnUrl = '/jardinage';
                        else if (hasDriverContext) returnUrl = '/driver';
                        else if (hasHandworkerContext) returnUrl = '/hand-workers';
                        else returnUrl = '/';
                    }

                    console.log("Auth success. Redirecting to:", returnUrl);
                    localStorage.removeItem('auth_return_url');

                    // Prepare state to pass if we have any reservation state
                    let navigationState = null;
                    if (airbnbState) {
                        try { navigationState = JSON.parse(airbnbState); } catch (e) { console.error('Error parsing airbnb state:', e); }
                    } else if (voitureState) {
                        try { navigationState = JSON.parse(voitureState); } catch (e) { console.error('Error parsing voiture state:', e); }
                    } else if (lavageState) {
                        try { navigationState = JSON.parse(lavageState); } catch (e) { console.error('Error parsing lavage state:', e); }
                    } else if (tapisState) {
                        try { navigationState = JSON.parse(tapisState); } catch (e) { console.error('Error parsing tapis state:', e); }
                    } else if (chaussuresState) {
                        try { navigationState = JSON.parse(chaussuresState); } catch (e) { console.error('Error parsing chaussures state:', e); }
                    } else if (menageCompliteState) {
                        try { navigationState = JSON.parse(menageCompliteState); } catch (e) { console.error('Error parsing menage complite state:', e); }
                    } else if (piscineState) {
                        try { navigationState = JSON.parse(piscineState); } catch (e) { console.error('Error parsing piscine state:', e); }
                    } else if (bureauxState) {
                        try { navigationState = JSON.parse(bureauxState); } catch (e) { console.error('Error parsing bureaux state:', e); }
                    }

                    // Redirect with state if available
                    if (navigationState) {
                        console.log("Restoring reservation state:", navigationState);
                        navigate(returnUrl, { replace: true, state: navigationState });
                    } else {
                        navigate(returnUrl, { replace: true });
                    }
                } else {
                    // No session found? Wait a bit or redirect to home/login
                    // Sometimes the hash processing takes a moment
                    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
                        if (event === 'SIGNED_IN' && session) {
                            const savedReturnUrl = localStorage.getItem('auth_return_url');
                            const hasCleaningContext = sessionStorage.getItem('menage_cuisine_pending_context');
                            const hasCuisineContext = sessionStorage.getItem('cuisin_pending_context');
                            const hasSecurityContext = sessionStorage.getItem('security_pending_context');
                            const hasBebeContext = sessionStorage.getItem('bebe_pending_context');
                            const hasJardinageContext = sessionStorage.getItem('jardinage_pending_context');
                            const hasDriverContext = sessionStorage.getItem('driver_pending_context');
                            const hasHandworkerContext = sessionStorage.getItem('handworker_pending_context');

                            // Check for Menage reservation states
                            const airbnbState = sessionStorage.getItem('airbnb_pending_reservation_state');
                            const voitureState = sessionStorage.getItem('voiture_pending_reservation_state');
                            const lavageState = sessionStorage.getItem('lavage_ropassage_pending_reservation_state');
                            const tapisState = sessionStorage.getItem('tapis_canapes_pending_reservation_state');
                            const chaussuresState = sessionStorage.getItem('chaussures_pending_reservation_state');
                            const menageCompliteState = sessionStorage.getItem('menage_complite_pending_reservation_state');
                            const piscineState = sessionStorage.getItem('piscine_pending_reservation_state');
                            const bureauxState = sessionStorage.getItem('bureaux_usin_pending_reservation_state');

                            // Debug logging
                            console.log('[AuthCallback Listener] savedReturnUrl:', savedReturnUrl);
                            console.log('[AuthCallback Listener] voitureState:', voitureState ? 'EXISTS' : 'null');

                            // Same logic as above for the listener
                            let returnUrl = savedReturnUrl;
                            if (!returnUrl || returnUrl === '/') {
                                if (airbnbState) returnUrl = '/reservation-airbnb';
                                else if (voitureState) returnUrl = '/reservation-voiture';
                                else if (lavageState) returnUrl = '/reservation-lavage-ropassage';
                                else if (tapisState) returnUrl = '/reservation-tapis-canapes';
                                else if (chaussuresState) returnUrl = '/reservation-chaussures';
                                else if (menageCompliteState) returnUrl = '/reservation-menage-complite';
                                else if (piscineState) returnUrl = '/reservation-piscine';
                                else if (bureauxState) returnUrl = '/reservation-bureaux-usin';
                                else if (hasCleaningContext) returnUrl = '/menage-cuisine';
                                else if (hasCuisineContext) returnUrl = '/cuisin';
                                else if (hasSecurityContext) returnUrl = '/security';
                                else if (hasBebeContext) returnUrl = '/bebe-setting';
                                else if (hasJardinageContext) returnUrl = '/jardinage';
                                else if (hasDriverContext) returnUrl = '/driver';
                                else if (hasHandworkerContext) returnUrl = '/hand-workers';
                                else returnUrl = '/';
                            }

                            console.log("Auth callback (listener). Redirecting to:", returnUrl);
                            localStorage.removeItem('auth_return_url');

                            // Prepare state to pass if we have any reservation state
                            let navigationState = null;
                            if (airbnbState) {
                                try { navigationState = JSON.parse(airbnbState); } catch (e) { console.error('Error parsing airbnb state:', e); }
                            } else if (voitureState) {
                                try { navigationState = JSON.parse(voitureState); } catch (e) { console.error('Error parsing voiture state:', e); }
                            } else if (lavageState) {
                                try { navigationState = JSON.parse(lavageState); } catch (e) { console.error('Error parsing lavage state:', e); }
                            } else if (tapisState) {
                                try { navigationState = JSON.parse(tapisState); } catch (e) { console.error('Error parsing tapis state:', e); }
                            } else if (chaussuresState) {
                                try { navigationState = JSON.parse(chaussuresState); } catch (e) { console.error('Error parsing chaussures state:', e); }
                            } else if (menageCompliteState) {
                                try { navigationState = JSON.parse(menageCompliteState); } catch (e) { console.error('Error parsing menage complite state:', e); }
                            } else if (piscineState) {
                                try { navigationState = JSON.parse(piscineState); } catch (e) { console.error('Error parsing piscine state:', e); }
                            } else if (bureauxState) {
                                try { navigationState = JSON.parse(bureauxState); } catch (e) { console.error('Error parsing bureaux state:', e); }
                            }

                            // Redirect with state if available
                            if (navigationState) {
                                console.log("Restoring reservation state (listener):", navigationState);
                                navigate(returnUrl, { replace: true, state: navigationState });
                            } else {
                                navigate(returnUrl, { replace: true });
                            }
                            listener.subscription.unsubscribe();
                        }
                    });
                }
            } catch (err) {
                console.error("Auth callback exception:", err);
                navigate('/', { replace: true });
            }
        };

        handleAuthCallback();
    }, [navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#f8fafc'
        }}>
            <div className="loading-spinner" style={{
                width: '50px',
                height: '50px',
                border: '5px solid #e2e8f0',
                borderTop: '5px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '20px', color: '#64748b', fontSize: '1.1rem' }}>
                Redirection en cours...
            </p>
            <style>
                {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
            </style>
        </div>
    );
}

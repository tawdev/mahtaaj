import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * GoogleOneTap Component
 * Implements "Sign in with Google" prompt (One Tap)
 * 
 * Requirements:
 * 1. Must be placed in a top-level component or Home page.
 * 2. VITE_GOOGLE_CLIENT_ID must be set in .env
 * 3. origin must be HTTPS or localhost.
 */
const GoogleOneTap = () => {
    useEffect(() => {
        // Define handleGoogleCallback inside effect to access the computed nonce
        const handleGoogleCallback = async (response, nonce) => {
            console.log('[GoogleOneTap] Credential received');

            try {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: response.credential,
                    nonce: nonce, // Pass the same nonce to Supabase
                });

                if (error) {
                    console.error('[GoogleOneTap] Supabase auth error:', error);
                    return;
                }

                if (data.session) {
                    console.log('[GoogleOneTap] Successfully authenticated');
                    // App.jsx handles the session change via onAuthStateChange
                }
            } catch (err) {
                console.error('[GoogleOneTap] Exception:', err);
            }
        };

        const initializeGoogleOneTap = () => {
            if (!window.google) return;

            const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

            if (!clientId) {
                console.warn('[GoogleOneTap] Missing REACT_APP_GOOGLE_CLIENT_ID. One Tap disabled.');
                return;
            }

            // Create a nonce for security and to match Supabase requirements
            // This is a simple random string
            const nonce = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            try {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: (res) => handleGoogleCallback(res, nonce),
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    context: 'signin',
                    nonce: nonce, // Use the nonce here
                });

                window.google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed()) {
                        console.log('[GoogleOneTap] Not displayed reason:', notification.getNotDisplayedReason());
                    } else if (notification.isSkippedMoment()) {
                        console.log('[GoogleOneTap] Skipped reason:', notification.getSkippedReason());
                    } else if (notification.isDismissedMoment()) {
                        console.log('[GoogleOneTap] Dismissed reason:', notification.getDismissedReason());
                    }
                });
            } catch (err) {
                console.error('[GoogleOneTap] Initialization error:', err);
            }
        };

        // 1. Check if user is already authenticated
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                console.log('[GoogleOneTap] User already signed in, skipping.');
                return;
            }

            // 2. Load Google Identity Services script if not already present
            if (!window.google?.accounts) {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = initializeGoogleOneTap;
                document.body.appendChild(script);
            } else {
                initializeGoogleOneTap();
            }
        };

        checkSession();
    }, []);

    return null;
};

export default GoogleOneTap;

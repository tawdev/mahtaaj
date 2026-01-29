import { supabase } from './supabase';

/**
 * AuthService provides helper functions for Supabase Authentication
 */
export const AuthService = {
    /**
     * Initiates Google OAuth Sign In
     * Handles mobile/Safari specific requirements
     */
    async signInWithGoogle() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Use a specific path for redirect to avoid # issues at the root if possible
                    // However, window.location.origin is usually fine if Site URL is set correctly
                    redirectTo: `${window.location.origin}/login-register`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                    },
                },
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error during Google Sign In:', error.message);
            throw error;
        }
    },

    /**
     * Signs out the user
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // Clear local storage items that might be used manually
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    },

    /**
     * Gets the current session
     */
    async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    },

    /**
     * Listens for auth state changes
     */
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    },

    /**
     * Checks if a user's email is verified
     */
    async isEmailVerified(user) {
        if (!user) return false;
        return !!user.email_confirmed_at;
    }
};

export default AuthService;

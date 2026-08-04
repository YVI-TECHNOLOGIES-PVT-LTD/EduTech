import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/api-client';

export const AuthService = {
    /**
     * Sign in with email and password.
     */
    login: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    /**
     * Sign out the current user and clear the Supabase session.
     */
    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * Send a password reset email.
     */
    forgotPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
    },

    /**
     * Update the current user's password (after PASSWORD_RECOVERY flow).
     */
    resetPassword: async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
    },

    /**
     * Change password by first re-authenticating with the current password.
     */
    changePassword: async (email: string, currentPassword: string, newPassword: string) => {
        // Re-authenticate to verify current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: currentPassword,
        });
        if (signInError) throw new Error('Current password is incorrect.');

        // Update to new password
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) throw updateError;
    },

    /**
     * Fetch the enriched user profile from the backend.
     */
    getCurrentUser: async () => {
        const res = await apiClient.get('/me');
        return res.data.user;
    },
};

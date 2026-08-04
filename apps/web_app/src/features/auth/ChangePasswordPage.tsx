import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ChangePasswordFormProps {
    onSuccess?: () => void;
}

/**
 * ChangePasswordPage — can be used inline inside Profile/Security tab
 * OR as a standalone page at /change-password
 */
export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirm) {
            setError('New passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters.');
            return;
        }
        if (currentPassword === newPassword) {
            setError('New password must be different from current password.');
            return;
        }

        setLoading(true);
        setError(null);

        // Re-authenticate with current password first (verify it's valid)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            setError('Unable to determine account. Please log in again.');
            setLoading(false);
            return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        });

        if (signInError) {
            setError('Current password is incorrect.');
            setLoading(false);
            return;
        }

        // Now update to the new password
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        setLoading(false);

        if (updateError) {
            setError(updateError.message);
        } else {
            setDone(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirm('');
            onSuccess?.();
        }
    };

    if (done) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-6 text-center"
            >
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-900">Password changed successfully.</p>
                <button
                    onClick={() => setDone(false)}
                    className="text-xs text-primary font-semibold hover:underline"
                >
                    Change again
                </button>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold p-3 rounded-xl"
                >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </motion.div>
            )}

            {[
                { id: 'current-password', label: 'Current Password', value: currentPassword, setter: setCurrentPassword },
                { id: 'new-password-change', label: 'New Password', value: newPassword, setter: setNewPassword },
                { id: 'confirm-new-password', label: 'Confirm New Password', value: confirm, setter: setConfirm },
            ].map(field => (
                <div key={field.id}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        {field.label}
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            id={field.id}
                            type={showPasswords ? 'text' : 'password'}
                            required
                            value={field.value}
                            onChange={e => field.setter(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-gray-50 focus:bg-white focus:border-primary focus:outline-none transition-all"
                        />
                        {field.id === 'confirm-new-password' && (
                            <button
                                type="button"
                                onClick={() => setShowPasswords(v => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                </div>
            ))}

            <button
                id="change-password-submit"
                type="submit"
                disabled={loading || !currentPassword || !newPassword || !confirm}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                ) : (
                    'Update Password'
                )}
            </button>
        </form>
    );
}

// Standalone page wrapper
export default function ChangePasswordPage() {
    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <h1 className="text-2xl font-black text-gray-900 mb-1">Change Password</h1>
                <p className="text-sm text-gray-500 mb-8">Keep your ERP account secure with a strong password.</p>
                <ChangePasswordForm />
            </div>
        </div>
    );
}

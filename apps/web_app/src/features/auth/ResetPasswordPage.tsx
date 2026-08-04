import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Supabase puts the recovery token in the URL hash — it auto-sets the session
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Session is set; user can now update password
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const passwordStrength = (): { label: string; color: string; width: string } => {
        const len = password.length;
        if (len === 0) return { label: '', color: 'bg-gray-200', width: 'w-0' };
        if (len < 6) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
        if (len < 10) return { label: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
        if (len < 14) return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
        return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            setError(error.message);
        } else {
            setDone(true);
            setTimeout(() => navigate('/login'), 3000);
        }
    };

    const strength = passwordStrength();

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                {done ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 text-center"
                    >
                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Password Updated!</h1>
                        <p className="text-gray-500 text-sm">Redirecting to login in 3 seconds...</p>
                    </motion.div>
                ) : (
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-1">Set new password</h1>
                        <p className="text-sm text-gray-500 mb-8">Choose a strong password for your ERP account.</p>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold p-3 rounded-xl mb-6"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="new-password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Min. 8 characters"
                                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-gray-50 focus:bg-white focus:border-primary focus:outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {/* Strength bar */}
                                {password && (
                                    <div className="mt-2">
                                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${strength.color} ${strength.width}`} />
                                        </div>
                                        <p className={`text-[10px] font-bold mt-1 ${strength.color.replace('bg-', 'text-')}`}>
                                            {strength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="confirm-password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        placeholder="Repeat new password"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-gray-50 focus:bg-white focus:border-primary focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                id="reset-password-submit"
                                type="submit"
                                disabled={loading || !password || !confirm}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Updating password...</>
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

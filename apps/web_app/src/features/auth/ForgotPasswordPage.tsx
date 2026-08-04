import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, GraduationCap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            setSent(true);
        }
    };

    return (
        <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Left Panel */}
            <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative bg-hero-gradient lg:h-screen lg:sticky lg:top-0 overflow-hidden"
            >
                <div className="absolute inset-0 bg-hero-pattern opacity-20" />
                <div className="absolute top-20 right-20 w-72 h-72 bg-gold/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white h-full">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-xl mb-8">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-center mb-4">Password Recovery</h2>
                    <p className="text-white/70 text-center max-w-xs leading-relaxed text-sm">
                        We'll send a secure password reset link to your registered email address.
                    </p>
                </div>
            </motion.div>

            {/* Right Panel */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Login
                    </Link>

                    {sent ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center"
                        >
                            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 mb-2">Check your inbox</h1>
                            <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                A password reset link has been sent to <strong>{email}</strong>. It expires in 60 minutes.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:bg-primary/90 transition-colors"
                            >
                                Return to Login
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                            <h1 className="text-2xl font-black text-gray-900 mb-1">Forgot password?</h1>
                            <p className="text-sm text-gray-500 mb-8">Enter your registered email and we'll send a reset link.</p>

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

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            id="forgot-email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="you@school.edu"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-gray-50 focus:bg-white focus:border-primary focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    id="forgot-password-submit"
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Sending reset link...</>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

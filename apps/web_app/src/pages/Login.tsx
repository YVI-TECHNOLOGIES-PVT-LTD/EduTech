import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Mail, Lock, ArrowRight, AlertCircle, Home, Sparkles, ShieldCheck, Sun, Moon } from 'lucide-react';
import { SCHOOL_INFO } from '@/lib/public-constants';
import { useTheme } from '../hooks/theme/useTheme';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get('redirect') || '/app/dashboard';
    
    // Theme configuration
    const { theme, setTheme } = useTheme();

    // Slideshow details for carousel highlights
    const [currentSlide, setCurrentSlide] = useState(0);
    const slides = [
        {
            title: "Excellence in Education",
            description: "Empowering 5000+ students to reach their full potential with state-of-the-art campus facilities.",
            accent: "Education"
        },
        {
            title: "Real-time Metrics Tracking",
            description: "Cohesive dashboards mapping academic metrics, attendance metrics, and syllabus progress records.",
            accent: "Metrics"
        },
        {
            title: "Secure Ledger Transactions",
            description: "Fully automated, secure fee transaction cycles supporting online references logging.",
            accent: "Ledger"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate(redirect);
        }
    };

    return (
        <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#F8FAFC] dark:bg-[#090D16] transition-colors duration-300">
            
            {/* Left Panel - Premium split design illustration & slideshow */}
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-primary/95 to-slate-950 lg:h-screen lg:sticky lg:top-0 overflow-hidden items-center justify-center border-r border-border/10"
            >
                {/* Visual Glow Highlights */}
                <div className="absolute top-20 right-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

                {/* Slideshow Content Container */}
                <div className="relative z-10 w-full max-w-xl p-12 text-white">
                    
                    {/* Brand Identifier */}
                    <div className="mb-12 flex items-center gap-3">
                        <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-premium-lg">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-sm uppercase tracking-widest text-white leading-none">EduTrack</span>
                            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest mt-0.5">Enterprise ERP</span>
                        </div>
                    </div>

                    <div className="min-h-[220px] flex flex-col justify-end">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.5 }}
                                className="space-y-4"
                            >
                                <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight">
                                    {slides[currentSlide].title.split(slides[currentSlide].accent)[0]}
                                    <span className="text-primary bg-white/15 px-3.5 py-0.5 rounded-2xl backdrop-blur-sm border border-white/10 shadow-premium-sm">{slides[currentSlide].accent}</span>
                                    {slides[currentSlide].title.split(slides[currentSlide].accent)[1]}
                                </h1>
                                <p className="text-sm font-semibold text-white/70 leading-relaxed max-w-md">
                                    {slides[currentSlide].description}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Carousel Dots */}
                    <div className="flex gap-2 mt-8">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Right Panel - Elegant form details */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative min-h-screen">
                
                {/* Header Actions: Back to Website & Theme toggle */}
                <div className="absolute top-6 right-6 flex items-center gap-3 z-35">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2.5 bg-white dark:bg-card border border-border/40 text-muted-foreground hover:text-primary rounded-xl transition-all shadow-premium-sm"
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
                    </button>
                    
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-primary transition-colors border border-border/40 bg-white dark:bg-card px-4 py-2.5 rounded-xl shadow-premium-sm"
                    >
                        <Home className="w-4 h-4" />
                        <span>Home</span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white/80 dark:bg-card/75 backdrop-blur-xl rounded-3xl border border-border/40 p-8 sm:p-10 shadow-premium-lg">
                        
                        {/* Header logo / titles */}
                        <div className="text-center mb-8">
                            <GraduationCap className="w-10 h-10 text-primary mx-auto mb-4" />
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                Access Workspace
                            </h2>
                            <p className="text-xs font-semibold text-muted-foreground mt-1.5">
                                Sign in to load your role settings dashboard
                            </p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-6 rounded-xl border border-red-500/10 bg-red-500/5 p-4 flex items-start gap-3"
                            >
                                <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-bold text-red-500 leading-relaxed">{error}</p>
                            </motion.div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Email Address */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 text-sm font-semibold rounded-xl border border-border bg-gray-50/50 dark:bg-muted/10 focus:outline-none focus:border-primary focus:bg-white transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="Enter account password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 text-sm font-semibold rounded-xl border border-border bg-gray-50/50 dark:bg-muted/10 focus:outline-none focus:border-primary focus:bg-white transition-all duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            {/* Options: Remember & Forgot link */}
                            <div className="flex items-center justify-between text-xs font-bold">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary w-4 h-4"
                                    />
                                    <span className="text-muted-foreground">Keep me signed in</span>
                                </label>
                                <a href="#" className="text-primary hover:underline">
                                    Forgot password?
                                </a>
                            </div>

                            {/* Submit Login Action */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-premium-md shadow-glow hover:scale-[1.015] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                            >
                                <span>{loading ? 'Validating credentials...' : 'Enter Dashboard Workspace'}</span>
                                {!loading && <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />}
                            </button>
                        </form>

                        {/* Admissions Apply Footnotes */}
                        <div className="mt-8 pt-6 border-t border-border/40 text-center">
                            <p className="text-xs font-bold text-muted-foreground">
                                Interested in enrollment?{' '}
                                <Link to="/admissions" className="text-primary hover:underline font-black">
                                    Apply for Admission
                                </Link>
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mt-6 flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Protected by enterprise validation protocols
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
export { LoginPage };

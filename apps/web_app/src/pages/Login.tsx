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
                className="hidden lg:flex lg:w-1/2 relative bg-[#063F40] text-white lg:h-screen lg:sticky lg:top-0 overflow-hidden items-center justify-center border-r border-white/10"
            >
                {/* Visual Glow Highlights */}
                <div className="absolute top-20 right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Slideshow Content Container */}
                <div className="relative z-10 w-full max-w-xl p-12 text-white">
                    
                    {/* Brand Identifier */}
                    <div className="mb-12 flex items-center gap-3">
                        <div className="w-11 h-11 bg-[#E7B76A] text-[#063F40] rounded-2xl flex items-center justify-center font-black shadow-md">
                            <GraduationCap className="w-6 h-6 text-[#063F40]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-sm uppercase tracking-widest text-white leading-none">EduTrack</span>
                            <span className="text-[9px] font-black text-[#E7B76A] uppercase tracking-widest mt-0.5">Enterprise ERP</span>
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
                                <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight text-white">
                                    {slides[currentSlide].title.split(slides[currentSlide].accent)[0]}
                                    <span className="text-[#063F40] bg-[#E7B76A] px-3.5 py-0.5 rounded-2xl font-black border border-white/20 shadow-md">{slides[currentSlide].accent}</span>
                                    {slides[currentSlide].title.split(slides[currentSlide].accent)[1]}
                                </h1>
                                <p className="text-sm font-semibold text-emerald-100/90 leading-relaxed max-w-md">
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
                                className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-8 bg-[#E7B76A]' : 'w-2 bg-white/30'}`}
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
                        className="p-2.5 bg-white dark:bg-card border border-border/40 text-muted-foreground hover:text-foreground rounded-xl transition-all shadow-xs"
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                    </button>
                    
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-[#063F40] dark:hover:text-emerald-300 transition-colors border border-border/40 bg-white dark:bg-card px-4 py-2.5 rounded-xl shadow-xs"
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
                    <div className="bg-card border border-border/80 rounded-3xl p-8 sm:p-10 shadow-xs">
                        
                        {/* Header logo / titles */}
                        <div className="text-center mb-8">
                            <div className="w-12 h-12 bg-[#063F40] text-[#E7B76A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
                                <GraduationCap className="w-6 h-6 text-[#E7B76A]" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
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
                                className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3"
                            >
                                <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-bold text-red-500 leading-relaxed">{error}</p>
                            </motion.div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Email Address */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-foreground">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 text-sm font-semibold rounded-xl border border-border/80 bg-background focus:outline-none focus:border-[#063F40] focus:ring-2 focus:ring-[#063F40]/30 transition-all duration-200 text-foreground"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-foreground">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="Enter account password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 text-sm font-semibold rounded-xl border border-border/80 bg-background focus:outline-none focus:border-[#063F40] focus:ring-2 focus:ring-[#063F40]/30 transition-all duration-200 text-foreground"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
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
                                        className="w-4 h-4 rounded border-border text-[#063F40] focus:ring-[#063F40]"
                                    />
                                    <span className="text-muted-foreground">Keep me signed in</span>
                                </label>
                                <a href="#" className="text-[#063F40] dark:text-emerald-400 hover:underline">
                                    Forgot password?
                                </a>
                            </div>

                            {/* Submit Login Action */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#063F40] hover:bg-[#082F35] text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-md hover:scale-[1.015] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <span className="text-[#E7B76A]">{loading ? 'Validating credentials...' : 'Enter Dashboard Workspace'}</span>
                                {!loading && <ArrowRight className="w-4 h-4 text-[#E7B76A] group-hover:translate-x-0.5 transition-transform" />}
                            </button>
                        </form>

                        {/* Admissions Apply Footnotes */}
                        <div className="mt-8 pt-6 border-t border-border/40 text-center">
                            <p className="text-xs font-bold text-muted-foreground">
                                Interested in enrollment?{' '}
                                <Link to="/admissions" className="text-[#063F40] dark:text-emerald-400 hover:underline font-black">
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

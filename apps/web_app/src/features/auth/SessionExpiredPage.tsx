import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, LogIn, ShieldAlert } from 'lucide-react';

export default function SessionExpiredPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reason = searchParams.get('reason');

    const reasonMessages: Record<string, string> = {
        expired: 'Your session has expired due to inactivity.',
        revoked: 'Your session was revoked by an administrator.',
        'device-change': 'A new device login was detected and this session was terminated.',
        default: 'Your session is no longer valid.',
    };

    const message = reasonMessages[reason || 'default'] || reasonMessages['default'];

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white rounded-3xl p-10 shadow-xl border border-gray-100 text-center"
            >
                <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <Clock className="w-10 h-10" />
                </motion.div>

                <h1 className="text-2xl font-black text-gray-900 mb-2">Session Expired</h1>
                <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                    {message} Please sign in again to continue using the ERP.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        id="session-expired-login"
                        onClick={() => navigate('/login')}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                        <LogIn className="w-4 h-4" />
                        Sign In Again
                    </button>
                    <Link
                        to="/"
                        className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Go to Home
                    </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Your data is safe. Sessions expire for security.
                </div>
            </motion.div>
        </div>
    );
}

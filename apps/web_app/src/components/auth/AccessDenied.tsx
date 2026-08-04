import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

interface AccessDeniedProps {
    title?: string;
    message?: string;
    showBackLink?: boolean;
}

export function AccessDenied({
    title = 'Access Denied',
    message = 'You do not have permission to view this page. Contact your administrator if you believe this is an error.',
    showBackLink = true,
}: AccessDeniedProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center mb-5">
                <ShieldAlert className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">{message}</p>
            {showBackLink && (
                <Link
                    to="/app/dashboard"
                    className="text-sm font-semibold text-primary hover:underline"
                >
                    Return to Dashboard
                </Link>
            )}
        </div>
    );
}

export default AccessDenied;

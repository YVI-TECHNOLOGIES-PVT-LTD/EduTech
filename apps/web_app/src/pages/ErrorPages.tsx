import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Compass, ServerCrash } from 'lucide-react';
import { Button } from '../components/ui/button';

export const ForbiddenPage = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-8 text-center">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                    You do not possess the required RBAC credentials to view this page. Please return to the dashboard.
                </p>
                <Button onClick={() => navigate('/app/dashboard')} className="w-full rounded-xl">
                    Back to Dashboard
                </Button>
            </div>
        </div>
    );
};

export const NotFoundPage = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-8 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Compass className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Page Not Found</h1>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                    The URL path you entered does not map to any active ERP module. Please double check the routing path.
                </p>
                <Button onClick={() => navigate('/app/dashboard')} className="w-full rounded-xl">
                    Back to Dashboard
                </Button>
            </div>
        </div>
    );
};

export const ServerErrorPage = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-8 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ServerCrash className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Server Error</h1>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                    The backend API returned an internal exception. Please try again or report to support if it persists.
                </p>
                <Button onClick={() => navigate('/app/dashboard')} className="w-full rounded-xl">
                    Back to Dashboard
                </Button>
            </div>
        </div>
    );
};

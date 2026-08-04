import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../ui/Loading';

export const GuestRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loading message="Checking session state..." />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/app/dashboard" replace />;
    }

    return <Outlet />;
};

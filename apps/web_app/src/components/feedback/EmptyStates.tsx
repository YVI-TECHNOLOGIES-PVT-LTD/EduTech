import React from 'react';
import { Database, ShieldAlert, WifiOff, Settings } from 'lucide-react';

export const NoData = ({ title = 'No records found', message = 'Create a new record or adjust your filter search.' }: { title?: string; message?: string }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <Database className="w-10 h-10 text-gray-300 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 max-w-xs mt-1">{message}</p>
        </div>
    );
};

export const NoPermissionState = () => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <ShieldAlert className="w-12 h-12 text-amber-500 mb-4 animate-bounce" />
            <h2 className="text-xl font-bold text-gray-900 mb-1">Access Restricted</h2>
            <p className="text-sm text-gray-500 max-w-md">
                You do not possess the required RBAC credentials to view this content. Contact the System Administrator if you believe this is an error.
            </p>
        </div>
    );
};

export const OfflineState = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 bg-gray-50">
            <WifiOff className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">Network Connection Dropped</h2>
            <p className="text-gray-500 max-w-md mb-4">
                Please check your internet settings. We will automatically reconnect you once a valid connection is detected.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow"
            >
                Reload Page
            </button>
        </div>
    );
};

export const MaintenanceState = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6">
            <Settings className="w-16 h-16 text-primary animate-spin mb-4" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">Scheduled Maintenance</h2>
            <p className="text-gray-500 max-w-md">
                The school platform is currently receiving a version upgrade. We apologize for the inconvenience and expect to be back online shortly.
            </p>
        </div>
    );
};

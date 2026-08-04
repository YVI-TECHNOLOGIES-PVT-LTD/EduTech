import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const TransportDiagnostics = () => {
    const { user } = useAuth();
    const [diagnostics, setDiagnostics] = useState<any>({
        user: null,
        permissions: [],
        apiTests: {}
    });

    useEffect(() => {
        const runDiagnostics = async () => {
            const results: any = {
                user: user,
                permissions: user?.permissions || [],
                apiTests: {}
            };

            // Test each API endpoint
            const endpoints = [
                { name: 'Live Trips', url: '/transport/trips/live', permission: 'TRIP_MONITOR' },
                { name: 'Recent Incidents', url: '/transport/incidents/recent', permission: 'TRIP_MONITOR' },
                { name: 'Punctuality Analytics', url: '/transport/analytics/punctuality', permission: 'TRIP_MONITOR' },
                { name: 'Routes', url: '/transport/routes', permission: 'TRANSPORT_VIEW' },
                { name: 'Vehicles', url: '/transport/vehicles', permission: 'TRANSPORT_VIEW' },
                { name: 'Drivers', url: '/transport/drivers', permission: 'TRANSPORT_VIEW' },
                { name: 'Stops', url: '/transport/stops', permission: 'TRANSPORT_VIEW' },
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await apiClient.get(endpoint.url);
                    results.apiTests[endpoint.name] = {
                        status: 'success',
                        statusCode: response.status,
                        dataCount: Array.isArray(response.data) ? response.data.length : 'N/A',
                        permission: endpoint.permission
                    };
                } catch (error: any) {
                    results.apiTests[endpoint.name] = {
                        status: 'error',
                        statusCode: error.response?.status || 'Network Error',
                        error: error.response?.data?.error || error.message,
                        permission: endpoint.permission
                    };
                }
            }

            setDiagnostics(results);
        };

        if (user) {
            runDiagnostics();
        }
    }, [user]);

    const requiredPermissions = [
        'TRANSPORT_SETUP',
        'TRANSPORT_VIEW',
        'TRANSPORT_ASSIGN',
        'TRIP_MONITOR',
        'STUDENT_VIEW'
    ];

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900">Transport Admin Diagnostics</h1>
                <p className="text-gray-500 mt-1">System health check and permission verification</p>
            </div>

            {/* User Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4">User Information</h2>
                <div className="space-y-2 font-mono text-sm">
                    <div><span className="font-bold">Email:</span> {diagnostics.user?.email}</div>
                    <div><span className="font-bold">Roles:</span> {diagnostics.user?.roles?.join(', ')}</div>
                    <div><span className="font-bold">School ID:</span> {diagnostics.user?.school_id}</div>
                </div>
            </div>

            {/* Permission Check */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4">Required Permissions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {requiredPermissions.map(perm => {
                        const hasPermission = diagnostics.permissions.includes(perm);
                        return (
                            <div key={perm} className={`flex items-center gap-3 p-3 rounded-lg ${hasPermission ? 'bg-green-50' : 'bg-red-50'}`}>
                                {hasPermission ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                )}
                                <span className={`font-mono text-sm ${hasPermission ? 'text-green-700' : 'text-red-700'}`}>
                                    {perm}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* API Endpoint Tests */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4">API Endpoint Tests</h2>
                <div className="space-y-3">
                    {Object.entries(diagnostics.apiTests).map(([name, test]: [string, any]) => (
                        <div key={name} className={`p-4 rounded-lg border-2 ${test.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                            }`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {test.status === 'success' ? (
                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    )}
                                    <div>
                                        <div className="font-bold text-gray-900">{name}</div>
                                        <div className="text-sm text-gray-600">
                                            Status: <span className="font-mono">{test.statusCode}</span>
                                            {test.dataCount !== 'N/A' && ` • Records: ${test.dataCount}`}
                                        </div>
                                        {test.error && (
                                            <div className="text-sm text-red-600 mt-1 font-mono">{test.error}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                    {test.permission}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Items */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-amber-900 mb-2">If you see errors above:</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-amber-800">
                            <li>Open Supabase Dashboard → SQL Editor</li>
                            <li>Run the SQL from: <code className="bg-amber-100 px-2 py-1 rounded">FIX_TRANSPORT_ADMIN_PERMISSIONS.sql</code></li>
                            <li>Logout and login again</li>
                            <li>Refresh this page to re-run diagnostics</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

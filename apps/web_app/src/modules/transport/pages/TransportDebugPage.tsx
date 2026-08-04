import { useAuth } from '../../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const TransportDebugPage = () => {
    const { user, hasRole, hasPermission } = useAuth();
    const location = useLocation();

    const requiredPermissions = [
        'TRANSPORT_SETUP',
        'TRANSPORT_ASSIGN',
        'TRIP_MONITOR',
        'TRANSPORT_VIEW_SELF'
    ];

    const requiredRoles = [
        'TRANSPORT_ADMIN',
        'ADMIN',
        'HEAD_OF_INSTITUTE'
    ];

    const transportRoutes = [
        { path: '/app/transport/overview', label: 'Admin Dashboard', permission: 'TRIP_MONITOR' },
        { path: '/app/transport/setup', label: 'Transport Setup', permission: 'TRANSPORT_SETUP' },
        { path: '/app/transport/assign', label: 'Student Assignment', permission: 'TRANSPORT_ASSIGN' },
        { path: '/app/transport/monitor', label: 'Live Monitor', permission: 'TRIP_MONITOR' },
        { path: '/app/transport/incidents', label: 'Incidents', permission: 'TRANSPORT_SETUP' },
        { path: '/app/transport/manifests', label: 'Manifests', permission: 'TRANSPORT_SETUP' },
        { path: '/app/transport/analytics', label: 'Analytics', permission: 'TRIP_MONITOR' },
        { path: '/app/transport/my', label: 'My Transport', permission: 'TRANSPORT_VIEW_SELF' },
    ];

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Transport Module Diagnostics</h1>
                <p className="text-gray-500">Debug information for transport admin portal access</p>
            </div>

            {/* User Information */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Current User Information</h2>
                <div className="space-y-2 font-mono text-sm">
                    <div className="grid grid-cols-3 gap-4">
                        <span className="text-gray-500">Email:</span>
                        <span className="col-span-2 font-bold">{user?.email || 'Not logged in'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <span className="text-gray-500">Name:</span>
                        <span className="col-span-2 font-bold">{user?.full_name || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <span className="text-gray-500">User ID:</span>
                        <span className="col-span-2 font-bold">{user?.id || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <span className="text-gray-500">Current Path:</span>
                        <span className="col-span-2 font-bold">{location.pathname}</span>
                    </div>
                </div>
            </div>

            {/* Roles Check */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Role Assignments</h2>
                <div className="space-y-3">
                    <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">Assigned Roles:</p>
                        <div className="flex flex-wrap gap-2">
                            {user?.roles && user.roles.length > 0 ? (
                                user.roles.map(role => (
                                    <span key={role} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                        {role}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-400 italic">No roles assigned</span>
                            )}
                        </div>
                    </div>

                    <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-sm font-bold text-amber-900 mb-2">Actual Permissions Array:</p>
                        <div className="flex flex-wrap gap-2">
                            {user?.permissions && user.permissions.length > 0 ? (
                                user.permissions.map(perm => (
                                    <span key={perm} className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-mono">
                                        {perm}
                                    </span>
                                ))
                            ) : (
                                <span className="text-amber-600 italic text-sm">No permissions in user object!</span>
                            )}
                        </div>
                        <p className="text-xs text-amber-700 mt-2">
                            Total: {user?.permissions?.length || 0} permissions
                        </p>
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm text-gray-500 mb-3">Required Roles for Transport Admin:</p>
                        <div className="space-y-2">
                            {requiredRoles.map(role => {
                                const hasIt = hasRole(role);
                                return (
                                    <div key={role} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                                        {hasIt ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-400" />
                                        )}
                                        <span className={`font-mono text-sm ${hasIt ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                                            {role}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Permissions Check */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Permission Checks</h2>
                <div className="space-y-2">
                    {requiredPermissions.map(permission => {
                        const hasIt = hasPermission(permission);
                        return (
                            <div key={permission} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                                {hasIt ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-400" />
                                )}
                                <span className={`font-mono text-sm ${hasIt ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                                    {permission}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Route Access Check */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Transport Route Access</h2>
                <div className="space-y-2">
                    {transportRoutes.map(route => {
                        const hasAccess = hasPermission(route.permission);
                        return (
                            <div key={route.path} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                                <div className="flex items-center gap-3">
                                    {hasAccess ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-400" />
                                    )}
                                    <div>
                                        <div className={`font-bold text-sm ${hasAccess ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {route.label}
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">{route.path}</div>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-gray-400 bg-white px-2 py-1 rounded">
                                    {route.permission}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-amber-900 mb-2">Troubleshooting Steps</h3>
                        <ul className="space-y-2 text-sm text-amber-800">
                            <li>• If you don't have the TRANSPORT_ADMIN role, contact your system administrator</li>
                            <li>• Ensure you have at least one of: TRANSPORT_ADMIN, ADMIN, or HEAD_OF_INSTITUTE roles</li>
                            <li>• Check that the required permissions are assigned to your role in the database</li>
                            <li>• Try logging out and logging back in to refresh your session</li>
                            <li>• Verify that the transport module routes are properly registered in the router</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Raw Data (for debugging) */}
            <details className="bg-gray-50 rounded-3xl border border-gray-200 p-6">
                <summary className="font-bold text-gray-900 cursor-pointer">Raw User Data (Click to expand)</summary>
                <pre className="mt-4 p-4 bg-white rounded-xl text-xs overflow-auto">
                    {JSON.stringify(user, null, 2)}
                </pre>
            </details>
        </div>
    );
};

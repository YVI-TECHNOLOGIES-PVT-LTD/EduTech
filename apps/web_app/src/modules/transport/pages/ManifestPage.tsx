import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import { ManifestViewer } from '../components/ManifestViewer';
import { FileText, Search } from 'lucide-react';

export const ManifestPage = () => {
    const [routes, setRoutes] = useState<any[]>([]);
    const [selectedRouteId, setSelectedRouteId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/transport/routes')
            .then(res => {
                setRoutes(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <FileText className="text-blue-600 w-10 h-10" />
                        Printable Manifests
                    </h1>
                    <p className="text-gray-500 mt-1">Generate and print student manifests for daily route operations.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Route Selector Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Search className="w-4 h-4 text-gray-400" /> Select Route
                        </h3>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                            {loading ? (
                                <div className="text-sm text-gray-400">Loading routes...</div>
                            ) : routes.length === 0 ? (
                                <div className="text-sm text-gray-400">No routes found.</div>
                            ) : (
                                routes.map(route => (
                                    <button
                                        key={route.id}
                                        onClick={() => setSelectedRouteId(route.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${selectedRouteId === route.id
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                                : 'hover:bg-gray-50 text-gray-600 border border-transparent'
                                            }`}
                                    >
                                        {route.name}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Manifest Display */}
                <div className="lg:col-span-3">
                    {selectedRouteId ? (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                            <ManifestViewer routeId={selectedRouteId} />
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
                            <FileText className="w-16 h-16 opacity-10 mb-4" />
                            <p className="font-bold">Select a route from the list to view manifest</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

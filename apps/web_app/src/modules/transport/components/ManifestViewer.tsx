import { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { apiClient } from '../../../lib/api-client';

export const ManifestViewer = ({ routeId }: { routeId: string }) => {
    const [data, setData] = useState<any>(null);
    const componentRef = useRef(null);

    const handlePrint = useReactToPrint({
        // @ts-ignore
        content: () => componentRef.current,
        documentTitle: `Manifest-${data?.route_name || 'Route'}`,
    });

    useEffect(() => {
        if (routeId) {
            apiClient.get(`/transport/routes/${routeId}/manifest`).then(res => setData(res.data));
        }
    }, [routeId]);

    if (!data) return <div className="p-10 text-center">Loading manifest...</div>;

    const drivers = data.vehicles?.map((v: any) => v.driver?.user?.full_name).filter(Boolean).join(', ') || "Unassigned";
    const vehicles = data.vehicles?.map((v: any) => v.vehicle?.vehicle_no).join(', ') || "No Vehicle";

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white p-4 mb-4 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="font-bold text-lg">Route: {data.route_name}</h2>
                    <p className="text-sm text-gray-500">{vehicles} • {drivers}</p>
                </div>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">
                    Print Manifest
                </button>
            </div>

            <div className="flex-1 bg-white shadow p-8 overflow-y-auto print:p-0 print:shadow-none" ref={componentRef}>
                {/* Print Layout */}
                <div className="mb-8 border-b pb-4">
                    <h1 className="text-2xl font-black uppercase tracking-wide mb-2">Transport Manifest</h1>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 block uppercase text-xs font-bold">Route Name</span>
                            <span className="text-xl font-bold">{data.route_name}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-gray-500 block uppercase text-xs font-bold">Date</span>
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block uppercase text-xs font-bold">Vehicles</span>
                            <span>{vehicles}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-gray-500 block uppercase text-xs font-bold">Drivers</span>
                            <span>{drivers}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {data.stops?.map((stop: any, idx: number) => (
                        <div key={stop.id} className="break-inside-avoid border rounded-lg overflow-hidden">
                            <div className="bg-gray-100 p-3 flex justify-between items-center border-b">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">{idx + 1}</span>
                                    <span className="font-bold text-lg">{stop.stop?.name}</span>
                                </div>
                                <div className="text-sm font-mono">
                                    AM: {stop.morning_time || '--'} | PM: {stop.evening_time || '--'}
                                </div>
                            </div>

                            {stop.students?.length > 0 ? (
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-2 text-left w-10">#</th>
                                            <th className="px-4 py-2 text-left">Student Name</th>
                                            <th className="px-4 py-2 text-left">Code</th>
                                            <th className="px-4 py-2 text-left">Class</th>
                                            <th className="px-4 py-2 text-right">Mode</th>
                                            <th className="px-4 py-2 text-center w-20">Sig</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {stop.students.map((s: any, sIdx: number) => (
                                            <tr key={sIdx}>
                                                <td className="px-4 py-3 text-gray-500">{sIdx + 1}</td>
                                                <td className="px-4 py-3 font-medium">{s.student?.full_name}</td>
                                                <td className="px-4 py-3 text-gray-500">{s.student?.student_code}</td>
                                                <td className="px-4 py-3">{s.student?.class_id || '-'}</td>
                                                <td className="px-4 py-3 text-right text-xs font-bold text-gray-500">{s.pickup_mode}</td>
                                                <td className="px-4 py-3 border-l"></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-4 text-center text-gray-400 italic">No students assigned to this stop.</div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-12 pt-4 border-t text-center text-xs text-gray-400">
                    Generated by School Management System • Internal Use Only
                </div>
            </div>
        </div>
    );
};

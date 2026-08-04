import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const DeviceMonitoringPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-4xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/attendance')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Device Monitoring & sync queues
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Check hardware device diagnostics network connectivity logs.
                    </p>
                </div>
            </div>

            {/* List device status */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase">Device Connection Status</h3>

                <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div>
                                <span className="font-bold text-gray-900">Main gate RFID reader</span>
                                <p className="text-[9px] text-gray-400">IP: 192.168.1.50</p>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-black uppercase">ONLINE</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DeviceMonitoringPage;

import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Cpu, RotateCw, Activity, CheckCircle2 } from 'lucide-react';

export interface DeviceItem {
    id: string;
    name: string;
    device_code: string;
    status: 'ONLINE' | 'OFFLINE';
    last_sync: string;
}

export interface BiometricStatusWidgetProps {
    devices: DeviceItem[];
    onSync?: (deviceCode: string) => void;
    isSyncing?: boolean;
}

export function BiometricStatusWidget({ devices, onSync, isSyncing }: BiometricStatusWidgetProps) {
    return (
        <Card className="p-5 border-0 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-black text-gray-900">Biometric Devices</h3>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase">
                    <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Monitor
                </span>
            </div>

            <div className="space-y-3">
                {devices.map(dev => (
                    <div key={dev.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center flex-wrap gap-2">
                        <div>
                            <p className="text-xs font-black text-gray-900">{dev.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Code: {dev.device_code} · Last Sync: {new Date(dev.last_sync).toLocaleTimeString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                dev.status === 'ONLINE' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                                {dev.status}
                            </span>
                            {onSync && dev.status === 'ONLINE' && (
                                <Button
                                    size="sm"
                                    disabled={isSyncing}
                                    onClick={() => onSync(dev.device_code)}
                                    className="h-7 bg-primary text-white text-[9px] font-black uppercase px-2"
                                >
                                    <RotateCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} /> Sync
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export default BiometricStatusWidget;

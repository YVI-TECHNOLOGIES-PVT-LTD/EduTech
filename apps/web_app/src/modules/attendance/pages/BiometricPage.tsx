import { useState } from 'react';
import { useBiometric } from '../hooks/useBiometric';
import { BiometricStatusWidget } from '../components/biometric/BiometricStatusWidget';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Cpu, RotateCw, CheckCircle2 } from 'lucide-react';

export function BiometricPage() {
    const { logs, syncBiometric, isSyncing } = useBiometric();

    const handleSync = async (code: string) => {
        try {
            await syncBiometric({ device_code: code });
            alert('Device logs synchronized and attendance sessions updated!');
        } catch (err) {
            console.error('Biometric sync failed', err);
        }
    };

    const mockDevices = [
        { id: 'd1', name: 'Main Gate Terminal A', device_code: 'BIO-GATE-A', status: 'ONLINE' as const, last_sync: '2026-06-30T06:00:00.000Z' },
        { id: 'd2', name: 'Block B Entry Terminal', device_code: 'BIO-BLOCK-B', status: 'ONLINE' as const, last_sync: '2026-06-30T06:15:00.000Z' },
    ];

    return (
        <div className="space-y-6 pb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Cpu className="w-8 h-8 text-indigo-600" /> Biometric Integration Terminal
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Review active gate terminals, sync log queues, and check status anomalies.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <BiometricStatusWidget
                        devices={mockDevices}
                        onSync={handleSync}
                        isSyncing={isSyncing}
                    />
                </div>

                <Card className="p-6 border-0 shadow-sm space-y-4 h-fit">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Sync Queue Logs</h3>
                    <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                        <div className="py-2.5 flex justify-between items-center">
                            <div>
                                <p className="text-xs font-bold text-gray-700">14 records synced</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">BIO-GATE-A · Success</p>
                            </div>
                            <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 uppercase">Success</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default BiometricPage;

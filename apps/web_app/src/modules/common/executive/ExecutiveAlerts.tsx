import React from 'react';
import { AlertTriangle, Bell } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import type { DashboardNotification } from '../../dashboard/types/dashboard.types';

interface ExecutiveAlertsProps {
    notifications: DashboardNotification[];
    loading?: boolean;
}

export function ExecutiveAlerts({ notifications, loading }: ExecutiveAlertsProps) {
    if (loading) return <Skeleton className="h-64 rounded-2xl" />;

    const alerts = notifications.slice(0, 6);

    return (
        <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-wider">Executive Alerts</h3>
            </div>
            {alerts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No active alerts</p>
            ) : (
                <div className="space-y-3">
                    {alerts.map(alert => (
                        <div key={alert.id} className="flex items-start gap-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold">{alert.title}</p>
                                {alert.message && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{alert.message}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

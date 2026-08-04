import React from 'react';
import { Clock } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface RecentRecord {
    id: string;
    label: string;
    module: string;
    href: string;
    visitedAt: string;
}

interface RecentRecordsProps {
    storageKey?: string;
    maxItems?: number;
}

export function RecentRecords({ storageKey = 'erp_recent_records', maxItems = 10 }: RecentRecordsProps) {
    const [recents] = useLocalStorage<RecentRecord[]>(storageKey, []);

    const display = recents.slice(0, maxItems);

    if (display.length === 0) {
        return <p className="text-xs text-muted-foreground italic">No recent records</p>;
    }

    return (
        <div className="space-y-2">
            {display.map(r => (
                <a
                    key={r.id}
                    href={r.href}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30 text-xs"
                >
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">{r.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                            {r.module} · {new Date(r.visitedAt).toLocaleDateString()}
                        </p>
                    </div>
                </a>
            ))}
        </div>
    );
}

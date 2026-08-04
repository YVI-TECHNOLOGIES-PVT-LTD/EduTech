import React from 'react';
import { Bell } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface Reminder {
    id: string;
    text: string;
    dueAt: string;
    done: boolean;
}

interface ReminderPanelProps {
    storageKey?: string;
}

export function ReminderPanel({ storageKey = 'erp_reminders' }: ReminderPanelProps) {
    const [reminders, setReminders] = useLocalStorage<Reminder[]>(storageKey, []);

    const upcoming = reminders.filter(r => !r.done).slice(0, 5);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider">Reminders</span>
            </div>
            {upcoming.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No upcoming reminders</p>
            ) : (
                upcoming.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-amber-50/50 rounded-lg text-xs">
                        <span>{r.text}</span>
                        <button
                            type="button"
                            onClick={() =>
                                setReminders(prev => prev.map(x => (x.id === r.id ? { ...x, done: true } : x)))
                            }
                            className="text-[10px] font-bold text-primary"
                        >
                            Done
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}

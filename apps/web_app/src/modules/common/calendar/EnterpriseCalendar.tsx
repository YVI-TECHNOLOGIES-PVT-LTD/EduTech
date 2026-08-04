import React from 'react';
import { Calendar } from 'lucide-react';

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    module?: string;
}

interface EnterpriseCalendarProps {
    events?: CalendarEvent[];
    title?: string;
}

export function EnterpriseCalendar({ events = [], title = 'Calendar' }: EnterpriseCalendarProps) {
    const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
        const day = new Date(e.date).toLocaleDateString();
        if (!acc[day]) acc[day] = [];
        acc[day].push(e);
        return acc;
    }, {});

    return (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-wider">{title}</h3>
            </div>
            {Object.keys(grouped).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No scheduled events</p>
            ) : (
                Object.entries(grouped).map(([day, dayEvents]) => (
                    <div key={day}>
                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">{day}</p>
                        <div className="space-y-2">
                            {dayEvents.map(e => (
                                <div key={e.id} className="p-3 bg-muted/20 rounded-xl text-xs font-bold">
                                    {e.title}
                                    {e.module && (
                                        <span className="ml-2 text-[10px] text-muted-foreground capitalize">
                                            {e.module}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

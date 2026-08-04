import React from 'react';
import { Calendar } from 'lucide-react';

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type?: string;
}

interface CalendarPanelProps {
    events?: CalendarEvent[];
}

export function CalendarPanel({ events = [] }: CalendarPanelProps) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold">{today}</span>
            </div>
            {events.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No events today</p>
            ) : (
                <div className="space-y-2">
                    {events.map(e => (
                        <div key={e.id} className="p-2 border-l-2 border-primary pl-3 text-xs">
                            <p className="font-bold">{e.title}</p>
                            <p className="text-[10px] text-muted-foreground">{e.date}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

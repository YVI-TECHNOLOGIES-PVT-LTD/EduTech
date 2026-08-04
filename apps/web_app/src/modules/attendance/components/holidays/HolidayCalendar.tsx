import { Card } from '../../../../components/ui/card';
import { Calendar, Trash2 } from 'lucide-react';

export interface HolidayItem {
    id: string;
    holiday_date: string;
    name: string;
    description?: string;
}

export interface HolidayCalendarProps {
    holidays: HolidayItem[];
    onDelete?: (id: string) => void;
}

export function HolidayCalendar({ holidays, onDelete }: HolidayCalendarProps) {
    return (
        <Card className="p-5 border-0 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-black text-gray-900">Upcoming School Holidays</h3>
            </div>

            <div className="divide-y divide-gray-50">
                {holidays.map(hol => (
                    <div key={hol.id} className="py-3 flex justify-between items-start first:pt-0 last:pb-0 gap-3">
                        <div>
                            <p className="text-xs font-black text-gray-900">{hol.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">{new Date(hol.holiday_date).toLocaleDateString()}</p>
                            {hol.description && (
                                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed font-medium">{hol.description}</p>
                            )}
                        </div>
                        {onDelete && (
                            <button
                                onClick={() => onDelete(hol.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
                {holidays.length === 0 && (
                    <p className="text-center py-6 text-xs text-gray-400 font-bold italic">No holidays configured.</p>
                )}
            </div>
        </Card>
    );
}

export default HolidayCalendar;

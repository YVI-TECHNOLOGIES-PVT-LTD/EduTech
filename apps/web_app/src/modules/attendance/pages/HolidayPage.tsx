import { useState } from 'react';
import { useHoliday } from '../hooks/useHoliday';
import { HolidayCalendar } from '../components/holidays/HolidayCalendar';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Calendar, Save } from 'lucide-react';

export function HolidayPage() {
    const { holidays, createHoliday } = useHoliday();

    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [desc, setDesc] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createHoliday({
                school_id: '457bbda3-f542-47dc-9d41-3d7729226f86',
                holiday_date: date,
                name,
                description: desc,
            });
            alert('Holiday configured successfully!');
            setName('');
            setDate('');
            setDesc('');
        } catch (err) {
            console.error('Failed to create holiday', err);
        }
    };

    const mockHolidays = [
        { id: 'h1', holiday_date: '2026-08-15', name: 'Independence Day', description: 'National Holiday' },
        { id: 'h2', holiday_date: '2026-10-02', name: 'Gandhi Jayanti', description: 'National Holiday' },
    ];

    const activeList = holidays.length > 0 ? holidays : mockHolidays;

    return (
        <div className="space-y-6 pb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Calendar className="w-8 h-8 text-primary" /> Holiday & Academic Calendar
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Configure special holidays and school working schedules.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <HolidayCalendar holidays={activeList} />
                </div>

                <form onSubmit={handleCreate}>
                    <Card className="p-6 border-0 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Add Holiday Config</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Holiday Name</label>
                                <Input value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Holiday Date</label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Description</label>
                                <Input value={desc} onChange={e => setDesc(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100/50">
                            <Button type="submit" className="bg-primary text-white text-xs font-bold flex items-center gap-1.5">
                                <Save className="w-4 h-4" /> Save Holiday
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </div>
    );
}

export default HolidayPage;

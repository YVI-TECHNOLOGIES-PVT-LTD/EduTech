import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Save, ArrowLeft, Layers } from 'lucide-react';

export function ClassAllocationPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { allocateClass, isAllocating } = useStudent(id || '');

    const [yearId, setYearId] = useState('year-2026');
    const [grade, setGrade] = useState('Grade 10');
    const [sectionId, setSectionId] = useState('section-a');
    const [rollNo, setRollNo] = useState('');

    const handleAllocate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await allocateClass({
                academic_year_id: yearId,
                grade,
                section_id: sectionId,
                roll_number: rollNo,
            });
            alert('Class allocation saved successfully!');
            navigate(`/app/students/${id}`);
        } catch (err) {
            console.error('Allocation failed', err);
        }
    };

    return (
        <form onSubmit={handleAllocate} className="space-y-6 pb-6">
            <div className="flex items-center gap-4">
                <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Class Allocation</h1>
                    <p className="text-sm text-gray-500 mt-1">Assign grade, section, and roll numbers to students.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Allocation Config</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Academic Year</label>
                            <select
                                id="allocation-year-select"
                                value={yearId}
                                onChange={e => setYearId(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                            >
                                <option value="year-2026">2026-27 Active Year</option>
                                <option value="year-2025">2025-26 Previous Year</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Grade Level</label>
                            <Input value={grade} onChange={e => setGrade(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Section</label>
                            <select
                                id="allocation-section-select"
                                value={sectionId}
                                onChange={e => setSectionId(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                            >
                                <option value="section-a">Section A</option>
                                <option value="section-b">Section B</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Roll Number (Optional)</label>
                            <Input value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="Auto-generated if blank" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="submit" disabled={isAllocating} className="bg-primary text-white flex items-center gap-1.5">
                            <Save className="w-4 h-4" /> Save Allocation
                        </Button>
                    </div>
                </Card>

                {/* Capacity check panel */}
                <Card className="p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <Layers className="w-4 h-4 text-emerald-500" /> Section Occupancy Status
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-gray-600">
                                <span>Section A Capacity</span>
                                <span>38 / 40 filled</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '95%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-gray-600">
                                <span>Section B Capacity</span>
                                <span>24 / 40 filled</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </form>
    );
}

export default ClassAllocationPage;

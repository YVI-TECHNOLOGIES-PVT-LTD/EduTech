import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Armchair, Printer, Search } from 'lucide-react';

export const FacultyInvigilationView = () => {
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [allocations, setAllocations] = useState<any[]>([]);
    const [halls, setHalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadExams();
    }, []);

    useEffect(() => {
        if (selectedExamId) {
            loadSeating(selectedExamId);
        } else {
            setAllocations([]);
            setHalls([]);
        }
    }, [selectedExamId]);

    const loadExams = async () => {
        try {
            const res = await apiClient.get('/exams');
            // Show all active exams for invigilation purposes
            setExams(res.data?.filter((e: any) => e.status !== 'COMPLETED') || []);
        } catch (e) {
            console.error(e);
        }
    };

    const loadSeating = async (examId: string) => {
        setLoading(true);
        try {
            const [allocRes, hallsRes] = await Promise.all([
                apiClient.get('/exams/seating', { params: { examId } }),
                apiClient.get('/exams/halls')
            ]);
            setAllocations(allocRes.data || []);
            setHalls(hallsRes.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredAllocations = getAllocationsByHall();

    function getAllocationsByHall() {
        if (!searchTerm) {
            return halls.map(hall => ({
                ...hall,
                students: allocations.filter(a => a.exam_hall?.id === hall.id)
            })).filter(h => h.students.length > 0);
        }

        // Search logic: Filter students then group by hall
        const matchingAllocations = allocations.filter(a =>
            a.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.student.admission?.student_code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Return halls that have matching students
        return halls.map(hall => ({
            ...hall,
            students: matchingAllocations.filter(a => a.exam_hall?.id === hall.id)
        })).filter(h => h.students.length > 0);
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 py-8">
            <div className="flex justify-between items-end print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Armchair className="w-8 h-8 text-indigo-600" />
                        Invigilation View
                    </h1>
                    <p className="text-gray-500 font-medium">View student seating arrangements by hall.</p>
                </div>
                <button
                    onClick={window.print}
                    disabled={!selectedExamId}
                    className="px-5 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <Printer className="w-4 h-4" /> Print Plan
                </button>
            </div>

            {/* Control Bar */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center print:hidden">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Select Exam</label>
                    <select
                        className="w-full p-3 border rounded-xl bg-gray-50 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedExamId}
                        onChange={e => setSelectedExamId(e.target.value)}
                    >
                        <option value="">Choose active exam...</option>
                        {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>

                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Find Student</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            className="w-full pl-10 pr-4 py-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            disabled={!selectedExamId}
                        />
                    </div>
                </div>
            </div>

            {/* Visualizer */}
            {selectedExamId ? (
                loading ? (
                    <div className="p-20 text-center text-gray-400 flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        Fetching seating arrangements...
                    </div>
                ) :
                    filteredAllocations.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-8">
                            {filteredAllocations.map(hall => (
                                <div key={hall.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm break-inside-avoid">
                                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-50">
                                        <div>
                                            <h3 className="font-black text-gray-900 text-lg">{hall.name}</h3>
                                            <span className="text-xs text-gray-400 font-bold uppercase">Hall Capacity: {hall.capacity}</span>
                                        </div>
                                        <div className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600">
                                            {hall.students.length} Allocated
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {hall.students.map((alloc: any) => (
                                            <div key={alloc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700 font-mono border border-indigo-100">
                                                        {alloc.seat_number}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{alloc.student?.full_name}</div>
                                                        <div className="text-[10px] text-gray-400 font-mono">{alloc.student?.admission?.student_code}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-16 rounded-2xl border border-dashed border-gray-200 text-center flex flex-col items-center">
                            <Armchair className="w-16 h-16 text-gray-200 mb-4" />
                            <h3 className="font-bold text-gray-900 text-lg mb-1">No Seating Found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto text-sm">
                                {searchTerm ? "No students match your search criteria." : "Seating has not been generated for this exam yet."}
                            </p>
                        </div>
                    )
            ) : (
                <div className="bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 p-24 flex flex-col items-center justify-center text-center opacity-70">
                    <Armchair className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="font-bold text-gray-500 text-lg">Select an exam to view seating plan</p>
                </div>
            )}
        </div>
    );
};

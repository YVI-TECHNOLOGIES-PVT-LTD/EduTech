import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Users,
    Search,
    ChevronRight,
    LayoutDashboard,
    ArrowRight,
    GraduationCap,
    School,
    Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MyStudents = () => {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        apiClient.get('/academic/my-students')
            .then(res => setAssignments(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = assignments.filter(a => {
        const student = a.student;
        return (
            student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student?.student_code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                        <Users className="w-12 h-12 text-indigo-600" />
                        My Academic Roster
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Displaying all students automatically assigned to you via section allocation.
                    </p>
                </div>

                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Filter by name or ID..."
                        className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filtered.map((item, idx) => {
                        const student = item.student;
                        const section = student?.section_info?.[0]?.section;

                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                key={item.id}
                                className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-900/5 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-3">
                                        {student?.full_name?.charAt(0)}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase">
                                            <Shield className="w-3 h-3" />
                                            Active
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">{student?.full_name}</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{student?.student_code}</p>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                                        <div className="flex items-center gap-3">
                                            <School className="w-4 h-4 text-indigo-400" />
                                            <div className="text-sm font-bold text-gray-600">
                                                {section?.class?.name} - {section?.name}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <GraduationCap className="w-4 h-4 text-indigo-400" />
                                            <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                                Auto Assigned via Section
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full mt-6 py-4 bg-white border border-gray-100 hover:border-indigo-600 hover:text-indigo-600 rounded-2xl font-bold text-sm text-gray-400 transition-all flex items-center justify-center gap-2 group/btn">
                                    View Performance
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {filtered.length === 0 && (
                <div className="py-32 text-center space-y-6 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <Users className="w-10 h-10 text-gray-200" />
                    </div>
                    <div className="max-w-sm mx-auto">
                        <h3 className="text-xl font-black text-gray-900">No Students Found</h3>
                        <p className="text-gray-500 font-medium text-sm mt-1">
                            {searchTerm ? "No students match your search criteria." : "You haven't been assigned to any sections or your sections have no students."}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

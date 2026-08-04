import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';
import {
    Users,
    Search,
    Filter,
    Info,
    MoreVertical,
    GraduationCap,
    UserPlus,
    LayoutGrid,
    CheckCircle2,
    Calendar,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ArrowUpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { ImportWizard } from '../../../components/import/ImportWizard';

import { AssignSectionModal } from '../components/AssignSectionModal';

export const StudentList = () => {
    const { hasPermission, user } = useAuth(); // Assuming useAuth provides 'user.roles' or 'hasPermission'
    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportOpen, setIsImportOpen] = useState(false);

    // Assign Modal States
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey: string) => {
        if (sortConfig?.key === columnKey) {
            return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />;
        }
        return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-300" />;
    };

    // Reset page when search changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [page, limit, searchTerm, sortConfig]);

    const fetchData = () => {
        setLoading(true);
        const params: any = { page, limit, search: searchTerm };
        if (sortConfig) {
            params.sortBy = sortConfig.key;
            params.sortOrder = sortConfig.direction;
        }

        apiClient.get('/students', { params })
            .then(res => {
                setData(res.data.data || []);
                setTotalPages(res.data.meta?.totalPages || 1);
                setTotalRecords(res.data.meta?.total || 0);
            })
            .finally(() => setLoading(false));
    };

    const filteredStudents = data; // Server-side filtered

    const canImport = hasPermission('STUDENT_CREATE');

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Import Wizard Modal */}
            <ImportWizard
                isOpen={isImportOpen}
                onClose={() => { setIsImportOpen(false); fetchData(); }} // Refresh data on close for UX
                entityType="STUDENT"
                title="Students"
            />

            {/* Assign Section Modal */}
            <AssignSectionModal
                isOpen={isAssignOpen}
                student={selectedStudent}
                onClose={() => { setIsAssignOpen(false); setSelectedStudent(null); }}
                onSuccess={() => { fetchData(); }}
            />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                        <Users className="w-10 h-10 text-blue-600" />
                        Student Directory
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium italic">Manage and monitor institutional student records.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-gray-50 text-gray-600 px-4 py-2.5 rounded-xl border border-gray-100 font-bold hover:bg-gray-100 transition-all">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>

                    {canImport && (
                        <button
                            onClick={() => setIsImportOpen(true)}
                            className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-xl border border-blue-100 font-bold hover:bg-blue-50 transition-all shadow-sm"
                        >
                            <Calendar className="w-5 h-5" /> {/* Reusing Calendar Icon as Import Placeholder or use DownloadCloud if imported */}
                            Import CSV
                        </button>
                    )}

                    <Link
                        to="/app/students/promote"
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100"
                    >
                        <ArrowUpCircle className="w-5 h-5" />
                        Academic Promotion
                    </Link>

                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-100">
                        <UserPlus className="w-5 h-5" />
                        Add Manually
                    </button>
                </div>
            </div>

            {/* toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name, student code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400 font-bold bg-gray-50 px-4 py-3 rounded-xl">
                    <LayoutGrid className="w-4 h-4" />
                    TOTAL: {totalRecords} STUDENTS
                </div>
            </div>

            {/* Student Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100/50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">S.No</th>
                                <th
                                    className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('student_code')}
                                >
                                    <div className="flex items-center">
                                        Student Code {getSortIcon('student_code')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('full_name')}
                                >
                                    <div className="flex items-center">
                                        Full Name {getSortIcon('full_name')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('date_of_birth')}
                                >
                                    <div className="flex items-center">
                                        DOB {getSortIcon('date_of_birth')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('gender')}
                                >
                                    <div className="flex items-center">
                                        Gender {getSortIcon('gender')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('email')}
                                >
                                    <div className="flex items-center">
                                        Email {getSortIcon('email')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('phone')}
                                >
                                    <div className="flex items-center">
                                        Phone {getSortIcon('phone')}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Section</th>
                                <th
                                    className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('address')}
                                >
                                    <div className="flex items-center">
                                        Address {getSortIcon('address')}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStudents.length > 0 ? filteredStudents.map((student, index) => {
                                const admission = student.admission;
                                const section = student.sections?.[0]?.section;
                                const className = section?.class?.name || 'Not Assigned';
                                const sectionName = section?.name || 'Not Assigned';

                                // Map fields with fallback to admission data for backward compatibility or display
                                const displayEmail = student.email || admission?.parent_email || '-';
                                const displayPhone = student.phone || admission?.parent_phone || '-';
                                const displayAddress = student.address || admission?.address || '-';

                                return (
                                    <tr key={student.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                                            {(page - 1) * limit + index + 1}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 font-bold">
                                            {student.student_code}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold uppercase">
                                                    {student.full_name?.charAt(0)}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900">{student.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                                            {student.gender || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {displayEmail}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {displayPhone}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                            {className}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                            {sectionName}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={displayAddress}>
                                            {displayAddress}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedStudent(student); setIsAssignOpen(true); }}
                                                    className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Assign Class & Section"
                                                >
                                                    <GraduationCap className="w-4 h-4" />
                                                </button>
                                                <Link
                                                    to={`/app/students/${student.id}`}
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Profile"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={11} className="px-8 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Search className="w-8 h-8 mb-2 opacity-20" />
                                            <p className="text-sm font-medium">No students found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Rows per page
                    </span>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold p-2 outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                    <span className="text-xs font-bold text-gray-400">
                        Total {totalRecords} records
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <span className="text-sm font-black text-gray-900 px-2">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

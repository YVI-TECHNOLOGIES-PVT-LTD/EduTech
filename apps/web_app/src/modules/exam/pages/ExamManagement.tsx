import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
// @ts-ignore
import { useAuth } from '../../../context/AuthContext';
import { SubjectManagement } from './SubjectManagement';
import { MarksEntry } from './MarksEntry';
import { StudentResults } from './StudentResults';
import { Calendar, BookOpen, FileText, BarChart2, Check, X, ChevronDown, AlertCircle, Edit2, Trash2 } from 'lucide-react';

export const ExamManagement = () => {
    const { hasPermission } = useAuth();
    const isFaculty = hasPermission('exam.marks.enter');
    const [activeTab, setActiveTab] = useState<'terms' | 'subjects' | 'marks' | 'results'>('terms');

    useEffect(() => {
        if (isFaculty) {
            setActiveTab('marks');
        }
    }, [isFaculty]);

    // --- Tab 1: Exam Terms Logic ---
    const [exams, setExams] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [activeYear, setActiveYear] = useState<any>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form Stats
    const [name, setName] = useState('');
    const [term, setTerm] = useState('ANNUAL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Multi-select State
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

    // Section Logic (New)
    const [sectionsMap, setSectionsMap] = useState<Record<string, any[]>>({}); // classId -> sections[]
    const [selectedSections, setSelectedSections] = useState<string[]>([]); // section IDs
    const [availableSections, setAvailableSections] = useState<any[]>([]); // Flat list of all available sections for selected classes
    const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);

    // Errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchExams = () => {
        apiClient.get('/exams').then(res => setExams(res.data));
    };

    useEffect(() => {
        apiClient.get('/academic-years/current').then(res => setActiveYear(res.data));
        apiClient.get('/academic/classes').then(res => setClasses(res.data));
        fetchExams();
    }, []);

    // Fetch sections when classes change
    useEffect(() => {
        const fetchSections = async () => {
            const newSectionsMap = { ...sectionsMap };
            let allSections: any[] = [];

            await Promise.all(selectedClasses.map(async (clsId) => {
                if (!newSectionsMap[clsId]) {
                    try {
                        const res = await apiClient.get('/academic/sections', { params: { classId: clsId } });
                        newSectionsMap[clsId] = res.data || [];
                    } catch (e) {
                        console.error(`Failed to load sections for class ${clsId}`, e);
                        newSectionsMap[clsId] = [];
                    }
                }
                allSections = [...allSections, ...newSectionsMap[clsId]];
            }));

            setSectionsMap(newSectionsMap);
            setAvailableSections(allSections);

            // Auto-select 'All Sections' if it was previously empty or reset? 
            // Better behavior: If 'All Sections' logic is desired, we can just track IDs.
            // For now, let's keep selectedSections clean.

            // Filter out sections that are no longer valid (if class deselected)
            setSelectedSections(prev => prev.filter(sid => allSections.find(s => s.id === sid)));
        };

        if (selectedClasses.length > 0) {
            fetchSections();
        } else {
            setAvailableSections([]);
            setSelectedSections([]);
        }
    }, [selectedClasses]);


    // Validation Logic
    useEffect(() => {
        const newErrors: Record<string, string> = {};

        if (startDate && endDate) {
            if (new Date(endDate) < new Date(startDate)) {
                newErrors.date = "End date must be after start date";
            }
        }

        setErrors(newErrors);
    }, [startDate, endDate]);


    // Handlers
    const toggleClass = (classId: string) => {
        setSelectedClasses(prev =>
            prev.includes(classId)
                ? prev.filter(id => id !== classId)
                : [...prev, classId]
        );
    };

    const toggleAllClasses = () => {
        if (selectedClasses.length === classes.length) {
            setSelectedClasses([]);
        } else {
            setSelectedClasses(classes.map(c => c.id));
        }
    };

    const toggleSection = (sectionId: string) => {
        setSelectedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const toggleAllSections = () => {
        if (selectedSections.length === availableSections.length) {
            setSelectedSections([]);
        } else {
            setSelectedSections(availableSections.map(s => s.id));
        }
    }


    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final Validation
        if (!activeYear) return alert("No active year");
        if (Object.keys(errors).length > 0) return;
        if (selectedClasses.length === 0) return alert("Please select applicable classes.");

        try {
            const payload = {
                name,
                academic_year_id: activeYear.id,
                start_date: startDate,
                end_date: endDate,
                type: 'GENERAL',
                term,
                applicable_classes: selectedClasses.length > 0 ? selectedClasses : null
            };

            if (editingId) {
                // UPDATE
                await apiClient.put(`/exams/${editingId}`, payload);
                alert("Exam updated successfully!");
            } else {
                // CREATE
                await apiClient.post('/exams', payload);
                alert("Exam created successfully!");
            }

            // Reset
            setEditingId(null);
            setName('');
            setTerm('ANNUAL');
            setStartDate('');
            setEndDate('');
            setSelectedClasses([]);
            setSelectedSections([]);
            fetchExams();
        } catch (err: any) {
            console.error("Save Exam Error:", err);
            alert(`Failed to save exam: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleDeleteExam = async (id: string, examName: string) => {
        if (!window.confirm(`Are you sure you want to delete "${examName}"? This action cannot be undone.`)) return;

        try {
            await apiClient.delete(`/exams/${id}`);
            alert("Exam deleted successfully");
            fetchExams();
            // If deleting the currently edited exam, reset form
            if (editingId === id) {
                setEditingId(null);
                setName('');
                setTerm('ANNUAL');
                setStartDate('');
                setEndDate('');
                setSelectedClasses([]);
            }
        } catch (err: any) {
            console.error("Delete Exam Error:", err);
            // Handle specific conflict error from backend
            if (err.response?.status === 409) {
                alert(`Cannot delete exam: ${err.response.data.error}`);
            } else {
                alert(`Failed to delete exam: ${err.response?.data?.error || err.message}`);
            }
        }
    };

    // Helper to get display name
    const getSelectedClassesText = () => {
        if (selectedClasses.length === 0) return "Select Class";
        if (selectedClasses.length === classes.length) return "All Classes";
        if (selectedClasses.length <= 2) {
            return classes.filter(c => selectedClasses.includes(c.id)).map(c => c.name).join(", ");
        }
        return `${selectedClasses.length} Classes Selected`;
    };

    const getSelectedSectionsText = () => {
        if (availableSections.length === 0) return "No Sections Available";
        if (selectedSections.length === 0) return "Select Sections";
        if (selectedSections.length === availableSections.length) return "All Sections";
        if (selectedSections.length <= 2) {
            const names = availableSections.filter(s => selectedSections.includes(s.id)).map(s => {
                const cls = classes.find(c => c.id === s.class_id);
                return `${cls?.name}-${s.name}`;
            });
            return names.join(", ");
        }
        return `${selectedSections.length} Sections Selected`;
    };

    // Date Bounds
    const today = new Date().toISOString().split('T')[0];

    // --- Table State ---
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'start_date', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    // --- Derived Data ---
    const filteredExams = exams.filter(exam =>
        exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.academic_year?.year_label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedExams = [...filteredExams].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aValue = a[key];
        let bValue = b[key];

        // Handle nested or special keys
        if (key === 'academic_year') {
            aValue = a.academic_year?.year_label || '';
            bValue = b.academic_year?.year_label || '';
        }
        if (key === 'class_count') {
            aValue = a.applicable_classes?.length || 0;
            bValue = b.applicable_classes?.length || 0;
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedExams.length / itemsPerPage);
    const paginatedExams = sortedExams.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Helper to get Class Names from IDs
    const getClassNames = (classIds: string[] | null) => {
        if (!classIds || classIds.length === 0) return "All Classes";
        const names = classes
            .filter(c => classIds.includes(c.id))
            .map(c => c.name)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); // Sort class names naturally

        return names;
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Exam Management</h2>

            {/* Tabs (unchanged) */}
            <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('terms')}
                    className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'terms' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Calendar className="w-4 h-4" /> Exam Schedule
                </button>

                {!isFaculty && (
                    <button
                        onClick={() => setActiveTab('subjects')}
                        className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'subjects' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <BookOpen className="w-4 h-4" /> Subjects
                    </button>
                )}

                <button
                    onClick={() => setActiveTab('marks')}
                    className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'marks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <FileText className="w-4 h-4" /> Marks Entry
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'results' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <BarChart2 className="w-4 h-4" /> Reports & Results
                </button>
            </div>

            {/* Content Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'terms' && (
                    <div className="space-y-6">
                        {!isFaculty && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold mb-6 text-gray-900 flex items-center gap-2 justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-6 ${editingId ? 'bg-amber-500' : 'bg-indigo-600'} rounded-full`}></div>
                                        {editingId ? 'Edit Exam Environment' : 'Create New Exam'}
                                    </div>
                                    {editingId && (
                                        <button
                                            onClick={() => {
                                                setEditingId(null);
                                                setName('');
                                                setTerm('ANNUAL');
                                                setStartDate('');
                                                setEndDate('');
                                                setSelectedClasses([]);
                                                setSelectedSections([]);
                                            }}
                                            className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wide flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" /> Cancel Edit
                                        </button>
                                    )}
                                </h3>

                                <form onSubmit={handleCreateExam} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column: Basic Details */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Exam Name</label>
                                            <input
                                                className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-900 placeholder:text-gray-300"
                                                placeholder="e.g. First Term Examination"
                                                value={name} onChange={e => setName(e.target.value)} required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Term</label>
                                            <select
                                                className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-900"
                                                value={term}
                                                onChange={e => setTerm(e.target.value)}
                                            >
                                                <option value="ANNUAL">Annual</option>
                                                <option value="Q1">Quarter 1</option>
                                                <option value="Q2">Quarter 2</option>
                                                <option value="Q3">Quarter 3</option>
                                                <option value="Q4">Quarter 4</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>



                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Start Date</label>
                                                <input
                                                    type="date"
                                                    min={today}
                                                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700"
                                                    value={startDate} onChange={e => setStartDate(e.target.value)} required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">End Date</label>
                                                <input
                                                    type="date"
                                                    min={startDate || today}
                                                    disabled={!startDate}
                                                    className={`w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700 ${!startDate ? 'bg-gray-100 cursor-not-allowed border-transparent' : 'bg-gray-50 border-gray-200'}`}
                                                    value={endDate} onChange={e => setEndDate(e.target.value)} required
                                                />
                                            </div>
                                        </div>
                                        {errors.date && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 p-3 rounded-lg">
                                                <AlertCircle className="w-4 h-4" /> {errors.date}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column: Scope */}
                                    <div className="space-y-6">
                                        {/* Class Selector Dropdown */}
                                        <div className="space-y-2 relative">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Applicable Classes</label>

                                            <div
                                                onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                                                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl cursor-pointer flex justify-between items-center hover:bg-gray-100 transition-colors min-h-[50px]"
                                            >
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedClasses.length > 0 ? (
                                                        selectedClasses.map(cid => (
                                                            <span key={cid} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm border border-indigo-200">
                                                                {classes.find(c => c.id === cid)?.name}
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); toggleClass(cid); }} className="hover:bg-indigo-200 rounded p-0.5 transition-colors">
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="font-bold text-gray-400">Select Classes...</span>
                                                    )}
                                                </div>
                                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
                                            </div>

                                            {isClassDropdownOpen && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setIsClassDropdownOpen(false)}
                                                    />
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto p-2 space-y-1">
                                                        <div
                                                            onClick={toggleAllClasses}
                                                            className="flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                                                        >
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedClasses.length === classes.length ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                                                {selectedClasses.length === classes.length && <Check className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <span className="font-bold text-gray-700 text-sm">All Classes</span>
                                                        </div>
                                                        <div className="h-px bg-gray-100 my-1 mx-2"></div>
                                                        {classes.map(cls => (
                                                            <div
                                                                key={cls.id}
                                                                onClick={() => toggleClass(cls.id)}
                                                                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                                                            >
                                                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedClasses.includes(cls.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                                                    {selectedClasses.includes(cls.id) && <Check className="w-3 h-3 text-white" />}
                                                                </div>
                                                                <span className="font-bold text-gray-700 text-sm">{cls.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Section Selector Dropdown (Conditional) */}
                                        <div className={`space-y-2 relative transition-opacity duration-300 ${selectedClasses.length === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Applicable Sections</label>

                                            <div
                                                onClick={() => setIsSectionDropdownOpen(!isSectionDropdownOpen)}
                                                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl cursor-pointer flex justify-between items-center hover:bg-gray-100 transition-colors min-h-[50px]"
                                            >
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedSections.length > 0 ? (
                                                        selectedSections.map(sid => {
                                                            const sec = availableSections.find(s => s.id === sid);
                                                            const cls = classes.find(c => c.id === sec?.class_id);
                                                            return (
                                                                <span key={sid} className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm border border-emerald-200">
                                                                    {cls?.name}-{sec?.name}
                                                                    <button type="button" onClick={(e) => { e.stopPropagation(); toggleSection(sid); }} className="hover:bg-emerald-200 rounded p-0.5 transition-colors">
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </span>
                                                            )
                                                        })
                                                    ) : (
                                                        <span className="font-bold text-gray-400">Select Sections...</span>
                                                    )}
                                                </div>
                                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isSectionDropdownOpen ? 'rotate-180' : ''}`} />
                                            </div>

                                            {isSectionDropdownOpen && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setIsSectionDropdownOpen(false)}
                                                    />
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto p-2 space-y-1">
                                                        <div
                                                            onClick={toggleAllSections}
                                                            className="flex items-center gap-3 p-3 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                                                        >
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedSections.length === availableSections.length ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'}`}>
                                                                {selectedSections.length === availableSections.length && <Check className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <span className="font-bold text-gray-700 text-sm">All Sections</span>
                                                        </div>
                                                        <div className="h-px bg-gray-100 my-1 mx-2"></div>
                                                        {availableSections.map(sec => {
                                                            const cls = classes.find(c => c.id === sec.class_id);
                                                            return (
                                                                <div
                                                                    key={sec.id}
                                                                    onClick={() => toggleSection(sec.id)}
                                                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                                                                >
                                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedSections.includes(sec.id) ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'}`}>
                                                                        {selectedSections.includes(sec.id) && <Check className="w-3 h-3 text-white" />}
                                                                    </div>
                                                                    <span className="font-bold text-gray-700 text-sm">{cls?.name} - Section {sec.name}</span>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-4 pt-6 mt-2 border-t border-gray-100">
                                        {Object.keys(errors).length > 0 && (
                                            <span className="text-xs font-bold text-red-500 animate-pulse">Fix errors to proceed</span>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={Object.keys(errors).length > 0 || !name || !startDate || !endDate || selectedClasses.length === 0}
                                            className="bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center gap-2"
                                        >
                                            <Check className="w-5 h-5" />
                                            {editingId ? 'Update Exam Environment' : 'Create Exam Environment'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Toolbar: Search + Stats */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="relative w-full md:w-96">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" hidden />
                                        {/* Placeholder logic for search icon if needed, or use simple Search icon from Lucide */}
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search exams..."
                                        className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold"
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    />
                                </div>
                                <div className="text-xs font-bold text-gray-500">
                                    Showing {paginatedExams.length} of {filteredExams.length} Exams
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-xs tracking-wider">
                                        <tr>
                                            <th className="p-5 pl-6 w-16 text-center">S.No</th>
                                            <th className="p-5 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                                                <div className="flex items-center gap-1">Exam Name {sortConfig?.key === 'name' && (sortConfig?.direction === 'asc' ? '↑' : '↓')}</div>
                                            </th>
                                            <th className="p-5 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('start_date')}>
                                                <div className="flex items-center gap-1">Duration {sortConfig?.key === 'start_date' && (sortConfig?.direction === 'asc' ? '↑' : '↓')}</div>
                                            </th>
                                            <th className="p-5 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('academic_year')}>
                                                <div className="flex items-center gap-1">Year {sortConfig?.key === 'academic_year' && (sortConfig?.direction === 'asc' ? '↑' : '↓')}</div>
                                            </th>
                                            <th className="p-5 w-1/3">Applicable Scope</th>
                                            <th className="p-5 text-right pr-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paginatedExams.length > 0 ? (
                                            paginatedExams.map((exam, index) => {
                                                const serialNo = (currentPage - 1) * itemsPerPage + index + 1;
                                                const classNames = getClassNames(exam.applicable_classes);

                                                return (
                                                    <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="p-5 pl-6 text-center font-medium text-gray-400">{serialNo.toString().padStart(2, '0')}</td>
                                                        <td className="p-5 font-bold text-gray-900 text-base">{exam.name}</td>
                                                        <td className="p-5 font-medium text-gray-600">
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{new Date(exam.start_date).toLocaleDateString()}</span>
                                                                <span className="text-gray-300">→</span>
                                                                <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{new Date(exam.end_date).toLocaleDateString()}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-5">
                                                            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border border-indigo-100">
                                                                {exam.academic_year?.year_label}
                                                            </span>
                                                        </td>
                                                        <td className="p-5 text-gray-500">
                                                            <div className="flex flex-wrap gap-1">
                                                                {typeof classNames === 'string' ? (
                                                                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-100 text-xs">{classNames}</span>
                                                                ) : (
                                                                    classNames.map(name => (
                                                                        <span key={name} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 text-xs font-bold">
                                                                            {name}
                                                                        </span>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-5 text-right pr-6">
                                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingId(exam.id);
                                                                        setName(exam.name);
                                                                        setTerm(exam.term || 'ANNUAL');
                                                                        setStartDate(exam.start_date);
                                                                        setEndDate(exam.end_date);
                                                                        setSelectedClasses(exam.applicable_classes || []);
                                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                    }}
                                                                    className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="Edit Exam"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteExam(exam.id, exam.name)}
                                                                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Delete Exam"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="p-12 text-center text-gray-400 font-medium">
                                                    {searchTerm ? 'No exams match your search.' : 'No exams created yet.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm font-bold text-gray-600">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'subjects' && (
                    <SubjectManagement />
                )}

                {activeTab === 'marks' && (
                    <div>
                        <MarksEntry />
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 min-h-[400px]">
                        <h3 className="text-xl font-bold mb-6">Student Results & Report Cards</h3>
                        <StudentResults />
                    </div>
                )}
            </div>
        </div>
    );
};

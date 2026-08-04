import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, X, ArrowRight, LayoutDashboard, Users, GraduationCap,
    BookOpen, ClipboardList, Calendar, DollarSign, Bus, Bell,
    Settings, User, Clock, Hash, Command
} from 'lucide-react';

interface SearchResult {
    id: string;
    label: string;
    sub?: string;
    href: string;
    icon: React.ElementType;
    category: string;
}

// Static navigation pages available in the command palette
const STATIC_PAGES: SearchResult[] = [
    { id: 'dashboard', label: 'Dashboard', sub: 'Go to your ERP dashboard', href: '/app/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { id: 'admissions-review', label: 'Admission Review', sub: 'Review pending applications', href: '/app/admissions/review', icon: ClipboardList, category: 'Admissions' },
    { id: 'students', label: 'Student List', sub: 'View all students', href: '/app/students', icon: Users, category: 'Students' },
    { id: 'attendance-marking', label: 'Mark Attendance', sub: 'Record today\'s attendance', href: '/app/attendance/marking', icon: Calendar, category: 'Attendance' },
    { id: 'admin-attendance', label: 'Attendance Dashboard', sub: 'Admin attendance overview', href: '/app/admin/attendance', icon: Calendar, category: 'Attendance' },
    { id: 'exams', label: 'Exam Management', sub: 'Manage exams and schedules', href: '/app/exam-admin/manage', icon: GraduationCap, category: 'Exams' },
    { id: 'marks-entry', label: 'Marks Entry', sub: 'Enter student marks', href: '/app/exam-admin/marks-entry', icon: BookOpen, category: 'Exams' },
    { id: 'fee-payment', label: 'Payment Entry', sub: 'Record fee payments', href: '/app/fees/payment-entry', icon: DollarSign, category: 'Fees' },
    { id: 'my-fees', label: 'My Fees', sub: 'View your fee status', href: '/app/fees/my', icon: DollarSign, category: 'Fees' },
    { id: 'transport', label: 'Transport Setup', sub: 'Manage routes and buses', href: '/app/transport/setup', icon: Bus, category: 'Transport' },
    { id: 'profile', label: 'My Profile', sub: 'View and edit your profile', href: '/app/profile', icon: User, category: 'Account' },
    { id: 'settings', label: 'Settings', sub: 'App preferences and security', href: '/app/settings', icon: Settings, category: 'Account' },
    { id: 'notifications', label: 'Notifications', sub: 'View all notifications', href: '/app/notifications', icon: Bell, category: 'Account' },
    { id: 'academic-years', label: 'Academic Years', sub: 'Manage academic year settings', href: '/app/academic-years', icon: Calendar, category: 'Academic' },
    { id: 'classes', label: 'Classes & Sections', sub: 'Manage class and section setup', href: '/app/classes', icon: Hash, category: 'Academic' },
    { id: 'bulk-operations', label: 'Bulk Operations', sub: 'Import/export and bulk actions', href: '/app/admin/bulk-operations', icon: ClipboardList, category: 'Admin' },
];

const RECENT_SEARCHES_KEY = 'erp_recent_searches';
const MAX_RECENT = 5;

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load recent searches
    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) setRecentSearches(JSON.parse(stored));
        } catch { /* noop */ }
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const filtered = query.trim().length === 0
        ? []
        : STATIC_PAGES.filter(p =>
            p.label.toLowerCase().includes(query.toLowerCase()) ||
            p.sub?.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase())
        );

    const displayResults = query.trim().length === 0 ? recentSearches : filtered;

    const navigate_to = useCallback((result: SearchResult) => {
        // Persist to recent searches
        const updated = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, MAX_RECENT);
        setRecentSearches(updated);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        navigate(result.href);
        onClose();
    }, [navigate, onClose, recentSearches]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, displayResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && displayResults[selectedIndex]) {
            navigate_to(displayResults[selectedIndex]);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    // Group results by category
    const grouped = displayResults.reduce<Record<string, SearchResult[]>>((acc, r) => {
        const cat = r.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -20 }}
                        transition={{ type: 'spring', duration: 0.25 }}
                        className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                            <Search className="w-4 h-4 text-gray-400 shrink-0" />
                            <input
                                ref={inputRef}
                                id="command-palette-input"
                                type="text"
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                                onKeyDown={handleKeyDown}
                                placeholder="Search pages, students, modules..."
                                className="flex-1 bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none"
                            />
                            {query && (
                                <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <kbd className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">
                                <span>ESC</span>
                            </kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-80 overflow-y-auto">
                            {displayResults.length === 0 && query.trim().length > 0 ? (
                                <div className="py-10 text-center text-sm text-gray-400">
                                    No results for "<strong>{query}</strong>"
                                </div>
                            ) : displayResults.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Command className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400 font-medium">Type to search pages, students, and actions</p>
                                </div>
                            ) : (
                                Object.entries(grouped).map(([category, items]) => (
                                    <div key={category}>
                                        <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            {query.trim() === '' && <Clock className="w-3 h-3" />}
                                            {query.trim() === '' ? 'Recent' : category}
                                        </div>
                                        {items.map(result => {
                                            const globalIndex = displayResults.indexOf(result);
                                            const Icon = result.icon;
                                            return (
                                                <button
                                                    key={result.id}
                                                    onClick={() => navigate_to(result)}
                                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${globalIndex === selectedIndex ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${globalIndex === selectedIndex ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{result.label}</p>
                                                        {result.sub && <p className="text-xs text-gray-400 font-medium truncate">{result.sub}</p>}
                                                    </div>
                                                    {globalIndex === selectedIndex && (
                                                        <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                                <span className="flex items-center gap-1"><kbd className="bg-gray-100 px-1 py-0.5 rounded text-[9px] font-bold">↑↓</kbd> navigate</span>
                                <span className="flex items-center gap-1"><kbd className="bg-gray-100 px-1 py-0.5 rounded text-[9px] font-bold">↵</kbd> open</span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-300">School ERP</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

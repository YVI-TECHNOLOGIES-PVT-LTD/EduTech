import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Calendar,
    Users,
    FileText,
    GraduationCap,
    BarChart3,
    LogOut,
    Menu,
    X,
    UserCircle,
    ChevronDown,
    Settings,
    CheckCircle,
    ScrollText,
    Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ExamAdminLayout = () => {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // EXAM ADMIN Sidebar Items
    const menuGroups = [
        {
            label: 'Examination Cell',
            items: [
                { label: 'Dashboard', icon: LayoutDashboard, path: '/app/exam-admin/dashboard' },
                { label: 'Exam Timetable', icon: Calendar, path: '/app/exam-admin/timetable' },
                { label: 'Eligibility & Attendance', icon: CheckCircle, path: '/app/exam-admin/eligibility' },
                { label: 'Seating Allocation', icon: Users, path: '/app/exam-admin/seating' },
                { label: 'Hall Management', icon: Building, path: '/app/exam-admin/halls' },
                { label: 'Hall Tickets', icon: ScrollText, path: '/app/exam-admin/hall-tickets' },
                { label: 'Question Papers', icon: FileText, path: '/app/exam-admin/question-papers' },
                { label: 'Results Control', icon: GraduationCap, path: '/app/exam-admin/results' },
                { label: 'Analytics', icon: BarChart3, path: '/app/exam-admin/analytics' },
            ]
        }
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const SidebarItem = ({ item }: { item: any }) => {
        const isActive = location.pathname === item.path;

        return (
            <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
                    }`}
                onClick={() => setIsMobileMenuOpen(false)}
            >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'}`} />
                <span className={`font-semibold tracking-wide ${!isSidebarOpen && 'hidden'}`}>{item.label}</span>
                {isActive && isSidebarOpen && (
                    <motion.div
                        layoutId="sidebarActive"
                        className="ml-auto w-1 h-4 bg-indigo-300 rounded-full"
                    />
                )}
            </Link>
        );
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="hidden lg:flex flex-col bg-white border-r border-gray-100 sticky top-0 h-screen z-30 transition-all duration-300 overflow-hidden"
            >
                <div className="p-6 flex items-center gap-3 h-20">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200 shrink-0">
                        Ex
                    </div>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-black text-xl text-gray-900 tracking-tight"
                        >
                            ExamCell
                        </motion.div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 sidebar-scrollbar">
                    {menuGroups.map((group, idx) => (
                        <div key={idx} className="space-y-2">
                            {isSidebarOpen && (
                                <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    {group.label}
                                </p>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item, i) => (
                                    <SidebarItem key={i} item={item} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-50">
                    <button
                        onClick={toggleSidebar}
                        className="w-full flex items-center justify-center p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </motion.aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-50 lg:hidden flex flex-col p-6 shadow-2xl"
                        >
                            {/* Mobile Sidebar Content */}
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">Ex</div>
                                    <span className="font-black text-xl text-gray-900">ExamCell</span>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-50 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-8">
                                {menuGroups.map((group, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{group.label}</p>
                                        <div className="space-y-1">
                                            {group.items.map((item, i) => (
                                                <SidebarItem key={i} item={item} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navbar */}
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
                    <div className="h-20 px-4 sm:px-8 flex items-center justify-between">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="ml-auto flex items-center gap-2 sm:gap-6">
                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-3 p-1.5 pl-3 sm:pl-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all"
                                >
                                    <div className="hidden sm:block text-right">
                                        <p className="text-sm font-bold text-gray-900 leading-tight">{user?.full_name}</p>
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">Exam Admin</p>
                                    </div>
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-gray-100">
                                        <UserCircle className="w-6 h-6" />
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 p-3 z-50 overflow-hidden"
                                            >
                                                <div className="px-4 py-4 mb-2 bg-gray-50 rounded-2xl">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Signed in as</p>
                                                    <p className="font-bold text-gray-900 truncate">{user?.email}</p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[9px] font-black uppercase">EXAM_ADMIN</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <Link to="/app/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-semibold">
                                                        <Settings className="w-4 h-4" />
                                                        Settings
                                                    </Link>
                                                    <div className="h-[1px] bg-gray-50 mx-2 my-2" />
                                                    <button
                                                        onClick={() => {
                                                            setIsProfileOpen(false);
                                                            signOut();
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content View */}
                <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

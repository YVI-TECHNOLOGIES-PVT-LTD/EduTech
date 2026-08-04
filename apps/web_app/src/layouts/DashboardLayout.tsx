import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/theme/useTheme';
import { useMasterData } from '../modules/admission/context/MasterDataContext';

import { useSettingsStore } from '../store/settings.store';
import { MENU_REGISTRY } from '../config/menu_registry';
import { useModuleVisibility } from '../services/ModuleVisibilityService';
import { LandingResolver } from '../services/LandingResolver';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    ClipboardList,
    Calendar,
    Coins,
    Bus,
    Bell,
    Settings,
    LogOut,
    Menu,
    X,
    UserCircle,
    Receipt,
    RefreshCw,
    FileText,
    Clock,
    Search,
    ChevronDown,
    ShieldCheck,
    Activity,
    AlertOctagon,
    BarChart3,
    Monitor,
    DollarSign,
    MapPin,
    User,
    Briefcase,
    Building,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Moon,
    Sun,
    Command,
    Sparkles,
    SlidersHorizontal,
    CheckSquare,
    MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommandPalette } from '../components/search/CommandPalette';
import { useCommandPalette } from '../hooks/layout/useCommandPalette';
import { NotificationCenter } from '../features/notifications/NotificationCenter';
import { useNotificationStore } from '../store/notification.store';
import { Breadcrumb } from '../components/navigation/Breadcrumb';
import { useWorkspaceOptional } from '../modules/common/workspace/WorkspaceContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';

export const DashboardLayout = () => {
    const { user, signOut, hasPermission, hasRole, systemMode } = useAuth();
    const { schools, academicYears, activeSchoolId, activeAcademicYearId, changeSchool, changeAcademicYear } = useMasterData();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Core states
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [sidebarSearch, setSidebarSearch] = useState('');
    
    // Preference states from global store
    const { theme, setTheme, colorPreset, setColorPreset, density, setDensity, reducedMotion, toggleReducedMotion } = useTheme();

    // Command palette, notification store, navigation visits
    const { isOpen: isPaletteOpen, open: openPalette, close: closePalette } = useCommandPalette();
    const workspace = useWorkspaceOptional();
    const { unreadCount, togglePanel: toggleNotifications } = useNotificationStore();

    const { getVisibleModules, isModuleVisible } = useModuleVisibility();

    // Dynamic permission-driven menu filtration
    const filteredMenuGroups = MENU_REGISTRY.map(group => {
        // Enforce module boundary check
        if (group.module && !isModuleVisible(group.module)) {
            return { ...group, items: [] };
        }
        // If group itself requires a permission, check it
        if (group.permission && !hasPermission(group.permission)) {
            return { ...group, items: [] };
        }
        const matchingItems = group.items.filter(item => 
            (!item.permission || hasPermission(item.permission)) &&
            item.label.toLowerCase().includes(sidebarSearch.toLowerCase())
        );
        return {
            ...group,
            items: matchingItems
        };
    }).filter(group => group.items.length > 0);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Mobile Dynamic bottom nav generation using permissions and visible modules
    const getMobileBottomNav = () => {
        const visibleModules = getVisibleModules();
        const activeModuleIds = new Set(visibleModules.map(m => m.id));
        const landingRoute = LandingResolver.resolveLandingRoute(visibleModules);

        const items = [
            { label: 'Dashboard', icon: LayoutDashboard, path: landingRoute }
        ];

        if (activeModuleIds.has('assessment')) {
            items.push({ label: 'Assessments', icon: ClipboardList, path: '/app/assessment/dashboard' });
        }
        if (activeModuleIds.has('admission')) {
            items.push({ label: 'Admissions', icon: ClipboardList, path: '/app/admissions/review' });
        }
        if (activeModuleIds.has('student') || activeModuleIds.has('parent')) {
            items.push({ label: 'Students', icon: Users, path: '/app/students' });
        }
        if (activeModuleIds.has('finance')) {
            items.push({ label: 'Finance', icon: Coins, path: '/app/finance/dashboard' });
        }
        if (activeModuleIds.has('driver') || activeModuleIds.has('transport')) {
            items.push({ label: 'Transport', icon: Bus, path: '/app/transport/overview' });
        }

        items.push({ label: 'Profile', icon: UserCircle, path: '/app/profile' });

        const uniqueItems: any[] = [];
        const paths = new Set<string>();
        for (const item of items) {
            if (!paths.has(item.path)) {
                paths.add(item.path);
                uniqueItems.push(item);
            }
        }
        return uniqueItems.slice(0, 5);
    };

    const mobileBottomNavItems = getMobileBottomNav().filter(item => 
        !item.permission || hasPermission(item.permission)
    );

    const SidebarItem = ({ item }: { item: any }) => {
        if (item.permission && !hasPermission(item.permission)) return null;

        const pathBase = item.path.split('#')[0];
        const pathHash = item.path.split('#')[1] ? '#' + item.path.split('#')[1] : '';
        const isActive = location.pathname === pathBase && (pathHash ? location.hash === pathHash : !location.hash);

        return (
            <Link
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all group relative ${isActive
                    ? 'bg-primary text-primary-foreground shadow-premium-md shadow-glow'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                onClick={() => setIsMobileMenuOpen(false)}
            >
                {isActive && (
                    <motion.div
                        layoutId="activeLeftIndicator"
                        className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                )}
                
                <item.icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground/80 group-hover:text-primary'}`} />
                
                {isSidebarOpen && (
                    <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-bold text-xs tracking-wide flex-1 truncate"
                    >
                        {item.label}
                    </motion.span>
                )}
            </Link>
        );
    };

    return (
        <>
            <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-background transition-colors duration-300">
                {/* Desktop Collapsible Sidebar */}
                <motion.aside
                    initial={false}
                    animate={{ width: isSidebarOpen ? 280 : 80 }}
                    className="hidden lg:flex flex-col bg-white dark:bg-card border-r border-border/40 sticky top-0 h-screen z-30 transition-all duration-300 overflow-hidden"
                >
                    {/* Sidebar Brand Header */}
                    <div className="p-6 flex flex-col gap-2 shrink-0">
                        <div className="flex items-center gap-3 h-12">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-black text-xl shadow-premium-md shadow-glow shrink-0">
                                E
                            </div>
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col"
                                >
                                    <span className="font-black text-base text-gray-900 dark:text-white tracking-tight">EduTrack</span>
                                    <span className="text-[9px] font-black tracking-widest text-primary uppercase">Enterprise ERP</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Exam Cell Identity Banner */}
                        {hasPermission('exam.dashboard.view') && isSidebarOpen && (
                            <div className="mt-2 px-3 py-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl">
                                <h4 className="text-[10px] font-black text-purple-900 dark:text-purple-300 uppercase tracking-wide">Examination Cell</h4>
                                <p className="text-[8px] text-purple-600 dark:text-purple-400 font-bold">Controller of Examinations</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Search */}
                    {isSidebarOpen && (
                        <div className="px-4 mb-4 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                <input
                                    type="text"
                                    placeholder="Filter navigation..."
                                    value={sidebarSearch}
                                    onChange={(e) => setSidebarSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50/50 dark:bg-muted/10 border border-border text-[11px] font-semibold rounded-xl focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-background transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* Sidebar Navigation Body */}
                    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 custom-scrollbar">

                        {/* Main Group Menus */}
                        {filteredMenuGroups.map((group, idx) => (
                            <div key={idx} className="space-y-1.5">
                                {isSidebarOpen && (
                                    <p className="px-3.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/80">
                                        {group.label}
                                    </p>
                                )}
                                <div className="space-y-0.5">
                                    {group.items.map((item, i) => (
                                        <SidebarItem key={i} item={item} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Collapse Sidebar Button at Bottom */}
                    <div className="p-4 border-t border-border/40 shrink-0 bg-white dark:bg-card">
                        <button
                            onClick={toggleSidebar}
                            className="w-full flex items-center justify-center p-2.5 rounded-xl bg-gray-50 dark:bg-muted/10 text-muted-foreground hover:text-primary transition-colors border border-border/40 shadow-premium-sm"
                        >
                            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </motion.aside>

                {/* Mobile Navigation Drawer / Menu overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40 lg:hidden"
                            />
                            <motion.aside
                                initial={{ x: -280 }}
                                animate={{ x: 0 }}
                                exit={{ x: -280 }}
                                className="fixed left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-card z-50 lg:hidden flex flex-col p-6 shadow-premium-xl border-r border-border/40"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-black text-xl">E</div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-base text-gray-900 dark:text-white leading-tight">EduTrack</span>
                                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Enterprise ERP</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-50 dark:bg-muted/10 border border-border rounded-xl">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1">
                                    {filteredMenuGroups.map((group, idx) => (
                                        <div key={idx} className="space-y-1.5">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80">{group.label}</p>
                                            <div className="space-y-0.5">
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


                {/* Main View Area */}
                <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
                    {/* Top navbar */}
                    <header className="bg-white/80 dark:bg-card/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-20 transition-all duration-300">
                        <div className="h-20 px-4 sm:px-8 flex items-center justify-between">
                            
                            {/* Left: Mobile hamburger & Global Selectors */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    className="lg:hidden p-2 text-muted-foreground hover:bg-muted/50 border border-border/40 rounded-xl"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>

                                {/* Campus / Institution Selector */}
                                <div className="hidden sm:block">
                                    <select
                                        value={activeSchoolId}
                                        onChange={e => changeSchool(e.target.value)}
                                        className="bg-gray-50 dark:bg-muted/10 border border-border text-[11px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl outline-none focus:border-primary focus:bg-white transition-all cursor-pointer"
                                    >
                                        {schools.map(s => (
                                            <option key={s.id} value={s.id}>
                                                🏛️ {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Academic Year Switcher */}
                                <div className="hidden md:block">
                                    <select
                                        value={activeAcademicYearId}
                                        onChange={e => changeAcademicYear(e.target.value)}
                                        className="bg-gray-50 dark:bg-muted/10 border border-border text-[11px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl outline-none focus:border-primary focus:bg-white transition-all cursor-pointer"
                                    >
                                        {academicYears.length === 0 ? (
                                            <option value="">No Academic Year</option>
                                        ) : (
                                            academicYears.map(y => (
                                                <option key={y.id} value={y.id}>
                                                    AY {y.year_label}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Right: Quick actions, notifications, preferences popover, profile dropdown */}
                            <div className="flex items-center gap-2 sm:gap-4">
                                {/* Global search trigger (⌘K) */}
                                <button
                                    onClick={() => workspace?.setSearchOpen(true) ?? openPalette()}
                                    className="bg-gray-50 dark:bg-muted/10 rounded-2xl px-4 py-2 hidden md:flex items-center gap-3 w-48 lg:w-56 ring-1 ring-border/40 hover:ring-primary/30 hover:bg-white dark:hover:bg-background transition-all group shrink-0"
                                >
                                    <Search className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                                    <span className="text-xs text-muted-foreground/60 flex-1 text-left font-semibold">Global search...</span>
                                    <kbd className="text-[9px] font-bold text-muted-foreground/50 bg-gray-200/50 dark:bg-muted/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-sans">
                                        <Command className="w-2.5 h-2.5" />K
                                    </kbd>
                                </button>
                                
                                <button
                                    onClick={() => workspace?.setSearchOpen(true)}
                                    className="md:hidden p-2 text-muted-foreground hover:bg-muted/50 border border-border/40 rounded-xl"
                                >
                                    <Search className="w-4.5 h-4.5" />
                                </button>

                                <button
                                    onClick={() => workspace?.setProductivityOpen(true)}
                                    className="hidden md:flex p-2 text-muted-foreground hover:bg-muted/50 border border-border/40 rounded-xl hover:text-primary transition-colors"
                                    title="Productivity Hub"
                                >
                                    <Sparkles className="w-4.5 h-4.5" />
                                </button>

                                {/* Theme Mode Switcher Popover */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-muted-foreground hover:bg-muted/50 border border-border/40">
                                            {theme === 'dark' ? <Moon className="w-4.5 h-4.5 text-primary" /> : <Sun className="w-4.5 h-4.5 text-yellow-500" />}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-2xl w-40">
                                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400">Appearance Theme</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setTheme('light')} className="text-xs font-semibold py-2 rounded-lg gap-2 cursor-pointer">
                                            <Sun className="w-4 h-4 text-yellow-500" /> Light
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme('dark')} className="text-xs font-semibold py-2 rounded-lg gap-2 cursor-pointer">
                                            <Moon className="w-4 h-4 text-primary" /> Dark
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme('system')} className="text-xs font-semibold py-2 rounded-lg gap-2 cursor-pointer">
                                            <Monitor className="w-4 h-4 text-muted-foreground" /> System Default
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Preferences Settings Popover (Inline presets configuration) */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-muted-foreground hover:bg-muted/50 border border-border/40">
                                            <SlidersHorizontal className="w-4.5 h-4.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-2xl w-56 p-3">
                                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400 mb-2">Accent Presets</DropdownMenuLabel>
                                        <div className="grid grid-cols-5 gap-1.5 mb-3">
                                            {(['blue', 'purple', 'emerald', 'slate', 'corporate'] as const).map(preset => {
                                                const colors: Record<string, string> = {
                                                    blue: 'bg-blue-600',
                                                    purple: 'bg-purple-600',
                                                    emerald: 'bg-emerald-600',
                                                    slate: 'bg-slate-500',
                                                    corporate: 'bg-slate-900 dark:bg-white'
                                                };
                                                return (
                                                    <button
                                                        key={preset}
                                                        onClick={() => setColorPreset(preset)}
                                                        className={`w-7 h-7 rounded-full ${colors[preset]} flex items-center justify-center border-2 ${colorPreset === preset ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent hover:scale-105'} transition-all`}
                                                        title={`${preset.charAt(0).toUpperCase() + preset.slice(1)} Preset`}
                                                    >
                                                        {colorPreset === preset && <CheckSquare className="w-3.5 h-3.5 text-white mix-blend-difference" />}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400 mt-2">Layout Density</DropdownMenuLabel>
                                        <div className="flex gap-1 mt-1 mb-2">
                                            {(['compact', 'comfortable', 'spacious'] as const).map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => setDensity(d)}
                                                    className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase border transition-all ${density === d ? 'bg-primary text-white border-transparent' : 'bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50'}`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>

                                        <DropdownMenuSeparator />
                                        <div className="flex items-center justify-between py-1.5 mt-1.5">
                                            <span className="text-[10px] font-black uppercase text-gray-400">Reduced Motion</span>
                                            <button
                                                onClick={toggleReducedMotion}
                                                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${reducedMotion ? 'bg-primary' : 'bg-gray-200 dark:bg-muted'}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full shadow-premium-sm transition-transform duration-200 ${reducedMotion ? 'translate-x-4' : ''}`} />
                                            </button>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Message Center Alert Badge */}
                                <div className="relative">
                                    <button className="p-2.5 bg-gray-50 dark:bg-muted/10 text-muted-foreground rounded-xl hover:bg-white dark:hover:bg-muted/20 hover:shadow-premium-sm hover:text-primary transition-all border border-border/40">
                                        <MessageSquare className="w-4.5 h-4.5" />
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-card">
                                            5
                                        </span>
                                    </button>
                                </div>

                                {/* Notifications Center Slide Toggle */}
                                <div className="relative">
                                    <button
                                        onClick={toggleNotifications}
                                        className="p-2.5 bg-gray-50 dark:bg-muted/10 text-muted-foreground rounded-xl hover:bg-white dark:hover:bg-muted/20 hover:shadow-premium-sm hover:text-primary transition-all border border-border/40"
                                    >
                                        <Bell className="w-4.5 h-4.5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-card">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                <div className="h-8 w-[1px] bg-border/40 hidden sm:block"></div>

                                {/* Modernized Profile Menu Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center gap-2.5 p-1.5 pl-3.5 bg-gray-50 dark:bg-muted/10 rounded-2xl border border-border/40 hover:bg-white dark:hover:bg-muted/20 hover:shadow-premium-md transition-all duration-200"
                                    >
                                        <div className="hidden sm:block text-right">
                                            <p className="text-xs font-black text-gray-900 dark:text-white leading-tight">{user?.full_name}</p>
                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">{user?.roles?.[0]}</p>
                                        </div>
                                        <div className="w-9 h-9 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-premium-sm border border-primary/20 shrink-0 font-black text-xs">
                                            {user?.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/60 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isProfileOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 mt-3 w-64 bg-white dark:bg-card rounded-3xl shadow-premium-xl border border-border/60 p-3 z-50 overflow-hidden"
                                                >
                                                    <div className="px-4 py-4 mb-2 bg-gray-50 dark:bg-muted/10 rounded-2xl border border-border/30">
                                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Signed in as</p>
                                                        <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{user?.email}</p>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {user?.roles.map(r => (
                                                                <span key={r} className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/10 rounded-full text-[8px] font-black uppercase tracking-wide">{r}</span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-0.5">
                                                        <Link to="/app/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors font-bold">
                                                            <UserCircle className="w-4 h-4 text-muted-foreground/60" />
                                                            My Profile
                                                        </Link>
                                                        <Link to="/app/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors font-bold">
                                                            <Settings className="w-4 h-4 text-muted-foreground/60" />
                                                            Settings
                                                        </Link>
                                                        <div className="h-[1px] bg-border/40 mx-2 my-2" />
                                                        <button
                                                            onClick={() => {
                                                                setIsProfileOpen(false);
                                                                signOut();
                                                            }}
                                                            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors font-bold"
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

                    {/* Breadcrumb — auto-generated from current URL */}
                    <Breadcrumb />

                    {/* Mobile Quick Search Input Box */}
                    <AnimatePresence>
                        {isSearchOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-white dark:bg-card border-b border-border/40 p-4 md:hidden sticky top-20 z-10"
                            >
                                <div className="bg-gray-50 dark:bg-muted/10 rounded-xl px-4 py-3 flex items-center gap-3 border border-border">
                                    <Search className="w-4.5 h-4.5 text-muted-foreground/60" />
                                    <input
                                        type="text"
                                        placeholder="Search catalog..."
                                        className="bg-transparent border-none text-xs font-semibold focus:ring-0 placeholder:text-muted-foreground/60 w-full outline-none"
                                        autoFocus
                                    />
                                    <button onClick={() => setIsSearchOpen(false)}>
                                        <X className="w-4.5 h-4.5 text-muted-foreground/60" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Dynamic Panel Outlet */}
                    <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
                        <div className="max-w-7xl mx-auto">
                            <Outlet />
                        </div>
                    </main>
                </div>

                {/* Mobile Bottom Navigation Bar (Dynamic role-based bottom bar) */}
                <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-card/90 backdrop-blur-md border-t border-border/40 z-30 flex items-center justify-around px-2 lg:hidden shadow-premium-lg">
                    {mobileBottomNavItems.map((item, idx) => {
                        const pathBase = item.path.split('#')[0];
                        const isActive = location.pathname === pathBase;
                        return (
                            <Link
                                key={idx}
                                to={item.path}
                                className={`flex flex-col items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all relative ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                                <span className={`text-[9px] font-black tracking-wide ${isActive ? 'opacity-100' : 'opacity-80 font-bold'}`}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeBottomIndicator"
                                        className="absolute -top-1 left-2 right-2 h-0.5 bg-primary rounded-full"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Global — CommandPalette (Ctrl+K) */}
            <CommandPalette isOpen={isPaletteOpen} onClose={closePalette} />

            {/* Global — NotificationCenter slide-over */}
            <NotificationCenter />
        </>
    );
};

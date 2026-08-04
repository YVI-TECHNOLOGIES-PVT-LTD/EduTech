import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/theme/useTheme';
import { Sun, Moon, Bell, Search, LogOut, Settings, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Button } from '../ui/button';

export const HeaderFramework = () => {
    const { user, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const [academicYear, setAcademicYear] = useState('2025-2026');
    const [selectedSchool, setSelectedSchool] = useState('Primary High School');

    const handleThemeToggle = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 z-30">
            {/* Left: Global Search & Switchers */}
            <div className="flex items-center gap-4">
                <div className="relative w-64">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search student or action... (Ctrl+K)"
                        className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 text-xs font-medium rounded-xl focus:outline-none focus:border-primary focus:bg-white transition-all"
                    />
                </div>

                {/* School Selector */}
                <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="border-none bg-gray-50 text-xs font-semibold px-3 py-1.5 rounded-xl outline-none"
                >
                    <option value="Primary High School">Primary High School</option>
                    <option value="International Junior College">International Junior College</option>
                </select>

                {/* Academic Year Selector */}
                <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="border-none bg-gray-50 text-xs font-semibold px-3 py-1.5 rounded-xl outline-none"
                >
                    <option value="2025-2026">AY 2025-2026</option>
                    <option value="2026-2027">AY 2026-2027</option>
                </select>
            </div>

            {/* Right: Quick actions, notifications, profile */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleThemeToggle}
                    className="rounded-xl w-9 h-9 text-gray-600 hover:bg-gray-100"
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl w-9 h-9 text-gray-600 hover:bg-gray-100 relative"
                >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-xl transition-all focus:outline-none">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                {user?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="text-left hidden md:block pr-1">
                                <p className="text-xs font-bold text-gray-900 leading-tight">
                                    {user?.full_name || 'User Profile'}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium">
                                    {user?.roles?.[0] || 'GUEST'}
                                </p>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl mt-1">
                        <DropdownMenuLabel className="font-bold text-xs text-gray-500">
                            My Account
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs gap-2 py-2 cursor-pointer rounded-lg">
                            <User className="w-4 h-4" />
                            My Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2 py-2 cursor-pointer rounded-lg">
                            <Settings className="w-4 h-4" />
                            Account Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={signOut}
                            className="text-xs text-red-600 focus:text-red-600 gap-2 py-2 cursor-pointer rounded-lg"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout ERP
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};
export default HeaderFramework;

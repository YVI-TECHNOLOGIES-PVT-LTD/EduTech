import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NAVIGATION_CONFIG, NavigationItem } from '../../config/navigation.config';
import { Icon } from '../../lib/icons';
import { ChevronDown, ChevronRight, Menu } from 'lucide-react';

export const Sidebar = () => {
    const { hasPermission, user } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
    };

    // Filters dynamic menu item options using RBAC hasPermission credentials
    const filterNavItems = (items: NavigationItem[]): NavigationItem[] => {
        return items
            .filter(item => {
                if (item.path === '/app/admissions/entrance-assessment') {
                    return !!user?.enabledFeatures?.entrance_exam;
                }
                if (!item.permission) return true;
                if (Array.isArray(item.permission)) {
                    return item.permission.some(p => hasPermission(p));
                }
                return hasPermission(item.permission);
            })
            .map(item => {
                if (item.children) {
                    return {
                        ...item,
                        children: filterNavItems(item.children),
                    };
                }
                return item;
            })
            .filter(item => !item.children || item.children.length > 0);
    };

    const navItems = filterNavItems(NAVIGATION_CONFIG);

    return (
        <aside
            className={`bg-primary text-primary-foreground flex flex-col h-screen transition-all duration-300 border-r border-primary-foreground/10 ${
                collapsed ? 'w-20' : 'w-64'
            }`}
        >
            {/* Sidebar Brand Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary-foreground/10 h-16">
                {!collapsed && (
                    <span className="font-sans font-black text-lg tracking-wide uppercase">School ERP</span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors"
                >
                    <Menu className="w-5 h-5 text-current" />
                </button>
            </div>

            {/* Sidebar Navigation Items */}
            <nav className="flex-1 p-3 overflow-y-auto space-y-1 custom-scrollbar">
                {navItems.map(item => {
                    const hasChildren = !!item.children && item.children.length > 0;
                    const isExpanded = !!expandedGroups[item.title];

                    if (hasChildren) {
                        return (
                            <div key={item.title} className="space-y-1">
                                <button
                                    onClick={() => toggleGroup(item.title)}
                                    className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-primary-foreground/10 transition-colors text-sm font-medium"
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon name={item.icon} className="w-5 h-5 opacity-80" />
                                        {!collapsed && <span>{item.title}</span>}
                                    </div>
                                    {!collapsed && (
                                        isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>

                                {/* Child Nodes */}
                                {!collapsed && isExpanded && (
                                    <div className="pl-6 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                        {item.children?.map(child => (
                                            <NavLink
                                                key={child.path}
                                                to={child.path}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 p-2 rounded-xl text-xs font-semibold transition-all hover:bg-primary-foreground/10 ${
                                                        isActive ? 'bg-primary-foreground/15 text-white font-bold' : 'opacity-80'
                                                    }`
                                                }
                                            >
                                                <Icon name={child.icon} className="w-4 h-4" />
                                                <span>{child.title}</span>
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 p-2.5 rounded-xl text-sm font-medium transition-all hover:bg-primary-foreground/10 ${
                                    isActive ? 'bg-primary-foreground/15 text-white font-bold' : 'opacity-85'
                                }`
                            }
                        >
                            <Icon name={item.icon} className="w-5 h-5" />
                            {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};
export default Sidebar;

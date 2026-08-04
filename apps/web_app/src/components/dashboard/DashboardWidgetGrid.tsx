import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Eye, EyeOff, LayoutGrid, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from '../ui/dropdown-menu';

interface Widget {
    id: string;
    label: string;
    component: React.ReactNode;
    defaultVisible?: boolean;
}

interface DashboardWidgetGridProps {
    dashboardKey: string;
    widgets: Widget[];
}

export const DashboardWidgetGrid: React.FC<DashboardWidgetGridProps> = ({
    dashboardKey,
    widgets
}) => {
    // Local visibility dictionary synced to localStorage
    const [visibility, setVisibility] = useState<Record<string, boolean>>(() => {
        try {
            const saved = localStorage.getItem(`erp-dashboard-widgets-${dashboardKey}`);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch {}
        
        // Build defaults
        const defaults: Record<string, boolean> = {};
        widgets.forEach(w => {
            defaults[w.id] = w.defaultVisible !== false;
        });
        return defaults;
    });

    useEffect(() => {
        localStorage.setItem(`erp-dashboard-widgets-${dashboardKey}`, JSON.stringify(visibility));
    }, [visibility, dashboardKey]);

    const toggleWidget = (id: string) => {
        setVisibility(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const resetLayout = () => {
        const defaults: Record<string, boolean> = {};
        widgets.forEach(w => {
            defaults[w.id] = w.defaultVisible !== false;
        });
        setVisibility(defaults);
    };

    const activeWidgets = widgets.filter(w => visibility[w.id]);

    return (
        <div className="space-y-6">
            {/* Widget layout toolbar controls */}
            <div className="flex items-center justify-end gap-2.5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs h-9 rounded-xl border-border gap-2">
                            <Sliders className="w-3.5 h-3.5" />
                            Customize View
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl w-56">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400">Toggle Widgets</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {widgets.map(w => (
                            <DropdownMenuCheckboxItem
                                key={w.id}
                                checked={!!visibility[w.id]}
                                onCheckedChange={() => toggleWidget(w.id)}
                                className="text-xs rounded-lg cursor-pointer font-semibold py-2"
                            >
                                {w.label}
                            </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={false}
                            onCheckedChange={resetLayout}
                            className="text-xs rounded-lg text-red-500 hover:text-red-600 cursor-pointer font-bold py-2"
                        >
                            Reset Widgets
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Dynamic visual grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                <AnimatePresence>
                    {activeWidgets.map((w, idx) => (
                        <motion.div
                            key={w.id}
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.22, delay: idx * 0.04 }}
                            layout
                            className="w-full flex"
                        >
                            <div className="w-full flex flex-col bg-white dark:bg-card border border-border/50 rounded-3xl p-6 shadow-premium-sm transition-all duration-300 hover:shadow-premium-md relative overflow-hidden">
                                {w.component}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
export default DashboardWidgetGrid;

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Breadcrumb } from '../navigation/Breadcrumb';

interface PageWrapperProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    filters?: React.ReactNode;
    kpis?: React.ReactNode;
    children: React.ReactNode;
    timeline?: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
    title,
    description,
    icon: Icon,
    actions,
    filters,
    kpis,
    children,
    timeline
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-6 lg:space-y-8 animate-in fade-in duration-500"
        >
            {/* Header and Actions Slot */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-premium-sm border border-primary/10">
                                <Icon className="w-5 h-5" />
                            </div>
                        )}
                        <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            {title}
                        </h1>
                    </div>
                    {description && (
                        <p className="text-xs font-semibold text-muted-foreground leading-relaxed pl-1 max-w-2xl">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                        {actions}
                    </div>
                )}
            </div>

            {/* Filter Slot */}
            {filters && (
                <div className="bg-white dark:bg-card border border-border/50 rounded-2xl p-4 shadow-premium-sm">
                    {filters}
                </div>
            )}

            {/* KPIs Summary Slot */}
            {kpis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {kpis}
                </div>
            )}

            {/* Main Content Layout with optional activity timeline feed */}
            {timeline ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                        {children}
                    </div>
                    <div className="space-y-6 lg:space-y-8">
                        {timeline}
                    </div>
                </div>
            ) : (
                <div className="w-full">
                    {children}
                </div>
            )}
        </motion.div>
    );
};
export default PageWrapper;

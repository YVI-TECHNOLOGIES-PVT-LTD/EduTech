import React, { useState } from 'react';
import { ArrowLeft, Edit2, History, FileText, Settings } from 'lucide-react';
import { Button } from '../ui/button';

interface ListPageProps {
    title: string;
    description?: string;
    primaryAction?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
    };
    filterBar?: React.ReactNode;
    children: React.ReactNode;
}

export const ListPageTemplate = ({
    title,
    description,
    primaryAction,
    filterBar,
    children
}: ListPageProps) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 leading-tight select-none">{title}</h1>
                    {description && <p className="text-xs text-gray-400 mt-1 font-medium">{description}</p>}
                </div>
                {primaryAction && (
                    <Button onClick={primaryAction.onClick} className="rounded-xl flex items-center gap-2">
                        {primaryAction.icon}
                        {primaryAction.label}
                    </Button>
                )}
            </div>

            {/* Filters */}
            {filterBar && <div className="w-full">{filterBar}</div>}

            {/* List / Grid Contents */}
            <div className="w-full">{children}</div>
        </div>
    );
};

interface DetailsPageProps {
    title: string;
    subtitle?: string;
    onBack: () => void;
    actions?: React.ReactNode;
    tabs: {
        id: string;
        label: string;
        icon?: React.ReactNode;
        content: React.ReactNode;
    }[];
}

export const DetailsPageTemplate = ({
    title,
    subtitle,
    onBack,
    actions,
    tabs
}: DetailsPageProps) => {
    const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

    return (
        <div className="space-y-6 text-left animate-in fade-in duration-300">
            {/* Header / Back Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="rounded-xl border border-gray-100 bg-white shadow-sm w-10 h-10 shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 leading-tight select-none">{title}</h1>
                        {subtitle && <p className="text-xs text-gray-400 font-semibold mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>

            {/* Details Navigation Tabs */}
            <div className="border-b border-gray-100 flex items-center gap-2 overflow-x-auto w-full select-none">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all relative shrink-0 border-b-2 ${
                            activeTab === tab.id
                                ? 'border-primary text-primary font-black'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active Tab Panel */}
            <div className="w-full py-2">
                {tabs.find(t => t.id === activeTab)?.content}
            </div>
        </div>
    );
};

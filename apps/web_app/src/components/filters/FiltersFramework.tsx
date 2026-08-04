import React from 'react';
import { Button } from '../ui/button';

interface FilterOption {
    label: string;
    value: string;
}

interface FilterBarProps {
    options: FilterOption[];
    selected: string;
    onChange: (val: string) => void;
    children?: React.ReactNode;
}

export const FilterBar = ({ options, selected, onChange, children }: FilterBarProps) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 w-full text-left">
            <div className="flex flex-wrap items-center gap-2">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            selected === opt.value
                                ? 'bg-primary text-primary-foreground shadow shadow-primary/10'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            {children && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {children}
                </div>
            )}
        </div>
    );
};

export const QuickFilter = ({
    label,
    active,
    onClick
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) => {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                active
                    ? 'bg-primary/5 border-primary text-primary'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
        >
            {label}
        </button>
    );
};

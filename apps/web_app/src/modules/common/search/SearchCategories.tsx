import React from 'react';

const CATEGORIES = [
    { value: 'all', label: 'Everything' },
    { value: 'admissions', label: 'Admissions' },
    { value: 'students', label: 'Students' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'finance', label: 'Finance' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'transport', label: 'Transport' },
    { value: 'library', label: 'Library' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'exams', label: 'Exams' },
];

interface SearchCategoriesProps {
    value: string;
    onChange: (value: string) => void;
}

export function SearchCategories({ value, onChange }: SearchCategoriesProps) {
    return (
        <div className="flex gap-1 p-2 border-b border-border overflow-x-auto">
            {CATEGORIES.map(cat => (
                <button
                    key={cat.value}
                    type="button"
                    onClick={() => onChange(cat.value)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${
                        value === cat.value
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted'
                    }`}
                >
                    {cat.label}
                </button>
            ))}
        </div>
    );
}

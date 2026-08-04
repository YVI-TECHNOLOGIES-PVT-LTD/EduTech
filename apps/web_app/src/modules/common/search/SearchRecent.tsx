import React from 'react';
import { Clock } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { SearchResultItem } from '../types';

interface SearchRecentProps {
    onSelect: (href: string, label: string) => void;
}

export function SearchRecent({ onSelect }: SearchRecentProps) {
    const [recents] = useLocalStorage<SearchResultItem[]>('erp_search_recent', []);

    if (recents.length === 0) return null;

    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Recent
                </span>
            </div>
            <div className="space-y-1">
                {recents.slice(0, 5).map(r => (
                    <button
                        key={r.id}
                        type="button"
                        onClick={() => onSelect(r.href, r.label)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-muted/50"
                    >
                        {r.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

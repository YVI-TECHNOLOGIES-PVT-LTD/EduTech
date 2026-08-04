import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SearchCategories } from './SearchCategories';
import { SearchRecent } from './SearchRecent';
import { SearchBookmarks } from './SearchBookmarks';
import type { SearchResultItem } from '../types';

interface SearchPanelProps {
    query: string;
    category: string;
    onCategoryChange: (category: string) => void;
    results: SearchResultItem[];
    loading: boolean;
    onSelect: (href: string, label: string) => void;
}

export function SearchPanel({
    query,
    category,
    onCategoryChange,
    results,
    loading,
    onSelect,
}: SearchPanelProps) {
    const showRecents = query.trim().length < 2;

    return (
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            <SearchCategories value={category} onChange={onCategoryChange} />

            {showRecents ? (
                <div className="p-4 space-y-4">
                    <SearchRecent onSelect={onSelect} />
                    <SearchBookmarks onSelect={onSelect} />
                </div>
            ) : loading ? (
                <div className="p-8 text-center text-xs text-muted-foreground italic">Searching...</div>
            ) : results.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground italic">No results found</div>
            ) : (
                <div className="py-2">
                    {results.map((r, idx) => (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => onSelect(r.href, r.label)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{r.label}</p>
                                <p className="text-[10px] text-muted-foreground capitalize">
                                    {r.module}{r.sub ? ` · ${r.sub}` : ''}
                                </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

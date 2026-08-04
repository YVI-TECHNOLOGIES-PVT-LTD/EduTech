import React from 'react';
import { Bookmark } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { SearchResultItem } from '../types';

interface SearchBookmarksProps {
    onSelect: (href: string, label: string) => void;
}

export function SearchBookmarks({ onSelect }: SearchBookmarksProps) {
    const [bookmarks] = useLocalStorage<SearchResultItem[]>('erp_search_bookmarks', []);

    if (bookmarks.length === 0) return null;

    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Bookmarks
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {bookmarks.map(r => (
                    <button
                        key={r.id}
                        type="button"
                        onClick={() => onSelect(r.href, r.label)}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary/20"
                    >
                        {r.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

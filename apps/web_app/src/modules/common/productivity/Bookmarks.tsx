import React from 'react';
import { Bookmark, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { ProductivityBookmark } from '../types';

interface BookmarksProps {
    storageKey?: string;
}

export function Bookmarks({ storageKey = 'erp_productivity_bookmarks' }: BookmarksProps) {
    const [bookmarks] = useLocalStorage<ProductivityBookmark[]>(storageKey, []);
    const navigate = useNavigate();

    if (bookmarks.length === 0) {
        return <p className="text-xs text-muted-foreground italic">No bookmarks saved</p>;
    }

    return (
        <div className="space-y-2">
            {bookmarks.map(b => (
                <button
                    key={b.id}
                    type="button"
                    onClick={() => navigate(b.href)}
                    className="w-full flex items-center gap-2 p-3 bg-muted/20 rounded-xl text-xs font-bold hover:bg-muted/40 text-left"
                >
                    <Bookmark className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="flex-1 truncate">{b.label}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </button>
            ))}
        </div>
    );
}

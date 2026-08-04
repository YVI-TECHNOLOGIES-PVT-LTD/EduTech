import React from 'react';
import { Pin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface PinnedItem {
    id: string;
    label: string;
    href: string;
}

interface PinnedItemsProps {
    storageKey?: string;
}

export function PinnedItems({ storageKey = 'erp_pinned_items' }: PinnedItemsProps) {
    const [pinned] = useLocalStorage<PinnedItem[]>(storageKey, []);
    const navigate = useNavigate();

    if (pinned.length === 0) {
        return <p className="text-xs text-muted-foreground italic">Nothing pinned</p>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {pinned.map(item => (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.href)}
                    className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center gap-1 hover:bg-primary/20"
                >
                    <Pin className="w-3 h-3" />
                    {item.label}
                </button>
            ))}
        </div>
    );
}

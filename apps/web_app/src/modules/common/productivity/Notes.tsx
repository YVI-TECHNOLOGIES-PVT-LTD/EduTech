import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface NotesProps {
    storageKey?: string;
    placeholder?: string;
}

export function Notes({
    storageKey = 'erp_productivity_notes',
    placeholder = 'Quick notes...',
}: NotesProps) {
    const [note, setNote] = useLocalStorage<string>(storageKey, '');

    return (
        <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Auto-saved locally
            </p>
            <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={placeholder}
                className="w-full min-h-[200px] p-3 border border-border rounded-xl text-xs resize-none focus:outline-none focus:border-primary"
            />
        </div>
    );
}

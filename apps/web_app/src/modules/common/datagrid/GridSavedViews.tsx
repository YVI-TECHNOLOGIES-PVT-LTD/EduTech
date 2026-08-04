import React, { useState } from 'react';
import { Bookmark, Trash2, Save } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from '../../../components/ui/dropdown-menu';
import type { SavedGridView } from '../types';

interface GridSavedViewsProps {
    views: SavedGridView[];
    onSave: (name: string) => void;
    onLoad: (view: SavedGridView) => void;
    onDelete: (id: string) => void;
}

export function GridSavedViews({ views, onSave, onLoad, onDelete }: GridSavedViewsProps) {
    const [saveName, setSaveName] = useState('');
    const [showSave, setShowSave] = useState(false);

    const handleSave = () => {
        if (saveName.trim()) {
            onSave(saveName.trim());
            setSaveName('');
            setShowSave(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs gap-2">
                        <Bookmark className="w-3.5 h-3.5" />
                        Saved Views
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl w-56">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground">
                        Layouts & Filters
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {views.length === 0 ? (
                        <div className="px-2 py-3 text-xs text-muted-foreground italic">No saved views yet</div>
                    ) : (
                        views.map(view => (
                            <DropdownMenuItem
                                key={view.id}
                                className="text-xs flex items-center justify-between cursor-pointer"
                                onClick={() => onLoad(view)}
                            >
                                <span>{view.name}</span>
                                <button
                                    type="button"
                                    onClick={e => {
                                        e.stopPropagation();
                                        onDelete(view.id);
                                    }}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {showSave ? (
                <div className="flex items-center gap-1">
                    <input
                        type="text"
                        value={saveName}
                        onChange={e => setSaveName(e.target.value)}
                        placeholder="View name..."
                        className="px-2 py-1 border border-border rounded-lg text-xs w-32"
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                    <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
                        Save
                    </Button>
                </div>
            ) : (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-xl text-xs gap-1"
                    onClick={() => setShowSave(true)}
                >
                    <Save className="w-3.5 h-3.5" />
                    Save View
                </Button>
            )}
        </div>
    );
}

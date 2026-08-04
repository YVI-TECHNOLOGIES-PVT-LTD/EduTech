import React from 'react';
import { EyeOff, LayoutGrid, Pin } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '../../../components/ui/dropdown-menu';
import type { GridColumn } from '../hooks/useGridState';
import type { GridDensity } from '../types';

interface GridColumnManagerProps<T> {
    columns: GridColumn<T>[];
    visibleKeys: Set<string>;
    pinnedKeys: string[];
    density: GridDensity;
    onToggleColumn: (key: string) => void;
    onTogglePin: (key: string) => void;
    onDensityChange: (density: GridDensity) => void;
}

export function GridColumnManager<T>({
    columns,
    visibleKeys,
    pinnedKeys,
    density,
    onToggleColumn,
    onTogglePin,
    onDensityChange,
}: GridColumnManagerProps<T>) {
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs gap-2">
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Density
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl w-36">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground">
                        Density
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(['compact', 'comfortable', 'spacious'] as GridDensity[]).map(mode => (
                        <DropdownMenuCheckboxItem
                            key={mode}
                            checked={density === mode}
                            onCheckedChange={() => onDensityChange(mode)}
                            className="text-xs capitalize"
                        >
                            {mode}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs gap-2">
                        <EyeOff className="w-3.5 h-3.5" />
                        Columns
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl w-52 max-h-72 overflow-y-auto">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground">
                        Show / Hide & Pin
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columns.map(col => (
                        <div key={col.key} className="flex items-center justify-between px-2 py-1">
                            <DropdownMenuCheckboxItem
                                checked={visibleKeys.has(col.key)}
                                onCheckedChange={() => onToggleColumn(col.key)}
                                disabled={visibleKeys.has(col.key) && visibleKeys.size === 1}
                                className="text-xs flex-1"
                            >
                                {col.header}
                            </DropdownMenuCheckboxItem>
                            <button
                                type="button"
                                onClick={() => onTogglePin(col.key)}
                                className={`p-1 rounded ${pinnedKeys.includes(col.key) ? 'text-primary' : 'text-muted-foreground'}`}
                                title="Pin column"
                            >
                                <Pin className="w-3 h-3 rotate-45" />
                            </button>
                        </div>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}

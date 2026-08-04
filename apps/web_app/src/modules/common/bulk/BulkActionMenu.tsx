import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '../../../components/ui/dropdown-menu';
import type { BulkOperationConfig } from './bulkOperations.config';

interface BulkActionMenuProps {
    operations: BulkOperationConfig[];
    onSelect: (operation: BulkOperationConfig) => void;
}

export function BulkActionMenu({ operations, onSelect }: BulkActionMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1">
                    Bulk Actions
                    <ChevronDown className="w-3 h-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl w-52">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground">
                    Operations
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {operations.map(op => (
                    <DropdownMenuItem
                        key={op.id}
                        onClick={() => onSelect(op)}
                        className="text-xs cursor-pointer"
                    >
                        {op.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface GridPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export function GridPagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
}: GridPaginationProps) {
    const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-muted-foreground gap-4 mt-2">
            <span>
                Showing {start} to {end} of {totalItems} entries
            </span>
            <div className="flex items-center gap-1.5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl w-9 h-9"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-3 py-1.5 bg-muted/30 rounded-xl border border-border/40 font-black">
                    {currentPage} / {totalPages}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="rounded-xl w-9 h-9"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Filter, RotateCcw } from 'lucide-react';

export interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  onApply?: () => void;
  onReset?: () => void;
  activeFiltersCount?: number;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  open,
  onOpenChange,
  title = 'Filters',
  description = 'Adjust criteria to filter records in this view.',
  children,
  onApply,
  onReset,
  activeFiltersCount,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background">
        <SheetHeader className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold flex items-center gap-2">
                {title}
                {activeFiltersCount !== undefined && activeFiltersCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-mono">
                    {activeFiltersCount}
                  </span>
                )}
              </SheetTitle>
              {description && (
                <SheetDescription className="text-xs text-muted-foreground">
                  {description}
                </SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>

        <SheetFooter className="p-4 border-t border-border bg-muted/20 flex flex-row items-center justify-between gap-2">
          {onReset && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-xs font-semibold gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onApply?.();
              onOpenChange(false);
            }}
            className="text-xs font-semibold px-4 ml-auto"
          >
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

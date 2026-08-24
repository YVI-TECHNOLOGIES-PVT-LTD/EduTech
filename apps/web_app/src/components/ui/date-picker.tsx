import * as React from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, X, ChevronDown } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/* -------------------------------------------------------------------------
 * 1. Single Date Picker
 * ------------------------------------------------------------------------- */
export interface DatePickerProps {
  date?: Date | null;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  minDate?: Date;
  maxDate?: Date;
  formatStr?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = 'Pick a date',
  className,
  disabled = false,
  clearable = true,
  minDate,
  maxDate,
  formatStr = 'PPP',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = date ? new Date(date) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn('relative inline-flex w-full', className)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal pl-3 pr-8 rounded-xl h-10 border-input bg-background/50 hover:bg-accent/50 transition-all',
              !selectedDate && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground/80 shrink-0" />
            <span className="truncate">
              {selectedDate ? format(selectedDate, formatStr) : placeholder}
            </span>
          </Button>
        </PopoverTrigger>

        {clearable && selectedDate && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDateChange?.(undefined);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Clear date"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-border/80" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => {
            onDateChange?.(d);
            setOpen(false);
          }}
          disabled={(d) => {
            if (minDate && d < minDate) return true;
            if (maxDate && d > maxDate) return true;
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------
 * 2. Date Range Picker with Presets
 * ------------------------------------------------------------------------- */
export interface DateRangePickerProps {
  dateRange?: DateRange;
  onRangeChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showPresets?: boolean;
  formatStr?: string;
}

export function DateRangePicker({
  dateRange,
  onRangeChange,
  placeholder = 'Select date range',
  className,
  disabled = false,
  showPresets = true,
  formatStr = 'LLL dd, y',
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const presets = [
    { label: 'Today', range: { from: new Date(), to: new Date() } },
    {
      label: 'Yesterday',
      range: { from: subDays(new Date(), 1), to: subDays(new Date(), 1) },
    },
    {
      label: 'Last 7 days',
      range: { from: subDays(new Date(), 6), to: new Date() },
    },
    {
      label: 'Last 30 days',
      range: { from: subDays(new Date(), 29), to: new Date() },
    },
    {
      label: 'This Month',
      range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    },
    {
      label: 'Last Month',
      range: {
        from: startOfMonth(subMonths(new Date(), 1)),
        to: endOfMonth(subMonths(new Date(), 1)),
      },
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn('relative inline-flex w-full', className)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal pl-3 pr-8 rounded-xl h-10 border-input bg-background/50 hover:bg-accent/50 transition-all',
              !dateRange?.from && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground/80 shrink-0" />
            <span className="truncate">
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, formatStr)} - {format(dateRange.to, formatStr)}
                  </>
                ) : (
                  format(dateRange.from, formatStr)
                )
              ) : (
                placeholder
              )}
            </span>
          </Button>
        </PopoverTrigger>

        {dateRange?.from && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRangeChange?.(undefined);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Clear range"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <PopoverContent
        className="w-auto p-0 rounded-2xl shadow-xl border-border/80 flex flex-col sm:flex-row"
        align="start"
      >
        {showPresets && (
          <div className="flex flex-col gap-1 p-3 border-b sm:border-b-0 sm:border-r border-border/70 min-w-[140px] bg-muted/20">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
              Presets
            </span>
            {presets.map((preset) => {
              const isSelected =
                dateRange?.from &&
                dateRange?.to &&
                isSameDay(dateRange.from, preset.range.from) &&
                isSameDay(dateRange.to, preset.range.to);

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onRangeChange?.(preset.range);
                    setOpen(false);
                  }}
                  className={cn(
                    'text-left text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground',
                    isSelected &&
                      'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        )}
        <div className="p-1">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onRangeChange}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------
 * 3. Date of Birth Picker (DOB with Month & Year navigation)
 * ------------------------------------------------------------------------- */
export interface DateOfBirthPickerProps {
  date?: Date | null;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  fromYear?: number;
  toYear?: number;
  disabled?: boolean;
}

export function DateOfBirthPicker({
  date,
  onDateChange,
  placeholder = 'Select Date of Birth',
  className,
  fromYear = 1940,
  toYear = new Date().getFullYear(),
  disabled = false,
}: DateOfBirthPickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = date ? new Date(date) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn('relative inline-flex w-full', className)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal pl-3 pr-8 rounded-xl h-10 border-input bg-background/50 hover:bg-accent/50 transition-all',
              !selectedDate && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground/80 shrink-0" />
            <span className="truncate">
              {selectedDate ? format(selectedDate, 'dd MMMM yyyy') : placeholder}
            </span>
          </Button>
        </PopoverTrigger>

        {selectedDate && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDateChange?.(undefined);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Clear date"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-border/80" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          fromYear={fromYear}
          toYear={toYear}
          selected={selectedDate}
          onSelect={(d) => {
            onDateChange?.(d);
            setOpen(false);
          }}
          disabled={(d) => d > new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------
 * Default Demo Export
 * ------------------------------------------------------------------------- */
export function DatePickerDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  return (
    <div className="flex flex-col gap-4 p-4 max-w-sm">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">Single Date</label>
        <DatePicker date={date} onDateChange={setDate} />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">Date Range</label>
        <DateRangePicker dateRange={range} onRangeChange={setRange} />
      </div>
    </div>
  );
}

import React from 'react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  options: FilterOption[];
  selected: string;
  onChange: (val: string) => void;
  children?: React.ReactNode;
}

export const FilterBar = ({ options, selected, onChange, children }: FilterBarProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-2xl border border-border w-full text-left">
      <div className="flex flex-wrap items-center gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selected === opt.value
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm border border-transparent'
                : 'bg-card border border-border text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {children && <div className="flex items-center gap-3 w-full sm:w-auto">{children}</div>}
    </div>
  );
};

export const QuickFilter = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
        active
          ? 'bg-black text-white dark:bg-white dark:text-black border-transparent font-bold shadow-sm'
          : 'bg-card border-border text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900'
      }`}
    >
      {label}
    </button>
  );
};

import React, { useState, useMemo } from 'react';
import { getCountries, CountryCode } from 'libphonenumber-js';
import { ChevronDown, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { getCountryFlagEmoji, getCountryName } from './phone-input';

export interface CountrySelectOption {
  code: CountryCode;
  name: string;
  flag: string;
}

export interface CountrySelectProps {
  id?: string;
  value?: string;
  onChange?: (countryName: string, countryCode: CountryCode) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  id,
  value = 'India',
  onChange,
  disabled = false,
  className = '',
  placeholder = 'Select Country',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sorted countries with India at top
  const countries = useMemo<CountrySelectOption[]>(() => {
    const list: CountrySelectOption[] = getCountries().map((code) => ({
      code,
      name: getCountryName(code),
      flag: getCountryFlagEmoji(code),
    }));

    list.sort((a, b) => a.name.localeCompare(b.name));
    const inIdx = list.findIndex((c) => c.code === 'IN');
    if (inIdx > -1) {
      const [india] = list.splice(inIdx, 1);
      list.unshift(india);
    }
    return list;
  }, []);

  const selectedOption = useMemo(() => {
    if (!value) return countries[0];
    const valLower = value.toLowerCase().trim();
    return (
      countries.find(
        (c) => c.name.toLowerCase() === valLower || c.code.toLowerCase() === valLower,
      ) || countries[0]
    );
  }, [countries, value]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;
    const q = searchQuery.toLowerCase().trim();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [countries, searchQuery]);

  const handleSelect = (option: CountrySelectOption) => {
    setIsOpen(false);
    setSearchQuery('');
    if (onChange) {
      onChange(option.name, option.code);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={`w-full h-11 px-3 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-semibold flex items-center justify-between text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 ${className}`}
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-base leading-none">{selectedOption.flag}</span>
            <span className="truncate">{selectedOption.name}</span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 z-50">
        <div className="relative mb-2 px-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 dark:text-neutral-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
          />
        </div>
        <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
          {filteredCountries.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-neutral-500 p-3 text-center">
              No country found
            </p>
          ) : (
            filteredCountries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleSelect(c)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg text-left transition-colors ${
                  c.code === selectedOption.code
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-neutral-900 text-slate-900 dark:text-white'
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="truncate">{c.name}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

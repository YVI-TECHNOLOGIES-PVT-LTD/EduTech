import React, { useState, useMemo, useEffect } from 'react';
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  CountryCode,
} from 'libphonenumber-js';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { normalizePhoneNumber } from '@edutrack/validation';

// Helper to convert ISO 3166-1 alpha-2 country code to emoji flag
export function getCountryFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Get localized country name
const countryDisplayNames =
  typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

export function getCountryName(countryCode: CountryCode): string {
  try {
    return countryDisplayNames?.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
}

export interface CountryOption {
  code: CountryCode;
  name: string;
  callingCode: string;
  flag: string;
}

export interface PhoneInputProps {
  id?: string;
  name?: string;
  value?: string | null;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  defaultCountry?: CountryCode;
  'aria-invalid'?: boolean | 'true' | 'false';
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  id,
  name,
  value = '',
  onChange,
  onBlur,
  disabled = false,
  placeholder,
  className = '',
  defaultCountry = 'IN',
  'aria-invalid': ariaInvalid,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(defaultCountry);
  const [nationalNumber, setNationalNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Generate full country list sorted alphabetically with India at top
  const countries = useMemo<CountryOption[]>(() => {
    const list: CountryOption[] = getCountries().map((code) => ({
      code,
      name: getCountryName(code),
      callingCode: `+${getCountryCallingCode(code)}`,
      flag: getCountryFlagEmoji(code),
    }));

    list.sort((a, b) => a.name.localeCompare(b.name));
    // Move India to top for quick access
    const inIdx = list.findIndex((c) => c.code === 'IN');
    if (inIdx > -1) {
      const [india] = list.splice(inIdx, 1);
      list.unshift(india);
    }
    return list;
  }, []);

  // Filter countries by search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;
    const q = searchQuery.toLowerCase().trim();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.callingCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [countries, searchQuery]);

  // Sync internal state when external value changes
  useEffect(() => {
    const val = (value || '').trim();
    if (!val) {
      setNationalNumber('');
      return;
    }

    if (val.startsWith('+')) {
      const parsed = parsePhoneNumberFromString(val);
      if (parsed && parsed.country) {
        setSelectedCountry(parsed.country);
        setNationalNumber(parsed.nationalNumber);
        return;
      }
    }

    // Default to digits as national number
    setNationalNumber(val);
  }, [value]);

  const currentCountryOption = useMemo(() => {
    return (
      countries.find((c) => c.code === selectedCountry) ||
      countries.find((c) => c.code === 'IN') ||
      countries[0]
    );
  }, [countries, selectedCountry]);

  const handleCountrySelect = (countryCode: CountryCode) => {
    setSelectedCountry(countryCode);
    setIsOpen(false);
    setSearchQuery('');

    // Trigger update with existing national number under new country context
    emitChange(nationalNumber, countryCode);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    setNationalNumber(rawInput);
    emitChange(rawInput, selectedCountry);
  };

  const emitChange = (numberStr: string, country: CountryCode) => {
    if (!onChange) return;
    const cleanDigits = numberStr.trim();
    if (!cleanDigits) {
      onChange('');
      return;
    }

    const normalized = normalizePhoneNumber(cleanDigits, country);
    onChange(normalized || cleanDigits);
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      {/* Country Selector Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-11 px-3 bg-muted border border-border/80 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 select-none text-foreground hover:bg-muted/80"
            aria-label="Select country calling code"
          >
            <span className="text-base leading-none">{currentCountryOption.flag}</span>
            <span>{currentCountryOption.callingCode}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2 rounded-2xl shadow-xl border border-border bg-card z-50">
          {/* Search Box */}
          <div className="relative mb-2 px-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search country or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/60 border border-border/60 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          {/* Country List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
            {filteredCountries.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center">No country found</p>
            ) : (
              filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySelect(c.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors ${
                    c.code === selectedCountry
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="text-muted-foreground font-mono text-[11px] shrink-0 ml-2">
                    {c.callingCode}
                  </span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* National Number Input */}
      <Input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        disabled={disabled}
        value={nationalNumber}
        onChange={handleNumberChange}
        onBlur={onBlur}
        placeholder={placeholder || (selectedCountry === 'IN' ? '9876543210' : 'Mobile number')}
        aria-invalid={ariaInvalid}
        className="h-11 rounded-xl text-xs font-medium border-border/80 focus-visible:border-primary bg-card text-foreground flex-1"
      />
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Clock, Command, Building } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getNavigationForUser,
  searchNavigationItems,
  FlatNavigationItem,
} from '@/config/navigation';

const RECENT_SEARCHES_KEY = 'edutrack_recent_searches';
const MAX_RECENT = 5;

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function CommandPalette({ isOpen, onClose, className = '' }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<FlatNavigationItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Derive role-based navigation dynamically (Sole source of truth for searchable items)
  const userRoles = useMemo(() => {
    if (user?.roles && user.roles.length > 0) return user.roles;
    if ((user as any)?.role) return [(user as any).role];
    return ['ADMIN'];
  }, [user]);

  const navGroups = useMemo(() => getNavigationForUser(userRoles), [userRoles]);
  const results = useMemo(() => searchNavigationItems(navGroups, query), [navGroups, query]);

  // 2. Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed: FlatNavigationItem[] = JSON.parse(stored);
        const authorizedUrls = new Set(results.map((p) => p.url));
        const validRecent = parsed.filter((r) => authorizedUrls.has(r.url));
        setRecentSearches(validRecent);
      }
    } catch {
      /* noop */
    }
  }, [results]);

  // 3. Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const displayResults =
    query.trim().length === 0
      ? recentSearches.length > 0
        ? recentSearches
        : results.slice(0, 8)
      : results;

  // 4. Navigate to result
  const navigateTo = useCallback(
    (result: FlatNavigationItem) => {
      const updated = [
        {
          id: result.id,
          title: result.title,
          subtitle: result.subtitle,
          url: result.url,
          category: result.category,
        },
        ...recentSearches.filter((r) => r.url !== result.url),
      ].slice(0, MAX_RECENT);

      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        /* noop */
      }

      setRecentSearches(updated as FlatNavigationItem[]);
      navigate(result.url);
      onClose();
    },
    [navigate, onClose, recentSearches],
  );

  // Keyboard navigation for results
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < displayResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayResults[selectedIndex]) {
        navigateTo(displayResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`w-full bg-popover/95 backdrop-blur-2xl text-popover-foreground border border-border/80 rounded-[16px] shadow-2xl overflow-hidden ring-1 ring-border/50 ${className}`}
    >
      {/* Search Input Bar */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/70 bg-card/60">
        <Search className="w-4 h-4 text-primary shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          placeholder="Search accessible pages, modules, desks..."
          className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedIndex(0);
              inputRef.current?.focus();
            }}
            title="Clear search query"
            aria-label="Clear search query"
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer mr-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          title="Close search modal (Esc)"
          aria-label="Close search modal"
          className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer border border-border/50 hover:border-border/80"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Results List */}
      <div className="max-h-72 overflow-y-auto p-2 space-y-1">
        {displayResults.length === 0 && query.trim().length > 0 ? (
          <div className="py-8 text-center text-muted-foreground space-y-1">
            <p className="text-xs font-bold text-foreground">No accessible pages found</p>
            <p className="text-[10px] text-muted-foreground">
              No authorized navigation items match "{query}"
            </p>
          </div>
        ) : (
          displayResults.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const Icon = item.icon || Building;

            return (
              <button
                key={item.id + item.url}
                type="button"
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => navigateTo(item)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-[10px] text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                    : 'text-foreground hover:bg-muted/70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs truncate ${
                        isSelected
                          ? 'text-primary-foreground font-bold'
                          : 'text-foreground font-semibold'
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p
                        className={`text-[10px] truncate ${
                          isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <ArrowRight
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isSelected
                      ? 'text-primary-foreground translate-x-0.5'
                      : 'text-muted-foreground opacity-40'
                  } transition-transform`}
                />
              </button>
            );
          })
        )}
      </div>

      {/* Keyboard Shortcut Hints Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-t border-border/60 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-background rounded border border-border/70 text-[10px] font-mono shadow-2xs">
              ↑
            </kbd>
            <kbd className="px-1.5 py-0.5 bg-background rounded border border-border/70 text-[10px] font-mono shadow-2xs">
              ↓
            </kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-background rounded border border-border/70 text-[10px] font-mono shadow-2xs">
              ↵
            </kbd>
            <span>Select</span>
          </span>
        </div>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-background rounded border border-border/70 text-[10px] font-mono shadow-2xs">
            ESC
          </kbd>
          <span>Close</span>
        </span>
      </div>
    </div>
  );
}

export default CommandPalette;

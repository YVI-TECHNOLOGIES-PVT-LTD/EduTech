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
    return ['PARENT'];
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

  if (!isOpen) return null;

  return (
    <div
      className={`w-full bg-card text-card-foreground border border-border rounded-2xl shadow-xl overflow-hidden ${className}`}
    >
      {/* Search Input Bar */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-card">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          placeholder="Search accessible pages, modules, desks..."
          className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSelectedIndex(0);
              inputRef.current?.focus();
            }}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs'
                    : 'text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white text-black dark:bg-black dark:text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs truncate ${isSelected ? 'text-white dark:text-black font-bold' : 'text-foreground font-semibold'}`}
                    >
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p
                        className={`text-[10px] truncate ${
                          isSelected ? 'text-white/80 dark:text-black/80' : 'text-muted-foreground'
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
                      ? 'text-white dark:text-black translate-x-0.5'
                      : 'text-muted-foreground opacity-40'
                  } transition-transform`}
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CommandPalette;

import { useEffect, useCallback } from 'react';

/**
 * Global Ctrl+K / Cmd+K focus hook for navbar navigation search.
 * Focuses the inline navbar search input directly without opening a modal.
 */
export const useCommandPalette = () => {
  const focusSearch = useCallback(() => {
    const input = document.getElementById('navbar-search-input') as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K (Windows/Linux) or Cmd+K (Mac)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        focusSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusSearch]);

  return { focusSearch, open: focusSearch };
};

import { useEffect } from 'react';

/**
 * Custom React hook for registering keyboard shortcuts.
 * Automatically checks modifier keys (Ctrl, Shift, Alt, Meta).
 */
export const useKeyboardShortcut = (
    keys: string[],
    callback: (e: KeyboardEvent) => void
) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const matches = keys.every(key => {
                if (key === 'ctrl') return e.ctrlKey || e.metaKey;
                if (key === 'shift') return e.shiftKey;
                if (key === 'alt') return e.altKey;
                return e.key.toLowerCase() === key.toLowerCase();
            });

            if (matches) {
                e.preventDefault();
                callback(e);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [keys, callback]);
};
export default useKeyboardShortcut;

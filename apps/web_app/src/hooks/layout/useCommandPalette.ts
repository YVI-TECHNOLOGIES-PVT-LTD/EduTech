import { useState, useEffect } from 'react';

/**
 * Global Ctrl+K / Cmd+K command palette toggle hook.
 * Use this in DashboardLayout to open/close the CommandPalette.
 */
export const useCommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen(v => !v);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+K (Windows/Linux) or Cmd+K (Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                toggle();
            }
            // Escape closes
            if (e.key === 'Escape' && isOpen) {
                close();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    return { isOpen, open, close, toggle };
};

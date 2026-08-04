import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command } from 'lucide-react';
import { SearchPanel } from './SearchPanel';
import { useGlobalSearch } from './useGlobalSearch';

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');
    const inputRef = useRef<HTMLInputElement>(null);
    const { results, loading, search } = useGlobalSearch();

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setCategory('all');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        if (query.trim().length >= 2) {
            const timer = setTimeout(() => search(query, category), 300);
            return () => clearTimeout(timer);
        }
    }, [query, category, search]);

    const handleSelect = useCallback(
        (href: string, label: string) => {
            navigate(href);
            onClose();
        },
        [navigate, onClose],
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
                    >
                        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                                <Search className="w-5 h-5 text-muted-foreground" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search admissions, students, faculty, finance..."
                                    className="flex-1 bg-transparent text-sm focus:outline-none"
                                    onKeyDown={e => e.key === 'Escape' && onClose()}
                                />
                                <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-[10px] font-bold text-muted-foreground">
                                    <Command className="w-3 h-3" /> ESC
                                </kbd>
                                <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <SearchPanel
                                query={query}
                                category={category}
                                onCategoryChange={setCategory}
                                results={results}
                                loading={loading}
                                onSelect={handleSelect}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

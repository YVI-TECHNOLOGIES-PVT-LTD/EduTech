import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, X, CornerDownLeft } from 'lucide-react';
import { useDashboardSearch } from '../../hooks/useDashboardSearch';

export const DashboardSearch: React.FC = () => {
    const navigate = useNavigate();
    const { searchTerm, setSearchTerm, results, isLoading } = useDashboardSearch();
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIdx, setFocusedIdx] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Escape listener and click outside list handling
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setFocusedIdx(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Arrow navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIdx(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIdx(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            if (focusedIdx >= 0 && focusedIdx < results.length) {
                e.preventDefault();
                handleSelect(results[focusedIdx]);
            }
        }
    };

    const handleSelect = (item: any) => {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIdx(-1);
        navigate(item.link);
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-xl mx-auto z-30">
            <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                        setFocusedIdx(-1);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search students, admissions profiles..."
                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-solid border-border bg-white dark:bg-card text-sm font-semibold shadow-premium-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                />
                <div className="absolute right-4 top-3.5 flex items-center gap-2">
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : searchTerm ? (
                        <button 
                            onClick={() => {
                                setSearchTerm('');
                                setFocusedIdx(-1);
                            }}
                            className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Floating results modal popup */}
            {isOpen && searchTerm.trim().length >= 2 && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-card border border-border/60 rounded-2xl shadow-premium-md overflow-hidden max-h-80 overflow-y-auto">
                    {results.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground font-semibold">
                            No records matching "{searchTerm}" found.
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            <div className="px-3 py-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest border-b border-border/20">
                                Match Results
                            </div>
                            {results.map((item, idx) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    onMouseEnter={() => setFocusedIdx(idx)}
                                    className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-4 transition-colors ${
                                        focusedIdx === idx 
                                            ? 'bg-primary/5 dark:bg-primary/10 text-primary' 
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                                                {item.type}
                                            </span>
                                            <span className="text-xs font-black truncate">
                                                {item.title}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold truncate">
                                            {item.subtitle}
                                        </p>
                                    </div>
                                    {focusedIdx === idx && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-primary shrink-0">
                                            <span>Select</span>
                                            <CornerDownLeft className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardSearch;

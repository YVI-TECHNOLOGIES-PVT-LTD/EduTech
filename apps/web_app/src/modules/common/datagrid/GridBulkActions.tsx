import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/button';

interface GridBulkActionsProps<T> {
    selectedCount: number;
    actions: { label: string; onClick: (rows: T[]) => void | Promise<void> }[];
    selectedRows: T[];
}

export function GridBulkActions<T>({ selectedCount, actions, selectedRows }: GridBulkActionsProps<T>) {
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <AnimatePresence>
                {selectedCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        className="flex items-center gap-3 bg-gray-900 text-white px-5 py-2.5 rounded-2xl shadow-xl border border-gray-800 pointer-events-auto"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                            {selectedCount} Selected
                        </span>
                        <div className="h-4 w-px bg-white/20" />
                        <div className="flex gap-1.5">
                            {actions.map(action => (
                                <Button
                                    key={action.label}
                                    onClick={() => action.onClick(selectedRows)}
                                    size="sm"
                                    className="h-8 py-1 px-3 text-xs"
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

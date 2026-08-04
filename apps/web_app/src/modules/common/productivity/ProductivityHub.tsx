import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { MyTasks } from './MyTasks';
import { Notes } from './Notes';
import { Bookmarks } from './Bookmarks';
import { RecentRecords } from './RecentRecords';
import { PinnedItems } from './PinnedItems';
import { CalendarPanel } from './CalendarPanel';
import { ReminderPanel } from './ReminderPanel';

interface ProductivityHubProps {
    isOpen: boolean;
    onClose: () => void;
    modulePrefix?: string;
}

type Tab = 'tasks' | 'notes' | 'bookmarks' | 'recents' | 'calendar';

export function ProductivityHub({ isOpen, onClose, modulePrefix = 'erp' }: ProductivityHubProps) {
    const [activeTab, setActiveTab] = useState<Tab>('tasks');

    const tabs: { id: Tab; label: string }[] = [
        { id: 'tasks', label: 'Tasks' },
        { id: 'notes', label: 'Notes' },
        { id: 'bookmarks', label: 'Bookmarks' },
        { id: 'recents', label: 'Recent' },
        { id: 'calendar', label: 'Calendar' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-40"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-screen w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col"
                    >
                        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                <span className="font-black text-sm uppercase tracking-wider">Productivity Hub</span>
                            </div>
                            <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 border-b border-border">
                            <PinnedItems storageKey={`${modulePrefix}_pinned_items`} />
                        </div>

                        <div className="flex border-b border-border text-xs overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 min-w-[60px] py-3 font-bold border-b-2 capitalize ${
                                        activeTab === tab.id
                                            ? 'border-primary text-primary bg-primary/5'
                                            : 'border-transparent text-muted-foreground'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {activeTab === 'tasks' && <MyTasks storageKey={`${modulePrefix}_tasks`} />}
                            {activeTab === 'notes' && <Notes storageKey={`${modulePrefix}_notes`} />}
                            {activeTab === 'bookmarks' && <Bookmarks storageKey={`${modulePrefix}_bookmarks`} />}
                            {activeTab === 'recents' && <RecentRecords storageKey={`${modulePrefix}_recent_records`} />}
                            {activeTab === 'calendar' && (
                                <div className="space-y-4">
                                    <CalendarPanel />
                                    <ReminderPanel storageKey={`${modulePrefix}_reminders`} />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Pin, CheckSquare, Calendar, Bell, FileText,
    Bookmark, Star, Sparkles, X, ChevronRight, Play, Check, Trash
} from 'lucide-react';

interface ProductivityPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProductivityPanel({ isOpen, onClose }: ProductivityPanelProps) {
    const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'recents'>('tasks');
    
    // Quick Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Local Storage Note State
    const [note, setNote] = useState(() => localStorage.getItem('admission_quick_note') || '');
    useEffect(() => {
        localStorage.setItem('admission_quick_note', note);
    }, [note]);

    // Local Storage Tasks State
    const [tasks, setTasks] = useState<{ id: string; text: string; done: boolean }[]>(() => {
        const saved = localStorage.getItem('admission_tasks');
        return saved ? JSON.parse(saved) : [
            { id: '1', text: 'Call Amit Verma regarding document re-upload', done: false },
            { id: '2', text: 'Verify Grade 11 fee receipt for Rohan Sharma', done: true },
            { id: '3', text: 'Approve draft offer letters batch', done: false }
        ];
    });

    useEffect(() => {
        localStorage.setItem('admission_tasks', JSON.stringify(tasks));
    }, [tasks]);

    const [newTaskText, setNewTaskText] = useState('');
    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        setTasks(prev => [...prev, { id: Date.now().toString(), text: newTaskText, done: false }]);
        setNewTaskText('');
    };

    const toggleTask = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const deleteTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-40"
                    />

                    {/* Sliding Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-screen w-96 bg-white dark:bg-card border-l border-border shadow-2xl z-50 flex flex-col font-sans text-gray-700 dark:text-gray-200"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border/80 flex items-center justify-between bg-gray-50/50 dark:bg-muted/10">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                                <span className="font-black text-sm uppercase tracking-wider text-gray-900 dark:text-gray-100">Admissions Assistant</span>
                            </div>
                            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Search and Shortcuts */}
                        <div className="p-4 border-b border-border/60 space-y-3">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Search className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Quick search CRM records..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50/60 dark:bg-muted/20 border border-border text-xs rounded-xl focus:outline-none focus:border-primary transition-all"
                                />
                            </div>

                            {/* Pinned & Bookmarks */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-black uppercase text-gray-400 mr-1.5">Pinned:</span>
                                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold cursor-pointer hover:bg-indigo-100 flex items-center gap-1">
                                    <Pin className="w-3 h-3" /> Rohan (Grade 11)
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold cursor-pointer hover:bg-indigo-100 flex items-center gap-1">
                                    <Pin className="w-3 h-3" /> Amit (Grade 5)
                                </span>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-border/60 text-xs">
                            {(['tasks', 'notes', 'recents'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-3 text-center font-bold border-b-2 capitalize transition-colors ${
                                        activeTab === tab
                                            ? 'border-primary text-primary bg-primary/5'
                                            : 'border-transparent text-gray-400 hover:text-gray-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                            {/* Tasks View */}
                            {activeTab === 'tasks' && (
                                <div className="space-y-4">
                                    <form onSubmit={handleAddTask} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add callback reminder..."
                                            value={newTaskText}
                                            onChange={e => setNewTaskText(e.target.value)}
                                            className="flex-1 px-3 py-1.5 border border-border text-xs rounded-xl focus:outline-none focus:border-primary"
                                        />
                                        <button type="submit" className="px-3.5 py-1.5 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/95">
                                            Add
                                        </button>
                                    </form>

                                    <div className="space-y-2.5">
                                        {tasks.map(task => (
                                            <div
                                                key={task.id}
                                                className={`p-3 rounded-xl border border-solid flex items-center justify-between text-xs transition-colors ${
                                                    task.done ? 'bg-gray-50 border-gray-100 text-gray-400' : 'bg-white border-border text-gray-800'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <button
                                                        onClick={() => toggleTask(task.id)}
                                                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                            task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        {task.done && <Check className="w-2.5 h-2.5" />}
                                                    </button>
                                                    <span className={task.done ? 'line-through font-medium' : 'font-bold'}>{task.text}</span>
                                                </div>
                                                <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-rose-500">
                                                    <Trash className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick Notes View */}
                            {activeTab === 'notes' && (
                                <div className="h-full flex flex-col space-y-2">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Scratchpad notes (Saved automatically)</p>
                                    <textarea
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="Jot down candidate info, phone call details, or meeting comments..."
                                        className="w-full flex-1 min-h-[300px] p-3 border border-border text-xs rounded-xl focus:outline-none focus:border-primary resize-none font-medium leading-relaxed"
                                    />
                                </div>
                            )}

                            {/* Recent Activity Logs */}
                            {activeTab === 'recents' && (
                                <div className="space-y-3.5">
                                    {[
                                        { action: 'Updated status Rohan', role: 'Counselor', time: '10 mins ago' },
                                        { action: 'Uploaded checklist Grade 1', role: 'Receptionist', time: '35 mins ago' },
                                        { action: 'Approved merit list Grade 11', role: 'Principal', time: '1 hour ago' }
                                    ].map((act, i) => (
                                        <div key={i} className="flex gap-2.5 text-xs">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                                            <div>
                                                <p className="font-bold text-gray-800">{act.action}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">{act.role} • {act.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Shortcuts */}
                        <div className="p-4 border-t border-border/80 bg-gray-50/50 dark:bg-muted/10 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                            Press ESC to close assistant
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default ProductivityPanel;

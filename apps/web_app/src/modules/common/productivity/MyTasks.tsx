import React from 'react';
import { Check, Trash, Plus } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { ProductivityTask } from '../types';

interface MyTasksProps {
    storageKey?: string;
}

export function MyTasks({ storageKey = 'erp_productivity_tasks' }: MyTasksProps) {
    const [tasks, setTasks] = useLocalStorage<ProductivityTask[]>(storageKey, []);
    const [newText, setNewText] = React.useState('');

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newText.trim()) return;
        setTasks(prev => [...prev, { id: Date.now().toString(), text: newText.trim(), done: false }]);
        setNewText('');
    };

    return (
        <div className="space-y-3">
            <form onSubmit={addTask} className="flex gap-2">
                <input
                    type="text"
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    placeholder="Add task..."
                    className="flex-1 px-3 py-2 border border-border rounded-xl text-xs"
                />
                <button type="submit" className="px-3 py-2 bg-primary text-primary-foreground rounded-xl">
                    <Plus className="w-4 h-4" />
                </button>
            </form>
            <div className="space-y-2">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                            task.done ? 'bg-muted/30 text-muted-foreground line-through' : 'bg-card border-border'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setTasks(prev =>
                                        prev.map(t => (t.id === task.id ? { ...t, done: !t.done } : t)),
                                    )
                                }
                                className={`w-4 h-4 rounded border flex items-center justify-center ${
                                    task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border'
                                }`}
                            >
                                {task.done && <Check className="w-2.5 h-2.5" />}
                            </button>
                            {task.text}
                        </div>
                        <button type="button" onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))}>
                            <Trash className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

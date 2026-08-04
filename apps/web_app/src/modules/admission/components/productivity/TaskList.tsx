import React from 'react';
import { Check, Trash, AlertCircle, Phone, FileSignature } from 'lucide-react';

export interface TaskItem {
    id: string;
    text: string;
    done: boolean;
    dueDate?: string;
    type?: 'callback' | 'document' | 'general';
}

interface TaskListProps {
    tasks: TaskItem[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

export function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No pending reminders</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {tasks.map(task => {
                const isCallback = task.type === 'callback';
                const isDoc = task.type === 'document';

                return (
                    <div
                        key={task.id}
                        className={`p-3 rounded-xl border border-solid flex items-center justify-between text-xs transition-colors duration-200 ${
                            task.done 
                                ? 'bg-gray-50 border-gray-100 text-gray-400' 
                                : 'bg-white border-gray-100 shadow-sm hover:border-indigo-150 text-gray-800'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onToggle(task.id)}
                                className={`w-4 h-4 rounded-lg border flex items-center justify-center transition-colors ${
                                    task.done 
                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                        : 'border-gray-300 bg-white hover:border-indigo-500'
                                }`}
                            >
                                {task.done && <Check className="w-2.5 h-2.5" />}
                            </button>
                            
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                    {isCallback && <Phone className="w-3.5 h-3.5 text-indigo-500" />}
                                    {isDoc && <FileSignature className="w-3.5 h-3.5 text-amber-500" />}
                                    <span className={`font-bold ${task.done ? 'line-through' : ''}`}>
                                        {task.text}
                                    </span>
                                </div>
                                {task.dueDate && (
                                    <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
                                        Due: {task.dueDate}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={() => onDelete(task.id)} 
                            className="text-gray-400 hover:text-rose-500 p-1 rounded-lg hover:bg-gray-50"
                        >
                            <Trash className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export default TaskList;

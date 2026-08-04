import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { WorkQueueCard } from './WorkQueueCard';
import { QueueFilters } from './QueueFilters';
import { QueueToolbar } from './QueueToolbar';
import { QueueLoading } from './QueueLoading';
import { QueueEmptyState } from './QueueEmptyState';

export const WorkQueue: React.FC = () => {
    const { tasks, loading } = useDashboard();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('due_asc');

    // Group counts for filters list
    const filterTabs = useMemo(() => {
        const counts = {
            all: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
        };

        return [
            { id: 'all', label: 'All Tasks', count: counts.all },
            { id: 'pending', label: 'Pending', count: counts.pending },
            { id: 'in_progress', label: 'Active', count: counts.in_progress },
            { id: 'completed', label: 'Done', count: counts.completed },
        ];
    }, [tasks]);

    // Apply sorting & filtering
    const processedTasks = useMemo(() => {
        let items = [...tasks];

        // 1. Filter status
        if (filter !== 'all') {
            items = items.filter(t => t.status === filter);
        }

        // 2. Search query filter
        if (search.trim()) {
            const query = search.toLowerCase();
            items = items.filter(t => 
                t.title.toLowerCase().includes(query) || 
                t.description?.toLowerCase().includes(query) ||
                t.entityType?.toLowerCase().includes(query)
            );
        }

        // 3. Sort logic
        items.sort((a, b) => {
            if (sortBy === 'due_asc') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            if (sortBy === 'due_desc') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
            }
            if (sortBy === 'priority_desc') {
                const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
                return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
            }
            // created_desc
            return b.id.localeCompare(a.id);
        });

        return items;
    }, [tasks, filter, search, sortBy]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-6 w-32 bg-gray-100 rounded animate-pulse"></div>
                <QueueLoading />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm space-y-4">
            <div className="flex flex-col gap-4">
                <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Operational Workspace Queue
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">
                        Action items allocated to your queues based on current workflows
                    </p>
                </div>

                <QueueToolbar
                    search={search}
                    onSearchChange={setSearch}
                    sortBy={sortBy}
                    onSortByChange={setSortBy}
                />

                <QueueFilters
                    currentFilter={filter}
                    onFilterChange={setFilter}
                    filters={filterTabs}
                />
            </div>

            <div className="space-y-3 pt-2">
                {processedTasks.length === 0 ? (
                    <QueueEmptyState />
                ) : (
                    processedTasks.map(task => (
                        <WorkQueueCard key={task.id} task={task} />
                    ))
                )}
            </div>
        </div>
    );
};

export default WorkQueue;

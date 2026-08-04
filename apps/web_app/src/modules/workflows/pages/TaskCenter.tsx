import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Clock, CheckCircle, ShieldAlert, Award, FileText, Send, Paperclip,
    AlertTriangle, Sparkles, MessageSquare, Plus, CheckCircle2, UserCheck
} from 'lucide-react';
import { PageWrapper } from '../../../components/layout/PageWrapper';

export const TaskCenter = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'my' | 'dept' | 'approvals' | 'overdue'>('my');
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [commentText, setCommentText] = useState('');

    const loadTasks = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/v1/tasks');
            setTasks(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleComplete = async (taskId: string) => {
        try {
            await apiClient.post(`/v1/tasks/${taskId}/complete`);
            alert("Task marked completed successfully!");
            loadTasks();
            setSelectedTask(null);
        } catch (e) {
            alert("Failed to complete task");
        }
    };

    const handlePostComment = async () => {
        if (!commentText.trim() || !selectedTask) return;
        try {
            const res = await apiClient.post(`/v1/tasks/${selectedTask.id}/comments`, { comment: commentText });
            setSelectedTask({
                ...selectedTask,
                comments: [...(selectedTask.comments || []), res.data]
            });
            setCommentText('');
            loadTasks();
        } catch (e) {
            alert("Failed to post comment");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Tasks Workspace...</p>
        </div>
    );

    // Dynamic categorizations
    const myTasks = tasks.filter(t => t.assigned_to && t.status === 'pending');
    const deptQueue = tasks.filter(t => !t.assigned_to && t.status === 'pending');
    const approvals = tasks.filter(t => t.title.toLowerCase().includes('approval') && t.status === 'pending');
    const overdue = tasks.filter(t => t.due_at && new Date(t.due_at).getTime() < Date.now() && t.status === 'pending');

    const activeList = {
        my: myTasks,
        dept: deptQueue,
        approvals: approvals,
        overdue: overdue
    }[tab] || [];

    return (
        <PageWrapper
            title="Task Workspace Center"
            description="Collaborate, complete workflow sign-offs, and track outstanding compliance duties."
            icon={Sparkles}
            timeline={
                <div className="space-y-6">
                    {selectedTask ? (
                        <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm space-y-6">
                            <div>
                                <h3 className="font-black text-sm text-gray-900 dark:text-white leading-tight">{selectedTask.title}</h3>
                                <p className="text-xs text-muted-foreground mt-2">{selectedTask.description}</p>
                            </div>

                            {/* Completion option */}
                            {selectedTask.status === 'pending' && (
                                <button
                                    onClick={() => handleComplete(selectedTask.id)}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl shadow-premium-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> Mark Complete
                                </button>
                            )}

                            {/* Comments board */}
                            <div className="border-t border-border/40 pt-4 space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <MessageSquare className="w-4 h-4 text-primary" /> Comments Activity
                                </h4>
                                <div className="space-y-3 max-h-44 overflow-y-auto pr-1">
                                    {selectedTask.comments?.map((c: any, i: number) => (
                                        <div key={i} className="p-3 bg-gray-50/50 dark:bg-muted/5 border border-border/30 rounded-xl">
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{c.comment}</p>
                                            <span className="text-[9px] text-muted-foreground mt-1 block">Comment log</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        placeholder="Add comment..."
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        className="flex-1 bg-gray-50 dark:bg-muted/10 border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none"
                                    />
                                    <button
                                        onClick={handlePostComment}
                                        className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-premium-sm"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-8 text-center text-muted-foreground shadow-premium-sm">
                            <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-xs font-bold italic">Select a task card to open workspace panel.</p>
                        </div>
                    )}
                </div>
            }
        >
            <div className="space-y-6 lg:space-y-8">
                {/* Segments toggle navigation */}
                <div className="flex bg-gray-50/50 dark:bg-muted/10 p-1.5 rounded-2xl border border-border/40 justify-start gap-1">
                    {[
                        { key: 'my', label: 'My Tasks', count: myTasks.length },
                        { key: 'dept', label: 'Dept Queue', count: deptQueue.length },
                        { key: 'approvals', label: 'Approvals', count: approvals.length },
                        { key: 'overdue', label: 'Overdue', count: overdue.length }
                    ].map(item => (
                        <button
                            key={item.key}
                            onClick={() => setTab(item.key as any)}
                            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                tab === item.key
                                    ? 'bg-white dark:bg-card border border-border/40 shadow-premium-sm text-primary'
                                    : 'text-muted-foreground border border-transparent hover:text-foreground'
                            }`}
                        >
                            <span>{item.label}</span>
                            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-lg">{item.count}</span>
                        </button>
                    ))}
                </div>

                {/* Queue Cards list */}
                <div className="space-y-3">
                    {activeList.length === 0 ? (
                        <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-12 text-center shadow-premium-sm">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 animate-pulse" />
                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">All Clear!</h3>
                            <p className="text-xs text-muted-foreground mt-1">No outstanding tasks in this queue segment.</p>
                        </div>
                    ) : (
                        activeList.map((t) => {
                            const isOverdue = t.due_at && new Date(t.due_at).getTime() < Date.now();
                            return (
                                <div
                                    key={t.id}
                                    onClick={() => setSelectedTask(t)}
                                    className={`p-5 bg-white dark:bg-card border rounded-3xl cursor-pointer hover:shadow-premium-md hover:border-primary/20 transition-all flex justify-between items-start gap-4 ${
                                        selectedTask?.id === t.id ? 'border-primary shadow-premium-sm ring-2 ring-primary/10' : 'border-border/40 shadow-premium-sm'
                                    }`}
                                >
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                t.priority === 'critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                t.priority === 'high' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                            }`}>
                                                {t.priority}
                                            </span>
                                            {t.assigned_role && (
                                                <span className="px-2 py-0.5 bg-gray-50/50 dark:bg-muted/10 border border-border/40 rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                    {t.assigned_role}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xs font-black text-gray-900 dark:text-white leading-tight">{t.title}</h3>
                                        <p className="text-[10px] text-muted-foreground font-semibold line-clamp-1">{t.description}</p>
                                    </div>
                                    <div className="text-right shrink-0 flex flex-col items-end gap-2.5">
                                        {isOverdue && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                                            </span>
                                        )}
                                        <span className="text-[9px] text-muted-foreground font-semibold">Created: {new Date(t.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};
export default TaskCenter;

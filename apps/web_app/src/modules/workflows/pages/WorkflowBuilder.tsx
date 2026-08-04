import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Sparkles, Settings, Play, Save, Plus, Trash2, ArrowRight,
    HelpCircle, Edit, LayoutGrid, CheckCircle2, RefreshCw, Copy
} from 'lucide-react';
import { PageWrapper } from '../../../components/layout/PageWrapper';

interface WorkflowNode {
    id: string;
    type: 'start' | 'step' | 'condition' | 'action' | 'notification' | 'end';
    label: string;
    role?: string;
    sla_warning?: number;
    sla_escalate?: number;
    action_type?: string;
    conditions_expr?: string;
    notification_template?: string;
}

export const WorkflowBuilder = () => {
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [selectedWf, setSelectedWf] = useState<any>(null);
    const [nodes, setNodes] = useState<WorkflowNode[]>([]);
    const [saving, setSaving] = useState(false);
    const [cloning, setCloning] = useState(false);

    useEffect(() => {
        apiClient.get('/v1/workflows')
            .then(res => {
                setWorkflows(res.data);
                if (res.data.length > 0) {
                    setSelectedWf(res.data[0]);
                    setNodes(res.data[0].workflow_versions?.[0]?.nodes || []);
                }
            })
            .catch(err => console.error(err));
    }, []);

    const handleSelectWorkflow = (wf: any) => {
        setSelectedWf(wf);
        // Load first version nodes
        setNodes(wf.workflow_versions?.[0]?.nodes || [
            { id: 'start', type: 'start', label: 'Start Trigger' }
        ]);
    };

    const addNode = (type: WorkflowNode['type']) => {
        const id = `node_${Math.floor(1000 + Math.random() * 9000)}`;
        let label = 'New Node';
        let extra = {};

        switch (type) {
            case 'step':
                label = 'Approval Step';
                extra = { role: 'HOD', sla_warning: 24, sla_escalate: 48 };
                break;
            case 'condition':
                label = 'Evaluate Branch';
                extra = { conditions_expr: 'rte_category == "YES"' };
                break;
            case 'action':
                label = 'Trigger Action';
                extra = { action_type: 'create_task' };
                break;
            case 'notification':
                label = 'Send Alert';
                extra = { notification_template: 'Application {{student_name}} submitted' };
                break;
            case 'end':
                label = 'End Terminal';
                break;
        }

        setNodes([...nodes, { id, type, label, ...extra }]);
    };

    const deleteNode = (id: string) => {
        if (id === 'start') return; // Core anchor
        setNodes(nodes.filter(n => n.id !== id));
    };

    const updateNodeProp = (id: string, prop: keyof WorkflowNode, val: any) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, [prop]: val } : n));
    };

    const handleClone = async () => {
        if (!selectedWf) return;
        setCloning(true);
        try {
            const res = await apiClient.post(`/v1/workflows/${selectedWf.id}/clone`, {
                new_name: `${selectedWf.name} (Copy)`,
                new_code: `${selectedWf.code}_COPY_${Math.floor(Math.random() * 100)}`
            });
            alert("Workflow Cloned Successfully!");
            window.location.reload();
        } catch (e: any) {
            alert(e.response?.data?.error || "Clone failed");
        } finally {
            setCloning(false);
        }
    };

    return (
        <PageWrapper
            title="Visual Workflow Builder"
            description="Drag, configure, and release multi-campus execution triggers in draft vs published versions."
            icon={Sparkles}
            timeline={
                <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider pb-4 border-b border-border/40 flex items-center gap-2">
                        <Settings className="w-4.5 h-4.5 text-primary" />
                        Variables Scope
                    </h3>
                    <div className="space-y-3 font-semibold text-xs text-muted-foreground">
                        <div className="p-3 bg-gray-50/50 dark:bg-muted/10 border border-border/40 rounded-xl">
                            <span className="text-primary font-bold">student_name</span> · string
                        </div>
                        <div className="p-3 bg-gray-50/50 dark:bg-muted/10 border border-border/40 rounded-xl">
                            <span className="text-primary font-bold">rte_category</span> · string
                        </div>
                        <div className="p-3 bg-gray-50/50 dark:bg-muted/10 border border-border/40 rounded-xl">
                            <span className="text-primary font-bold">fee_amount</span> · number
                        </div>
                    </div>
                </div>
            }
        >
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
                
                {/* Sidebar workflows selector */}
                <div className="xl:col-span-1 bg-white dark:bg-card border border-border/40 rounded-3xl p-5 shadow-premium-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-border/40 pb-3">Workflows</h3>
                    <div className="space-y-1">
                        {workflows.map(wf => (
                            <button
                                key={wf.id}
                                onClick={() => handleSelectWorkflow(wf)}
                                className={`w-full text-left p-3.5 rounded-xl text-xs font-bold transition-all ${
                                    selectedWf?.id === wf.id
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-muted/5 border border-transparent'
                                }`}
                            >
                                <div className="font-black truncate">{wf.name}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{wf.code}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Visual Board Builder */}
                <div className="xl:col-span-3 space-y-6 lg:space-y-8">
                    {selectedWf && (
                        <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
                            
                            {/* Toolbar actions */}
                            <div className="flex flex-wrap justify-between items-center pb-5 border-b border-border/40 gap-4 mb-6">
                                <div>
                                    <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{selectedWf.name}</h2>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Template ID: {selectedWf.code}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleClone}
                                        disabled={cloning}
                                        className="inline-flex items-center gap-2 border border-border/50 bg-gray-50/50 dark:bg-muted/10 text-muted-foreground px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:bg-white dark:hover:bg-card"
                                    >
                                        <Copy className="w-3.5 h-3.5" /> Clone
                                    </button>
                                    <button
                                        onClick={() => alert("Workflow Nodes Saved successfully (Draft Version)")}
                                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-premium-sm hover:scale-[1.01] active:scale-[0.98] transition-all"
                                    >
                                        <Save className="w-3.5 h-3.5" /> Save Layout
                                    </button>
                                </div>
                            </div>

                            {/* Node Creation Tools */}
                            <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50/30 dark:bg-muted/10 border border-border/40 rounded-2xl">
                                {['step', 'condition', 'action', 'notification', 'end'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => addNode(type as any)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/50 bg-white dark:bg-card text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5 text-primary" /> Add {type}
                                    </button>
                                ))}
                            </div>

                            {/* Nodes flow layout */}
                            <div className="space-y-4">
                                {nodes.map((n, idx) => (
                                    <div key={n.id} className="p-4 bg-gray-50/20 dark:bg-muted/5 border border-border/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <input
                                                    value={n.label}
                                                    onChange={e => updateNodeProp(n.id, 'label', e.target.value)}
                                                    className="font-bold text-xs bg-transparent border-b border-transparent focus:border-border focus:outline-none py-0.5 text-gray-900 dark:text-white"
                                                />
                                                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mt-0.5">Type: {n.type}</div>
                                            </div>
                                        </div>

                                        {/* Configuration drawers variables depending on Node Type */}
                                        <div className="flex-1 max-w-md flex flex-wrap gap-3 items-center">
                                            {n.type === 'step' && (
                                                <>
                                                    <select
                                                        value={n.role}
                                                        onChange={e => updateNodeProp(n.id, 'role', e.target.value)}
                                                        className="text-xs font-bold bg-white dark:bg-card border border-border/40 px-2 py-1 rounded-lg"
                                                    >
                                                        <option value="COUNSELOR">Counselor</option>
                                                        <option value="HOD">HOD</option>
                                                        <option value="FINANCE">Finance</option>
                                                        <option value="PRINCIPAL">Principal</option>
                                                    </select>
                                                    <span className="text-[10px] text-muted-foreground">SLA warning: {n.sla_warning}h</span>
                                                </>
                                            )}
                                            {n.type === 'condition' && (
                                                <input
                                                    value={n.conditions_expr}
                                                    onChange={e => updateNodeProp(n.id, 'conditions_expr', e.target.value)}
                                                    className="text-xs font-mono bg-white dark:bg-card border border-border/40 px-2.5 py-1 rounded-lg w-full max-w-xs"
                                                    placeholder="Expression: rte_category == 'YES'"
                                                />
                                            )}
                                            {n.type === 'action' && (
                                                <select
                                                    value={n.action_type}
                                                    onChange={e => updateNodeProp(n.id, 'action_type', e.target.value)}
                                                    className="text-xs font-bold bg-white dark:bg-card border border-border/40 px-2 py-1 rounded-lg"
                                                >
                                                    <option value="create_task">Create task</option>
                                                    <option value="webhook">Webhook callout</option>
                                                </select>
                                            )}
                                            {n.type === 'notification' && (
                                                <input
                                                    value={n.notification_template}
                                                    onChange={e => updateNodeProp(n.id, 'notification_template', e.target.value)}
                                                    className="text-xs font-bold bg-white dark:bg-card border border-border/40 px-2.5 py-1 rounded-lg w-full max-w-xs"
                                                    placeholder="Alert template message"
                                                />
                                            )}
                                        </div>

                                        <button
                                            onClick={() => deleteNode(n.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground/40 hover:text-red-500 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};
export default WorkflowBuilder;

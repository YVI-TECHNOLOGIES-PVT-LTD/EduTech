import React from 'react';
import { WorkflowStepCard } from './WorkflowStepCard';
import { WorkflowStep, WorkflowTransition } from '../services/assessment.api';
import { Plus, ArrowRight, Play, CheckCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

interface WorkflowCanvasProps {
    steps: WorkflowStep[];
    transitions: WorkflowTransition[];
    zoom: number;
    onEditStep: (step: WorkflowStep) => void;
    onDeleteStep: (id: string) => void;
    onAddStep: () => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
    steps,
    transitions,
    zoom,
    onEditStep,
    onDeleteStep,
    onAddStep
}) => {
    return (
        <div 
            className="flex-1 w-full bg-slate-50 dark:bg-card-foreground/5 p-8 rounded-3xl border border-gray-100 overflow-auto min-h-[480px] shadow-inner relative flex items-center justify-center"
            style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        >
            <div 
                className="flex items-center gap-6 transition-transform duration-200 py-6"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            >
                {/* Visual Start Node */}
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary text-white rounded-full shadow-premium-md border border-primary/20">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Draft</span>
                </div>

                <ArrowRight className="w-5 h-5 text-gray-300 shrink-0" />

                {steps.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 p-8 border border-dashed border-gray-300 rounded-2xl bg-white/80 min-w-[200px] text-center shadow-premium-sm">
                        <p className="text-xs text-gray-400 font-bold">No steps added to review path.</p>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={onAddStep}
                            className="h-8 rounded-lg text-[10px] font-black"
                        >
                            + Add Step
                        </Button>
                    </div>
                ) : (
                    steps.map((step, index) => (
                        <React.Fragment key={step.id || index}>
                            <WorkflowStepCard 
                                step={step}
                                onEdit={onEditStep}
                                onDelete={onDeleteStep}
                            />
                            
                            <ArrowRight className="w-5 h-5 text-gray-300 shrink-0" />
                        </React.Fragment>
                    ))
                )}

                {/* Visual End Node */}
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full shadow-premium-md border border-emerald-600">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Deploy</span>
                </div>
            </div>
        </div>
    );
};
export default WorkflowCanvas;

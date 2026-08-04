import React from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Edit2, Trash2, Shield, GripVertical } from 'lucide-react';
import { WorkflowStep } from '../services/assessment.api';

interface WorkflowStepCardProps {
    step: WorkflowStep;
    onEdit: (step: WorkflowStep) => void;
    onDelete: (id: string) => void;
}

export const WorkflowStepCard: React.FC<WorkflowStepCardProps> = ({
    step,
    onEdit,
    onDelete
}) => {
    return (
        <Card className="group relative border border-gray-100 shadow-premium-sm rounded-2xl bg-white hover:border-primary/30 transition-all hover:shadow-premium-md min-w-[240px] max-w-[280px]">
            {/* Top order bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 to-primary rounded-t-2xl" />
            
            <CardContent className="p-5 flex items-start gap-3">
                <div className="cursor-grab p-1 bg-gray-50 rounded-lg group-hover:bg-primary/5 transition-all self-center">
                    <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-primary transition-all" />
                </div>

                <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-1.5">
                        <span className="flex items-center justify-center w-5 h-5 bg-primary/10 text-primary rounded-full text-[10px] font-black">
                            {step.sort_order}
                        </span>
                        <h4 className="text-sm font-black text-gray-900 leading-tight truncate max-w-[160px]">
                            {step.step_name || 'Review Step'}
                        </h4>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-gray-500 font-bold bg-gray-50 dark:bg-card-foreground/5 py-1 px-2.5 rounded-lg w-fit border border-gray-100">
                        <Shield className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                        Role: {step.role_required}
                    </div>
                </div>

                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(step)}
                        className="h-7 w-7 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(step.id!)}
                        className="h-7 w-7 rounded-lg text-gray-400 hover:text-destructive hover:bg-destructive/5"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
export default WorkflowStepCard;

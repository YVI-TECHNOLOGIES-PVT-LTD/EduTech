import React from 'react';
import { Button } from '../../../../components/ui/button';
import { 
    Plus, Undo2, Redo2, ZoomIn, ZoomOut, ShieldAlert, CheckCircle, Save 
} from 'lucide-react';

interface WorkflowToolbarProps {
    onAddStep: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onValidate: () => void;
    onSave: () => void;
    isSaving: boolean;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
    onAddStep,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    zoom,
    onZoomIn,
    onZoomOut,
    onValidate,
    onSave,
    isSaving
}) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
            <div className="flex items-center gap-2">
                <Button
                    onClick={onAddStep}
                    className="bg-primary text-white flex items-center gap-1 text-xs font-black rounded-xl"
                >
                    <Plus className="w-4 h-4" /> Add Review Step
                </Button>
                <div className="w-px h-6 bg-gray-100 mx-1" />
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="rounded-xl border-gray-200"
                >
                    <Undo2 className="w-4 h-4 text-gray-500" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="rounded-xl border-gray-200"
                >
                    <Redo2 className="w-4 h-4 text-gray-500" />
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-card-foreground/5 p-1 rounded-xl border border-gray-100">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onZoomOut}
                        className="h-8 w-8 rounded-lg"
                    >
                        <ZoomOut className="w-4 h-4 text-gray-500" />
                    </Button>
                    <span className="text-xs font-black text-gray-500 px-1 w-12 text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onZoomIn}
                        className="h-8 w-8 rounded-lg"
                    >
                        <ZoomIn className="w-4 h-4 text-gray-500" />
                    </Button>
                </div>

                <Button
                    variant="outline"
                    onClick={onValidate}
                    className="rounded-xl border-gray-200 text-xs font-bold text-gray-600 flex items-center gap-1"
                >
                    <ShieldAlert className="w-4 h-4 text-amber-500" /> Integrity Verify
                </Button>

                <Button
                    onClick={onSave}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 px-5 shadow-premium-sm"
                >
                    <Save className="w-4 h-4" /> Save & Deploy
                </Button>
            </div>
        </div>
    );
};
export default WorkflowToolbar;

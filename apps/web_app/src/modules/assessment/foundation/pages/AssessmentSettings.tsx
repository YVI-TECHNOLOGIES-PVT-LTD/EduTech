import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/ui/button';
import { Plus } from 'lucide-react';
import { ConfigurationPanel } from '../components/ConfigurationPanel';
import { WorkflowList } from '../components/WorkflowList';

export function AssessmentSettings() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 pb-6 max-w-7xl mx-auto p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Assessment Platform Settings</h1>
                    <p className="text-xs text-gray-400 mt-1">Configure global telemetries caching, and visual reviews approval chains.</p>
                </div>
                <Button
                    onClick={() => navigate('/app/assessment/workflows/new')}
                    className="bg-primary hover:bg-primary/95 text-white flex items-center gap-1.5 rounded-xl text-xs font-black px-5 py-2.5 shadow-premium-sm hover:scale-[1.01] transition-transform"
                >
                    <Plus className="w-4 h-4" /> Build Review Workflow
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                {/* CONFIGURATIONS PANEL */}
                <div className="lg:col-span-2">
                    <ConfigurationPanel />
                </div>

                {/* WORKFLOWS LIST */}
                <div className="lg:col-span-1">
                    <WorkflowList />
                </div>
            </div>
        </div>
    );
}

export default AssessmentSettings;

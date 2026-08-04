import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, LayoutGrid } from 'lucide-react';
import { useRubrics } from '../hooks/useEvaluation';

export const RubricDesignerPage: React.FC = () => {
    const navigate = useNavigate();
    const { createRubric } = useRubrics();

    const [rubricName, setRubricName] = useState('');
    const [totalScore, setTotalScore] = useState(100);
    const [criteria, setCriteria] = useState<any[]>([
        { name: 'Technical Accuracy', weight: 1.5, description: '' },
        { name: 'Formatting & Layout', weight: 1.0, description: '' }
    ]);

    const handleAddCriteria = () => {
        setCriteria(prev => [...prev, { name: '', weight: 1.0, description: '' }]);
    };

    const handleRemoveCriteria = (index: number) => {
        setCriteria(prev => prev.filter((_, i) => i !== index));
    };

    const handleCriteriaChange = (index: number, field: string, val: any) => {
        const copy = [...criteria];
        copy[index][field] = val;
        setCriteria(copy);
    };

    const handleSave = async () => {
        if (!rubricName) return alert('Rubric template name is required.');
        try {
            await createRubric({
                question_snapshot_id: 'a9b21f3d-9d41-4cf1-88f5-93deec90d1f1', // Mock mapping
                total_score: totalScore,
                criteria
            });
            alert('Rubric template successfully saved!');
            navigate('/app/assessment/evaluation');
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-4xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/assessment/evaluation')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Scoring Rubrics Designer
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Create weighted assessment rubric matrices to ensure fair examiner scoring audits.
                    </p>
                </div>
            </div>

            {/* Rubrics Form */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1">
                        <label className="font-bold text-gray-400">Rubric Matrix Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Subjective essay grading standard"
                            value={rubricName}
                            onChange={(e) => setRubricName(e.target.value)}
                            className="p-2.5 border border-gray-200 rounded-xl"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="font-bold text-gray-400">Total Rubric Marks Limit</label>
                        <input 
                            type="number" 
                            value={totalScore}
                            onChange={(e) => setTotalScore(Number(e.target.value))}
                            className="p-2.5 border border-gray-200 rounded-xl font-bold text-primary"
                        />
                    </div>
                </div>

                {/* Criteria sections mapping */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-150">
                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <LayoutGrid className="w-4 h-4 text-primary" />
                            Rubric Criteria Parameters
                        </h4>
                        <button 
                            onClick={handleAddCriteria}
                            className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl text-[10px] font-bold border border-gray-200"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Criterion
                        </button>
                    </div>

                    <div className="space-y-3">
                        {criteria.map((c, i) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center gap-4 text-xs">
                                <div className="flex-1 flex flex-col gap-1 w-full">
                                    <label className="font-bold text-gray-400">Criterion Name</label>
                                    <input 
                                        type="text" 
                                        value={c.name}
                                        onChange={(e) => handleCriteriaChange(i, 'name', e.target.value)}
                                        className="p-2 border border-gray-200 rounded-xl"
                                    />
                                </div>

                                <div className="flex flex-col gap-1 w-full sm:w-24">
                                    <label className="font-bold text-gray-400">Weight Factor</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        value={c.weight}
                                        onChange={(e) => handleCriteriaChange(i, 'weight', Number(e.target.value))}
                                        className="p-2 border border-gray-200 rounded-xl"
                                    />
                                </div>

                                <button 
                                    onClick={() => handleRemoveCriteria(i)}
                                    className="p-2 text-gray-400 hover:text-rose-500 rounded-xl self-end"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold transition-all shadow-premium-md text-xs flex items-center justify-center gap-1.5"
                >
                    <Save className="w-4 h-4" />
                    Save Rubric Template
                </button>
            </div>
        </div>
    );
};
export default RubricDesignerPage;

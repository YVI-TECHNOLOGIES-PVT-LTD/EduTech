import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface Option {
    option_text: string;
    is_correct: boolean;
}

interface OptionEditorProps {
    options: Option[];
    onChange: (options: Option[]) => void;
    questionType: string;
}

export const OptionEditor: React.FC<OptionEditorProps> = ({
    options,
    onChange,
    questionType
}) => {
    const handleAdd = () => {
        onChange([...options, { option_text: '', is_correct: false }]);
    };

    const handleRemove = (index: number) => {
        onChange(options.filter((_, idx) => idx !== index));
    };

    const handleChangeText = (index: number, val: string) => {
        const updated = [...options];
        updated[index].option_text = val;
        onChange(updated);
    };

    const handleToggleCorrect = (index: number) => {
        const updated = [...options];
        if (questionType === 'MCQ' || questionType === 'TRUE_FALSE') {
            updated.forEach((opt, idx) => {
                opt.is_correct = idx === index;
            });
        } else {
            updated[index].is_correct = !updated[index].is_correct;
        }
        onChange(updated);
    };

    if (questionType === 'SUBJECTIVE') {
        return (
            <div className="p-4 border border-dashed border-gray-200 bg-gray-50/50 rounded-2xl text-center">
                <p className="text-xs text-gray-400 font-bold">Subjective question types do not require choice lists.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label className="text-[10px] font-black text-gray-400 uppercase">Question Choice Options</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAdd}
                    className="h-8 text-[10px] rounded-lg font-black border-gray-200"
                >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Choice
                </Button>
            </div>

            <div className="space-y-2">
                {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-premium-sm group relative">
                        <button
                            type="button"
                            onClick={() => handleToggleCorrect(idx)}
                            className={`p-1 rounded-lg border transition-all ${
                                opt.is_correct 
                                    ? 'bg-emerald-500 border-emerald-600 text-white' 
                                    : 'border-gray-200 text-gray-300 hover:border-gray-300'
                            }`}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                        </button>

                        <Input
                            placeholder={`Choice option #${idx + 1}`}
                            value={opt.option_text}
                            onChange={(e) => handleChangeText(idx, e.target.value)}
                            className="h-9 rounded-lg border-gray-200 text-xs"
                        />

                        {options.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemove(idx)}
                                className="h-8 w-8 text-gray-400 hover:text-destructive hover:bg-destructive/5 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
export default OptionEditor;

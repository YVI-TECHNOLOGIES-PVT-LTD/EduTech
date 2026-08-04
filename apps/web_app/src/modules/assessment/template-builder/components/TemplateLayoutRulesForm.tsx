import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Label } from '../../../../components/ui/label';
import { Sliders } from 'lucide-react';
import { TemplateLayoutRule } from '../services/template.api';

interface TemplateLayoutRulesFormProps {
    rules: TemplateLayoutRule[];
    onChange: (rules: TemplateLayoutRule[]) => void;
}

export const TemplateLayoutRulesForm: React.FC<TemplateLayoutRulesFormProps> = ({ rules, onChange }) => {
    const getVal = (property: string, def: string) => {
        return rules.find(r => r.property === property)?.value || def;
    };

    const handleUpdate = (property: string, value: string) => {
        const index = rules.findIndex(r => r.property === property);
        const updated = [...rules];
        if (index > -1) {
            updated[index].value = value;
        } else {
            updated.push({ property, value });
        }
        onChange(updated);
    };

    return (
        <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-50 p-5 flex flex-row items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-primary" />
                <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-wider">Page layout rules designer</CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid sm:grid-cols-2 gap-4 text-xs font-bold text-gray-700">
                {/* Page Size */}
                <div className="space-y-1">
                    <Label className="text-[10px] font-black text-gray-400 uppercase">Page Size</Label>
                    <select
                        value={getVal('page_size', 'A4')}
                        onChange={(e) => handleUpdate('page_size', e.target.value)}
                        className="h-10 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3 w-full outline-none"
                    >
                        <option value="A4">A4 (Standard)</option>
                        <option value="Letter">Letter</option>
                        <option value="A3">A3 (Tabloid)</option>
                    </select>
                </div>

                {/* Orientation */}
                <div className="space-y-1">
                    <Label className="text-[10px] font-black text-gray-400 uppercase">Orientation</Label>
                    <select
                        value={getVal('orientation', 'Portrait')}
                        onChange={(e) => handleUpdate('orientation', e.target.value)}
                        className="h-10 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3 w-full outline-none"
                    >
                        <option value="Portrait">Portrait</option>
                        <option value="Landscape">Landscape</option>
                    </select>
                </div>

                {/* Font typography */}
                <div className="space-y-1">
                    <Label className="text-[10px] font-black text-gray-400 uppercase">Font Typography</Label>
                    <select
                        value={getVal('font', 'Arial')}
                        onChange={(e) => handleUpdate('font', e.target.value)}
                        className="h-10 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3 w-full outline-none"
                    >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Roboto">Roboto</option>
                    </select>
                </div>

                {/* Grid Columns */}
                <div className="space-y-1">
                    <Label className="text-[10px] font-black text-gray-400 uppercase">Grid Columns</Label>
                    <select
                        value={getVal('columns', '1')}
                        onChange={(e) => handleUpdate('columns', e.target.value)}
                        className="h-10 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3 w-full outline-none"
                    >
                        <option value="1">Single Column</option>
                        <option value="2">Two Columns</option>
                    </select>
                </div>
            </CardContent>
        </Card>
    );
};
export default TemplateLayoutRulesForm;

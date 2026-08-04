import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Label } from '../../../../components/ui/label';

interface BloomSelectorProps {
    value: string;
    onChange: (val: any) => void;
}

export const BloomSelector: React.FC<BloomSelectorProps> = ({ value, onChange }) => {
    return (
        <div className="space-y-1">
            <Label className="text-[10px] font-black text-gray-400 uppercase">Bloom's Taxonomy Level</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="rounded-xl border-gray-200 h-10 text-xs font-bold bg-white">
                    <SelectValue placeholder="Select Taxonomy Level" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="REMEMBER" className="text-xs font-bold">Remember</SelectItem>
                    <SelectItem value="UNDERSTAND" className="text-xs font-bold">Understand</SelectItem>
                    <SelectItem value="APPLY" className="text-xs font-bold">Apply</SelectItem>
                    <SelectItem value="ANALYZE" className="text-xs font-bold">Analyze</SelectItem>
                    <SelectItem value="EVALUATE" className="text-xs font-bold">Evaluate</SelectItem>
                    <SelectItem value="CREATE" className="text-xs font-bold">Create</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};
export default BloomSelector;

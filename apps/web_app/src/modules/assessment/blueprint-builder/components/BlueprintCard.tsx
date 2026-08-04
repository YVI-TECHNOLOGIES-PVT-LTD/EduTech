import React from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Sparkles, Clipboard, GitCompare, Eye } from 'lucide-react';
import { BlueprintItem } from '../services/blueprint.api';

interface BlueprintCardProps {
    blueprint: BlueprintItem;
    onClick?: () => void;
    onClone?: () => void;
}

export const BlueprintCard: React.FC<BlueprintCardProps> = ({ blueprint, onClick, onClone }) => {
    return (
        <Card 
            onClick={onClick}
            className="group relative border border-gray-100 hover:border-primary/20 shadow-premium-sm hover:shadow-premium-md rounded-2xl bg-white transition-all cursor-pointer overflow-hidden"
        >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
            
            <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Total Marks: <span className="text-gray-700 font-black">{blueprint.total_marks}</span>
                    </span>
                    <Badge className={`text-[9px] font-black py-0.5 px-2.5 rounded-full ${
                        blueprint.status === 'PUBLISHED' 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                        {blueprint.status}
                    </Badge>
                </div>

                <div className="space-y-1">
                    <h4 className="text-sm font-black text-gray-800 tracking-tight leading-normal group-hover:text-primary transition-colors">
                        {blueprint.name}
                    </h4>
                    {blueprint.description && (
                        <p className="text-xs text-gray-400 font-bold line-clamp-2">
                            {blueprint.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-[10px] text-gray-400 font-bold">
                    <span>Version v{blueprint.version}</span>
                    <div className="flex gap-2">
                        {onClone && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onClone(); }}
                                className="flex items-center gap-1 text-primary hover:text-primary-dark transition-colors"
                            >
                                <GitCompare className="w-3.5 h-3.5" /> Clone
                            </button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
export default BlueprintCard;

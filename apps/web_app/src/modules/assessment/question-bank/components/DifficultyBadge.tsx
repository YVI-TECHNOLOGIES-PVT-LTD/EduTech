import React from 'react';
import { Badge } from '../../../../components/ui/badge';

interface DifficultyBadgeProps {
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | string;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty }) => {
    let classes = 'bg-gray-100 text-gray-700';
    if (difficulty === 'EASY') {
        classes = 'bg-green-50 text-green-700 border-green-100';
    } else if (difficulty === 'MEDIUM') {
        classes = 'bg-amber-50 text-amber-700 border-amber-100';
    } else if (difficulty === 'HARD') {
        classes = 'bg-rose-50 text-rose-700 border-rose-100';
    }

    return (
        <Badge className={`text-[9px] font-black rounded-full px-2.5 py-0.5 border ${classes}`}>
            {difficulty}
        </Badge>
    );
};
export default DifficultyBadge;

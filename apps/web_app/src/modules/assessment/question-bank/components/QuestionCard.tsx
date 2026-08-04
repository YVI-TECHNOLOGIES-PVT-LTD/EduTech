import React from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { DifficultyBadge } from './DifficultyBadge';
import { HelpCircle, Star, Sparkles, BookOpen } from 'lucide-react';
import { QuestionItem } from '../services/question.api';

interface QuestionCardProps {
    question: QuestionItem;
    onClick?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onClick }) => {
    return (
        <Card 
            onClick={onClick}
            className="group relative border border-gray-100 hover:border-primary/20 shadow-premium-sm hover:shadow-premium-md rounded-2xl bg-white transition-all cursor-pointer overflow-hidden"
        >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 to-primary/80" />
            
            <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <DifficultyBadge difficulty={question.difficulty} />
                        <Badge className="text-[9px] font-black bg-primary/10 text-primary border-primary/20 rounded-full px-2.5">
                            {question.question_type}
                        </Badge>
                    </div>
                    <span className="text-[10px] font-black text-gray-400">
                        Marks: <span className="text-gray-700">{question.points}</span>
                    </span>
                </div>

                <div className="space-y-1.5">
                    <p className="text-xs font-black text-gray-800 leading-normal line-clamp-3">
                        {question.question_text}
                    </p>
                    {question.explanation && (
                        <p className="text-[10px] text-gray-400 italic line-clamp-2">
                            Explanation: {question.explanation}
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-1 pt-3 border-t border-gray-50 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1 font-bold">
                        <BookOpen className="w-3.5 h-3.5 text-primary/70" /> Outcomes: {question.course_outcome_code || 'None'}
                    </span>
                    <span className="mx-1">•</span>
                    <span className="font-bold">v{question.version}</span>
                    <span className="mx-1">•</span>
                    <Badge className={`text-[8px] font-black py-0.5 px-2 rounded-full ${
                        question.status === 'PUBLISHED' 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                        {question.status}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
};
export default QuestionCard;

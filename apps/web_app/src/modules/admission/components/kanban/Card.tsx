import React from 'react';
import { Clock, User, Award, ShieldAlert, FileSignature } from 'lucide-react';
import { motion } from 'framer-motion';

export interface KanbanCardData {
    id: string;
    code: string;
    name: string;
    grade: string;
    status: string;
    legacyStatus?: string;
    counselor?: string;
    score?: number;
    slaProgress: number;
    slaStatus: 'normal' | 'warning' | 'breached';
    slaRemainingHours?: number;
    documentStatus: 'complete' | 'pending' | 'missing';
    updatedAt: string;
    paymentAmount?: number;
    isTransitioning?: boolean;
}

interface CardProps {
    card: KanbanCardData;
    onClick?: (id: string) => void;
    onDragStart?: (e: React.DragEvent, id: string) => void;
}

export function Card({ card, onClick, onDragStart }: CardProps) {
    const statusColors = {
        normal: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        warning: 'bg-amber-50 text-amber-700 border-amber-100',
        breached: 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse',
    };

    const docColors = {
        complete: 'bg-emerald-100 text-emerald-800',
        pending: 'bg-amber-100 text-amber-800',
        missing: 'bg-rose-100 text-rose-800',
    };

    const handleDragStart = (e: React.DragEvent) => {
        if (onDragStart) {
            onDragStart(e, card.id);
        }
    };

    return (
        <motion.div
            layoutId={card.id}
            draggable={!card.isTransitioning}
            onDragStart={handleDragStart as any}
            onClick={() => onClick && onClick(card.id)}
            className="relative p-4 bg-white dark:bg-card border border-gray-150 dark:border-border/60 rounded-2xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing hover:border-indigo-200 transition-all select-none space-y-3"
            whileHover={{ scale: card.isTransitioning ? 1 : 1.01 }}
            whileTap={{ scale: card.isTransitioning ? 1 : 0.99 }}
        >
            {card.isTransitioning && (
                <div className="absolute inset-0 bg-white/60 dark:bg-black/40 rounded-2xl flex items-center justify-center z-10">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            <div className="flex items-start justify-between">
                <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                        {card.code}
                    </span>
                    <h4 className="text-xs font-black text-gray-900 dark:text-gray-100 mt-1.5 leading-snug">
                        {card.name}
                    </h4>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-[10px] font-bold text-gray-600">
                    Grade {card.grade}
                </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>{card.counselor || 'Unassigned'}</span>
                </div>
                {card.score !== undefined && (
                    <div className="flex items-center gap-0.5 font-black text-indigo-600">
                        <Award className="w-3.5 h-3.5" />
                        <span>{card.score}/100</span>
                    </div>
                )}
            </div>

            {/* SLA Progress Bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-gray-400">
                    <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> SLA Progress
                    </span>
                    <span>{card.slaProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-muted/30 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                            card.slaStatus === 'breached' ? 'bg-rose-500' : card.slaStatus === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${card.slaProgress}%` }}
                    />
                </div>
            </div>

            {/* Footer tags */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-border/20 text-[9px] font-black uppercase">
                <span className={`px-1.5 py-0.5 rounded border ${statusColors[card.slaStatus]}`}>
                    {card.slaStatus}
                </span>
                <span className={`px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${docColors[card.documentStatus]}`}>
                    <FileSignature className="w-2.5 h-2.5" /> Docs {card.documentStatus}
                </span>
            </div>
        </motion.div>
    );
}

export default Card;

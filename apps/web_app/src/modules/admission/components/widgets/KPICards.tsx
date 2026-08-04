import React from 'react';
import { Sparkles } from 'lucide-react';

export interface KPICardData {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ComponentType<any>;
    color: string; // Tailored color classes e.g. text-indigo-600 bg-indigo-50 border-indigo-100
}

interface KPICardsProps {
    cards: KPICardData[];
}

export function KPICards({ cards }: KPICardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cards.map((card, idx) => {
                const Icon = card.icon || Sparkles;
                
                return (
                    <div 
                        key={idx} 
                        className="bg-white dark:bg-card border border-gray-150 dark:border-border/60 rounded-2xl p-5 shadow-sm flex items-start justify-between"
                    >
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">
                                {card.title}
                            </span>
                            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
                                {card.value}
                            </h3>
                            {card.description && (
                                <p className="text-[10px] text-gray-400 font-bold">
                                    {card.description}
                                </p>
                            )}
                        </div>
                        <span className={`p-2.5 rounded-xl border ${card.color}`}>
                            <Icon className="w-5 h-5" />
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default KPICards;

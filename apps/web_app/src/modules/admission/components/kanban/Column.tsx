import React, { useState } from 'react';
import Card, { KanbanCardData } from './Card';

interface ColumnProps {
    id: string;
    title: string;
    cards: KanbanCardData[];
    onCardClick?: (id: string) => void;
    onCardDragStart?: (e: React.DragEvent, id: string) => void;
    onCardDrop?: (cardId: string, targetStage: string) => void;
}

export function Column({ id, title, cards, onCardClick, onCardDragStart, onCardDrop }: ColumnProps) {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        const cardId = e.dataTransfer.getData('text/plain');
        if (onCardDrop && cardId) {
            onCardDrop(cardId, id);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col min-w-[280px] max-w-[320px] w-72 bg-gray-50/50 dark:bg-muted/10 border rounded-2xl p-4 transition-all shrink-0 ${
                isOver ? 'border-indigo-400 bg-indigo-50/10' : 'border-gray-250 dark:border-border/40'
            }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 dark:border-border/10">
                <span className="text-xs font-black uppercase text-gray-800 dark:text-gray-200 tracking-wider">
                    {title}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gray-250 text-gray-600 text-[10px] font-bold">
                    {cards.length}
                </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-[400px]">
                {cards.map(card => (
                    <Card
                        key={card.id}
                        card={card}
                        onClick={onCardClick}
                        onDragStart={onCardDragStart}
                    />
                ))}
                {cards.length === 0 && (
                    <div className="h-full flex items-center justify-center text-center text-gray-400 text-xs py-12 border-2 border-dashed border-gray-200/50 rounded-xl">
                        No applications
                    </div>
                )}
            </div>
        </div>
    );
}

export default Column;

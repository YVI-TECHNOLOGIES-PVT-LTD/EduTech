import React from 'react';
import Column from './Column';
import { KanbanCardData } from './Card';
import { PIPELINE_COLUMNS } from '../../core/AdmissionStatusMapper';
import type { UIAdmissionStatus } from '../../core/AdmissionStatusMapper';

interface KanbanBoardProps {
    cards: KanbanCardData[];
    onCardClick?: (id: string) => void;
    onStageTransition?: (cardId: string, fromStage: string, toStage: string) => void;
    transitioningIds?: Set<string>;
}

export function KanbanBoard({ cards, onCardClick, onStageTransition, transitioningIds }: KanbanBoardProps) {
    const handleCardDragStart = (e: React.DragEvent, cardId: string) => {
        const card = cards.find(c => c.id === cardId);
        if (card?.isTransitioning || transitioningIds?.has(cardId)) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', cardId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleCardDrop = (cardId: string, targetStageId: string) => {
        const card = cards.find(c => c.id === cardId);
        if (!card || card.isTransitioning || transitioningIds?.has(cardId)) return;
        if (card.status === targetStageId) return;

        if (onStageTransition) {
            onStageTransition(cardId, card.status, targetStageId);
        }
    };

    const columnsData = PIPELINE_COLUMNS.map(stage => ({
        ...stage,
        cards: cards
            .filter(c => c.status === stage.id)
            .map(c => ({
                ...c,
                isTransitioning: c.isTransitioning || transitioningIds?.has(c.id),
            })),
    }));

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start select-none h-[calc(100vh-220px)] min-h-[500px]">
            {columnsData.map(col => (
                <Column
                    key={col.id}
                    id={col.id}
                    title={col.title}
                    cards={col.cards}
                    onCardClick={onCardClick}
                    onCardDragStart={handleCardDragStart}
                    onCardDrop={handleCardDrop}
                />
            ))}
        </div>
    );
}

export default KanbanBoard;
export { PIPELINE_COLUMNS };
export type { UIAdmissionStatus };

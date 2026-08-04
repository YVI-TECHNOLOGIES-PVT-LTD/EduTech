import React, { useRef, useState, useEffect, useCallback } from 'react';

interface GridVirtualScrollerProps {
    itemCount: number;
    itemHeight: number;
    containerHeight: number;
    renderItem: (index: number) => React.ReactNode;
    onEndReached?: () => void;
    endThreshold?: number;
}

export function GridVirtualScroller({
    itemCount,
    itemHeight,
    containerHeight,
    renderItem,
    onEndReached,
    endThreshold = 5,
}: GridVirtualScrollerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
    const endIndex = Math.min(itemCount, startIndex + visibleCount);
    const offsetY = startIndex * itemHeight;
    const totalHeight = itemCount * itemHeight;

    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const top = e.currentTarget.scrollTop;
            setScrollTop(top);
            if (onEndReached && endIndex >= itemCount - endThreshold) {
                onEndReached();
            }
        },
        [onEndReached, endIndex, itemCount, endThreshold],
    );

    useEffect(() => {
        if (onEndReached && endIndex >= itemCount - endThreshold && itemCount > 0) {
            onEndReached();
        }
    }, [endIndex, itemCount, endThreshold, onEndReached]);

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            style={{ height: containerHeight, overflow: 'auto' }}
            className="custom-scrollbar"
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                    {Array.from({ length: endIndex - startIndex }, (_, i) => {
                        const index = startIndex + i;
                        return (
                            <div key={index} style={{ height: itemHeight }}>
                                {renderItem(index)}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

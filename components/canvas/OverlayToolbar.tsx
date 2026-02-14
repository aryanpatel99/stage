'use client';

import * as React from 'react';
import { Delete02Icon, Copy01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';

interface OverlayToolbarProps {
  position: { x: number; y: number };
  onDelete: () => void;
  onDuplicate: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function OverlayToolbar({
  position,
  onDelete,
  onDuplicate,
  containerRef,
}: OverlayToolbarProps) {
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = React.useState(position);

  React.useEffect(() => {
    if (!toolbarRef.current || !containerRef.current) return;

    const toolbar = toolbarRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const toolbarWidth = toolbar.offsetWidth;

    // Calculate position relative to container
    let x = position.x - toolbarWidth / 2;
    let y = position.y - 50; // Position above the overlay

    // Keep toolbar within container bounds
    const minX = 8;
    const maxX = containerRect.width - toolbarWidth - 8;
    const minY = 8;

    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(minY, y);

    setAdjustedPosition({ x, y });
  }, [position, containerRef]);

  return (
    <div
      ref={toolbarRef}
      className={cn(
        'absolute z-50 flex items-center gap-1 p-1.5',
        'bg-surface-2/95 backdrop-blur-sm rounded-xl',
        'border border-border/40 shadow-lg',
        'animate-in fade-in-0 zoom-in-95 duration-150'
      )}
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
        }}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg',
          'text-text-secondary hover:text-foreground',
          'hover:bg-surface-3 transition-colors duration-150'
        )}
        title="Duplicate"
      >
        <Copy01Icon size={16} />
      </button>
      <div className="w-px h-5 bg-border/40" />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg',
          'text-text-secondary hover:text-red-500',
          'hover:bg-red-500/10 transition-colors duration-150'
        )}
        title="Delete"
      >
        <Delete02Icon size={16} />
      </button>
    </div>
  );
}

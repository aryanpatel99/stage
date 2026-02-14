'use client';

import * as React from 'react';
import {
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
  Delete02Icon,
} from 'hugeicons-react';
import { useImageStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function CanvasToolbar() {
  const { imageOverlays, clearImageOverlays } = useImageStore();
  const hasOverlays = imageOverlays.length > 0;

  // Track temporal state reactively
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  // Update undo/redo state when temporal store changes
  React.useEffect(() => {
    const updateTemporalState = () => {
      const { pastStates, futureStates } = useImageStore.temporal.getState();
      setCanUndo(pastStates.length > 0);
      setCanRedo(futureStates.length > 0);
    };

    // Initial update
    updateTemporalState();

    // Subscribe to changes
    const unsubscribe = useImageStore.temporal.subscribe(updateTemporalState);
    return unsubscribe;
  }, []);

  const handleUndo = React.useCallback(() => {
    const { undo, pastStates } = useImageStore.temporal.getState();
    if (pastStates.length > 0) {
      undo();
    }
  }, []);

  const handleRedo = React.useCallback(() => {
    const { redo, futureStates } = useImageStore.temporal.getState();
    if (futureStates.length > 0) {
      redo();
    }
  }, []);

  return (
    <div className="flex items-center justify-center py-4 shrink-0">
      <div className="flex items-center gap-2 p-1.5 bg-surface-3/80 backdrop-blur-sm rounded-2xl border border-border/30">
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl',
            'bg-surface-2 border border-border/40',
            'text-text-secondary transition-all duration-150',
            canUndo
              ? 'hover:bg-surface-3 hover:text-foreground hover:border-border/60 active:scale-95'
              : 'opacity-40 cursor-not-allowed'
          )}
          title="Undo (Cmd+Z)"
        >
          <ArrowTurnBackwardIcon size={20} />
        </button>

        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl',
            'bg-surface-2 border border-border/40',
            'text-text-secondary transition-all duration-150',
            canRedo
              ? 'hover:bg-surface-3 hover:text-foreground hover:border-border/60 active:scale-95'
              : 'opacity-40 cursor-not-allowed'
          )}
          title="Redo (Cmd+Shift+Z)"
        >
          <ArrowTurnForwardIcon size={20} />
        </button>

        <button
          onClick={() => clearImageOverlays()}
          disabled={!hasOverlays}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl',
            'bg-surface-2 border border-border/40',
            'text-text-secondary transition-all duration-150',
            hasOverlays
              ? 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/40 active:scale-95'
              : 'opacity-40 cursor-not-allowed'
          )}
          title="Clear all overlays"
        >
          <Delete02Icon size={20} />
        </button>
      </div>
    </div>
  );
}

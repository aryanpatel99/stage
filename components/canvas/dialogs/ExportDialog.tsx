"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScaleSlider, FormatSelector, QualityPresetSelector } from "@/components/export";
import { Download01Icon } from "hugeicons-react";
import type { ExportFormat, QualityPreset } from "@/lib/export/types";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: () => Promise<void>;
  scale: number;
  format: ExportFormat;
  qualityPreset: QualityPreset;
  isExporting: boolean;
  onScaleChange: (scale: number) => void;
  onFormatChange: (format: ExportFormat) => void;
  onQualityPresetChange: (preset: QualityPreset) => void;
}

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  scale,
  format,
  qualityPreset,
  isExporting,
  onScaleChange,
  onFormatChange,
  onQualityPresetChange,
}: ExportDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setError(null);
    try {
      await onExport();
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to export image. Please try again.";
      setError(errorMessage);
    }
  };

  const formatLabel = format === 'jpeg' ? 'JPEG' : 'PNG';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 pb-4">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Export Canvas
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-6">
          <FormatSelector format={format} onFormatChange={onFormatChange} />

          <QualityPresetSelector
            qualityPreset={qualityPreset}
            format={format}
            onQualityPresetChange={onQualityPresetChange}
          />

          <ScaleSlider scale={scale} onScaleChange={onScaleChange} />

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all"
          >
            {isExporting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Exporting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download01Icon size={18} />
                Export as {formatLabel}
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


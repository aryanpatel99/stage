"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormatSelector, ScaleSlider, QualitySlider } from "@/components/export";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: () => Promise<void>;
  format: "png" | "jpg";
  quality: number;
  scale: number;
  isExporting: boolean;
  onFormatChange: (format: "png" | "jpg") => void;
  onQualityChange: (quality: number) => void;
  onScaleChange: (scale: number) => void;
}

export function ExportDialog({ 
  open, 
  onOpenChange, 
  onExport,
  format,
  quality,
  scale,
  isExporting,
  onFormatChange,
  onQualityChange,
  onScaleChange,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">Export Canvas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-5">
          <FormatSelector format={format} onFormatChange={onFormatChange} />
          
          <ScaleSlider scale={scale} onScaleChange={onScaleChange} />

          {format === "jpg" && (
            <QualitySlider quality={quality} onQualityChange={onQualityChange} />
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}

          <div className="pt-2 pb-1">
            <p className="text-xs text-gray-500 text-center">
              Exported images will include Stage watermark
            </p>
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full h-11 font-semibold bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isExporting ? "Exporting..." : `Export as ${format.toUpperCase()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


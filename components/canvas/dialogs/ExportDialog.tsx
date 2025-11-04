"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  saveExportPreferences, 
  getExportPreferences, 
  saveExportedImage 
} from "@/lib/export-storage";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: "png" | "jpg", quality: number, scale: number) => Promise<{ dataURL: string; blob: Blob }>;
}

export function ExportDialog({ open, onOpenChange, onExport }: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<"png" | "jpg">("png");
  const [exportQuality, setExportQuality] = useState(0.95);
  const [exportScale, setExportScale] = useState(3);
  const [isExporting, setIsExporting] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getExportPreferences();
        if (prefs) {
          setExportFormat(prefs.format);
          setExportQuality(prefs.quality);
          setExportScale(prefs.scale);
        }
      } catch (error) {
        console.error("Failed to load export preferences:", error);
      }
    };
    
    if (open) {
      loadPreferences();
    }
  }, [open]);

  // Save preferences when they change
  const handleFormatChange = async (format: "png" | "jpg") => {
    setExportFormat(format);
    try {
      await saveExportPreferences({
        format,
        quality: exportQuality,
        scale: exportScale,
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  const handleQualityChange = async (quality: number) => {
    setExportQuality(quality);
    try {
      await saveExportPreferences({
        format: exportFormat,
        quality,
        scale: exportScale,
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  const handleScaleChange = async (scale: number) => {
    setExportScale(scale);
    try {
      await saveExportPreferences({
        format: exportFormat,
        quality: exportQuality,
        scale,
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { dataURL, blob } = await onExport(exportFormat, exportQuality, exportScale);

      if (!dataURL || dataURL === 'data:,') {
        throw new Error('Invalid image data generated');
      }

      // Save blob to IndexedDB for high-quality storage
      const fileName = `stage-${Date.now()}.${exportFormat}`;
      try {
        await saveExportedImage(blob, exportFormat, exportQuality, exportScale, fileName);
      } catch (error) {
        console.warn("Failed to save export to IndexedDB:", error);
        // Continue with download even if storage fails
      }

      // Download the file
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataURL;
      
      document.body.appendChild(link);
      link.click();
      
      // Small delay before removing to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      onOpenChange(false);
    } catch (error) {
      console.error("Export failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to export image. Please try again.";
      alert(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">Export Canvas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Format</Label>
            <div className="flex gap-2">
              <Button
                variant={exportFormat === "png" ? "default" : "outline"}
                onClick={() => handleFormatChange("png")}
                className={`flex-1 h-11 touch-manipulation ${exportFormat === "png" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
              >
                PNG
              </Button>
              <Button
                variant={exportFormat === "jpg" ? "default" : "outline"}
                onClick={() => handleFormatChange("jpg")}
                className={`flex-1 h-11 touch-manipulation ${exportFormat === "jpg" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
              >
                JPG
              </Button>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-700">Resolution Scale</Label>
              <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                {exportScale}x
              </span>
            </div>
            <Slider
              value={[exportScale]}
              onValueChange={([value]) => handleScaleChange(value)}
              min={1}
              max={5}
              step={1}
              className="py-2"
            />
            <p className="text-xs text-gray-600">
              Higher scale = better quality but larger file size. Recommended: 3x
            </p>
          </div>

          {exportFormat === "jpg" && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-700">JPEG Quality</Label>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {Math.round(exportQuality * 100)}%
                </span>
              </div>
              <Slider
                value={[exportQuality]}
                onValueChange={([value]) => handleQualityChange(value)}
                min={0.1}
                max={1}
                step={0.01}
                className="py-2"
              />
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
            {isExporting ? "Exporting..." : `Export as ${exportFormat.toUpperCase()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


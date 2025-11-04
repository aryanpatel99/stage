/**
 * Format selector component for export options
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface FormatSelectorProps {
  format: 'png' | 'jpg';
  onFormatChange: (format: 'png' | 'jpg') => void;
}

export function FormatSelector({ format, onFormatChange }: FormatSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-700">Format</Label>
      <div className="flex gap-2">
        <Button
          variant={format === "png" ? "default" : "outline"}
          onClick={() => onFormatChange("png")}
          className={`flex-1 h-11 touch-manipulation ${format === "png" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
        >
          PNG
        </Button>
        <Button
          variant={format === "jpg" ? "default" : "outline"}
          onClick={() => onFormatChange("jpg")}
          className={`flex-1 h-11 touch-manipulation ${format === "jpg" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
        >
          JPG
        </Button>
      </div>
    </div>
  );
}


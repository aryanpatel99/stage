/**
 * Quality slider component for JPEG export options
 */

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface QualitySliderProps {
  quality: number;
  onQualityChange: (quality: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function QualitySlider({ 
  quality, 
  onQualityChange,
  min = 0.1,
  max = 1,
  step = 0.01,
}: QualitySliderProps) {
  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-gray-700">JPEG Quality</Label>
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          {Math.round(quality * 100)}%
        </span>
      </div>
      <Slider
        value={[quality]}
        onValueChange={([value]) => onQualityChange(value)}
        min={min}
        max={max}
        step={step}
        className="py-2"
      />
    </div>
  );
}


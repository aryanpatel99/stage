/**
 * Resolution scale slider component for export options
 */

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ScaleSliderProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function ScaleSlider({ 
  scale, 
  onScaleChange,
  min = 1,
  max = 5,
  step = 1,
}: ScaleSliderProps) {
  return (
    <div className="space-y-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-gray-700">Resolution Scale</Label>
        <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
          {scale}x
        </span>
      </div>
      <Slider
        value={[scale]}
        onValueChange={([value]) => onScaleChange(value)}
        min={min}
        max={max}
        step={step}
        className="py-2"
      />
      <p className="text-xs text-gray-600">
        Higher scale = better quality but larger file size. Recommended: 3x
      </p>
    </div>
  );
}


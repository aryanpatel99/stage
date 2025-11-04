import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { aspectRatios } from '@/lib/constants/aspect-ratios';
import { useImageStore } from '@/lib/store';
import { AspectRatioPicker } from './aspect-ratio-picker';
import { Button } from '@/components/ui/button';
import * as React from 'react';

export const AspectRatioDropdown = () => {
  const { selectedAspectRatio } = useImageStore();
  const current = aspectRatios.find((ar) => ar.id === selectedAspectRatio);
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="Select aspect ratio"
          variant="outline"
          className="w-full justify-start"
        >
          <span className="flex items-center gap-2">
            <span
              className="bg-blue-600 rounded border shrink-0"
              style={{
                width: '20px',
                height: `${20 * (current?.ratio || 1)}px`,
                maxHeight: '20px',
                minHeight: '8px',
              }}
            />
            <span className="text-sm font-medium flex-1 text-left">
              {current ? `${current.name} (${current.width}:${current.height})` : 'Aspect Ratio'}
            </span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-4 w-[400px] max-h-[600px]" align="start">
        <AspectRatioPicker onSelect={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};


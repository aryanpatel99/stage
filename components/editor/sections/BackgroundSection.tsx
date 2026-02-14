'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { useDropzone } from 'react-dropzone';
import { useResponsiveCanvasDimensions } from '@/hooks/useAspectRatioDimensions';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/lib/constants';
import { getCldImageUrl } from '@/lib/cloudinary';
import {
  backgroundCategories,
  cloudinaryPublicIds,
} from '@/lib/cloudinary-backgrounds';
import { gradientColors, type GradientKey } from '@/lib/constants/gradient-colors';
import { solidColors, type SolidColorKey } from '@/lib/constants/solid-colors';
import { meshGradients, magicGradients, type MeshGradientKey, type MagicGradientKey } from '@/lib/constants/mesh-gradients';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from './SectionWrapper';
import { Cancel01Icon, Image01Icon, PaintBoardIcon, GridIcon, ShuffleIcon } from 'hugeicons-react';
import { cn } from '@/lib/utils';

// Arrow URLs
const ARROW_URLS = Array.from({ length: 10 }, (_, i) => `/arrow/arrow-${i + 1}.svg`);

// Shadow overlay IDs
const OVERLAY_SHADOW_IDS = [
  '023', '001', '002', '007', '017', '019', '031', '037', '041', '050',
  '053', '057', '063', '064', '082', '083', '088', '097', '099'
];
const OVERLAY_SHADOW_URLS = OVERLAY_SHADOW_IDS.map((id) => `/overlay-shadow/${id}.webp`);

// Category display names (ordered)
const CATEGORY_ORDER = ['assets', 'mac', 'radiant', 'mesh', 'silk'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  assets: 'Abstract',
  mac: 'macOS',
  radiant: 'Radiant',
  mesh: 'Mesh',
  silk: 'Silk',
};

export function BackgroundSection() {
  const {
    backgroundConfig,
    imageOverlays,
    setBackgroundType,
    setBackgroundValue,
    addImageOverlay,
    removeImageOverlay,
  } = useImageStore();

  const responsiveDimensions = useResponsiveCanvasDimensions();
  const [bgUploadError, setBgUploadError] = React.useState<string | null>(null);
  const [activeImageTab, setActiveImageTab] = React.useState<typeof CATEGORY_ORDER[number]>('assets');

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `File type not supported. Please use: PNG, JPG, WEBP`;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return `File size too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  };

  const onBgDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const validationError = validateFile(file);
        if (validationError) {
          setBgUploadError(validationError);
          return;
        }
        setBgUploadError(null);
        const blobUrl = URL.createObjectURL(file);
        setBackgroundValue(blobUrl);
        setBackgroundType('image');
      }
    },
    [setBackgroundValue, setBackgroundType]
  );

  const {
    getRootProps: getBgRootProps,
    getInputProps: getBgInputProps,
    isDragActive: isBgDragActive,
  } = useDropzone({
    onDrop: onBgDrop,
    accept: { 'image/*': ALLOWED_IMAGE_TYPES.map((type) => type.split('/')[1]) },
    maxSize: MAX_IMAGE_SIZE,
    multiple: false,
  });

  // Overlay helpers
  const getFullCanvasOverlay = () => {
    const canvasWidth = responsiveDimensions.width || 1920;
    const canvasHeight = responsiveDimensions.height || 1080;
    return {
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      size: Math.max(canvasWidth, canvasHeight),
    };
  };

  const getDefaultPosition = () => {
    const canvasWidth = responsiveDimensions.width || 1920;
    const overlaySize = 100;
    return {
      x: Math.max(20, (canvasWidth / 2) - (overlaySize / 2)),
      y: 50,
    };
  };

  const handleAddShadow = (shadowUrl: string) => {
    // Remove any existing shadows first (only one shadow at a time)
    imageOverlays.forEach((overlay) => {
      if (typeof overlay.src === 'string' && overlay.src.includes('overlay-shadow')) {
        removeImageOverlay(overlay.id);
      }
    });

    // Add the new shadow
    const { x, y, size } = getFullCanvasOverlay();
    addImageOverlay({
      src: shadowUrl,
      position: { x, y },
      size,
      rotation: 0,
      opacity: 0.5,
      flipX: false,
      flipY: false,
      isVisible: true,
    });
  };

  const handleRemoveShadows = () => {
    imageOverlays.forEach((overlay) => {
      if (typeof overlay.src === 'string' && overlay.src.includes('overlay-shadow')) {
        removeImageOverlay(overlay.id);
      }
    });
  };

  // Get current active shadow
  const currentShadow = imageOverlays.find(
    (overlay) => typeof overlay.src === 'string' && overlay.src.includes('overlay-shadow')
  );

  const handleAddArrow = (arrowUrl: string) => {
    const pos = getDefaultPosition();
    addImageOverlay({
      src: arrowUrl,
      position: { x: pos.x, y: pos.y },
      size: 80,
      rotation: 45,
      opacity: 0.9,
      flipX: false,
      flipY: false,
      isVisible: true,
    });
  };

  const shuffleMagicGradient = () => {
    const keys = Object.keys(magicGradients) as MagicGradientKey[];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    setBackgroundType('gradient');
    setBackgroundValue(`magic:${randomKey}`);
  };

  const availableCategories = CATEGORY_ORDER.filter(
    (cat) => backgroundCategories[cat]?.length > 0
  );

  return (
    <>
      {/* Shadow Overlays */}
      <SectionWrapper title="Shadows" defaultOpen={true}>
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={handleRemoveShadows}
              className={cn(
                'aspect-[16/9] flex items-center justify-center text-[10px] rounded-lg border-2 transition-all',
                !currentShadow
                  ? 'border-primary text-foreground bg-surface-2/50'
                  : 'border-dashed border-border/50 text-text-tertiary hover:border-border hover:bg-surface-2/30'
              )}
            >
              None
            </button>
            {OVERLAY_SHADOW_URLS.slice(0, 9).map((shadowUrl, index) => (
              <button
                key={index}
                onClick={() => handleAddShadow(shadowUrl)}
                className={cn(
                  'aspect-[16/9] rounded-lg overflow-hidden border-2 transition-all bg-neutral-300 dark:bg-neutral-700',
                  currentShadow?.src === shadowUrl
                    ? 'border-primary ring-1 ring-primary/30 scale-105'
                    : 'border-border/40 hover:border-primary/60 hover:scale-105'
                )}
              >
                <img
                  src={shadowUrl}
                  alt={`Shadow ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Arrows */}
      <SectionWrapper title="Arrows" defaultOpen={false}>
        <div className="grid grid-cols-5 gap-2">
          {ARROW_URLS.map((arrowUrl, index) => (
            <button
              key={index}
              onClick={() => handleAddArrow(arrowUrl)}
              className="aspect-square flex items-center justify-center rounded-lg border border-border/40 bg-white dark:bg-surface-3 hover:border-primary/60 hover:scale-105 transition-all p-2"
            >
              <img
                src={arrowUrl}
                alt={`Arrow ${index + 1}`}
                className="w-full h-full object-contain dark:invert"
              />
            </button>
          ))}
        </div>
      </SectionWrapper>

      {/* Background Images */}
      <SectionWrapper title="Backgrounds" defaultOpen={true}>
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <div
              {...getBgRootProps()}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border border-dashed cursor-pointer transition-all text-xs',
                isBgDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border/60 hover:border-primary/50 hover:bg-surface-2/30 text-text-secondary'
              )}
            >
              <input {...getBgInputProps()} />
              <Image01Icon size={14} />
              <span>Upload</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBackgroundType('solid');
                setBackgroundValue('white');
              }}
              className={cn(
                'flex-1 h-9 text-xs gap-1.5',
                backgroundConfig.type === 'solid' && 'border-primary bg-primary/5'
              )}
            >
              <PaintBoardIcon size={14} />
              Color
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBackgroundType('solid');
                setBackgroundValue('transparent');
              }}
              className="flex-1 h-9 text-xs gap-1.5"
            >
              <GridIcon size={14} />
              Clear
            </Button>
          </div>

          {bgUploadError && <p className="text-xs text-destructive">{bgUploadError}</p>}

          {/* Current Image Preview */}
          {backgroundConfig.type === 'image' && backgroundConfig.value &&
            (backgroundConfig.value.startsWith('blob:') ||
              backgroundConfig.value.startsWith('http') ||
              backgroundConfig.value.startsWith('data:') ||
              cloudinaryPublicIds.includes(backgroundConfig.value)) && (
              <div className="relative rounded-lg overflow-hidden border border-border/40 aspect-video bg-surface-1/50">
                <img
                  src={
                    cloudinaryPublicIds.includes(backgroundConfig.value)
                      ? getCldImageUrl({ src: backgroundConfig.value, width: 400, height: 225, quality: 'auto', format: 'auto', crop: 'fill', gravity: 'auto' })
                      : backgroundConfig.value
                  }
                  alt="Background"
                  className="w-full h-full object-cover"
                />
                <button
                  className="absolute top-2 right-2 p-1 rounded-md bg-black/50 text-white hover:bg-destructive transition-colors"
                  onClick={() => {
                    setBackgroundType('gradient');
                    setBackgroundValue('vibrant_orange_pink');
                    if (backgroundConfig.value.startsWith('blob:')) URL.revokeObjectURL(backgroundConfig.value);
                  }}
                >
                  <Cancel01Icon size={14} />
                </button>
              </div>
            )}

          {/* Solid Colors */}
          {backgroundConfig.type === 'solid' && (
            <div className="grid grid-cols-8 gap-1">
              {(Object.keys(solidColors) as SolidColorKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setBackgroundValue(key)}
                  className={cn(
                    'aspect-square rounded-md border-2 transition-all hover:scale-110',
                    backgroundConfig.value === key
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-border/30 hover:border-border'
                  )}
                  style={{ backgroundColor: solidColors[key] }}
                  title={key.replace(/_/g, ' ')}
                />
              ))}
            </div>
          )}

          {/* Category Tabs - Segmented Control */}
          <div className="relative flex p-0.5 bg-surface-1 dark:bg-surface-1/80 rounded-lg border border-border/30">
            {/* Sliding background indicator */}
            <div
              className="absolute top-0.5 bottom-0.5 bg-white dark:bg-surface-4 rounded-md shadow-sm transition-all duration-200 ease-out"
              style={{
                left: `calc(${availableCategories.indexOf(activeImageTab) * (100 / availableCategories.length)}% + 2px)`,
                width: `calc(${100 / availableCategories.length}% - 4px)`,
              }}
            />
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveImageTab(cat)}
                className={cn(
                  'relative z-10 flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors duration-150',
                  activeImageTab === cat
                    ? 'text-foreground'
                    : 'text-text-tertiary hover:text-text-secondary'
                )}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto scrollbar-hide">
            {(backgroundCategories[activeImageTab] || []).map((publicId: string, idx: number) => (
              <button
                key={`${activeImageTab}-${idx}`}
                onClick={() => {
                  setBackgroundValue(publicId);
                  setBackgroundType('image');
                }}
                className={cn(
                  'aspect-video rounded-md overflow-hidden border-2 transition-all hover:scale-105',
                  backgroundConfig.value === publicId
                    ? 'border-primary ring-1 ring-primary/30'
                    : 'border-border/30 hover:border-border'
                )}
              >
                <img
                  src={getCldImageUrl({ src: publicId, width: 120, height: 68, quality: 'auto', format: 'auto', crop: 'fill', gravity: 'auto' })}
                  alt={`${activeImageTab} ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Gradients */}
      <SectionWrapper title="Gradients" defaultOpen={false}>
        <div className="space-y-3">
          {/* Magic Gradients */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-text-muted">Magic</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={shuffleMagicGradient}
                className="h-6 px-2 text-[10px]"
              >
                <ShuffleIcon size={12} className="mr-1" />
                Shuffle
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(magicGradients) as MagicGradientKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setBackgroundType('gradient');
                    setBackgroundValue(`magic:${key}`);
                  }}
                  className={cn(
                    'h-8 rounded-md border-2 transition-all hover:scale-105',
                    backgroundConfig.value === `magic:${key}`
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-border/30 hover:border-border'
                  )}
                  style={{ background: magicGradients[key] }}
                />
              ))}
            </div>
          </div>

          {/* Regular Gradients */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-text-muted">Classic</span>
            <div className="grid grid-cols-6 gap-1 max-h-28 overflow-y-auto scrollbar-hide">
              {(Object.keys(gradientColors) as GradientKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setBackgroundType('gradient');
                    setBackgroundValue(key);
                  }}
                  className={cn(
                    'h-7 rounded-md border-2 transition-all hover:scale-110',
                    backgroundConfig.value === key
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-border/30 hover:border-border'
                  )}
                  style={{ background: gradientColors[key] }}
                />
              ))}
            </div>
          </div>

          {/* Mesh Gradients */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-text-muted">Mesh</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(meshGradients) as MeshGradientKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setBackgroundType('gradient');
                    setBackgroundValue(`mesh:${key}`);
                  }}
                  className={cn(
                    'h-10 rounded-md border-2 transition-all hover:scale-105',
                    backgroundConfig.value === `mesh:${key}`
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-border/30 hover:border-border'
                  )}
                  style={{ background: meshGradients[key] }}
                />
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>

    </>
  );
}

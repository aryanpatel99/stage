'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AspectRatioDropdown } from '@/components/aspect-ratio/aspect-ratio-dropdown';
import { TextOverlayControls } from '@/components/text-overlay/text-overlay-controls';
import { useImageStore } from '@/lib/store';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { gradientColors, type GradientKey } from '@/lib/constants/gradient-colors';
import { solidColors, type SolidColorKey } from '@/lib/constants/solid-colors';
import { Button } from '@/components/ui/button';
import { getCldImageUrl } from '@/lib/cloudinary';
import { cloudinaryPublicIds } from '@/lib/cloudinary-backgrounds';
import { useDropzone } from 'react-dropzone';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/lib/constants';
import { ImageSquare as ImageIcon, Crop, PaintBrush, TextT } from '@phosphor-icons/react';
import { aspectRatios } from '@/lib/constants/aspect-ratios';

export function StyleTabs() {
  const {
    backgroundConfig,
    borderRadius,
    backgroundBorderRadius,
    imageOpacity,
    imageScale,
    selectedAspectRatio,
    setBackgroundType,
    setBackgroundValue,
    setBackgroundOpacity,
    setBackgroundBlur,
    setBorderRadius,
    setBackgroundBorderRadius,
    setImageOpacity,
    setImageScale,
  } = useImageStore();

  const [bgUploadError, setBgUploadError] = React.useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `File type not supported. Please use: ${ALLOWED_IMAGE_TYPES.join(', ')}`;
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

  const { getRootProps: getBgRootProps, getInputProps: getBgInputProps, isDragActive: isBgDragActive } = useDropzone({
    onDrop: onBgDrop,
    accept: {
      'image/*': ALLOWED_IMAGE_TYPES.map((type) => type.split('/')[1]),
    },
    maxSize: MAX_IMAGE_SIZE,
    multiple: false,
  });

  return (
    <Tabs defaultValue="aspect" className="w-full">
      <TabsList className="grid w-full grid-cols-4 gap-1.5 bg-blue-50/50 p-1.5 rounded-lg">
        <TabsTrigger 
          value="aspect" 
          className="flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-600/20 data-[state=inactive]:hover:bg-blue-100/70 data-[state=inactive]:hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 text-gray-700"
          aria-label="Aspect Ratio"
        >
          Aspect
        </TabsTrigger>
        <TabsTrigger 
          value="background" 
          className="flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-600/20 data-[state=inactive]:hover:bg-blue-100/70 data-[state=inactive]:hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 text-gray-700"
          aria-label="Background"
        >
          Background
        </TabsTrigger>
        <TabsTrigger 
          value="image" 
          className="flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-600/20 data-[state=inactive]:hover:bg-blue-100/70 data-[state=inactive]:hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 text-gray-700"
          aria-label="Image"
        >
          Image
        </TabsTrigger>
        <TabsTrigger 
          value="text" 
          className="flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-600/20 data-[state=inactive]:hover:bg-blue-100/70 data-[state=inactive]:hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 text-gray-700"
          aria-label="Text"
        >
          Text
        </TabsTrigger>
      </TabsList>

      <TabsContent value="aspect" className="space-y-4 mt-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Aspect Ratio</Label>
          <AspectRatioDropdown />
          
          {/* Selected Aspect Ratio Display */}
          {selectedAspectRatio && (() => {
            const selectedRatio = aspectRatios.find((ar) => ar.id === selectedAspectRatio);
            if (!selectedRatio) return null;
            
            return (
              <div className="mt-3">
                <Label className="text-xs text-gray-600 mb-2 block">Selected</Label>
                <div
                  className="relative rounded-lg overflow-hidden border-2 border-blue-500 ring-2 ring-blue-500/20 bg-gradient-to-br from-gray-100 to-gray-200"
                  style={{
                    aspectRatio: `${selectedRatio.width} / ${selectedRatio.height}`,
                    maxHeight: '120px',
                  }}
                >
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white">
                    {selectedRatio.width}:{selectedRatio.height}
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-blue-600/90 to-transparent">
                    <div className="text-[10px] font-semibold text-white">
                      {selectedRatio.name}
                    </div>
                    {selectedRatio.useCase && (
                      <div className="text-[9px] mt-0.5 text-blue-100">
                        {selectedRatio.useCase}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </TabsContent>

      <TabsContent value="background" className="space-y-4 mt-4">
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Background Type</Label>
            <div className="flex gap-2">
              <Button
                variant={backgroundConfig.type === 'gradient' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBackgroundType('gradient')}
                className={`flex-1 text-xs transition-all ${
                  backgroundConfig.type === 'gradient'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                Gradient
              </Button>
              <Button
                variant={backgroundConfig.type === 'solid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBackgroundType('solid')}
                className={`flex-1 text-xs transition-all ${
                  backgroundConfig.type === 'solid'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                Solid
              </Button>
              <Button
                variant={backgroundConfig.type === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBackgroundType('image')}
                className={`flex-1 text-xs transition-all ${
                  backgroundConfig.type === 'image'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                Image
              </Button>
            </div>
          </div>

          {backgroundConfig.type === 'gradient' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Gradient</Label>
              <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {(Object.keys(gradientColors) as GradientKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setBackgroundValue(key)}
                    className={`h-16 rounded-md border-2 transition-all ${
                      backgroundConfig.value === key
                        ? 'border-blue-600 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    style={{
                      background: gradientColors[key],
                    }}
                    title={key.replace(/_/g, ' ')}
                  />
                ))}
              </div>
            </div>
          )}

          {backgroundConfig.type === 'solid' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Color</Label>
              <div className="grid grid-cols-4 gap-2.5">
                {(Object.keys(solidColors) as SolidColorKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setBackgroundValue(key)}
                    className={`h-10 rounded-md border-2 transition-all ${
                      backgroundConfig.value === key
                        ? 'border-blue-600 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    style={{
                      backgroundColor: solidColors[key],
                    }}
                    title={key.replace(/_/g, ' ')}
                  />
                ))}
              </div>
            </div>
          )}

          {backgroundConfig.type === 'image' && (
            <div className="space-y-4">
              {cloudinaryPublicIds.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Preset Backgrounds</Label>
                  <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {cloudinaryPublicIds.map((publicId, idx) => {
                      const thumbnailUrl = getCldImageUrl({
                        src: publicId,
                        width: 300,
                        height: 200,
                        quality: 'auto',
                        format: 'auto',
                        crop: 'fill',
                        gravity: 'auto',
                      });

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setBackgroundValue(publicId);
                            setBackgroundType('image');
                          }}
                          className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                            backgroundConfig.value === publicId
                              ? 'border-blue-600 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          title={`Use background ${idx + 1}`}
                        >
                          <img
                            src={thumbnailUrl}
                            alt={`Background ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-sm font-medium">Upload Background Image</Label>
                <div
                  {...getBgRootProps()}
                  className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                    isBgDragActive
                      ? 'border-blue-600 bg-blue-50 scale-[1.02]'
                      : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                >
                  <input {...getBgInputProps()} />
                  <div className={`mb-3 transition-colors flex items-center justify-center w-full ${isBgDragActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    <ImageIcon size={40} weight="duotone" />
                  </div>
                  {isBgDragActive ? (
                    <p className="text-sm font-medium text-blue-600 text-center">Drop the image here...</p>
                  ) : (
                    <div className="space-y-1 text-center">
                      <p className="text-xs font-medium text-gray-700">
                        Drag & drop an image here
                      </p>
                      <p className="text-xs text-gray-500">
                        or click to browse • PNG, JPG, WEBP up to {MAX_IMAGE_SIZE / 1024 / 1024}MB
                      </p>
                    </div>
                  )}
                </div>
                {bgUploadError && (
                  <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2">
                    {bgUploadError}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Image URL</Label>
                <input
                  type="text"
                  value={typeof backgroundConfig.value === 'string' && !cloudinaryPublicIds.includes(backgroundConfig.value) ? backgroundConfig.value : ''}
                  onChange={(e) => setBackgroundValue(e.target.value)}
                  placeholder="Enter image URL"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Background Blur</Label>
                  <span className="text-sm text-muted-foreground">
                    {backgroundConfig.blur || 0}px
                  </span>
                </div>
                <Slider
                  value={[backgroundConfig.blur || 0]}
                  onValueChange={(value) => setBackgroundBlur(value[0])}
                  min={0}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Adjust the blur intensity for the background image
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium">Border Radius</Label>
            <div className="flex gap-2 mb-3">
              <Button
                variant={backgroundBorderRadius === 0 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBackgroundBorderRadius(0)}
                className={`flex-1 text-xs transition-all ${
                  backgroundBorderRadius === 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                Sharp Edge
              </Button>
              <Button
                variant={backgroundBorderRadius > 0 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBackgroundBorderRadius(24)}
                className={`flex-1 text-xs transition-all ${
                  backgroundBorderRadius > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                Rounded
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Border Radius</Label>
              <span className="text-sm text-muted-foreground">{backgroundBorderRadius}px</span>
            </div>
            <Slider
              value={[backgroundBorderRadius]}
              onValueChange={(value) => setBackgroundBorderRadius(value[0])}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Opacity</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round((backgroundConfig.opacity || 1) * 100)}%
              </span>
            </div>
            <Slider
              value={[backgroundConfig.opacity || 1]}
              onValueChange={(value) => setBackgroundOpacity(value[0])}
              min={0}
              max={1}
              step={0.01}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="image" className="space-y-4 mt-4">
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Border Radius</Label>
            <div className="flex gap-2 mb-3">
              <Button
                variant={borderRadius === 0 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBorderRadius(0)}
                className={`flex-1 text-xs transition-all ${
                  borderRadius === 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                Sharp Edge
              </Button>
              <Button
                variant={borderRadius > 0 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBorderRadius(24)}
                className={`flex-1 text-xs transition-all ${
                  borderRadius > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                Rounded
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Border Radius</Label>
              <span className="text-sm text-muted-foreground">{borderRadius}px</span>
            </div>
            <Slider
              value={[borderRadius]}
              onValueChange={(value) => setBorderRadius(value[0])}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Image Size</Label>
              <span className="text-sm text-muted-foreground">
                {imageScale}%
              </span>
            </div>
            <Slider
              value={[imageScale]}
              onValueChange={(value) => setImageScale(value[0])}
              min={10}
              max={200}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Adjust the size of the image (10% - 200%)
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Image Opacity</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(imageOpacity * 100)}%
              </span>
            </div>
            <Slider
              value={[imageOpacity]}
              onValueChange={(value) => setImageOpacity(value[0])}
              min={0}
              max={1}
              step={0.01}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="text" className="mt-4">
        <TextOverlayControls />
      </TabsContent>
    </Tabs>
  );
}

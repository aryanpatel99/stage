'use client';

import { Layer, Group, Image as KonvaImage, Transformer, Rect } from 'react-konva';
import Konva from 'konva';
import { useRef, useEffect, useMemo } from 'react';
import { FrameRenderer } from '../frames/FrameRenderer';
import { getShadowProps, type ShadowConfig } from '../utils/shadow-utils';
import type { FrameConfig } from '../frames/FrameRenderer';
import { useImageStore, type ImageFilters } from '@/lib/store';

// Frame types that apply shadow directly to the image (no solid background)
const DIRECT_IMAGE_SHADOW_FRAMES = new Set(['none', 'arc-light', 'arc-dark']);

interface MainImageLayerProps {
  image: HTMLImageElement;
  canvasW: number;
  canvasH: number;
  framedW: number;
  framedH: number;
  frameOffset: number;
  windowPadding: number;
  windowHeader: number;
  eclipseBorder: number;
  imageScaledW: number;
  imageScaledH: number;
  screenshot: {
    offsetX: number;
    offsetY: number;
    rotation: number;
    radius: number;
    scale: number;
  };
  frame: FrameConfig;
  shadow: ShadowConfig;
  showFrame: boolean;
  has3DTransform: boolean;
  imageOpacity: number;
  isMainImageSelected: boolean;
  setIsMainImageSelected: (selected: boolean) => void;
  setSelectedOverlayId: (id: string | null) => void;
  setSelectedTextId: (id: string | null) => void;
  setScreenshot: (updates: Partial<MainImageLayerProps['screenshot']>) => void;
}

export function MainImageLayer({
  image,
  canvasW,
  canvasH,
  framedW,
  framedH,
  frameOffset,
  windowPadding,
  windowHeader,
  eclipseBorder,
  imageScaledW,
  imageScaledH,
  screenshot,
  frame,
  shadow,
  showFrame,
  has3DTransform,
  imageOpacity,
  isMainImageSelected,
  setIsMainImageSelected,
  setSelectedOverlayId,
  setSelectedTextId,
  setScreenshot,
}: MainImageLayerProps) {
  const groupRef = useRef<Konva.Group>(null);
  const mainImageRef = useRef<Konva.Image>(null);
  const mainImageTransformerRef = useRef<Konva.Transformer>(null);
  const { imageScale, setImageScale, imageFilters } = useImageStore();

  // Memoize shadow props to avoid recalculation on every render
  const shadowProps = useMemo(() => getShadowProps(shadow), [shadow]);

  // Determine if shadow should be applied directly to the image
  const imageShadowProps = useMemo(() => {
    if (!frame.enabled || DIRECT_IMAGE_SHADOW_FRAMES.has(frame.type)) {
      return shadowProps;
    }
    return {};
  }, [frame.enabled, frame.type, shadowProps]);

  // Build filters array based on active filters
  const activeFilters = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: any[] = [];

    // Brightness filter (Konva uses -1 to 1, we use 0-200 where 100 is normal)
    if (imageFilters.brightness !== 100) {
      filters.push(Konva.Filters.Brighten);
    }

    // Contrast filter
    if (imageFilters.contrast !== 100) {
      filters.push(Konva.Filters.Contrast);
    }

    // Grayscale filter (using HSL)
    if (imageFilters.grayscale > 0 || imageFilters.hueRotate !== 0 || imageFilters.saturate !== 100) {
      filters.push(Konva.Filters.HSL);
    }

    // Blur filter
    if (imageFilters.blur > 0) {
      filters.push(Konva.Filters.Blur);
    }

    // Invert filter
    if (imageFilters.invert > 0) {
      filters.push(Konva.Filters.Invert);
    }

    // Sepia filter
    if (imageFilters.sepia > 0) {
      filters.push(Konva.Filters.Sepia);
    }

    return filters;
  }, [imageFilters]);

  // Apply filter values to the image node
  useEffect(() => {
    const node = mainImageRef.current;
    if (!node) return;

    // Set brightness (-1 to 1, where 0 is normal)
    node.brightness((imageFilters.brightness - 100) / 100);

    // Set contrast (-100 to 100, where 0 is normal)
    node.contrast(imageFilters.contrast - 100);

    // Calculate effective saturation combining saturate and grayscale
    // grayscale: 0-100 (0 = no effect, 100 = full grayscale)
    // saturate: 0-200 (0 = no saturation, 100 = normal, 200 = double)
    // Konva saturation: -1 to 1+ (negative = desaturate, 0 = normal, positive = oversaturate)
    const baseSaturation = (imageFilters.saturate - 100) / 100;
    const grayscaleEffect = imageFilters.grayscale / 100; // 0 to 1
    // When grayscale is 100, saturation should be -1 (fully desaturated)
    // Combine: reduce saturation towards -1 based on grayscale amount
    const effectiveSaturation = baseSaturation - grayscaleEffect * (1 + baseSaturation);
    node.saturation(Math.max(-1, effectiveSaturation));

    // Set hue rotation (0-360)
    node.hue(imageFilters.hueRotate);

    // Set blur radius
    node.blurRadius(imageFilters.blur);

    // Cache the node for filters to work
    if (activeFilters.length > 0) {
      node.cache();
    } else {
      node.clearCache();
    }

    node.getLayer()?.batchDraw();
  }, [imageFilters, activeFilters]);

  useEffect(() => {
    if (mainImageTransformerRef.current) {
      if (isMainImageSelected && groupRef.current) {
        mainImageTransformerRef.current.nodes([groupRef.current]);
      } else {
        mainImageTransformerRef.current.nodes([]);
      }
      groupRef.current?.getLayer()?.batchDraw();
    }
  }, [isMainImageSelected]);

  return (
    <Layer>
      <Group
        ref={groupRef}
        x={canvasW / 2 + screenshot.offsetX}
        y={canvasH / 2 + screenshot.offsetY}
        width={framedW}
        height={framedH}
        offsetX={framedW / 2}
        offsetY={framedH / 2}
        rotation={screenshot.rotation}
        draggable={true}
        onDragEnd={(e) => {
          const node = e.target;
          const newOffsetX = node.x() - canvasW / 2;
          const newOffsetY = node.y() - canvasH / 2;
          if (typeof setScreenshot === 'function') {
            setScreenshot({ offsetX: newOffsetX, offsetY: newOffsetY });
          }
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          const finalScale = (scaleX + scaleY) / 2;

          const rawNewScale = imageScale * finalScale;

          // Round to nearest integer and clamp between 10 and 200
          const newImageScale = Math.min(Math.max(Math.round(rawNewScale), 10), 200);

          setImageScale(newImageScale);

          setScreenshot({ scale: newImageScale / 100 });

          // Reset the node's scale to 1 so that the image won't jump on re-render.
          node.scaleX(1);
          node.scaleY(1);
        }}
      >
        <FrameRenderer
          frame={frame}
          showFrame={showFrame}
          framedW={framedW}
          framedH={framedH}
          frameOffset={frameOffset}
          windowPadding={windowPadding}
          windowHeader={windowHeader}
          eclipseBorder={eclipseBorder}
          imageScaledW={imageScaledW}
          imageScaledH={imageScaledH}
          screenshotRadius={screenshot.radius}
          shadowProps={shadowProps}
          has3DTransform={has3DTransform}
        />

        {/* Arc frame border - rendered BEFORE image so image covers inner overlap */}
        {showFrame && !has3DTransform && (frame.type === 'arc-light' || frame.type === 'arc-dark') && (() => {
          const strokeWidth = frame.width || 6;
          const halfStroke = strokeWidth / 2;
          return (
            <Rect
              x={frameOffset + windowPadding - halfStroke}
              y={frameOffset + windowPadding + windowHeader - halfStroke}
              width={imageScaledW + strokeWidth}
              height={imageScaledH + strokeWidth}
              stroke={frame.type === 'arc-light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.7)'}
              strokeWidth={strokeWidth}
              cornerRadius={screenshot.radius + halfStroke}
              fillEnabled={false}
              listening={false}
            />
          );
        })()}

        <KonvaImage
          ref={mainImageRef}
          image={image}
          x={frameOffset + windowPadding}
          y={frameOffset + windowPadding + windowHeader}
          width={imageScaledW}
          height={imageScaledH}
          opacity={has3DTransform ? 0 : imageOpacity}
          cornerRadius={
            frame.type === 'macos-light' ||
            frame.type === 'macos-dark' ||
            frame.type === 'windows-light' ||
            frame.type === 'windows-dark'
              ? [0, 0, screenshot.radius, screenshot.radius]
              : screenshot.radius
          }
          filters={activeFilters.length > 0 ? activeFilters : undefined}
          imageSmoothingEnabled={false}
          draggable={false}
          onClick={(e) => {
            e.cancelBubble = true;
            setIsMainImageSelected(true);
            setSelectedOverlayId(null);
            setSelectedTextId(null);
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            setIsMainImageSelected(true);
            setSelectedOverlayId(null);
            setSelectedTextId(null);
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) {
              container.style.cursor = 'move';
            }
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) {
              container.style.cursor = 'default';
            }
          }}
          {...imageShadowProps}
        />

      </Group>
      <Transformer
        ref={mainImageTransformerRef}
        keepRatio={true}
        boundBoxFunc={(oldBox, newBox) => {
          if (
            Math.abs(newBox.width) < 50 ||
            Math.abs(newBox.height) < 50
          ) {
            return oldBox;
          }
          return newBox;
        }}
      />
    </Layer>
  );
}


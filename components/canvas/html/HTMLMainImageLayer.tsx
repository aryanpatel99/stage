'use client';

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { type ShadowConfig } from '../utils/shadow-utils';
import { type ImageFilters } from '@/lib/store';

export interface FrameConfig {
  enabled: boolean;
  type: 'none' | 'arc-light' | 'arc-dark' | 'macos-light' | 'macos-dark' | 'windows-light' | 'windows-dark' | 'photograph';
  width: number;
  color: string;
  padding?: number;
  title?: string;
}

interface HTMLMainImageLayerProps {
  image: HTMLImageElement;
  canvasW: number;
  canvasH: number;
  framedW: number;
  framedH: number;
  frameOffset: number;
  windowPadding: number;
  windowHeader: number;
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
  imageOpacity: number;
  imageFilters?: ImageFilters;
  isMainImageSelected: boolean;
  setIsMainImageSelected: (selected: boolean) => void;
  setSelectedOverlayId: (id: string | null) => void;
  setSelectedTextId: (id: string | null) => void;
  setScreenshot: (updates: Partial<HTMLMainImageLayerProps['screenshot']>) => void;
}

/**
 * Builds CSS filter string from imageFilters
 */
function buildImageFilter(imageFilters?: ImageFilters): string | undefined {
  if (!imageFilters) return undefined;

  const filters: string[] = [];

  if (imageFilters.brightness !== 100) {
    filters.push(`brightness(${imageFilters.brightness / 100})`);
  }
  if (imageFilters.contrast !== 100) {
    filters.push(`contrast(${imageFilters.contrast / 100})`);
  }
  if (imageFilters.saturate !== 100) {
    filters.push(`saturate(${imageFilters.saturate / 100})`);
  }
  if (imageFilters.grayscale > 0) {
    filters.push(`grayscale(${imageFilters.grayscale / 100})`);
  }
  if (imageFilters.sepia > 0) {
    filters.push(`sepia(${imageFilters.sepia / 100})`);
  }
  if (imageFilters.hueRotate !== 0) {
    filters.push(`hue-rotate(${imageFilters.hueRotate}deg)`);
  }
  if (imageFilters.blur > 0) {
    filters.push(`blur(${imageFilters.blur}px)`);
  }
  if (imageFilters.invert > 0) {
    filters.push(`invert(${imageFilters.invert / 100})`);
  }

  return filters.length > 0 ? filters.join(' ') : undefined;
}

/**
 * Builds CSS box-shadow string from shadow config.
 */
function buildBoxShadow(shadow: ShadowConfig): string {
  if (!shadow.enabled) return 'none';

  const { elevation, softness, color, intensity, offsetX, offsetY } = shadow;

  // Parse shadow color
  let r = 0, g = 0, b = 0;
  const colorMatch = color.match(/rgba?\(([^)]+)\)/);

  if (colorMatch) {
    const parts = colorMatch[1].split(',').map(s => s.trim());
    r = parseInt(parts[0]) || 0;
    g = parseInt(parts[1]) || 0;
    b = parseInt(parts[2]) || 0;
  } else if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    r = parseInt(hex.slice(0, 2), 16) || 0;
    g = parseInt(hex.slice(2, 4), 16) || 0;
    b = parseInt(hex.slice(4, 6), 16) || 0;
  }

  // Darken color for shadow
  const shadowR = Math.floor(r * 0.3);
  const shadowG = Math.floor(g * 0.3);
  const shadowB = Math.floor(b * 0.3);

  // Calculate offsets
  const diag = elevation * 0.707;
  const x = offsetX ?? diag;
  const y = offsetY ?? diag;

  // Use same blur and intensity as Konva shadow
  const effectiveBlur = Math.max(softness, 12);
  const effectiveIntensity = Math.min(1, Math.max(0.4, intensity * 1.5));

  // Create multi-layer shadow
  const shadows = [
    `rgba(${shadowR}, ${shadowG}, ${shadowB}, ${effectiveIntensity}) ${x}px ${y}px ${effectiveBlur}px`,
    `rgba(${shadowR}, ${shadowG}, ${shadowB}, ${effectiveIntensity * 0.5}) ${x * 1.5}px ${y * 1.5}px ${effectiveBlur * 2}px`,
  ];

  return shadows.join(', ');
}

/**
 * HTML/CSS-based main image layer that replaces Konva MainImageLayer.
 * Renders the main image with frames, shadows, and filters.
 */
export function HTMLMainImageLayer({
  image,
  canvasW,
  canvasH,
  framedW,
  framedH,
  frameOffset,
  windowPadding,
  windowHeader,
  imageScaledW,
  imageScaledH,
  screenshot,
  frame,
  shadow,
  showFrame,
  imageOpacity,
  imageFilters,
  isMainImageSelected,
  setIsMainImageSelected,
  setSelectedOverlayId,
  setSelectedTextId,
  setScreenshot,
}: HTMLMainImageLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageFilter = useMemo(() => buildImageFilter(imageFilters), [imageFilters]);
  const boxShadow = useMemo(() => buildBoxShadow(shadow), [shadow]);

  const isDark = frame.type.includes('dark');
  const isArcFrame = frame.type === 'arc-light' || frame.type === 'arc-dark';
  const isMacFrame = frame.type === 'macos-light' || frame.type === 'macos-dark';
  const isWinFrame = frame.type === 'windows-light' || frame.type === 'windows-dark';
  const isPolaroid = frame.type === 'photograph';

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - screenshot.offsetX,
      y: e.clientY - screenshot.offsetY,
    });
    setIsMainImageSelected(true);
    setSelectedOverlayId(null);
    setSelectedTextId(null);
  }, [screenshot.offsetX, screenshot.offsetY, setIsMainImageSelected, setSelectedOverlayId, setSelectedTextId]);

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newOffsetX = e.clientX - dragStart.x;
      const newOffsetY = e.clientY - dragStart.y;
      setScreenshot({ offsetX: newOffsetX, offsetY: newOffsetY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, setScreenshot]);

  // Calculate position
  const centerX = canvasW / 2 + screenshot.offsetX;
  const centerY = canvasH / 2 + screenshot.offsetY;
  const left = centerX - framedW / 2;
  const top = centerY - framedH / 2;

  // Image border radius based on frame type
  const getImageBorderRadius = () => {
    if (isMacFrame || isWinFrame) {
      return `0 0 ${screenshot.radius}px ${screenshot.radius}px`;
    }
    return `${screenshot.radius}px`;
  };

  // Arc frame styles
  const arcBorderWidth = 8;
  const arcBorderColor = frame.type === 'arc-light'
    ? 'rgba(255, 255, 255, 0.5)'
    : 'rgba(0, 0, 0, 0.7)';

  // Render macOS title bar
  const renderMacOSTitleBar = () => (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '22px',
        background: isDark ? 'rgb(40, 40, 43)' : '#e8e8e8',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        zIndex: 2,
      }}
    >
      {/* Traffic lights */}
      <div style={{ display: 'flex', gap: '5px', zIndex: 2 }}>
        <span style={{ height: '6px', width: '6px', borderRadius: '50%', backgroundColor: 'rgb(255, 95, 87)' }} />
        <span style={{ height: '6px', width: '6px', borderRadius: '50%', backgroundColor: 'rgb(254, 188, 46)' }} />
        <span style={{ height: '6px', width: '6px', borderRadius: '50%', backgroundColor: 'rgb(40, 201, 65)' }} />
      </div>
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          left: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <span
          style={{
            color: isDark ? 'rgb(159, 159, 159)' : '#4d4d4d',
            fontSize: '10px',
            fontWeight: 500,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '-0.2px',
          }}
        >
          {frame.title || 'file'}
        </span>
      </div>
    </div>
  );

  // Render Windows title bar
  const renderWindowsTitleBar = () => (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '28px',
        backgroundColor: isDark ? '#2d2d2d' : '#f3f3f3',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px 0 16px',
        zIndex: 2,
      }}
    >
      <div style={{ color: isDark ? '#ffffff' : '#1a1a1a', fontSize: '13px' }}>
        {frame.title || ''}
      </div>
      <div style={{ display: 'flex', gap: '0' }}>
        {/* Minimize */}
        <div style={{ width: '46px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '12px', height: '1px', backgroundColor: isDark ? '#ffffff' : '#1a1a1a' }} />
        </div>
        {/* Maximize */}
        <div style={{ width: '46px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '12px', height: '12px', border: `1px solid ${isDark ? '#ffffff' : '#1a1a1a'}`, boxSizing: 'border-box' }} />
        </div>
        {/* Close */}
        <div style={{ width: '46px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '12px', height: '12px' }}>
            <div style={{ position: 'absolute', width: '16px', height: '1px', backgroundColor: isDark ? '#ffffff' : '#1a1a1a', transform: 'rotate(45deg)', top: '5px', left: '-2px' }} />
            <div style={{ position: 'absolute', width: '16px', height: '1px', backgroundColor: isDark ? '#ffffff' : '#1a1a1a', transform: 'rotate(-45deg)', top: '5px', left: '-2px' }} />
          </div>
        </div>
      </div>
    </div>
  );

  // Get frame container styles based on frame type
  const getFrameContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'relative',
      width: `${framedW}px`,
      height: `${framedH}px`,
      borderRadius: '8px',
      overflow: 'hidden',
    };

    if (isArcFrame) {
      return {
        ...baseStyle,
        border: `${arcBorderWidth}px solid ${arcBorderColor}`,
        borderRadius: `${screenshot.radius}px`,
        boxShadow: boxShadow,
      };
    }

    if (isMacFrame) {
      return {
        ...baseStyle,
        backgroundColor: isDark ? 'rgb(30, 30, 33)' : '#f5f5f5',
        boxShadow: boxShadow,
      };
    }

    if (isWinFrame) {
      return {
        ...baseStyle,
        backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
        boxShadow: boxShadow,
      };
    }

    if (isPolaroid) {
      return {
        ...baseStyle,
        backgroundColor: 'white',
        padding: '8px 8px 24px 8px',
        boxShadow: boxShadow,
      };
    }

    // No frame - apply shadow directly to image container
    return {
      ...baseStyle,
      borderRadius: `${screenshot.radius}px`,
      boxShadow: showFrame ? 'none' : boxShadow,
    };
  };

  // Get image container styles
  const getImageContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: `${imageScaledW}px`,
      height: `${imageScaledH}px`,
      overflow: 'hidden',
    };

    if (isArcFrame) {
      return {
        ...baseStyle,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: `${Math.max(0, screenshot.radius - arcBorderWidth)}px`,
      };
    }

    if (isMacFrame) {
      return {
        ...baseStyle,
        left: `${windowPadding}px`,
        top: `${windowHeader}px`,
        borderRadius: getImageBorderRadius(),
      };
    }

    if (isWinFrame) {
      return {
        ...baseStyle,
        left: `${windowPadding}px`,
        top: `${windowHeader}px`,
        borderRadius: getImageBorderRadius(),
      };
    }

    if (isPolaroid) {
      return {
        ...baseStyle,
        top: '8px',
        left: '8px',
        width: `calc(100% - 16px)`,
        height: `calc(100% - 32px)`,
        borderRadius: `${screenshot.radius}px`,
      };
    }

    // No frame
    return {
      ...baseStyle,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: `${screenshot.radius}px`,
      boxShadow: boxShadow,
    };
  };

  return (
    <div
      ref={containerRef}
      data-main-image-layer="true"
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${framedW}px`,
        height: `${framedH}px`,
        transform: `rotate(${screenshot.rotation}deg) scale(${screenshot.scale})`,
        transformOrigin: 'center center',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 10,
        outline: isMainImageSelected ? '2px solid rgba(59, 130, 246, 0.5)' : 'none',
        outlineOffset: '2px',
      }}
    >
      {/* Frame container */}
      <div style={getFrameContainerStyle()}>
        {/* macOS title bar */}
        {showFrame && isMacFrame && renderMacOSTitleBar()}

        {/* Windows title bar */}
        {showFrame && isWinFrame && renderWindowsTitleBar()}

        {/* Image container */}
        <div style={getImageContainerStyle()}>
          <img
            src={image.src}
            alt="Main image"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: imageOpacity,
              filter: imageFilter,
              display: 'block',
              borderRadius: 'inherit',
            }}
          />
        </div>
      </div>
    </div>
  );
}

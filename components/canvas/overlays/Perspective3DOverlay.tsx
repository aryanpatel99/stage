'use client';

import { Frame3DOverlay, getFrameImageStyle, type FrameConfig } from '../frames/Frame3DOverlay';
import { type ShadowConfig } from '../utils/shadow-utils';
import { type ImageFilters } from '@/lib/store';

export interface Perspective3DConfig {
  perspective: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  translateX: number;
  translateY: number;
  scale: number;
}

interface Perspective3DOverlayProps {
  has3DTransform: boolean;
  perspective3D: Perspective3DConfig;
  screenshot: {
    rotation: number;
    radius: number;
  };
  shadow: ShadowConfig;
  frame: FrameConfig;
  showFrame: boolean;
  framedW: number;
  framedH: number;
  frameOffset: number;
  windowPadding: number;
  windowHeader: number;
  eclipseBorder: number;
  imageScaledW: number;
  imageScaledH: number;
  groupCenterX: number;
  groupCenterY: number;
  canvasW: number;
  canvasH: number;
  image: HTMLImageElement;
  imageOpacity: number;
  imageFilters?: ImageFilters;
}

export function Perspective3DOverlay({
  has3DTransform,
  perspective3D,
  screenshot,
  shadow,
  frame,
  showFrame,
  framedW,
  framedH,
  frameOffset,
  windowPadding,
  windowHeader,
  eclipseBorder,
  imageScaledW,
  imageScaledH,
  groupCenterX,
  groupCenterY,
  canvasW,
  canvasH,
  image,
  imageOpacity,
  imageFilters,
}: Perspective3DOverlayProps) {
  if (!has3DTransform) return null;

  // Build CSS filter string from imageFilters
  const buildImageFilter = () => {
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
  };

  const imageFilterStyle = buildImageFilter();

  const perspective3DTransform = `
    translate(${perspective3D.translateX}%, ${perspective3D.translateY}%)
    scale(${perspective3D.scale})
    rotateX(${perspective3D.rotateX}deg)
    rotateY(${perspective3D.rotateY}deg)
    rotateZ(${perspective3D.rotateZ + screenshot.rotation}deg)
  `
    .replace(/\s+/g, ' ')
    .trim();

  // Parse shadow color and extract RGB values
  const colorMatch = shadow.color.match(/rgba?\(([^)]+)\)/)
  let r = 0, g = 0, b = 0;
  let shadowOpacity = shadow.intensity || 0.5;

  if (colorMatch) {
    const parts = colorMatch[1].split(',').map(s => s.trim())
    r = parseInt(parts[0]) || 0;
    g = parseInt(parts[1]) || 0;
    b = parseInt(parts[2]) || 0;
    if (parts.length === 4) {
      shadowOpacity = parseFloat(parts[3]) || shadow.intensity;
    }
  } else if (shadow.color.startsWith('#')) {
    const hex = shadow.color.replace('#', '')
    r = parseInt(hex.slice(0, 2), 16) || 0;
    g = parseInt(hex.slice(2, 4), 16) || 0;
    b = parseInt(hex.slice(4, 6), 16) || 0;
  }

  // Build multi-layer shadow for realistic depth effect
  // Heavy on right and bottom, light on top and left
  const buildShadowFilter = () => {
    const baseBlur = shadow.enabled ? (shadow.softness || 25) : 20;
    const baseOffset = shadow.enabled ? (shadow.elevation || 15) : 12;

    // Always use dark shadow colors for visibility, but allow custom colors to tint
    const useCustomColor = shadow.enabled && (r > 0 || g > 0 || b > 0) && !(r === 0 && g === 0 && b === 0);

    // For dark shadows, use black with high opacity
    // If custom color, blend it with black for better visibility
    const shadowR = useCustomColor ? Math.floor(r * 0.3) : 0;
    const shadowG = useCustomColor ? Math.floor(g * 0.3) : 0;
    const shadowB = useCustomColor ? Math.floor(b * 0.3) : 0;

    // Create layered shadows for depth - using dark colors
    const shadows = [
      // Primary shadow - heavy on bottom-right (darkest)
      `drop-shadow(${baseOffset}px ${baseOffset * 1.2}px ${baseBlur}px rgba(${shadowR}, ${shadowG}, ${shadowB}, 0.5))`,
      // Secondary shadow - medium spread
      `drop-shadow(${baseOffset * 0.5}px ${baseOffset * 0.8}px ${baseBlur * 1.5}px rgba(${shadowR}, ${shadowG}, ${shadowB}, 0.35))`,
      // Ambient shadow - soft, larger spread
      `drop-shadow(${baseOffset * 0.2}px ${baseOffset * 0.4}px ${baseBlur * 2.5}px rgba(0, 0, 0, 0.25))`,
    ];

    return shadows.join(' ');
  };

  const shadowFilter = buildShadowFilter();

  return (
    <div
      data-3d-overlay="true"
      data-untransformed-x={groupCenterX - framedW / 2}
      data-untransformed-y={groupCenterY - framedH / 2}
      data-untransformed-width={framedW}
      data-untransformed-height={framedH}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: `${canvasW}px`,
        height: `${canvasH}px`,
        perspective: `${perspective3D.perspective}px`,
        transformStyle: 'preserve-3d',
        zIndex: 15,
        pointerEvents: 'none',
        overflow: 'hidden',
        clipPath: `inset(0 0 0 0)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: `${groupCenterX - framedW / 2}px`,
          top: `${groupCenterY - framedH / 2}px`,
          width: `${framedW}px`,
          height: `${framedH}px`,
          transform: perspective3DTransform,
          transformOrigin: 'center center',
          willChange: 'transform',
          transition: 'transform 0.125s linear',
          filter: shadowFilter,
          opacity: 1,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          <Frame3DOverlay
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
          />

          <img
            src={image.src}
            alt="3D transformed"
            style={{
              position: 'absolute',
              left: `${frameOffset + windowPadding}px`,
              top: `${frameOffset + windowPadding + windowHeader}px`,
              width: `${imageScaledW}px`,
              height: `${imageScaledH}px`,
              objectFit: 'cover',
              opacity: imageOpacity,
              filter: imageFilterStyle,
              borderRadius:
                showFrame && (frame.type === 'macos-light' || frame.type === 'macos-dark' || frame.type === 'windows-light' || frame.type === 'windows-dark')
                  ? `0 0 ${screenshot.radius}px ${screenshot.radius}px`
                  : `${screenshot.radius}px`,
              // Apply frame border directly to image (arc, polaroid)
              ...(showFrame && getFrameImageStyle(frame, screenshot.radius)),
            }}
          />
        </div>
      </div>
    </div>
  );
}


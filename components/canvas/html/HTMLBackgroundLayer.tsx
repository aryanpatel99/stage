'use client';

import { useMemo } from 'react';
import { getBackgroundCSS, type BackgroundConfig } from '@/lib/constants/backgrounds';

interface HTMLBackgroundLayerProps {
  backgroundConfig: BackgroundConfig;
  backgroundBlur: number;
  backgroundBorderRadius: number;
  width: number;
  height: number;
  noiseTexture: HTMLCanvasElement | null;
  backgroundNoise: number;
}

/**
 * HTML/CSS-based background layer that replaces Konva BackgroundLayer.
 * Renders backgrounds (solid, gradient, image) with blur and noise support.
 */
export function HTMLBackgroundLayer({
  backgroundConfig,
  backgroundBlur,
  backgroundBorderRadius,
  width,
  height,
  noiseTexture,
  backgroundNoise,
}: HTMLBackgroundLayerProps) {
  // Get background CSS from config
  const backgroundStyle = useMemo(
    () => getBackgroundCSS(backgroundConfig),
    [backgroundConfig]
  );

  // Convert noise canvas to data URL
  const noiseDataUrl = useMemo(() => {
    if (!noiseTexture || backgroundNoise <= 0) return null;
    try {
      return noiseTexture.toDataURL('image/png');
    } catch {
      return null;
    }
  }, [noiseTexture, backgroundNoise]);

  return (
    <>
      {/* Background layer */}
      <div
        id="canvas-background"
        style={{
          position: 'absolute',
          inset: 0,
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${backgroundBorderRadius}px`,
          overflow: 'hidden',
          // Apply background styles
          ...backgroundStyle,
          // Apply blur filter
          filter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
          // Ensure proper stacking
          zIndex: 0,
        }}
      />

      {/* Noise overlay */}
      {noiseDataUrl && backgroundNoise > 0 && (
        <div
          id="canvas-noise-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            width: `${width}px`,
            height: `${height}px`,
            borderRadius: `${backgroundBorderRadius}px`,
            backgroundImage: `url(${noiseDataUrl})`,
            backgroundRepeat: 'repeat',
            opacity: backgroundNoise / 100,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
    </>
  );
}

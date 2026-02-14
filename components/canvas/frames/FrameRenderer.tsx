'use client';

import { Rect, Group, Circle, Text, Line } from 'react-konva';
import { ShadowProps } from '../utils/shadow-utils';

export interface FrameConfig {
  enabled: boolean;
  type: 'none' | 'arc-light' | 'arc-dark' | 'macos-light' | 'macos-dark' | 'windows-light' | 'windows-dark' | 'photograph';
  width: number;
  color: string;
  padding?: number;
  title?: string;
}

interface FrameRendererProps {
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
  screenshotRadius: number;
  shadowProps: ShadowProps | Record<string, never>;
  has3DTransform: boolean;
}

// Enhanced shadow props for better visibility
function getEnhancedShadow(shadowProps: ShadowProps | Record<string, never>): ShadowProps {
  return {
    shadowColor: shadowProps.shadowColor || 'rgba(0, 0, 0, 1)',
    shadowBlur: Math.max(shadowProps.shadowBlur || 20, 20),
    shadowOffsetX: shadowProps.shadowOffsetX ?? 8,
    shadowOffsetY: shadowProps.shadowOffsetY ?? 12,
    shadowOpacity: Math.max(shadowProps.shadowOpacity || 0.5, 0.5),
  };
}

export function FrameRenderer({
  frame,
  showFrame,
  framedW,
  framedH,
  screenshotRadius,
  shadowProps,
  has3DTransform,
}: FrameRendererProps) {
  if (!showFrame || frame.type === 'none' || has3DTransform) {
    return null;
  }

  const isDark = frame.type.includes('dark');
  const enhancedShadow = getEnhancedShadow(shadowProps);

  switch (frame.type) {
    case 'arc-light':
    case 'arc-dark':
      // Arc frames: return null - shadow is applied directly to the image in MainImageLayer
      // The border is also rendered in MainImageLayer on top of the image
      return null;

    case 'macos-light':
    case 'macos-dark': {
      // macOS style: full frame background with shadow + title bar
      const titleBarHeight = 22;
      return (
        <Group>
          {/* Full frame background with shadow */}
          <Rect
            x={0}
            y={0}
            width={framedW}
            height={framedH}
            fill={isDark ? 'rgb(30, 30, 33)' : '#f5f5f5'}
            cornerRadius={8}
            {...enhancedShadow}
          />
          {/* Title bar background */}
          <Rect
            width={framedW}
            height={titleBarHeight}
            fill={isDark ? 'rgb(40, 40, 43)' : '#e8e8e8'}
            cornerRadius={[8, 8, 0, 0]}
          />
          {/* Traffic lights - small dots (6px diameter, 3px radius) */}
          <Circle x={15} y={11} radius={3} fill="rgb(255, 95, 87)" />
          <Circle x={27} y={11} radius={3} fill="rgb(254, 188, 46)" />
          <Circle x={39} y={11} radius={3} fill="rgb(40, 201, 65)" />
          {/* Title text - centered */}
          <Text
            text={frame.title || 'file'}
            x={0}
            y={0}
            width={framedW}
            height={titleBarHeight}
            align="center"
            verticalAlign="middle"
            fill={isDark ? 'rgb(159, 159, 159)' : '#4d4d4d'}
            fontSize={10}
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            letterSpacing={-0.2}
          />
        </Group>
      );
    }

    case 'windows-light':
    case 'windows-dark': {
      const titleBarHeight = 28;
      return (
        <Group>
          {/* Full frame background with shadow */}
          <Rect
            x={0}
            y={0}
            width={framedW}
            height={framedH}
            fill={isDark ? '#1f1f1f' : '#ffffff'}
            cornerRadius={8}
            {...enhancedShadow}
          />
          {/* Title bar */}
          <Rect
            width={framedW}
            height={titleBarHeight}
            fill={isDark ? '#2d2d2d' : '#f3f3f3'}
            cornerRadius={[8, 8, 0, 0]}
          />
          <Text
            text={frame.title || ''}
            x={16}
            y={0}
            width={framedW - 150}
            height={titleBarHeight}
            align="left"
            verticalAlign="middle"
            fill={isDark ? '#ffffff' : '#1a1a1a'}
            fontSize={13}
            fontFamily="Segoe UI, system-ui, sans-serif"
          />
          {/* Minimize */}
          <Line
            points={[framedW - 100, 14, framedW - 88, 14]}
            stroke={isDark ? '#ffffff' : '#1a1a1a'}
            strokeWidth={1}
          />
          {/* Maximize */}
          <Rect
            x={framedW - 70}
            y={10}
            width={12}
            height={12}
            stroke={isDark ? '#ffffff' : '#1a1a1a'}
            strokeWidth={1}
            fillEnabled={false}
          />
          {/* Close */}
          <Group>
            <Line
              points={[framedW - 40, 10, framedW - 28, 22]}
              stroke={isDark ? '#ffffff' : '#1a1a1a'}
              strokeWidth={1}
            />
            <Line
              points={[framedW - 28, 10, framedW - 40, 22]}
              stroke={isDark ? '#ffffff' : '#1a1a1a'}
              strokeWidth={1}
            />
          </Group>
        </Group>
      );
    }

    case 'photograph': {
      // Polaroid style: 8px sides/top, 24px bottom
      // Draw a single white background rect with prominent shadow
      return (
        <Group>
          <Rect
            x={0}
            y={0}
            width={framedW}
            height={framedH}
            fill="white"
            cornerRadius={8}
            {...enhancedShadow}
          />
        </Group>
      );
    }

    default:
      return null;
  }
}

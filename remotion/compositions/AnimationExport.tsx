import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Img,
  AbsoluteFill,
} from 'remotion';
import type { AnimationClip, AnimationTrack, AnimatableProperties } from '@/types/animation';
import { DEFAULT_ANIMATABLE_PROPERTIES } from '@/types/animation';

// Props passed to the composition for rendering
export interface AnimationExportProps {
  // Image to animate
  imageUrl: string;

  // Animation data
  clips: AnimationClip[];
  tracks: AnimationTrack[];

  // Canvas settings
  backgroundColor: string;
  backgroundGradient?: {
    colorA: string;
    colorB: string;
    direction: number;
  };

  // Image settings
  borderRadius: number;
  imageScale: number;
  shadowEnabled: boolean;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

/**
 * Get interpolated value between keyframes
 */
function getInterpolatedValue(
  track: AnimationTrack,
  timeMs: number,
  property: keyof AnimatableProperties,
  defaultValue: number
): number {
  const keyframes = track.keyframes.filter(kf => property in kf.properties);

  if (keyframes.length === 0) return defaultValue;

  // Sort by time
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Before first keyframe
  if (timeMs <= sorted[0].time) {
    return sorted[0].properties[property] ?? defaultValue;
  }

  // After last keyframe
  if (timeMs >= sorted[sorted.length - 1].time) {
    return sorted[sorted.length - 1].properties[property] ?? defaultValue;
  }

  // Find surrounding keyframes
  let prevKf = sorted[0];
  let nextKf = sorted[1];

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].time <= timeMs && sorted[i + 1].time > timeMs) {
      prevKf = sorted[i];
      nextKf = sorted[i + 1];
      break;
    }
  }

  const prevValue = prevKf.properties[property] ?? defaultValue;
  const nextValue = nextKf.properties[property] ?? defaultValue;

  // Interpolate using Remotion's interpolate function
  return interpolate(
    timeMs,
    [prevKf.time, nextKf.time],
    [prevValue, nextValue],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
}

/**
 * Calculate interpolated properties at a given time
 */
function getPropertiesAtTime(
  clips: AnimationClip[],
  tracks: AnimationTrack[],
  timeMs: number
): AnimatableProperties {
  const result = { ...DEFAULT_ANIMATABLE_PROPERTIES };

  // Find active clips at this time
  const activeClips = clips.filter(
    clip => timeMs >= clip.startTime && timeMs < clip.startTime + clip.duration
  );

  if (activeClips.length === 0) {
    return result;
  }

  // Sort by start time (later clips take priority)
  const sortedClips = [...activeClips].sort((a, b) => a.startTime - b.startTime);

  // Track which properties are set by which clip
  const propertyToClip = new Map<keyof AnimatableProperties, AnimationClip>();

  for (const clip of sortedClips) {
    const clipTracks = tracks.filter(t => t.clipId === clip.id);

    for (const track of clipTracks) {
      if (!track.isVisible) continue;

      for (const kf of track.keyframes) {
        for (const key of Object.keys(kf.properties) as (keyof AnimatableProperties)[]) {
          propertyToClip.set(key, clip);
        }
      }
    }
  }

  // Get interpolated values
  for (const [property, clip] of propertyToClip) {
    const clipTracks = tracks.filter(t => t.clipId === clip.id && t.isVisible);
    const localTime = timeMs - clip.startTime;
    const originalDuration = clipTracks[0]?.originalDuration || clip.duration;
    const timeScale = originalDuration / clip.duration;
    const scaledTime = localTime * timeScale;

    for (const track of clipTracks) {
      const hasProperty = track.keyframes.some(kf => property in kf.properties);

      if (hasProperty) {
        result[property] = getInterpolatedValue(
          track,
          scaledTime,
          property,
          DEFAULT_ANIMATABLE_PROPERTIES[property]
        );
        break;
      }
    }
  }

  return result;
}

/**
 * Remotion composition for exporting animations
 */
export const AnimationExport: React.FC<AnimationExportProps> = ({
  imageUrl,
  clips,
  tracks,
  backgroundColor,
  backgroundGradient,
  borderRadius,
  imageScale,
  shadowEnabled,
  shadowBlur,
  shadowColor,
  shadowOffsetX,
  shadowOffsetY,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Convert frame to milliseconds
  const timeMs = (frame / fps) * 1000;

  // Get interpolated properties at current time
  const props = getPropertiesAtTime(clips, tracks, timeMs);

  // Build background style
  const backgroundStyle = backgroundGradient
    ? `linear-gradient(${backgroundGradient.direction}deg, ${backgroundGradient.colorA}, ${backgroundGradient.colorB})`
    : backgroundColor;

  // Build image transform
  const transform = [
    `perspective(${props.perspective}px)`,
    `rotateX(${props.rotateX}deg)`,
    `rotateY(${props.rotateY}deg)`,
    `rotateZ(${props.rotateZ}deg)`,
    `translateX(${props.translateX}px)`,
    `translateY(${props.translateY}px)`,
    `scale(${props.scale * (imageScale / 100)})`,
  ].join(' ');

  // Build shadow style
  const boxShadow = shadowEnabled
    ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`
    : 'none';

  return (
    <AbsoluteFill
      style={{
        background: backgroundStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          transform,
          opacity: props.imageOpacity,
          transformStyle: 'preserve-3d',
        }}
      >
        <Img
          src={imageUrl}
          style={{
            borderRadius,
            boxShadow,
            maxWidth: '80%',
            maxHeight: '80%',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

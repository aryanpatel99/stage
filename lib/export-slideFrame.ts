import { exportElement, type ExportOptions } from "@/lib/export/export-service";

import { getCanvasContainer } from "@/components/canvas/ClientCanvas";
import { getAspectRatioPreset } from "@/lib/aspect-ratio-utils";

import { useEditorStore, useImageStore } from "@/lib/store";

export async function exportSlideFrame(): Promise<HTMLImageElement> {
  const imageStore = useImageStore.getState();
  const editorStore = useEditorStore.getState();

  const preset = getAspectRatioPreset(imageStore.selectedAspectRatio);
  if (!preset) throw new Error("Invalid aspect ratio");

  const result = await exportElement(
    "image-render-card",
    {
      format: "png",
      qualityPreset: "high",
      scale: 1,
      exportWidth: preset.width,
      exportHeight: preset.height,
    },
    getCanvasContainer(),
    imageStore.backgroundConfig,
    imageStore.backgroundBorderRadius,
    imageStore.textOverlays,
    imageStore.imageOverlays,
    imageStore.perspective3D,
    editorStore.screenshot.src || undefined,
    editorStore.screenshot.radius,
    imageStore.backgroundBlur,
    imageStore.backgroundNoise,
    imageStore.backgroundConfig.opacity ?? 1
  );

  const img = new Image();
  img.src = result.dataURL;
  await img.decode();

  return img;
}

/**
 * Export slide frame as a Canvas element (for WebCodecs encoding)
 */
export async function exportSlideFrameAsCanvas(): Promise<HTMLCanvasElement> {
  const imageStore = useImageStore.getState();
  const editorStore = useEditorStore.getState();

  const preset = getAspectRatioPreset(imageStore.selectedAspectRatio);
  if (!preset) throw new Error("Invalid aspect ratio");

  const result = await exportElement(
    "image-render-card",
    {
      format: "png",
      qualityPreset: "high",
      scale: 1,
      exportWidth: preset.width,
      exportHeight: preset.height,
    },
    getCanvasContainer(),
    imageStore.backgroundConfig,
    imageStore.backgroundBorderRadius,
    imageStore.textOverlays,
    imageStore.imageOverlays,
    imageStore.perspective3D,
    editorStore.screenshot.src || undefined,
    editorStore.screenshot.radius,
    imageStore.backgroundBlur,
    imageStore.backgroundNoise,
    imageStore.backgroundConfig.opacity ?? 1
  );

  // Create canvas from data URL
  const img = new Image();
  img.src = result.dataURL;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.drawImage(img, 0, 0);

  return canvas;
}

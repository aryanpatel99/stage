/**
 * Client helper for Sharp-based image processing via API route
 *
 * Production-ready approach:
 * - Small images: Direct API call to Sharp (fast)
 * - Large images: Upload to R2, Sharp processes from R2 (no size limits)
 *
 * Sharp handles 100% of compression - no quality loss from intermediate steps.
 */

import type { ExportFormat, QualityPreset, ExportApiRequest, ExportApiResponse } from './types';

export interface SharpProcessingResult {
  blob: Blob;
  dataURL: string;
  fileSize: number;
}

// Vercel's body size limit (with safety margin)
const VERCEL_PAYLOAD_LIMIT = 4.5 * 1024 * 1024;
const SAFE_PAYLOAD_LIMIT = VERCEL_PAYLOAD_LIMIT * 0.75; // 75% to be safe with JSON overhead

/**
 * Estimate the base64 payload size for a canvas
 */
function estimatePayloadSize(canvas: HTMLCanvasElement): number {
  // Raw RGBA data * base64 overhead (1.37x) + JSON structure overhead
  return canvas.width * canvas.height * 4 * 1.37 + 1000;
}

/**
 * Convert canvas to PNG blob
 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to blob'));
      },
      'image/png'
    );
  });
}

/**
 * Convert blob to base64 string (without data URL prefix)
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1]); // Remove prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert API response to result object
 */
function responseToResult(data: ExportApiResponse): SharpProcessingResult {
  const binaryString = atob(data.imageData);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: data.mimeType });
  const dataURL = `data:${data.mimeType};base64,${data.imageData}`;

  return { blob, dataURL, fileSize: data.fileSize };
}

/**
 * Process small images directly via Sharp API
 */
async function processDirectWithSharp(
  base64Data: string,
  format: ExportFormat,
  qualityPreset: QualityPreset
): Promise<SharpProcessingResult> {
  const requestBody: ExportApiRequest = {
    imageData: base64Data,
    format,
    qualityPreset,
  };

  const response = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Export API failed with status ${response.status}`);
  }

  return responseToResult(await response.json());
}

/**
 * Process large images via R2 upload + Sharp
 * Bypasses Vercel's payload limit while maintaining Sharp quality
 */
async function processViaR2(
  blob: Blob,
  format: ExportFormat,
  qualityPreset: QualityPreset
): Promise<SharpProcessingResult> {
  // Step 1: Get presigned upload URL from our API
  const presignResponse = await fetch('/api/export/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType: 'image/png' }),
  });

  if (!presignResponse.ok) {
    const error = await presignResponse.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get upload URL');
  }

  const { uploadUrl, key } = await presignResponse.json();

  // Step 2: Upload directly to R2 (no size limit)
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'image/png' },
  });

  if (!uploadResponse.ok) {
    throw new Error(`R2 upload failed: ${uploadResponse.status}`);
  }

  // Step 3: Tell Sharp to process from R2
  const processResponse = await fetch('/api/export/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, format, qualityPreset }),
  });

  if (!processResponse.ok) {
    const error = await processResponse.json().catch(() => ({}));
    throw new Error(error.error || `Process failed: ${processResponse.status}`);
  }

  return responseToResult(await processResponse.json());
}

/**
 * Process canvas data for export using Sharp compression
 *
 * Production Strategy:
 * 1. Small images (<3.4MB) → Direct Sharp API (fast, single request)
 * 2. Large images (>3.4MB) → R2 upload → Sharp processes from R2 (no limits)
 *
 * Sharp handles ALL compression - guaranteed optimal output.
 *
 * @param canvas - The source canvas element
 * @param format - Target format ('png' or 'jpeg')
 * @param qualityPreset - Quality preset ('high', 'medium', 'low')
 * @returns Processed image as Blob and dataURL
 */
export async function processWithSharp(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  qualityPreset: QualityPreset
): Promise<SharpProcessingResult> {
  const estimatedSize = estimatePayloadSize(canvas);
  const isLargeImage = estimatedSize > SAFE_PAYLOAD_LIMIT;

  // Convert canvas to blob first (needed for both paths)
  const blob = await canvasToBlob(canvas);
  const actualSize = blob.size;

  console.log(`Export: ${(actualSize / 1024 / 1024).toFixed(2)}MB, estimated payload: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB`);

  // For large images, use R2 path to avoid 413 errors
  if (isLargeImage || actualSize * 1.37 > SAFE_PAYLOAD_LIMIT) {
    console.log('Using R2 upload path for large image...');
    try {
      return await processViaR2(blob, format, qualityPreset);
    } catch (r2Error) {
      console.error('R2 path failed:', r2Error);
      // If R2 fails and image might fit, try direct (will fail with 413 if too big)
      if (actualSize * 1.37 < VERCEL_PAYLOAD_LIMIT) {
        console.log('Falling back to direct API...');
      } else {
        throw r2Error; // Re-throw if definitely too big
      }
    }
  }

  // Direct Sharp API for small images
  const base64Data = await blobToBase64(blob);
  return await processDirectWithSharp(base64Data, format, qualityPreset);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

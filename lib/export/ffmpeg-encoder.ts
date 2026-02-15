/**
 * FFmpeg WASM Video Encoder
 *
 * Uses FFmpeg compiled to WebAssembly for high-quality video encoding.
 * Runs entirely in the browser - no server needed!
 *
 * Features:
 * - H.264/H.265 encoding
 * - MP4, WebM, GIF output
 * - Audio support (future)
 * - Professional quality settings
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export type FFmpegFormat = 'mp4' | 'webm' | 'gif';
export type FFmpegQuality = 'high' | 'medium' | 'low';

export interface FFmpegEncoderOptions {
  width: number;
  height: number;
  fps: number;
  format?: FFmpegFormat;
  quality?: FFmpegQuality;
  onProgress?: (progress: number) => void;
  onLog?: (message: string) => void;
}

// Quality presets (CRF values - lower = better quality, larger file)
const QUALITY_CRF: Record<FFmpegQuality, number> = {
  high: 18,    // Visually lossless
  medium: 23,  // Good quality, reasonable size
  low: 28,     // Smaller file, some quality loss
};

// Singleton FFmpeg instance
let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;
let loadPromise: Promise<FFmpeg> | null = null;

/**
 * Load FFmpeg WASM (singleton, loads only once)
 */
export async function loadFFmpeg(
  onProgress?: (progress: number) => void
): Promise<FFmpeg> {
  // Return existing instance if loaded
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  // Return existing load promise if loading
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();

    // Set up progress logging
    ffmpeg.on('progress', ({ progress }) => {
      onProgress?.(progress * 100);
    });

    // Load FFmpeg core from CDN (smaller initial bundle)
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    isLoading = false;

    return ffmpeg;
  })();

  return loadPromise;
}

/**
 * Check if FFmpeg is loaded and ready
 */
export function isFFmpegLoaded(): boolean {
  return ffmpegInstance !== null && ffmpegInstance.loaded;
}

/**
 * FFmpeg-based video encoder class
 */
export class FFmpegVideoEncoder {
  private ffmpeg: FFmpeg | null = null;
  private options: Required<FFmpegEncoderOptions>;
  private frameCount = 0;
  private frames: Uint8Array[] = [];

  constructor(options: FFmpegEncoderOptions) {
    this.options = {
      ...options,
      format: options.format ?? 'mp4',
      quality: options.quality ?? 'high',
      onProgress: options.onProgress ?? (() => {}),
      onLog: options.onLog ?? (() => {}),
    };
  }

  /**
   * Initialize FFmpeg
   */
  async initialize(): Promise<void> {
    this.ffmpeg = await loadFFmpeg((p) => {
      // Loading progress (first 10%)
      this.options.onProgress(p * 0.1);
    });

    // Set up logging
    this.ffmpeg.on('log', ({ message }) => {
      this.options.onLog(message);
    });
  }

  /**
   * Add a frame from canvas
   */
  async addFrame(canvas: HTMLCanvasElement): Promise<void> {
    // Convert canvas to PNG blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });

    // Convert blob to Uint8Array
    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    this.frames.push(data);
    this.frameCount++;
  }

  /**
   * Add a frame from ImageData
   */
  async addFrameFromImageData(imageData: ImageData): Promise<void> {
    // Create canvas from ImageData
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.putImageData(imageData, 0, 0);

    await this.addFrame(canvas);
  }

  /**
   * Encode all frames and return video blob
   */
  async encode(): Promise<Blob> {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not initialized');
    }

    const { fps, format, quality, width, height, onProgress } = this.options;
    const crf = QUALITY_CRF[quality];

    // Write all frames to FFmpeg's virtual filesystem
    for (let i = 0; i < this.frames.length; i++) {
      const paddedIndex = String(i).padStart(6, '0');
      await this.ffmpeg.writeFile(`frame_${paddedIndex}.png`, this.frames[i]);

      // Writing frames is 10-40% of progress
      onProgress(10 + (i / this.frames.length) * 30);
    }

    // Build FFmpeg command based on format
    let outputFile: string;
    let ffmpegArgs: string[];

    if (format === 'mp4') {
      outputFile = 'output.mp4';
      ffmpegArgs = [
        '-framerate', String(fps),
        '-i', 'frame_%06d.png',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', String(crf),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', // Enable streaming
        '-y', // Overwrite output
        outputFile,
      ];
    } else if (format === 'webm') {
      outputFile = 'output.webm';
      ffmpegArgs = [
        '-framerate', String(fps),
        '-i', 'frame_%06d.png',
        '-c:v', 'libvpx-vp9',
        '-crf', String(crf + 10), // VP9 CRF is different
        '-b:v', '0',
        '-pix_fmt', 'yuv420p',
        '-y',
        outputFile,
      ];
    } else if (format === 'gif') {
      outputFile = 'output.gif';
      // For GIF, we need to generate a palette first for better quality
      ffmpegArgs = [
        '-framerate', String(fps),
        '-i', 'frame_%06d.png',
        '-vf', `fps=${Math.min(fps, 30)},scale=${width}:${height}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer`,
        '-loop', '0',
        '-y',
        outputFile,
      ];
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    // Set up progress tracking for encoding
    this.ffmpeg.on('progress', ({ progress }) => {
      // Encoding is 40-100% of progress
      onProgress(40 + progress * 60);
    });

    // Run FFmpeg
    await this.ffmpeg.exec(ffmpegArgs);

    // Read output file
    const data = await this.ffmpeg.readFile(outputFile);

    // Clean up - delete all frames and output
    for (let i = 0; i < this.frames.length; i++) {
      const paddedIndex = String(i).padStart(6, '0');
      await this.ffmpeg.deleteFile(`frame_${paddedIndex}.png`);
    }
    await this.ffmpeg.deleteFile(outputFile);

    // Clear frames from memory
    this.frames = [];

    // Convert to blob
    const mimeTypes: Record<FFmpegFormat, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      gif: 'image/gif',
    };

    // Handle both Uint8Array and string return types from FFmpeg
    const blobData = typeof data === 'string'
      ? new TextEncoder().encode(data)
      : new Uint8Array(data);

    return new Blob([blobData], { type: mimeTypes[format] });
  }

  /**
   * Get current frame count
   */
  getFrameCount(): number {
    return this.frameCount;
  }
}

/**
 * High-level function to encode canvas frames to video using FFmpeg
 */
export async function encodeWithFFmpeg(
  canvases: HTMLCanvasElement[],
  options: FFmpegEncoderOptions
): Promise<Blob> {
  const encoder = new FFmpegVideoEncoder(options);
  await encoder.initialize();

  const total = canvases.length;

  for (let i = 0; i < total; i++) {
    await encoder.addFrame(canvases[i]);

    // Yield to main thread periodically
    if (i % 5 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return encoder.encode();
}

/**
 * Terminate FFmpeg and free memory
 */
export function terminateFFmpeg(): void {
  if (ffmpegInstance) {
    ffmpegInstance.terminate();
    ffmpegInstance = null;
    loadPromise = null;
  }
}

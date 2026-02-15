/**
 * WebCodecs + MP4 Muxer Video Encoder
 *
 * High-quality video encoding using:
 * - WebCodecs API for H.264 encoding (hardware accelerated)
 * - mp4-muxer for MP4 container packaging
 *
 * Runs entirely in the browser with WASM - no server needed.
 */

import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export interface WebCodecsEncoderOptions {
  width: number;
  height: number;
  fps: number;
  bitrate?: number; // bits per second, default 10Mbps
  onProgress?: (progress: number) => void;
}

export interface FrameData {
  imageData: ImageData;
  timestamp: number; // in microseconds
}

/**
 * Check if WebCodecs is supported in this browser
 */
export function isWebCodecsSupported(): boolean {
  return (
    typeof VideoEncoder !== 'undefined' &&
    typeof VideoFrame !== 'undefined' &&
    typeof EncodedVideoChunk !== 'undefined'
  );
}

/**
 * Check if H.264 encoding is supported
 */
export async function isH264Supported(): Promise<boolean> {
  if (!isWebCodecsSupported()) return false;

  try {
    const support = await VideoEncoder.isConfigSupported({
      codec: 'avc1.42E01E', // H.264 Baseline
      width: 1920,
      height: 1080,
      bitrate: 10_000_000,
      framerate: 60,
    });
    return support.supported === true;
  } catch {
    return false;
  }
}

/**
 * WebCodecs-based video encoder class
 */
export class WebCodecsVideoEncoder {
  private muxer: Muxer<ArrayBufferTarget> | null = null;
  private encoder: VideoEncoder | null = null;
  private options: Required<WebCodecsEncoderOptions>;
  private frameCount = 0;
  private isInitialized = false;

  constructor(options: WebCodecsEncoderOptions) {
    this.options = {
      ...options,
      bitrate: options.bitrate ?? 10_000_000, // 10 Mbps default
      onProgress: options.onProgress ?? (() => {}),
    };
  }

  /**
   * Initialize the encoder and muxer
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const { width, height, fps, bitrate } = this.options;

    // Ensure dimensions are even (required for H.264)
    const evenWidth = width % 2 === 0 ? width : width + 1;
    const evenHeight = height % 2 === 0 ? height : height + 1;

    // Create MP4 muxer
    this.muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width: evenWidth,
        height: evenHeight,
      },
      fastStart: 'in-memory', // Puts moov atom at start for streaming
    });

    // Create video encoder
    this.encoder = new VideoEncoder({
      output: (chunk, meta) => {
        this.muxer?.addVideoChunk(chunk, meta);
      },
      error: (error) => {
        console.error('VideoEncoder error:', error);
        throw error;
      },
    });

    // Configure encoder
    await this.encoder.configure({
      codec: 'avc1.42E01E', // H.264 Baseline Profile
      width: evenWidth,
      height: evenHeight,
      bitrate,
      framerate: fps,
      latencyMode: 'quality', // Prioritize quality over latency
      avc: {
        format: 'avc', // Use AVC format for MP4 compatibility
      },
    });

    this.isInitialized = true;
  }

  /**
   * Encode a single frame from ImageData
   */
  async encodeFrame(imageData: ImageData, frameIndex: number): Promise<void> {
    if (!this.encoder || !this.isInitialized) {
      throw new Error('Encoder not initialized');
    }

    const { fps } = this.options;
    const timestamp = Math.round((frameIndex / fps) * 1_000_000); // microseconds

    // Convert ImageData to canvas first (VideoFrame doesn't accept ImageData directly)
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.putImageData(imageData, 0, 0);

    // Create VideoFrame from canvas
    const frame = new VideoFrame(canvas, {
      timestamp,
      duration: Math.round(1_000_000 / fps), // Frame duration in microseconds
    });

    // Encode the frame
    // Insert keyframes every 2 seconds for seeking
    const isKeyFrame = frameIndex % (fps * 2) === 0;
    this.encoder.encode(frame, { keyFrame: isKeyFrame });

    // Close the frame to release memory
    frame.close();

    this.frameCount++;
  }

  /**
   * Encode a frame from a canvas element
   */
  async encodeFromCanvas(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    frameIndex: number
  ): Promise<void> {
    if (!this.encoder || !this.isInitialized) {
      throw new Error('Encoder not initialized');
    }

    const { fps } = this.options;
    const timestamp = Math.round((frameIndex / fps) * 1_000_000);

    // Create VideoFrame directly from canvas (more efficient)
    const frame = new VideoFrame(canvas, {
      timestamp,
      duration: Math.round(1_000_000 / fps),
    });

    const isKeyFrame = frameIndex % (fps * 2) === 0;
    this.encoder.encode(frame, { keyFrame: isKeyFrame });

    frame.close();
    this.frameCount++;
  }

  /**
   * Finalize encoding and return the MP4 blob
   */
  async finalize(): Promise<Blob> {
    if (!this.encoder || !this.muxer) {
      throw new Error('Encoder not initialized');
    }

    // Flush remaining frames
    await this.encoder.flush();

    // Finalize the muxer
    this.muxer.finalize();

    // Get the MP4 data
    const { buffer } = this.muxer.target;

    // Cleanup
    this.encoder.close();
    this.encoder = null;
    this.muxer = null;
    this.isInitialized = false;

    return new Blob([buffer], { type: 'video/mp4' });
  }

  /**
   * Get the current frame count
   */
  getFrameCount(): number {
    return this.frameCount;
  }
}

/**
 * High-level function to encode frames to MP4
 */
export async function encodeFramesToMP4(
  frames: { canvas: HTMLCanvasElement; duration?: number }[],
  options: WebCodecsEncoderOptions
): Promise<Blob> {
  const encoder = new WebCodecsVideoEncoder(options);
  await encoder.initialize();

  const totalFrames = frames.length;

  for (let i = 0; i < frames.length; i++) {
    await encoder.encodeFromCanvas(frames[i].canvas, i);

    // Report progress
    options.onProgress?.((i + 1) / totalFrames * 100);

    // Yield to main thread periodically
    if (i % 10 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return encoder.finalize();
}

/**
 * Encode ImageData frames to MP4
 */
export async function encodeImageDataToMP4(
  frames: ImageData[],
  options: WebCodecsEncoderOptions
): Promise<Blob> {
  const encoder = new WebCodecsVideoEncoder(options);
  await encoder.initialize();

  const totalFrames = frames.length;

  for (let i = 0; i < frames.length; i++) {
    await encoder.encodeFrame(frames[i], i);

    options.onProgress?.((i + 1) / totalFrames * 100);

    // Yield to main thread periodically
    if (i % 10 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return encoder.finalize();
}

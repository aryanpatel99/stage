/**
 * R2 Demo Images Configuration
 *
 * These are the paths to demo images stored in Cloudflare R2.
 */

import { getR2PublicUrl } from './r2';

export const demoImagePaths: string[] = [
  "demo-images/demo-1.png",
  "demo-images/demo-2.png",
  "demo-images/demo-3.png",
  "demo-images/demo-4.png",
  "demo-images/demo-5.png",
  "demo-images/demo-6.png",
  "demo-images/demo-7.png",
  "demo-images/demo-8.png",
  "demo-images/demo-9.png",
  "demo-images/demo-10.png",
  "demo-images/demo-11.png",
  "demo-images/demo-12.png",
  "demo-images/demo-13.png",
  "demo-images/demo-14.png",
  "demo-images/demo-15.png",
];

/**
 * Get full R2 URL for a demo image
 */
export function getDemoImageUrl(path: string): string {
  return getR2PublicUrl(path);
}

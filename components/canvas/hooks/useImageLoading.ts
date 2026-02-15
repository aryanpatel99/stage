import { useState, useEffect } from 'react';
import { getR2ImageUrl } from '@/lib/r2';
import { isOverlayPath } from '@/lib/r2-overlays';
import { backgroundPaths } from '@/lib/r2-backgrounds';
import type { BackgroundConfig } from '@/lib/constants/backgrounds';
import type { ImageOverlay } from '@/lib/store';

export function useBackgroundImage(
  backgroundConfig: BackgroundConfig,
  containerWidth: number,
  containerHeight: number
) {
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (backgroundConfig.type === 'image' && backgroundConfig.value) {
      const imageValue = backgroundConfig.value as string;

      const isValidImageValue =
        imageValue.startsWith('http') ||
        imageValue.startsWith('blob:') ||
        imageValue.startsWith('data:') ||
        (typeof imageValue === 'string' && !imageValue.includes('_gradient'));

      if (!isValidImageValue) {
        setBgImage(null);
        return;
      }

      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setBgImage(img);
      img.onerror = () => {
        console.error(
          'Failed to load background image:',
          backgroundConfig.value
        );
        setBgImage(null);
      };

      let imageUrl = imageValue;
      if (
        typeof imageUrl === 'string' &&
        !imageUrl.startsWith('http') &&
        !imageUrl.startsWith('blob:') &&
        !imageUrl.startsWith('data:')
      ) {
        if (backgroundPaths.includes(imageUrl)) {
          imageUrl = getR2ImageUrl({ src: imageUrl });
        } else {
          setBgImage(null);
          return;
        }
      }

      img.src = imageUrl;
    } else {
      setBgImage(null);
    }
  }, [backgroundConfig, containerWidth, containerHeight]);

  return bgImage;
}

export function useOverlayImages(imageOverlays: ImageOverlay[]) {
  const [loadedOverlayImages, setLoadedOverlayImages] = useState<
    Record<string, HTMLImageElement>
  >({});

  useEffect(() => {
    const loadOverlays = async () => {
      const loadedImages: Record<string, HTMLImageElement> = {};

      for (const overlay of imageOverlays) {
        if (!overlay.isVisible) continue;

        try {
          const isR2Overlay =
            isOverlayPath(overlay.src) ||
            (typeof overlay.src === 'string' &&
              overlay.src.startsWith('overlays/'));

          const imageUrl =
            isR2Overlay && !overlay.isCustom
              ? getR2ImageUrl({ src: overlay.src })
              : overlay.src;

          const img = new window.Image();
          img.crossOrigin = 'anonymous';

          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              loadedImages[overlay.id] = img;
              resolve();
            };
            img.onerror = () => reject(new Error(`Failed to load overlay: ${overlay.id}`));
            img.src = imageUrl;
          });
        } catch (error) {
          console.error(
            `Failed to load overlay image for ${overlay.id}:`,
            error
          );
        }
      }

      setLoadedOverlayImages(loadedImages);
    };

    loadOverlays();
  }, [imageOverlays]);

  return loadedOverlayImages;
}

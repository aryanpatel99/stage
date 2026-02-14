import { gradientColors, GradientKey } from './gradient-colors';
import { SolidColorKey, solidColors } from './solid-colors';
import { meshGradients, magicGradients, MeshGradientKey, MagicGradientKey } from './mesh-gradients';
import { getCldImageUrl } from '@/lib/cloudinary';
import { cloudinaryPublicIds } from '@/lib/cloudinary-backgrounds';

export type BackgroundType = 'gradient' | 'solid' | 'image';

export interface BackgroundConfig {
  type: BackgroundType;
  value: GradientKey | SolidColorKey | string;
  opacity?: number;
}

export const getBackgroundStyle = (config: BackgroundConfig): string => {
  const { type, value, opacity = 1 } = config;

  switch (type) {
    case 'gradient': {
      if (typeof value === 'string' && value.startsWith('mesh:')) {
        const meshKey = value.replace('mesh:', '') as MeshGradientKey;
        return meshGradients[meshKey] || gradientColors.vibrant_orange_pink;
      }
      if (typeof value === 'string' && value.startsWith('magic:')) {
        const magicKey = value.replace('magic:', '') as MagicGradientKey;
        return magicGradients[magicKey] || gradientColors.vibrant_orange_pink;
      }
      return gradientColors[value as GradientKey];
    }

    case 'solid': {
      if (value === 'transparent') {
        return 'transparent';
      }
      if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgb'))) {
        return value;
      }
      const color = solidColors[value as SolidColorKey];
      return color || '#ffffff';
    }

    case 'image':
      return `url(${value})`;

    default:
      return gradientColors.vibrant_orange_pink;
  }
};

export const getBackgroundCSS = (
  config: BackgroundConfig
): React.CSSProperties => {
  const { type, value, opacity = 1 } = config;

  switch (type) {
    case 'gradient': {
      let gradient: string;

      if (typeof value === 'string' && value.startsWith('mesh:')) {
        const meshKey = value.replace('mesh:', '') as MeshGradientKey;
        gradient = meshGradients[meshKey] || gradientColors.vibrant_orange_pink;
      } else if (typeof value === 'string' && value.startsWith('magic:')) {
        const magicKey = value.replace('magic:', '') as MagicGradientKey;
        gradient = magicGradients[magicKey] || gradientColors.vibrant_orange_pink;
      } else {
        gradient = gradientColors[value as GradientKey] || gradientColors.vibrant_orange_pink;
      }

      return {
        background: gradient,
        opacity,
      };
    }

    case 'solid': {
      // Handle transparent background
      if (value === 'transparent') {
        return {
          backgroundColor: 'transparent',
          opacity: 1,
        };
      }
      // Handle direct color values (hex, rgb, rgba)
      if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgb'))) {
        return {
          backgroundColor: value,
          opacity,
        };
      }
      const color = solidColors[value as SolidColorKey] || '#ffffff';
      return {
        backgroundColor: color,
        opacity,
      };
    }

    case 'image': {
      // Check if it's a Cloudinary public ID
      const isCloudinaryPublicId = typeof value === 'string' &&
        !value.startsWith('blob:') &&
        !value.startsWith('http') &&
        !value.startsWith('data:') &&
        cloudinaryPublicIds.includes(value);

      let imageUrl = value as string;

      // If it's a Cloudinary public ID, try to get the optimized URL
      if (isCloudinaryPublicId) {
        try {
          // Check if Cloudinary is configured
          const cloudName = typeof window !== 'undefined'
            ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
              (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string)
            : (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string);

          if (cloudName) {
            imageUrl = getCldImageUrl({
              src: value as string,
              width: 1920,
              height: 1080,
              quality: 'auto',
              format: 'auto',
              crop: 'fill',
              gravity: 'auto',
            });
          } else {
            console.warn(`Cloudinary cloud name not found. Background image "${value}" will be used as-is. For optimized images, set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your environment variables.`);
            // Use value as-is, might be a local path or URL
          }
        } catch (error) {
          console.warn(`Failed to get Cloudinary URL for background "${value}":`, error);
          // Use value as-is on error
        }
      }

      return {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity,
      };
    }

    default:
      return {
        background: gradientColors.vibrant_orange_pink,
        opacity,
      };
  }
};

/**
 * Export service for handling image exports
 */

import html2canvas from 'html2canvas';
import {
  convertStylesToRGB,
  injectRGBOverrides,
  preserveImageStyles,
  convertSVGStyles,
  setupExportElement,
  waitForImages,
} from './export-utils';

export interface ExportOptions {
  format: 'png' | 'jpg';
  quality: number;
  scale: number;
  exportWidth: number;
  exportHeight: number;
}

export interface ExportResult {
  dataURL: string;
  blob: Blob;
}

/**
 * Export an element as an image
 */
export async function exportElement(
  elementId: string,
  options: ExportOptions
): Promise<ExportResult> {
  // Wait a bit to ensure DOM is ready
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Image render card not found. Please ensure an image is uploaded.');
  }

  // Wait for all images to load
  await waitForImages(element);

  // Use html2canvas directly with format options
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: options.scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    width: options.exportWidth,
    height: options.exportHeight,
    windowWidth: options.exportWidth,
    windowHeight: options.exportHeight,
    removeContainer: true,
    imageTimeout: 15000,
    onclone: (clonedDoc, clonedElement) => {
      // Inject CSS overrides first - this replaces all oklch CSS variables
      injectRGBOverrides(clonedDoc);
      
      // Get the target element
      const targetElement = clonedDoc.getElementById('image-render-card') || clonedElement;
      
      if (targetElement) {
        // Setup element dimensions
        setupExportElement(
          targetElement as HTMLElement,
          options.exportWidth,
          options.exportHeight,
          clonedDoc
        );
        
        // Ensure all images are loaded in the cloned document
        const images = targetElement.getElementsByTagName('img');
        Array.from(images).forEach((img) => {
          preserveImageStyles(img, clonedDoc);
        });
        
        // Convert SVG elements fill/stroke attributes
        convertSVGStyles(targetElement as HTMLElement, clonedDoc);
        
        // Convert all CSS variables and oklch colors to RGB - convert ALL elements recursively
        const allElements = targetElement.querySelectorAll('*');
        allElements.forEach((el) => {
          if (el instanceof HTMLElement || el instanceof SVGElement) {
            // Skip img elements - their border colors are already preserved above
            if (el.tagName.toLowerCase() !== 'img') {
              convertStylesToRGB(el as HTMLElement, clonedDoc);
            } else {
              // For img elements, only convert non-border properties
              const imgEl = el as HTMLElement;
              const win = clonedDoc.defaultView || (clonedDoc as any).parentWindow;
              if (win) {
                try {
                  const computedStyle = win.getComputedStyle(imgEl);
                  // Convert only non-border properties
                  const nonBorderProps = [
                    'color', 'backgroundColor', 'outlineColor', 
                    'background', 'backgroundImage', 'fill', 'stroke'
                  ];
                  nonBorderProps.forEach(prop => {
                    try {
                      const value = computedStyle.getPropertyValue(prop);
                      if (value && (value.includes('oklch') || value.includes('var('))) {
                        const computed = (computedStyle as any)[prop];
                        if (computed && computed !== 'rgba(0, 0, 0, 0)' && computed !== 'transparent' && computed !== 'none' && !computed.includes('oklch')) {
                          imgEl.style.setProperty(prop, computed, 'important');
                        }
                      }
                    } catch (e) {
                      // Ignore errors for individual properties
                    }
                  });
                } catch (e) {
                  // Ignore errors
                }
              }
            }
          }
        });
        
        // Also convert the root element itself
        convertStylesToRGB(targetElement as HTMLElement, clonedDoc);
        
        // Force a reflow to ensure styles are applied
        void clonedDoc.defaultView?.getComputedStyle(targetElement).width;
      }
    },
  });

  if (!canvas) {
    throw new Error('Failed to create canvas');
  }

  // Convert canvas to blob and data URL with specified format
  const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png';
  
  // Create blob first for better quality storage
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from canvas'));
        return;
      }
      resolve(blob);
    }, mimeType, options.quality);
  });
  
  // Also create data URL for immediate download
  const dataURL = canvas.toDataURL(mimeType, options.quality);
  
  if (!dataURL || dataURL === 'data:,') {
    throw new Error('Failed to generate image data URL');
  }

  return { dataURL, blob };
}


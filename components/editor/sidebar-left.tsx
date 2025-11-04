'use client';

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useImageStore } from '@/lib/store';
import { ExportDialog } from '@/components/canvas/dialogs/ExportDialog';
import { StyleTabs } from './style-tabs';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Save } from 'lucide-react';
import { getAspectRatioPreset } from '@/lib/aspect-ratio-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useExport } from '@/hooks/useExport';

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { 
    uploadedImageUrl, 
    selectedAspectRatio, 
    clearImage,
    selectedGradient,
    borderRadius,
    backgroundBorderRadius,
    backgroundConfig,
    textOverlays,
    imageOpacity,
    imageScale,
    imageBorder,
    imageShadow,
  } = useImageStore();
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [saveName, setSaveName] = React.useState('');
  const [saveDescription, setSaveDescription] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const router = useRouter();

  const {
    settings: exportSettings,
    isExporting,
    updateFormat,
    updateQuality,
    updateScale,
    exportImage,
  } = useExport(selectedAspectRatio);

  const handleSaveDesign = async (): Promise<{ canvasData: any; previewUrl?: string }> => {
    // Wait a bit to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const element = document.getElementById('image-render-card');
    if (!element) {
      throw new Error('Image render card not found. Please ensure an image is uploaded.');
    }

    // Get aspect ratio preset
    const preset = getAspectRatioPreset(selectedAspectRatio);
    if (!preset) {
      throw new Error('Invalid aspect ratio selected');
    }

    // Capture all current state from image store
    const canvasData = {
      type: 'image-showcase', // Identify this as image showcase, not canvas
      uploadedImageUrl,
      selectedAspectRatio,
      selectedGradient,
      borderRadius,
      backgroundBorderRadius,
      backgroundConfig,
      textOverlays,
      imageOpacity,
      imageScale,
      imageBorder,
      imageShadow,
      dimensions: {
        width: preset.width,
        height: preset.height,
      },
    };

    // Generate preview URL using html2canvas
    let previewUrl: string | undefined;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 0.5, // Lower resolution for preview
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: preset.width,
        height: preset.height,
      });
      
      previewUrl = canvas.toDataURL('image/png', 0.7);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }

    return { canvasData, previewUrl };
  };

  return (
    <>
      <Sidebar className="border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl" {...props}>
        <SidebarHeader className="p-3 border-b border-sidebar-border space-y-1.5 min-w-0">
          <Button
            onClick={() => setSaveDialogOpen(true)}
            disabled={!uploadedImageUrl}
            className="w-full h-9 min-w-0 justify-start gap-2 rounded-lg bg-background hover:bg-accent text-foreground border border-border hover:border-border/80 shadow-none hover:shadow-sm transition-all duration-200 font-medium text-xs px-3 overflow-hidden"
            variant="outline"
            size="sm"
          >
            <Save className="size-3.5 shrink-0" />
            <span className="truncate min-w-0">Save Design</span>
          </Button>
          <Button
            onClick={() => setExportDialogOpen(true)}
            disabled={!uploadedImageUrl}
            className="w-full h-9 min-w-0 justify-start gap-2 rounded-lg bg-background hover:bg-accent text-foreground border border-border hover:border-border/80 shadow-none hover:shadow-sm transition-all duration-200 font-medium text-xs px-3 overflow-hidden"
            variant="outline"
            size="sm"
          >
            <Download className="size-3.5 shrink-0" />
            <span className="truncate min-w-0">Export Image</span>
          </Button>
          <Button
            onClick={clearImage}
            disabled={!uploadedImageUrl}
            className="w-full h-9 min-w-0 justify-start gap-2 rounded-lg bg-background hover:bg-destructive/10 text-destructive border border-destructive/20 hover:border-destructive/40 shadow-none hover:shadow-sm transition-all duration-200 font-medium text-xs px-3 hover:text-destructive overflow-hidden"
            variant="outline"
            size="sm"
          >
            <Trash2 className="size-3.5 shrink-0" />
            <span className="truncate min-w-0">Remove Image</span>
          </Button>
        </SidebarHeader>
        <SidebarContent className="px-6 py-7 space-y-6 overflow-x-hidden">
          <StyleTabs />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={() => exportImage().then(() => {})}
        format={exportSettings.format}
        quality={exportSettings.quality}
        scale={exportSettings.scale}
        isExporting={isExporting}
        onFormatChange={updateFormat}
        onQualityChange={updateQuality}
        onScaleChange={updateScale}
      />

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Design</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="design-name" className="text-sm font-medium mb-2 block">
                Design Name *
              </label>
              <Input
                id="design-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="My Awesome Design"
                disabled={isSaving}
              />
            </div>
            <div>
              <label htmlFor="design-description" className="text-sm font-medium mb-2 block">
                Description (optional)
              </label>
              <Input
                id="design-description"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="A brief description of your design"
                disabled={isSaving}
              />
            </div>
            {saveError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {saveError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSaveDialogOpen(false);
                setSaveName('');
                setSaveDescription('');
                setSaveError(null);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!saveName.trim()) {
                  setSaveError('Design name is required');
                  return;
                }

                setIsSaving(true);
                setSaveError(null);

                try {
                  const { canvasData, previewUrl } = await handleSaveDesign();

                  const response = await fetch('/api/designs', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      name: saveName.trim(),
                      description: saveDescription.trim() || null,
                      canvasData,
                      previewUrl,
                    }),
                  });

                  if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to save design');
                  }

                  setSaveDialogOpen(false);
                  setSaveName('');
                  setSaveDescription('');
                  router.refresh();
                } catch (err) {
                  console.error('Error saving design:', err);
                  setSaveError(err instanceof Error ? err.message : 'Failed to save design');
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving || !saveName.trim()}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

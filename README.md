# Stage

A modern web-based canvas editor for creating stunning visual designs. Upload images, add text overlays, customize backgrounds, and export high-quality graphics—all in your browser.

## Features

- **Image Upload & Customization** - Upload images and adjust size, opacity, borders, shadows, and border radius
- **Text Overlays** - Add multiple text overlays with custom fonts, colors, sizes, positions, and text shadows
- **Backgrounds** - Choose from gradients, solid colors, or upload your own background images
- **Presets** - Apply 5 ready-made presets (Social Ready, Story Style, Minimal Clean, Bold Gradient, Dark Elegant) for instant professional styling
- **Aspect Ratios** - Support for Instagram, social media, and standard photo formats
- **Export** - Export as PNG (with transparency) or JPG with adjustable quality and scale (up to 5x)

## Quick Start

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Setup

Create `.env.local` with (optional):
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (optional, for image optimization)
- `CLOUDINARY_API_KEY` - Cloudinary API key (optional)
- `CLOUDINARY_API_SECRET` - Cloudinary API secret (optional)

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Konva/React-Konva** - Canvas rendering
- **Cloudinary** - Image optimization and CDN (optional)
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **html2canvas** - Export functionality

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run upload-backgrounds` - Upload backgrounds to Cloudinary
- `npm run upload-demo-images` - Upload demo images to Cloudinary

## License

See [LICENSE](LICENSE) file for details.

import { NextRequest, NextResponse } from 'next/server'
import chromium from '@sparticuz/chromium'
import { getCachedScreenshot, cacheScreenshot, normalizeUrl, invalidateCache } from '@/lib/screenshot-cache'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 10

async function getBrowser() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV
  
  // Memory-optimized args for serverless
  const memoryOptimizedArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--hide-scrollbars',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--safebrowsing-disable-auto-update',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-component-extensions-with-background-pages',
    '--disable-features=TranslateUI,BlinkGenPropertyTrees',
    '--disable-ipc-flooding-protection',
    '--disable-renderer-backgrounding',
  ]
  
  if (isProduction) {
    const puppeteerCore = await import('puppeteer-core')
    return await puppeteerCore.default.launch({
      args: [...chromium.args, ...memoryOptimizedArgs],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  } else {
    const puppeteer = await import('puppeteer')
    return await puppeteer.default.launch({
      headless: true,
      args: memoryOptimizedArgs,
    })
  }
}

export async function POST(request: NextRequest) {
  let browser = null
  
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(ip)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString()
          }
        }
      )
    }

    const body = await request.json()
    const { url, forceRefresh } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    let validUrl: URL
    try {
      validUrl = new URL(url)
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        return NextResponse.json(
          { error: 'URL must use http or https protocol' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const normalizedUrl = normalizeUrl(validUrl.toString())

    if (forceRefresh) {
      try {
        await invalidateCache(normalizedUrl)
      } catch (invalidateError) {
        console.warn('Failed to invalidate cache, proceeding with screenshot:', invalidateError)
      }
    }

    if (!forceRefresh) {
      try {
        const cachedScreenshot = await getCachedScreenshot(normalizedUrl)
        if (cachedScreenshot) {
          return NextResponse.json({
            screenshot: cachedScreenshot,
            url: normalizedUrl,
            cached: true,
          })
        }
      } catch (cacheError) {
        console.warn('Cache check failed, proceeding with screenshot:', cacheError)
      }
    }

    browser = await getBrowser()
    const page = await browser.newPage()

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    })

    await page.setDefaultNavigationTimeout(15000)
    await page.setDefaultTimeout(15000)

    await page.goto(normalizedUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Detect the website's default theme preference
    const themePreference = await page.evaluate(() => {
      // Check for common dark mode indicators
      const html = document.documentElement
      const body = document.body
      
      // Check for dark mode classes (common in frameworks like Tailwind, Next.js, etc.)
      const hasDarkClass = html.classList.contains('dark') || 
                          html.classList.contains('dark-mode') ||
                          body.classList.contains('dark') ||
                          body.classList.contains('dark-mode')
      
      // Check for dark mode attribute
      const hasDarkAttribute = html.getAttribute('data-theme') === 'dark' ||
                               html.getAttribute('data-color-mode') === 'dark' ||
                               html.getAttribute('class')?.includes('dark')
      
      // Check computed background color brightness
      const bodyStyle = window.getComputedStyle(body)
      const bgColor = bodyStyle.backgroundColor || bodyStyle.background
      
      // Check if background is dark (simple heuristic)
      let isDarkBackground = false
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        const rgbMatch = bgColor.match(/\d+/g)
        if (rgbMatch && rgbMatch.length >= 3) {
          const r = parseInt(rgbMatch[0])
          const g = parseInt(rgbMatch[1])
          const b = parseInt(rgbMatch[2])
          // Calculate luminance (simplified)
          const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255
          isDarkBackground = luminance < 0.5
        }
      }
      
      // Check CSS custom properties for theme
      const rootStyle = window.getComputedStyle(html)
      const colorScheme = rootStyle.colorScheme || ''
      
      // Return detected theme preference
      if (hasDarkClass || hasDarkAttribute || colorScheme === 'dark') {
        return 'dark'
      }
      if (isDarkBackground) {
        return 'dark'
      }
      if (colorScheme === 'light') {
        return 'light'
      }
      
      // Default to light if we can't determine
      return 'light'
    })

    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: themePreference }
    ])

    await page.reload({
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })

    await new Promise(resolve => setTimeout(resolve, 500))

    const screenshot = await page.screenshot({
      type: 'png',
      encoding: 'base64',
      fullPage: false,
    }) as string

    await browser.close()
    browser = null

    try {
      await cacheScreenshot(normalizedUrl, screenshot)
    } catch (cacheError) {
      console.warn('Failed to cache screenshot:', cacheError)
    }

    return NextResponse.json({
      screenshot,
      url: normalizedUrl,
      cached: false,
    })
  } catch (error) {
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error('Error closing browser:', closeError)
      }
    }

    console.error('Screenshot error:', error)

    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('Navigation timeout')) {
        return NextResponse.json(
          { error: 'Screenshot request timed out. Please try again.' },
          { status: 408 }
        )
      }

      if (error.message.includes('net::ERR_NAME_NOT_RESOLVED') || error.message.includes('net::ERR_CONNECTION_REFUSED')) {
        return NextResponse.json(
          { error: 'Failed to connect to the website. Please check the URL and try again.' },
          { status: 400 }
        )
      }

      if (error.message.includes('detached') || error.message.includes('LifecycleWatcher disposed')) {
        return NextResponse.json(
          { error: 'Screenshot capture was interrupted. Please try again.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to capture screenshot. Please try again.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { clearOldCache } from '@/lib/screenshot-cache'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await clearOldCache()
    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleanup completed' 
    })
  } catch (error) {
    console.error('Cache cleanup error:', error)
    return NextResponse.json(
      { error: 'Cache cleanup failed' },
      { status: 500 }
    )
  }
}


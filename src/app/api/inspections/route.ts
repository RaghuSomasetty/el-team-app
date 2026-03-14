import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateAndAwardPoints } from '@/lib/scoring'
import { analyzeMotorCurrent } from '@/lib/motor-analysis'
import { broadcastNotification } from '@/lib/notifications'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const motorTag = searchParams.get('motorTag')
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = {}
  if (motorTag) where.motorTag = { contains: motorTag }
  if (category) where.category = category

  const db: any = prisma
  const model = db.motorInspection || db.MotorInspection

  if (!model) {
    return NextResponse.json({ error: 'Database model not initialized' }, { status: 500 })
  }

  const inspections = await model.findMany({
    where,
    orderBy: { inspectedAt: 'desc' },
    take: limit,
  })

  return NextResponse.json(inspections)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { motorTag, motorName, area, category, currentR, currentY, currentB, ratedCurrent, abnormality, inspectedBy, shift, beforeImageUrl, afterImageUrl } = body

    if (!motorTag || !inspectedBy) {
      return NextResponse.json({ error: 'motorTag and inspectedBy are required' }, { status: 400 })
    }

    // Parse values to ensure they are numbers
    const r = currentR ? parseFloat(currentR) : null
    const y = currentY ? parseFloat(currentY) : null
    const b = currentB ? parseFloat(currentB) : null
    const rated = ratedCurrent ? parseFloat(ratedCurrent) : null

    // 1. AI Analysis BEFORE saving to detect abnormalities
    const analysis = await analyzeMotorCurrent(motorTag, r, y, b, rated)
    
    // Auto-prepend AI findings to abnormality if detected
    let finalAbnormality = abnormality?.trim() || ''
    if (analysis.isAbnormal) {
      const aiNote = `[AI ALERT: ${analysis.reasons.join(' ')}]`
      finalAbnormality = finalAbnormality ? `${aiNote} ${finalAbnormality}` : aiNote
    }

    // calc average % loading
    const readings = [r, y, b].filter((v): v is number => v != null && v > 0)
    const avgCurrent = readings.length ? readings.reduce((sum, val) => sum + val, 0) / readings.length : null
    const loadingPct = avgCurrent && rated ? Math.round((avgCurrent / rated) * 100) : null

    // Use MotorInspection (case sensitive check if motorInspection is undefined)
    const db: any = prisma
    const model = db.motorInspection || db.MotorInspection

    if (!model) {
      console.error('Prisma model MotorInspection not found on client instance')
      return NextResponse.json({ error: 'Database model not initialized' }, { status: 500 })
    }

    const { points } = await calculateAndAwardPoints({
      userId: (session.user as any).id,
      userRole: (session.user as any).role,
      activityType: 'MOTOR_INSPECTION',
      description: finalAbnormality || 'Completed motor inspection',
      hasImages: !!(beforeImageUrl || afterImageUrl),
      imageCount: [beforeImageUrl, afterImageUrl].filter(Boolean).length
    })

    const record = await model.create({
      data: {
        motorTag,
        motorName: motorName || motorTag,
        area: area || 'General',
        category: category || 'LT',
        currentR: r,
        currentY: y,
        currentB: b,
        ratedCurrent: rated,
        loadingPct,
        abnormality: finalAbnormality || null,
        inspectedBy: session.user.name || 'Unknown',
        shift: shift || 'General',
        beforeImageUrl,
        afterImageUrl,
        aiScore: points
      },
    })

    // 2. BROADCAST ALERT if high priority
    if (analysis.isAbnormal && analysis.priority === 'HIGH') {
      await broadcastNotification(
        `🚨 CRITICAL MOTOR ALERT: ${motorTag}`,
        analysis.reasons[0],
        `/dashboard/inspections`
      )
    }

    return NextResponse.json(record, { status: 201 })
  } catch (err: any) {
    console.error('Inspection Save Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

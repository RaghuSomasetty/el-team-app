import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateAndAwardPoints } from '@/lib/scoring'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const area = searchParams.get('area')
  const tech = searchParams.get('technician')
  const tag = searchParams.get('tag')

  const where: any = {}
  if (area) where.area = { contains: area }
  if (tech) where.technicianName = { contains: tech }
  if (tag) where.tagNumber = { contains: tag }

  const activities = await prisma.maintenanceActivity.findMany({
    where,
    orderBy: { completedAt: 'desc' },
    include: { createdBy: { select: { name: true } } },
  })

  return NextResponse.json(activities)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const body = await req.json()

  // Calculate points
  const { points } = await calculateAndAwardPoints({
    userId: user.id,
    userRole: user.role,
    activityType: 'MAINTENANCE_WORK',
    description: body.description,
    hasImages: !!(body.beforeImageUrl || body.afterImageUrl),
    imageCount: [body.beforeImageUrl, body.afterImageUrl].filter(Boolean).length
  })

  const activity = await prisma.maintenanceActivity.create({
    data: {
      ...body,
      technicianName: session.user.name || 'Unknown',
      createdById: user.id,
      aiScore: points,
      activityType: 'MAINTENANCE_WORK'
    },
  })

  // Also add to maintenance history
  await prisma.maintenanceHistory.create({
    data: {
      equipmentTag: body.tagNumber || 'N/A',
      equipmentName: body.equipmentName,
      maintenanceType: 'Maintenance Activity',
      description: body.description,
      technicianName: session.user.name || 'Unknown',
      imageUrls: JSON.stringify([body.beforeImageUrl, body.afterImageUrl].filter(Boolean)),
    },
  })

  return NextResponse.json({ success: true, activity })
}

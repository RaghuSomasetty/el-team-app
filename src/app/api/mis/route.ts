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
  const date = searchParams.get('date')
  const status = searchParams.get('status')

  const where: any = {}
  if (area) where.area = area
  if (status) where.status = status
  if (date) {
    const d = new Date(date)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    where.date = { gte: d, lt: next }
  }

  const entries = await prisma.dailyMIS.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { createdBy: { select: { name: true } } },
  })

  return NextResponse.json(entries)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (!['ENGINEER', 'SUPERVISOR'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { date, shift, area, equipmentName, tagNumber, workType, description, engineerName } = body

  if (!date || !shift || !area || !equipmentName || !workType || !description || !engineerName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

    const { points } = await calculateAndAwardPoints({
      userId: user.id,
      userRole: user.role,
      activityType: 'MIS_ENTRY',
      description: description,
      hasImages: false, // MIS entries usually don't have separate image uploads in this form
    })

    const mis = await (prisma.dailyMIS as any).create({
      data: {
        date: new Date(date),
        shift,
        area,
        equipmentName,
        tagNumber,
        workType,
        description,
        engineerName: session.user.name || 'Unknown',
        createdById: user.id,
        status: 'APPROVED',
        aiScore: points
      },
    })

  return NextResponse.json({ success: true, mis })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, status, ...rest } = body

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const mis = await prisma.dailyMIS.update({
    where: { id },
    data: status ? { status } : rest,
  })

  return NextResponse.json({ success: true, mis })
}

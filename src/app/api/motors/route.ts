import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const area = searchParams.get('area')
  const tag = searchParams.get('tag')

  const where: any = {}
  if (area) where.area = { contains: area }
  if (tag) where.motorTag = { contains: tag }

  const motors = await prisma.motor.findMany({ where, orderBy: { motorTag: 'asc' }, take: 500 })
  return NextResponse.json(motors, {
    headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'ENGINEER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const motor = await prisma.motor.create({ data: body })
  return NextResponse.json({ success: true, motor })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...data } = body
  const motor = await prisma.motor.update({ where: { id }, data })
  return NextResponse.json({ success: true, motor })
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const area = searchParams.get('area')
  const type = searchParams.get('type')
  const tag = searchParams.get('tag')

  const where: any = {}
  if (area) where.area = { contains: area }
  if (type) where.equipmentType = { contains: type }
  if (tag) where.tagNumber = { contains: tag }

  const equipment = await prisma.equipment.findMany({ where, orderBy: { name: 'asc' } })
  return NextResponse.json(equipment)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const equipment = await prisma.equipment.create({ data: body })
  return NextResponse.json({ success: true, equipment })
}

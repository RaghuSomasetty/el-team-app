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

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

  try {
    await prisma.equipment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const updated = await prisma.equipment.update({ where: { id }, data })
    return NextResponse.json({ success: true, equipment: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

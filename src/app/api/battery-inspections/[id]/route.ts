import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const inspection = await prisma.batteryInspection.findUnique({
      where: { id: params.id },
      include: { readings: { orderBy: { batteryNumber: 'asc' } } }
    })
    
    if (!inspection) return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    
    return NextResponse.json(inspection)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inspection details' }, { status: 500 })
  }
}

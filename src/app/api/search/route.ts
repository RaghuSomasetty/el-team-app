import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  const [motors, equipment, parts, mis] = await Promise.all([
    prisma.motor.findMany({
      where: { 
        OR: [
          { motorTag: { contains: q, mode: 'insensitive' } }, 
          { motorName: { contains: q, mode: 'insensitive' } }, 
          { area: { contains: q, mode: 'insensitive' } },
          { manufacturer: { contains: q, mode: 'insensitive' } }
        ] 
      },
      take: 10,
    }),
    prisma.equipment.findMany({
      where: { 
        OR: [
          { tagNumber: { contains: q, mode: 'insensitive' } }, 
          { name: { contains: q, mode: 'insensitive' } },
          { area: { contains: q, mode: 'insensitive' } },
          { equipmentType: { contains: q, mode: 'insensitive' } }
        ] 
      },
      take: 10,
    }),
    prisma.sparePart.findMany({
      where: { 
        OR: [
          { partName: { contains: q, mode: 'insensitive' } }, 
          { partNumber: { contains: q, mode: 'insensitive' } },
          { equipment: { contains: q, mode: 'insensitive' } }
        ] 
      },
      take: 10,
    }),
    prisma.dailyMIS.findMany({
      where: { 
        OR: [
          { equipmentName: { contains: q, mode: 'insensitive' } }, 
          { tagNumber: { contains: q, mode: 'insensitive' } }, 
          { workType: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ] 
      },
      take: 10,
      orderBy: { date: 'desc' },
    }),
  ])

  return NextResponse.json({ motors, equipment, parts, mis })
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { 
      inspectorName, 
      readings, // Array of { section, batteryNumber, voltage, specificGravity, status, isDeviationFlagged }
      totalVoltage_110V,
      averageVoltage_110V,
      minVoltage_110V,
      maxVoltage_110V,
      totalBatteries,
      healthyCount,
      warningCount,
      criticalCount,
      observations,
      imageUrls
    } = body

    const inspection = await prisma.batteryInspection.create({
      data: {
        inspectorName,
        inspectorId: (session.user as any).id,
        totalVoltage_110V,
        averageVoltage_110V,
        minVoltage_110V,
        maxVoltage_110V,
        totalBatteries,
        healthyCount,
        warningCount,
        criticalCount,
        observations,
        imageUrls: JSON.stringify(imageUrls || []),
        readings: {
          create: readings.map((r: any) => ({
            section: r.section,
            batteryNumber: r.batteryNumber,
            voltage: r.voltage ? parseFloat(r.voltage) : null,
            specificGravity: r.specificGravity ? parseFloat(r.specificGravity) : null,
            status: r.status || 'NORMAL',
            isDeviationFlagged: !!r.isDeviationFlagged
          }))
        }
      },
      include: {
        readings: true
      }
    })

    return NextResponse.json(inspection)
  } catch (error: any) {
    console.error('Error saving battery inspection:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const inspections = await prisma.batteryInspection.findMany({
      orderBy: { date: 'desc' },
      take: 50
    })
    return NextResponse.json(inspections)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 })
  }
}

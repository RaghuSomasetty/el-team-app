import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get the latest battery inspection
    const latestInspection = await prisma.batteryInspection.findFirst({
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        aiAnalysis: true,
        recommendations: true,
        criticalCount: true,
        warningCount: true,
        healthyCount: true
      }
    })

    if (!latestInspection) {
      return NextResponse.json({ 
        hasData: false,
        message: 'No battery inspections found' 
      })
    }

    // Extract total bank voltages from aiAnalysis
    // Examples: "[110V DC Battery Bank] Total Voltage: 110.5V" or "[Module-1 24V New Battery] Total Voltage: 24.2V"
    const analysis = latestInspection.aiAnalysis || ''
    const v110Match = analysis.match(/110V.*?Total Voltage: ([\d.]+)V/)
    const v24Match = analysis.match(/24V.*?Total Voltage: ([\d.]+)V/)

    let status = 'GOOD'
    if (latestInspection.criticalCount > 0) status = 'CRITICAL'
    else if (latestInspection.warningCount > 0) status = 'WARNING'

    const stats = {
      hasData: true,
      inspectionId: latestInspection.id,
      date: latestInspection.date,
      status: status,
      v110: v110Match ? parseFloat(v110Match[1]) : null,
      v24: v24Match ? parseFloat(v24Match[1]) : null,
      recommendation: (latestInspection.recommendations || '').split('|')[0].trim()
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching battery stats:', error)
    return NextResponse.json({ error: 'Failed to fetch battery stats' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

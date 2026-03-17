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

    // --- VoltMind AI Analysis Logic ---
    const analyzeBatteryHealth = () => {
      const sectionNames: Record<string, string> = {
        '110V_DC': '110V DC Battery Bank',
        'UPS': 'UPS System Battery',
        'MODULE_1_OLD': 'Module-1 24V Old Battery',
        'MODULE_2_OLD': 'Module-2 24V Old Battery',
        'MODULE_1_NEW': 'Module-1 24V New Battery',
        'MODULE_2_NEW': 'Module-2 24V New Battery',
        'DG_SYSTEM': 'DG System Battery'
      }

      let analysisBlocks: string[] = []
      let recommendationBlocks: string[] = []

      const sections: string[] = Array.from(new Set(readings.map((r: any) => r.section as string)))

      sections.forEach((secId) => {
        const secReadings = readings.filter((r: any) => r.section === secId)
        const secName = sectionNames[secId as string] || secId
        
        const totalV = secReadings.reduce((sum: number, r: any) => sum + (parseFloat(r.voltage) || 0), 0)

        // Threshold configurations
        const isNiCd14 = secId === 'MODULE_1_OLD' || secId === 'MODULE_2_OLD'
        const thresholds = isNiCd14 ? {
          critical: 1.25,
          warning: 1.35
        } : {
          critical: 2.05,
          warning: 2.14
        }

        const weakCells = secReadings.filter((r: any) => parseFloat(r.voltage) < thresholds.critical)
        const warningCells = secReadings.filter((r: any) => {
          const v = parseFloat(r.voltage)
          return v >= thresholds.critical && v <= thresholds.warning
        })
        const lowGravityCells = secReadings.filter((r: any) => r.specificGravity && parseFloat(r.specificGravity) < 1.18)

        let secAnalysis = `[${secName}] Total Voltage: ${totalV.toFixed(1)}V. `
        let secRecs = `${secName}: `

        if (weakCells.length > 0) {
          secAnalysis += `Detected ${weakCells.length} CRITICAL cells (< ${thresholds.critical}V). `
          secRecs += `Replace cells ${weakCells.map((c: any) => c.batteryNumber).join(', ')}. `
        }
        
        if (warningCells.length > 0) {
          secAnalysis += `${warningCells.length} cells in warning range (${thresholds.critical}V-${thresholds.warning}V). `
          if (secRecs.length < 30) secRecs += `Schedule equalizing charge for these cells. `
          else secRecs += `Monitor warning cells. `
        }

        if (lowGravityCells.length > 0) {
          secAnalysis += `${lowGravityCells.length} cells with low specific gravity. `
          secRecs += `Check electrolyte levels. `
        }

        // Check for nominal voltage issues
        if (secId === '110V_DC' && totalV < 110) {
          secAnalysis += `BANK VOLTAGE LOW (${totalV.toFixed(1)}V < 110V). `
          secRecs += `Check charger health immediately. `
        } else if (secId === 'UPS' && totalV < 220) {
          secAnalysis += `BANK VOLTAGE LOW (${totalV.toFixed(1)}V < 220V). `
          secRecs += `Check UPS charger health. `
        } else if ((secId.includes('MODULE') || secId === 'DG_SYSTEM') && totalV < 24) {
          secAnalysis += `BANK VOLTAGE LOW (${totalV.toFixed(1)}V < 24V). `
          secRecs += `Check 24V charger. `
        }

        if (weakCells.length === 0 && warningCells.length === 0 && lowGravityCells.length === 0) {
          secAnalysis += `Parameters normal. `
          secRecs += `Maintain routine schedule. `
        }

        analysisBlocks.push(secAnalysis.trim())
        recommendationBlocks.push(secRecs.trim())
      })

      return {
        aiAnalysis: analysisBlocks.join(' | '),
        recommendations: recommendationBlocks.join(' | ')
      }
    }

    const { aiAnalysis, recommendations } = analyzeBatteryHealth()

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
        aiAnalysis,
        recommendations,
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

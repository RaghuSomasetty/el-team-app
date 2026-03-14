import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const timeframe = searchParams.get('timeframe') || 'weekly' // weekly, monthly, total

  const orderByField = 
    timeframe === 'monthly' ? 'monthlyPoints' : 
    timeframe === 'total' ? 'totalPoints' : 'weeklyPoints'

  const leaderboard = await (prisma as any).leaderboardScore.findMany({
    where: {
      user: {
        role: { in: ['TECHNICIAN', 'SUPERVISOR', 'ENGINEER'] }
      }
    },
    include: {
      user: {
        select: {
          name: true,
          designation: true,
          email: true
        }
      }
    },
    orderBy: {
      [orderByField]: 'desc'
    },
    take: 20
  })

  // Calculate activities count per user for the ranking display
  // For simplicity, we'll return the score data and the UI can fetch more if needed, 
  // or we can aggregate here. Let's aggregate for a better UX.
  
  const formattedLeaderboard = await Promise.all(leaderboard.map(async (entry: any) => {
    const activityCount = await prisma.maintenanceActivity.count({
      where: { createdById: entry.userId }
    })
    const inspectionCount = await prisma.motorInspection.count({
      where: { inspectedBy: entry.user.name } // Note: we should use userId in model ideally, but let's stick to current schema
    })

    return {
      userId: entry.userId,
      name: entry.user.name,
      designation: entry.user.designation,
      points: entry[orderByField as keyof typeof entry],
      totalActivities: activityCount + inspectionCount,
      rank: 0 // Will be assigned by client or after full fetch
    }
  }))

  return NextResponse.json(formattedLeaderboard)
}

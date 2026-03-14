import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { broadcastNotification } from '@/lib/notifications'

export async function POST(req: Request) {
  // Secure this with a secret key for CRON jobs
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Find the weekly top performer
    const topScore = await (prisma as any).leaderboardScore.findFirst({
      where: {
        user: { role: { in: ['TECHNICIAN', 'SUPERVISOR'] } },
        weeklyPoints: { gt: 0 }
      },
      include: { user: { select: { name: true } } }, // Get name for notification
      orderBy: { weeklyPoints: 'desc' }
    })

    if (topScore) {
      // 2. Save to WeeklyWinner
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - 7)
      
      await (prisma as any).weeklyWinner.create({
        data: {
          userId: topScore.userId,
          weekStart,
          weekEnd: now,
          totalPoints: topScore.weeklyPoints
        }
      })

      // BROADCAST NOTIFICATION
      await broadcastNotification(
        '🏆 New Weekly Champion!',
        `Congratulations to ${topScore.user.name} for topping the leaderboard with ${topScore.weeklyPoints} points!`,
        '/dashboard/leaderboard'
      )
    }

    // 3. Reset Weekly Points for everyone
    await (prisma as any).leaderboardScore.updateMany({
      data: {
        weeklyPoints: 0,
        lastUpdated: new Date()
      }
    })

    return NextResponse.json({ success: true, message: 'Weekly reset completed successfully' })
  } catch (error) {
    console.error('Weekly reset error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get the user with the highest weekly points
    const topScore = await (prisma as any).leaderboardScore.findFirst({
      where: {
        user: {
          role: { in: ['TECHNICIAN', 'SUPERVISOR'] }
        },
        weeklyPoints: { gt: 0 }
      },
      include: {
        user: {
          select: {
            name: true,
            designation: true
          }
        }
      },
      orderBy: {
        weeklyPoints: 'desc'
      }
    })

    if (!topScore) {
      return NextResponse.json({ champion: null })
    }

    return NextResponse.json({
      champion: {
        name: topScore.user.name,
        points: topScore.weeklyPoints,
        designation: topScore.user.designation
      }
    })
  } catch (error) {
    console.error('Error fetching champion:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

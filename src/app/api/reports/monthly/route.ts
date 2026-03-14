import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)

  const [misEntries, activities] = await Promise.all([
    prisma.dailyMIS.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: 'asc' },
    }),
    prisma.maintenanceActivity.findMany({
      where: { completedAt: { gte: start, lt: end } },
      orderBy: { completedAt: 'asc' },
    }),
  ])

  // Group MIS by work type
  const grouped: Record<string, typeof misEntries> = {}
  for (const entry of misEntries) {
    if (!grouped[entry.workType]) grouped[entry.workType] = []
    grouped[entry.workType].push(entry)
  }

  const summary = {
    month: `${start.toLocaleString('default', { month: 'long' })} ${year}`,
    totalMIS: misEntries.length,
    totalActivities: activities.length,
    byWorkType: grouped,
    activities,
    misEntries,
  }

  return NextResponse.json(summary)
}

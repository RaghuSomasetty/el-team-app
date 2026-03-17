import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Fetch User details and Score
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        leaderboardScore: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Fetch all activities linked to this user
    // We fetch from MaintenanceActivity, DailyMIS (if createdBy matches), and MotorInspection (by name matching if no link)
    
    // a. Maintenance Activities
    const maintenanceActivities = await prisma.maintenanceActivity.findMany({
      where: { createdById: userId },
      orderBy: { completedAt: 'desc' }
    })

    // b. Daily MIS entries
    const misEntries = await prisma.dailyMIS.findMany({
      where: { createdById: userId },
      orderBy: { date: 'desc' }
    })

    // c. Motor Inspections (matching by inspector name or ID if linked)
    const motorInspections = await prisma.motorInspection.findMany({
      where: { 
        OR: [
          { inspectedBy: user.name },
          // Note: MotorInspection model doesn't have an inspectorId field in current schema, 
          // but if it did, we'd use it. Matching by name for now.
        ]
      },
      orderBy: { inspectedAt: 'desc' }
    })

    // 3. Format into a unified "Task" object for the report
    const tasks = [
      ...maintenanceActivities.map(a => ({
        id: a.id,
        type: 'MAINTENANCE',
        title: a.equipmentName,
        category: a.activityType || 'Maintenance',
        date: a.completedAt,
        description: a.description,
        points: a.aiScore || 10, // Fallback base points
        images: [a.beforeImageUrl, a.afterImageUrl].filter(Boolean) as string[],
        status: 'COMPLETED'
      })),
      ...misEntries.map(m => ({
        id: m.id,
        type: 'MIS',
        title: m.equipmentName,
        category: m.workType,
        date: m.date,
        description: m.description,
        points: m.aiScore || 15,
        images: [] as string[],
        status: m.status
      })),
      ...motorInspections.map(i => ({
        id: i.id,
        type: 'INSPECTION',
        title: i.motorName,
        category: 'Motor Inspection',
        date: i.inspectedAt,
        description: i.abnormality || 'Routine inspection',
        points: i.aiScore || 10,
        images: [i.beforeImageUrl, i.afterImageUrl].filter(Boolean) as string[],
        status: 'COMPLETED'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // 4. Calculate Summary Stats
    const totalPoints = user.leaderboardScore?.totalPoints || 0
    const totalTasks = tasks.length
    const avgPointsPerTask = totalTasks > 0 ? (totalPoints / totalTasks).toFixed(1) : 0
    
    // Tasks this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const tasksThisMonth = tasks.filter(t => new Date(t.date) >= startOfMonth).length

    // Performance trend (last 7 days of points)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      return d
    }).reverse()

    const trend = last7Days.map(day => {
      const dayPoints = tasks
        .filter(t => {
          const taskDate = new Date(t.date)
          taskDate.setHours(0, 0, 0, 0)
          return taskDate.getTime() === day.getTime()
        })
        .reduce((sum, t) => sum + (t.points || 0), 0)
      
      return {
        date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        points: dayPoints
      }
    })

    return NextResponse.json({
      userDetails: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department || 'Electrical',
        designation: user.designation || 'Technician',
        role: user.role,
        image: user.image
      },
      summary: {
        totalPoints,
        totalTasks,
        tasksThisMonth,
        avgPointsPerTask
      },
      trend,
      tasks
    })

  } catch (error) {
    console.error('Error generating user report:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

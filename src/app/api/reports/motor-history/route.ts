import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const motorTag = searchParams.get('motorTag')

  if (!motorTag) {
    return NextResponse.json({ error: 'motorTag is required' }, { status: 400 })
  }

  try {
    const db: any = prisma
    const model = db.motorInspection || db.MotorInspection

    const history = await model.findMany({
      where: { 
        motorTag: { contains: motorTag }
      },
      orderBy: { inspectedAt: 'asc' }, // Ascending for trend analysis
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('Motor History Export Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

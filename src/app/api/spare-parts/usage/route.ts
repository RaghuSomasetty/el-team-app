import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { sparePartId, quantityUsed, reason } = await req.json()

    if (!sparePartId || !quantityUsed) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const usage = await prisma.sparePartUsage.create({
      data: {
        sparePartId,
        quantityUsed,
        reason,
        reportedById: (session.user as any).id,
        status: 'PENDING',
      },
      include: {
        sparePart: true,
      }
    })

    return NextResponse.json({ success: true, usage })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Engineers and Supervisors can see all pending requests
  // Technicians can see their own requests
  const role = (session.user as any).role
  const userId = (session.user as any).id

  const where = role === 'TECHNICIAN' 
    ? { reportedById: userId } 
    : {}

  try {
    const usages = await prisma.sparePartUsage.findMany({
      where,
      include: {
        sparePart: true,
        reportedBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(usages)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

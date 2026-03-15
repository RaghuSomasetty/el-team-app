import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'ENGINEER' && user.role !== 'SUPERVISOR') {
    return NextResponse.json({ error: 'Only Engineers or Supervisors can approve usage' }, { status: 403 })
  }

  try {
    const { status, reason } = await req.json()
    const usageId = params.id

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get the usage request
    const usage = await prisma.sparePartUsage.findUnique({
      where: { id: usageId },
      include: { sparePart: true }
    })

    if (!usage) {
      return NextResponse.json({ error: 'Usage request not found' }, { status: 404 })
    }

    if (usage.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 })
    }

    // Use a transaction to update status and deduct quantity
    const result = await prisma.$transaction(async (tx) => {
      const updatedUsage = await tx.sparePartUsage.update({
        where: { id: usageId },
        data: {
          status,
          approvedById: user.id,
          reason,
        }
      })

      if (status === 'APPROVED') {
        // Double check stock
        if (usage.sparePart.quantity < usage.quantityUsed) {
          throw new Error('Insufficient stock to approve this request')
        }

        await tx.sparePart.update({
          where: { id: usage.sparePartId },
          data: {
            quantity: { decrement: usage.quantityUsed }
          }
        })
      }

      return updatedUsage
    })

    return NextResponse.json({ success: true, usage: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

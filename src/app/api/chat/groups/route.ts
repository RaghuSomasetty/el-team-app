import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Ensure a single main group exists
  let group = await prisma.chatGroup.findFirst({
    where: { name: 'EL-TEAM Maintenance' }
  })

  if (!group) {
    group = await prisma.chatGroup.create({
      data: {
        id: 'team_main',
        name: 'EL-TEAM Maintenance',
        area: 'General',
      }
    })
  }

  return NextResponse.json([group])
}

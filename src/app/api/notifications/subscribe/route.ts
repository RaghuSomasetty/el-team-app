import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { endpoint, keys } = body

    if (!endpoint || !keys) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const subscription = await (prisma as any).pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: (session?.user as any)?.id || null
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: (session?.user as any)?.id || null
      }
    })

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

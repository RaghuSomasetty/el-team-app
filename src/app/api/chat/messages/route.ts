import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastNotification } from '@/lib/notifications'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')
  if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })

  const messages = await prisma.chatMessage.findMany({
    where: { groupId },
    orderBy: { createdAt: 'asc' },
    take: 100,
    include: { sender: { select: { name: true, designation: true, image: true } } },
  })

  return NextResponse.json(messages)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const body = await req.json()
  const { groupId, content, imageUrl, messageType } = body

  if (!groupId || !content) return NextResponse.json({ error: 'groupId and content required' }, { status: 400 })

  const message = await prisma.chatMessage.create({
    data: {
      groupId,
      content,
      imageUrl,
      messageType: messageType || 'TEXT',
      senderId: user.id,
    },
    include: { sender: { select: { name: true, designation: true, image: true } } },
  })

  // AI: detect maintenance messages and suggest MIS extraction
  let aiExtracted = null
  const lower = content.toLowerCase()
  const isMaintenance = ['pmi', 'rpmi', 'completed', 'done', 'replaced', 'repaired', 'checked', 'inspected', 'fixed'].some(k => lower.includes(k))

  if (isMaintenance) {
    const tagMatch = content.match(/([\d]{2}\.[\d]{2}(?:\.[\d]{2})?)/)?.[1]
    const workType = lower.includes('pmi') ? 'PMI' : lower.includes('rpmi') ? 'RPMI' : lower.includes('cable') ? 'Cable' : lower.includes('light') ? 'Lighting' : 'Other'

    // Find motor if tag exists
    let area = 'General'
    let equipmentName = 'Motor'
    if (tagMatch) {
      const motor = await prisma.motor.findFirst({ where: { motorTag: { contains: tagMatch } } })
      if (motor) { area = motor.area; equipmentName = motor.motorName }
    }

    aiExtracted = { tagMatch, workType, area, equipmentName, description: content }
  }

  // Trigger Push Notification
  try {
    const notificationTitle = `💬 New Team Message`
    const truncatedContent = content.length > 60 ? content.substring(0, 57) + '...' : content
    const notificationBody = `${user.name}: ${truncatedContent}`
    
    // Broadcast to everyone (except the sender would be ideal, but for now broadcast to all is safer for connectivity)
    await broadcastNotification(notificationTitle, notificationBody, '/dashboard/chat')
  } catch (err) {
    console.error('Failed to broadcast chat notification:', err)
  }

  return NextResponse.json({ message, aiExtracted })
}

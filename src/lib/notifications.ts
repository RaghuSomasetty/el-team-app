import webpush from 'web-push'
import { prisma } from './prisma'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!

webpush.setVapidDetails(
  'mailto:support@el-team.com',
  vapidPublicKey,
  vapidPrivateKey
)

export async function sendPushNotification(subscription: any, payload: any) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    )
    return { success: true }
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired or no longer valid, delete it
      await (prisma as any).pushSubscription.delete({
        where: { endpoint: subscription.endpoint },
      })
    }
    console.error('Error sending push notification:', error)
    return { success: false, error }
  }
}

export async function broadcastNotification(title: string, body: string, url: string = '/dashboard/leaderboard') {
  const subscriptions = await (prisma as any).pushSubscription.findMany()
  
  const payload = {
    title,
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/favicon.ico',
    data: { url }
  }

  console.log(`Broadcasting to ${subscriptions.length} devices...`)

  const results = await Promise.allSettled(
    subscriptions.map((sub: any) => sendPushNotification(sub, payload))
  )

  const sent = results.filter(r => r.status === 'fulfilled' && (r as any).value?.success).length
  console.log(`Broadcast finished. Sent: ${sent}/${subscriptions.length}`)

  return {
    total: subscriptions.length,
    sent,
  }
}

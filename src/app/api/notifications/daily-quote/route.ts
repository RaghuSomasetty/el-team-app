import { NextResponse } from 'next/server'
import { broadcastNotification } from '@/lib/notifications'
import OpenAI from 'openai'


export async function POST(req: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  // Secure this with a secret key for CRON jobs
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Generate an electrical-themed motivational quote with AI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant for a team of Electrical Maintenance Engineers and Technicians. Generate a short, powerful, and unique motivational quote specifically tailored for electrical maintenance professionals. Use electrical metaphors (voltage, current, resistance, grounding, sparks, light, etc.). Keep it under 150 characters."
        },
        {
          role: "user",
          content: "Give me today's electrical motivational quote."
        }
      ],
      temperature: 0.8,
    })

    const quote = response.choices[0]?.message?.content?.replace(/\"/g, '') || "Stay grounded, stay safe, and keep the power flowing!"

    // Broadcast to all subscribers
    const result = await broadcastNotification(
      '⚡ Today\'s Electrical Charge',
      quote,
      '/dashboard'
    )

    return NextResponse.json({ 
      success: true, 
      quote,
      notificationsSent: result.sent,
      totalSubscriptions: result.total
    })
  } catch (error) {
    console.error('Daily quote error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

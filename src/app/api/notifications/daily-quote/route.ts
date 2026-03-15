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
    // Randomly choose language
    const language = Math.random() > 0.5 ? 'English' : 'Hindi'
    
    // Generate an electrical-themed motivational quote with AI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are VoltMind AI, an assistant for a team of Electrical Maintenance Engineers and Technicians. Generate a short, powerful, and unique motivational quote specifically tailored for electrical maintenance professionals. 
          The quote MUST be in ${language}${language === 'Hindi' ? ' (written in Hindi script)' : ''}.
          Use electrical metaphors (voltage, current, resistance, grounding, sparks, light, etc.). 
          Keep it under 150 characters. 
          Do not use quotes around the response.`
        },
        {
          role: "user",
          content: `Give me today's electrical motivational quote in ${language}.`
        }
      ],
      temperature: 0.8,
    })

    const quote = response.choices[0]?.message?.content?.trim() || (language === 'English' ? "Stay grounded, stay safe, and keep the power flowing!" : "ग्राउंडेड रहें, सुरक्षित रहें और ऊर्जा का प्रवाह बनाए रखें!")

    // Broadcast to all subscribers
    const result = await broadcastNotification(
      '⚡ VoltMind Daily Charge',
      quote,
      '/dashboard'
    )

    return NextResponse.json({ 
      success: true, 
      language,
      quote,
      notificationsSent: result.sent,
      totalSubscriptions: result.total
    })
  } catch (error) {
    console.error('Daily quote error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

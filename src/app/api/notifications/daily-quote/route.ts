import { NextResponse } from 'next/server'
import { broadcastNotification } from '@/lib/notifications'
import { GoogleGenerativeAI } from '@google/generative-ai'


export async function POST(req: Request) {
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  const genAI = new GoogleGenerativeAI(geminiKey)

  // Secure this with a secret key for CRON jobs
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET || 'el_team_reset_secret_2026'
  
  if (secret !== expectedSecret) {
    console.warn(`Unauthorized notification attempt. Received: ${secret}, Expected: ${expectedSecret.substring(0, 4)}...`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Randomly choose language
    const language = Math.random() > 0.5 ? 'English' : 'Hindi'
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: `You are VoltMind AI, an assistant for a team of Electrical Maintenance Engineers and Technicians. Generate a short, powerful, and unique motivational quote specifically tailored for electrical maintenance professionals. 
           The quote MUST be in ${language}${language === 'Hindi' ? ' (written in Hindi script)' : ''}.
           Use electrical metaphors (voltage, current, resistance, grounding, sparks, light, etc.). 
           Keep it under 150 characters. 
           Do not use quotes around the response.`,
    })

    // Generate an electrical-themed motivational quote with AI
    const result = await model.generateContent(
      `Give me today's electrical motivational quote in ${language}.`
    )

    const quote = result.response.text()?.trim() || (language === 'English' ? "Stay grounded, stay safe, and keep the power flowing!" : "ग्राउंडेड रहें, सुरक्षित रहें और ऊर्जा का प्रवाह बनाए रखें!")

    // Broadcast to all subscribers
    const broadcastResult = await broadcastNotification(
      '⚡ VoltMind Daily Charge',
      quote,
      '/dashboard'
    )

    return NextResponse.json({ 
      success: true, 
      language,
      quote,
      notificationsSent: broadcastResult.sent,
      totalSubscriptions: broadcastResult.total
    })
  } catch (error) {
    console.error('Daily quote error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Clean up old OTPs for this email
    await prisma.verificationRequest.deleteMany({ where: { email } })

    // Store OTP
    await prisma.verificationRequest.create({
      data: {
        email,
        token: otp,
        expires,
      },
    })

    // SEND REAL EMAIL via Resend
    if (resend) {
      try {
        await resend.emails.send({
          from: 'EL-TEAM <onboarding@resend.dev>',
          to: [email],
          subject: 'EL-TEAM Verification Code: ' + otp,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #111; max-width: 600px; margin: auto;">
              <h2 style="color: #3b82f6;">Welcome to EL-TEAM</h2>
              <p>To complete your registration, please use the following verification code:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; padding: 30px; background: #f8fafc; border-radius: 8px; text-align: center; margin: 20px 0;">
                ${otp}
              </div>
              <p>This code will expire in <b>10 minutes</b>.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="font-size: 12px; color: #666;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
          `
        });
      } catch (emailError: any) {
        console.error('Resend Error:', emailError);
        // We still log the OTP for backup in server logs
        console.log(`[BACKUP OTP] ${email}: ${otp}`);
      }
    } else {
      console.log(`[AUTH] MOCK OTP for ${email}: ${otp}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: process.env.RESEND_API_KEY ? 'OTP sent to email (verify inbox/spam)' : 'OTP generated (Dev/Mock Mode)', 
      // Return OTP in response ONLY in dev mode or if missing key (for immediate testing)
      otp: (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) ? otp : undefined 
    })
  } catch (error: any) {
    console.error('OTP Error:', error)
    return NextResponse.json({ 
      error: 'Failed to send OTP', 
      details: error.message 
    }, { status: 500 })
  }
}

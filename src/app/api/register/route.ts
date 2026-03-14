import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { name, email, phone, designation, password } = await req.json()

    if (!name || !email || !designation || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Map designation to role
    const roleMap: Record<string, string> = {
      Engineer: 'ENGINEER',
      Supervisor: 'SUPERVISOR',
      Technician: 'TECHNICIAN',
    }
    const role = roleMap[designation] || 'TECHNICIAN'

    const user = await prisma.user.create({
      data: { name, email, phone, designation, passwordHash, role },
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (error: any) {
    console.error('Register Error:', error)
    return NextResponse.json({ 
      error: 'Registration failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 })
  }
}

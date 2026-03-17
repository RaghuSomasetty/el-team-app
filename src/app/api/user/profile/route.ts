import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        designation: true,
        department: true,
        employeeId: true,
        phone: true,
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, employeeId, department, designation, phone, image } = body
    const userId = (session.user as any).id
    
    const updateData: any = {}
    if (name) updateData.name = name
    if (employeeId !== undefined) updateData.employeeId = employeeId
    if (department !== undefined) updateData.department = department
    if (designation !== undefined) updateData.designation = designation
    if (phone !== undefined) updateData.phone = phone
    if (image !== undefined) updateData.image = image

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        employeeId: true,
        department: true,
        designation: true,
        phone: true,
        image: true
      }
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Error updating profile:', error)
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Employee ID already in use' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

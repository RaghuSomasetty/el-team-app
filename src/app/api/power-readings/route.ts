import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateNetConsumption } from '@/lib/powerUtils';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const where: any = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const readings = await prisma.powerReading.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        createdBy: {
          select: { name: true, designation: true },
        },
      },
      take: 100, // Limit to recent 100
    });

    return NextResponse.json(readings);
  } catch (error: any) {
    console.error('Error fetching power readings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only Engineers and Supervisors can add/edit readings
  const userRole = (session.user as any).role;
  if (userRole === 'TECHNICIAN') {
    return NextResponse.json({ error: 'Permission denied. Only Engineers or Supervisors can enter data.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { 
      date, 
      incomer1, 
      incomer2, 
      outgoing1_TS12, 
      outgoing1_TS13, 
      outgoing1_TS19_24, 
      outgoing2_TS12, 
      outgoing2_TS13, 
      outgoing2_TS19_24 
    } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Convert date string to ISO Date (normalized to midnight)
    const readingDate = new Date(date);
    readingDate.setHours(0, 0, 0, 0);

    // Calculate Net Consumption for today
    const totalConsumption = calculateNetConsumption({
      incomer1,
      incomer2,
      outgoing1_TS12,
      outgoing1_TS13,
      outgoing1_TS19_24,
      outgoing2_TS12,
      outgoing2_TS13,
      outgoing2_TS19_24
    });

    // Fetch previous day reading to calculate delta
    const prevDate = new Date(readingDate);
    prevDate.setDate(readingDate.getDate() - 1);
    
    let dailyConsumption = 0;
    const prevReading = await prisma.powerReading.findUnique({
      where: { date: prevDate }
    });

    if (prevReading) {
      dailyConsumption = totalConsumption - prevReading.totalConsumption;
    }

    // Upsert the reading
    const reading = await prisma.powerReading.upsert({
      where: { date: readingDate },
      update: {
        incomer1,
        incomer2,
        outgoing1_TS12,
        outgoing1_TS13,
        outgoing1_TS19_24,
        outgoing2_TS12,
        outgoing2_TS13,
        outgoing2_TS19_24,
        totalConsumption,
        dailyConsumption,
        createdById: (session.user as any).id,
      },
      create: {
        date: readingDate,
        incomer1,
        incomer2,
        outgoing1_TS12,
        outgoing1_TS13,
        outgoing1_TS19_24,
        outgoing2_TS12,
        outgoing2_TS13,
        outgoing2_TS19_24,
        totalConsumption,
        dailyConsumption,
        createdById: (session.user as any).id,
      },
    });

    return NextResponse.json({ success: true, reading });
  } catch (error: any) {
    console.error('Error saving power reading:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userRole = (session.user as any).role;
  if (userRole === 'TECHNICIAN') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  try {
    await prisma.powerReading.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

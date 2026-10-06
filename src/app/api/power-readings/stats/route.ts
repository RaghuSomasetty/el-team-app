import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const startMonth = startOfMonth(now);
  const endMonth = endOfMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  try {
    // 1. Fetch current month's readings
    const monthlyReadings = await prisma.powerReading.findMany({
      where: {
        date: {
          gte: startMonth,
          lte: endMonth,
        },
      },
      orderBy: { date: 'asc' },
    });

    // 2. Fetch today's reading
    const todayReading = await prisma.powerReading.findFirst({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 3. Calculate statistics
    const totalMonthlyConsumption = monthlyReadings.reduce((sum: number, r: any) => sum + r.totalConsumption, 0);
    const avgDailyConsumption = monthlyReadings.length > 0 ? totalMonthlyConsumption / monthlyReadings.length : 0;
    
    // Calculate Peak Load (kVA proxy using max totalConsumption)
    let peakLoad = 0;
    let maxDay: any = null;
    let minDay: any = null;
    if (monthlyReadings.length > 0) {
      maxDay = monthlyReadings.reduce((max: any, r: any) => (r.totalConsumption > max.totalConsumption ? r : max), monthlyReadings[0]);
      minDay = monthlyReadings.reduce((min: any, r: any) => (r.totalConsumption < min.totalConsumption ? r : min), monthlyReadings[0]);
      peakLoad = Math.max(...monthlyReadings.map((r: any) => r.totalConsumption));
    }

    // 4. Chart Data: Daily/Periodic Trends
    // We'll map all readings for the trend so the chart can show sub-daily progression if available
    const trends = monthlyReadings.map((r: any) => ({
      date: r.date.toISOString(),
      label: r.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalConsumption: r.totalConsumption,
      dailyConsumption: r.dailyConsumption,
    }));

    // 5. Chart Data: Incomer vs Outgoing (Aggregated for current month)
    const totalIncomers = monthlyReadings.reduce((sum: number, r: any) => sum + (r.incomer1 + r.incomer2) * 1000, 0);
    const totalOutgoings = monthlyReadings.reduce((sum: number, r: any) => sum + (
      r.outgoing1_TS12 + 
      r.outgoing1_TS13 + 
      r.outgoing1_TS19_24 + 
      r.outgoing2_TS12 + 
      r.outgoing2_TS13 + 
      r.outgoing2_TS19_24
    ), 0);

    return NextResponse.json({
      today: todayReading || null,
      peakLoad: peakLoad,
      monthly: {
        total: totalMonthlyConsumption,
        average: avgDailyConsumption,
        max: maxDay,
        min: minDay,
        count: monthlyReadings.length,
      },
      charts: {
        trends,
        comparison: [
          { name: 'Total Incomers', value: totalIncomers },
          { name: 'Total Outgoings', value: totalOutgoings },
          { name: 'Net Loss/Internal', value: totalIncomers - totalOutgoings },
        ]
      }
    });
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { prisma } from './prisma'

export interface MotorAnalysisResult {
  isAbnormal: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
}

export async function analyzeMotorCurrent(
  motorTag: string,
  currentR: number | null,
  currentY: number | null,
  currentB: number | null,
  ratedCurrent: number | null
): Promise<MotorAnalysisResult> {
  const reasons: string[] = [];
  let isAbnormal = false;
  let priority = 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH';

  const r = currentR || 0;
  const y = currentY || 0;
  const b = currentB || 0;
  const rated = ratedCurrent || 1;

  // 1. Overload Detection (>105% of rated current)
  const avgCurrent = (r + y + b) / 3;
  const loadingPct = (avgCurrent / rated) * 100;

  if (loadingPct > 120) {
    isAbnormal = true;
    priority = 'HIGH' as const;
    reasons.push(`CRITICAL OVERLOAD: Motor is running at ${loadingPct.toFixed(1)}% loading (Rated: ${rated}A).`);
  } else if (loadingPct > 105) {
    isAbnormal = true;
    priority = (priority === 'HIGH' ? 'HIGH' : 'MEDIUM') as any;
    reasons.push(`OVERLOAD: Motor is running at ${loadingPct.toFixed(1)}% loading exceeding rated capacity.`);
  }

  // 2. Phase Imbalance Detection (>15% difference between phases)
  const max = Math.max(r, y, b);
  const min = Math.min(r, y, b);
  
  if (avgCurrent > 0) {
    const imbalancePct = ((max - min) / avgCurrent) * 100;
    if (imbalancePct > 20) {
      isAbnormal = true;
      priority = 'HIGH';
      reasons.push(`SEVERE IMBALANCE: ${imbalancePct.toFixed(1)}% current difference between phases.`);
    } else if (imbalancePct > 15) {
      isAbnormal = true;
      priority = priority === 'HIGH' ? 'HIGH' : 'MEDIUM';
      reasons.push(`PHASE IMBALANCE: ${imbalancePct.toFixed(1)}% current difference detected.`);
    }
  }

  // 3. Sudden Spike Detection (>30% jump from last reading)
  const lastInspection = await (prisma as any).motorInspection.findFirst({
    where: { motorTag },
    orderBy: { inspectedAt: 'desc' },
    select: { currentR: true, currentY: true, currentB: true }
  });

  if (lastInspection) {
    const lastAvg = ((lastInspection.currentR || 0) + (lastInspection.currentY || 0) + (lastInspection.currentB || 0)) / 3;
    if (lastAvg > 0) {
      const spikePct = ((avgCurrent - lastAvg) / lastAvg) * 100;
      if (spikePct > 50) {
        isAbnormal = true;
        priority = 'HIGH';
        reasons.push(`CRITICAL SPIKE: ${spikePct.toFixed(1)}% sudden increase in current from previous reading.`);
      } else if (spikePct > 30) {
        isAbnormal = true;
        priority = priority === 'HIGH' ? 'HIGH' : 'MEDIUM';
        reasons.push(`CURRENT SPIKE: ${spikePct.toFixed(1)}% increase from previous reading.`);
      }
    }
  }

  return { isAbnormal, priority, reasons };
}

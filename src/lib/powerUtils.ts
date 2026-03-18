/**
 * Power Consumption Utility Functions
 */

export interface PowerReadings {
  incomer1: number; // MWh
  incomer2: number; // MWh
  outgoing1_TS12: number;
  outgoing1_TS13: number;
  outgoing1_TS19_24: number;
  outgoing2_TS12: number;
  outgoing2_TS13: number;
  outgoing2_TS19_24: number;
}

/**
 * Calculates net consumption in kWh
 * Formula: (Incomer1 + Incomer2) * 1000 - Sum of all outgoings
 */
export function calculateNetConsumption(readings: PowerReadings): number {
  const totalIncomersKwh = (readings.incomer1 + readings.incomer2) * 1000;
  const totalOutgoingsKwh = 
    readings.outgoing1_TS12 + 
    readings.outgoing1_TS13 + 
    readings.outgoing1_TS19_24 + 
    readings.outgoing2_TS12 + 
    readings.outgoing2_TS13 + 
    readings.outgoing2_TS19_24;
  
  return totalIncomersKwh - totalOutgoingsKwh;
}

/**
 * Returns color coding based on consumption value
 */
export function getConsumptionStatus(value: number, threshold: number = 5000): 'NORMAL' | 'HIGH' | 'ABNORMAL' {
  if (value > threshold * 1.5) return 'ABNORMAL';
  if (value > threshold) return 'HIGH';
  return 'NORMAL';
}

/**
 * Formats a number to 2 decimal places with comma separators
 */
export function formatPowerValue(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

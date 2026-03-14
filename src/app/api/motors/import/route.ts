import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// Flexible column name mapping — matches your Excel headers regardless of case/spaces
const COL_MAP: Record<string, string> = {
  // Motor Tag
  'motor tag': 'motorTag', 'tag': 'motorTag', 'motor_tag': 'motorTag', 'motortag': 'motorTag',
  'tag no': 'motorTag', 'tag no.': 'motorTag', 'tagno': 'motorTag', 'tag number': 'motorTag',
  // Motor Name
  'motor name': 'motorName', 'name': 'motorName', 'motor_name': 'motorName', 'motorname': 'motorName',
  'description': 'motorName', 'equipment name': 'motorName', 'equipment': 'motorName',
  // Area
  'area': 'area', 'location': 'area', 'zone': 'area',
  // Power
  'power': 'powerKw', 'power kw': 'powerKw', 'kw': 'powerKw', 'rated power': 'powerKw',
  'power(kw)': 'powerKw', 'power_kw': 'powerKw',
  // Voltage
  'voltage': 'voltage', 'rated voltage': 'voltage', 'volt': 'voltage', 'volts': 'voltage',
  // RPM
  'rpm': 'rpm', 'speed': 'rpm', 'rated speed': 'rpm', 'speed(rpm)': 'rpm',
  // Manufacturer
  'manufacturer': 'manufacturer', 'make': 'manufacturer', 'brand': 'manufacturer',
  // Bearings
  'de bearing': 'driveEndBearing', 'drive end bearing': 'driveEndBearing', 'de_bearing': 'driveEndBearing', 'de': 'driveEndBearing',
  'nde bearing': 'nonDriveEndBearing', 'non drive end bearing': 'nonDriveEndBearing', 'nde_bearing': 'nonDriveEndBearing', 'nde': 'nonDriveEndBearing',
  // Coupling & other
  'coupling': 'couplingType', 'coupling type': 'couplingType', 'coupling_type': 'couplingType', 'type': 'couplingType',
  'install date': 'installDate', 'installation date': 'installDate', 'date': 'installDate',
  'status': 'status',
  'frame': 'couplingType', // map FRAME to couplingType as extra info
}

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeVoltage(v: string): string {
  // If already has units like "kV", "V", "KV" → clean and return
  if (/kv/i.test(v)) return v.replace(/\s+/g, ' ').trim()
  if (/\s*V$/i.test(v) && !/^\d+$/.test(v.trim())) return v.trim()
  // Pure number
  const num = parseFloat(v.replace(/[^\d.]/g, ''))
  if (isNaN(num)) return v
  if (num >= 1000) return `${num / 1000} kV`
  return `${num} V`
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Excel sheet is empty' }, { status: 400 })
    }

    // Map each row's columns to our schema fields
    const motors = rows.map((row, i) => {
      const mapped: any = {}
      for (const [rawKey, value] of Object.entries(row)) {
        const normalized = normalizeKey(rawKey)
        const field = COL_MAP[normalized]
        if (field) mapped[field] = value
      }
      return { rowIndex: i + 2, data: mapped }
    })

    // Validate required fields (area & motorName are optional — default if missing)
    const errors: string[] = []
    const validMotors = motors.filter(({ rowIndex, data }) => {
      const missing = []
      if (!data.motorTag) missing.push('Motor Tag')
      if (!data.powerKw && data.powerKw !== 0) missing.push('Power (kW)')
      if (!data.voltage) missing.push('Voltage')
      if (!data.rpm && data.rpm !== 0) missing.push('RPM')
      // Defaults for optional fields
      if (!data.motorName) data.motorName = data.motorTag  // fallback to tag
      if (!data.area) data.area = 'General'                // fallback area
      if (missing.length > 0) {
        errors.push(`Row ${rowIndex}: missing ${missing.join(', ')}`)
        return false
      }
      return true
    })

    // Upsert motors (insert or update if tag already exists)
    let inserted = 0, updated = 0, skipped = errors.length
    for (const { data } of validMotors) {
      const payload = {
        motorTag: String(data.motorTag).trim(),
        motorName: String(data.motorName).trim(),
        area: String(data.area).trim(),
        powerKw: parseFloat(String(data.powerKw)) || 0,
        voltage: normalizeVoltage(String(data.voltage).trim()),
        rpm: parseInt(String(data.rpm)) || 0,
        manufacturer: data.manufacturer ? String(data.manufacturer).trim() : null,
        driveEndBearing: data.driveEndBearing ? String(data.driveEndBearing).trim() : null,
        nonDriveEndBearing: data.nonDriveEndBearing ? String(data.nonDriveEndBearing).trim() : null,
        couplingType: data.couplingType ? String(data.couplingType).trim() : null,
        status: data.status ? String(data.status).trim().toUpperCase() : 'RUNNING',
        installDate: data.installDate instanceof Date ? data.installDate : null,
      }

      const existing = await prisma.motor.findUnique({ where: { motorTag: payload.motorTag } })
      if (existing) {
        await prisma.motor.update({ where: { motorTag: payload.motorTag }, data: payload })
        updated++
      } else {
        await prisma.motor.create({ data: payload })
        inserted++
      }
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      inserted,
      updated,
      skipped,
      errors: errors.slice(0, 20), // cap to first 20 errors
    })
  } catch (err: any) {
    console.error('Import error:', err)
    return NextResponse.json({ error: `Import failed: ${err.message}` }, { status: 500 })
  }
}

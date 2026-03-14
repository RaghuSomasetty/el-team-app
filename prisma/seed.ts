import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding EL-TEAM database...')

  // Admin / Engineer user
  const adminHash = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@elteam.com' },
    update: {},
    create: { name: 'Rajesh Kumar (Admin)', email: 'admin@elteam.com', phone: '+91 9876543210', designation: 'Engineer', passwordHash: adminHash, role: 'ENGINEER' },
  })

  // Supervisor
  const supHash = await bcrypt.hash('super123', 12)
  await prisma.user.upsert({
    where: { email: 'supervisor@elteam.com' },
    update: {},
    create: { name: 'Suresh Sharma', email: 'supervisor@elteam.com', phone: '+91 9876543211', designation: 'Supervisor', passwordHash: supHash, role: 'SUPERVISOR' },
  })

  // Technician
  const techHash = await bcrypt.hash('tech123', 12)
  await prisma.user.upsert({
    where: { email: 'tech@elteam.com' },
    update: {},
    create: { name: 'Ramesh Patel', email: 'tech@elteam.com', phone: '+91 9876543212', designation: 'Technician', passwordHash: techHash, role: 'TECHNICIAN' },
  })

  // Motors
  const motors = [
    { motorTag: '24.04.04', motorName: 'Main Air Fan', area: 'M-2 Furnace', powerKw: 500, voltage: '10 kV', rpm: 1480, manufacturer: 'ABB', driveEndBearing: '6316 C3', nonDriveEndBearing: '6314 C3', couplingType: 'Flexible Jaw' },
    { motorTag: '21.68', motorName: 'BF Pump Motor', area: 'Utilities', powerKw: 250, voltage: '6.6 kV', rpm: 1480, manufacturer: 'Siemens', driveEndBearing: '6312 C3', nonDriveEndBearing: '6310 C3', couplingType: 'Rigid' },
    { motorTag: '12.01', motorName: 'Shaft Furnace Fan', area: 'M-1 Furnace', powerKw: 750, voltage: '10 kV', rpm: 990, manufacturer: 'WEG', driveEndBearing: '6320 C3', nonDriveEndBearing: '6318 C3', couplingType: 'Flexible' },
    { motorTag: '15.02', motorName: 'Reformer Blower', area: 'Reformer Area', powerKw: 315, voltage: '6.6 kV', rpm: 1480, manufacturer: 'ABB', driveEndBearing: '6314 C3', nonDriveEndBearing: '6312 C3', couplingType: 'Flexible' },
    { motorTag: '08.11', motorName: 'DRI Conveyor Motor', area: 'DRI Handling Area', powerKw: 110, voltage: '415 V', rpm: 1500, manufacturer: 'Crompton', driveEndBearing: '6308 C3', nonDriveEndBearing: '6306 C3', couplingType: 'Flexible' },
    { motorTag: '30.05', motorName: 'Cooling Tower Fan', area: 'Utilities', powerKw: 55, voltage: '415 V', rpm: 980, manufacturer: 'Siemens', driveEndBearing: '6306 C3', nonDriveEndBearing: '6305 C3', couplingType: 'Direct Drive' },
    { motorTag: '18.07', motorName: 'HBI Crusher Motor', area: 'DRI Handling Area', powerKw: 200, voltage: '6.6 kV', rpm: 750, manufacturer: 'ABB', driveEndBearing: '6316 C3', nonDriveEndBearing: '6314 C3', couplingType: 'Fluid Coupling' },
  ]

  for (const m of motors) {
    await prisma.motor.upsert({
      where: { motorTag: m.motorTag },
      update: {},
      create: m,
    })
  }

  // Equipment
  const equipment = [
    { name: 'VCB Panel', tagNumber: 'VCB-01', area: 'Substation', equipmentType: 'Panel', manufacturer: 'ABB' },
    { name: 'Main Transfer Transformer', tagNumber: 'TR-001', area: 'Substation', equipmentType: 'Transformer', manufacturer: 'Crompton' },
    { name: 'MCC Panel M-1', tagNumber: 'MCC-M1', area: 'M-1 Furnace', equipmentType: 'Panel', manufacturer: 'Siemens' },
    { name: 'LT Cable Feeder 1', tagNumber: 'CBL-LT-01', area: 'Utilities', equipmentType: 'Cable' },
    { name: 'Area Light Beacon Mast', tagNumber: 'LT-ABM-01', area: 'DRI Handling Area', equipmentType: 'Light' },
  ]

  for (const e of equipment) {
    try {
      await prisma.equipment.create({ data: e })
    } catch {}
  }

  // Spare Parts
  const spareParts = [
    { partName: '6316 C3 Bearing', partNumber: 'BRG-6316-C3', equipment: 'Motor', quantity: 4, location: 'Warehouse A, Rack 2', supplier: 'SKF India' },
    { partName: '6314 C3 Bearing', partNumber: 'BRG-6314-C3', equipment: 'Motor', quantity: 6, location: 'Warehouse A, Rack 2', supplier: 'SKF India' },
    { partName: '6312 C3 Bearing', partNumber: 'BRG-6312-C3', equipment: 'Motor', quantity: 3, location: 'Warehouse A, Rack 3', supplier: 'FAG India' },
    { partName: 'Motor Fan 500kW', partNumber: 'FAN-500KW', equipment: 'Main Air Fan', quantity: 2, location: 'Workshop', supplier: 'OEM' },
    { partName: 'Terminal Block 10mm', partNumber: 'TB-10MM', equipment: 'Panel', quantity: 50, location: 'Warehouse B', supplier: 'Phoenix Contact' },
    { partName: 'VCB Trip Coil 110V', partNumber: 'TC-VCB-110V', equipment: 'VCB', quantity: 2, location: 'Substation Store', supplier: 'ABB' },
    { partName: 'Cable Gland M20', partNumber: 'CGL-M20', equipment: 'Cable', quantity: 25, location: 'Warehouse C', supplier: 'Agro Cables' },
    { partName: 'Contactor LC1D40 415V', partNumber: 'CTT-LC1D40', equipment: 'MCC', quantity: 5, location: 'Warehouse B', supplier: 'Schneider' },
  ]

  for (const p of spareParts) {
    await prisma.sparePart.create({ data: p }).catch(() => {})
  }

  // Chat groups
  const groups = [
    { id: 'g1', name: 'M-1 Furnace', area: 'M-1 Furnace' },
    { id: 'g2', name: 'M-2 Furnace', area: 'M-2 Furnace' },
    { id: 'g3', name: 'Reformer Area', area: 'Reformer Area' },
    { id: 'g4', name: 'DRI Handling', area: 'DRI Handling Area' },
    { id: 'g5', name: 'Utilities', area: 'Utilities' },
    { id: 'g6', name: 'General', area: 'General' },
  ]
  for (const g of groups) {
    await prisma.chatGroup.upsert({ where: { id: g.id }, update: {}, create: g })
  }

  // Sample MIS entries
  const today = new Date()
  const misEntries = [
    { date: today, shift: 'A', area: 'M-2 Furnace', equipmentName: 'Main Air Fan', tagNumber: '24.04.04', workType: 'PMI', description: 'Preventive maintenance inspection completed. Bearing greasing done. Alignment checked. Vibration normal.', engineerName: 'Rajesh Kumar', status: 'APPROVED', createdById: admin.id },
    { date: today, shift: 'B', area: 'M-1 Furnace', equipmentName: 'Shaft Furnace Fan', tagNumber: '12.01', workType: 'RPMI', description: 'Routine preventive maintenance. Changed drive end bearing 6320 C3. NDE bearing checked, OK.', engineerName: 'Rajesh Kumar', status: 'APPROVED', createdById: admin.id },
    { date: today, shift: 'A', area: 'Utilities', equipmentName: 'BF Pump Motor', tagNumber: '21.68', workType: 'PMI', description: 'PMI completed. Insulation resistance 200 MΩ. Bearing temperature normal.', engineerName: 'Rajesh Kumar', status: 'DRAFT', createdById: admin.id },
  ]
  for (const m of misEntries) {
    await prisma.dailyMIS.create({ data: m }).catch(() => {})
  }

  // Maintenance history
  await prisma.maintenanceHistory.create({
    data: { equipmentTag: '24.04.04', equipmentName: 'Main Air Fan', maintenanceType: 'PMI', description: 'Bearing greasing and alignment', technicianName: 'Ramesh Patel' }
  }).catch(() => {})

  console.log('✅ Seed complete!')
  console.log('\nLogin credentials:')
  console.log('  Engineer:   admin@elteam.com    / admin123')
  console.log('  Supervisor: supervisor@elteam.com / super123')
  console.log('  Technician: tech@elteam.com      / tech123')
}

main().catch(console.error).finally(() => prisma.$disconnect())

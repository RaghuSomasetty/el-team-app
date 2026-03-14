import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  // Simple security check
  if (key !== 'el-team-deploy-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Starting DB Setup...')

    // Always run CREATE TABLE IF NOT EXISTS to ensure all tables exist (including Motor, MotorInspection)
    const sqlCommands = [
      `CREATE TABLE IF NOT EXISTS "User" ( "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "phone" TEXT, "designation" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'TECHNICIAN', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "User_pkey" PRIMARY KEY ("id") );`,
      `CREATE TABLE IF NOT EXISTS "Equipment" ( "id" TEXT NOT NULL, "name" TEXT NOT NULL, "tagNumber" TEXT NOT NULL, "area" TEXT NOT NULL, "equipmentType" TEXT NOT NULL, "installDate" TIMESTAMP(3), "manufacturer" TEXT, "status" TEXT NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id") );`,
      `CREATE TABLE IF NOT EXISTS "Motor" ( "id" TEXT NOT NULL, "motorTag" TEXT NOT NULL, "motorName" TEXT NOT NULL, "area" TEXT NOT NULL, "powerKw" DOUBLE PRECISION NOT NULL, "voltage" TEXT NOT NULL, "rpm" INTEGER NOT NULL, "manufacturer" TEXT, "driveEndBearing" TEXT, "nonDriveEndBearing" TEXT, "couplingType" TEXT, "installDate" TIMESTAMP(3), "status" TEXT NOT NULL DEFAULT 'RUNNING', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Motor_pkey" PRIMARY KEY ("id") );`,
      `CREATE TABLE IF NOT EXISTS "SparePart" ( "id" TEXT NOT NULL, "partName" TEXT NOT NULL, "partNumber" TEXT NOT NULL, "equipment" TEXT, "quantity" INTEGER NOT NULL DEFAULT 0, "location" TEXT, "supplier" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SparePart_pkey" PRIMARY KEY ("id") );`,
      `CREATE TABLE IF NOT EXISTS "DailyMIS" ( "id" TEXT NOT NULL, "date" TIMESTAMP(3) NOT NULL, "shift" TEXT NOT NULL, "area" TEXT NOT NULL, "equipmentName" TEXT NOT NULL, "tagNumber" TEXT, "workType" TEXT NOT NULL, "description" TEXT NOT NULL, "engineerName" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'DRAFT', "source" TEXT NOT NULL DEFAULT 'MANUAL', "createdById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "DailyMIS_pkey" PRIMARY KEY ("id") );`,
      `CREATE TABLE IF NOT EXISTS "MaintenanceActivity" ( "id" TEXT NOT NULL, "equipmentName" TEXT NOT NULL, "tagNumber" TEXT, "area" TEXT NOT NULL, "description" TEXT NOT NULL, "beforeImageUrl" TEXT, "afterImageUrl" TEXT, "technicianName" TEXT NOT NULL, "createdById" TEXT, "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MaintenanceActivity_pkey" PRIMARY KEY ("id") );`,
      `CREATE TABLE IF NOT EXISTS "ChatGroup" ( "id" TEXT NOT NULL, "name" TEXT NOT NULL, "area" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ChatGroup_pkey" PRIMARY KEY ("id") );`,
      `CREATE TABLE IF NOT EXISTS "ChatGroupMember" ( "id" TEXT NOT NULL, "groupId" TEXT NOT NULL, "userId" TEXT NOT NULL, "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ChatGroupMember_pkey" PRIMARY KEY ("id") );`,
      `CREATE TABLE IF NOT EXISTS "ChatMessage" ( "id" TEXT NOT NULL, "groupId" TEXT NOT NULL, "content" TEXT NOT NULL, "imageUrl" TEXT, "messageType" TEXT NOT NULL DEFAULT 'TEXT', "extractedMisId" TEXT, "senderId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id") );`,
      `CREATE TABLE IF NOT EXISTS "MaintenanceHistory" ( "id" TEXT NOT NULL, "equipmentTag" TEXT NOT NULL, "equipmentName" TEXT NOT NULL, "maintenanceType" TEXT NOT NULL, "description" TEXT NOT NULL, "technicianName" TEXT NOT NULL, "imageUrls" TEXT NOT NULL DEFAULT '[]', "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MaintenanceHistory_pkey" PRIMARY KEY ("id") );`,
      `CREATE TABLE IF NOT EXISTS "MotorInspection" ( "id" TEXT NOT NULL, "motorTag" TEXT NOT NULL, "motorName" TEXT NOT NULL, "area" TEXT NOT NULL, "category" TEXT NOT NULL, "currentR" DOUBLE PRECISION, "currentY" DOUBLE PRECISION, "currentB" DOUBLE PRECISION, "ratedCurrent" DOUBLE PRECISION, "loadingPct" DOUBLE PRECISION, "abnormality" TEXT, "inspectedBy" TEXT NOT NULL, "shift" TEXT NOT NULL DEFAULT 'General', "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MotorInspection_pkey" PRIMARY KEY ("id") );`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Equipment_tagNumber_key" ON "Equipment"("tagNumber");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Motor_motorTag_key" ON "Motor"("motorTag");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "ChatGroupMember_groupId_userId_key" ON "ChatGroupMember"("groupId", "userId");`
    ]

    const results: string[] = []
    for (const cmd of sqlCommands) {
      try {
        await prisma.$executeRawUnsafe(cmd)
        results.push('OK: ' + cmd.substring(0, 60))
      } catch (e: any) {
        results.push('SKIP: ' + cmd.substring(0, 60) + ' | ' + e.message.substring(0, 80))
      }
    }

    // Seed default motors (idempotent)
    const motorInserts = [
      `INSERT INTO "Motor" ("id","motorTag","motorName","area","powerKw","voltage","rpm","manufacturer","driveEndBearing","nonDriveEndBearing","couplingType","status","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'24.04.04','Main Air Fan','M-2 Furnace',500,'10 kV',1480,'ABB','6316 C3','6314 C3','Flexible Jaw','RUNNING',NOW(),NOW()) ON CONFLICT ("motorTag") DO NOTHING;`,
      `INSERT INTO "Motor" ("id","motorTag","motorName","area","powerKw","voltage","rpm","manufacturer","driveEndBearing","nonDriveEndBearing","couplingType","status","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'21.68','BF Pump Motor','Utilities',250,'6.6 kV',1480,'Siemens','6312 C3','6310 C3','Rigid','RUNNING',NOW(),NOW()) ON CONFLICT ("motorTag") DO NOTHING;`,
      `INSERT INTO "Motor" ("id","motorTag","motorName","area","powerKw","voltage","rpm","manufacturer","driveEndBearing","nonDriveEndBearing","couplingType","status","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'12.01','Shaft Furnace Fan','M-1 Furnace',750,'10 kV',990,'WEG','6320 C3','6318 C3','Flexible','RUNNING',NOW(),NOW()) ON CONFLICT ("motorTag") DO NOTHING;`,
      `INSERT INTO "Motor" ("id","motorTag","motorName","area","powerKw","voltage","rpm","manufacturer","driveEndBearing","nonDriveEndBearing","couplingType","status","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'15.02','Reformer Blower','Reformer Area',315,'6.6 kV',1480,'ABB','6314 C3','6312 C3','Flexible','RUNNING',NOW(),NOW()) ON CONFLICT ("motorTag") DO NOTHING;`,
      `INSERT INTO "Motor" ("id","motorTag","motorName","area","powerKw","voltage","rpm","manufacturer","driveEndBearing","nonDriveEndBearing","couplingType","status","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'08.11','DRI Conveyor Motor','DRI Handling Area',110,'415 V',1500,'Crompton','6308 C3','6306 C3','Flexible','RUNNING',NOW(),NOW()) ON CONFLICT ("motorTag") DO NOTHING;`,
      `INSERT INTO "Motor" ("id","motorTag","motorName","area","powerKw","voltage","rpm","manufacturer","driveEndBearing","nonDriveEndBearing","couplingType","status","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'30.05','Cooling Tower Fan','Utilities',55,'415 V',980,'Siemens','6306 C3','6305 C3','Direct Drive','RUNNING',NOW(),NOW()) ON CONFLICT ("motorTag") DO NOTHING;`,
      `INSERT INTO "Motor" ("id","motorTag","motorName","area","powerKw","voltage","rpm","manufacturer","driveEndBearing","nonDriveEndBearing","couplingType","status","createdAt","updatedAt") VALUES (gen_random_uuid()::text,'18.07','HBI Crusher Motor','DRI Handling Area',200,'6.6 kV',750,'ABB','6316 C3','6314 C3','Fluid Coupling','RUNNING',NOW(),NOW()) ON CONFLICT ("motorTag") DO NOTHING;`,
    ]
    for (const sql of motorInserts) {
      try { await prisma.$executeRawUnsafe(sql) } catch {}
    }

    // Fix voltage values: convert raw numbers to proper kV/V strings
    const voltageFixSql = [
      `UPDATE "Motor" SET "voltage" = '10 kV', "updatedAt" = NOW() WHERE "voltage" = '10000';`,
      `UPDATE "Motor" SET "voltage" = '3 kV', "updatedAt" = NOW() WHERE "voltage" = '3000';`,
      `UPDATE "Motor" SET "voltage" = '6.6 kV', "updatedAt" = NOW() WHERE "voltage" = '6600';`,
      `UPDATE "Motor" SET "voltage" = '415 V', "updatedAt" = NOW() WHERE "voltage" = '415';`,
      `UPDATE "Motor" SET "voltage" = '380 V', "updatedAt" = NOW() WHERE "voltage" = '380';`,
      `UPDATE "Motor" SET "voltage" = '220 V', "updatedAt" = NOW() WHERE "voltage" = '220';`,
      `UPDATE "Motor" SET "voltage" = '11 kV', "updatedAt" = NOW() WHERE "voltage" = '11000';`,
    ]
    for (const sql of voltageFixSql) {
      try { await prisma.$executeRawUnsafe(sql) } catch {}
    }

    // Check/create admin user
    const adminHash = await bcrypt.hash('admin123', 12)
    const existing = await prisma.user.findUnique({ where: { email: 'admin@elteam.com' } })
    
    if (!existing) {
      await prisma.user.create({
        data: {
          id: 'prod_admin',
          name: 'Administrator',
          email: 'admin@elteam.com',
          passwordHash: adminHash,
          designation: 'Engineer',
          role: 'ADMIN',
          updatedAt: new Date()
        }
      })
      return NextResponse.json({ success: true, message: 'Database initialized and admin created', results })
    }

    return NextResponse.json({ success: true, message: 'Tables ensured, admin already exists', results })
  } catch (err: any) {
    console.error('Setup Final Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

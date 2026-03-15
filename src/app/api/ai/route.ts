import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import mammoth from 'mammoth'
import * as xlsx from 'xlsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Rated current: I = P(W) / (√3 × V × cosφ × η), cosφ=0.87, η=0.92
function calcRatedCurrent(powerKw: number, voltage: string): string {
  const raw = parseFloat(voltage.replace(/[^0-9.]/g, ''))
  if (!raw) return 'N/A'
  const voltV = voltage.toLowerCase().includes('kv') ? raw * 1000 : raw
  return `~${Math.round((powerKw * 1000) / (Math.sqrt(3) * voltV * 0.87 * 0.92))} A (calculated)`
}

function extractTag(q: string): string | null {
  return q.match(/\b(\d{2}\.\d{2}(?:\.\d{2})?)\b/)?.[1] ?? null
}

function detectIntent(q: string): string | null {
  if (/current|ampere|\bamp\b/.test(q)) return 'current'
  if (/bearing/.test(q)) return 'bearing'
  if (/\bpower\b|kw|kilowatt/.test(q)) return 'power'
  if (/voltage|\bvolt\b/.test(q)) return 'voltage'
  if (/\brpm\b|speed|rotation/.test(q)) return 'rpm'
  if (/area|location|zone/.test(q)) return 'area'
  if (/manufacturer|\bmake\b|brand/.test(q)) return 'manufacturer'
  if (/motor|machine|equipment|detail|spec|info/.test(q)) return 'all'
  return null
}

async function parseAttachment(att: any): Promise<string> {
  try {
    const base64Data = att.data.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    if (att.name.endsWith('.pdf')) {
      const pdf = require('pdf-parse')
      const data = await pdf(buffer)
      return `\n\n--- Attached PDF: ${att.name} ---\n${data.text}\n--- End of PDF ---`
    } else if (att.name.endsWith('.docx') || att.name.endsWith('.doc')) {
      const data = await mammoth.extractRawText({ buffer })
      return `\n\n--- Attached Word Doc: ${att.name} ---\n${data.value}\n--- End of Word Doc ---`
    } else if (att.name.endsWith('.xlsx') || att.name.endsWith('.xls')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' })
      let excelText = `\n\n--- Attached Excel: ${att.name} ---`
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName]
        const csv = xlsx.utils.sheet_to_csv(sheet)
        excelText += `\n\n[Sheet: ${sheetName}]\n${csv}`
      })
      excelText += `\n--- End of Excel ---`
      return excelText
    } else {
      // Fallback for text files if sent as binary
      return `\n\n--- Attached File: ${att.name} ---\n${buffer.toString('utf-8')}\n--- End of File ---`
    }
  } catch (err: any) {
    console.error(`Error parsing attachment ${att.name}:`, err)
    return `\n\n--- Attached File: ${att.name} (Parsing Failed) ---\nError: ${err.message}`
  }
}

function motorCard(motor: any): string {
  const lines = [
    `**Motor: ${motor.motorName}** (Tag: \`${motor.motorTag}\`)`,
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| Drive End Bearing | ${motor.driveEndBearing || '—'} |`,
    `| Non Drive End Bearing | ${motor.nonDriveEndBearing || '—'} |`,
    `| Rated Power | ${motor.powerKw} kW |`,
    `| Rated Voltage | ${motor.voltage} |`,
    `| Rated Current | ${calcRatedCurrent(motor.powerKw, motor.voltage)} |`,
    `| Rated Speed | ${motor.rpm} RPM |`,
    `| Manufacturer | ${motor.manufacturer || '—'} |`,
    `| Area | ${motor.area} |`,
    `| Status | ${motor.status} |`,
  ]
  return lines.join('\n')
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const question = body.question
  const attachments = body.attachments || []
  const history = body.history || []

  if (!question && (!attachments || attachments.length === 0)) {
    return NextResponse.json({ error: 'Question or attachment required' }, { status: 400 })
  }

  const q = question.toLowerCase()
  const tag = extractTag(q)
  const intent = detectIntent(q)

  // All questions go through OpenAI with full context — no local shortcut

  // ── OpenAI brain: handles everything else with full plant context ──────────
  const openaiKey = process.env.OPENAI_API_KEY
  console.log('OPENAI_API_KEY present:', !!openaiKey, 'length:', openaiKey?.length)
  if (openaiKey && openaiKey.length > 10) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey })

      // ── Gather COMPLETE context from ALL database tables ──────────────────
      const today = new Date(); today.setHours(0,0,0,0)
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
      const last7 = new Date(today); last7.setDate(today.getDate() - 7)
      const month = new Date(today); month.setDate(1)
      const nextMonth = new Date(month); nextMonth.setMonth(month.getMonth() + 1)
      const last30 = new Date(today); last30.setDate(today.getDate() - 30)

      const motorInspectionSelect = {
        id: true,
        motorTag: true,
        motorName: true,
        area: true,
        category: true,
        currentR: true,
        currentY: true,
        currentB: true,
        ratedCurrent: true,
        loadingPct: true,
        abnormality: true,
        inspectedBy: true,
        shift: true,
        inspectedAt: true,
        createdAt: true,
      };

      const [
        allMotors, stoppedMotors, faultMotors,
        allEquipment,
        allSpareParts, lowStockParts,
        misToday, misMonth, allMisMonth,
        actToday, recentActivities,
        allHistory,
        inspectToday, recentInspections, allAbnormalities,
        chatGroups,
      ] = await Promise.all([
        // Motors
        prisma.motor.findMany({ orderBy: { motorTag: 'asc' } }),
        prisma.motor.findMany({ where: { status: 'STOPPED' } }),
        prisma.motor.findMany({ where: { status: 'FAULT' } }),
        // Equipment
        prisma.equipment.findMany({ orderBy: { name: 'asc' } }),
        // Spare parts
        prisma.sparePart.findMany({ orderBy: { partName: 'asc' } }),
        prisma.sparePart.findMany({ where: { quantity: { lte: 2 } } }),
        // MIS
        prisma.dailyMIS.count({ where: { date: { gte: today, lt: tomorrow } } }),
        prisma.dailyMIS.count({ where: { date: { gte: month, lt: nextMonth } } }),
        prisma.dailyMIS.findMany({ where: { date: { gte: month, lt: nextMonth } }, orderBy: { date: 'desc' }, take: 30 }),
        // Maintenance activities
        prisma.maintenanceActivity.count({ where: { completedAt: { gte: today, lt: tomorrow } } }),
        prisma.maintenanceActivity.findMany({ orderBy: { completedAt: 'desc' }, take: 20 }),
        // Maintenance history
        prisma.maintenanceHistory.findMany({ orderBy: { performedAt: 'desc' }, take: 50 }),
        // Inspections
        prisma.motorInspection.count({ where: { inspectedAt: { gte: today, lt: tomorrow } } }),
        prisma.motorInspection.findMany({ select: motorInspectionSelect, orderBy: { inspectedAt: 'desc' }, take: 20 }),
        prisma.motorInspection.findMany({ where: { abnormality: { not: null } }, select: motorInspectionSelect, orderBy: { inspectedAt: 'desc' }, take: 20 }),
        // Chat
        prisma.chatGroup.findMany({ include: { _count: { select: { messages: true } } } }),
      ])

      // ── Specific motor context if tag in question ─────────────────────────
      let specificMotorContext = ''
      if (tag) {
        const [specificMotor, motorHistory, motorInspections] = await Promise.all([
          prisma.motor.findFirst({ where: { motorTag: { contains: tag } } }),
          prisma.maintenanceHistory.findMany({ where: { equipmentTag: { contains: tag } }, orderBy: { performedAt: 'desc' }, take: 20 }),
          prisma.motorInspection.findMany({ where: { motorTag: { contains: tag } }, select: motorInspectionSelect, orderBy: { inspectedAt: 'desc' }, take: 10 }),
        ])
        if (specificMotor) {
          specificMotorContext = `\n\n## ⚙️ SPECIFIC MOTOR QUERIED (Tag: ${specificMotor.motorTag}):
- Name: ${specificMotor.motorName}
- Power: ${specificMotor.powerKw} kW | Voltage: ${specificMotor.voltage} | RPM: ${specificMotor.rpm}
- Drive End Bearing: ${specificMotor.driveEndBearing || '—'} | NDE Bearing: ${specificMotor.nonDriveEndBearing || '—'}
- Coupling Type: ${specificMotor.couplingType || '—'} | Manufacturer: ${specificMotor.manufacturer || '—'}
- Area: ${specificMotor.area} | Status: ${specificMotor.status}
- Calculated Rated Current: ${calcRatedCurrent(specificMotor.powerKw, specificMotor.voltage)}`

          specificMotorContext += motorHistory.length > 0
            ? `\n\n### Maintenance History:\n` + motorHistory.map(h => `- [${h.maintenanceType}] ${new Date(h.performedAt).toLocaleDateString('en-IN')} by ${h.technicianName}: ${h.description}`).join('\n')
            : `\n\n### Maintenance History: No records found.`

          specificMotorContext += motorInspections.length > 0
            ? `\n\n### Recent Inspections:\n` + motorInspections.map(i => `- ${new Date(i.inspectedAt).toLocaleDateString('en-IN')} | Shift: ${i.shift} | By: ${i.inspectedBy} | Abnormality: ${i.abnormality || 'None'} | Loading: ${i.loadingPct ? i.loadingPct.toFixed(1) + '%' : '—'}`).join('\n')
            : `\n\n### Inspections: No inspection records found.`
        }
      }

      // ── Build ALERTS ──────────────────────────────────────────────────────
      const alerts: string[] = []
      if (stoppedMotors.length > 0) alerts.push(`🔴 STOPPED MOTORS (${stoppedMotors.length}): ${stoppedMotors.map(m => `${m.motorTag} (${m.motorName})`).join(', ')}`)
      if (faultMotors.length > 0) alerts.push(`🚨 FAULT MOTORS (${faultMotors.length}): ${faultMotors.map(m => `${m.motorTag} (${m.motorName})`).join(', ')}`)
      if (lowStockParts.length > 0) alerts.push(`⚠️ LOW/ZERO STOCK PARTS (${lowStockParts.length}): ${lowStockParts.map(p => `${p.partName} (Qty: ${p.quantity})`).join(', ')}`);
      
      const recentAbnormalities = allAbnormalities.filter(a => new Date(a.inspectedAt) >= last7);
      if (recentAbnormalities.length > 0) {
        alerts.push(`⚠️ INSPECTION ABNORMALITIES (last 7 days, ${recentAbnormalities.length}): ${recentAbnormalities.map(a => `${a.motorTag}: ${a.abnormality}`).join(' | ')}`);
      }

      const systemPrompt = `You are VoltMind AI, an expert AI for an electrical maintenance management system at a DRI (Direct Reduced Iron) steel plant. You have COMPLETE ACCESS to the plant database as shown below.

## 📅 Live Status (${new Date().toLocaleDateString('en-IN')}):
- Total Motors: ${allMotors.length} | Running: ${allMotors.filter(m => m.status === 'RUNNING').length} | Stopped: ${stoppedMotors.length} | Fault: ${faultMotors.length}
- Total Equipment: ${allEquipment.length}
- Today's MIS Entries: ${misToday} | This Month: ${misMonth}
- Today's Maintenance Activities: ${actToday}
- Today's Inspections: ${inspectToday}

## 🚨 ACTIVE ALERTS:
${alerts.length > 0 ? alerts.join('\n') : '✅ No critical alerts at this time.'}

## ⚙️ ALL MOTORS (${allMotors.length} total):
${allMotors.map(m => `Tag:${m.motorTag} | ${m.motorName} | ${m.powerKw}kW | ${m.voltage} | ${m.rpm}RPM | DE:${m.driveEndBearing || '—'} | NDE:${m.nonDriveEndBearing || '—'} | ${m.manufacturer || '—'} | Area:${m.area} | ${m.status}`).join('\n')}

## 🔧 ALL EQUIPMENT (${allEquipment.length} total):
${allEquipment.map(e => `Tag:${e.tagNumber} | ${e.name} | Type:${e.equipmentType} | Area:${e.area} | ${e.status}`).join('\n')}

## 📦 SPARE PARTS (${allSpareParts.length} total):
${allSpareParts.map(p => `${p.partName} | PN:${p.partNumber} | Qty:${p.quantity} | Loc:${p.location || '—'} | Supplier:${p.supplier || '—'}`).join('\n')}

## 📋 MIS ENTRIES THIS MONTH (${allMisMonth.length}):
${allMisMonth.map(m => `[${m.workType}] ${new Date(m.date).toLocaleDateString('en-IN')} Shift:${m.shift} | ${m.equipmentName}(${m.area}): ${m.description.substring(0, 80)}`).join('\n')}

## 🛠️ RECENT MAINTENANCE HISTORY (Last 50):
${allHistory.length > 0 ? allHistory.map(h => `${new Date(h.performedAt).toLocaleDateString('en-IN')} | Tag:${h.equipmentTag} | ${h.equipmentName} | [${h.maintenanceType}] by ${h.technicianName}: ${h.description.substring(0, 80)}`).join('\n') : 'No records.'}

## 🔍 RECENT MAINTENANCE ACTIVITIES (Last 20):
${recentActivities.length > 0 ? recentActivities.map(a => `${new Date(a.completedAt).toLocaleDateString('en-IN')} | ${a.equipmentName}(${a.area}) by ${a.technicianName}: ${a.description.substring(0, 80)}`).join('\n') : 'No recent activities.'}

## 📊 RECENT MOTOR INSPECTIONS (Last 20):
${recentInspections.length > 0 ? recentInspections.map(i => `${new Date(i.inspectedAt).toLocaleDateString('en-IN')} | ${i.motorTag} ${i.motorName} | Shift:${i.shift} | By:${i.inspectedBy} | R:${i.currentR ?? '—'}A Y:${i.currentY ?? '—'}A B:${i.currentB ?? '—'}A | Loading:${i.loadingPct ? i.loadingPct.toFixed(1) + '%' : '—'} | Abnormality:${i.abnormality || 'None'}`).join('\n') : 'No inspections recorded.'}

## 💬 CHAT GROUPS:
${chatGroups.map(g => `${g.name} (${g.area}): ${(g as any)._count?.messages ?? 0} messages`).join(' | ')}
${specificMotorContext}

## 📐 ENGINEERING FORMULAS:
- Rated Current: I = P(W) / (√3 × V × cosφ × η), cosφ=0.87, η=0.92
- % Loading = (Measured Current / Rated Current) × 100

- **Multilingual Support**: You are capable of understanding and communicating in any language (English, Hindi, Telugu, Kannada, Arabic, etc.). ALWAYS respond in the same language the user is using for their query. Use appropriate professional terminology for the language.
- **Structured Data**: If the user asks for a report, list, or summary of data, provide row data as a simple array of arrays.
`

      // ── Define DB write tools for function calling ────────────────────────
      const tools: any[] = [
        {
          type: 'function',
          function: {
            name: 'add_mis_entry',
            description: 'Add a new MIS (Maintenance Information System) daily entry to the database',
            parameters: {
              type: 'object',
              properties: {
                equipmentName: { type: 'string', description: 'Name of the equipment' },
                area: { type: 'string', description: 'Area/location of the equipment' },
                workType: { type: 'string', enum: ['BREAKDOWN', 'PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'OTHER'], description: 'Type of maintenance work' },
                shift: { type: 'string', enum: ['A', 'B', 'C', 'General'], description: 'Shift when work was done' },
                description: { type: 'string', description: 'Detailed description of the work done' },
                technicianName: { type: 'string', description: 'Name of the technician who did the work' },
              },
              required: ['equipmentName', 'area', 'workType', 'shift', 'description'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'update_motor_status',
            description: 'Update the running status of a motor in the database',
            parameters: {
              type: 'object',
              properties: {
                motorTag: { type: 'string', description: 'Motor tag number e.g. 21.65.01' },
                status: { type: 'string', enum: ['RUNNING', 'STOPPED', 'MAINTENANCE', 'FAULT'], description: 'New status of the motor' },
              },
              required: ['motorTag', 'status'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'add_maintenance_history',
            description: 'Add a maintenance history record for a motor or equipment',
            parameters: {
              type: 'object',
              properties: {
                equipmentTag: { type: 'string', description: 'Equipment/motor tag number' },
                equipmentName: { type: 'string', description: 'Equipment name' },
                maintenanceType: { type: 'string', enum: ['GREASING', 'BEARING_CHANGE', 'WINDING_CHECK', 'VIBRATION_CHECK', 'ALIGNMENT', 'COUPLING_CHANGE', 'OVERHAUL', 'INSPECTION', 'BREAKDOWN', 'OTHER'], description: 'Type of maintenance' },
                description: { type: 'string', description: 'Description of work done' },
                technicianName: { type: 'string', description: 'Name of the technician' },
                performedAt: { type: 'string', description: 'Date performed in ISO format (optional, defaults to now)' },
              },
              required: ['equipmentTag', 'equipmentName', 'maintenanceType', 'description', 'technicianName'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'report_spare_part_usage',
            description: 'Report that a spare part was used. This will create a pending request for engineer approval. Stock is NOT deducted until approved.',
            parameters: {
              type: 'object',
              properties: {
                partNumber: { type: 'string', description: 'Part number of the spare part' },
                partName: { type: 'string', description: 'Name of the spare part (use if partNumber is unknown)' },
                quantityUsed: { type: 'number', description: 'Quantity used in the maintenance activity' },
                reason: { type: 'string', description: 'Why this part was used (e.g. bearing failed)' },
              },
              required: ['quantityUsed'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'approve_spare_part_usage',
            description: 'Approve a pending spare part usage request. Only for Engineers/Supervisors.',
            parameters: {
              type: 'object',
              properties: {
                usageId: { type: 'string', description: 'ID of the usage request to approve' },
                status: { type: 'string', enum: ['APPROVED', 'REJECTED'], description: 'Whether to approve or reject' },
                reason: { type: 'string', description: 'Reason for approval/rejection' },
              },
              required: ['usageId', 'status'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'add_spare_part',
            description: 'Add a brand new spare part to the database',
            parameters: {
              type: 'object',
              properties: {
                partName: { type: 'string', description: 'Name of the new part' },
                partNumber: { type: 'string', description: 'Part number for the new part' },
                quantity: { type: 'number', description: 'Initial quantity in stock' },
                category: { type: 'string', description: 'Equipment or Category (e.g., Motor, Bearing, Cable)' },
                location: { type: 'string', description: 'Storage location' },
                supplier: { type: 'string', description: 'Supplier name' },
              },
              required: ['partName', 'partNumber', 'quantity'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'add_motor_inspection',
            description: 'Record a motor inspection with current readings and observations',
            parameters: {
              type: 'object',
              properties: {
                motorTag: { type: 'string', description: 'Motor tag number' },
                motorName: { type: 'string', description: 'Motor name' },
                inspectedBy: { type: 'string', description: 'Name of inspector' },
                shift: { type: 'string', enum: ['A', 'B', 'C', 'General'] },
                currentR: { type: 'number', description: 'R phase current in Amps' },
                currentY: { type: 'number', description: 'Y phase current in Amps' },
                currentB: { type: 'number', description: 'B phase current in Amps' },
                abnormality: { type: 'string', description: 'Any abnormality observed (leave empty if none)' },
                remarks: { type: 'string', description: 'Additional remarks' },
              },
              required: ['motorTag', 'motorName', 'inspectedBy', 'shift'],
            },
          },
        },
      ]

      // ── Step 1: Ask OpenAI with tools ─────────────────────────────────────
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
      ]

      // Add History (limit to last 10 for safety)
      const recentHistory = history.slice(-10).map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      })).filter((h: any) => h.content && typeof h.content === 'string')
      
      messages.push(...recentHistory)

      if (attachments && attachments.length > 0) {
        const contentParts: any[] = [{ type: 'text', text: question || 'Please process the attached file(s).' }]
        
        for (const att of attachments) {
          if (att.type === 'image') {
            contentParts.push({
              type: 'image_url',
              image_url: { url: att.data, detail: 'auto' }
            })
          } else {
            const parsedText = await parseAttachment(att)
            contentParts[0].text += parsedText
          }
        }
        messages.push({ role: 'user', content: contentParts })
      } else {
        messages.push({ role: 'user', content: question })
      }

      const firstCall = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools,
        tool_choice: 'auto',
        max_tokens: 1000,
        temperature: 0.2,
      })

      const firstChoice = firstCall.choices[0]

      // ── Step 2: Handle tool calls (DB writes) ─────────────────────────────
      if (firstChoice.finish_reason === 'tool_calls' && firstChoice.message.tool_calls) {
        const toolResults: string[] = []
        messages.push(firstChoice.message)

        for (const toolCall of firstChoice.message.tool_calls as any[]) {
          const fnName = toolCall.function.name
          const args = JSON.parse(toolCall.function.arguments)
          let result = ''

          try {
            if (fnName === 'add_mis_entry') {
              const entry = await prisma.dailyMIS.create({
                data: {
                  equipmentName: args.equipmentName,
                  area: args.area,
                  workType: args.workType,
                  shift: args.shift,
                  description: args.description,
                  engineerName: args.technicianName || (session as any)?.user?.name || 'VoltMind AI',
                  date: new Date(),
                },
              })
              result = `[OK] MIS entry added successfully (ID: ${entry.id})`;
            } else if (fnName === 'update_motor_status') {
              const motor = await prisma.motor.findFirst({ where: { motorTag: { contains: args.motorTag } } });
              if (!motor) { result = `[ERROR] Motor ${args.motorTag} not found`; }
              else {
                await prisma.motor.update({ where: { id: motor.id }, data: { status: args.status } });
                result = `[OK] Motor ${args.motorTag} status updated to ${args.status}`;
              }
            } else if (fnName === 'add_maintenance_history') {
              await prisma.maintenanceHistory.create({
                data: {
                  equipmentTag: args.equipmentTag,
                  equipmentName: args.equipmentName,
                  maintenanceType: args.maintenanceType,
                  description: args.description,
                  technicianName: args.technicianName,
                  performedAt: args.performedAt ? new Date(args.performedAt) : new Date(),
                },
              });
              result = `[OK] Maintenance history record added for ${args.equipmentTag}`;
            } else if (fnName === 'report_spare_part_usage') {
              let part = null;
              if (args.partNumber) {
                part = await prisma.sparePart.findFirst({ where: { partNumber: args.partNumber } });
              }
              if (!part && args.partName) {
                const allParts = await prisma.sparePart.findMany();
                part = allParts.find(p => p.partName.toLowerCase().includes(args.partName.toLowerCase()));
              }

              if (!part) { 
                result = `[ERROR] Part "${args.partNumber || args.partName}" not found.`; 
              } else {
                const usage = await prisma.sparePartUsage.create({
                  data: {
                    sparePartId: part.id,
                    quantityUsed: args.quantityUsed,
                    reason: args.reason || 'Reported via AI Assistant',
                    reportedById: (session.user as any).id,
                    status: 'PENDING',
                  }
                });
                result = `[OK] Usage request created for "${part.partName}" (Qty: ${args.quantityUsed}). It is currently PENDING approval from an engineer. Usage ID: ${usage.id}`;
              }
            } else if (fnName === 'approve_spare_part_usage') {
              const role = (session.user as any).role;
              if (role !== 'ENGINEER' && role !== 'SUPERVISOR') {
                result = `[ERROR] Only engineers or supervisors can approve usage. Your role is ${role}.`;
              } else {
                const usage = await prisma.sparePartUsage.findUnique({ where: { id: args.usageId }, include: { sparePart: true } });
                if (!usage) { result = `[ERROR] Usage request ${args.usageId} not found.`; }
                else if (usage.status !== 'PENDING') { result = `[ERROR] Request is already ${usage.status}.`; }
                else {
                  await prisma.$transaction(async (tx) => {
                    await tx.sparePartUsage.update({
                      where: { id: args.usageId },
                      data: { status: args.status, approvedById: (session.user as any).id, reason: args.reason }
                    });
                    if (args.status === 'APPROVED') {
                      await tx.sparePart.update({
                        where: { id: usage.sparePartId },
                        data: { quantity: { decrement: usage.quantityUsed } }
                      });
                    }
                  });
                  result = `[OK] Usage request ${args.usageId} successfully ${args.status}. Stock ${args.status === 'APPROVED' ? 'deducted' : 'unchanged'}.`;
                }
              }
            } else if (fnName === 'add_spare_part') {
              const newPart = await prisma.sparePart.create({
                data: {
                  partName: args.partName,
                  partNumber: args.partNumber,
                  quantity: args.quantity,
                  equipment: args.category || 'General',
                  location: args.location || 'Warehouse',
                  supplier: args.supplier || 'Unknown',
                },
              });
              result = `[OK] New spare part "${newPart.partName}" added successfully with quantity ${newPart.quantity}`;
            } else if (fnName === 'add_motor_inspection') {
              const motorForInspection = allMotors.find(m => m.motorTag === args.motorTag)
              const avgCurrent = args.currentR && args.currentY && args.currentB
                ? (args.currentR + args.currentY + args.currentB) / 3 : null
              const ratedA = motorForInspection ? parseFloat(calcRatedCurrent(motorForInspection.powerKw, motorForInspection.voltage).replace(/[^0-9.]/g, '')) : null
              const loadingPct = avgCurrent && ratedA ? (avgCurrent / ratedA) * 100 : null
              const foundMotor = allMotors.find(m => m.motorTag === args.motorTag)
              await prisma.motorInspection.create({
                data: {
                  motorTag: args.motorTag,
                  motorName: args.motorName,
                  area: foundMotor?.area || 'General',
                  category: foundMotor?.voltage?.includes('kV') ? (foundMotor.voltage.includes('10') ? '10kV' : '3kV') : 'LT',
                  inspectedBy: args.inspectedBy,
                  shift: args.shift,
                  currentR: args.currentR ?? null,
                  currentY: args.currentY ?? null,
                  currentB: args.currentB ?? null,
                  ratedCurrent: ratedA,
                  loadingPct: loadingPct,
                  abnormality: args.abnormality || null,
                  inspectedAt: new Date(),
                },
              });
              result = `[OK] Motor inspection recorded for ${args.motorTag}${loadingPct ? ` | Loading: ${loadingPct.toFixed(1)}%` : ''}`;
            }
          } catch (e: any) {
            result = `❌ Database error: ${e.message}`
          }

          toolResults.push(result)
          messages.push({ role: 'tool', tool_call_id: toolCall.id, content: result })
        }

        // ── Step 3: Get final answer after tool execution ─────────────────
        const secondCall = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          max_tokens: 800,
          temperature: 0.2,
        })

        return NextResponse.json({
          answer: secondCall.choices[0].message.content ?? 'Done.',
          type: 'ai_action',
          actions: toolResults,
          alerts,
        })
      }

      // Post-process OpenAI answer to see if it looks like a report/list
      // If it has tables or list markers, we can try to extract data for the report button
      let reportData = null
      const answer = firstChoice.message.content || ''
      
      if (q.includes('spare') || q.includes('part') || q.includes('stock')) {
        reportData = {
          title: 'Spare Parts Inventory Report',
          headers: ['Part Name', 'Part Number', 'Quantity', 'Location', 'Supplier'],
          rows: allSpareParts.map(p => [p.partName, p.partNumber, p.quantity, p.location || '—', p.supplier || '—'])
        }
      } else if (q.includes('motor') || q.includes('machine') || q.includes('equipment')) {
        reportData = {
          title: 'Equipment/Motor Status Report',
          headers: ['Tag', 'Name', 'Power', 'Voltage', 'Status', 'Area'],
          rows: allMotors.filter(m => q.includes(m.area.toLowerCase()) || !q.includes('area')).map(m => [m.motorTag, m.motorName, `${m.powerKw}kW`, m.voltage, m.status, m.area])
        }
      } else if (q.includes('mis') || q.includes('activity')) {
        reportData = {
          title: 'Maintenance Information System (MIS) Report',
          headers: ['Date', 'Area', 'Equipment', 'Type', 'Description'],
          rows: allMisMonth.map(m => [new Date(m.date).toLocaleDateString('en-IN'), m.area, m.equipmentName, m.workType, m.description])
        }
      }

      // No tool call — plain answer
      return NextResponse.json({
        answer: firstChoice.message.content ?? 'No response generated.',
        type: reportData ? 'report' : 'ai_response',
        reportData,
        alerts,
      })
    } catch (err: any) {
      console.error('OpenAI error:', err.message)
      return NextResponse.json({
        answer: `⚠️ **AI Error:** ${err.message}\n\nPlease check the OpenAI API key is valid in Vercel environment variables.`,
        type: 'error',
        debug_error: err.message,
      })
    }
  } else {
    console.log('No valid OPENAI_API_KEY — using local fallback. Key value length:', openaiKey?.length ?? 0)
  }

  // ── Local fallbacks (no OpenAI key) ──────────────────────────────────────
  if (q.includes('spare') || q.includes('part') || q.includes('stock')) {
    const parts = await prisma.sparePart.findMany({ take: 50, orderBy: { partName: 'asc' } })
    const lines = parts.map(p => `- **${p.partName}** (${p.partNumber}): Qty ${p.quantity} @ ${p.location || 'Warehouse'}`).join('\n')
    return NextResponse.json({ 
      answer: `**Spare Parts in Stock:**\n\n${lines}`, 
      type: 'report', 
      reportData: {
        title: 'Spare Parts Inventory Report',
        headers: ['Part Name', 'Part Number', 'Quantity', 'Location', 'Supplier'],
        rows: parts.map(p => [p.partName, p.partNumber, p.quantity, p.location || '—', p.supplier || '—'])
      }
    })
  }

  if (q.includes('today') || q.includes('statistics') || q.includes('summary') || q.includes('how many')) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    const [misCount, actCount, motorCount] = await Promise.all([
      prisma.dailyMIS.count({ where: { date: { gte: today, lt: tomorrow } } }),
      prisma.maintenanceActivity.count({ where: { completedAt: { gte: today, lt: tomorrow } } }),
      prisma.motor.count(),
    ])
    return NextResponse.json({
      answer: `**Today's Summary:**\n\n- MIS entries today: **${misCount}**\n- Maintenance activities: **${actCount}**\n- Total motors: **${motorCount}**`,
      type: 'stats',
    })
  }

  if (q.includes('mis') || q.includes('report') || q.includes('activities')) {
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0)
    const nextMonth = new Date(month); nextMonth.setMonth(month.getMonth() + 1)
    const entries = await prisma.dailyMIS.findMany({ where: { date: { gte: month, lt: nextMonth } }, orderBy: { date: 'desc' }, take: 50 })
    if (!entries.length) return NextResponse.json({ answer: 'No MIS entries this month yet.', type: 'mis' })
    const lines = entries.map(e => `- [${e.workType}] **${e.equipmentName}** — ${e.description.substring(0, 80)}`).join('\n')
    return NextResponse.json({ 
      answer: `**MIS This Month (${entries.length}):**\n\n${lines}`, 
      type: 'report', 
      reportData: {
        title: 'Monthly MIS Report Summary',
        headers: ['Date', 'Area', 'Equipment', 'Type', 'Description'],
        rows: entries.map(e => [new Date(e.date).toLocaleDateString('en-IN'), e.area, e.equipmentName, e.workType, e.description])
      }
    })
  }

  // ── Default help ──────────────────────────────────────────────────────────
  return NextResponse.json({
    answer: `**VoltMind AI** can answer:\n\n` +
      `- **Motor specs**: "What is the rated current of 13.01.01"\n` +
      `- **Bearings**: "Bearing of motor 21.65.01"\n` +
      `- **Voltage / Power / RPM**: "Voltage of 22.13.01"\n` +
      `- **Stats**: "Give me today's summary"\n` +
      `- **MIS**: "Show this month's MIS"\n` +
      `- **Spare parts**: "Show spare parts stock"\n` +
      `- **Document/Image Analysis**: "Summarize the attached PDF/Excel/Word/CSV or analyze the Image"\n\n` +
      `💡 _Add an OpenAI API key in \`.env.local\` as \`OPENAI_API_KEY\` to enable full AI chat._`,
    type: 'help',
  })
}

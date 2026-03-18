import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as xlsx from 'xlsx'
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'

export const exportToPDF = (report: any, monthName: string, year: number) => {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text(`EL-TEAM Monthly MIS Report: ${monthName} ${year}`, 14, 22)
  
  // Summary Stats
  doc.setFontSize(11)
  doc.text(`Total MIS Entries: ${report.totalMIS}`, 14, 32)
  doc.text(`Technical Activities: ${report.totalActivities}`, 14, 38)
  doc.text(`Work Categories: ${Object.keys(report.byWorkType).length}`, 14, 44)

  // Data Tables per Category
  let startY = 55
  
  Object.entries(report.byWorkType).forEach(([workType, items]: [string, any]) => {
    // Check if we need a new page for the heading
    if (startY > 270) {
      doc.addPage()
      startY = 20
    }
    
    doc.setFontSize(14)
    doc.text(workType, 14, startY)
    
    const tableData = items.map((e: any) => [
      new Date(e.date).toLocaleDateString('en-IN'),
      e.area,
      e.equipmentName,
      e.tagNumber || '—',
      e.description,
      e.engineerName,
      e.status
    ])

    autoTable(doc, {
      startY: startY + 5,
      head: [['Date', 'Area', 'Equipment', 'Tag', 'Description', 'Engineer', 'Status']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        4: { cellWidth: 60 } // Description column wider
      },
      margin: { top: 20 },
    })

    startY = (doc as any).lastAutoTable.finalY + 15
  })

  const blob = doc.output('blob')
  saveAs(blob, `EL-TEAM_MIS_${year}_${monthName}.pdf`)
}

export const exportMotorHistoryToPDF = (motor: any, history: any[]) => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(22)
  doc.text('Motor Inspection Report', 14, 22)
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
  
  // Motor Info
  autoTable(doc, {
    startY: 40,
    head: [['Field', 'Detail']],
    body: [
      ['Motor Tag', motor.motorTag],
      ['Motor Name', motor.motorName],
      ['Area', motor.area],
      ['Voltage', motor.voltage],
      ['Power', `${motor.powerKw} kW`],
      ['RPM', motor.rpm],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }
  })

  // History Table
  const finalY = (doc as any).lastAutoTable.finalY || 40
  doc.setTextColor(0)
  doc.setFontSize(14)
  doc.text('Inspection History', 14, finalY + 15)
  
  autoTable(doc, {
    startY: finalY + 20,
    head: [['Date/Time', 'R (A)', 'Y (A)', 'B (A)', 'Loading', 'Abnormality', 'Inspected By']],
    body: history.map((r: any) => [
      new Date(r.inspectedAt).toLocaleString('en-IN'),
      r.currentR || '—',
      r.currentY || '—',
      r.currentB || '—',
      `${r.loadingPct || 0}%`,
      r.abnormality || 'Normal',
      r.inspectedBy
    ]),
    theme: 'grid',
    styles: { fontSize: 8 }
  })

  const blob = doc.output('blob')
  saveAs(blob, `Motor_Report_${motor.motorTag}.pdf`)
}

export const exportToExcel = (report: any, monthName: string, year: number) => {
  const wb = xlsx.utils.book_new()
  
  // Flatten data for Excel
  const allData: any[] = []
  
  Object.entries(report.byWorkType).forEach(([workType, items]: [string, any]) => {
    items.forEach((e: any) => {
      allData.push({
        'Date': new Date(e.date).toLocaleDateString('en-IN'),
        'Work Category': workType,
        'Area': e.area,
        'Equipment Name': e.equipmentName,
        'Tag Number': e.tagNumber || '',
        'Description': e.description,
        'Engineer': e.engineerName,
        'Status': e.status
      })
    })
  })

  // Create summary sheet
  const summaryData = [
    ['EL-TEAM Monthly MIS Report'],
    ['Month', monthName],
    ['Year', year],
    [''],
    ['Total MIS Entries', report.totalMIS],
    ['Technical Activities', report.totalActivities],
    ['Approved Entries', report.misEntries.filter((e: any) => e.status === 'APPROVED').length]
  ]
  const wsSummary = xlsx.utils.aoa_to_sheet(summaryData)
  xlsx.utils.book_append_sheet(wb, wsSummary, 'Summary')

  // Create data sheet
  const wsData = xlsx.utils.json_to_sheet(allData)
  
  // Auto-size columns slightly
  const colWidths = [
    { wch: 12 }, // Date
    { wch: 15 }, // Category
    { wch: 15 }, // Area
    { wch: 25 }, // Equipment
    { wch: 15 }, // Tag
    { wch: 60 }, // Description
    { wch: 15 }, // Engineer
    { wch: 12 }, // Status
  ]
  wsData['!cols'] = colWidths

  xlsx.utils.book_append_sheet(wb, wsData, 'All Entries')

  // Download
  const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, `EL-TEAM_MIS_${year}_${monthName}.xlsx`)
}

export const exportMotorHistoryToExcel = (motor: any, history: any[]) => {
  const worksheet = xlsx.utils.json_to_sheet(history.map((r: any) => ({
    'Date/Time': new Date(r.inspectedAt).toLocaleString(),
    'Motor Tag': r.motorTag,
    'Motor Name': r.motorName,
    'R-Phase (A)': r.currentR,
    'Y-Phase (A)': r.currentY,
    'B-Phase (A)': r.currentB,
    'Rated Current (A)': r.ratedCurrent,
    'Loading %': r.loadingPct,
    'Abnormality': r.abnormality || 'None',
    'Shift': r.shift,
    'Inspected By': r.inspectedBy
  })))
  
  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Motor History')
  
  const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, `Motor_History_${motor.motorTag}.xlsx`)
}

export const exportToWord = async (report: any, monthName: string, year: number) => {
  const children: any[] = [
    new Paragraph({
      text: `EL-TEAM Monthly MIS Report`,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Month: `, bold: true }),
        new TextRun(`${monthName} ${year}`)
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Total Entries: `, bold: true }),
        new TextRun(`${report.totalMIS}`)
      ],
      spacing: { after: 400 }
    })
  ]

  Object.entries(report.byWorkType).forEach(([workType, items]: [string, any]) => {
    // Section Header
    children.push(
      new Paragraph({
        text: workType,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      })
    )

    // Construct Table Rows
    const tableRows = [
      new TableRow({
        children: ['Date', 'Area', 'Equipment', 'Tag', 'Description', 'Engineer'].map(headerText => 
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: headerText, bold: true, size: 20 })] })],
            shading: { fill: "3b82f6", color: "auto" }
          })
        )
      })
    ]

    items.forEach((e: any) => {
      tableRows.push(
        new TableRow({
          children: [
            new Date(e.date).toLocaleDateString('en-IN'),
            e.area,
            e.equipmentName,
            e.tagNumber || '-',
            e.description,
            e.engineerName
          ].map(text => 
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 18 })] })],
            })
          )
        })
      )
    })

    // Add Table to document
    children.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "e5e5e5" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "e5e5e5" },
        }
      })
    )
  })

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  })

  // Generate and save
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `EL-TEAM_MIS_${year}_${monthName}.docx`)
}

// --- Generic Export Utilities ---

export const exportGenericTableToPDF = (title: string, headers: string[], rows: (string | number)[][], filename: string) => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(59, 130, 246)
  doc.text(title, 14, 22)
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated by VoltMind AI on: ${new Date().toLocaleString('en-IN')}`, 14, 30)
  
  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 20 },
  })

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

export const exportGenericTableToExcel = (title: string, headers: string[], rows: (string | number)[][], filename: string) => {
  const wb = xlsx.utils.book_new()
  
  // Create data for worksheet
  const data = [
    [title],
    [`Generated: ${new Date().toLocaleString('en-IN')}`],
    [],
    headers,
    ...rows
  ]
  
  const ws = xlsx.utils.aoa_to_sheet(data)
  
  // Basic styling/formatting for headers
  const range = xlsx.utils.decode_range(ws['!ref'] || 'A1')
  ws['!cols'] = headers.map(() => ({ wch: 20 }))
  
  xlsx.utils.book_append_sheet(wb, ws, 'Report')
  
  const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}

export const exportGenericTableToWord = async (title: string, headers: string[], rows: (string | number)[][], filename: string) => {
  const tableRows = [
    new TableRow({
      children: headers.map(h => 
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'ffffff' })], alignment: 'center' })],
          shading: { fill: '3b82f6' }
        })
      )
    }),
    ...rows.map(row => 
      new TableRow({
        children: row.map(cell => 
          new TableCell({
            children: [new Paragraph({ text: String(cell) })]
          })
        )
      })
    )
  ]

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: `Generated by VoltMind AI on: ${new Date().toLocaleString('en-IN')}`,
          spacing: { after: 400 }
        }),
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "e5e5e5" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "e5e5e5" },
          }
        })
      ]
    }]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`)
}

export const exportBatteryInspectionToPDF = (inspection: any, readings: any[]) => {
  const doc = new jsPDF()
  const now = new Date().toLocaleString('en-IN')
  
  // Industrial Header (Consistent with Power Report)
  doc.setFillColor(30, 41, 59) // slate-800
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('BATTERY SYSTEM INSPECTION', 14, 25)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Recorded: ${new Date(inspection.date).toLocaleString('en-IN')}`, 14, 33)
  
  doc.setFontSize(10)
  doc.text(`Inspector: ${inspection.inspectorName}`, 140, 25)
  doc.text(`Report ID: #${inspection.id.slice(-6).toUpperCase()}`, 140, 33)

  // Summary KPI Section
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Health Summary', 14, 55)
  
  autoTable(doc, {
    startY: 60,
    head: [['System Metric', 'Status / Value', 'System Analysis']],
    body: [
      ['Total Batteries', inspection.totalBatteries, 'Full bank unit count'],
      ['Healthy Status', inspection.healthyCount, 'Operating within parameters'],
      ['Warning Status', inspection.warningCount, 'Requires near-term attention'],
      ['Critical Status', inspection.criticalCount, 'Immediate replacement/action required'],
      ['110V Bank Voltage', `${inspection.totalVoltage_110V?.toFixed(1) || '—'} V`, 'Total aggregated bank voltage'],
      ['110V Avg Cell', `${inspection.averageVoltage_110V?.toFixed(2) || '—'} V`, 'Mean voltage per individual cell'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center', fontStyle: 'bold' }
    }
  })

  // Readings Table with Color Coding
  const finalY = (doc as any).lastAutoTable.finalY || 60
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Detailed Cell Readings', 14, finalY + 15)
  
  autoTable(doc, {
    startY: finalY + 20,
    head: [['Section Name', 'Cell No', 'Voltage (V)', 'Sp. Gravity', 'Health Status']],
    body: readings.map((r: any) => [
      r.section.replace(/_/g, ' '),
      `C${r.batteryNumber}`,
      r.voltage?.toFixed(2) || '—',
      r.specificGravity?.toFixed(3) || '—',
      r.status
    ]),
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const status = data.cell.raw;
        if (status === 'CRITICAL') {
          data.cell.styles.textColor = [220, 38, 38]; // red-600
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'WARNING') {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
        }
      }
    }
  })

  // Page 2: AI Analysis & Observations
  if (inspection.observations || inspection.aiAnalysis) {
    doc.addPage()
    
    // Header for Page 2
    doc.setFillColor(30, 41, 59)
    doc.rect(0, 0, 210, 20, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text('OBSERVATIONS & AI ANALYTICS', 14, 13)
    
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Technician Observations:', 14, 35)
    
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(11)
    const splitObs = doc.splitTextToSize(inspection.observations || 'No manual observations recorded.', 180)
    doc.text(splitObs, 14, 42)
    
    if (inspection.aiAnalysis) {
      let currentY = 42 + (splitObs.length * 6) + 15
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(37, 99, 235) // blue-600
      doc.text('VoltMind AI Sectional Insights', 14, currentY)
      currentY += 10
      
      inspection.aiAnalysis.split(' | ').forEach((block: string, idx: number) => {
        const recommendations = inspection.recommendations?.split(' | ')[idx] || ''
        
        // Section Card Background
        doc.setFillColor(248, 250, 252)
        const blockText = block.split('] ')[1] || block;
        const sectionName = block.split('] ')[0].replace('[', '') || 'Section Analysis';
        
        const splitContent = doc.splitTextToSize(blockText, 170)
        const splitRec = doc.splitTextToSize(`Recommendation: ${recommendations.split(': ')[1] || recommendations}`, 165)
        
        const cardHeight = (splitContent.length * 5) + (splitRec.length * 5) + 20
        
        if (currentY + cardHeight > 270) {
          doc.addPage()
          currentY = 20
        }
        
        doc.rect(14, currentY, 182, cardHeight, 'F')
        doc.setDrawColor(226, 232, 240)
        doc.rect(14, currentY, 182, cardHeight)
        
        doc.setFontSize(10)
        doc.setTextColor(30, 41, 59)
        doc.setFont('helvetica', 'bold')
        doc.text(sectionName, 20, currentY + 8)
        
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(71, 85, 105)
        doc.text(splitContent, 20, currentY + 15)
        
        currentY += (splitContent.length * 5) + 18
        
        doc.setTextColor(5, 150, 105) // emerald-600
        doc.setFont('helvetica', 'bold')
        doc.text('💡', 20, currentY)
        doc.text(splitRec, 26, currentY)
        
        currentY += (splitRec.length * 5) + 12
      })
    }
  }

  // Common Footer for all pages
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Generated by VoltMind AI – Page ${i} of ${pageCount}`, 105, 287, { align: 'center' })
    doc.text(`Ref: EL-TEAM/BATT/${inspection.id.slice(-4).toUpperCase()}`, 196, 287, { align: 'right' })
  }

  const blob = doc.output('blob')
  saveAs(blob, `Battery_Report_${new Date(inspection.date).toISOString().split('T')[0]}.pdf`)
}

export const exportPowerToPDF = (readings: any[], options?: { title?: string, subtitle?: string }) => {
  const doc = new jsPDF()
  const now = new Date().toLocaleString('en-IN')

  // Calculate stats dynamically from readings
  const total = readings.reduce((sum, r) => sum + r.totalConsumption, 0);
  const average = readings.length > 0 ? total / readings.length : 0;
  const maxReading = readings.length > 0 ? [...readings].sort((a,b) => b.totalConsumption - a.totalConsumption)[0] : null;

  // Industrial Header
  doc.setFillColor(30, 41, 59) // slate-800
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(options?.title || 'TS-7 DRI PLANT', 14, 25)
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(options?.subtitle || 'Power Consumption MIS Report', 14, 33)
  
  doc.setFontSize(10)
  doc.text(`Generated: ${now}`, 140, 33)

  // KPI Summary Section
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.text('Monthly Summary', 14, 55)
  
  autoTable(doc, {
    startY: 60,
    head: [['Metric', 'Value (kWh)', 'Description']],
    body: [
      ['Total Consumption', formatPowerValue(total), 'Sum of all TS-7 net power used'],
      ['Average Daily', formatPowerValue(average), 'Calculated daily average'],
      ['Peak Day', maxReading ? `${new Date(maxReading.date).toLocaleDateString('en-IN')}: ${formatPowerValue(maxReading.totalConsumption)}` : 'N/A', 'Highest consumption day'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }
  })

  // Daily Readings Table
  const finalY = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(14)
  doc.text('Daily Consumption Log', 14, finalY)

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Date', 'Incomer 1', 'Incomer 2', 'Total Outgoing', 'Net Consumption', 'Daily Delta']],
    body: readings.map(r => {
      const totalOut = r.outgoing1_TS12 + r.outgoing1_TS13 + r.outgoing1_TS19_24 + r.outgoing2_TS12 + r.outgoing2_TS13 + r.outgoing2_TS19_24;
      return [
        new Date(r.date).toLocaleDateString('en-IN'),
        `${r.incomer1} MWh`,
        `${r.incomer2} MWh`,
        `${formatPowerValue(totalOut)}`,
        `${formatPowerValue(r.totalConsumption)}`,
        `${formatPowerValue(r.dailyConsumption)}`
      ]
    }),
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] }
  })

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text('Generated by Electrical Maintenance App – Powered by VoltMind AI', 105, 285, { align: 'center' })
  }

  const blob = doc.output('blob')
  saveAs(blob, `TS7_Power_Report_${new Date().toISOString().split('T')[0]}.pdf`)
}

export const exportPowerToExcel = (readings: any[], stats?: any) => {
  if (!stats) stats = { monthly: { total: 0, average: 0, count: readings.length, max: null, min: null } };
  const wb = xlsx.utils.book_new()

  // Sheet 1: Raw Data
  const rawData = readings.map(r => ({
    'Date': new Date(r.date).toLocaleDateString('en-IN'),
    'Incomer 1 (MWh)': r.incomer1,
    'Incomer 2 (MWh)': r.incomer2,
    'Out 1-TS12 (kWh)': r.outgoing1_TS12,
    'Out 1-TS13 (kWh)': r.outgoing1_TS13,
    'Out 1-TS19-24 (kWh)': r.outgoing1_TS19_24,
    'Out 2-TS12 (kWh)': r.outgoing2_TS12,
    'Out 2-TS13 (kWh)': r.outgoing2_TS13,
    'Out 2-TS19-24 (kWh)': r.outgoing2_TS19_24,
    'Net Consumption (kWh)': r.totalConsumption,
    'Daily Delta (kWh)': r.dailyConsumption,
    'Entered By': r.createdBy?.name || 'System'
  }))
  const wsRaw = xlsx.utils.json_to_sheet(rawData)
  xlsx.utils.book_append_sheet(wb, wsRaw, 'Raw Readings')

  // Sheet 2: Daily Consumption Summary
  const dailySummary = readings.map(r => ({
    'Date': new Date(r.date).toLocaleDateString('en-IN'),
    'Net Consumption (kWh)': r.totalConsumption,
    'Daily Variance (kWh)': r.dailyConsumption,
    'Status': r.totalConsumption > 5000 ? (r.totalConsumption > 7500 ? 'ABNORMAL' : 'HIGH') : 'NORMAL'
  }))
  const wsDaily = xlsx.utils.json_to_sheet(dailySummary)
  xlsx.utils.book_append_sheet(wb, wsDaily, 'Daily Summary')

  // Sheet 3: Monthly Statistics
  const summaryData = [
    ['TS-7 DRI Power Consumption Summary'],
    ['Generated at', new Date().toLocaleString()],
    [],
    ['Total Monthly Consumption', stats.monthly.total, 'kWh'],
    ['Average Daily Consumption', stats.monthly.average, 'kWh'],
    ['Total Readings', stats.monthly.count],
    ['Max Day', stats.monthly.max ? new Date(stats.monthly.max.date).toLocaleDateString('en-IN') : 'N/A'],
    ['Max Value', stats.monthly.max ? stats.monthly.max.totalConsumption : 0, 'kWh'],
    ['Min Day', stats.monthly.min ? new Date(stats.monthly.min.date).toLocaleDateString('en-IN') : 'N/A'],
    ['Min Value', stats.monthly.min ? stats.monthly.min.totalConsumption : 0, 'kWh'],
  ]
  const wsStats = xlsx.utils.aoa_to_sheet(summaryData)
  xlsx.utils.book_append_sheet(wb, wsStats, 'Stats Summary')

  // Download
  const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, `TS7_Power_MIS_${new Date().toISOString().split('T')[0]}.xlsx`)
}

function formatPowerValue(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

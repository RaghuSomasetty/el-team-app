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

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const sparesData = [
  { itemCode: '07-W-01374', name: 'STAR FEEDER Motor', equipment: '21.13.01', qty: 1, desc: '0.37 KW, 1.2 A, 29.5 RPM' },
  { itemCode: '07-C-01742', name: 'FLOCULANT PUMP Motor', equipment: '66.02.01', qty: 1, desc: '0.55 KW, 1.41 A, 1420 RPM' },
  { itemCode: '07-C-M4581', name: 'STARTING DAMPER Motor', equipment: '21.15.02', qty: 1, desc: '0.7 KW, 1.4 A, 1500 RPM' },
  { itemCode: '07-N-0104', name: 'CRANE (PRODUCT SCREEN) Motor', equipment: '43.30.01', qty: 1, desc: '2.5 KW, 7 A' },
  { itemCode: '07-C-M2012', name: 'OIL PUMP PGC 1ST STAGE Motor', equipment: '22.13.02', qty: 1, desc: '3.5 KW, 7.7 A, 1450 RPM' },
  { itemCode: '07-G-515-02-513', name: 'CRANE (FOR PUMP HOUSE) Motor', equipment: '63.51.01', qty: 1, desc: '4.4 KW, 11.25 A' },
  { itemCode: '07-C-00014', name: 'FLUSH PUMP CHARGE HOPPER Motor', equipment: '21.85.01', qty: 1, desc: '5 KW, 10.1 A, 2900 RPM' },
  { itemCode: '07-C-00018', name: 'DRAINAGE PUMP UNDER CLARIFIER Motor', equipment: '61.11.01', qty: 1, desc: '6.5 KW, 13.4 A, 3000 RPM' },
  { itemCode: '07-C-M5640', name: 'MONO RAIL HOIST- REDUCTION FURNACE', equipment: '21.51.01', qty: 1, desc: '7 KW, 19.9 A' },
  { itemCode: '07-O-M1412-01', name: 'HYDRAULIC UNIT MBF Motor', equipment: '21.08.30', qty: 1, desc: '10 KW, 20.4 A, 1460 RPM' },
  { itemCode: '515-02-5161', name: 'CLARIFIER INSIDE PUMP M1', equipment: '61.05', qty: 1, desc: '18.5 KW, 36 A, 1465 RPM' },
  { itemCode: '07-C-00023', name: 'Day bin to transfer station Motor', equipment: '14.01', qty: 3, desc: '19.5 KW, 40 A, 1460 RPM' },
  { itemCode: '07-C-00028', name: 'Product bin to product screening Motor', equipment: '43.01', qty: 2, desc: '40 KW, 80 A, 1470 RPM' },
  { itemCode: '07-C-00030', name: 'SUMP PUMP( SEAL GAS SCRUBBER) Motor', equipment: '33.13.01', qty: 1, desc: '49 KW, 94 A, 1450 RPM' },
  { itemCode: '07-C-00032', name: 'DCW PUMP2 Motor', equipment: 'DCW PUMP2', qty: 1, desc: '67 KW, 126 A, 1500 RPM' },
  { itemCode: '07-C-00033', name: 'RECIRCULATION PUMP AT TOP GAS SCRUBBER', equipment: '21.70.01', qty: 1, desc: '81 KW, 152 A, 1480 RPM' },
  { itemCode: '07-C-00034', name: 'Oxide screening station to feed bins Motor', equipment: '13.01', qty: 1, desc: '100 KW, 188 A, 1485 RPM' },
  { itemCode: '07-C-00035', name: 'FEED PUMP FIRE WATER Motor', equipment: '65.01.01', qty: 1, desc: '118 KW, 220 A, 1485 RPM' },
  { itemCode: '07-C-00037', name: 'FEED PUMP( M/C COOLING WATER) Motor', equipment: '63.03.01', qty: 1, desc: '144 KW, 265 A, 1486 RPM' },
  { itemCode: '07-C-00003-R', name: '10KV COOLING GAS COMPRESSOR Motor', equipment: '22.41.01', qty: 1, desc: '1900 KW, 130 A, 1492 RPM' },
]

async function main() {
  console.log('Inserting spare parts...')
  let added = 0
  
  for (const item of sparesData) {
    // Check if already exists
    const existing = await prisma.sparePart.findFirst({
      where: { partNumber: item.itemCode }
    })
    
    if (!existing) {
      await prisma.sparePart.create({
        data: {
          partName: item.name,
          partNumber: item.itemCode,
          equipment: item.equipment,
          quantity: item.qty,
          supplier: item.desc // Using supplier field to hold the motor spec info
        }
      })
      added++
    }
  }
  
  console.log(`Added ${added} new spare parts.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

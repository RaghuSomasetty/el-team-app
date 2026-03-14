const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const count = await prisma.motorInspection.count()
  console.log('Total inspections:', count)
  
  if (count > 0) {
    const samples = await prisma.motorInspection.findMany({
      take: 5,
      orderBy: { inspectedAt: 'desc' }
    })
    console.log('Recent inspections:', JSON.stringify(samples, null, 2))
    
    // Check specific motor if possible
    const tag = '41.12.01'
    const byTag = await prisma.motorInspection.findMany({
      where: { motorTag: tag }
    })
    console.log(`Inspections for tag "${tag}":`, byTag.length)
    
    if (byTag.length === 0) {
      // Try contains
      const containsTag = await prisma.motorInspection.findMany({
        where: { motorTag: { contains: tag } }
      })
      console.log(`Inspections containing tag "${tag}":`, containsTag.length)
      if (containsTag.length > 0) {
        console.log('First match motorTag:', containsTag[0].motorTag)
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const tagsToDelete = ['12.01', '08.11']
  
  for (const tag of tagsToDelete) {
    console.log(`Processing deletion for tag: ${tag}`)
    
    // Delete inspections first if they exist
    const inspections = await prisma.motorInspection.deleteMany({
      where: { motorTag: tag }
    })
    console.log(`- Deleted ${inspections.count} inspection records for ${tag}`)
    
    // Delete the motor entry
    const motor = await prisma.motor.deleteMany({
      where: { motorTag: tag }
    })
    console.log(`- Deleted ${motor.count} motor records for ${tag}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

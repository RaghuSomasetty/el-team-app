const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const usages = await prisma.sparePartUsage.findMany({
    take: 10,
    orderBy: { updatedAt: 'desc' },
    include: { sparePart: true, reportedBy: true, approvedBy: true }
  })
  
  console.log('Recent usage requests:')
  usages.forEach(u => {
    console.log(`- ID: ${u.id}`)
    console.log(`  Part: ${u.sparePart.partName} (ID: ${u.sparePartId})`)
    console.log(`  Qty Used: ${u.quantityUsed}`)
    console.log(`  Status: ${u.status}`)
    console.log(`  Current Stock: ${u.sparePart.quantity}`)
    console.log(`  Reported By: ${u.reportedBy?.name}`)
    console.log(`  Approved By: ${u.approvedBy?.name}`)
    console.log(`  Updated At: ${u.updatedAt}`)
    console.log('---')
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

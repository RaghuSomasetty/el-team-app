const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const email = 'admin@elteam.com'
  const password = 'admin123'
  const hash = await bcrypt.hash(password, 12)
  
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash },
    create: {
      email,
      name: 'Administrator',
      passwordHash: hash,
      designation: 'Engineer',
      role: 'ADMIN',
      updatedAt: new Date()
    }
  })
  
  console.log(`Admin user ensured: ${email} / ${password}`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())

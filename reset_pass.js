const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const email = 'raghusomasetty05@gmail.com'
  const newPassword = 'admin123'
  const passwordHash = await bcrypt.hash(newPassword, 12)
  
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash }
  })
  
  console.log(`Password reset successfully for ${email}`)
  console.log(`New password is: ${newPassword}`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())

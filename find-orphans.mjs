import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const employes = await prisma.employe.findMany({
        where: { userId: null }
    })
    console.log('Orphan employees:', JSON.stringify(employes, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

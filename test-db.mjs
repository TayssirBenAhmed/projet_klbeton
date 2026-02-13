import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const users = await prisma.user.findMany({
            include: { employe: true }
        })
        console.log('Users found:', users.length)
        if (users.length > 0) {
            console.log('Sample user email:', users[0].email)
            console.log('Sample user role:', users[0].role)
            console.log('Sample user has employe:', !!users[0].employe)
        }
    } catch (error) {
        console.error('Database connection error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()

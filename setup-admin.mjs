import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany()
    console.log('Total users:', users.length)
    users.forEach(u => console.log(`- ${u.email} (${u.role})`))

    const adminEmail = 'admin@klbeton.tn'
    const admin = users.find(u => u.email === adminEmail)

    if (!admin) {
        console.log(`Creating admin user: ${adminEmail}`)
        const hashedPassword = await hash('admin123', 10)
        const newUser = await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                role: 'ADMIN'
            }
        })
        console.log('Admin created successfully with password: admin123')
    } else {
        console.log(`Admin user already exists: ${admin.email}`)
        if (admin.role !== 'ADMIN') {
            console.log('Updating role to ADMIN...')
            await prisma.user.update({
                where: { id: admin.id },
                data: { role: 'ADMIN' }
            })
        }
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

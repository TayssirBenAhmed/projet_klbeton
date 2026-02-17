import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensure it's not cached

export async function GET(request) {
    // secure this endpoint if needed, e.g. check for a CRON_SECRET header
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // 1. Check if journal is valid (logic from stats API)
        const totalEmployes = await prisma.employe.count({ where: { statut: 'ACTIF' } });
        const pointagesJour = await prisma.pointage.count({
            where: { date: { gte: startOfDay, lte: endOfDay } }
        });

        const isJournalValide = pointagesJour >= totalEmployes && totalEmployes > 0;

        if (isJournalValide) {
            return NextResponse.json({ message: 'Journal already validated. No reminder sent.' });
        }

        // 2. Journal NOT valid -> Send Reminder

        // Find System Admin (Sender)
        const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!adminUser) {
            return NextResponse.json({ error: 'No Admin user found to send message.' }, { status: 404 });
        }

        // Find Chefs (Receivers)
        const chefs = await prisma.user.findMany({
            where: { role: 'CHEF' }
        });

        if (chefs.length === 0) {
            return NextResponse.json({ message: 'No Chefs found to receive reminder.' });
        }

        const messageContent = "Bonjour Chef, n'oubliez pas de valider la feuille de présence pour aujourd'hui.";

        // Send message to all chefs
        const messagesData = chefs.map(chef => ({
            content: messageContent,
            senderId: adminUser.id,
            receiverId: chef.id,
            isRead: false,
            createdAt: new Date() // specific time
        }));

        // Use createMany if database supports it (Postgres does)
        await prisma.message.createMany({
            data: messagesData
        });

        return NextResponse.json({
            success: true,
            message: `Reminder sent to ${chefs.length} chefs.`,
            stats: { totalEmployes, pointagesJour }
        });

    } catch (error) {
        console.error('Cron Reminder Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

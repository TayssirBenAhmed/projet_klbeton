import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/authOptions';
import prisma from '@/lib/prisma';

export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { senderId } = body;

        if (!senderId) return NextResponse.json({ error: 'Sender ID required' }, { status: 400 });

        await prisma.message.updateMany({
            where: {
                receiverId: session.user.id,
                senderId: senderId,
                isRead: false
            },
            data: { isRead: true }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
    }
}

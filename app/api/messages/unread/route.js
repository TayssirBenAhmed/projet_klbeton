import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/authOptions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ count: 0 });

        const count = await prisma.message.count({
            where: {
                receiverId: session.user.id,
                isRead: false
            }
        });

        return NextResponse.json({ count });
    } catch (error) {
        return NextResponse.json({ count: 0 }, { status: 500 });
    }
}

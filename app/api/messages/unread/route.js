import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ count: 0 });

        // Get count of unread messages
        const count = await prisma.message.count({
            where: {
                receiverId: session.user.id,
                isRead: false
            }
        });

        // Get the last unread message sender
        const lastUnreadMessage = await prisma.message.findFirst({
            where: {
                receiverId: session.user.id,
                isRead: false
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                senderId: true,
                sender: {
                    select: {
                        employe: {
                            select: {
                                nom: true,
                                prenom: true
                            }
                        },
                        role: true
                    }
                }
            }
        });

        // Format sender name
        let lastSenderName = null;
        let lastSenderId = null;
        
        if (lastUnreadMessage) {
            lastSenderId = lastUnreadMessage.senderId;
            if (lastUnreadMessage.sender?.employe) {
                lastSenderName = `${lastUnreadMessage.sender.employe.prenom} ${lastUnreadMessage.sender.employe.nom}`;
            } else if (lastUnreadMessage.sender?.role === 'ADMIN') {
                lastSenderName = 'Admin';
            } else {
                lastSenderName = 'Utilisateur';
            }
        }

        return NextResponse.json({ 
            count, 
            lastSenderId,
            lastSenderName 
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return NextResponse.json({ count: 0 }, { status: 500 });
    }
}

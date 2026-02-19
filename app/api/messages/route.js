import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const contactId = searchParams.get('contactId');

        // Admin sees messages with specific Chef (contactId required/optional depending on UI)
        // Chef sees messages with Admin (usually only one admin or any admin)

        // If contactId provided, fetch conversation
        if (contactId) {
            const rawMessages = await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: session.user.id, receiverId: contactId },
                        { senderId: contactId, receiverId: session.user.id }
                    ]
                },
                orderBy: { createdAt: 'asc' },
                include: {
                    sender: {
                        select: {
                            id: true,
                            role: true,
                            email: true,
                            employe: { select: { nom: true, prenom: true } }
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            role: true,
                            email: true,
                            employe: { select: { nom: true, prenom: true } }
                        }
                    }
                }
            });

            const messages = rawMessages.map(m => ({
                ...m,
                sender: {
                    ...m.sender,
                    name: m.sender.employe ? `${m.sender.employe.prenom} ${m.sender.employe.nom}` : m.sender.email
                },
                receiver: {
                    ...m.receiver,
                    name: m.receiver.employe ? `${m.receiver.employe.prenom} ${m.receiver.employe.nom}` : m.receiver.email
                }
            }));

            return NextResponse.json(messages);
        }

        // If no contactId, maybe return list of conversations? 
        // For V1, let's assume Admin selects a Chef from a list to chat. 
        // For Chef, they just see Admin chat. 

        // Let's return all unique contacts the user has chatted with?
        // Or simplified: Just return 400 if no contactId for now, ensuring UI sends it.
        return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: 'Error fetching messages' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { content, receiverId } = body;

        if (!content || !receiverId) {
            return NextResponse.json({ error: 'Missing content or receiver' }, { status: 400 });
        }

        const newMessage = await prisma.message.create({
            data: {
                content,
                senderId: session.user.id,
                receiverId,
                isRead: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        role: true,
                        email: true,
                        employe: { select: { nom: true, prenom: true } }
                    }
                }
            }
        });

        const formattedMessage = {
            ...newMessage,
            sender: {
                ...newMessage.sender,
                name: newMessage.sender.employe ? `${newMessage.sender.employe.prenom} ${newMessage.sender.employe.nom}` : newMessage.sender.email
            }
        };

        return NextResponse.json(formattedMessage);

    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Error sending message' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json([], { status: 401 });

        const { role, id } = session.user;

        let contacts = [];

        // Logic:
        // Admin sees all CHEF roles.
        // Chef sees all ADMIN roles.
        // Employee? Maybe nothing or Admin.

        if (role === 'ADMIN') {
            const users = await prisma.user.findMany({
                where: { role: 'CHEF' },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    employe: {
                        select: { nom: true, prenom: true }
                    }
                }
            });
            contacts = users.map(u => ({
                id: u.id,
                email: u.email,
                role: u.role,
                name: u.employe ? `${u.employe.prenom} ${u.employe.nom}` : u.email
            }));
        } else if (role === 'CHEF' || role === 'EMPLOYE') {
            const users = await prisma.user.findMany({
                where: { role: 'ADMIN' },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    employe: {
                        select: { nom: true, prenom: true }
                    }
                }
            });
            contacts = users.map(u => ({
                id: u.id,
                email: u.email,
                role: u.role,
                name: u.employe ? `${u.employe.prenom} ${u.employe.nom}` : u.email
            }));
        }

        return NextResponse.json(contacts);

    } catch (error) {
        return NextResponse.json({ error: 'Error fetching contacts' }, { status: 500 });
    }
}

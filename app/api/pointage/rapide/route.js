import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/authOptions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'CHEF')) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { day, pointages } = await request.json(); // day: YYYY-MM-DD, pointages: [{employeId, statut, heuresSupp}]

        const results = await Promise.all(pointages.map(async (p) => {
            return await prisma.pointage.upsert({
                where: {
                    employeId_date: {
                        employeId: p.employeId,
                        date: new Date(day)
                    }
                },
                update: {
                    statut: p.statut,
                    heuresSupp: p.heuresSupp || 0,
                    joursTravailles: p.statut === 'ABSENT' ? 0 : 1
                },
                create: {
                    employeId: p.employeId,
                    date: new Date(day),
                    statut: p.statut,
                    heuresSupp: p.heuresSupp || 0,
                    joursTravailles: p.statut === 'ABSENT' ? 0 : 1
                }
            });
        }));

        return NextResponse.json({ success: true, count: results.length });
    } catch (error) {
        console.error('Error in bulk pointage:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

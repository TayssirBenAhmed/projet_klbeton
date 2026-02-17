import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/authOptions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/avances/[id]/approve
 * Approves or Rejects an advance
 */
export async function POST(request, { params }) {
    console.log('[Approve API] START');
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'CHEF'].includes(session.user.role)) {
            console.error('[Approve API] Unauthorized:', session?.user?.role);
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const resolvedParams = await params;
        const id = resolvedParams.id;
        const { statut } = await request.json();

        console.log(`[Approve API] ID: ${id}, Target Statut: ${statut}`);

        if (!['APPROVED', 'REJECTED'].includes(statut)) {
            return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
        }

        // We use absolute raw SQL to bypass any Prisma client generation issues
        try {
            console.log('[Approve API] Running SQL update...');
            // Need to handle the enum cast carefully
            const result = await prisma.$executeRawUnsafe(
                `UPDATE "Avance" SET statut = $1::"AvanceStatut", "updatedAt" = NOW() WHERE id = $2`,
                statut,
                id
            );

            console.log(`[Approve API] SQL results: ${result}`);

            if (result === 0) {
                console.warn(`[Approve API] No row found for ID: ${id}`);
            }

            const updatedRow = await prisma.avance.findUnique({
                where: { id },
                include: { employe: true }
            });

            return NextResponse.json(updatedRow);
        } catch (sqlError) {
            console.error('[Approve API] SQL Error:', sqlError.message);
            // Re-throw to be caught by global handler
            throw sqlError;
        }
    } catch (globalError) {
        console.error('[Approve API] FATAL:', globalError);
        return NextResponse.json({
            error: globalError.message,
            code: globalError.code,
            stack: globalError.stack
        }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/authOptions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/avances?employeId=XXX
 * List advances for an employee
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const employeId = searchParams.get('employeId');

        if (!employeId) {
            return NextResponse.json({ error: 'employeId requis' }, { status: 400 });
        }

        const avances = await prisma.avance.findMany({
            where: { employeId },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(avances);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/avances
 * Create a new advance
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'CHEF')) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { employeId, montant, note, date } = await request.json();

        if (!employeId || !montant) {
            return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
        }

        const avance = await prisma.avance.create({
            data: {
                employeId,
                montant: parseFloat(montant),
                note,
                date: date ? new Date(date) : new Date()
            }
        });

        return NextResponse.json(avance);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/avances/[id] (handled via sibling file or check if this works as a standard dynamic route pattern)
 */
// For simplicity, we can use a dynamic route file, but I'll implement DELETE in its own route file later if needed.

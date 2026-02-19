import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { clockOut, getClockInStatus } from '@/lib/services/autoClockService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/clock-out
 * Manual clock-out
 */
// POST /api/clock-out
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user.employeId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const result = await clockOut(session.user.employeId);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                    message: result.message
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            pointage: result.pointage,
            hoursWorked: result.hoursWorked
        });

    } catch (error) {
        console.error('Error POST /api/clock-out:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}


/**
 * GET /api/clock-out
 * Get current clock-in status
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user.employeId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const status = await getClockInStatus(session.user.employeId);

        return NextResponse.json(status);

    } catch (error) {
        console.error('Error GET /api/clock-out:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

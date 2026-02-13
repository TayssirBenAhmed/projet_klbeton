import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/infrastructure/auth/authOptions';
import { autoClockIn } from '../../../lib/services/autoClockService';

/**
 * POST /api/clock-in
 * Clock-in from desktop (No GPS)
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user.employeId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const result = await autoClockIn(session.user.employeId);

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
            pointage: result.pointage
        });

    } catch (error) {
        console.error('Error POST /api/clock-in:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/infrastructure/auth/authOptions';
import prisma from '../../../lib/prisma';
import { isValidGPSAccuracy } from '../../../lib/services/geofenceService';

/**
 * POST /api/gps-tracking
 * Record GPS location for tracking history
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user.employeId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { latitude, longitude, accuracy } = await request.json();

        if (latitude === undefined || longitude === undefined) {
            return NextResponse.json(
                { error: 'Coordonnées GPS requises' },
                { status: 400 }
            );
        }

        // Validate accuracy (but don't reject - just log)
        const isAccurate = isValidGPSAccuracy(accuracy);

        const tracking = await prisma.gPSTracking.create({
            data: {
                employeId: session.user.employeId,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                accuracy: accuracy ? parseFloat(accuracy) : null
            }
        });

        return NextResponse.json({
            success: true,
            tracking,
            warning: !isAccurate ? 'Précision GPS faible' : null
        });

    } catch (error) {
        console.error('Error POST /api/gps-tracking:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/gps-tracking
 * Get GPS tracking history for employee(s)
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const employeId = searchParams.get('employeId');
        const limit = parseInt(searchParams.get('limit') || '100');
        const date = searchParams.get('date');

        // Build where clause
        const where = {};

        if (session.user.role === 'EMPLOYE') {
            // Employees can only see their own tracking
            where.employeId = session.user.employeId;
        } else if (employeId) {
            // Admins can filter by employee
            where.employeId = employeId;
        }

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);

            where.timestamp = {
                gte: startDate,
                lt: endDate
            };
        }

        const tracking = await prisma.gPSTracking.findMany({
            where,
            include: {
                employe: {
                    select: {
                        nom: true,
                        prenom: true,
                        poste: true
                    }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: limit
        });

        return NextResponse.json(tracking);

    } catch (error) {
        console.error('Error GET /api/gps-tracking:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

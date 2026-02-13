import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/infrastructure/auth/authOptions';
import prisma from '../../../../lib/prisma';
import { findMatchingGeofence } from '../../../../lib/services/geofenceService';

/**
 * POST /api/geofence/check
 * Check if GPS coordinates are within any active geofence
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { latitude, longitude, accuracy } = await request.json();

        if (latitude === undefined || longitude === undefined) {
            return NextResponse.json(
                { error: 'Latitude et longitude requis' },
                { status: 400 }
            );
        }

        // Validate GPS accuracy
        const { isValidGPSAccuracy } = await import('../../../../lib/services/geofenceService');
        if (accuracy !== undefined && !isValidGPSAccuracy(accuracy)) {
            return NextResponse.json({
                withinPerimeter: false,
                error: 'GPS_ACCURACY_LOW',
                message: `Précision GPS insuffisante (${accuracy}m).`
            }, { status: 400 });
        }

        // Get all active geofences
        const geofences = await prisma.geofence.findMany({
            where: { isActive: true }
        });

        if (geofences.length === 0) {
            return NextResponse.json({
                withinPerimeter: false,
                error: 'NO_GEOFENCE',
                message: 'Aucun périmètre configuré'
            });
        }

        // Check if within any geofence
        const result = findMatchingGeofence(latitude, longitude, geofences);

        if (!result) {
            return NextResponse.json({
                withinPerimeter: false,
                error: 'CALCULATION_ERROR',
                message: 'Erreur de calcul de position'
            });
        }

        return NextResponse.json({
            withinPerimeter: result.withinPerimeter || false,
            distance: result.distance || 0,
            geofence: result.withinPerimeter && result.geofence ? {
                id: result.geofence.id,
                nom: result.geofence.nom,
                radiusMeters: result.geofence.radiusMeters
            } : null,
            nearestGeofence: !result.withinPerimeter && result.geofence ? {
                nom: result.geofence.nom,
                distance: result.distance
            } : null
        });

    } catch (error) {
        console.error('Error POST /api/geofence/check:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

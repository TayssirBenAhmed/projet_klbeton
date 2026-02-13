import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/infrastructure/auth/authOptions';
import prisma from '../../../lib/prisma';

/**
 * GET /api/geofence
 * Get all geofences (active or all)
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('activeOnly') === 'true';

        const geofences = await prisma.geofence.findMany({
            where: activeOnly ? { isActive: true } : {},
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(geofences);
    } catch (error) {
        console.error('Error GET /api/geofence:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/geofence
 * Create a new geofence (admin only)
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const data = await request.json();
        const { nom, description, centerLat, centerLng, radiusMeters, isActive } = data;

        // Validation
        if (!nom || centerLat === undefined || centerLng === undefined) {
            return NextResponse.json(
                { error: 'Nom, latitude et longitude requis' },
                { status: 400 }
            );
        }

        if (centerLat < -90 || centerLat > 90 || centerLng < -180 || centerLng > 180) {
            return NextResponse.json(
                { error: 'Coordonnées GPS invalides' },
                { status: 400 }
            );
        }

        const geofence = await prisma.geofence.create({
            data: {
                nom,
                description,
                centerLat: parseFloat(centerLat),
                centerLng: parseFloat(centerLng),
                radiusMeters: radiusMeters ? parseInt(radiusMeters) : 200,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        return NextResponse.json(geofence, { status: 201 });
    } catch (error) {
        console.error('Error POST /api/geofence:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/geofence
 * Update a geofence (admin only)
 */
export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const data = await request.json();
        const { id, nom, description, centerLat, centerLng, radiusMeters, isActive } = data;

        if (!id) {
            return NextResponse.json({ error: 'ID requis' }, { status: 400 });
        }

        const geofence = await prisma.geofence.update({
            where: { id },
            data: {
                nom,
                description,
                centerLat: centerLat !== undefined ? parseFloat(centerLat) : undefined,
                centerLng: centerLng !== undefined ? parseFloat(centerLng) : undefined,
                radiusMeters: radiusMeters !== undefined ? parseInt(radiusMeters) : undefined,
                isActive
            }
        });

        return NextResponse.json(geofence);
    } catch (error) {
        console.error('Error PUT /api/geofence:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/geofence
 * Delete a geofence (admin only)
 */
export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID requis' }, { status: 400 });
        }

        await prisma.geofence.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Geofence supprimé' });
    } catch (error) {
        console.error('Error DELETE /api/geofence:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

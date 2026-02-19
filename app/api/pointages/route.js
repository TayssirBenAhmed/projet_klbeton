// Rebuild-Tag: 2026-02-07T13:55:00Z - STABLE_RELATIVE
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { obtenirPointages, creerPointage, supprimerPointage } from '@/lib/use-cases/pointage/creerPointage';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pointages
 * Récupère la liste des pointages avec filtres
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const employeId = searchParams.get('employeId');
        const dateDebut = searchParams.get('dateDebut');
        const dateFin = searchParams.get('dateFin');
        const statut = searchParams.get('statut');
        const mois = searchParams.get('mois');
        const annee = searchParams.get('annee');

        const filters = {};
        if (employeId) filters.employeId = employeId;
        if (dateDebut) filters.dateDebut = dateDebut;
        if (dateFin) filters.dateFin = dateFin;
        if (statut) filters.statut = statut;
        if (mois) filters.mois = parseInt(mois);
        if (annee) filters.annee = parseInt(annee);

        const pointages = await obtenirPointages(filters);

        return NextResponse.json(pointages);
    } catch (error) {
        console.error('Erreur GET /api/pointages:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/pointages
 * Crée un nouveau pointage
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !['ADMIN', 'CHEF'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const data = await request.json();

        // --- ENFORCEMENT OF MONTHLY LOCKING ---
        if (session.user.role !== 'ADMIN') {
            const targetDate = new Date(data.date);
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth(); // 0-indexed

            const targetYear = targetDate.getFullYear();
            const targetMonth = targetDate.getMonth();

            const isLocked = (targetYear < currentYear) || (targetYear === currentYear && targetMonth < currentMonth);

            if (isLocked) {
                return NextResponse.json(
                    { error: 'Impossible de modifier un mois déjà clôturé.' },
                    { status: 403 }
                );
            }
        }

        if (data.bulk && Array.isArray(data.pointages)) {
            const { creerPointagesEnMasse } = await import('@/lib/use-cases/pointage/creerPointage');
            const result = await creerPointagesEnMasse(data);
            return NextResponse.json(result, { status: 201 });
        }

        const pointage = await creerPointage(data);
        return NextResponse.json(pointage, { status: 201 });
    } catch (error) {
        console.error('Erreur POST /api/pointages:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/pointages
 * Met à jour un pointage existant
 */
export async function PATCH(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !['ADMIN', 'CHEF'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const { id, ...data } = await request.json();
        const pointage = await creerPointage(data, id);

        return NextResponse.json(pointage);
    } catch (error) {
        console.error('Erreur PATCH /api/pointages:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/pointages
 * Supprime un pointage
 */
export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !['ADMIN', 'CHEF'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        await supprimerPointage(id);

        return NextResponse.json({ message: 'Pointage supprimé' });
    } catch (error) {
        console.error('Erreur DELETE /api/pointages:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

// Rebuild-Tag: 2026-02-07T13:55:00Z - STABLE_RELATIVE
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/authOptions';
import { calculerRecapMensuel, calculerRecapMensuelTous } from '@/lib/use-cases/pointage/calculerRecapMensuel';

/**
 * GET /api/rapports
 * Génère un rapport récapitulatif
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const employeId = searchParams.get('employeId');
        const mois = parseInt(searchParams.get('mois') || new Date().getMonth() + 1);
        const annee = parseInt(searchParams.get('annee') || new Date().getFullYear());

        let rapport;

        if (employeId) {
            // Rapport pour un employé spécifique
            rapport = await calculerRecapMensuel(employeId, mois, annee);
        } else {
            // Rapport pour tous les employés
            rapport = await calculerRecapMensuelTous(mois, annee);
        }

        return NextResponse.json(rapport);
    } catch (error) {
        console.error('Erreur GET /api/rapports:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

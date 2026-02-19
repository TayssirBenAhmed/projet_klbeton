// Rebuild-Tag: 2026-02-07T13:55:00Z - STABLE_RELATIVE
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { obtenirEmploye, gererEmploye, supprimerEmploye } from '@/lib/use-cases/employe/gererEmploye';

export const dynamic = 'force-dynamic';

/**
 * GET /api/employes/[id]
 * Récupère un employé spécifique
 */
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { id } = await params;
        const employe = await obtenirEmploye(id);

        if (!employe) {
            return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 });
        }

        // Calculer les détails du salaire pour le mois en cours
        const { calculerRecapMensuel } = await import('@/lib/use-cases/pointage/calculerRecapMensuel');
        const mois = new Date().getMonth() + 1;
        const annee = new Date().getFullYear();

        try {
            const recap = await calculerRecapMensuel(id, mois, annee);
            return NextResponse.json({
                ...employe,
                recapMensuel: recap
            });
        } catch (e) {
            return NextResponse.json(employe);
        }
    } catch (error) {
        console.error('Erreur GET /api/employes/[id]:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/employes/[id]
 * Met à jour un employé
 */
export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !['ADMIN', 'CHEF'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const { id } = await params;
        const data = await request.json();
        const employe = await gererEmploye(data, id);

        return NextResponse.json(employe);
    } catch (error) {
        console.error('Erreur PATCH /api/employes/[id]:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/employes/[id]
 * Supprime un employé
 */
export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !['ADMIN', 'CHEF'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const { id } = await params;
        await supprimerEmploye(id);

        return NextResponse.json({ message: 'Employé supprimé' });
    } catch (error) {
        console.error('Erreur DELETE /api/employes/[id]:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

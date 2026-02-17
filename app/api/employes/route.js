// Rebuild-Tag: 2026-02-07T13:55:00Z - STABLE_RELATIVE
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/authOptions';
import { obtenirEmployes, gererEmploye } from '@/lib/use-cases/employe/gererEmploye';

export const dynamic = 'force-dynamic';

/**
 * GET /api/employes
 * Récupère la liste des employés
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const statut = searchParams.get('statut');
        const search = searchParams.get('search');
        const includeStats = searchParams.get('includeStats') === 'true';

        let employes = await obtenirEmployes({ statut, search });

        if (includeStats) {
            const { calculerRecapMensuel } = await import('@/lib/use-cases/pointage/calculerRecapMensuel');
            const mois = new Date().getMonth() + 1;
            const annee = new Date().getFullYear();

            employes = await Promise.all(employes.map(async (emp) => {
                try {
                    const recap = await calculerRecapMensuel(emp.id, mois, annee);
                    return {
                        ...emp,
                        statsMensuelles: {
                            presence: recap.pointages.presence,
                            heuresSupp: recap.pointages.heuresSupp,
                            salaireNet: recap.salaire.salaireNet
                        }
                    };
                } catch (e) {
                    return {
                        ...emp,
                        statsMensuelles: { presence: 0, heuresSupp: 0, salaireNet: emp.salaireBase }
                    };
                }
            }));
        }

        return NextResponse.json(employes);
    } catch (error) {
        console.error('Erreur GET /api/employes:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/employes
 * Crée un nouvel employé
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !['ADMIN', 'CHEF'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const data = await request.json();
        // L'Admin peut créer des Employés ou des Chefs
        const dataToSave = { ...data };
        if (!dataToSave.role) dataToSave.role = 'EMPLOYE';
        const employe = await gererEmploye(dataToSave);

        return NextResponse.json(employe, { status: 201 });
    } catch (error) {
        console.error('Erreur POST /api/employes:', error);
        return NextResponse.json(
            {
                error: 'Erreur serveur',
                details: error.message
            },
            { status: 500 }
        );
    }
}

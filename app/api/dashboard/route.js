import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/authOptions';
import prisma from '@/lib/prisma';
import { calculerJoursOuvrables } from '@/lib/services/calculJoursService';

/**
 * GET /api/dashboard
 * Récupère les statistiques du dashboard
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const maintenant = new Date();
        const anneeActuelle = maintenant.getFullYear();
        const moisActuel = maintenant.getMonth() + 1;
        const aujourdhui = new Date(Date.UTC(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate()));

        // Total employés actifs
        const totalEmployes = await prisma.employe.count({
            where: { statut: 'ACTIF' },
        });

        // Pointages du jour
        const pointagesAujourdhui = await prisma.pointage.findMany({
            where: {
                date: {
                    gte: aujourdhui,
                    lt: new Date(aujourdhui.getTime() + 24 * 60 * 60 * 1000)
                }
            },
            include: {
                employe: { select: { nom: true, prenom: true } },
            },
        });

        // Taux de présence du mois
        const { ouvrables } = calculerJoursOuvrables(moisActuel, anneeActuelle);
        const debutMois = new Date(Date.UTC(anneeActuelle, moisActuel - 1, 1));
        const finMois = new Date(Date.UTC(anneeActuelle, moisActuel, 0, 23, 59, 59));

        const pointagesMois = await prisma.pointage.findMany({
            where: {
                date: { gte: debutMois, lte: finMois },
            },
        });

        const joursPresentsMois = pointagesMois
            .filter(p => p.statut === 'PRESENT' || p.statut === 'FERIE')
            .reduce((sum, p) => sum + p.joursTravailles, 0);

        const capaciteTotale = ouvrables * totalEmployes;
        const tauxPresenceMois = capaciteTotale > 0 ? Math.round((joursPresentsMois / capaciteTotale) * 100) : 0;
        const totalHeuresSupp = pointagesMois.reduce((sum, p) => sum + p.heuresSupp, 0);

        // 1. DOUGHNUT DATA (Aujourd'hui)
        const repartitionAujourdhui = {
            PRESENT: pointagesAujourdhui.filter(p => p.statut === 'PRESENT').length,
            ABSENT: pointagesAujourdhui.filter(p => p.statut === 'ABSENT').length,
            CONGE: pointagesAujourdhui.filter(p => p.statut === 'CONGE').length,
            MALADIE: pointagesAujourdhui.filter(p => p.statut === 'MALADIE').length,
            FERIE: pointagesAujourdhui.filter(p => p.statut === 'FERIE').length,
        };

        // 2. BAR CHART DATA (Avances du mois - Evolution par semaine)
        const advancesByWeek = [];
        for (let i = 0; i < 4; i++) {
            const start = new Date(debutMois.getTime() + i * 7 * 24 * 60 * 60 * 1000);
            const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
            const sum = await prisma.avance.aggregate({
                where: { date: { gte: start, lt: end } },
                _sum: { montant: true }
            });
            advancesByWeek.push({ week: `Semaine ${i + 1}`, total: sum._sum.montant || 0 });
        }

        const hsWeeklyByEmployee = [];
        const employesAvecHS = await prisma.employe.findMany({
            where: { pointages: { some: { date: { gte: debutMois, lte: finMois }, heuresSupp: { gt: 0 } } } },
            select: { id: true, nom: true, prenom: true }
        });

        for (const emp of employesAvecHS) {
            const weeklyData = [];
            for (let i = 0; i < 4; i++) {
                const start = new Date(debutMois.getTime() + i * 7 * 24 * 60 * 60 * 1000);
                const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
                const sum = await prisma.pointage.aggregate({
                    where: {
                        employeId: emp.id,
                        date: { gte: start, lt: end }
                    },
                    _sum: { heuresSupp: true }
                });
                weeklyData.push(sum._sum.heuresSupp || 0);
            }
            hsWeeklyByEmployee.push({
                name: `${emp.nom} ${emp.prenom}`,
                data: weeklyData
            });
        }

        const hsByEmployee = hsWeeklyByEmployee.map(h => ({
            name: h.name,
            total: h.data.reduce((a, b) => a + b, 0)
        }))
            .filter(e => e.total >= 1)
            .sort((a, b) => b.total - a.total);

        // 4. TOTAL AVANCES (Mensuel)
        const resultAvances = await prisma.avance.aggregate({
            where: {
                date: { gte: debutMois, lte: finMois },
            },
            _sum: { montant: true },
        });

        // 5. ABSENCES ET PRÉSENCES DU JOUR (Détails pour les listes)
        const absencesJour = pointagesAujourdhui
            .filter(p => p.statut === 'ABSENT' || p.statut === 'MALADIE')
            .map(p => ({
                nom: p.employe.nom,
                prenom: p.employe.prenom,
                statut: p.statut
            }));

        // Nouveau: Derniers Pointages (Temps Réel) - Les 5 derniers modifiés
        const derniersPointages = await prisma.pointage.findMany({
            where: {
                date: {
                    gte: aujourdhui,
                    lt: new Date(aujourdhui.getTime() + 24 * 60 * 60 * 1000)
                }
            },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            include: {
                employe: { select: { nom: true, prenom: true, photo: true, poste: true } }
            }
        });

        const presencesJour = derniersPointages.map(p => ({
            id: p.id,
            nom: p.employe.nom,
            prenom: p.employe.prenom,
            photo: p.employe.photo,
            poste: p.employe.poste,
            statut: p.statut,
            heureValidation: p.updatedAt
        }));

        return NextResponse.json({
            stats: {
                tauxPresenceJour: tauxPresenceMois,
                totalEmployes,
                totalHeuresSupp,
                totalAvances: resultAvances._sum.montant || 0,
            },
            repartitionAujourdhui,
            advancesByWeek,
            hsByEmployee,
            hsWeeklyByEmployee,
            absencesJour,
            presencesJour,
            isJournalValide: pointagesAujourdhui.length >= totalEmployes && totalEmployes > 0
        });
    } catch (error) {
        console.error('Erreur GET /api/dashboard:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

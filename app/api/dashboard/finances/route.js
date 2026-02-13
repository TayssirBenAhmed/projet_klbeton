import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/authOptions';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'CHEF'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-indexed

        // Use UTC dates to match PostgreSQL storage
        const firstDay = new Date(Date.UTC(year, month, 1));
        const lastDay = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

        // Fetch ALL avances (no date filter) to avoid timezone mismatch issues
        // We'll filter client-side for the monthly chart
        const [employes, avances] = await Promise.all([
            prisma.employe.findMany({ where: { statut: 'ACTIF' } }),
            prisma.avance.findMany({
                include: { employe: true },
                orderBy: { date: 'desc' }
            })
        ]);

        // Debug log to server console

        // Monthly avances (for chart only)
        const monthlyAvances = avances.filter(a => {
            const d = new Date(a.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });

        // Stats - use ALL avances for pending count, monthly for approved total
        const approvedAvances = monthlyAvances.filter(a => a.statut === 'APPROVED');
        const pendingAvances = avances.filter(a => a.statut === 'PENDING');

        const totalApproved = approvedAvances.reduce((sum, a) => sum + a.montant, 0);
        const totalPending = pendingAvances.reduce((sum, a) => sum + a.montant, 0);

        // Net salary computation (wrapped in try-catch to not break the whole API)
        let totalResteAPayer = 0;
        let totalDetteMois = 0;
        try {
            const { calculerSalaire } = await import('@/lib/services/recapGenerator');
            const pointages = await prisma.pointage.findMany({
                where: { date: { gte: firstDay, lte: lastDay } }
            });

            employes.forEach(emp => {
                const empPointages = pointages.filter(p => p.employeId === emp.id);
                const empAvances = avances.filter(a => a.employeId === emp.id);
                const calcul = calculerSalaire(emp, empPointages, month + 1, year, empAvances);
                totalResteAPayer += calcul.salaireNet;
                totalDetteMois += calcul.resteARembourser;
            });
        } catch (calcErr) {
            console.error('[Finance API] Erreur calcul salaire:', calcErr.message);
        }

        // Weekly chart data — sum of APPROVED advances per week of current month
        const weeklyChart = [];
        for (let i = 0; i < 4; i++) {
            const weekStart = new Date(firstDay.getTime() + i * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            const weekTotal = approvedAvances
                .filter(a => {
                    const d = new Date(a.date);
                    return d >= weekStart && d < weekEnd;
                })
                .reduce((sum, a) => sum + a.montant, 0);
            weeklyChart.push({ week: `Sem ${i + 1}`, total: weekTotal });
        }

        return NextResponse.json({
            stats: {
                totalAvancesApproved: totalApproved,
                totalAvancesPending: totalPending,
                resteAPayerMois: totalResteAPayer,
                totalDetteMois: totalDetteMois
            },
            avances: avances.map(a => ({
                id: a.id,
                montant: a.montant,
                date: a.date,
                statut: a.statut,
                note: a.note || '',
                employe: {
                    nom: a.employe.nom,
                    prenom: a.employe.prenom
                }
            })),
            weeklyChart
        });
    } catch (error) {
        console.error('[Finance API] Erreur:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

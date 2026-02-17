import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/authOptions';
import prisma from '@/lib/prisma';
import { calculerJoursOuvrables, calculerJoursOuvrablesPartiel } from '@/lib/services/calculJoursService';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // 1. Determine Target Date & Period
        // If 'date' is provided, we view the state *as of* that date (Archive + Cumulative).
        // If 'month/year' is provided without specific date, we view the full month (Standard).
        // BUT user asked to "Ajouter un calendrier... Si l'Admin sélectionne le 10 Février...".
        // So we prioritized the exact date.

        let targetDate;
        const dateParam = searchParams.get('date');

        if (dateParam) {
            targetDate = new Date(dateParam);
        } else {
            targetDate = new Date(); // Default to Now
        }

        // Validate date
        if (isNaN(targetDate.getTime())) targetDate = new Date();

        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1; // 1-12

        // Start of the month (always 1st)
        const debutMois = new Date(Date.UTC(year, month - 1, 1));

        // End of the selected day (for cumulative calculations)
        // We use local info from targetDate to set UTC bounds correctly if we stick to UTC storage, 
        // but prisma usually handles Dates as ISO. 
        // Let's ensure we cover the full day of targetDate.
        const finPeriode = new Date(targetDate);
        finPeriode.setHours(23, 59, 59, 999);

        // For "State of the Day" (specific day only)
        const debutJour = new Date(targetDate);
        debutJour.setHours(0, 0, 0, 0);
        const finJour = new Date(targetDate);
        finJour.setHours(23, 59, 59, 999);

        // 2. Global Stats (Cumulative from 1st to targetDate)
        const totalEmployes = await prisma.employe.count({ where: { statut: 'ACTIF' } });

        const pointagesCumul = await prisma.pointage.findMany({
            where: { date: { gte: debutMois, lte: finPeriode } }
        });

        // Calculate capacity only up to targetDate
        const { ouvrables } = calculerJoursOuvrablesPartiel(targetDate);
        const capaciteTotale = ouvrables * totalEmployes;

        const joursPresentsCumul = pointagesCumul
            .filter(p => p.statut === 'PRESENT' || p.statut === 'FERIE') // FERIE often counts as paid/present in some stats, but technically 'tauxPresence' usually means physically there? 
            // Previous logic: filter(p => p.statut === 'PRESENT' || p.statut === 'FERIE')
            .reduce((sum, p) => sum + (p.joursTravailles || 0), 0);

        const tauxPresence = capaciteTotale > 0 ? Math.round((joursPresentsCumul / capaciteTotale) * 100) : 0;
        const totalHeuresSupp = pointagesCumul.reduce((sum, p) => sum + (p.heuresSupp || 0), 0);

        const resultAvances = await prisma.avance.aggregate({
            where: { date: { gte: debutMois, lte: finPeriode }, statut: 'APPROVED' },
            _sum: { montant: true }
        });

        // 3. Weekly Charts Data (Up to 'finPeriode')
        const advancesByWeek = [];
        const hsWeeklyByEmployee = [];

        // We still iterate 4 weeks but stop if start > finPeriode ? 
        // Or just query and if partial week, so be it.
        // User said: "Si on change pour le 05/02, on ne voit que le cumul du 1er au 5."
        // Meaning the graph should probably cut off or show flat/empty for future dates.

        for (let i = 0; i < 4; i++) {
            const start = new Date(debutMois.getTime() + i * 7 * 24 * 60 * 60 * 1000);
            const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

            // If the week starts after our target period, no need to show data (or show 0)
            // But usually graphs show the structure. We'll show 0.
            if (start > finPeriode) {
                advancesByWeek.push({ week: `Sem. ${i + 1}`, total: 0 });
                continue;
            }

            // Determine actual end of this week chunk (cap at finPeriode)
            const effectiveEnd = end > finPeriode ? finPeriode : end;
            // Note: 'end' in loop is exclusive for next iteration start, but here we query ranges.
            // Prisma gte/lt is good.

            // If starts before finPeriode but ends after, we clip? 
            // Actually, querying date <= finPeriode inside the filter is enough.

            await prisma.avance.aggregate({
                where: {
                    date: { gte: start, lt: end },
                    statut: 'APPROVED',
                    // KEY: also cap by global finPeriode
                    date: { lte: finPeriode }
                },
                _sum: { montant: true }
            }).then(res => advancesByWeek.push({ week: `Sem. ${i + 1}`, total: res._sum.montant || 0 }));
        }

        // HS Evolution
        const topEmployesHS = await prisma.employe.findMany({
            where: { pointages: { some: { date: { gte: debutMois, lte: finPeriode }, heuresSupp: { gt: 0 } } } },
            select: { id: true, nom: true, prenom: true },
            take: 10
        });

        for (const emp of topEmployesHS) {
            const weeklyHS = [];
            for (let i = 0; i < 4; i++) {
                const start = new Date(debutMois.getTime() + i * 7 * 24 * 60 * 60 * 1000);
                const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

                if (start > finPeriode) {
                    weeklyHS.push(0);
                    continue;
                }

                const sum = pointagesCumul
                    .filter(p =>
                        p.employeId === emp.id &&
                        p.date >= start &&
                        p.date < end &&
                        p.date <= finPeriode // Cap
                    )
                    .reduce((sum, p) => sum + p.heuresSupp, 0);
                weeklyHS.push(sum);
            }
            hsWeeklyByEmployee.push({ name: `${emp.nom} ${emp.prenom}`, data: weeklyHS });
        }

        // 4. State of the Day (Target Date Only)
        // pointagesJour: date within [debutJour, finJour]
        const pointagesJour = await prisma.pointage.findMany({
            where: { date: { gte: debutJour, lte: finJour } },
            include: { employe: { select: { nom: true, prenom: true } } }
        });

        // For "isJournalValide", we check if we have enough pointages or if they are validated?
        // Logic in previous code: pointagesToday.length >= totalEmployes.
        // We stick to this heuristic.
        const isJournalValide = pointagesJour.length >= totalEmployes && totalEmployes > 0;

        const repartitionAujourdhui = {
            PRESENT: pointagesJour.filter(p => p.statut === 'PRESENT').length,
            ABSENT: pointagesJour.filter(p => p.statut === 'ABSENT').length,
            CONGE: pointagesJour.filter(p => p.statut === 'CONGE').length,
            MALADIE: pointagesJour.filter(p => p.statut === 'MALADIE').length,
            FERIE: pointagesJour.filter(p => p.statut === 'FERIE').length,
        };

        const absencesJour = pointagesJour
            .filter(p => p.statut === 'ABSENT' || p.statut === 'MALADIE')
            .map(p => ({ nom: p.employe.nom, prenom: p.employe.prenom, statut: p.statut }));

        const presencesJour = pointagesJour.slice(0, 10).map(p => ({
            nom: p.employe.nom,
            prenom: p.employe.prenom,
            statut: p.statut,
            heureValidation: p.updatedAt
        }));

        return NextResponse.json({
            stats: {
                tauxPresenceJour: tauxPresence,
                totalEmployes,
                totalHeuresSupp,
                totalAvances: resultAvances._sum.montant || 0,
            },
            repartitionAujourdhui,
            advancesByWeek,
            hsWeeklyByEmployee,
            absencesJour,
            presencesJour,
            isJournalValide,
            month,
            year,
            selectedDate: targetDate.toISOString(),
            dateStart: debutMois.toISOString(),
            dateEnd: finPeriode.toISOString()
        });

    } catch (error) {
        console.error('[API Stats] Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/authOptions';
import prisma from '@/lib/prisma';
import { getClockInStatus } from '@/lib/services/autoClockService';
import { calculerRecapMensuel } from '@/lib/use-cases/pointage/calculerRecapMensuel';

/**
 * GET /api/employee/dashboard
 * Aggregates all data for the employee dashboard
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user.employeId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const employeId = session.user.employeId;
        const maintenant = new Date();
        const mois = maintenant.getMonth() + 1;
        const annee = maintenant.getFullYear();

        // 1. Employee Details & Balances
        const employe = await prisma.employe.findUnique({
            where: { id: employeId },
            include: {
                user: {
                    select: { email: true }
                }
            }
        });

        // 2. Clock Status
        const clockStatus = await getClockInStatus(employeId);

        // 3. Monthly Recap (Salary, presence, hours supp)
        const recapMensuel = await calculerRecapMensuel(employeId, mois, annee);

        // 4. Pointages du mois (Calendar)
        const debutMois = new Date(Date.UTC(annee, mois - 1, 1));
        const finMois = new Date(Date.UTC(annee, mois, 0, 23, 59, 59));

        const pointagesMois = await prisma.pointage.findMany({
            where: {
                employeId,
                date: { gte: debutMois, lte: finMois }
            },
            orderBy: { date: 'asc' }
        });

        // 5. Avances du mois
        const avances = await prisma.avance.findMany({
            where: {
                employeId,
                date: { gte: debutMois, lte: finMois }
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json({
            employe,
            clockStatus,
            recapMensuel,
            pointagesMois,
            avances
        });

    } catch (error) {
        console.error('Error GET /api/employee/dashboard:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

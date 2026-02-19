import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE /api/employes/delete-all - Delete all employees with cascade (ADMIN only)
export async function DELETE(request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        // Check admin role
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Accès refusé - Réservé aux administrateurs' }, { status: 403 });
        }

        // Get confirmation text from request body for extra safety
        const body = await request.json().catch(() => ({}));
        const { confirmation } = body;

        if (confirmation !== 'SUPPRIMER') {
            return NextResponse.json({ 
                error: 'Confirmation invalide - Vous devez taper "SUPPRIMER" pour confirmer' 
            }, { status: 400 });
        }

        // Execute cascade delete in correct order to respect foreign keys
        // 1. Delete all Pointages (attendance records)
        const deletedPointages = await prisma.pointage.deleteMany({});
        
        // 2. Delete all Avances (advances)
        const deletedAvances = await prisma.avance.deleteMany({});
        
        // 3. Delete all Employes (employees)
        const deletedEmployes = await prisma.employe.deleteMany({});
        
        // 4. Delete all Users with role EMPLOYEE or CHEF (not ADMIN)
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                role: {
                    in: ['EMPLOYEE', 'CHEF']
                }
            }
        });

        console.log('🗑️ Suppression globale effectuée:', {
            employes: deletedEmployes.count,
            pointages: deletedPointages.count,
            avances: deletedAvances.count,
            users: deletedUsers.count
        });

        return NextResponse.json({
            success: true,
            message: 'Tous les employés et leurs données associées ont été supprimés',
            deleted: {
                employes: deletedEmployes.count,
                pointages: deletedPointages.count,
                avances: deletedAvances.count,
                users: deletedUsers.count
            }
        });

    } catch (error) {
        console.error('Erreur suppression globale:', error);
        return NextResponse.json({
            error: 'Erreur lors de la suppression',
            details: error.message
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pointages/validate-chef
 * 
 * Marque les pointages d'une journée comme "validés par le Chef"
 * et envoie une notification à l'Admin.
 * 
 * Body: { date: string, chefId: string, validatedAt: string }
 */
export async function POST(request) {
    try {
        // Vérifier l'authentification
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        // Vérifier le rôle CHEF
        if (session.user.role !== 'CHEF') {
            return NextResponse.json({ error: 'Accès refusé - Réservé aux Chefs' }, { status: 403 });
        }

        const { date, chefId, validatedAt } = await request.json();

        if (!date) {
            return NextResponse.json({ error: 'Date requise' }, { status: 400 });
        }

        // Mettre à jour tous les pointages de cette date avec le statut de validation Chef
        const result = await prisma.pointage.updateMany({
            where: {
                date: {
                    startsWith: date
                }
            },
            data: {
                valideParChef: true,
                dateValidationChef: new Date(validatedAt),
                chefValidateurId: chefId
            }
        });

        // Créer une notification pour l'Admin
        const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Trouver l'admin
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            select: { id: true }
        });

        if (admin) {
            // Créer un message système pour l'admin
            await prisma.message.create({
                data: {
                    senderId: chefId,
                    receiverId: admin.id,
                    subject: 'Validation Chef - Pointages du ' + formattedDate,
                    content: `Le Chef de chantier a terminé le contrôle du ${formattedDate}. La saisie a été vérifiée et est prête pour votre validation finale.`,
                    isRead: false,
                    isSystemMessage: true
                }
            });
        }

        console.log('✅ Validation Chef enregistrée:', {
            date,
            chefId,
            pointagesMisAJour: result.count
        });

        return NextResponse.json({
            success: true,
            message: 'Pointages validés par le Chef',
            pointagesUpdated: result.count,
            date: formattedDate
        });

    } catch (error) {
        console.error('Erreur validation Chef:', error);
        return NextResponse.json({
            error: 'Erreur lors de la validation',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * GET /api/pointages/validate-chef
 * 
 * Vérifie si les pointages d'une date ont été validés par le Chef
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ error: 'Date requise' }, { status: 400 });
        }

        // Vérifier s'il existe des pointages validés par le Chef pour cette date
        const pointagesValides = await prisma.pointage.findFirst({
            where: {
                date: {
                    startsWith: date
                },
                valideParChef: true
            },
            select: {
                valideParChef: true,
                dateValidationChef: true,
                chefValidateurId: true
            }
        });

        return NextResponse.json({
            isValidated: !!pointagesValides,
            validatedAt: pointagesValides?.dateValidationChef || null,
            chefId: pointagesValides?.chefValidateurId || null
        });

    } catch (error) {
        console.error('Erreur vérification validation:', error);
        return NextResponse.json({
            error: 'Erreur lors de la vérification',
            details: error.message
        }, { status: 500 });
    }
}

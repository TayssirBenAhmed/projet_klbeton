import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '../../../lib/prisma';

export async function POST(request) {
    try {
        const { email, password, nom, prenom } = await request.json();

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Cet email est déjà utilisé' },
                { status: 400 }
            );
        }

        // Hasher le mot de passe
        const hashedPassword = await hash(password, 10);

        // Créer l'utilisateur admin avec employé associé
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'ADMIN',
                employe: {
                    create: {
                        nom,
                        prenom,
                        poste: 'Administrateur',
                        dateEmbauche: new Date(),
                        salaireBase: 0,
                        statut: 'ACTIF',
                    },
                },
            },
            include: {
                employe: true,
            },
        });

        return NextResponse.json({
            message: 'Compte créé avec succès',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Erreur inscription:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'inscription', details: error.message },
            { status: 500 }
        );
    }
}

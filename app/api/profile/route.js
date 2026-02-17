// Rebuild-Tag: 2026-02-07T13:55:00Z - STABLE_RELATIVE
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { hash, compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/infrastructure/auth/authOptions';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/profile
 * Mise à jour du mot de passe ou de la double authentification
 */
export async function PATCH(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const data = await request.json();
        const { currentPassword, newPassword, toggle2FA } = data;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        // Cas 1 : Changement de mot de passe
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Mot de passe actuel requis' }, { status: 400 });
            }

            const isPasswordValid = await compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
            }

            const hashedNewPassword = await hash(newPassword, 10);
            await prisma.user.update({
                where: { id: session.user.id },
                data: { password: hashedNewPassword },
            });

            return NextResponse.json({ message: 'Mot de passe mis à jour avec succès' });
        }

        // Cas 2 : Bascule 2FA
        if (toggle2FA !== undefined) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { twoFactorEnabled: toggle2FA },
            });

            return NextResponse.json({
                message: toggle2FA ? 'Double authentification activée' : 'Double authentification désactivée',
                twoFactorEnabled: toggle2FA
            });
        }

        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });

    } catch (error) {
        console.error('Erreur PATCH /api/profile:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    }
}

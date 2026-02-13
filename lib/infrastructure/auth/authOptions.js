import { compare } from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '../../prisma';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Mot de passe', type: 'password' },
            },
            async authorize(credentials) {

                if (!credentials?.email || !credentials?.password) {
                    console.error('❌ Missing credentials');
                    throw new Error('Email et mot de passe requis');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { employe: true },
                });


                if (!user) {
                    console.error('❌ User not found in DB');
                    throw new Error('Aucun utilisateur trouvé');
                }

                const isValid = await compare(credentials.password, user.password);

                if (!isValid) {
                    console.error('❌ Invalid password');
                    throw new Error('Mot de passe incorrect');
                }


                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    employeId: user.employe?.id || null,
                    nom: user.employe?.nom || '',
                    prenom: user.employe?.prenom || '',
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.employeId = user.employeId;
                token.nom = user.nom;
                token.prenom = user.prenom;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.employeId = token.employeId;
                session.user.nom = token.nom;
                session.user.prenom = token.prenom;
            }
            return session;
        },
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 jours
    },
    secret: process.env.NEXTAUTH_SECRET || 'your-super-secret-key-change-this-in-production',
    debug: true,
};

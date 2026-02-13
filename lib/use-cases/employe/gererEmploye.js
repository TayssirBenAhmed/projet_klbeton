import prisma from '../../prisma';
import { hash } from 'bcryptjs';

/**
 * Use case: Créer ou mettre à jour un employé
 * @param {Object} data - Données de l'employé
 * @param {string|null} id - ID de l'employé (null pour création)
 * @returns {Promise<Object>} Employé créé/mis à jour
 */
export async function gererEmploye(data, id = null) {
    const {
        nom = '',
        prenom = '',
        email,
        password,
        photo,
        poste = '',
        dateEmbauche,
        salaireBase,
        statut,
        soldeConges,
        soldeMaladie,
        role = 'EMPLOYE',
        employeeId, // Matricule
    } = data;

    // Helper to safely parse float
    const safeParse = (val, fallback = 0) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? fallback : parsed;
    };

    // Helper to safely parse date
    const safeDate = (val) => {
        const d = new Date(val);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    // Mise à jour
    if (id) {
        const updateData = {
            nom: (nom || '').toUpperCase(),
            prenom: prenom || '',
            photo,
            poste: poste || '',
            employeeId: employeeId || null,
            dateEmbauche: safeDate(dateEmbauche),
            salaireBase: safeParse(salaireBase),
            statut: statut || 'ACTIF',
            soldeConges: safeParse(soldeConges, 18),
            soldeMaladie: safeParse(soldeMaladie, 10),
        };

        // Si l'employé a un compte utilisateur et on change l'email
        if (email) {
            const employe = await prisma.employe.findUnique({
                where: { id },
                include: { user: true },
            });

            if (employe?.userId) {
                await prisma.user.update({
                    where: { id: employe.userId },
                    data: { email },
                });
            }
        }

        return await prisma.employe.update({
            where: { id },
            data: updateData,
            include: { user: true },
        });
    }

    // Création
    const cleanPrenom = (prenom || 'Nouveau').toLowerCase().replace(/\s/g, '');
    const cleanNom = (nom || 'Employe').toLowerCase().replace(/\s/g, '');
    const generatedEmail = email || `${cleanPrenom}.${cleanNom}@klbeton.tn`;

    // Check if email already exists to avoid 500
    const existingUser = await prisma.user.findUnique({ where: { email: generatedEmail } });
    const finalEmail = existingUser ? `${cleanPrenom}.${cleanNom}.${Date.now().toString().slice(-4)}@klbeton.tn` : generatedEmail;

    const finalPassword = password || 'password123';
    const hashedPassword = await hash(finalPassword, 10);

    return await prisma.employe.create({
        data: {
            nom: (nom || 'INCONNU').toUpperCase(),
            prenom: prenom || 'Inconnu',
            photo,
            poste: poste || 'Ouvrier',
            employeeId: employeeId || null, // Allow null if empty
            dateEmbauche: safeDate(dateEmbauche),
            salaireBase: safeParse(salaireBase),
            statut: statut || 'ACTIF',
            soldeConges: safeParse(soldeConges, 18),
            soldeMaladie: safeParse(soldeMaladie, 10),
            user: {
                create: {
                    email: finalEmail,
                    password: hashedPassword,
                    role: role || 'EMPLOYE',
                },
            },
        },
        include: { user: true },
    });
}

/**
 * Use case: Obtenir tous les employés
 * @param {Object} filters - Filtres optionnels
 * @returns {Promise<Array>} Liste des employés
 */
export async function obtenirEmployes(filters = {}) {
    const { statut, search } = filters;

    const where = {};

    if (statut) {
        where.statut = statut;
    }

    if (search) {
        where.OR = [
            { nom: { contains: search, mode: 'insensitive' } },
            { prenom: { contains: search, mode: 'insensitive' } },
            { poste: { contains: search, mode: 'insensitive' } },
        ];
    }

    return await prisma.employe.findMany({
        where,
        include: {
            user: {
                select: {
                    email: true,
                    role: true,
                },
            },
            pointages: {
                take: 1,
                orderBy: { date: 'desc' },
            },
        },
        orderBy: [
            { nom: 'asc' },
            { prenom: 'asc' },
        ],
    });
}

/**
 * Use case: Obtenir un employé par ID
 * @param {string} id - ID de l'employé
 * @returns {Promise<Object|null>} Employé
 */
export async function obtenirEmploye(id) {
    return await prisma.employe.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    email: true,
                    role: true,
                },
            },
            pointages: {
                take: 30,
                orderBy: { date: 'desc' },
            },
        },
    });
}

/**
 * Use case: Supprimer un employé
 * @param {string} id - ID de l'employé
 * @returns {Promise<Object>} Employé supprimé
 */
export async function supprimerEmploye(id) {
    const employe = await prisma.employe.findUnique({
        where: { id },
    });

    if (employe?.userId) {
        // Supprimer l'utilisateur d'abord car Employe en dépend (cascade logic)
        // Ou supprimer les deux dans une transaction
        return await prisma.$transaction([
            prisma.pointage.deleteMany({ where: { employeId: id } }),
            prisma.employe.delete({ where: { id } }),
            prisma.user.delete({ where: { id: employe.userId } }),
        ]);
    }

    return await prisma.employe.delete({
        where: { id },
    });
}

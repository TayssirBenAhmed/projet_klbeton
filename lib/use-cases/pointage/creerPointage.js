import prisma from '../../prisma';
import { estDimanche } from '../../services/dimancheCalculator';
import { estJourFerie } from '../../../constants/joursFeries';

/**
 * Use case: Créer ou mettre à jour un pointage
 * @param {Object} data - Données du pointage
 * @param {string|null} id - ID du pointage (null pour création)
 * @returns {Promise<Object>} Pointage créé/mis à jour
 */
export async function creerPointage(data, id = null) {
    const {
        employeId,
        date,
        statut,
        heuresSupp = 0,
        joursTravailles = 1,
        notes,
    } = data;

    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    const pointageDate = normalizedDate;

    // Validation: vérifier si c'est un dimanche
    // MODIFICATION: Dimanche autorisé (compté en HS selon Option B)
    // if (estDimanche(pointageDate) && statut === 'PRESENT') {
    //    throw new Error('Impossible de marquer une présence un dimanche');
    // }

    // Auto-détection jour férié
    let finalStatut = statut;
    if (estJourFerie(pointageDate) && statut === 'PRESENT') {
        finalStatut = 'FERIE';
    }

    // RÈGLE : Si ABSENT, force 0 jours et 0 heures supp
    let finalJoursTravailles = parseFloat(joursTravailles);
    let finalHeuresSupp = parseFloat(heuresSupp);

    if (finalStatut === 'ABSENT') {
        finalJoursTravailles = 0;
        finalHeuresSupp = 0;
    }

    const pointageData = {
        employeId,
        date: pointageDate,
        statut: finalStatut,
        heuresSupp: finalHeuresSupp,
        joursTravailles: finalJoursTravailles,
        notes,
    };

    // Mise à jour des soldes de congés/maladie (version atomique)
    if (statut === 'CONGE' || statut === 'MALADIE') {
        const field = statut === 'CONGE' ? 'soldeConges' : 'soldeMaladie';
        await prisma.employe.update({
            where: { id: employeId },
            data: { [field]: { decrement: finalJoursTravailles } },
        });
    }

    // Mise à jour
    if (id) {
        return await prisma.pointage.update({
            where: { id },
            data: pointageData,
            include: {
                employe: {
                    select: {
                        nom: true,
                        prenom: true,
                        poste: true,
                    },
                },
            },
        });
    }

    // Création (avec gestion des doublons)
    return await prisma.pointage.upsert({
        where: {
            employeId_date: {
                employeId,
                date: pointageDate,
            },
        },
        update: pointageData,
        create: pointageData,
        include: {
            employe: {
                select: {
                    nom: true,
                    prenom: true,
                    poste: true,
                },
            },
        },
    });
}

/**
 * Use case: Créer des pointages en masse
 * @param {Object} data - Objet contenant la date et le tableau de pointages
 * @returns {Promise<Array>} Liste des pointages créés
 */
export async function creerPointagesEnMasse(data) {
    const { date, pointages } = data;

    // Utiliser une transaction pour tout créer d'un coup
    return await prisma.$transaction(
        pointages.map((p) => {
            const normalizedDate = new Date(date);
            normalizedDate.setUTCHours(0, 0, 0, 0);

            // Appliquer les mêmes règles que pour un pointage individuel
            let finalStatut = p.statut;
            if (estJourFerie(normalizedDate) && p.statut === 'PRESENT') {
                finalStatut = 'FERIE';
            }

            let finalJoursTravailles = parseFloat(p.joursTravailles || 0);
            let finalHeuresSupp = parseFloat(p.heuresSupp || 0);

            if (finalStatut === 'ABSENT') {
                finalJoursTravailles = 0;
                finalHeuresSupp = 0;
            }

            const pointageData = {
                employeId: p.employeId,
                date: normalizedDate,
                statut: finalStatut,
                heuresSupp: finalHeuresSupp,
                joursTravailles: finalJoursTravailles,
                notes: p.notes || 'Pointage en masse',
            };

            // Logic for balance decrement in mass creation
            const updates = [
                prisma.pointage.upsert({
                    where: {
                        employeId_date: {
                            employeId: p.employeId,
                            date: normalizedDate,
                        },
                    },
                    update: pointageData,
                    create: pointageData,
                })
            ];

            if (finalStatut === 'CONGE') {
                updates.push(prisma.employe.update({
                    where: { id: p.employeId },
                    data: { soldeConges: { decrement: finalJoursTravailles } }
                }));
            } else if (finalStatut === 'MALADIE') {
                updates.push(prisma.employe.update({
                    where: { id: p.employeId },
                    data: { soldeMaladie: { decrement: finalJoursTravailles } }
                }));
            }

            return updates;
        }).flat()
    );
}

/**
 * Use case: Obtenir les pointages avec filtres
 * @param {Object} filters - Filtres
 * @returns {Promise<Array>} Liste des pointages
 */
export async function obtenirPointages(filters = {}) {
    const { employeId, dateDebut, dateFin, statut, mois, annee } = filters;

    const where = {};

    if (employeId) {
        where.employeId = employeId;
    }

    if (statut) {
        where.statut = statut;
    }

    // Filtre par période
    if (mois && annee) {
        const debut = new Date(Date.UTC(annee, mois - 1, 1));
        const fin = new Date(Date.UTC(annee, mois, 0, 23, 59, 59));
        where.date = {
            gte: debut,
            lte: fin,
        };
    } else if (dateDebut && dateFin) {
        where.date = {
            gte: new Date(dateDebut),
            lte: new Date(dateFin),
        };
    }

    return await prisma.pointage.findMany({
        where,
        include: {
            employe: {
                select: {
                    id: true,
                    nom: true,
                    prenom: true,
                    poste: true,
                },
            },
        },
        orderBy: [
            { date: 'desc' },
            { employe: { nom: 'asc' } },
        ],
    });
}

/**
 * Use case: Supprimer un pointage
 * @param {string} id - ID du pointage
 * @returns {Promise<Object>} Pointage supprimé
 */
export async function supprimerPointage(id) {
    return await prisma.pointage.delete({
        where: { id },
    });
}

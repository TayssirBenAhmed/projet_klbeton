import prisma from '../../prisma';
import { genererRecapMensuel } from '../../services/recapGenerator';
import { obtenirPointages } from './creerPointage';

/**
 * Use case: Calculer le récapitulatif mensuel pour un employé
 * @param {string} employeId - ID de l'employé
 * @param {number} mois - Mois (1-12)
 * @param {number} annee - Année
 * @returns {Promise<Object>} Récapitulatif complet
 */
export async function calculerRecapMensuel(employeId, mois, annee) {
    // Récupérer l'employé
    const employe = await prisma.employe.findUnique({
        where: { id: employeId },
    });

    if (!employe) {
        throw new Error('Employé non trouvé');
    }

    // Récupérer tous les pointages du mois
    const pointages = await obtenirPointages({
        employeId,
        mois,
        annee,
    });

    // Récupérer les avances du mois
    const avances = await prisma.avance.findMany({
        where: {
            employeId,
            date: {
                gte: new Date(annee, mois - 1, 1),
                lte: new Date(annee, mois, 0, 23, 59, 59),
            },
        },
    });

    // Générer le récapitulatif
    return genererRecapMensuel(employe, pointages, mois, annee, avances);
}

/**
 * Use case: Calculer les récapitulatifs pour tous les employés
 * @param {number} mois - Mois (1-12)
 * @param {number} annee - Année
 * @returns {Promise<Array>} Récapitulatifs de tous les employés
 */
export async function calculerRecapMensuelTous(mois, annee) {
    // Récupérer tous les employés actifs
    const employes = await prisma.employe.findMany({
        where: { statut: 'ACTIF' },
    });

    // Calculer le récap pour chaque employé
    const recaps = await Promise.all(
        employes.map(employe => calculerRecapMensuel(employe.id, mois, annee))
    );

    return recaps;
}

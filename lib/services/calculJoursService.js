import { compterDimanches } from './dimancheCalculator';
import { compterJoursFeries } from '../../constants/joursFeries';

/**
 * Calcule les jours ouvrables dans un mois
 * Formule: Total jours - Dimanches - Jours fériés
 * @param {number} mois - Mois (1-12)
 * @param {number} annee - Année
 * @returns {Object} Détails des jours du mois
 */
export function calculerJoursOuvrables(mois, annee) {
    const joursDansMois = new Date(annee, mois, 0).getDate();
    const dimanches = compterDimanches(mois, annee);
    const feries = compterJoursFeries(mois, annee);

    const joursOuvrables = joursDansMois - dimanches - feries;

    return {
        total: joursDansMois,
        ouvrables: joursOuvrables,
        dimanches,
        feries,
        nonOuvrables: dimanches + feries,
    };
}

/**
 * Convertit des heures en jours de travail
 * @param {number} heures - Nombre d'heures
 * @param {number} heuresParJour - Heures par jour de travail (défaut: 8)
 * @returns {number} Nombre de jours
 */
export function convertirHeuresEnJours(heures, heuresParJour = 8) {
    return heures / heuresParJour;
}

/**
 * Convertit des jours en heures de travail
 * @param {number} jours - Nombre de jours
 * @param {number} heuresParJour - Heures par jour de travail (défaut: 8)
 * @returns {number} Nombre d'heures
 */
export function convertirJoursEnHeures(jours, heuresParJour = 8) {
    return jours * heuresParJour;
}

/**
 * Calcule le pourcentage de présence
 * @param {number} joursTravailles - Jours travaillés par l'employé
 * @param {number} joursOuvrables - Jours ouvrables du mois
 * @returns {number} Pourcentage (0-100)
 */
export function calculerTauxPresence(joursTravailles, joursOuvrables) {
    if (joursOuvrables === 0) return 0;
    return Math.round((joursTravailles / joursOuvrables) * 100);
}

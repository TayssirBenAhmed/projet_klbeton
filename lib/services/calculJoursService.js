import { compterDimanches, estDimanche } from './dimancheCalculator';
import { compterJoursFeries, estJourFerie } from '../../constants/joursFeries';

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
 * Calcule les jours ouvrables du 1er du mois jusqu'à une date donnée (incluse)
 * @param {Date} dateButoir - Date de fin
 * @returns {Object} Détails
 */
export function calculerJoursOuvrablesPartiel(dateButoir) {
    const annee = dateButoir.getFullYear();
    const mois = dateButoir.getMonth(); // 0-11
    const jourFin = dateButoir.getDate();

    let ouvrables = 0;
    let dimanches = 0;
    let feries = 0;
    let total = 0;

    for (let j = 1; j <= jourFin; j++) {
        const current = new Date(annee, mois, j);
        total++;

        if (estDimanche(current)) {
            dimanches++;
        } else if (estJourFerie(current)) {
            feries++;
        } else {
            ouvrables++;
        }
    }

    return { total, ouvrables, dimanches, feries };
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

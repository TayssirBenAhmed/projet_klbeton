/**
 * Compte le nombre de dimanches dans un mois donné
 * @param {number} mois - Mois (1-12)
 * @param {number} annee - Année
 * @returns {number} Nombre de dimanches
 */
export function compterDimanches(mois, annee) {
    let count = 0;
    const joursDansMois = new Date(annee, mois, 0).getDate();

    for (let jour = 1; jour <= joursDansMois; jour++) {
        const date = new Date(annee, mois - 1, jour);
        // 0 = Dimanche
        if (date.getDay() === 0) {
            count++;
        }
    }

    return count;
}

/**
 * Obtient toutes les dates des dimanches dans un mois
 * @param {number} mois - Mois (1-12)
 * @param {number} annee - Année
 * @returns {Date[]} Array de dates des dimanches
 */
export function obtenirDimanches(mois, annee) {
    const dimanches = [];
    const joursDansMois = new Date(annee, mois, 0).getDate();

    for (let jour = 1; jour <= joursDansMois; jour++) {
        const date = new Date(annee, mois - 1, jour);
        if (date.getDay() === 0) {
            dimanches.push(date);
        }
    }

    return dimanches;
}

/**
 * Vérifie si une date est un dimanche
 * @param {Date} date - Date à vérifier
 * @returns {boolean}
 */
export function estDimanche(date) {
    return date.getDay() === 0;
}

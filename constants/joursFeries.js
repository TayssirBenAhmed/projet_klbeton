// Jours fériés de Tunisie
export const JOURS_FERIES_TUNISIE = [
    // Jours fixes
    { nom: "Jour de l'An", date: "01-01" },
    { nom: "Fête de l'Indépendance", date: "03-20" },
    { nom: "Fête de la Jeunesse", date: "03-21" },
    { nom: "Fête des Martyrs", date: "04-09" },
    { nom: "Fête du Travail", date: "05-01" },
    { nom: "Fête de la République", date: "07-25" },
    { nom: "Fête des Femmes", date: "08-13" },
    { nom: "Journée de l'Évacuation", date: "10-15" },
    { nom: "Fête de la Révolution", date: "12-17" },

    // Jours religieux (dates variables - Hégire)
    // Note: Ces dates doivent être mises à jour chaque année selon le calendrier lunaire
    { nom: "Aïd al-Fitr", type: "variable", duree: 2 },
    { nom: "Aïd al-Adha", type: "variable", duree: 2 },
    { nom: "Nouvel An Hégirien", type: "variable", duree: 1 },
    { nom: "Moulid (Anniversaire du Prophète)", type: "variable", duree: 1 },
];

/**
 * Vérifie si une date est un jour férié en Tunisie
 * @param {Date} date - Date à vérifier
 * @returns {boolean}
 */
export function estJourFerie(date) {
    const moisJour = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    return JOURS_FERIES_TUNISIE.some(ferie => {
        if (ferie.type === 'variable') {
            // Pour les dates variables, une logique supplémentaire serait nécessaire
            // avec le calendrier hégirien
            return false;
        }
        return ferie.date === moisJour;
    });
}

/**
 * Compte le nombre de jours fériés dans un mois donné
 * @param {number} mois - Mois (1-12)
 * @param {number} annee - Année
 * @returns {number}
 */
export function compterJoursFeries(mois, annee) {
    let count = 0;
    const joursDansMois = new Date(annee, mois, 0).getDate();

    for (let jour = 1; jour <= joursDansMois; jour++) {
        const date = new Date(annee, mois - 1, jour);
        if (estJourFerie(date)) {
            count++;
        }
    }

    return count;
}

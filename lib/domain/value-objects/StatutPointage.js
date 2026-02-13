/**
 * Value Object pour les statuts de pointage
 */
export const StatutPointage = {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    CONGE: 'CONGE',
    MALADIE: 'MALADIE',
    FERIE: 'FERIE',
};

/**
 * Configuration des statuts avec labels et couleurs
 */
export const STATUT_CONFIG = {
    [StatutPointage.PRESENT]: {
        label: 'Présent',
        emoji: '🟢',
        color: 'accent',
        tailwind: 'bg-accent-100 text-accent-700 border-accent-500',
        description: 'Compte comme jour travaillé',
        affecteSalaire: false,
        affecteConges: false,
    },
    [StatutPointage.ABSENT]: {
        label: 'Absent',
        emoji: '🔴',
        color: 'danger',
        tailwind: 'bg-danger-100 text-danger-700 border-danger-500',
        description: 'Non payé ou à déduire',
        affecteSalaire: true,
        affecteConges: false,
    },
    [StatutPointage.CONGE]: {
        label: 'Congé',
        emoji: '🟡',
        color: 'secondary',
        tailwind: 'bg-secondary-100 text-secondary-700 border-secondary-500',
        description: 'Payé, décompté du solde',
        affecteSalaire: false,
        affecteConges: true,
    },
    [StatutPointage.MALADIE]: {
        label: 'Maladie',
        emoji: '🟠',
        color: 'orange',
        tailwind: 'bg-orange-100 text-orange-700 border-orange-500',
        description: 'Payé, décompté du solde maladie',
        affecteSalaire: false,
        affecteConges: true,
    },
    [StatutPointage.FERIE]: {
        label: 'Jour Férié',
        emoji: '🔵',
        color: 'primary',
        tailwind: 'bg-primary-100 text-primary-700 border-primary-500',
        description: 'Payé, non travaillé',
        affecteSalaire: false,
        affecteConges: false,
    },
};

/**
 * Obtient la configuration d'un statut
 * @param {string} statut
 * @returns {Object}
 */
export function getStatutConfig(statut) {
    return STATUT_CONFIG[statut] || STATUT_CONFIG[StatutPointage.PRESENT];
}

/**
 * Obtient tous les statuts disponibles
 * @returns {Array}
 */
export function getAllStatuts() {
    return Object.values(StatutPointage);
}

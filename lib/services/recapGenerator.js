import { APP_CONFIG } from '../../config';
import { calculerJoursOuvrables } from './calculJoursService';
import { estDimanche } from './dimancheCalculator';
import { estJourFerie } from '../../constants/joursFeries';

/**
 * Calcule le salaire mensuel d'un employé basé sur ses pointages
 * @param {Object} employe - Données employé
 * @param {Array} pointagesDuMois - Pointages du mois
 * @param {number} mois - Mois (1-12)
 * @param {number} annee - Année
 * @returns {Object} Détails du salaire calculé
 */
export function calculerSalaire(employe, pointagesDuMois, mois, annee, avances = []) {
    // RÈGLE : Base de 26 jours fixe
    const joursBaseCalcul = 26;

    // Calcul des taux
    const tauxJournalier = employe.salaireBase / 26;
    const tauxHoraire = tauxJournalier / 8;

    let joursTravaillesTotal = 0; // Jours normaux (Lun-Sam) + Congés + Maladie + Fériés
    let totalHeuresSupp = 0;
    let joursFerieCompteur = 0;

    // Analyse jour par jour
    pointagesDuMois.forEach(p => {
        const d = new Date(p.date);
        const isDimanche = estDimanche(d);

        if (p.statut === 'ABSENT') return;

        if (p.statut === 'PRESENT') {
            if (isDimanche) {
                // Dimanche travaillé : Uniquement en Heures Supp (Option B)
                // On prend soit p.heuresSupp saisi, soit 8h par défaut
                const heuresDimanche = p.heuresSupp > 0 ? p.heuresSupp : 8;
                totalHeuresSupp += heuresDimanche;
            } else {
                // Semaine (Lun-Sam)
                joursTravaillesTotal += p.joursTravailles;
                totalHeuresSupp += p.heuresSupp;
            }
        } else if (['CONGE', 'MALADIE'].includes(p.statut)) {
            joursTravaillesTotal += p.joursTravailles;
        } else if (p.statut === 'FERIE') {
            joursFerieCompteur += p.joursTravailles;
        }
    });

    // FORMULES DEMANDÉES :
    // Montant Présence = Jours travaillés * Taux Journalier
    // Net à Payer = (Montant Présence + Montant HS + Montant Fériés) - Somme(Avances)

    const montantPresence = joursTravaillesTotal * tauxJournalier;
    const montantHS = totalHeuresSupp * tauxHoraire * 1.25; // Majoration 25%
    const montantFeries = joursFerieCompteur * tauxJournalier;

    const totalAvances = avances
        .filter(a => a.statut === 'APPROVED')
        .reduce((sum, a) => sum + a.montant, 0);

    // FORMULES DEMANDÉES :
    // Montant Présence = Jours travaillés * Taux Journalier
    // Net Brut (avant avances) = Montant Présence + Montant HS + Montant Fériés
    // Salaire Net Final (Strict 26-day logic) = Math.max(0, Net Brut - Somme(Avances))

    const netBrut = montantPresence + montantHS + montantFeries;
    const calculNet = netBrut - totalAvances;

    // Règle : Un salaire net ne peut pas être inférieur à 0 sur la fiche
    const salaireNet = Math.max(0, calculNet);

    // Reste à rembourser (Dette) si les avances > gains
    const resteARembourser = Math.max(0, totalAvances - netBrut);

    // Déduction (visuel pour le dashboard)
    const deductionAbsences = Math.max(0, 26 - (joursTravaillesTotal + joursFerieCompteur)) * tauxJournalier;

    return {
        // Détails jours
        joursPresence: pointagesDuMois.filter(p => p.statut === 'PRESENT' && !estDimanche(new Date(p.date))).reduce((a, b) => a + b.joursTravailles, 0),
        joursAbsence: pointagesDuMois.filter(p => p.statut === 'ABSENT').reduce((a, b) => a + b.joursTravailles, 0),
        joursConge: pointagesDuMois.filter(p => p.statut === 'CONGE').reduce((a, b) => a + b.joursTravailles, 0),
        joursMaladie: pointagesDuMois.filter(p => p.statut === 'MALADIE').reduce((a, b) => a + b.joursTravailles, 0),
        joursFerie: joursFerieCompteur,
        joursDimancheTravailles: pointagesDuMois.filter(p => p.statut === 'PRESENT' && estDimanche(new Date(p.date))).length,
        joursBaseCalcul,

        // Détails financiers
        salaireBase: employe.salaireBase,
        tauxJournalier,
        tauxHoraire,
        montantPresence,
        montantFeries,

        // Heures supplémentaires
        totalHeuresSupp,
        montantHeuresSupp: montantHS,

        // Déductions & Dettes
        deductionAbsences,
        totalAvances,
        nombreAvances: avances.length,
        resteARembourser: Math.round(resteARembourser * 1000) / 1000,

        // Total
        totalJoursPayes: joursTravaillesTotal + joursFerieCompteur,
        salaireBrut: Math.round(netBrut * 1000) / 1000,
        salaireNet: Math.round(salaireNet * 1000) / 1000,
    };
}


/**
 * Génère un récapitulatif mensuel pour un employé
 * @param {Object} employe - Données employé
 * @param {Array} pointagesDuMois - Pointages du mois
 * @param {number} mois - Mois (1-12)
 * @param {number} annee - Année
 * @returns {Object} Récapitulatif complet
 */
export function genererRecapMensuel(employe, pointagesDuMois, mois, annee, avances = []) {
    const salaire = calculerSalaire(employe, pointagesDuMois, mois, annee, avances);
    const { ouvrables, total, dimanches, feries } = calculerJoursOuvrables(mois, annee);

    return {
        employe: {
            id: employe.id,
            nom: employe.nom,
            prenom: employe.prenom,
            poste: employe.poste,
            matricule: employe.employeeId || employe.id.substring(0, 8).toUpperCase(),
        },
        periode: {
            mois,
            annee,
            joursTotaux: total,
            joursOuvrables: ouvrables,
            dimanches,
            joursFeries: feries,
        },
        pointages: {
            total: pointagesDuMois.length,
            presence: salaire.joursPresence,
            absence: salaire.joursAbsence,
            conge: salaire.joursConge,
            maladie: salaire.joursMaladie,
            ferie: salaire.joursFerie,
            heuresSupp: salaire.totalHeuresSupp,
        },
        salaire: {
            ...salaire,
            // Expose explicit counters for PDF
            details: {
                joursPresence: salaire.joursPresence,
                joursAbsence: salaire.joursAbsence,
                joursConge: salaire.joursConge,
                joursMaladie: salaire.joursMaladie,
                joursFerie: salaire.joursFerie,
                joursDimanche: salaire.joursDimancheTravailles,
                totalJoursPayes: salaire.totalJoursPayes,
                nombreAvances: salaire.nombreAvances,
                totalAvances: salaire.totalAvances,
                resteARembourser: salaire.resteARembourser,
                tauxAssiduite: Math.min(100, Math.round((salaire.totalJoursPayes / 26) * 100))
            }
        },
        genereLe: new Date(),
    };
}

/**
 * Calcule le taux de présence d'un employé
 * @param {Array} pointagesDuMois - Pointages du mois
 * @param {number} joursOuvrables - Jours ouvrables du mois
 * @returns {number} Pourcentage (0-100)
 */
export function calculerTauxPresence(pointagesDuMois, joursOuvrables) {
    const joursPresence = pointagesDuMois
        .filter(p => p.statut === 'PRESENT' || p.statut === 'FERIE')
        .reduce((sum, p) => sum + p.joursTravailles, 0);

    if (joursOuvrables === 0) return 0;
    return Math.round((joursPresence / joursOuvrables) * 100);
}

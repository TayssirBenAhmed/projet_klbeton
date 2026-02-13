import { startOfMonth, endOfMonth, format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Value Object pour gérer les périodes mensuelles
 */
export class Periode {
    constructor(mois, annee) {
        this.mois = mois; // 1-12
        this.annee = annee;
    }

    /**
     * Obtient le premier jour du mois
     * @returns {Date}
     */
    getDebut() {
        return startOfMonth(new Date(this.annee, this.mois - 1));
    }

    /**
     * Obtient le dernier jour du mois
     * @returns {Date}
     */
    getFin() {
        return endOfMonth(new Date(this.annee, this.mois - 1));
    }

    /**
     * Formate la période en string
     * @returns {string} Ex: "Janvier 2024"
     */
    toString() {
        const date = new Date(this.annee, this.mois - 1);
        return format(date, 'MMMM yyyy', { locale: fr });
    }

    /**
     * Période actuelle
     * @returns {Periode}
     */
    static actuelle() {
        const now = new Date();
        return new Periode(now.getMonth() + 1, now.getFullYear());
    }

    /**
     * Période précédente
     * @returns {Periode}
     */
    precedente() {
        if (this.mois === 1) {
            return new Periode(12, this.annee - 1);
        }
        return new Periode(this.mois - 1, this.annee);
    }

    /**
     * Période suivante
     * @returns {Periode}
     */
    suivante() {
        if (this.mois === 12) {
            return new Periode(1, this.annee + 1);
        }
        return new Periode(this.mois + 1, this.annee);
    }

    /**
     * Vérifie si une date appartient à cette période
     * @param {Date} date
     * @returns {boolean}
     */
    contient(date) {
        const debut = this.getDebut();
        const fin = this.getFin();
        return date >= debut && date <= fin;
    }
}

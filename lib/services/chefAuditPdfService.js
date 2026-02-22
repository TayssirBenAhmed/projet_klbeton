import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Génère un PDF d'audit pour le Chef de chantier
 * 
 * Caractéristiques:
 * - Données brutes saisies (pas de calculs financiers)
 * - Système de validation avec icônes ✅ ❌
 * - Détection d'erreurs et incohérences
 * - Résumé de présence (pas de totaux monétaires)
 * - Senior-friendly: polices larges, lignes espacées
 * 
 * @param {Array} pointages - Les pointages du jour
 * @param {Array} employes - Liste des employés
 * @param {string} date - Date au format YYYY-MM-DD
 * @param {string} chefName - Nom du chef
 */
export const generateChefAuditPDF = (pointages, employes, date, chefName) => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // Format date
    const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).toUpperCase();

    // --- HEADER ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT DE CONTRÔLE - SAISIE DU JOUR', 148, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date : ${formattedDate}`, 148, 22, { align: 'center' });
    doc.text(`Chef de Chantier : ${chefName || 'Non spécifié'}`, 148, 28, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(10, 32, 287, 32);

    // --- VALIDATION LOGIC ---
    const validateRow = (pointage, employe) => {
        const errors = [];
        const warnings = [];

        // Alerte 1: Aucun statut coché
        if (!pointage?.statut) {
            errors.push('Saisie incomplète');
            return { isValid: false, errors, warnings, icon: '❌' };
        }

        // Alerte 2: ABSENT sans note
        if (pointage.statut === 'ABSENT' && (!pointage.note || pointage.note.trim() === '')) {
            errors.push('Justification obligatoire');
        }

        // Alerte 3: MALADIE avec Heures Sup > 0
        if (pointage.statut === 'MALADIE' && (pointage.heuresSupp > 0 || pointage.heureSupplementaire > 0)) {
            errors.push('Pas d\'HS en maladie');
        }

        // Alerte 4: CONGE avec Heures Sup > 0
        if (pointage.statut === 'CONGE' && (pointage.heuresSupp > 0 || pointage.heureSupplementaire > 0)) {
            errors.push('Pas d\'HS en congé');
        }

        // Warning: Présent sans heure d'arrivée
        if (pointage.statut === 'PRESENT' && !pointage.heureValidation) {
            warnings.push('Heure non enregistrée');
        }

        const isValid = errors.length === 0;
        return {
            isValid,
            errors,
            warnings,
            icon: isValid ? '✅' : '❌'
        };
    };

    // --- BUILD TABLE DATA ---
    const tableRows = [];
    let totalPresents = 0;
    let totalAbsents = 0;
    let totalConges = 0;
    let totalMaladies = 0;
    let totalFeries = 0;
    let totalErrors = 0;

    // Combiner tous les employés avec leurs pointages
    employes.forEach(employe => {
        const pointage = pointages.find(p => p.employeId === employe.id);
        const validation = validateRow(pointage, employe);

        // Comptage
        if (pointage?.statut === 'PRESENT') totalPresents++;
        else if (pointage?.statut === 'ABSENT') totalAbsents++;
        else if (pointage?.statut === 'CONGE') totalConges++;
        else if (pointage?.statut === 'MALADIE') totalMaladies++;
        else if (pointage?.statut === 'FERIE') totalFeries++;

        if (!validation.isValid) totalErrors++;

        // Format heures supp
        const heuresSupp = pointage?.heuresSupp || pointage?.heureSupplementaire || 0;
        const heuresSuppDisplay = pointage?.statut === 'PRESENT' && heuresSupp > 0 
            ? `${heuresSupp}h` 
            : '-';

        // Format avance
        const avance = pointage?.avance || 0;
        const avanceDisplay = avance > 0 ? `${avance} DT` : '-';

        // Format note
        const note = pointage?.note || '';

        // Format statut
        const statut = pointage?.statut || 'NON SAISI';

        // Message de contrôle
        let controleMessage = validation.icon;
        if (validation.errors.length > 0) {
            controleMessage += ' ' + validation.errors.join(', ');
        } else if (validation.warnings.length > 0) {
            controleMessage += ' ' + validation.warnings.join(', ');
        } else {
            controleMessage += ' OK';
        }

        tableRows.push([
            `${employe.prenom} ${employe.nom}`.toUpperCase(),
            statut,
            heuresSuppDisplay,
            avanceDisplay,
            note,
            controleMessage
        ]);
    });

    // --- TABLE ---
    autoTable(doc, {
        head: [['COLLABORATEUR', 'STATUT', 'HEURES SUP', 'AVANCE', 'NOTE / OBSERVATION', 'CONTRÔLE']],
        body: tableRows,
        startY: 38,
        theme: 'grid',
        headStyles: {
            fillColor: [40, 44, 52],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 11,
            valign: 'middle',
            halign: 'center'
        },
        styles: {
            fontSize: 10,
            valign: 'middle',
            cellPadding: 4,
            font: 'helvetica'
        },
        columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 60 },
            5: { cellWidth: 'auto', halign: 'center' }
        },
        rowStyles: {
            0: { fillColor: [248, 250, 252] }
        },
        // Colorer les lignes avec erreurs
        didParseCell: function(data) {
            if (data.section === 'body' && data.column.index === 5) {
                const cellText = data.cell.raw || '';
                if (cellText.includes('❌')) {
                    data.cell.styles.fillColor = [254, 226, 226]; // Rouge clair
                    data.cell.styles.textColor = [185, 28, 28]; // Rouge foncé
                } else if (cellText.includes('⚠️')) {
                    data.cell.styles.fillColor = [254, 251, 235]; // Jaune clair
                    data.cell.styles.textColor = [180, 83, 9]; // Orange foncé
                }
            }
        }
    });

    // --- RÉSUMÉ DE PRÉSENCE (PAS DE TOTAUX MONÉTAIRES) ---
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉSUMÉ DE PRÉSENCE', 10, finalY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const statsY = finalY + 8;
    const stats = [
        `Présents : ${totalPresents}`,
        `Absents : ${totalAbsents}`,
        `Congés : ${totalConges}`,
        `Maladies : ${totalMaladies}`,
        `Fériés : ${totalFeries}`,
        `---`,
        `Erreurs détectées : ${totalErrors}`
    ];

    stats.forEach((stat, index) => {
        const y = statsY + (index * 6);
        if (stat.includes('Erreurs') && totalErrors > 0) {
            doc.setTextColor(185, 28, 28); // Rouge pour erreurs
            doc.setFont('helvetica', 'bold');
        } else {
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
        }
        doc.text(stat, 10, y);
    });

    // Réinitialiser couleur
    doc.setTextColor(0, 0, 0);

    // --- STATUT DU CONTRÔLE ---
    const statusY = finalY;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('STATUT DU CONTRÔLE', 150, statusY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (totalErrors === 0) {
        doc.setTextColor(21, 128, 61); // Vert
        doc.text('✅ SAISIE COMPLÈTE ET VALIDÉE', 150, statusY + 8);
        doc.text('Prêt pour validation Admin', 150, statusY + 14);
    } else {
        doc.setTextColor(185, 28, 28); // Rouge
        doc.text('❌ SAISIE INCOMPLÈTE', 150, statusY + 8);
        doc.text(`${totalErrors} erreur(s) à corriger`, 150, statusY + 14);
        doc.text('Veuillez compléter les informations manquantes', 150, statusY + 20);
    }

    // --- FOOTER ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(
        `Document généré le ${new Date().toLocaleString('fr-FR')} | KL BETON - Contrôle Chef de Chantier`,
        148,
        pageHeight - 10,
        { align: 'center' }
    );

    // Sauvegarder
    doc.save(`Controle_Chef_${date}.pdf`);

    // Retourner le statut pour la notification
    return {
        success: true,
        hasErrors: totalErrors > 0,
        totalErrors,
        stats: {
            presents: totalPresents,
            absents: totalAbsents,
            conges: totalConges,
            maladies: totalMaladies,
            feries: totalFeries
        }
    };
};

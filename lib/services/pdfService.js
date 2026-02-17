import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Génère un rapport PAIE & RH aligned with KL BETON Invoice Brand
 * Une page par employé
 * @param {Array|Object} rapport - Les données du rapport
 * @param {number} mois - Mois du rapport
 * @param {number} annee - Année du rapport
 */
export const generateProfessionalPDF = async (rapport, mois, annee) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const logoUrl = '/images/logo-kl-beton-final.jpg';

    // Helper to load image as Base64
    const getImageData = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg'));
            };
            img.onerror = reject;
            img.src = url;
        });
    };

    let logoData = null;
    try {
        logoData = await getImageData(logoUrl);
    } catch (e) {
        console.error("Could not load logo", e);
    }

    const rapportsList = Array.isArray(rapport) ? rapport : [rapport];
    const dateStr = new Date(annee, mois - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
    const generationDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    rapportsList.forEach((empData, index) => {
        if (index > 0) doc.addPage();

        const emp = empData.employe;
        const stats = empData.salaire || {};
        const details = stats.details || {};

        // --- 1. LOGO & COMPANY INFO (Matching Image Top) ---

        if (logoData) {
            // Use the actual image Provided by the Client
            doc.addImage(logoData, 'JPEG', 5, 5, 35, 35);
        } else {
            // Fallback: Simplified Text if image fails
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(40, 44, 52);
            doc.text('KL BETON', 30, 30, { align: 'center' });
        }

        // Company Details (Right)
        const rightX = 140; // Portrait width is 210mm
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Sté KL BETON', rightX, 15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('000, RTE MARMATA ELMODOU', rightX, 19);
        doc.text('Gabes - 6022 - TUNISIE', rightX, 23);
        doc.text('TEL : 29 239 001 / 28 333 595', rightX, 27);
        doc.text('FAX : 75 271 004', rightX, 31);
        doc.text('Email : klbetonconstruction@gmail.com', rightX, 35);
        doc.text('TVA : 1867624BAM000', rightX, 39);

        // --- 2. HEADER BOXES (Matching Image Layout) ---

        // Left Box: RECAPITULATIF No
        doc.setDrawColor(150);
        doc.setLineWidth(0.3);
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(14, 55, 90, 25, 2, 2, 'FD');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text(`FICHE DE PAIE N°`, 18, 62);
        doc.text(`FP-${annee}-${mois < 10 ? '0' + mois : mois}`, 60, 62);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Du : 01/${mois < 10 ? '0' + mois : mois}/${annee}`, 18, 69);
        doc.text(`Au : ${new Date(annee, mois, 0).getDate()}/${mois < 10 ? '0' + mois : mois}/${annee}`, 18, 75);

        // Right Box: COLLABORATEUR
        doc.roundedRect(110, 55, 86, 25, 2, 2, 'S');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('COLLABORATEUR :', 114, 61);
        doc.setFontSize(11);
        doc.text(`${emp.nom} ${emp.prenom}`.toUpperCase(), 114, 68);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Poste : ${emp.poste || 'AGENT'}`, 114, 74);
        doc.text(`Matricule : ${emp.id.substring(0, 8).toUpperCase()}`, 114, 78);

        // --- 3. MAIN TABLE (Grid Theme) ---

        const rows = [
            ['Jours Travaillés (Présence)', 'JOURS', details.joursPresence || 0, (stats.tauxJournalier || 0).toFixed(3), (stats.montantPresence || 0).toFixed(3)],
            ['Congés & Fériés', 'JOURS', (details.joursConge || 0) + (details.joursFerie || 0), (stats.tauxJournalier || 0).toFixed(3), ((details.joursConge + details.joursFerie) * stats.tauxJournalier).toFixed(3)],
            ['Heures Supplémentaires (Maj. 25%)', 'HEURES', stats.totalHeuresSupp || 0, (stats.tauxHoraire * 1.25 || 0).toFixed(3), (stats.montantHeuresSupp || 0).toFixed(3)],
            ['Avances sous-salaire', 'TND', stats.nombreAvances || 0, '-', `-${(stats.totalAvances || 0).toFixed(3)}`]
        ];

        autoTable(doc, {
            head: [['DÉSIGNATION', 'UNITÉ', 'QTÉ', 'P.U. (TND)', 'TOTAL (TND)']],
            body: rows,
            startY: 90,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
            styles: { fontSize: 8, cellPadding: 3, lineColor: [200, 200, 200], textColor: [0, 0, 0] },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right', fontStyle: 'bold' }
            }
        });

        // --- 4. TOTALS SECTION (Right Aligned like Invoice) ---

        let finalY = doc.lastAutoTable.finalY + 10;
        const totalsX = 120;

        const drawTotalLine = (label, value, y, isBold = false) => {
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            doc.setFontSize(9);
            // Label box
            doc.setDrawColor(200);
            doc.rect(totalsX, y, 40, 8, 'S');
            doc.text(label, totalsX + 2, y + 5.5);
            // Value box
            doc.rect(totalsX + 40, y, 36, 8, 'S');
            doc.text(value, totalsX + 74, y + 5.5, { align: 'right' });
        };

        drawTotalLine('Total Gains H.T', (stats.montantPresence + stats.montantHeuresSupp + (details.joursFerie * stats.tauxJournalier)).toFixed(3), finalY);
        drawTotalLine('Total Avances', stats.totalAvances.toFixed(3), finalY + 8);

        if (stats.resteARembourser > 0) {
            drawTotalLine('Dette à Recouvrer', stats.resteARembourser.toFixed(3), finalY + 16, true);
            doc.setTextColor(180, 0, 0); // Red
            drawTotalLine('NET À PAYER', '0.000', finalY + 24, true);
            doc.setTextColor(0);
        } else {
            drawTotalLine('NET À PAYER', stats.salaireNet.toFixed(3), finalY + 16, true);
        }

        // --- 5. FOOTER (Stamp & Site Info) ---

        // Site details line (Bottom)
        const pageHeight = doc.internal.pageSize.height;
        doc.setDrawColor(200);
        doc.line(14, pageHeight - 30, 196, pageHeight - 30);
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.text('M.F : 1867624BAM000   RC : 00000000   CD : 000   CCB : AMAN BANK 67 (LINKED TO LLOYDS)', 105, pageHeight - 26, { align: 'center' });

        // BLUE STAMP (Right Bottom)
        const stampX = 140;
        const stampY = pageHeight - 65;
        doc.setDrawColor(0, 50, 150); // Official Blue
        doc.setLineWidth(0.8);
        doc.roundedRect(stampX, stampY, 45, 22, 3, 3, 'S');

        doc.setFontSize(10);
        doc.setTextColor(0, 50, 150);
        doc.setFont('helvetica', 'bold');
        doc.text('KL BETON', stampX + 22.5, stampY + 8, { align: 'center' });
        doc.setFontSize(8);
        doc.text('Midoun Djerba', stampX + 22.5, stampY + 13, { align: 'center' });
        doc.setFontSize(7);
        doc.text('MF : 1867624B', stampX + 22.5, stampY + 18, { align: 'center' });

        // Page number
        doc.text(`Page ${index + 1} / ${rapportsList.length}`, 190, 50, { align: 'right' });
    });

    doc.save(`Fiche_Paie_KL_${mois}_${annee}.pdf`);
};

/**
 * Génère un RAPPORT JOURNALIER ÉPURÉ
 * @param {Object} stats - Les données du dashboard (repartition, absents, presents...)
 * @param {string} date - La date sélectionnée (YYYY-MM-DD)
 */
export const generateDailyReportPDF = (stats, date) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).toUpperCase();

    // --- HEADER ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT JOURNALIER DE POINTAGE', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date : ${formattedDate}`, 105, 27, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);

    // --- STATS SUMMARY ---
    const startY = 40;
    doc.setFontSize(9);
    doc.text(`Total Effectif : ${stats.stats?.totalEmployes || 0}`, 20, startY);
    doc.text(`Présents : ${stats.repartitionAujourdhui?.PRESENT || 0}`, 70, startY);
    doc.text(`Absents : ${stats.repartitionAujourdhui?.ABSENT || 0}`, 120, startY);
    doc.text(`Validé : ${stats.isJournalValide ? 'OUI' : 'NON'}`, 170, startY);

    // --- TABLE: PRÉSENTS & ABSENTS ---
    // We combine lists or show them in one table
    // Assuming 'stats.presencesJour' contains validated present staff
    // We need a list of ALL employees or at least those with status

    // NOTE: The stats object passed might be limited to 10 items if we didn't fix the API
    // User requested "Tableau des présences".
    // We will build a table from presencesJour + absencesJour

    const allPointages = [
        ...(stats.presencesJour || []).map(p => ({ ...p, type: 'PRESENT' })),
        ...(stats.absencesJour || []).map(p => ({ ...p, type: 'ABSENT' }))
    ];

    // Sort by name
    allPointages.sort((a, b) => a.nom.localeCompare(b.nom));

    const tableRows = allPointages.map(p => [
        `${p.nom} ${p.prenom}`.toUpperCase(),
        p.statut,
        p.heureValidation ? new Date(p.heureValidation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
        p.statut === 'ABSENT' ? 'ABSENCE' : (p.heuresSupp ? `${p.heuresSupp} HS` : '-')
    ]);

    autoTable(doc, {
        head: [['COLLABORATEUR', 'STATUT', 'HEURE', 'NOTE']],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [40, 44, 52], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 80, fontStyle: 'bold' },
            1: { cellWidth: 30 },
            2: { cellWidth: 30, halign: 'center' },
            3: { halign: 'left' }
        }
    });

    // --- FOOTER ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100);
    const footerText = `Généré le ${new Date().toLocaleString()} | KL BETON Administration`;
    doc.text(footerText, 105, pageHeight - 10, { align: 'center' });

    doc.save(`Rapport_Journalier_${date}.pdf`);
};

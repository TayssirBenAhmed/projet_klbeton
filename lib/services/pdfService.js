import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Génère un rapport PAIE & RH aligned with KL BETON Invoice Brand
 * Une page par employé
 * @param {Array|Object} rapport - Les données du rapport
 * @param {number} mois - Mois du rapport
 * @param {number} annee - Année du rapport
 */
export const generateProfessionalPDF = (rapport, mois, annee) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const rapportsList = Array.isArray(rapport) ? rapport : [rapport];
    const dateStr = new Date(annee, mois - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
    const generationDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    rapportsList.forEach((empData, index) => {
        if (index > 0) doc.addPage();

        const emp = empData.employe;
        const stats = empData.salaire || {};
        const details = stats.details || {};

        // --- 1. LOGO & COMPANY INFO (Matching Image Top) ---

        // DRAW BRAND LOGO (Left)
        // Simulated: Double circle with "CONSTRUCTION"
        doc.setLineWidth(0.8);
        doc.setDrawColor(40, 44, 52); // Dark slate
        doc.circle(30, 22, 12); // Outer
        doc.setLineWidth(0.2);
        doc.circle(30, 22, 10.5); // Inner

        // Icon (Truck silhouette simplified)
        doc.setDrawColor(200, 30, 30); // Red part
        doc.setFillColor(200, 30, 30);
        doc.rect(24, 21, 8, 4, 'F'); // Truck body
        doc.setFillColor(40, 44, 52);
        doc.rect(32, 20, 4, 5, 'F'); // Cab
        doc.circle(26, 26, 1.5, 'F'); // Wheel
        doc.circle(34, 26, 1.5, 'F'); // Wheel

        // Text under logo
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(40, 44, 52);
        doc.text('CONSTRUCTION', 30, 39, { align: 'center' });
        doc.setFontSize(7);
        doc.text('QUALITÉ - SERVICE - PRIX', 30, 42, { align: 'center' });

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

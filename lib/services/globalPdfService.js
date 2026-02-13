import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Génère un rapport PDF global regroupant tous les employés (Aligné Brand)
 * @param {Array} data - Liste des récapitulatifs mensuels par employé
 * @param {number} mois - Mois de référence
 * @param {number} annee - Année de référence
 */
export const genererPdfGlobal = (data, mois, annee) => {
    // Mode Paysage (Landscape)
    const doc = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: 'a4'
    });

    const moisNom = new Date(annee, mois - 1).toLocaleString('fr-FR', { month: 'long' });
    const titre = `RECAPITULATIF GLOBAL DE PAIE - ${moisNom.toUpperCase()} ${annee}`;

    // --- 1. BRAND LOGO (Left Top) ---
    doc.setLineWidth(0.8);
    doc.setDrawColor(40, 44, 52);
    doc.circle(25, 20, 11); // Logo container

    // Truck silhouette (Refined)
    doc.setDrawColor(200, 30, 30);
    doc.setFillColor(200, 30, 30);
    doc.rect(20, 20, 7, 3, 'F'); // Truck body
    doc.setFillColor(40, 44, 52);
    doc.rect(27, 19, 3, 4, 'F'); // Cab
    doc.circle(22, 24, 1.2, 'F'); // Wheels
    doc.circle(28, 24, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(40, 44, 52);
    doc.text('CONSTRUCTION', 25, 37, { align: 'center' });

    // --- 2. COMPANY DETAILS (Right Top) ---
    const rightX = 230; // Landscape width is ~297mm
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

    // --- 3. TITLE SECTION (Center/Left) ---
    doc.setTextColor(0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('KL BETON', 45, 18);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(titre, 45, 26);
    doc.setFontSize(8);
    doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 45, 32);

    // Préparation des données du tableau
    const tableRows = data.map(item => [
        item.employe.matricule || '-',
        `${item.employe.nom} ${item.employe.prenom}`,
        item.pointages.presence.toFixed(1),
        (item.pointages.conge + item.pointages.ferie).toFixed(1),
        item.pointages.heuresSupp.toFixed(1),
        item.salaire.totalAvances.toFixed(3),
        item.salaire.resteARembourser > 0 ? { content: item.salaire.resteARembourser.toFixed(3), styles: { textColor: [190, 40, 100], fontStyle: 'bold' } } : '-',
        item.salaire.salaireNet.toFixed(3)
    ]);

    // Totals
    const totalPresence = data.reduce((sum, item) => sum + item.pointages.presence, 0);
    const totalAssimiles = data.reduce((sum, item) => sum + (item.pointages.conge + item.pointages.ferie), 0);
    const totalHS = data.reduce((sum, item) => sum + item.pointages.heuresSupp, 0);
    const totalAvances = data.reduce((sum, item) => sum + item.salaire.totalAvances, 0);
    const totalDette = data.reduce((sum, item) => sum + item.salaire.resteARembourser, 0);
    const totalNet = data.reduce((sum, item) => sum + item.salaire.salaireNet, 0);

    const footerRow = [
        { content: 'TOTAUX GÉNÉRAUX', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: totalPresence.toFixed(1), styles: { fontStyle: 'bold', halign: 'center', fillColor: [240, 240, 240] } },
        { content: totalAssimiles.toFixed(1), styles: { fontStyle: 'bold', halign: 'center', fillColor: [240, 240, 240] } },
        { content: totalHS.toFixed(1), styles: { fontStyle: 'bold', halign: 'center', fillColor: [240, 240, 240] } },
        { content: totalAvances.toFixed(3), styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 240, 240] } },
        { content: totalDette.toFixed(3), styles: { fontStyle: 'bold', halign: 'right', textColor: [190, 40, 100], fillColor: [240, 240, 240] } },
        { content: totalNet.toFixed(3), styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 240, 240] } }
    ];

    autoTable(doc, {
        startY: 40,
        head: [['MATR.', 'NOM COMPLET', 'PRES. (j)', 'ASSIM. (j)', 'H.SUPP', 'AVANCES', 'DETTE (DT)', 'NET À PAYER']],
        body: [...tableRows, footerRow],
        theme: 'grid',
        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontSize: 8, halign: 'center' },
        styles: { fontSize: 8, cellPadding: 2.5, lineColor: [200, 200, 200] },
        columnStyles: {
            0: { width: 22 },
            1: { width: 55 },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 10, right: 10 }
    });

    // FOOTER
    const pageCount = doc.internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.height;
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(200);
        doc.line(10, pageHeight - 20, doc.internal.pageSize.width - 10, pageHeight - 20);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(
            `KL BETON Management System - Rapport Global ${moisNom} ${annee} - Page ${i} / ${pageCount}`,
            doc.internal.pageSize.width / 2,
            pageHeight - 12,
            { align: 'center' }
        );
    }

    doc.save(`Recap_Global_${moisNom}_${annee}.pdf`);
};

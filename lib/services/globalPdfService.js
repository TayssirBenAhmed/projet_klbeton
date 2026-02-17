import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Génère un rapport PDF global regroupant tous les employés (Aligné Brand)
 * @param {Array} data - Liste des récapitulatifs mensuels par employé
 * @param {number} mois - Mois de référence
 * @param {number} annee - Année de référence
 */
export const genererPdfGlobal = async (data, mois, annee) => {
    // Mode Paysage (Landscape)
    const doc = new jsPDF({
        orientation: 'l',
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

    const moisNom = new Date(annee, mois - 1).toLocaleString('fr-FR', { month: 'long' });
    const titre = `RECAPITULATIF GLOBAL DE PAIE - ${moisNom.toUpperCase()} ${annee}`;

    // --- 1. BRAND LOGO (Left Top) ---
    if (logoData) {
        doc.addImage(logoData, 'JPEG', 5, 5, 35, 35);
    } else {
        // Fallback
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(40, 44, 52);
        doc.text('KL BETON', 25, 30, { align: 'center' });
    }

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

    // --- 3. TITLE SECTION (Center) ---
    doc.setTextColor(0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('KL BETON', doc.internal.pageSize.width / 2, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(titre, doc.internal.pageSize.width / 2, 26, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, doc.internal.pageSize.width / 2, 32, { align: 'center' });

    // Préparation des données du tableau
    const tableRows = data.map(item => [
        item.employe.matricule || '-',
        `${item.employe.nom} ${item.employe.prenom}`.toUpperCase(),
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
        startY: 50,
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

    // FOOTER (Signatures)
    const pageCount = doc.internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.height;

    doc.setPage(pageCount);
    const signatureY = doc.lastAutoTable.finalY + 8; // Increased gap to 8mm per user request

    // Check if we have enough space (approx 25mm needed for signature block)
    // Page height is 210. Footer is at ~195. We need to finish before 195.
    // If signature starts at Y, (text), rect starts at Y+2, ends at Y+2+22 = Y+24.
    // So Y + 24 < 195 => Y < 171.
    // If not, we still prefer not to break page if possible, but keep the check sane.
    if (signatureY > pageHeight - 30) {
        doc.addPage();
        doc.setPage(doc.internal.getNumberOfPages());
    }

    const finalSigY = signatureY;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);

    // Zone 1: Responsable
    doc.text('Signature du Responsable', 50, finalSigY);
    doc.text('.....................................', 50, finalSigY + 15);

    // Zone 2: Cachet Entreprise
    doc.text('Cachet de l\'Entreprise', 200, finalSigY);
    doc.roundedRect(195, finalSigY + 2, 50, 22, 3, 3, 'S'); // Moved up (Y+2) and reduced height (22)


    // Page Numbers Footer
    for (let i = 1; i <= doc.internal.getNumberOfPages(); i++) {
        doc.setPage(i);
        doc.setDrawColor(200);
        doc.line(10, pageHeight - 15, doc.internal.pageSize.width - 10, pageHeight - 15);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(
            `KL BETON Management System - Rapport Global ${moisNom} ${annee} - Page ${i} / ${doc.internal.getNumberOfPages()}`,
            doc.internal.pageSize.width / 2,
            pageHeight - 8,
            { align: 'center' }
        );
    }

    doc.save(`Recap_Global_${moisNom}_${annee}.pdf`);
};

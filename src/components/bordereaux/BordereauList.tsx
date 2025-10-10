import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Bordereau } from '../../types';
import { CalculUtils } from '../../utils/calculs';
import './BordereauPrint.css';

interface BordereauListProps {
  onEditBordereau: (bordereau?: Bordereau) => void;
}

const BordereauList: React.FC<BordereauListProps> = ({ onEditBordereau }) => {
  const { state, deleteBordereau, formatDate, formatCurrency, formatNumber } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBordereau, setSelectedBordereau] = useState<Bordereau | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [bordereauToPrint, setBordereauToPrint] = useState<Bordereau | null>(null);

  // Fonction utilitaire pour formater les montants en XPF
  const formaterMontant = (montant: number): string => {
    return formatCurrency(montant);
  };

  // Fonction pour formater les montants dans le HTML (évite les problèmes d'encodage)
  const formaterMontantHTML = (montant: number): string => {
    return `${formatNumber(Math.round(montant), 0)} FCFP`;
  };

  // Fonction pour calculer le montant d'une feuille de soins (montant total)
  const calculerMontantFeuille = (feuille: any): number => {
    return feuille.montantTotal || 0;
  };

  // Fonction pour calculer la part CPS d'une facture semelles
  const calculerPartCPSFacture = (facture: any): number => {
    return (facture.actesOrthopediques || []).reduce((total: number, acte: any) => 
      total + (acte.partCPS || 0), 0
    );
  };

  // Fonction pour calculer le total d'un bordereau (montant total pour feuilles, part CPS pour factures)
  const calculerTotalBordereau = (bordereau: any): number => {
    const totalFeuilles = (bordereau.feuillesSoins || []).reduce((total: number, feuille: any) => 
      total + calculerMontantFeuille(feuille), 0
    );
    const totalFactures = (bordereau.facturesSemelles || []).reduce((total: number, facture: any) => 
      total + calculerPartCPSFacture(facture), 0
    );
    return totalFeuilles + totalFactures;
  };



  const filteredBordereaux = state.bordereaux.filter(bordereau =>
    bordereau.numeroBordereau.includes(searchTerm) ||
    (bordereau.feuillesSoins || []).some(feuille => 
      feuille.patient?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feuille.patient?.prenom.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleDeleteBordereau = async (bordereauId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bordereau ?')) {
      try {
        await deleteBordereau(bordereauId);
      } catch (error) {
        console.error('Erreur lors de la suppression du bordereau:', error);
      }
    }
  };

  // const handlePrintBordereau = (bordereau: Bordereau) => {
  //   setBordereauToPrint(bordereau);
  //   setShowPrintPreview(true);
  // };

  const handleOpenPDF = async (bordereau: Bordereau) => {
    try {
      // Import dynamique de jsPDF
      const jsPDF = await import('jspdf');
      
      // Création du document jsPDF en format A4
      const doc = new jsPDF.default('p', 'mm', 'a4');
      
      // Configuration de la police
      doc.setFont('helvetica');
      
      // Déterminer le type de bordereau
      const isFeuillesSoins = bordereau.type === 'feuilles-soins' || bordereau.type === 'rejet-feuilles-soins';
      
      // 1. ENCART PROFESSIONNEL (gauche)
      // NOTE: Cet encart est présent sur TOUS les PDFs (feuilles de soins, factures de semelles, bordereaux)
      let yPos = 15;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Thibaud Carré - Podologue D.E.', 15, yPos);
      yPos += 8;
      
      // Spécialisation
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Podologue du Sport D.U.', 15, yPos);
      yPos += 6;
      
      // Adresse
      doc.setFontSize(11);
      doc.text('Centre médical St Etienne, PK 12,1 Punaaula', 15, yPos);
      yPos += 5;
      
      // Contact
      doc.text('Tél: 87 27 85 78', 15, yPos);
      yPos += 5;
      doc.text('Email: tc.podologue@gmail.com', 15, yPos);

      // 2. TITRE BORDEREAU (droite)
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 255); // Bleu
      doc.text('BORDEREAU', 130, 20);
      
      // Sous-titre selon le type de bordereau
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 255); // Bleu
      let sousTitre = '';
      if (bordereau.type === 'feuilles-soins') {
        sousTitre = 'Feuilles de Soins';
      } else if (bordereau.type === 'rejet-feuilles-soins') {
        sousTitre = 'REJETS Feuilles de Soins';
      } else if (bordereau.type === 'semelles-orthopediques') {
        sousTitre = 'Semelles orthopédiques';
      } else if (bordereau.type === 'rejet-semelles-orthopediques') {
        sousTitre = 'REJETS Semelles orthopédiques';
      }
      doc.text(sousTitre, 130, 28);
      
      // Informations bordereau
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Noir
      doc.text(`N° BORDEREAU: ${bordereau.numeroBordereau}`, 130, 38);
      doc.text(`Date: ${formatDate(bordereau.date)}`, 130, 44);
      doc.text('CODE PROFESSIONNEL: A22', 130, 50);
      
      // 3. INFORMATIONS DU BORDEREAU
      yPos = 60;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMATIONS DU BORDEREAU', 15, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${formatDate(bordereau.date)}`, 15, yPos);
      yPos += 8;
      
      // Afficher seulement les informations pertinentes selon le type
      if (isFeuillesSoins) {
        doc.text(`Feuilles de soins: ${(bordereau.feuillesSoins || []).length}`, 15, yPos);
      } else {
        doc.text(`Factures semelles: ${(bordereau.facturesSemelles || []).length}`, 15, yPos);
      }
      
      // 4. TABLEAU DES ÉLÉMENTS
      yPos += 15;
      const startX = 15;
      
      if (isFeuillesSoins) {
        // Tableau exactement comme dans la capture d'écran
        const colWidths = [35, 30, 30, 40, 20, 25]; // Patient, N° Facture, Date prescription, Dates de soins, Actes, Montant
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        
        // En-têtes du tableau avec fond gris et bordures
        doc.setFillColor(240, 240, 240);
        doc.rect(startX, yPos - 5, tableWidth, 8, 'F');
        
        // Dessiner les lignes verticales pour les en-têtes
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        let headerX = startX;
        for (let i = 0; i < colWidths.length; i++) {
          headerX += colWidths[i];
          if (i < colWidths.length - 1) {
            doc.line(headerX, yPos - 5, headerX, yPos + 3);
          }
        }
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Patient', startX + 2, yPos);
        doc.text('N° Facture', startX + colWidths[0] + 2, yPos);
        doc.text('Date prescription', startX + colWidths[0] + colWidths[1] + 2, yPos);
        doc.text('Dates de soins', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
        doc.text('Actes', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPos);
        doc.text('Montant', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 2, yPos);
        
        yPos += 8;
        
        // Données du tableau
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        (bordereau.feuillesSoins || []).forEach((feuille, index) => {
          // Vérifier si on a besoin d'une nouvelle page
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
            
            // Répéter les en-têtes avec bordures
            doc.setFillColor(240, 240, 240);
            doc.rect(startX, yPos - 5, tableWidth, 8, 'F');
            
            // Dessiner les lignes verticales pour les en-têtes
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            let headerX = startX;
            for (let i = 0; i < colWidths.length; i++) {
              headerX += colWidths[i];
              if (i < colWidths.length - 1) {
                doc.line(headerX, yPos - 5, headerX, yPos + 3);
              }
            }
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Patient', startX + 2, yPos);
            doc.text('N° Facture', startX + colWidths[0] + 2, yPos);
            doc.text('Date prescription', startX + colWidths[0] + colWidths[1] + 2, yPos);
            doc.text('Dates de soins', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
            doc.text('Actes', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPos);
            doc.text('Montant', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 2, yPos);
            yPos += 8;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
          }
          
          // Bordures du tableau - ajustées pour correspondre exactement aux colonnes
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          
          // Calculer la hauteur de la cellule basée sur le nombre d'actes
          const cellHeight = Math.max(12, (feuille.actes || []).length * 4 + 8);
          
          // Dessiner le rectangle principal
          doc.rect(startX, yPos - 3, tableWidth, cellHeight, 'S');
          
          // Dessiner les lignes verticales entre les colonnes
          let currentX = startX;
          for (let i = 0; i < colWidths.length; i++) {
            currentX += colWidths[i];
            if (i < colWidths.length - 1) {
              doc.line(currentX, yPos - 3, currentX, yPos - 3 + cellHeight);
            }
          }
          
          // Patient (aligné à gauche)
          doc.text(`${feuille.patient?.prenom || ''} ${feuille.patient?.nom || ''}`, startX + 2, yPos);
          doc.setFontSize(7);
          // DN n'est pas disponible dans la nouvelle structure
          // doc.text(`DN: ${feuille.patient.dn}`, startX + 2, yPos + 4);
          doc.setFontSize(8);
          
          // N° Facture (aligné à gauche)
          doc.text(feuille.numero_feuille, startX + colWidths[0] + 2, yPos);
          
          // Date prescription (aligné à gauche)
          doc.text(formatDate(feuille.datePrescription), startX + colWidths[0] + colWidths[1] + 2, yPos);
          
          // Dates de soins (aligné à gauche) - afficher TOUTES les dates des actes
          let currentY = yPos;
          if ((feuille.actes || []).length > 0) {
            // Afficher chaque acte avec sa date et ses badges
            feuille.actes.forEach((acte, acteIndex) => {
              const date = formatDate(acte.date);
              
              // Collecter les badges pour cet acte
              const badges = [];
              if (acte.ifd) badges.push('IFD');
              if (acte.ik) badges.push('IK');
              if (acte.majorationDimanche) badges.push('DIM');
              if (acte.majorationNuit) badges.push('NUIT');
              
              // Afficher la date avec les badges sur la même ligne
              const badgesText = badges.join(' ');
              const dateWithBadges = badgesText ? `${date} ${badgesText}` : date;
              doc.text(dateWithBadges, startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, currentY);
              
              currentY += 4;
            });
          }
          
          // Actes (aligné à gauche)
          const nombreActes = (feuille.actes || []).length;
          const texteActes = nombreActes >= 2 ? `${nombreActes} actes` : `${nombreActes} acte`;
          doc.text(texteActes, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPos);
          
          // Montant (aligné à droite)
          const montantX = startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] - 2;
          doc.text(formaterMontantHTML(calculerMontantFeuille(feuille)), montantX, yPos, { align: 'right' });
          
          // Ajuster la hauteur de la ligne selon le nombre d'actes
          const hauteurLigne = Math.max(12, (feuille.actes || []).length * 4 + 8);
          yPos += hauteurLigne;
        });
      } else {
        // Tableau pour les factures semelles orthopédiques
        const colWidths = [35, 30, 30, 40, 20, 25]; // Patient, N° Facture, Date prescription, Dates de soins, Actes, Montant
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        
        // En-têtes du tableau avec fond gris et bordures
        doc.setFillColor(240, 240, 240);
        doc.rect(startX, yPos - 5, tableWidth, 8, 'F');
        
        // Dessiner les lignes verticales pour les en-têtes
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        let headerX = startX;
        for (let i = 0; i < colWidths.length; i++) {
          headerX += colWidths[i];
          if (i < colWidths.length - 1) {
            doc.line(headerX, yPos - 5, headerX, yPos + 3);
          }
        }
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Patient', startX + 2, yPos);
        doc.text('N° Facture', startX + colWidths[0] + 2, yPos);
        doc.text('Date prescription', startX + colWidths[0] + colWidths[1] + 2, yPos);
        doc.text('Dates de soins', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
        doc.text('Actes', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPos);
        doc.text('Montant', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 2, yPos);
        
        yPos += 8;
        
        // Données du tableau pour les factures semelles
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        (bordereau.facturesSemelles || []).forEach((facture, index) => {
          // Vérifier si on a besoin d'une nouvelle page
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
            
            // Répéter les en-têtes avec bordures
            doc.setFillColor(240, 240, 240);
            doc.rect(startX, yPos - 5, tableWidth, 8, 'F');
            
            // Dessiner les lignes verticales pour les en-têtes
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            let headerX = startX;
            for (let i = 0; i < colWidths.length; i++) {
              headerX += colWidths[i];
              if (i < colWidths.length - 1) {
                doc.line(headerX, yPos - 5, headerX, yPos + 3);
              }
            }
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Patient', startX + 2, yPos);
            doc.text('N° Facture', startX + colWidths[0] + 2, yPos);
            doc.text('Date prescription', startX + colWidths[0] + colWidths[1] + 2, yPos);
            doc.text('Dates de soins', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
            doc.text('Actes', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPos);
            doc.text('Montant', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 2, yPos);
            
            yPos += 8;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
          }
          
          // Patient (aligné à gauche)
          doc.text(`${facture.patient?.prenom || ''} ${facture.patient?.nom || ''}`, startX + 2, yPos);
          
          // N° Facture (aligné à gauche)
          doc.text(facture.numeroFacture, startX + colWidths[0] + 2, yPos);
          
          // Date prescription (aligné à gauche)
          doc.text(formatDate(facture.datePrescription), startX + colWidths[0] + colWidths[1] + 2, yPos);
          
          // Dates de soins (aligné à gauche)
          doc.text(formatDate(facture.dateSoins), startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
          
          // Actes orthopédiques (aligné à gauche)
          const nombreActesOrthopediques = (facture.actesOrthopediques || []).length;
          const texteActesOrthopediques = nombreActesOrthopediques >= 2 ? `${nombreActesOrthopediques} actes` : `${nombreActesOrthopediques} acte`;
          doc.text(texteActesOrthopediques, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPos);
          
          // Montant (aligné à droite) - Part CPS
          const montantX = startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] - 2;
          doc.text(formaterMontantHTML(calculerPartCPSFacture(facture)), montantX, yPos, { align: 'right' });
          
          // Ajuster la hauteur de la ligne selon le nombre d'actes
          const hauteurLigne = Math.max(12, (facture.actesOrthopediques || []).length * 4 + 8);
          yPos += hauteurLigne;
        });
      }
      
      // 5. MONTANT TOTAL
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0); // Noir
      doc.text('MONTANT TOTAL', 15, yPos);
      yPos += 6;
      doc.setFontSize(14);
      doc.setTextColor(220, 50, 50); // Rouge
      doc.text(`${formaterMontantHTML(calculerTotalBordereau(bordereau))}`, 15, yPos);
      
      // Ouvrir le PDF dans un nouvel onglet
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      // Nettoyer l'URL après un délai
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  };

  const handleClosePrintPreview = () => {
    setShowPrintPreview(false);
    setBordereauToPrint(null);
  };

  const handlePrint = () => {
    if (!bordereauToPrint) return;
    
    // Créer le contenu HTML optimisé pour l'impression
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bordereau ${bordereauToPrint.numeroBordereau}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
            padding: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.2;
            background: white;
          }
          
          .print-container {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            position: relative;
            background: white;
            box-sizing: border-box;
          }
          
          .header {
            position: absolute;
            left: 15mm;
            top: 15mm;
            width: 180mm;
            height: 25mm;
            text-align: center;
            border-bottom: 2px solid #000;
          }
          
          .header h1 {
            font-size: 22pt;
            font-weight: bold;
            margin: 0;
            color: black;
          }
          
          .header h2 {
            font-size: 16pt;
            margin: 3mm 0 0 0;
            color: black;
          }
          
          .info {
            position: absolute;
            left: 15mm;
            top: 45mm;
            width: 180mm;
            height: 20mm;
          }
          
          .info p {
            margin: 1.5mm 0;
            font-size: 11pt;
            color: black;
          }
          
          .table-container {
            position: absolute;
            left: 15mm;
            top: 70mm;
            width: 180mm;
            height: auto;
            min-height: 120mm;
            max-height: 200mm;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 1.5px;
            text-align: left;
            font-size: 7pt;
            color: black;
            vertical-align: top;
          }
          
          th {
            background-color: #f0f0f0;
            font-weight: bold;
            padding: 2px;
          }
          
          .patient-name {
            font-weight: bold;
            font-size: 8pt;
          }
          
          .patient-dn {
            font-size: 6pt;
            color: #666;
            margin-top: 1px;
          }
          
          .acte-dates {
            font-size: 6pt;
            line-height: 1.1;
          }
          
          .badge {
            display: inline-block;
            padding: 0.5px 2px;
            border-radius: 1px;
            font-size: 5pt;
            margin-left: 1px;
            color: white;
          }
          
          .badge-ifd { background-color: #1976d2; }
          .badge-ik { background-color: #388e3c; }
          .badge-dim { background-color: #f57c00; }
          .badge-nuit { background-color: #7b1fa2; }
          
          .total {
            position: absolute;
            left: 120mm;
            top: auto;
            bottom: 25mm;
            width: 75mm;
            height: 20mm;
            text-align: right;
          }
          
          .total p {
            font-size: 13pt;
            font-weight: bold;
            margin: 0;
            color: #d32f2f;
          }
          
          .footer {
            position: absolute;
            left: 15mm;
            top: auto;
            bottom: 10mm;
            width: 180mm;
            height: 12mm;
            border-top: 1px solid #ccc;
            padding-top: 2mm;
            font-size: 8pt;
            text-align: center;
            color: #666;
          }
          
          @media print {
            body { margin: 0; padding: 0; }
            .print-container { margin: 0; padding: 0; }
            * { -webkit-print-color-adjust: exact; color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <h1>BORDEREAU DE REMISE</h1>
            <h2>${bordereauToPrint.numeroBordereau}</h2>
          </div>
          
          ${state.configuration.parametres ? `
          <div class="cabinet-info" style="border: 1px solid #ccc; border-radius: 5px; padding: 15px; margin: 20px 0; background-color: #f9f9f9;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="flex: 1;">
                ${state.configuration.parametres.nomCabinet ? `<div style="font-weight: bold; margin-bottom: 5px; font-size: 16px;">${state.configuration.parametres.nomCabinet}</div>` : ''}
                ${state.configuration.parametres.adresse ? `<div style="margin-bottom: 5px;">${state.configuration.parametres.adresse}</div>` : ''}
                <div style="display: flex; gap: 20px; font-size: 14px;">
                  ${state.configuration.parametres.telephone ? `<span>📞 ${state.configuration.parametres.telephone}</span>` : ''}
                  ${state.configuration.parametres.email ? `<span>✉️ ${state.configuration.parametres.email}</span>` : ''}
                </div>
                ${state.configuration.parametres.identificationPraticien ? `
                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                  ID Praticien: ${state.configuration.parametres.identificationPraticien}
                  ${state.configuration.parametres.auxiliaireMedicalRemplacant ? '<span style="margin-left: 10px; color: #1976d2;">(Auxiliaire médical remplaçant)</span>' : ''}
                </div>
                ` : ''}
              </div>
              ${state.configuration.parametres.logo ? `
              <div style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;">
                <img src="${state.configuration.parametres.logo}" alt="Logo du cabinet" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}
          
          <div class="info">
            <p><strong>Date de création:</strong> ${formatDate(bordereauToPrint.date)}</p>
            <p><strong>Feuilles de soins:</strong> ${(bordereauToPrint.feuillesSoins || []).length}</p>
            <p><strong>Modèle utilisé:</strong> ${bordereauToPrint.modeleUtilise}</p>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>N° Facture</th>
                  <th>Dates de soins</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                ${(bordereauToPrint.feuillesSoins || []).map(feuille => `
                  <tr>
                    <td>
                      <div class="patient-name">${feuille.patient?.prenom || ''} ${feuille.patient?.nom || ''}</div>
                      <!-- DN n'est pas disponible dans la nouvelle structure -->
                    </td>
                    <td style="font-family: monospace;">${feuille.numero_feuille}</td>
                    <td class="acte-dates">
                      ${(feuille.actes || []).length > 0 ? 
                        (feuille.actes || []).map(acte => `
                          <div style="margin-bottom: 2px;">
                            <span>${new Date(acte.date).toLocaleDateString('fr-FR')}</span>
                            ${acte.ifd ? '<span class="badge badge-ifd">IFD</span>' : ''}
                            ${acte.ik ? '<span class="badge badge-ik">IK</span>' : ''}
                            ${acte.majorationDimanche ? '<span class="badge badge-dim">DIM</span>' : ''}
                            ${acte.majorationNuit ? '<span class="badge badge-nuit">NUIT</span>' : ''}
                          </div>
                        `).join('') : 
                        '<span style="color: #999;">Aucun acte</span>'
                      }
                    </td>
                    <td style="text-align: right; font-weight: bold;">${formaterMontantHTML(calculerMontantFeuille(feuille))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="total">
            <p><strong>Total:</strong> ${formaterMontantHTML(calculerTotalBordereau(bordereauToPrint))}</p>
          </div>
          
          <div class="footer">
            <p>Bordereau généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Ouvrir une nouvelle fenêtre avec le contenu HTML optimisé
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      // Attendre que le contenu soit chargé puis imprimer
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

  const handleSavePDF = async (bordereau: Bordereau) => {
    // Utiliser la même logique que handleOpenPDF
    await handleOpenPDF(bordereau);
  };


  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bordereaux de remise</h1>
          <p className="text-gray-600">Gestion des bordereaux de remise</p>
        </div>
        <button onClick={() => onEditBordereau()} className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouveau bordereau
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher un bordereau..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredBordereaux.length} bordereau(x) trouvé(s)
        </div>
      </div>

      {/* Liste des bordereaux */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">N° Bordereau</th>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Éléments</th>
                <th className="table-header-cell">Patients</th>
                <th className="table-header-cell">Montant total</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredBordereaux.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-gray-500 py-8">
                    {searchTerm ? 'Aucun bordereau trouvé' : 'Aucun bordereau enregistré'}
                  </td>
                </tr>
              ) : (
                filteredBordereaux.map((bordereau) => (
                  <tr key={bordereau.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-mono">{bordereau.numeroBordereau}</span>
                    </td>
                    <td className="table-cell">
                      {new Date(bordereau.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        {(bordereau.feuillesSoins || []).length > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="badge badge-info">
                              {(() => {
                                const nombreFeuilles = (bordereau.feuillesSoins || []).length;
                                return nombreFeuilles >= 2 ? `${nombreFeuilles} feuilles` : `${nombreFeuilles} feuille`;
                              })()}
                            </span>
                            <span className="text-xs text-blue-600">📄</span>
                          </div>
                        )}
                        {(bordereau.facturesSemelles || []).length > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="badge badge-success">
                              {(() => {
                                const nombreFactures = (bordereau.facturesSemelles || []).length;
                                return nombreFactures >= 2 ? `${nombreFactures} factures` : `${nombreFactures} facture`;
                              })()}
                            </span>
                            <span className="text-xs text-green-600">🦶</span>
                          </div>
                        )}
                        {(bordereau.feuillesSoins || []).length === 0 && (bordereau.facturesSemelles || []).length === 0 && (
                          <span className="text-gray-500 text-sm">Aucun élément</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm space-y-1">
                        {/* Patients des feuilles de soins */}
                        {(bordereau.feuillesSoins || []).slice(0, 2).map((feuille, index) => (
                          <div key={`feuille-${index}`} className="flex items-center space-x-2">
                            <span className="text-blue-600 text-xs">📄</span>
                            <span className="text-gray-600">{feuille.patient?.prenom || ''} {feuille.patient?.nom || ''}</span>
                          </div>
                        ))}
                        {/* Patients des factures semelles */}
                        {(bordereau.facturesSemelles || []).slice(0, 2).map((facture, index) => (
                          <div key={`facture-${index}`} className="flex items-center space-x-2">
                            <span className="text-green-600 text-xs">🦶</span>
                            <span className="text-gray-600">{facture.patient?.prenom || ''} {facture.patient?.nom || ''}</span>
                          </div>
                        ))}
                        {/* Compteur total */}
                        {((bordereau.feuillesSoins || []).length + (bordereau.facturesSemelles || []).length) > 2 && (
                          <div className="text-gray-500 text-xs">
                            +{((bordereau.feuillesSoins || []).length + (bordereau.facturesSemelles || []).length) - 2} autre(s)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-bold text-primary-600">
                        {formaterMontant(calculerTotalBordereau(bordereau))}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedBordereau(bordereau)}
                          className="text-primary-600 hover:text-primary-900 transition-colors duration-200 p-3 rounded-lg hover:bg-primary-50"
                          title="Voir les détails"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onEditBordereau(bordereau)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-3 rounded-lg hover:bg-blue-50"
                          title="Modifier"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleOpenPDF(bordereau)}
                          className="text-green-600 hover:text-green-900 transition-colors duration-200 p-3 rounded-lg hover:bg-green-50"
                          title="Ouvrir en PDF"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleSavePDF(bordereau)}
                          className="text-purple-600 hover:text-purple-900 transition-colors duration-200 p-3 rounded-lg hover:bg-purple-50"
                          title="Télécharger en PDF"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteBordereau(bordereau.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200 p-3 rounded-lg hover:bg-red-50"
                          title="Supprimer"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de détails du bordereau */}
      {selectedBordereau && (
        <div className="modal-overlay" onClick={() => setSelectedBordereau(null)}>
          <div className="modal-content max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails du bordereau de remise
              </h3>
              <button
                onClick={() => setSelectedBordereau(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Informations bordereau */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Informations bordereau</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">N° Bordereau:</span> {selectedBordereau.numeroBordereau}</p>
                    <p><span className="font-medium">Date:</span> {new Date(selectedBordereau.date).toLocaleDateString('fr-FR')}</p>
                    <p><span className="font-medium">Modèle utilisé:</span> {selectedBordereau.modeleUtilise}</p>
                  </div>
                </div>

                {/* Statistiques */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Statistiques</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Nombre de feuilles de soins:</span> {(selectedBordereau.feuillesSoins || []).length}</p>
                    <p><span className="font-medium">Nombre total d'éléments:</span> {(selectedBordereau.feuillesSoins || []).length}</p>
                    <p><span className="font-medium">Nombre de patients:</span> {
                      new Set([
                        ...(selectedBordereau.feuillesSoins || []).map(f => f.patient_id)
                      ]).size
                    }</p>
                    <p><span className="font-medium">Montant total:</span> {formaterMontant(calculerTotalBordereau(selectedBordereau))}</p>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
                  <div className="space-y-2">

                    <button 
                      onClick={() => handleSavePDF(selectedBordereau)}
                      className="w-full btn-secondary text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Télécharger en PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Liste des éléments (feuilles de soins ou factures semelles) */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  {(selectedBordereau.facturesSemelles && selectedBordereau.facturesSemelles.length > 0) 
                    ? 'Factures semelles incluses' 
                    : 'Feuilles de soins incluses'
                  }
                </h4>
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Patient</th>
                        <th className="table-header-cell">
                          {(selectedBordereau.facturesSemelles && selectedBordereau.facturesSemelles.length > 0) 
                            ? 'N° Facture' 
                            : 'N° Feuille'
                          }
                        </th>
                        <th className="table-header-cell">Date prescription</th>
                        <th className="table-header-cell">Dates de soins</th>
                        <th className="table-header-cell">Actes</th>
                        <th className="table-header-cell">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {/* Affichage des feuilles de soins */}
                      {(selectedBordereau.feuillesSoins || []).map((feuille, index) => (
                        <tr key={index} className="table-row">
                          <td className="table-cell">
                            <div>
                              <div className="font-medium text-gray-900">
                                {feuille.patient?.prenom || ''} {feuille.patient?.nom || ''}
                              </div>
                              {/* DN n'est pas disponible dans la nouvelle structure */}
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className="font-mono">{feuille.numero_feuille}</span>
                          </td>
                          <td className="table-cell">
                            <div className="text-xs space-y-1">
                              {(feuille.actes || []).length > 0 ? (
                                (feuille.actes || []).map((acte, acteIndex) => (
                                  <div key={acteIndex} className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                      {new Date(acte.date).toLocaleDateString('fr-FR')}
                                    </span>
                                    {acte.ifd && <span className="text-blue-600 text-xs">IFD</span>}
                                    {acte.ik && <span className="text-green-600 text-xs">IK</span>}
                                    {acte.majorationDimanche && <span className="text-orange-600 text-xs">DIM</span>}
                                    {acte.majorationNuit && <span className="text-purple-600 text-xs">NUIT</span>}
                                  </div>
                                ))
                              ) : (
                                <span className="text-gray-400">Aucun acte</span>
                              )}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="text-xs space-y-1">
                              {(feuille.actes || []).length > 0 ? (
                                (feuille.actes || []).map((acte, acteIndex) => (
                                  <div key={acteIndex} className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                      {acte.lettreCle}
                                    </span>
                                    <div className="flex space-x-1">
                                      {acte.ifd && <span className="text-blue-600 text-xs">IFD</span>}
                                      {acte.ik && <span className="text-green-600 text-xs">IK</span>}
                                      {acte.majorationDimanche && <span className="text-orange-600 text-xs">DIM</span>}
                                      {acte.majorationNuit && <span className="text-purple-600 text-xs">NUIT</span>}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <span className="text-gray-400">Aucun acte</span>
                              )}
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className="badge badge-info">
                              {(() => {
                                const nombreActes = (feuille.actes || []).length;
                                return nombreActes >= 2 ? `${nombreActes} actes` : `${nombreActes} acte`;
                              })()}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className="font-semibold">{formaterMontant(calculerMontantFeuille(feuille))}</span>
                          </td>
                        </tr>
                      ))}
                      
                      {/* Affichage des factures semelles */}
                      {(selectedBordereau.facturesSemelles || []).map((facture, index) => (
                        <tr key={`facture-${index}`} className="table-row">
                          <td className="table-cell">
                            <div>
                              <div className="font-medium text-gray-900">
                                {facture.patient?.prenom || ''} {facture.patient?.nom || ''}
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className="font-mono">{facture.numeroFacture}</span>
                          </td>
                          <td className="table-cell">
                            <div className="text-xs space-y-1">
                              <span className="text-gray-600">
                                {new Date(facture.datePrescription).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="text-xs space-y-1">
                              <span className="text-gray-600">
                                {new Date(facture.dateSoins).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="text-xs space-y-1">
                              {(facture.actesOrthopediques || []).length > 0 ? (
                                (facture.actesOrthopediques || []).map((acte, acteIndex) => (
                                  <div key={acteIndex} className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                      {acte.codeLPPR}
                                    </span>
                                    <div className="flex space-x-1">
                                      <span className="text-blue-600 text-xs">{acte.quantite}x</span>
                                      <span className="text-green-600 text-xs">{acte.tauxApplique}%</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <span className="text-gray-400">Aucun acte</span>
                              )}
                              <div className="mt-1">
                                <span className="badge badge-success text-xs">
                                  {(() => {
                                    const nombreActes = (facture.actesOrthopediques || []).length;
                                    return nombreActes >= 2 ? `${nombreActes} actes` : `${nombreActes} acte`;
                                  })()}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className="font-semibold">{formaterMontant(calculerPartCPSFacture(facture))}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>


              {/* Résumé */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">
                      {(selectedBordereau.facturesSemelles && selectedBordereau.facturesSemelles.length > 0) 
                        ? 'Nombre de factures semelles:' 
                        : 'Nombre de feuilles de soins:'
                      }
                    </span>
                    <p className="text-lg font-bold text-gray-900">
                      {(selectedBordereau.facturesSemelles && selectedBordereau.facturesSemelles.length > 0) 
                        ? (() => {
                            const nombreFactures = (selectedBordereau.facturesSemelles || []).length;
                            return nombreFactures >= 2 ? `${nombreFactures} factures` : `${nombreFactures} facture`;
                          })()
                        : (() => {
                            const nombreFeuilles = (selectedBordereau.feuillesSoins || []).length;
                            return nombreFeuilles >= 2 ? `${nombreFeuilles} feuilles` : `${nombreFeuilles} feuille`;
                          })()
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Montant total:</span>
                    <p className="text-xl font-bold text-red-600">
                      {formaterMontant(calculerTotalBordereau(selectedBordereau))}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      {(selectedBordereau.facturesSemelles && selectedBordereau.facturesSemelles.length > 0) 
                        ? (() => {
                            const nombreFactures = (selectedBordereau.facturesSemelles || []).length;
                            return nombreFactures >= 2 ? `${nombreFactures} factures` : `${nombreFactures} facture`;
                          })()
                        : (() => {
                            const nombreFeuilles = (selectedBordereau.feuillesSoins || []).length;
                            return nombreFeuilles >= 2 ? `${nombreFeuilles} feuilles` : `${nombreFeuilles} feuille`;
                          })()
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setSelectedBordereau(null)}
                className="btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de prévisualisation d'impression */}
      {showPrintPreview && bordereauToPrint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Aperçu avant impression - Bordereau {bordereauToPrint.numeroBordereau}
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleSavePDF(bordereauToPrint)}
                  className="btn-secondary text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Sauvegarder
                </button>
                <button
                  onClick={handlePrint}
                  className="btn-primary text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Ouvrir en PDF
                </button>
                <button
                  onClick={handleClosePrintPreview}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="print-content" style={{ 
                width: '210mm', 
                height: '297mm', 
                margin: '0 auto',
                position: 'relative',
                backgroundColor: 'white',
                boxSizing: 'border-box',
                border: '1px solid #ccc'
              }}>
                {/* En-tête du bordereau */}
                <div style={{ 
                  position: 'absolute',
                  left: '20mm',
                  top: '20mm',
                  width: '170mm',
                  height: '30mm',
                  textAlign: 'center',
                  borderBottom: '2px solid #000'
                }}>
                  <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: '0' }}>
                    BORDEREAU DE REMISE
                  </h1>
                  <h2 style={{ fontSize: '18pt', margin: '5mm 0 0 0' }}>
                    {bordereauToPrint.numeroBordereau}
                  </h2>
                </div>

                {/* Encart du cabinet */}
                {state.configuration.parametres && (
                  <div style={{ 
                    position: 'absolute',
                    left: '20mm',
                    top: '60mm',
                    width: '170mm',
                    height: '25mm',
                    border: '1px solid #ccc',
                    borderRadius: '3mm',
                    padding: '3mm',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Informations du cabinet */}
                      <div style={{ fontSize: '10pt', lineHeight: '1.3' }}>
                        {state.configuration.parametres.nomCabinet && (
                          <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>
                            {state.configuration.parametres.nomCabinet}
                          </div>
                        )}
                        {state.configuration.parametres.adresse && (
                          <div style={{ marginBottom: '1mm' }}>
                            {state.configuration.parametres.adresse}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '5mm', fontSize: '9pt' }}>
                          {state.configuration.parametres.telephone && (
                            <span>📞 {state.configuration.parametres.telephone}</span>
                          )}
                          {state.configuration.parametres.email && (
                            <span>✉️ {state.configuration.parametres.email}</span>
                          )}
                        </div>
                        {state.configuration.parametres.identificationPraticien && (
                          <div style={{ fontSize: '8pt', color: '#666', marginTop: '1mm' }}>
                            ID Praticien: {state.configuration.parametres.identificationPraticien}
                            {state.configuration.parametres.auxiliaireMedicalRemplacant && (
                              <span style={{ marginLeft: '3mm', color: '#1976d2' }}>
                                (Auxiliaire médical remplaçant)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Logo du cabinet */}
                      {state.configuration.parametres.logo && (
                        <div style={{ 
                          width: '20mm', 
                          height: '20mm',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <img 
                            src={state.configuration.parametres.logo} 
                            alt="Logo du cabinet"
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Informations générales */}
                <div style={{ 
                  position: 'absolute',
                  left: '20mm',
                  top: '90mm',
                  width: '170mm',
                  height: '20mm'
                }}>
                  <div style={{ fontSize: '12pt', lineHeight: '1.5' }}>
                    <p><strong>Date de création:</strong> {new Date(bordereauToPrint.date).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Nombre de feuilles de soins:</strong> {(bordereauToPrint.feuillesSoins || []).length}</p>
                    <p><strong>Modèle utilisé:</strong> {bordereauToPrint.modeleUtilise}</p>
                  </div>
                </div>

                {/* Tableau des feuilles de soins */}
                <div style={{ 
                  position: 'absolute',
                  left: '20mm',
                  top: '115mm',
                  width: '170mm',
                  height: '130mm'
                }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '9pt'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #000', padding: '2px', textAlign: 'left', fontSize: '8pt' }}>Patient</th>
                        <th style={{ border: '1px solid #000', padding: '2px', textAlign: 'left', fontSize: '8pt' }}>N° Facture</th>
                        <th style={{ border: '1px solid #000', padding: '2px', textAlign: 'left', fontSize: '8pt' }}>Dates de soins</th>
                        <th style={{ border: '1px solid #000', padding: '2px', textAlign: 'right', fontSize: '8pt' }}>Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bordereauToPrint.feuillesSoins || []).map((feuille, index) => (
                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                          <td style={{ border: '1px solid #000', padding: '2px', fontSize: '8pt' }}>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>
                                {feuille.patient?.prenom || ''} {feuille.patient?.nom || ''}
                              </div>
                              {/* DN n'est pas disponible dans la nouvelle structure */}
                            </div>
                          </td>
                          <td style={{ border: '1px solid #000', padding: '2px', fontFamily: 'monospace', fontSize: '8pt' }}>
                            {feuille.numero_feuille}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '2px', fontSize: '7pt' }}>
                            {(feuille.actes || []).length > 0 ? (
                              <div style={{ lineHeight: '1.2' }}>
                                {(feuille.actes || []).map((acte, acteIndex) => (
                                  <div key={acteIndex} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    marginBottom: '1px'
                                  }}>
                                    <span>{new Date(acte.date).toLocaleDateString('fr-FR')}</span>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                      {acte.ifd && <span style={{ color: '#1976d2', fontSize: '6pt' }}>IFD</span>}
                                      {acte.ik && <span style={{ color: '#388e3c', fontSize: '6pt' }}>IK</span>}
                                      {acte.majorationDimanche && <span style={{ color: '#f57c00', fontSize: '6pt' }}>DIM</span>}
                                      {acte.majorationNuit && <span style={{ color: '#7b1fa2', fontSize: '6pt' }}>NUIT</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: '#999' }}>Aucun acte</span>
                            )}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'right', fontSize: '8pt' }}>
                            {formaterMontant(calculerMontantFeuille(feuille))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div style={{ 
                  position: 'absolute',
                  left: '120mm',
                  top: '255mm',
                  width: '70mm',
                  height: '25mm',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>
                    <p style={{ margin: '0', color: '#d32f2f' }}>
                      <strong>Total:</strong> {formaterMontant(calculerTotalBordereau(bordereauToPrint))}
                    </p>
                  </div>
                </div>

                {/* Pied de page */}
                <div style={{ 
                  position: 'absolute',
                  left: '20mm',
                  top: '280mm',
                  width: '170mm',
                  height: '17mm',
                  borderTop: '1px solid #ccc',
                  paddingTop: '3mm',
                  fontSize: '9pt',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  <p>Bordereau généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BordereauList; 
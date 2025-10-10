import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { FeuilleSoins } from '../../types';
import { CalculUtils } from '../../utils/calculs';

interface PrintPreviewPixelPerfectProps {
  feuille: FeuilleSoins;
  onClose: () => void;
}

const PrintPreviewPixelPerfect: React.FC<PrintPreviewPixelPerfectProps> = ({ feuille, onClose }) => {
  const { state } = useApp();

  // Fonction pour obtenir l'identifiant du médecin prescripteur
  const getMedecinIdentification = (medecinId: string): string => {
    const medecin = state.medecins.find(m => m.id === medecinId);
    return medecin?.identificationPrescripteur || '';
  };

  // Fonction pour formater les montants avec la devise configurée
  const formaterMontant = (montant: number): string => {
    return CalculUtils.formaterMontant(montant);
  };

  // Fonction pour formater la date
  const formaterDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  // Fonction pour afficher "X" si la case est cochée
  const afficherCase = (estCochee: boolean): string => {
    return estCochee ? 'X' : '';
  };

  // Calcul du total des actes
  const totalActes = feuille.actes.reduce((total, acte) => total + acte.montant, 0);

  // Fonction pour imprimer
  const handlePrint = () => {
    // Créer le HTML d'impression
    const printHTML = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Feuille de soins - ${feuille.patient?.nom || ''} ${feuille.patient?.prenom || ''}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
          }
          .document-title {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 10px;
            color: #1f2937;
          }
          .document-subtitle {
            font-size: 16px;
            text-align: center;
            margin-bottom: 30px;
            color: #374151;
          }
          .section {
            margin-bottom: 25px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 15px;
          }
          .row {
            display: flex;
            margin-bottom: 8px;
            align-items: center;
          }
          .label {
            font-weight: bold;
            min-width: 120px;
            color: #374151;
          }
          .value {
            margin-left: 10px;
            margin-right: 30px;
            color: #1f2937;
          }
          .checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            margin-left: 10px;
            margin-right: 30px;
          }
          .acts-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .acts-table th {
            background-color: #f3f4f6;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            color: #374151;
            border: 1px solid #d1d5db;
          }
          .acts-table td {
            padding: 8px 10px;
            text-align: center;
            color: #1f2937;
            border: 1px solid #d1d5db;
          }
          .acts-table .checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            margin: 0 auto;
          }
          .acts-table .amount {
            font-weight: bold;
            color: #dc2626;
          }
          .total-section {
            text-align: right;
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f9fafb;
            border-radius: 4px;
          }
          .total-label {
            font-weight: bold;
            font-size: 16px;
            color: #374151;
            margin-right: 15px;
          }
          .total-amount {
            font-weight: bold;
            font-size: 18px;
            color: #dc2626;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
          }
          @media print {
            body {
              margin: 0;
              padding: 15mm;
            }
            .section {
              page-break-inside: avoid;
            }
            .acts-table {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="document-title">FEUILLE DE SOINS</div>
        <div class="document-subtitle">Caisse Primaire d'Assurance Maladie</div>
        
        <div class="section">
          <div class="row">
            <span class="label">Nom :</span>
            <span class="value">${feuille.patient?.nom || ''}</span>
            <span class="label">Prénom :</span>
            <span class="value">${feuille.patient?.prenom || ''}</span>
          </div>
          <div class="row">
            <span class="label">DN :</span>
            <!-- DN et Date naissance ne sont pas disponibles dans la nouvelle structure -->
          </div>
          <div class="row">
            <span class="label">Adresse :</span>
            <!-- Adresse n'est pas disponible dans la nouvelle structure -->
          </div>
        </div>
        
        <div class="section">
          <div class="row">
            <span class="label">Médecin :</span>
            <span class="value">${getMedecinIdentification(feuille.medecinPrescripteur)}</span>
            <span class="label">Date prescription :</span>
            <span class="value">${formaterDate(feuille.datePrescription)}</span>
          </div>
          <div class="row">
            <span class="label">Parcours de soins :</span>
            <span class="checkbox">${afficherCase(feuille.parcoursSoins || false)}</span>
            <span class="label">Longue maladie :</span>
            <span class="checkbox">${afficherCase(feuille.conditions?.longueMaladie || false)}</span>
          </div>
        </div>
        
        <table class="acts-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>AMP</th>
              <th>Coefficient</th>
              <th>IFD</th>
              <th>IK</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            ${feuille.actes.map((acte, index) => `
              <tr>
                <td>${formaterDate(acte.date)}</td>
                <td>${acte.lettreCle}</td>
                <td>${acte.coefficient}</td>
                <td><div class="checkbox">${afficherCase(acte.ifd || false)}</div></td>
                <td><div class="checkbox">${afficherCase(Boolean(acte.ik))}</div></td>
                <td class="amount">${formaterMontant(acte.montant)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total-section">
          <span class="total-label">MONTANT TOTAL :</span>
          <span class="total-amount">${formaterMontant(totalActes)}</span>
        </div>
        
        <div class="footer">
          Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
        </div>
      </body>
      </html>
    `;

    // Ouvrir une nouvelle fenêtre avec le HTML d'impression
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      // Attendre que le contenu soit chargé puis imprimer
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      // Fallback si popup bloqué
      alert('Veuillez autoriser les popups pour l\'impression');
    }
  };

  // Fonction pour sauvegarder en PDF
  const handleSavePDF = () => {
    console.log('Sauvegarde PDF à implémenter');
  };

  return (
    <div className="print-preview-overlay">
      <div className="print-preview-modal">
        {/* En-tête avec boutons d'action */}
        <div className="print-preview-header">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Aperçu d'impression - Feuille de soins
            </h2>
            <p className="text-sm text-gray-600">
              Modèle optimisé pour utiliser toute la page A4
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="btn-primary text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimer
            </button>
            <button
              onClick={handleSavePDF}
              className="btn-secondary text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Sauvegarder PDF
            </button>
            <button
              onClick={onClose}
              className="btn-secondary text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Fermer
            </button>
          </div>
        </div>

        {/* Contenu de l'aperçu */}
        <div className="print-preview-content">
          {/* Zone d'impression pixel-perfect simplifiée */}
          <div className="print-content-simple">
            {/* Titre principal */}
            <div className="document-title">
              FEUILLE DE SOINS
            </div>
            
            {/* Sous-titre */}
            <div className="document-subtitle">
              Caisse Primaire d'Assurance Maladie
            </div>

            {/* Informations patient */}
            <div className="patient-section">
              <div className="patient-row">
                <span className="label">Nom :</span>
                <span className="value">{feuille.patient?.nom || ''}</span>
                <span className="label">Prénom :</span>
                <span className="value">{feuille.patient?.prenom || ''}</span>
              </div>
              <div className="patient-row">
                <span className="label">DN :</span>
                {/* DN et Date naissance ne sont pas disponibles dans la nouvelle structure */}
              </div>
              <div className="patient-row">
                <span className="label">Adresse :</span>
                {/* Adresse n'est pas disponible dans la nouvelle structure */}
              </div>
            </div>

            {/* Informations médecin */}
            <div className="doctor-section">
              <div className="doctor-row">
                <span className="label">Médecin :</span>
                <span className="value">{getMedecinIdentification(feuille.medecinPrescripteur)}</span>
                <span className="label">Date prescription :</span>
                <span className="value">{formaterDate(feuille.datePrescription)}</span>
              </div>
              <div className="doctor-row">
                <span className="label">Parcours de soins :</span>
                <span className="checkbox">{afficherCase(feuille.parcoursSoins || false)}</span>
                <span className="label">Longue maladie :</span>
                <span className="checkbox">{afficherCase(feuille.conditions?.longueMaladie || false)}</span>
              </div>
            </div>

            {/* Tableau des actes */}
            <div className="acts-section">
              <div className="acts-header">
                <div className="header-cell">Date</div>
                <div className="header-cell">AMP</div>
                <div className="header-cell">Coefficient</div>
                <div className="header-cell">IFD</div>
                <div className="header-cell">IK</div>
                <div className="header-cell">Montant</div>
              </div>
              
              {feuille.actes.map((acte, index) => (
                <div key={index} className="act-row">
                  <div className="act-cell">{formaterDate(acte.date)}</div>
                  <div className="act-cell">{acte.lettreCle}</div>
                  <div className="act-cell">{acte.coefficient}</div>
                  <div className="act-cell checkbox">{afficherCase(acte.ifd || false)}</div>
                  <div className="act-cell checkbox">{afficherCase(Boolean(acte.ik))}</div>
                  <div className="act-cell amount">{formaterMontant(acte.montant)}</div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="total-section">
              <span className="total-label">MONTANT TOTAL :</span>
              <span className="total-amount">{formaterMontant(totalActes)}</span>
            </div>

            {/* Pied de page */}
            <div className="footer">
              Document généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
            </div>
          </div>

          {/* Grille de débogage (visible uniquement en mode aperçu) */}
          <div className="debug-grid">
            <div className="debug-info">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Informations de débogage</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Patient :</strong> {feuille.patient?.prenom || ''} {feuille.patient?.nom || ''}</p>
                {/* DN n'est pas disponible dans la nouvelle structure */}
                <p><strong>Date prescription :</strong> {formaterDate(feuille.datePrescription)}</p>
                <p><strong>Nombre d'actes :</strong> {feuille.actes.length}</p>
                <p><strong>Total :</strong> {formaterMontant(totalActes)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreviewPixelPerfect; 
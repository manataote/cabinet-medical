import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { FactureSemelles } from '../../types';
import { CalculUtils } from '../../utils/calculs';
import { CurrentView } from '../../types/navigation';

interface FactureSemellesListProps {
  onNavigate: (view: CurrentView) => void;
  onEditFacture: (facture: FactureSemelles) => void;
}

const FactureSemellesList: React.FC<FactureSemellesListProps> = ({ onNavigate, onEditFacture }) => {
  const { state, deleteFactureSemelles } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacture, setSelectedFacture] = useState<FactureSemelles | null>(null);
  
  // État pour afficher ou non les factures semelles qui ont déjà un bordereau (par défaut: masquées)
  const [showFacturesAvecBordereau, setShowFacturesAvecBordereau] = useState(false);

  // Debug: Log des factures semelles
  React.useEffect(() => {
    console.log('🔍 FactureSemellesList: Factures semelles dans le state:', {
      count: state.facturesSemelles?.length || 0,
      factures: state.facturesSemelles?.map(f => ({ id: f.id, numeroFacture: f.numeroFacture }))
    });
  }, [state.facturesSemelles]);

  // Fonction pour formater les montants
  // const formaterMontant = (montant: number): string => {
  //   return CalculUtils.formaterMontant(montant);
  // };

  // Fonction pour générer le PDF avec jsPDF (modèle professionnel podologue)
  const handlePrintDirect = async (facture: FactureSemelles) => {
    try {
      console.log('Début de la génération PDF pour la facture:', facture);
      
      // Vérification des données de la facture
      if (!facture) {
        throw new Error('Facture non définie');
      }
      
      if (!facture.patient) {
        throw new Error('Patient non défini');
      }
      
      console.log('Import de jsPDF...');
      const jsPDF = await import('jspdf');
      console.log('jsPDF importé avec succès');
      
      console.log('Création du document PDF...');
      const doc = new jsPDF.default('p', 'mm', 'a4');
      console.log('Document PDF créé');
      
      console.log('Configuration de la police...');
      doc.setFont('arial', 'normal');

      // 1. EN-TÊTE - INFORMATIONS CABINET (gauche)
      console.log('Ajout de l\'en-tête...');
      let yPos = 15;
      
      // Nom du praticien (police agrandie)
      doc.setFontSize(16);
      doc.setFont('arial', 'bold');
      doc.text('Thibaud Carré - Podologue D.E.', 15, yPos);
      yPos += 8;
      
      // Spécialisation (police agrandie)
      doc.setFontSize(12);
      doc.setFont('arial', 'normal');
      doc.text('Podologue du Sport D.U.', 15, yPos);
      yPos += 6;
      
      // Adresse (police agrandie)
      doc.setFontSize(11);
      doc.text('Centre médical St Etienne, PK 12,1 Punaaula', 15, yPos);
      yPos += 5;
      
      // Contact (police agrandie)
      doc.text('Tél: 87 27 85 78', 15, yPos);
      yPos += 5;
      doc.text('Email: tc.podologue@gmail.com', 15, yPos);

      // 2. TITRE FACTURE (droite)
      console.log('Ajout du titre facture...');
      doc.setFontSize(24);
      doc.setFont('arial', 'bold');
      doc.setTextColor(0, 0, 255); // Bleu
      doc.text('FACTURE', 140, 20);
      
      // Informations facture (police agrandie)
      console.log('Ajout des informations facture...');
      doc.setFontSize(12);
      doc.setFont('arial', 'normal');
      doc.setTextColor(0, 0, 0); // Noir
      doc.text(`N° FACTURE: ${facture.numeroFacture || 'N/A'}`, 140, 32);
      
      // Gestion sécurisée de la date
      let dateSoins = 'N/A';
      try {
        if (facture.dateSoins) {
          const date = facture.dateSoins instanceof Date ? facture.dateSoins : new Date(facture.dateSoins);
          dateSoins = date.toLocaleDateString('fr-FR');
        }
      } catch (error) {
        console.error('Erreur lors du formatage de la date:', error);
        dateSoins = 'Date invalide';
      }
      doc.text(`Date: ${dateSoins}`, 140, 38);
      doc.text('CODE PROFESSIONNEL: A22', 140, 44);

      // 3. IDENTITÉ DU PATIENT
      yPos = 60;
      doc.setFontSize(14);
      doc.setFont('arial', 'bold');
      doc.text('IDENTITÉ DU PATIENT', 15, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.setFont('arial', 'normal');
      doc.text(`NOM: ${facture.patient.nom}`, 15, yPos);
      doc.text(`Prénom: ${facture.patient.prenom}`, 80, yPos);
      yPos += 8;
      doc.text(`DDN: ${facture.patient.dn}`, 15, yPos);
      doc.text(`DN: ${facture.patient.numeroFacture || 'N/A'}`, 80, yPos);

      // 4. IDENTITÉ DU MÉDECIN PRESCRIPTEUR
      yPos += 15;
      doc.setFontSize(14);
      doc.setFont('arial', 'bold');
      doc.text('MÉDECIN PRESCRIPTEUR', 15, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.setFont('arial', 'normal');
      
      // Récupérer les informations du médecin prescripteur
      const medecinPrescripteur = facture.medecinPrescripteur || state.medecins.find(m => m.id === facture.medecin_id);
      if (medecinPrescripteur) {
        doc.text(`Nom: ${medecinPrescripteur.nom}`, 15, yPos);
        doc.text(`Prénom: ${medecinPrescripteur.prenom}`, 80, yPos);
        yPos += 8;
        doc.text(`Identifiant: ${medecinPrescripteur.identificationPrescripteur}`, 15, yPos);
      } else {
        doc.text(`Nom: N/A`, 15, yPos);
      }
      
      // Date de prescription
      yPos += 8;
      let datePrescription = 'N/A';
      try {
        if (facture.datePrescription) {
          const date = facture.datePrescription instanceof Date ? facture.datePrescription : new Date(facture.datePrescription);
          datePrescription = date.toLocaleDateString('fr-FR');
        }
      } catch (error) {
        console.error('Erreur lors du formatage de la date de prescription:', error);
        datePrescription = 'Date invalide';
      }
      doc.text(`Date de prescription: ${datePrescription}`, 15, yPos);

      // 5. TABLEAU DES SERVICES
      yPos += 15;
      doc.setFontSize(14);
      doc.setFont('arial', 'bold');
      doc.text('SERVICES', 15, yPos);
      yPos += 10;
      
      // En-têtes du tableau (police agrandie)
      doc.setFontSize(12);
      doc.setFont('arial', 'bold');
      doc.text('Libellé', 15, yPos);
      doc.text('Code LPPR', 100, yPos);
      doc.text('Quantité', 150, yPos);
      yPos += 8;
      
      // Ligne de séparation
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(15, yPos, 180, yPos);
      yPos += 8;

      // Données des actes
      console.log('Actes orthopédiques:', facture.actesOrthopediques);
      try {
        if (facture.actesOrthopediques && facture.actesOrthopediques.length > 0) {
          (facture.actesOrthopediques || []).forEach((acte, index) => {
            console.log(`Acte ${index}:`, acte);
            doc.setFont('arial', 'normal');
            doc.setFontSize(11);
            doc.text(acte.libelleFacture || acte.libelleInterne || 'Libellé non défini', 15, yPos);
            doc.text(acte.codeLPPR || 'N/A', 100, yPos);
            doc.text((acte.quantite || 0).toString(), 150, yPos);
            yPos += 8;
          });
        } else {
          console.log('Aucun acte orthopédique trouvé');
          doc.setFont('arial', 'normal');
          doc.setFontSize(11);
          doc.text('Aucun acte orthopédique', 15, yPos);
          yPos += 8;
        }
      } catch (error) {
        console.error('Erreur lors de l\'ajout des actes:', error);
        doc.setFont('arial', 'normal');
        doc.setFontSize(11);
        doc.text('Erreur lors du chargement des actes', 15, yPos);
        yPos += 8;
      }

      // 6. TABLEAU FINANCIER
      yPos += 15;
      doc.setFontSize(14);
      doc.setFont('arial', 'bold');
      doc.text('DÉTAILS FINANCIERS', 15, yPos);
      yPos += 10;
      
      // Calcul des totaux
      console.log('Calcul des totaux...');
      let totalCPS = 0;
      let totalPatient = 0;
      let totalGeneral = 0;
      let tarifBaseLPPR = 0;
      let tauxApplique = 100;
      let regime = 'maladie';
      
      try {
        totalCPS = (facture.actesOrthopediques || []).reduce((sum, acte) => {
          const partCPS = acte.partCPS || 0;
          console.log(`Part CPS de l'acte: ${partCPS}`);
          return sum + partCPS;
        }, 0);
        totalPatient = (facture.actesOrthopediques || []).reduce((sum, acte) => {
          const partPatient = acte.partPatient || 0;
          console.log(`Part Patient de l'acte: ${partPatient}`);
          return sum + partPatient;
        }, 0);
        totalGeneral = totalCPS + totalPatient;
        
        // Récupérer les données du premier acte pour les détails
        if (facture.actesOrthopediques && facture.actesOrthopediques.length > 0) {
          const acte = facture.actesOrthopediques[0];
          tarifBaseLPPR = acte.tarifBaseLPPR || 0;
          tauxApplique = acte.tauxApplique || 100;
          regime = acte.regime || 'maladie';
        }
        
        console.log(`Total CPS: ${totalCPS}, Total Patient: ${totalPatient}, Total Général: ${totalGeneral}`);
      } catch (error) {
        console.error('Erreur lors du calcul des totaux:', error);
        totalCPS = 0;
        totalPatient = 0;
        totalGeneral = 0;
      }
      
      // Fonction pour formater les montants en XPF sans décimales
      const formaterMontantXPF = (montant: number): string => {
        return Math.round(montant).toString();
      };
      
      // Tableau des détails financiers
      const details = [
        { label: 'Total:', value: `${formaterMontantXPF(totalGeneral)} XPF` },
        { label: 'Part CPS:', value: `${formaterMontantXPF(totalCPS)} XPF` },
        { label: 'Part Patient:', value: `${formaterMontantXPF(totalPatient)} XPF` },
        { label: 'Tarif de base LPPR:', value: `${formaterMontantXPF(tarifBaseLPPR)} XPF` },
        { label: 'Taux appliqué:', value: `${tauxApplique}%` },
        { label: 'Régime:', value: regime }
      ];
      
      // Dessiner le tableau
      const startX = 15;
      const startY = yPos;
      const colWidth = 80;
      const rowHeight = 8;
      
      // En-têtes du tableau
      doc.setFontSize(12);
      doc.setFont('arial', 'bold');
      doc.text('DÉTAIL', startX, startY);
      doc.text('VALEUR', startX + colWidth, startY);
      
      // Ligne de séparation
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(startX, startY + 2, startX + colWidth * 2, startY + 2);
      
      // Données du tableau
      doc.setFontSize(11);
      doc.setFont('arial', 'normal');
      details.forEach((detail, index) => {
        const y = startY + 5 + (index + 1) * rowHeight;
        doc.text(detail.label, startX, y);
        doc.text(detail.value, startX + colWidth, y);
      });
      
      yPos = startY + 5 + details.length * rowHeight + 10;

      // 7. PIED DE PAGE (centré)
      // Positionner le pied de page après le tableau financier
      yPos += 10; // Espacement réduit après le tableau pour remonter le pied de page
      doc.setFontSize(10);
      doc.setFont('arial', 'normal');
      
      // Centrer le texte
      const pageWidth = 210; // Largeur A4 en mm
      const text1 = 'Pour toute question concernant cette facture, veuillez me contacter directement.';
      const text2 = 'Accepte les règlements par chèque, espèces et virements';
      const text3 = 'IBAN FR76 1416 8000 0110 0167 5690 115';
      const text4 = 'Code B.I.C: OFTPPFT1XXX';
      
      // Calculer la position centrée pour chaque ligne
      const centerX = pageWidth / 2;
      
      doc.text(text1, centerX - (doc.getTextWidth(text1) / 2), yPos);
      yPos += 8;
      doc.text(text2, centerX - (doc.getTextWidth(text2) / 2), yPos);
      yPos += 8;
      doc.text(text3, centerX - (doc.getTextWidth(text3) / 2), yPos);
      yPos += 6;
      doc.text(text4, centerX - (doc.getTextWidth(text4) / 2), yPos);

      // Ouvrir le PDF dans un nouvel onglet
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      // Nettoyer l'URL après un délai
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      console.error('Type d\'erreur:', typeof error);
      console.error('Message d\'erreur:', error instanceof Error ? error.message : 'Erreur inconnue');
      console.error('Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
      alert(`Erreur lors de la génération du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  // Fonction pour télécharger le PDF (identique à handlePrintDirect)
  const handleDownloadPDF = async (facture: FactureSemelles) => {
    // Utiliser la même logique que handlePrintDirect mais avec téléchargement
    await handlePrintDirect(facture);
  };

  // Filtrage des factures
  const filteredFactures = state.facturesSemelles.filter(facture => {
    const searchLower = searchTerm.toLowerCase();
    
    // Filtre de recherche
    const matchesSearch = facture.patient.nom.toLowerCase().includes(searchLower) ||
      facture.patient.prenom.toLowerCase().includes(searchLower) ||
      facture.numeroFacture.toLowerCase().includes(searchLower);
    
    // Filtre bordereau : si showFacturesAvecBordereau est false, exclure les factures avec bordereau_id
    const matchesBordereauFilter = showFacturesAvecBordereau || !facture.bordereau_id;
    
    return matchesSearch && matchesBordereauFilter;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures de semelles</h1>
          <p className="text-gray-600">Gestion des factures de semelles orthopédiques</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            {(() => {
              const nombreFactures = filteredFactures.length;
              return nombreFactures >= 2 ? `${nombreFactures} factures` : `${nombreFactures} facture`;
            })()} trouvée(s)
          </div>
          <button
            onClick={() => onNavigate('facture-semelles-form')}
            className="btn-primary"
          >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouvelle facture
        </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher une facture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showFacturesAvecBordereau}
              onChange={(e) => setShowFacturesAvecBordereau(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Afficher les factures avec bordereau</span>
          </label>
        </div>
        <div className="text-sm text-gray-500">
          {filteredFactures.length} facture(s) trouvée(s)
        </div>
      </div>

      {/* Liste des factures */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell" style={{width: '18%'}}>Patient</th>
                <th className="table-header-cell" style={{width: '14%'}}>N° Facture</th>
                <th className="table-header-cell" style={{width: '8%'}}>Actes</th>
                <th className="table-header-cell" style={{width: '14%'}}>Montant total</th>
                <th className="table-header-cell" style={{width: '14%'}}>Part CPS</th>
                <th className="table-header-cell" style={{width: '14%'}}>Part Patient</th>
                <th className="table-header-cell" style={{width: '18%'}}>Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredFactures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-8 text-gray-500">
                    Aucune facture trouvée
                  </td>
                </tr>
              ) : (
                filteredFactures.map((facture) => (
                  <tr key={facture.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-gray-900">
                          {facture.patient.prenom} {facture.patient.nom}
                        </p>
                        <p className="text-sm text-gray-500">DN: {facture.patient.dn}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-mono">{facture.numeroFacture}</span>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-info">
                        {(() => {
                          const nombreActes = (facture.actesOrthopediques || []).length;
                          return nombreActes >= 2 ? `${nombreActes} actes` : `${nombreActes} acte`;
                        })()}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold">{CalculUtils.formaterMontant(facture.montantTotal)}</span>
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-blue-600">
                        {CalculUtils.formaterMontant(
                          (facture.actesOrthopediques || []).reduce((total, acte) => total + (acte.partCPS || 0), 0)
                        )}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-green-600">
                        {CalculUtils.formaterMontant(
                          (facture.actesOrthopediques || []).reduce((total, acte) => total + (acte.partPatient || 0), 0)
                        )}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-1 flex-wrap">
                        <button
                          onClick={() => setSelectedFacture(facture)}
                          className="text-primary-600 hover:text-primary-900 transition-colors duration-200 p-2 rounded-lg hover:bg-primary-50"
                          title="Voir les détails"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onEditFacture(facture)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-2 rounded-lg hover:bg-blue-50"
                          title="Modifier"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePrintDirect(facture)}
                          className="text-green-600 hover:text-green-900 transition-colors duration-200 p-2 rounded-lg hover:bg-green-50"
                          title="Ouvrir en PDF"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(facture)}
                          className="text-purple-600 hover:text-purple-900 transition-colors duration-200 p-2 rounded-lg hover:bg-purple-50"
                          title="Télécharger en PDF"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
                              try {
                                await deleteFactureSemelles(facture.id);
                              } catch (error) {
                                console.error('Erreur lors de la suppression de la facture:', error);
                                alert('Erreur lors de la suppression de la facture');
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200 p-2 rounded-lg hover:bg-red-50"
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

      {/* Modal de détails */}
      {selectedFacture && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="modal-header">
              <h3 className="modal-title">Détails de la facture</h3>
              <button
                onClick={() => setSelectedFacture(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations patient */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Informations patient</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Nom:</span> {selectedFacture.patient.nom}</p>
                    <p><span className="font-medium">Prénom:</span> {selectedFacture.patient.prenom}</p>
                    <p><span className="font-medium">Date de naissance:</span> {selectedFacture.patient.dn}</p>
                    <p><span className="font-medium">Téléphone:</span> {selectedFacture.patient.telephone}</p>
                  </div>
                </div>

                {/* Informations facture */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Informations facture</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">N° Facture:</span> {selectedFacture.numeroFacture}</p>
                  </div>
                </div>
              </div>

              {/* Actes orthopédiques */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Actes orthopédiques ({(selectedFacture.actesOrthopediques || []).length})</h4>
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Libellé facture</th>
                        <th className="table-header-cell">Code LPPR</th>
                        <th className="table-header-cell">Quantité</th>
                        <th className="table-header-cell">Total</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {(selectedFacture.actesOrthopediques || []).map((acte, index) => (
                        <tr key={index} className="table-row">
                          <td className="table-cell">{acte.libelleFacture}</td>
                          <td className="table-cell">{acte.codeLPPR}</td>
                          <td className="table-cell">{acte.quantite}</td>
                          <td className="table-cell font-semibold">
                            {CalculUtils.formaterMontant(acte.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totaux */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Montant total:</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {CalculUtils.formaterMontant(selectedFacture.montantTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setSelectedFacture(null)}
                className="btn-secondary"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setSelectedFacture(null);
                  onEditFacture(selectedFacture);
                }}
                className="btn-primary"
              >
                Modifier
              </button>
              <button
                onClick={() => handlePrintDirect(selectedFacture)}
                className="btn-primary"
              >
                Ouvrir en PDF
              </button>
              <button
                onClick={() => handleDownloadPDF(selectedFacture)}
                className="btn-primary"
              >
                Télécharger en PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactureSemellesList; 
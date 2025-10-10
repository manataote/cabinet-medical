import React, { useRef } from 'react';
import { FeuilleSoins } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { CalculUtils } from '../../utils/calculs';

interface PrintPreviewProps {
  feuille: FeuilleSoins;
  onClose: () => void;
  onPrint: () => void;
  onSavePDF: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ feuille, onClose, onPrint, onSavePDF }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { state } = useApp();

  // Fonction pour formater le montant selon la devise configurée
  const formatMontant = (montant: number): string => {
    return CalculUtils.formaterMontant(montant);
  };

  // Fonction pour calculer le montant total
  const calculerMontantTotal = (): number => {
    return feuille.actes.reduce((total, acte) => {
      // Utiliser le montant déjà calculé et stocké dans l'acte
      return total + (acte.montant || 0);
    }, 0);
  };

  // Récupérer le nom du médecin prescripteur
  const getMedecinPrescripteur = (): string => {
    const medecin = state.medecins.find(m => m.id === feuille.medecinPrescripteur);
    if (medecin) {
      return `Dr. ${medecin.prenom} ${medecin.nom} - ${medecin.identificationPrescripteur || 'N/A'}`;
    }
    return feuille.medecinPrescripteur || 'Non spécifié';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Aperçu avant impression - Feuille de soins
            </h3>
            <p className="text-sm text-gray-500">
              Modèle optimisé pour utiliser toute la page A4
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onSavePDF}
              className="btn-secondary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Sauvegarder PDF
            </button>
            <button
              onClick={onPrint}
              className="btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimer
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-2 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div ref={printRef} className="print-content" style={{ 
            width: '210mm', 
            height: '297mm', 
            margin: '0 auto',
            position: 'relative',
            backgroundColor: 'white',
            boxSizing: 'border-box',
            border: '1px solid #ccc'
          }}>
            {/* Grille de référence pour le debug */}
            {process.env.NODE_ENV === 'development' && (
              <div className="debug-grid">
                {/* Lignes horizontales tous les 10mm */}
                {Array.from({ length: 30 }, (_, i) => (
                  <div key={`h-${i}`} className="grid-line horizontal" 
                       style={{ top: `${i * 10 * 3.7795275591}px` }}>
                    <span className="grid-label" style={{ left: '0px', top: '0px' }}>
                      {i * 10}mm
                    </span>
                  </div>
                ))}
                {/* Lignes verticales tous les 10mm */}
                {Array.from({ length: 22 }, (_, i) => (
                  <div key={`v-${i}`} className="grid-line vertical" 
                       style={{ left: `${i * 10 * 3.7795275591}px` }}>
                    <span className="grid-label" style={{ top: '0px', left: '0px' }}>
                      {i * 10}mm
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* En-tête principal */}
            <div className="zone zone-titre" style={{
              position: 'absolute',
              left: '5mm',
              top: '5mm',
              width: '200mm',
              height: '20mm',
              textAlign: 'center',
              fontSize: '22pt',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              FEUILLE DE SOINS
            </div>

            <div className="zone zone-sous-titre" style={{
              position: 'absolute',
              left: '5mm',
              top: '28mm',
              width: '200mm',
              height: '12mm',
              textAlign: 'center',
              fontSize: '14pt',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              Caisse Primaire d'Assurance Maladie
            </div>

            {/* Informations patient (gauche) */}
            <div className="zone zone-patient" style={{
              position: 'absolute',
              left: '5mm',
              top: '45mm',
              width: '95mm',
              height: '65mm'
            }}>
              <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '3mm' }}>
                INFORMATIONS PATIENT
              </div>
              <div style={{ fontSize: '12pt', lineHeight: '1.8' }}>
                <div style={{ marginBottom: '2mm' }}><strong>Nom :</strong> {feuille.patient?.nom || ''}</div>
                <div style={{ marginBottom: '2mm' }}><strong>Prénom :</strong> {feuille.patient?.prenom || ''}</div>
                {/* DN, Adresse et Téléphone ne sont pas disponibles dans la nouvelle structure */}
              </div>
            </div>

            {/* Informations feuille (droite) */}
            <div className="zone zone-feuille" style={{
              position: 'absolute',
              left: '105mm',
              top: '45mm',
              width: '95mm',
              height: '65mm'
            }}>
              <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '3mm' }}>
                INFORMATIONS FEUILLE
              </div>
              <div style={{ fontSize: '12pt', lineHeight: '1.8' }}>
                <div style={{ marginBottom: '2mm' }}><strong>Numéro :</strong> {feuille.numeroFeuilleSoins}</div>
                <div style={{ marginBottom: '2mm' }}><strong>Date :</strong> {new Date(feuille.datePrescription).toLocaleDateString('fr-FR')}</div>
                <div style={{ marginBottom: '2mm' }}><strong>Médecin :</strong> {getMedecinPrescripteur()}</div>
                <div style={{ marginBottom: '2mm' }}><strong>Parcours de soins :</strong> {feuille.parcoursSoins ? 'Oui' : 'Non'}</div>
              </div>
            </div>

            {/* Tableau des actes */}
            <div className="zone zone-actes" style={{
              position: 'absolute',
              left: '5mm',
              top: '115mm',
              width: '200mm',
              height: '150mm'
            }}>
              <div style={{ fontSize: '13pt', fontWeight: 'bold', marginBottom: '3mm' }}>
                ACTES MÉDICAUX ({feuille.actes.length})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Date</th>
                    <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Lettre clé</th>
                    <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Coefficient</th>
                    <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>IFD</th>
                    <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>IK</th>
                    <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {feuille.actes.map((acte, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                      <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>
                        {new Date(acte.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>
                        {acte.lettreCle}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>
                        {acte.coefficient}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>
                        {acte.ifd ? 'Oui' : 'Non'}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>
                        {acte.ik ? 'Oui' : 'Non'}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>
                        {formatMontant(acte.montant)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="zone zone-total" style={{
              position: 'absolute',
              left: '105mm',
              top: '270mm',
              width: '95mm',
              height: '25mm'
            }}>
              <div style={{ fontSize: '13pt', fontWeight: 'bold', marginBottom: '3mm' }}>
                MONTANT TOTAL
              </div>
              <div style={{ fontSize: '16pt', fontWeight: 'bold', textAlign: 'right', color: '#d32f2f' }}>
                {formatMontant(calculerMontantTotal())}
              </div>
            </div>

            {/* Pied de page */}
            <div className="zone zone-pied-page" style={{
              position: 'absolute',
              left: '5mm',
              top: '290mm',
              width: '200mm',
              height: '12mm',
              textAlign: 'center',
              fontSize: '9pt',
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderTop: '1px solid #ccc',
              paddingTop: '2mm'
            }}>
              Document généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreview; 
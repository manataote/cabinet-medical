import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Ordonnance } from '../../types';
import { OrdonnancesService } from '../../services/ordonnancesService';

interface OrdonnanceListProps {
  patientId: string;
  onAddOrdonnance: () => void;
  onEditOrdonnance: (ordonnance: Ordonnance) => void;
}

const OrdonnanceList: React.FC<OrdonnanceListProps> = ({ patientId, onAddOrdonnance, onEditOrdonnance }) => {
  const { state, deleteOrdonnance } = useApp();
  const [selectedOrdonnance, setSelectedOrdonnance] = useState<Ordonnance | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const patientOrdonnances = state.ordonnances.filter(o => o.patient_id === patientId);
  
  const ordonnancesSoins = patientOrdonnances.filter(o => o.type === 'soins');
  const ordonnancesSemelles = patientOrdonnances.filter(o => o.type === 'semelles');

  // Fonction helper pour obtenir l'URL d'une ordonnance
  const getOrdonnanceUrl = (ordonnance: Ordonnance): string | null => {
    return OrdonnancesService.getOrdonnanceFileUrl(ordonnance);
  };

  const handleDeleteOrdonnance = (ordonnanceId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ordonnance ?')) {
      deleteOrdonnance(ordonnanceId);
    }
  };

  const handleViewFile = (ordonnance: Ordonnance) => {
    const fileUrl = getOrdonnanceUrl(ordonnance);
    if (!fileUrl) {
      alert('Aucun fichier à visualiser pour cette ordonnance.');
      return;
    }
    setSelectedOrdonnance(ordonnance);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedOrdonnance(null);
  };

  const getMedecinName = (ordonnance: Ordonnance) => {
    if (ordonnance.medecin) {
      return `Dr. ${ordonnance.medecin.prenom} ${ordonnance.medecin.nom}`;
    }
    const medecin = state.medecins.find(m => m.id === ordonnance.medecin_prescripteur);
    return medecin ? `Dr. ${medecin.prenom} ${medecin.nom}` : 'Médecin inconnu';
  };

  const getOrdonnanceTypeLabel = (ordonnance: Ordonnance) => {
    if (ordonnance.type === 'semelles') {
      return `Semelles (${ordonnance.quantite || 1} paire${ordonnance.quantite && ordonnance.quantite > 1 ? 's' : ''})`;
    } else {
      return `${ordonnance.duree_soins} mois`;
    }
  };

  const getOrdonnanceTypeColor = (ordonnance: Ordonnance) => {
    return ordonnance.type === 'semelles' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Inconnue';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePrintOrdonnance = (ordonnance: Ordonnance) => {
    const fileUrl = getOrdonnanceUrl(ordonnance);
    if (!fileUrl) {
      alert('Aucun fichier à imprimer pour cette ordonnance.');
      return;
    }

    // Déterminer le type de fichier
    const isImage = ordonnance.type_fichier?.startsWith('image/') || 
                   ordonnance.nom_fichier?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|tiff)$/);
    const isPDF = ordonnance.type_fichier === 'application/pdf' || 
                  ordonnance.nom_fichier?.toLowerCase().endsWith('.pdf');

    if (isPDF) {
      // Pour les PDF, ouvrir directement dans une nouvelle fenêtre
      window.open(fileUrl, '_blank');
    } else if (isImage) {
      // Pour les images, créer une fenêtre optimisée pour l'impression
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Impression - ${ordonnance.nom_fichier || 'Ordonnance'}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body { 
                background: white;
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
              }
              .controls {
                background: #f8f9fa;
                padding: 15px;
                text-align: center;
                border-bottom: 1px solid #dee2e6;
                flex-shrink: 0;
              }
              .controls button {
                margin: 0 10px;
                padding: 10px 20px;
                font-size: 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                color: white;
                font-weight: bold;
              }
              .print-btn { 
                background: #28a745; 
              }
              .print-btn:hover {
                background: #218838;
              }
              .close-btn { 
                background: #6c757d; 
              }
              .close-btn:hover {
                background: #5a6268;
              }
              .image-container { 
                flex: 1;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                background: #f8f9fa;
              }
              .ordonnance-image { 
                max-width: 100%; 
                max-height: calc(100vh - 120px);
                height: auto; 
                width: auto;
                object-fit: contain;
                border: 2px solid #dee2e6;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                background: white;
              }
              .loading {
                text-align: center;
                color: #6c757d;
                font-size: 18px;
                padding: 40px;
              }
              @media print {
                .controls { 
                  display: none !important; 
                }
                body { 
                  background: white !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .image-container {
                  background: white !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  height: 100vh !important;
                  display: flex !important;
                  justify-content: center !important;
                  align-items: center !important;
                }
                .ordonnance-image { 
                  max-width: 100% !important;
                  max-height: 100% !important;
                  height: auto !important;
                  width: auto !important;
                  border: none !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                  page-break-inside: avoid !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="controls">
              <button class="print-btn" onclick="window.print()">🖨️ Imprimer</button>
              <button class="close-btn" onclick="window.close()">❌ Fermer</button>
            </div>
            
            <div class="image-container">
              <div class="loading">Chargement de l'ordonnance...</div>
              <img src="${fileUrl}" alt="Ordonnance" class="ordonnance-image" 
                   style="display: none;"
                   onload="this.style.display='block'; this.parentElement.querySelector('.loading').style.display='none';"
                   onerror="this.parentElement.querySelector('.loading').innerHTML='Erreur lors du chargement de l\\'image';" />
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        
        // Focus sur la nouvelle fenêtre
        printWindow.focus();
      }
    } else {
      // Pour les autres types de fichiers, ouvrir dans une nouvelle fenêtre
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Ordonnances</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{patientOrdonnances.length} ordonnance(s) pour ce patient</p>
            {ordonnancesSoins.length > 0 && (
              <p className="text-green-600">• {ordonnancesSoins.length} ordonnance(s) de soins</p>
            )}
            {ordonnancesSemelles.length > 0 && (
              <p className="text-purple-600">• {ordonnancesSemelles.length} ordonnance(s) de semelles</p>
            )}
          </div>
        </div>
        <button onClick={onAddOrdonnance} className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouvelle ordonnance
        </button>
      </div>

      {/* Liste des ordonnances */}
      {patientOrdonnances.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune ordonnance</h3>
          <p className="mt-1 text-sm text-gray-500">
            Commencez par ajouter une ordonnance pour ce patient.
          </p>
          <div className="mt-6">
            <button
              onClick={onAddOrdonnance}
              className="btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Ajouter une ordonnance
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {patientOrdonnances.map((ordonnance) => (
              <li key={ordonnance.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            Ordonnance du {new Date(ordonnance.date_ordonnance).toLocaleDateString('fr-FR')}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrdonnanceTypeColor(ordonnance)}`}>
                              {getOrdonnanceTypeLabel(ordonnance)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {getMedecinName(ordonnance)}
                            </p>
                            {ordonnance.nom_fichier && (
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {ordonnance.nom_fichier} ({formatFileSize(ordonnance.taille_fichier)})
                              </p>
                            )}
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p>
                              Importée le {new Date(ordonnance.date_import).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        {ordonnance.commentaire && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 italic">
                              "{ordonnance.commentaire}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getOrdonnanceUrl(ordonnance) && (
                        <button
                          onClick={() => handleViewFile(ordonnance)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-2 rounded-lg hover:bg-blue-50"
                          title="Voir le fichier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                      {getOrdonnanceUrl(ordonnance) && (
                        <button
                          onClick={() => handlePrintOrdonnance(ordonnance)}
                          className="text-green-600 hover:text-green-900 transition-colors duration-200 p-2 rounded-lg hover:bg-green-50"
                          title="Imprimer l'ordonnance"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => onEditOrdonnance(ordonnance)}
                        className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-2 rounded-lg hover:bg-blue-50"
                        title="Modifier"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteOrdonnance(ordonnance.id)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200 p-2 rounded-lg hover:bg-red-50"
                        title="Supprimer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal de visualisation des fichiers */}
      {showViewModal && selectedOrdonnance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col">
            {/* Header de la modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Visualisation - {selectedOrdonnance.nom_fichier || 'Ordonnance'}
                </h3>
                <p className="text-sm text-gray-600">
                  Ordonnance du {new Date(selectedOrdonnance.date_ordonnance).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const fileUrl = getOrdonnanceUrl(selectedOrdonnance);
                    if (fileUrl) {
                      window.open(fileUrl, '_blank');
                    }
                  }}
                  className="btn-primary"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Nouvel onglet
                </button>
                <button
                  onClick={() => {
                    if (selectedOrdonnance) {
                      handlePrintOrdonnance(selectedOrdonnance);
                    }
                  }}
                  className="btn-secondary"
                  title="Imprimer"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimer
                </button>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  title="Fermer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenu de la modal */}
            <div className="flex-1 p-4 overflow-hidden min-h-0">
              {(() => {
                const isImage = selectedOrdonnance.type_fichier?.startsWith('image/') || 
                               selectedOrdonnance.nom_fichier?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|tiff)$/);
                const isPDF = selectedOrdonnance.type_fichier === 'application/pdf' || 
                              selectedOrdonnance.nom_fichier?.toLowerCase().endsWith('.pdf');

                if (isPDF) {
                  return (
                    <div className="w-full h-full">
                      <iframe
                        src={getOrdonnanceUrl(selectedOrdonnance) || ''}
                        className="w-full h-full border border-gray-200 rounded-lg"
                        title={`PDF - ${selectedOrdonnance.nom_fichier || 'Ordonnance'}`}
                        style={{ minHeight: '600px' }}
                      />
                    </div>
                  );
                } else if (isImage) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <img
                        src={getOrdonnanceUrl(selectedOrdonnance) || ''}
                        alt={`Ordonnance - ${selectedOrdonnance.nom_fichier || 'Ordonnance'}`}
                        className="max-w-full max-h-full object-contain border border-gray-200 rounded-lg shadow-lg"
                      />
                    </div>
                  );
                } else {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                          Type de fichier non supporté
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Ce type de fichier ne peut pas être affiché directement.
                        </p>
                        <div className="mt-4">
                          <button
                            onClick={() => {
                            const fileUrl = getOrdonnanceUrl(selectedOrdonnance);
                            if (fileUrl) {
                              window.open(fileUrl, '_blank');
                              }
                            }}
                            className="btn-primary"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Ouvrir dans un nouvel onglet
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdonnanceList; 
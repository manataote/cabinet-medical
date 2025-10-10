import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { ModeleDocument } from '../../types';

const Editor: React.FC = () => {
  const { state } = useApp();
  const [selectedModele] = useState<ModeleDocument | null>(null);
  const [zoom, setZoom] = useState(100);

  const modelesParType = {
    feuilleSoins: state.modeles.filter(m => m.type === 'feuilleSoins'),
    factureSemelles: state.modeles.filter(m => m.type === 'factureSemelles'),
    bordereau: state.modeles.filter(m => m.type === 'bordereau'),
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Éditeur de modèles</h1>
          <p className="text-gray-600">Personnalisation des zones d'impression</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Zoom:</span>
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="input-field w-20"
            >
              <option value={25}>25%</option>
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100%</option>
              <option value={150}>150%</option>
              <option value={200}>200%</option>
            </select>
          </div>
          <button className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouveau modèle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panneau latéral */}
        <div className="lg:col-span-1 space-y-6">
          {/* Types de modèles */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Types de modèles</h3>
            </div>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Feuilles de soins</p>
                    <p className="text-sm text-gray-500">{modelesParType.feuilleSoins.length} modèle(s)</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Factures semelles</p>
                    <p className="text-sm text-gray-500">{modelesParType.factureSemelles.length} modèle(s)</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Bordereaux</p>
                    <p className="text-sm text-gray-500">{modelesParType.bordereau.length} modèle(s)</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Outils */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Outils</h3>
            </div>
            <div className="space-y-2">
              <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm">Zone de texte</span>
                </div>
              </button>

              <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Case à cocher</span>
                </div>
              </button>

              <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-sm">Tableau</span>
                </div>
              </button>

              <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Image</span>
                </div>
              </button>

              <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span className="text-sm">Signature</span>
                </div>
              </button>
            </div>
          </div>

          {/* Propriétés */}
          {selectedModele && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Propriétés</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Position X (mm)</label>
                  <input type="number" className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="form-label">Position Y (mm)</label>
                  <input type="number" className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="form-label">Largeur (mm)</label>
                  <input type="number" className="input-field" placeholder="50" />
                </div>
                <div>
                  <label className="form-label">Hauteur (mm)</label>
                  <input type="number" className="input-field" placeholder="20" />
                </div>
                <div>
                  <label className="form-label">Police</label>
                  <select className="input-field">
                    <option>Arial</option>
                    <option>Times New Roman</option>
                    <option>Helvetica</option>
                    <option>Courier New</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Taille (pt)</label>
                  <input type="number" className="input-field" placeholder="12" />
                </div>
                <div>
                  <label className="form-label">Couleur</label>
                  <input type="color" className="input-field h-10" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Zone de travail */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Zone de travail</h3>
            </div>
            <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
              <div 
                className="canvas-container"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                {/* Aperçu A4 */}
                <div className="w-full h-full bg-white border border-gray-300 relative">
                  {/* Zones d'impression simulées */}
                  <div className="zone-impression" style={{ left: '20mm', top: '30mm', width: '60mm', height: '15mm' }}>
                    <div className="text-xs text-gray-600 p-1">Nom du patient</div>
                  </div>
                  
                  <div className="zone-impression" style={{ left: '20mm', top: '50mm', width: '60mm', height: '15mm' }}>
                    <div className="text-xs text-gray-600 p-1">Prénom du patient</div>
                  </div>
                  
                  <div className="zone-impression" style={{ left: '20mm', top: '70mm', width: '30mm', height: '15mm' }}>
                    <div className="text-xs text-gray-600 p-1">DN</div>
                  </div>
                  
                  <div className="zone-impression" style={{ left: '120mm', top: '30mm', width: '40mm', height: '15mm' }}>
                    <div className="text-xs text-gray-600 p-1">Date de naissance</div>
                  </div>
                  
                  <div className="zone-impression" style={{ left: '120mm', top: '50mm', width: '40mm', height: '15mm' }}>
                    <div className="text-xs text-gray-600 p-1">Téléphone</div>
                  </div>
                  
                  <div className="zone-impression" style={{ left: '20mm', top: '100mm', width: '140mm', height: '30mm' }}>
                    <div className="text-xs text-gray-600 p-1">Adresse complète</div>
                  </div>
                  
                  <div className="zone-impression" style={{ left: '20mm', top: '150mm', width: '20mm', height: '20mm' }}>
                    <div className="text-xs text-gray-600 p-1">☐ Parcours de soins</div>
                  </div>
                  
                  <div className="zone-impression" style={{ left: '20mm', top: '180mm', width: '160mm', height: '80mm' }}>
                    <div className="text-xs text-gray-600 p-1">Tableau des actes</div>
                  </div>
                  
                  <div className="zone-impression" style={{ left: '120mm', top: '280mm', width: '60mm', height: '15mm' }}>
                    <div className="text-xs text-gray-600 p-1">Montant total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'outils inférieure */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="btn-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Aperçu
            </button>
            <button className="btn-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Importer
            </button>
            <button className="btn-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exporter
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="btn-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              Annuler
            </button>
            <button className="btn-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              Rétablir
            </button>
            <button className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor; 
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { CalculUtils } from '../../utils/calculs';
import { v4 as uuidv4 } from 'uuid';
import { Bordereau, TypeBordereau } from '../../types';

interface BordereauFormProps {
  onBack: () => void;
  bordereauToEdit?: Bordereau;
}

const BordereauForm: React.FC<BordereauFormProps> = ({ onBack, bordereauToEdit }) => {
  const { state, addBordereau, loadFeuillesSoins } = useApp();
  
  // Fonction pour récupérer les IDs des feuilles de soins déjà utilisées dans d'autres bordereaux
  const getFeuillesSoinsUtilisees = (): string[] => {
    const feuillesUtilisees = new Set<string>();
    
    state.bordereaux.forEach(bordereau => {
      // Si on est en mode édition, exclure le bordereau en cours d'édition
      if (bordereauToEdit && bordereau.id === bordereauToEdit.id) {
        return;
      }
      
      bordereau.feuillesSoins.forEach(feuille => {
        feuillesUtilisees.add(feuille.id);
      });
    });
    
    return Array.from(feuillesUtilisees);
  };
  
  // Filtrer les feuilles de soins disponibles (non assignées à un bordereau)
  const feuillesSoinsDisponibles = state.feuillesSoins.filter(feuille => {
    return !feuille.bordereau_id; // Feuilles de soins non assignées à un bordereau
  });
  
  console.log('🔍 Feuilles de soins disponibles:', feuillesSoinsDisponibles);

  // Filtrer les factures semelles disponibles (non assignées à un bordereau)
  const facturesSemellesDisponibles = state.facturesSemelles.filter(facture => {
    return !facture.bordereau_id; // Factures semelles non assignées à un bordereau
  });
  
  console.log('🔍 Factures semelles disponibles:', facturesSemellesDisponibles);

  // Debug: Log des feuilles de soins disponibles
  React.useEffect(() => {
    console.log('🔍 BordereauForm: Feuilles de soins dans le state:', {
      totalFeuilles: state.feuillesSoins?.length || 0,
      feuillesUtilisees: getFeuillesSoinsUtilisees(),
      feuillesDisponibles: feuillesSoinsDisponibles.length,
      details: feuillesSoinsDisponibles.map(f => ({ id: f.id, numero: f.numeroFeuilleSoins, montant: f.montantTotal }))
    });
  }, [state.feuillesSoins, state.bordereaux]);

  // Rafraîchir les feuilles de soins disponibles au montage du composant
  React.useEffect(() => {
    const refreshFeuillesSoins = async () => {
      try {
        await loadFeuillesSoins();
      } catch (error) {
        console.error('Erreur lors du rafraîchissement des feuilles de soins:', error);
      }
    };
    
    refreshFeuillesSoins();
  }, []); // Seulement au montage du composant


  const [formData, setFormData] = useState({
    id: uuidv4(),
    date: new Date().toISOString().split('T')[0],
    type: 'feuilles-soins' as TypeBordereau,
    feuillesSoins: [] as string[],
    facturesSemelles: [] as string[],
    montantTotal: 0,
    modeleUtilise: 'standard'
  });

  // Déterminer les éléments à afficher selon le type de bordereau
  const isTypeFeuillesSoins = formData.type === 'feuilles-soins' || formData.type === 'rejet-feuilles-soins';
  const isTypeSemelles = formData.type === 'semelles-orthopediques' || formData.type === 'rejet-semelles-orthopediques';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let montantTotal = 0;
      let feuillesSelectionnees: any[] = [];
      let facturesSemellesSelectionnees: any[] = [];
      
      if (isTypeFeuillesSoins) {
        // Calculer le montant total pour les feuilles de soins
        feuillesSelectionnees = feuillesSoinsDisponibles.filter(f => 
          formData.feuillesSoins.includes(f.id)
        );
        
        console.log('🔍 Feuilles de soins sélectionnées:', feuillesSelectionnees);
        console.log('🔍 formData.feuillesSoins:', formData.feuillesSoins);
        console.log('🔍 feuillesSoinsDisponibles:', feuillesSoinsDisponibles);
        
        // Calculer le total des feuilles de soins (tiers payant uniquement)
        montantTotal += feuillesSelectionnees.reduce((total, feuille) => {
          return total + (feuille.montantTiersPayant || feuille.montantTotal || 0);
        }, 0);
      } else if (isTypeSemelles) {
        // Calculer le montant total pour les factures semelles
        facturesSemellesSelectionnees = facturesSemellesDisponibles.filter(f => 
          formData.facturesSemelles.includes(f.id)
        );
        
        console.log('🔍 Factures semelles sélectionnées:', facturesSemellesSelectionnees);
        
        // Calculer le total des factures semelles
        montantTotal += facturesSemellesSelectionnees.reduce((total, facture) => {
          return total + (facture.montantTotal || 0);
        }, 0);
      }
      
      const bordereau: Bordereau = {
        id: formData.id,
        numeroBordereau: `BR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        date: new Date(formData.date),
        type: formData.type,
        feuillesSoins: feuillesSelectionnees,
        facturesSemelles: facturesSemellesSelectionnees,
        montantTotal,
        modeleUtilise: formData.modeleUtilise,
        cabinetId: '' // Sera rempli par AppContext avec le vrai cabinet_id
      };
      
      console.log('🔍 Bordereau créé:', bordereau);
      
      await addBordereau(bordereau);
      
      // Réinitialiser le formulaire
      setFormData({
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0],
        type: 'feuilles-soins' as TypeBordereau,
        feuillesSoins: [],
        facturesSemelles: [],
        montantTotal: 0,
        modeleUtilise: 'standard'
      });
      
      // Rediriger vers la liste des bordereaux
      onBack();
    } catch (error) {
      console.error('Erreur lors de la création du bordereau:', error);
      alert('Erreur lors de la création du bordereau');
    }
  };

  const handleFeuilleChange = (feuilleId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        feuillesSoins: [...prev.feuillesSoins, feuilleId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        feuillesSoins: prev.feuillesSoins.filter(id => id !== feuilleId)
      }));
    }
  };


  const handleSelectAll = () => {
    if (isTypeFeuillesSoins) {
      const allIds = feuillesSoinsDisponibles.map(f => f.id);
      setFormData(prev => ({
        ...prev,
        feuillesSoins: allIds
      }));
    }
  };

  const handleDeselectAll = () => {
    setFormData(prev => ({
      ...prev,
      feuillesSoins: []
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau Bordereau</h1>
          <p className="text-gray-600">Créer un bordereau de remise</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            📋 Informations du bordereau
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de création
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de bordereau
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as TypeBordereau }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="feuilles-soins">Feuilles de soins</option>
                <option value="rejet-feuilles-soins">Rejet feuilles de soins</option>
                <option value="semelles-orthopediques">Semelles orthopédiques</option>
                <option value="rejet-semelles-orthopediques">Rejet semelles orthopédiques</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section Feuilles de soins */}
        {isTypeFeuillesSoins && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                📄 Feuilles de soins à inclure
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {(() => {
                    const nombreDisponibles = feuillesSoinsDisponibles.length;
                    const nombreTotal = state.feuillesSoins.length;
                    const texteDisponibles = nombreDisponibles >= 2 ? `${nombreDisponibles} feuilles` : `${nombreDisponibles} feuille`;
                    const texteTotal = nombreTotal >= 2 ? `${nombreTotal} feuilles` : `${nombreTotal} feuille`;
                    return `${texteDisponibles} disponible(s) sur ${texteTotal}`;
                  })()}
                </span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>
            </div>
          
            {feuillesSoinsDisponibles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {state.feuillesSoins.length === 0 
                  ? "Aucune feuille de soins disponible" 
                  : "Toutes les feuilles de soins sont déjà utilisées dans d'autres bordereaux"
                }
              </p>
            ) : (
              <div className="space-y-3">
                {feuillesSoinsDisponibles.map(feuille => (
                  <div key={feuille.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`feuille-${feuille.id}`}
                        checked={formData.feuillesSoins.includes(feuille.id)}
                        onChange={(e) => handleFeuilleChange(feuille.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <label htmlFor={`feuille-${feuille.id}`} className="font-medium text-gray-900">
                          {feuille.numeroFeuilleSoins || `Feuille ${feuille.id.slice(0, 8)}`}
                        </label>
                        <p className="text-sm text-gray-600">
                          {feuille.patient?.nom} {feuille.patient?.prenom} - {new Date(feuille.datePrescription).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {CalculUtils.formaterMontant(feuille.montantTiersPayant)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section Factures semelles */}
        {isTypeSemelles && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                🦶 Factures semelles à inclure
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {(() => {
                    const nombreDisponibles = facturesSemellesDisponibles.length;
                    const nombreTotal = state.facturesSemelles.length;
                    const texteDisponibles = nombreDisponibles >= 2 ? `${nombreDisponibles} factures` : `${nombreDisponibles} facture`;
                    const texteTotal = nombreTotal >= 2 ? `${nombreTotal} factures` : `${nombreTotal} facture`;
                    return `${texteDisponibles} disponible(s) sur ${texteTotal}`;
                  })()}
                </span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = facturesSemellesDisponibles.map(f => f.id);
                      setFormData(prev => ({
                        ...prev,
                        facturesSemelles: allIds
                      }));
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, facturesSemelles: [] }))}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>
            </div>
          
            {facturesSemellesDisponibles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {state.facturesSemelles.length === 0 
                  ? "Aucune facture semelles disponible" 
                  : "Toutes les factures semelles sont déjà utilisées dans d'autres bordereaux"
                }
              </p>
            ) : (
              <div className="space-y-3">
                {facturesSemellesDisponibles.map(facture => (
                  <div key={facture.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`facture-${facture.id}`}
                        checked={formData.facturesSemelles.includes(facture.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              facturesSemelles: [...prev.facturesSemelles, facture.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              facturesSemelles: prev.facturesSemelles.filter(id => id !== facture.id)
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <label htmlFor={`facture-${facture.id}`} className="font-medium text-gray-900">
                          {facture.numeroFacture || `Facture ${facture.id.slice(0, 8)}`}
                        </label>
                        <p className="text-sm text-gray-600">
                          {facture.patient?.nom} {facture.patient?.prenom} - {new Date(facture.dateSoins).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {CalculUtils.formaterMontant(facture.montantTotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(formData.feuillesSoins.length > 0 || formData.facturesSemelles.length > 0) && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Résumé</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">
                  {isTypeFeuillesSoins ? 'Nombre de feuilles :' : 'Nombre de factures :'}
                </span>
                <span className="font-medium text-blue-900 ml-2">
                  {isTypeFeuillesSoins ? formData.feuillesSoins.length : formData.facturesSemelles.length}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Montant total :</span>
                <span className="font-medium text-blue-900 ml-2">
                  {CalculUtils.formaterMontant(
                    (() => {
                      let total = 0;
                      
                      if (isTypeFeuillesSoins) {
                        // Calculer le total des feuilles de soins (tiers payant uniquement)
                        total += feuillesSoinsDisponibles
                          .filter(f => formData.feuillesSoins.includes(f.id))
                          .reduce((sum, feuille) => sum + (feuille.montantTiersPayant || feuille.montantTotal || 0), 0);
                      } else if (isTypeSemelles) {
                        // Calculer le total des factures semelles
                        total += facturesSemellesDisponibles
                          .filter(f => formData.facturesSemelles.includes(f.id))
                          .reduce((sum, facture) => sum + (facture.montantTotal || 0), 0);
                      }
                      
                      return total;
                    })(),
                    // Devise supprimée - Application forcée en XPF
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={formData.feuillesSoins.length === 0 && formData.facturesSemelles.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Créer le bordereau
          </button>
        </div>
      </form>
    </div>
  );
};

export default BordereauForm;
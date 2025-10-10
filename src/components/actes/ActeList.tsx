import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { ActeTemplate } from '../../types';

const ActeList: React.FC = () => {
  const { state, addActeTemplate, updateActeTemplate, deleteActeTemplate } = useApp();
  const [selectedActe, setSelectedActe] = useState<ActeTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditActe = (acte: ActeTemplate) => {
    setSelectedActe(acte);
    setIsEditing(true);
  };

  const handleDeleteActe = (acteId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet acte ?')) {
      deleteActeTemplate(acteId);
      alert('Acte supprimé avec succès !');
    }
  };

  const handleSaveActe = async (acte: ActeTemplate) => {
    try {
      if (isEditing && selectedActe) {
        // Mise à jour d'un acte existant
        const acteToUpdate = { ...acte, id: selectedActe.id };
        await updateActeTemplate(acteToUpdate);
        alert('Acte modifié avec succès !');
      } else {
        // Ajout d'un nouvel acte
        const newActe = { ...acte, id: Date.now().toString() };
        await addActeTemplate(newActe);
        alert('Acte créé avec succès !');
      }
      setIsEditing(false);
      setSelectedActe(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de l\'acte');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedActe(null);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des actes</h1>
          <p className="text-gray-600">Configuration des actes médicaux et leurs tarifs</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nouvel acte
        </button>
      </div>

      {/* Formulaire d'édition/création */}
      {(isEditing || selectedActe) && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            {isEditing && selectedActe ? 'Modifier l\'acte' : 'Nouvel acte'}
          </h2>
          
          <ActeForm
            acte={selectedActe}
            onSave={handleSaveActe}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Liste des actes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Actes configurés</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Libellé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Libellé interne
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lettre clé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarif
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coefficient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part CPS
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.acteTemplates.map((acte) => (
                <tr key={acte.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {acte.type === 'orthopedique' ? acte.libelleFacture : acte.libelle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {acte.type === 'orthopedique' ? acte.libelle : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {acte.lettreCle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {acte.tarif}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {acte.coefficient}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      acte.type === 'orthopedique' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {acte.type === 'orthopedique' ? 'Orthopédique' : 'Soins'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {acte.type === 'orthopedique' ? (
                      <span className="font-semibold text-blue-600">
                        {acte.partCPS ? acte.partCPS.toFixed(0) : '-'}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {acte.type === 'orthopedique' ? (
                      <span className="font-semibold text-green-600">
                        {acte.partPatient ? acte.partPatient.toFixed(0) : '-'}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      acte.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {acte.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditActe(acte)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteActe(acte.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {state.acteTemplates.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            <p>Aucun acte configuré pour le moment.</p>
            <p className="text-sm mt-1">Cliquez sur "Nouvel acte" pour commencer.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant formulaire pour créer/modifier un acte
interface ActeFormProps {
  acte: ActeTemplate | null;
  onSave: (acte: ActeTemplate) => void;
  onCancel: () => void;
}

const ActeForm: React.FC<ActeFormProps> = ({ acte, onSave, onCancel }) => {
  const { state } = useApp();
  const [formData, setFormData] = useState<Partial<ActeTemplate>>({
    lettreCle: acte?.lettreCle || '',
    libelle: acte?.libelle || '',
    tarif: acte?.tarif || 0,
    coefficient: acte?.coefficient || 1,
    // devise supprimée - Application forcée en XPF
    type: acte?.type || 'soins',
    codeLPPR: acte?.codeLPPR || '',
    actif: acte?.actif ?? true
  });

  // État spécifique pour les actes orthopédiques
  const [orthoData, setOrthoData] = useState({
    libelle: acte?.libelle || '',
    libelleFacture: acte?.libelleFacture || '', // Utiliser libelleFacture si disponible
    codeLPPR: acte?.codeLPPR || '',
    quantite: acte?.quantite || 1,
    total: acte?.total || 0,
    partCPS: acte?.partCPS || 0,
    partPatient: acte?.partPatient || 0,
    tarifBaseLPPR: acte?.tarifBaseLPPR || 0,
    tauxApplique: acte?.tauxApplique || 100,
    regime: (acte?.regime || 'maladie') as 'maladie' | 'longue-maladie' | 'maternite' | 'arret-travail'
  });

  // Synchroniser les données quand l'acte change
  useEffect(() => {
    if (acte) {
      setOrthoData({
        libelle: acte.libelle || '',
        libelleFacture: acte.libelleFacture || '',
        codeLPPR: acte.codeLPPR || '',
        quantite: acte.quantite || 1,
        total: acte.total || 0,
        partCPS: acte.partCPS || 0,
        partPatient: acte.partPatient || 0,
        tarifBaseLPPR: acte.tarifBaseLPPR || 0,
        tauxApplique: acte.tauxApplique || 100,
        regime: (acte.regime || 'maladie') as 'maladie' | 'longue-maladie' | 'maternite' | 'arret-travail'
      });
    }
  }, [acte]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.type === 'orthopedique') {
      // Validation pour les actes orthopédiques
      if (!orthoData.libelle || !orthoData.codeLPPR) {
        return;
      }
      
      onSave({
        id: acte?.id || '',
        lettreCle: '', // Pas de lettre clé pour les orthopédiques
        libelle: orthoData.libelle,
        tarif: orthoData.total, // Utiliser le total comme tarif
        coefficient: 1, // Coefficient fixe à 1
        // devise supprimée - Application forcée en XPF
        type: 'orthopedique',
        codeLPPR: orthoData.codeLPPR,
        libelleFacture: orthoData.libelleFacture || '',
        quantite: orthoData.quantite,
        total: orthoData.total,
        partCPS: orthoData.partCPS,
        partPatient: orthoData.partPatient,
        tarifBaseLPPR: orthoData.tarifBaseLPPR,
        tauxApplique: orthoData.tauxApplique,
        regime: orthoData.regime,
        actif: formData.actif ?? true
      });
    } else {
      // Validation pour les actes de soins
      if (!formData.lettreCle || !formData.libelle || formData.tarif === undefined) {
        return;
      }
      
      onSave({
        id: acte?.id || '',
        lettreCle: formData.lettreCle,
        libelle: formData.libelle,
        tarif: formData.tarif,
        coefficient: formData.coefficient || 1,
        // devise supprimée - Application forcée en XPF
        type: formData.type || 'soins',
        codeLPPR: '',
        actif: formData.actif ?? true
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type d'acte - toujours visible */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type d'acte *
        </label>
        <select
          required
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'soins' | 'orthopedique' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="soins">Actes de soins</option>
          <option value="orthopedique">Actes orthopédiques</option>
        </select>
      </div>

      {formData.type === 'orthopedique' ? (
        // Formulaire pour les actes orthopédiques
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Libellé interne *
            </label>
            <input
              type="text"
              required
              value={orthoData.libelle}
              onChange={(e) => setOrthoData({ ...orthoData, libelle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Semelles orthopédiques standard"
            />
            <p className="text-xs text-gray-500 mt-1">Nom interne (non imprimé sur la facture)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Libellé facture *
            </label>
            <input
              type="text"
              required
              value={orthoData.libelleFacture}
              onChange={(e) => setOrthoData({ ...orthoData, libelleFacture: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Semelles orthopédiques sur mesure"
            />
            <p className="text-xs text-gray-500 mt-1">Nom qui apparaîtra sur la facture</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code LPPR *
            </label>
            <input
              type="text"
              required
              value={orthoData.codeLPPR}
              onChange={(e) => setOrthoData({ ...orthoData, codeLPPR: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: LPPR001"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantité *
            </label>
            <input
              type="number"
              required
              min="1"
              value={orthoData.quantite}
              onChange={(e) => setOrthoData({ ...orthoData, quantite: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarif de base LPPR *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={orthoData.tarifBaseLPPR}
              onChange={(e) => setOrthoData({ ...orthoData, tarifBaseLPPR: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taux appliqué *
            </label>
            <select
              required
              value={orthoData.tauxApplique}
              onChange={(e) => setOrthoData({ ...orthoData, tauxApplique: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={70}>70%</option>
              <option value={100}>100%</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Régime *
            </label>
            <select
              required
              value={orthoData.regime}
              onChange={(e) => setOrthoData({ ...orthoData, regime: e.target.value as 'maladie' | 'longue-maladie' | 'maternite' | 'arret-travail' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="maladie">Maladie</option>
              <option value="longue-maladie">Longue Maladie</option>
              <option value="maternite">Maternité</option>
              <option value="arret-travail">Arrêt de travail</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TOTAL *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={orthoData.total}
              onChange={(e) => setOrthoData({ ...orthoData, total: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PART CPS *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={orthoData.partCPS}
              onChange={(e) => setOrthoData({ ...orthoData, partCPS: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PART PATIENT *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={orthoData.partPatient}
              onChange={(e) => setOrthoData({ ...orthoData, partPatient: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      ) : (
        // Formulaire pour les actes de soins
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lettre clé *
            </label>
            <input
              type="text"
              required
              value={formData.lettreCle}
              onChange={(e) => setFormData({ ...formData, lettreCle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: A"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Libellé *
            </label>
            <input
              type="text"
              required
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Consultation standard"
            />
          </div>
        
                          <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tarif *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.tarif || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, tarif: value === "" ? 0 : parseFloat(value) || 0 });
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "" || parseFloat(e.target.value) === 0) {
                            setFormData({ ...formData, tarif: 0 });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 text-sm">
                          FCFP
                        </span>
                      </div>
                    </div>
                  </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coefficient
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={formData.coefficient === 0 ? "" : formData.coefficient || ""}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, coefficient: value === "" ? 0 : parseFloat(value) || 0 });
            }}
            onBlur={(e) => {
              if (e.target.value === "" || parseFloat(e.target.value) === 0) {
                setFormData({ ...formData, coefficient: 1 });
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1.0"
          />
        </div>
        
        {/* Champ devise supprimé - Application forcée en XPF */}
      </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Statut
        </label>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="actif"
            checked={formData.actif}
            onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="actif" className="ml-2 text-sm text-gray-700">
            Acte actif
          </label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {acte ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

export default ActeList;

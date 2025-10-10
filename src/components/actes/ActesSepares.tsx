import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { ActeSoins, ActeOrthopedique } from '../../types';

interface ActesSeparesProps {
  onBack: () => void;
}

export const ActesSepares: React.FC<ActesSeparesProps> = ({ onBack }) => {
  const { state, addActeSoins, updateActeSoins, deleteActeSoins, addActeOrthopedique, updateActeOrthopedique, deleteActeOrthopedique } = useApp();
  const [activeTab, setActiveTab] = useState<'soins' | 'orthopedique'>('soins');
  const [isCreatingSoins, setIsCreatingSoins] = useState(false);
  const [isCreatingOrthopedique, setIsCreatingOrthopedique] = useState(false);
  const [editingSoins, setEditingSoins] = useState<ActeSoins | undefined>(undefined);
  const [editingOrthopedique, setEditingOrthopedique] = useState<ActeOrthopedique | undefined>(undefined);

  const handleDeleteSoins = async (acteId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet acte de soins ?')) {
      try {
        await deleteActeSoins(acteId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'acte');
      }
    }
  };

  const handleDeleteOrthopedique = async (acteId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet acte orthopédique ?')) {
      try {
        await deleteActeOrthopedique(acteId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'acte');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des actes</h1>
          <p className="text-gray-600">Configuration des actes médicaux et leurs tarifs</p>
        </div>
        <button
          onClick={onBack}
          className="btn-secondary"
        >
          ← Retour
        </button>
      </div>

      {/* Onglets */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('soins')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'soins'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Actes de soins ({(state.actesSoins || []).length})
          </button>
          <button
            onClick={() => setActiveTab('orthopedique')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orthopedique'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Actes orthopédiques ({(state.actesOrthopediques || []).length})
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'soins' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Actes configurés (Soins)</h2>
            <button
              onClick={() => setIsCreatingSoins(true)}
              className="btn-primary"
            >
              + Nouvel acte de soins
            </button>
          </div>

          {/* Formulaire de création/modification */}
          {(isCreatingSoins || editingSoins) && (
            <ActeSoinsForm
              acte={editingSoins}
              onSave={async (acteData) => {
                try {
                  if (editingSoins) {
                    await updateActeSoins({ ...acteData, id: editingSoins.id });
                    setEditingSoins(undefined);
                  } else {
                    await addActeSoins(acteData as ActeSoins);
                  }
                  setIsCreatingSoins(false);
                } catch (error) {
                  console.error('Erreur lors de la sauvegarde:', error);
                  alert('Erreur lors de la sauvegarde de l\'acte');
                }
              }}
              onCancel={() => {
                setIsCreatingSoins(false);
                setEditingSoins(undefined);
              }}
            />
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {(state.actesSoins || []).map((acte) => (
                <li key={acte.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{acte.libelle}</div>
                          <div className="text-sm text-gray-500">
                            Code: {acte.code} • Coefficient: {acte.coefficient} • Tarif: {acte.tarif} XPF
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingSoins(acte)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteSoins(acte.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'orthopedique' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Actes configurés (Orthopédique)</h2>
            <button
              onClick={() => setIsCreatingOrthopedique(true)}
              className="btn-primary"
            >
              + Nouvel acte orthopédique
            </button>
          </div>

          {/* Formulaire de création/modification */}
          {(isCreatingOrthopedique || editingOrthopedique) && (
            <ActeOrthopediqueForm
              acte={editingOrthopedique}
              onSave={async (acteData) => {
                try {
                  if (editingOrthopedique) {
                    await updateActeOrthopedique({ ...acteData, id: editingOrthopedique.id });
                    setEditingOrthopedique(undefined);
                  } else {
                    await addActeOrthopedique(acteData as ActeOrthopedique);
                  }
                  setIsCreatingOrthopedique(false);
                } catch (error) {
                  console.error('Erreur lors de la sauvegarde:', error);
                  alert('Erreur lors de la sauvegarde de l\'acte');
                }
              }}
              onCancel={() => {
                setIsCreatingOrthopedique(false);
                setEditingOrthopedique(undefined);
              }}
            />
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {(state.actesOrthopediques || []).map((acte) => (
                <li key={acte.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{acte.libelleInterne}</div>
                          <div className="text-sm text-gray-500">
                            Code LPPR: {acte.codeLPPR} • Quantité: {acte.quantite} • Total: {acte.total} XPF
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingOrthopedique(acte)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteOrthopedique(acte.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant formulaire pour les actes de soins
interface ActeSoinsFormProps {
  acte?: ActeSoins;
  onSave: (acte: Omit<ActeSoins, 'id'>) => void;
  onCancel: () => void;
}

const ActeSoinsForm: React.FC<ActeSoinsFormProps> = ({ acte, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    code: acte?.code || '',
    libelle: acte?.libelle || '',
    tarif: acte?.tarif || 0,
    coefficient: acte?.coefficient || 1,
    actif: acte?.actif ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
        {acte ? 'Modifier l\'acte de soins' : 'Nouvel acte de soins'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              placeholder="Ex: C, K, Z..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Coefficient *
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.coefficient || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setFormData({ ...formData, coefficient: isNaN(value) ? 1 : value });
              }}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              placeholder="Ex: 1, 1.5, 2..."
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Libellé *
          </label>
          <input
            type="text"
            value={formData.libelle}
            onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
            className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            placeholder="Ex: Consultation, Acte technique..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Tarif (XPF) *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.tarif || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setFormData({ ...formData, tarif: isNaN(value) ? 0 : value });
            }}
            className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            placeholder="Ex: 1500, 2500..."
            required
          />
        </div>

        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="actif"
            checked={formData.actif}
            onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300 rounded"
          />
          <label htmlFor="actif" className="ml-3 block text-sm font-semibold text-gray-900">
            Acte actif
          </label>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 transition-colors"
          >
            {acte ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Composant formulaire pour les actes orthopédiques
interface ActeOrthopediqueFormProps {
  acte?: ActeOrthopedique;
  onSave: (acte: Omit<ActeOrthopedique, 'id'>) => void;
  onCancel: () => void;
}

const ActeOrthopediqueForm: React.FC<ActeOrthopediqueFormProps> = ({ acte, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    codeLPPR: acte?.codeLPPR || '',
    libelleInterne: acte?.libelleInterne || '',
    libelleFacture: acte?.libelleFacture || '',
    quantite: acte?.quantite || 1,
    tarifBase: acte?.tarifBase || 0,
    tauxApplique: acte?.tauxApplique || 100,
    regime: acte?.regime || 'maladie' as const,
    total: acte?.total || 0,
    partCPS: acte?.partCPS || 0,
    partPatient: acte?.partPatient || 0,
    actif: acte?.actif ?? true,
  });
  
  const [fieldsTouched, setFieldsTouched] = useState({
    tarifBase: false,
    total: false,
    partCPS: false,
    partPatient: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des montants si les champs ont été touchés
    if (fieldsTouched.total && fieldsTouched.partCPS && fieldsTouched.partPatient) {
      const montantCalcule = formData.partCPS + formData.partPatient;
      if (Math.abs(montantCalcule - formData.total) > 0.01) {
        alert('Impossible de créer l\'acte : Part CPS + Part Patient doit égaler le Total');
        return;
      }
    }
    
    // Ajouter les champs manquants pour correspondre à l'interface ActeOrthopedique
    const completeData = {
      ...formData,
      libelle: formData.libelleInterne, // Mapper libelleInterne vers libelle
      tarifBaseLPPR: formData.tarifBase, // Mapper tarifBase vers tarifBaseLPPR
    };
    onSave(completeData);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
        {acte ? 'Modifier l\'acte orthopédique' : 'Nouvel acte orthopédique'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Code LPPR *
            </label>
            <input
              type="text"
              value={formData.codeLPPR}
              onChange={(e) => setFormData({ ...formData, codeLPPR: e.target.value })}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              placeholder="Ex: 10.01.01.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Quantité *
            </label>
            <input
              type="number"
              value={formData.quantite || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setFormData({ ...formData, quantite: isNaN(value) ? 1 : value });
              }}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              placeholder="Ex: 1, 2, 3..."
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Libellé interne *
          </label>
          <p className="text-xs text-gray-600 mb-2">Nom interne (non imprimé sur la facture)</p>
          <input
            type="text"
            value={formData.libelleInterne}
            onChange={(e) => setFormData({ ...formData, libelleInterne: e.target.value })}
            className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            placeholder="Ex: Semelles orthopédiques personnalisées"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Libellé facture *
          </label>
          <p className="text-xs text-gray-600 mb-2">Nom qui apparaîtra sur la facture</p>
          <input
            type="text"
            value={formData.libelleFacture}
            onChange={(e) => setFormData({ ...formData, libelleFacture: e.target.value })}
            className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            placeholder="Ex: Semelles orthopédiques"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tarif de base LPPR (XPF) *
            </label>
            <input
              type="number"
              value={formData.tarifBase === 0 ? '0' : formData.tarifBase || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  setFormData({ ...formData, tarifBase: 0 });
                } else {
                  const numValue = parseFloat(inputValue);
                  setFormData({ ...formData, tarifBase: isNaN(numValue) ? 0 : numValue });
                }
                setFieldsTouched({ ...fieldsTouched, tarifBase: true });
              }}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              placeholder="Ex: 5000, 7500..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Taux appliqué *
            </label>
            <select
              value={formData.tauxApplique || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setFormData({ ...formData, tauxApplique: isNaN(value) ? 100 : value });
              }}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              required
            >
              <option value={100}>100%</option>
              <option value={70}>70%</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Régime *
          </label>
          <select
            value={formData.regime}
            onChange={(e) => setFormData({ ...formData, regime: e.target.value as any })}
            className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            required
          >
            <option value="maladie">Maladie</option>
            <option value="longue-maladie">Longue maladie</option>
            <option value="arret-travail">Arrêt de travail</option>
            <option value="maternite">Maternité</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              TOTAL (XPF) *
            </label>
            <input
              type="number"
              value={formData.total === 0 ? '0' : formData.total || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  setFormData({ ...formData, total: 0 });
                } else {
                  const numValue = parseFloat(inputValue);
                  setFormData({ ...formData, total: isNaN(numValue) ? 0 : numValue });
                }
                setFieldsTouched({ ...fieldsTouched, total: true });
              }}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              placeholder="Ex: 5000, 7500..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              PART CPS (XPF) *
            </label>
            <input
              type="number"
              value={formData.partCPS === 0 ? '0' : formData.partCPS || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  setFormData({ ...formData, partCPS: 0 });
                } else {
                  const numValue = parseFloat(inputValue);
                  setFormData({ ...formData, partCPS: isNaN(numValue) ? 0 : numValue });
                }
                setFieldsTouched({ ...fieldsTouched, partCPS: true });
              }}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              placeholder="Ex: 3500, 5250..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              PART PATIENT (XPF) *
            </label>
            <input
              type="number"
              value={formData.partPatient === 0 ? '0' : formData.partPatient || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  setFormData({ ...formData, partPatient: 0 });
                } else {
                  const numValue = parseFloat(inputValue);
                  setFormData({ ...formData, partPatient: isNaN(numValue) ? 0 : numValue });
                }
                setFieldsTouched({ ...fieldsTouched, partPatient: true });
              }}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              placeholder="Ex: 1500, 2250..."
              required
            />
          </div>
        </div>

        {/* Validation des montants pour les actes orthopédiques */}
        {fieldsTouched.total && fieldsTouched.partCPS && fieldsTouched.partPatient && (
          <div className="text-xs text-gray-600 mb-2">
            {Math.abs((formData.partCPS + formData.partPatient) - formData.total) > 0.01 ? (
              <span className="text-red-500">⚠️ Part CPS + Part Patient doit égaler le Total</span>
            ) : (
              <span className="text-green-600">✓ Montants cohérents</span>
            )}
          </div>
        )}

        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="actif-ortho"
            checked={formData.actif}
            onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300 rounded"
          />
          <label htmlFor="actif-ortho" className="ml-3 block text-sm font-semibold text-gray-900">
            Acte actif
          </label>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={
              fieldsTouched.total && 
              fieldsTouched.partCPS && 
              fieldsTouched.partPatient && 
              Math.abs((formData.partCPS + formData.partPatient) - formData.total) > 0.01
            }
            className={`px-6 py-3 border border-transparent rounded-lg text-sm font-semibold transition-colors ${
              fieldsTouched.total && 
              fieldsTouched.partCPS && 
              fieldsTouched.partPatient && 
              Math.abs((formData.partCPS + formData.partPatient) - formData.total) > 0.01
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-200'
            }`}
          >
            {acte ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
};

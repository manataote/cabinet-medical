import React, { useState } from 'react';
import { Patient, FeuilleSoins, Ordonnance } from '../../types';
// import { getPatientReferences } from '../../utils/duplicates';

interface MergePatientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: (mergedPatient: Patient, patientsToRemove: Patient[], selectedOrdonnances: string[], selectedFeuillesSoins: string[]) => void;
  duplicateGroup: {
    patients: Patient[];
    reason: 'dn' | 'name_birth' | 'both';
    confidence: 'high' | 'medium' | 'low';
  };
  feuillesSoins: FeuilleSoins[];
  ordonnances: Ordonnance[];
  isLoading?: boolean;
}

interface FieldSelection {
  nom: string;
  prenom: string;
  dn: string;
  dateNaissance: Date;
  adresse: string;
  telephone: string;
}

const MergePatientsModal: React.FC<MergePatientsModalProps> = ({
  isOpen,
  onClose,
  onMerge,
  duplicateGroup,
  feuillesSoins,
  ordonnances,
  isLoading = false
}) => {
  const [selectedFields, setSelectedFields] = useState<FieldSelection>({
    nom: '',
    prenom: '',
    dn: '',
    dateNaissance: new Date(),
    adresse: '',
    telephone: ''
  });

  const [selectedOrdonnances, setSelectedOrdonnances] = useState<Set<string>>(new Set());
  const [selectedFeuillesSoins, setSelectedFeuillesSoins] = useState<Set<string>>(new Set());

  // Initialiser les sélections d'ordonnances et feuilles de soins
  React.useEffect(() => {
    if (isOpen && duplicateGroup.patients.length > 0) {
      // Réinitialiser selectedFields avec le premier patient
      const firstPatient = duplicateGroup.patients[0];
      if (firstPatient) {
        setSelectedFields({
          nom: firstPatient.nom,
          prenom: firstPatient.prenom,
          dn: firstPatient.dn,
          dateNaissance: firstPatient.dateNaissance instanceof Date ? firstPatient.dateNaissance : new Date(firstPatient.dateNaissance),
          adresse: firstPatient.adresse || '',
          telephone: firstPatient.telephone || ''
        });
      }
      
      const allOrdonnances = new Set<string>();
      const allFeuillesSoins = new Set<string>();
      
      duplicateGroup.patients.forEach(patient => {
        ordonnances
          .filter(ord => ord.patient_id === patient.id)
          .forEach(ord => allOrdonnances.add(ord.id));
        
        feuillesSoins
          .filter(fs => fs.patient_id === patient.id)
          .forEach(fs => allFeuillesSoins.add(fs.id));
      });
      
      setSelectedOrdonnances(allOrdonnances);
      setSelectedFeuillesSoins(allFeuillesSoins);
    }
  }, [isOpen, duplicateGroup.patients, ordonnances, feuillesSoins]);

  const handleFieldChange = (field: keyof FieldSelection, value: string | Date) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: field === 'dateNaissance' 
        ? (value instanceof Date ? value : new Date(value))
        : value
    }));
  };

  const handleOrdonnanceToggle = (ordonnanceId: string) => {
    setSelectedOrdonnances(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ordonnanceId)) {
        newSet.delete(ordonnanceId);
      } else {
        newSet.add(ordonnanceId);
      }
      return newSet;
    });
  };

  const handleFeuilleSoinsToggle = (feuilleId: string) => {
    setSelectedFeuillesSoins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(feuilleId)) {
        newSet.delete(feuilleId);
      } else {
        newSet.add(feuilleId);
      }
      return newSet;
    });
  };

  const handleMerge = () => {
    // Créer le patient fusionné
    const mergedPatient: Patient = {
      id: duplicateGroup.patients[0].id, // Garder l'ID du premier patient
      numeroFacture: duplicateGroup.patients[0].numeroFacture, // Garder le numéro de facture du premier patient
      nom: selectedFields.nom,
      prenom: selectedFields.prenom,
      dn: selectedFields.dn,
      dateNaissance: selectedFields.dateNaissance,
      adresse: selectedFields.adresse || '',
      telephone: selectedFields.telephone || ''
    };

    // Patients à supprimer (tous sauf le premier)
    const patientsToRemove = duplicateGroup.patients.slice(1);

    // Convertir les Sets en Arrays
    const selectedOrdonnancesArray = Array.from(selectedOrdonnances);
    const selectedFeuillesSoinsArray = Array.from(selectedFeuillesSoins);

    onMerge(mergedPatient, patientsToRemove, selectedOrdonnancesArray, selectedFeuillesSoinsArray);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden mx-4 relative">
        {/* Overlay de chargement */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-lg font-medium text-gray-900">Fusion en cours...</p>
              <p className="mt-2 text-sm text-gray-600">Mise à jour des références dans la base de données</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Fusionner les patients</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Informations sur le groupe de doublons */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-3 ${
                duplicateGroup.confidence === 'high' ? 'bg-red-100 text-red-800' :
                duplicateGroup.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {duplicateGroup.confidence === 'high' ? 'Haute confiance' :
                 duplicateGroup.confidence === 'medium' ? 'Moyenne confiance' : 'Faible confiance'}
              </span>
              <span className="text-sm text-gray-600">
                {duplicateGroup.reason === 'dn' ? 'DN identique' :
                 duplicateGroup.reason === 'name_birth' ? 'Nom + Prénom + Date identiques' : 'DN + Nom identiques'}
              </span>
            </div>
          </div>

          {/* Sélection des champs */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sélection des informations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {duplicateGroup.patients.map((patient, index) => (
                <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Patient {index + 1}: {patient.prenom} {patient.nom}
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom</label>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="nom"
                          checked={selectedFields.nom === patient.nom}
                          onChange={() => handleFieldChange('nom', patient.nom)}
                          className="mr-2"
                        />
                        <span className="text-sm">{patient.nom}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Prénom</label>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="prenom"
                          checked={selectedFields.prenom === patient.prenom}
                          onChange={() => handleFieldChange('prenom', patient.prenom)}
                          className="mr-2"
                        />
                        <span className="text-sm">{patient.prenom}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">DN</label>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="dn"
                          checked={selectedFields.dn === patient.dn}
                          onChange={() => handleFieldChange('dn', patient.dn)}
                          className="mr-2"
                        />
                        <span className="text-sm">{patient.dn || 'Non renseigné'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="dateNaissance"
                          checked={(() => {
                            const selectedDate = selectedFields.dateNaissance instanceof Date ? selectedFields.dateNaissance : new Date(selectedFields.dateNaissance);
                            const patientDate = patient.dateNaissance instanceof Date ? patient.dateNaissance : new Date(patient.dateNaissance);
                            return selectedDate.getTime() === patientDate.getTime();
                          })()}
                          onChange={() => handleFieldChange('dateNaissance', patient.dateNaissance)}
                          className="mr-2"
                        />
                        <span className="text-sm">{new Date(patient.dateNaissance).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Adresse</label>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="adresse"
                          checked={selectedFields.adresse === (patient.adresse || '')}
                          onChange={() => handleFieldChange('adresse', patient.adresse || '')}
                          className="mr-2"
                        />
                        <span className="text-sm">{patient.adresse || 'Non renseignée'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="telephone"
                          checked={selectedFields.telephone === (patient.telephone || '')}
                          onChange={() => handleFieldChange('telephone', patient.telephone || '')}
                          className="mr-2"
                        />
                        <span className="text-sm">{patient.telephone || 'Non renseigné'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sélection des ordonnances */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ordonnances à conserver</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {duplicateGroup.patients.map(patient => {
                const patientOrdonnances = ordonnances.filter(ord => ord.patient_id === patient.id);
                return patientOrdonnances.map(ordonnance => (
                  <div key={ordonnance.id} className="flex items-center p-2 border border-gray-200 rounded">
                    <input
                      type="checkbox"
                      checked={selectedOrdonnances.has(ordonnance.id)}
                      onChange={() => handleOrdonnanceToggle(ordonnance.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {patient.prenom} {patient.nom} - {ordonnance.type || 'soins'}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(ordonnance.date_ordonnance).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ));
              })}
            </div>
          </div>

          {/* Sélection des feuilles de soins */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Feuilles de soins à conserver</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {duplicateGroup.patients.map(patient => {
                const patientFeuilles = feuillesSoins.filter(fs => fs.patient_id === patient.id);
                return patientFeuilles.map(feuille => (
                  <div key={feuille.id} className="flex items-center p-2 border border-gray-200 rounded">
                    <input
                      type="checkbox"
                      checked={selectedFeuillesSoins.has(feuille.id)}
                      onChange={() => handleFeuilleSoinsToggle(feuille.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {patient.prenom} {patient.nom} - Feuille #{feuille.numeroFeuilleSoins}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(feuille.datePrescription).toLocaleDateString('fr-FR')} - {feuille.montantTotal.toFixed(0)} XPF
                      </span>
                    </div>
                  </div>
                ));
              })}
            </div>
          </div>

          {/* Aperçu du patient fusionné */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Aperçu du patient fusionné</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Nom:</strong> {selectedFields.nom}</div>
              <div><strong>Prénom:</strong> {selectedFields.prenom}</div>
              <div><strong>DN:</strong> {selectedFields.dn || 'Non renseigné'}</div>
              <div><strong>Date de naissance:</strong> {selectedFields.dateNaissance instanceof Date ? selectedFields.dateNaissance.toLocaleDateString('fr-FR') : 'Date invalide'}</div>
              <div><strong>Adresse:</strong> {selectedFields.adresse || 'Non renseignée'}</div>
              <div><strong>Téléphone:</strong> {selectedFields.telephone || 'Non renseigné'}</div>
            </div>
            <div className="mt-3 text-sm">
              <strong>Ordonnances conservées:</strong> {selectedOrdonnances.size}
            </div>
            <div className="text-sm">
              <strong>Feuilles de soins conservées:</strong> {selectedFeuillesSoins.size}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleMerge}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Fusion en cours...' : 'Fusionner les patients'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergePatientsModal;

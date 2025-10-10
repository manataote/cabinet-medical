import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import OrdonnanceList from '../ordonnances/OrdonnanceList';
import OrdonnanceForm from '../ordonnances/OrdonnanceForm';
import PatientNotes from './PatientNotes';
import { Ordonnance, Patient } from '../../types';
import { PatientsService } from '../../services/patientsService';

interface PatientDetailsProps {
  onBack: () => void;
  onEdit: (patient: Patient) => void;
  patient_id: string;
}

const PatientDetails: React.FC<PatientDetailsProps> = ({ onBack, onEdit, patient_id }) => {
  const { state, addPatientNote, deletePatientNote } = useApp();
  const [showOrdonnanceForm, setShowOrdonnanceForm] = useState(false);
  const [selectedOrdonnance, setSelectedOrdonnance] = useState<Ordonnance | undefined>(undefined);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleAddOrdonnance = () => {
    setShowOrdonnanceForm(true);
    setSelectedOrdonnance(undefined);
  };

  const handleEditOrdonnance = (ordonnance: Ordonnance) => {
    setSelectedOrdonnance(ordonnance);
    setShowOrdonnanceForm(true);
  };

  const handleBackFromOrdonnanceForm = () => {
    setShowOrdonnanceForm(false);
    setSelectedOrdonnance(undefined);
  };
  
  // Charger le patient au montage du composant
  useEffect(() => {
    const loadPatient = async () => {
      setIsLoading(true);
      try {
        // D'abord chercher dans le state (si les patients sont déjà chargés)
        let foundPatient: Patient | null = state.patients.find(p => p.id === patient_id) || null;
        
        // Si pas trouvé dans le state, charger depuis la BDD
        if (!foundPatient) {
          console.log('🔍 Patient non trouvé dans le state, chargement depuis la BDD...');
          foundPatient = await PatientsService.getPatientById(patient_id);
        }
        
        setPatient(foundPatient);
      } catch (error) {
        console.error('Erreur lors du chargement du patient:', error);
        setPatient(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPatient();
  }, [patient_id, state.patients]);
  
  // État de chargement
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }
  
  // Patient non trouvé
  if (!patient) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Patient non trouvé</p>
        </div>
        <button onClick={onBack} className="btn-secondary">
          Retour à la liste
        </button>
      </div>
    );
  }

  // Fonction pour calculer le nombre d'actes d'un patient
  const getNombreActes = (patient_id: string): number => {
    return state.feuillesSoins
      .filter(feuille => feuille.patient_id === patient_id)
      .reduce((total, feuille) => total + (feuille.actes?.length || 0), 0);
  };

  // Fonction pour calculer le nombre d'ordonnances d'un patient
  const getNombreOrdonnances = (patient_id: string): number => {
    return state.ordonnances.filter(ordonnance => ordonnance.patient_id === patient_id).length;
  };

  // Fonction pour obtenir la date de la dernière ordonnance de soins
  const getDerniereOrdonnanceSoins = (patient_id: string): string => {
    const ordonnancesSoins = state.ordonnances
      .filter(ordonnance => 
        ordonnance.patient_id === patient_id && 
        (ordonnance.type === 'soins' || !ordonnance.type) // Inclure les ordonnances sans type (anciennes)
      )
      .sort((a, b) => new Date(b.date_ordonnance).getTime() - new Date(a.date_ordonnance).getTime());
    
    if (ordonnancesSoins.length === 0) return '-';
    
    const derniereOrdonnance = ordonnancesSoins[0];
    return new Date(derniereOrdonnance.date_ordonnance).toLocaleDateString('fr-FR');
  };

  // Fonction pour obtenir la date de la dernière ordonnance de semelles
  const getDerniereOrdonnanceSemelles = (patient_id: string): string => {
    const ordonnancesSemelles = state.ordonnances
      .filter(ordonnance => 
        ordonnance.patient_id === patient_id && 
        ordonnance.type === 'semelles'
      )
      .sort((a, b) => new Date(b.date_ordonnance).getTime() - new Date(a.date_ordonnance).getTime());
    
    if (ordonnancesSemelles.length === 0) return '-';
    
    const derniereOrdonnance = ordonnancesSemelles[0];
    return new Date(derniereOrdonnance.date_ordonnance).toLocaleDateString('fr-FR');
  };

  // Ordonnances du patient
  const patientOrdonnances = state.ordonnances.filter(ordonnance => ordonnance.patient_id === patient_id);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Détails du patient</h1>
          <p className="text-gray-600">Informations complètes de {patient.prenom} {patient.nom}</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => onEdit(patient)} className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier
          </button>
          <button onClick={onBack} className="btn-secondary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </button>
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations personnelles */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Informations personnelles</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border">{patient.nom}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Prénom</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border">{patient.prenom}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">DN</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border">{patient.dn}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                  {(() => {
                    try {
                      const date = new Date(patient.dateNaissance);
                      return isNaN(date.getTime()) ? 'Date invalide' : date.toLocaleDateString('fr-FR');
                    } catch {
                      return 'Date invalide';
                    }
                  })()}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Adresse</label>
              <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border min-h-[40px]">
                {patient.adresse || 'Non renseignée'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone</label>
              <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                {patient.telephone || 'Non renseigné'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Référence patient</label>
              <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border font-mono">
                {patient.numeroFacture}
              </p>
            </div>
          </div>
        </div>

        {/* Informations de l'assuré */}
        {patient.assure && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Informations de l'assuré</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border">{patient.assure.nom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border">{patient.assure.prenom}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">DN</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border">{patient.assure.dn}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                    {(() => {
                      try {
                        const date = new Date(patient.assure.dateNaissance);
                        return isNaN(date.getTime()) ? 'Date invalide' : date.toLocaleDateString('fr-FR');
                      } catch {
                        return 'Date invalide';
                      }
                    })()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Adresse</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border min-h-[40px]">
                  {patient.assure.adresse || 'Non renseignée'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                  {patient.assure.telephone || 'Non renseigné'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Statistiques</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{getNombreActes(patient.id)}</div>
            <div className="text-sm text-blue-800">Actes</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{getNombreOrdonnances(patient.id)}</div>
            <div className="text-sm text-green-800">Ordonnances</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{getDerniereOrdonnanceSoins(patient.id)}</div>
            <div className="text-sm text-purple-800">Dernière ordonnance soins</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{getDerniereOrdonnanceSemelles(patient.id)}</div>
            <div className="text-sm text-orange-800">Dernière ordonnance semelles</div>
          </div>
        </div>
      </div>

      {/* Notes du patient */}
      <PatientNotes
        patientId={patient.id}
        notes={[]} // Les notes sont chargées automatiquement par le composant
        onAddNote={(note) => addPatientNote(patient.id, note)}
        onDeleteNote={(noteId) => deletePatientNote(patient.id, noteId)}
        readOnly={false}
      />

      {/* Ordonnances du patient */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Ordonnances</h2>
        {patientOrdonnances.length > 0 ? (
          <OrdonnanceList 
            patientId={patient.id}
            onAddOrdonnance={handleAddOrdonnance}
            onEditOrdonnance={handleEditOrdonnance}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Aucune ordonnance enregistrée</p>
            <button
              onClick={handleAddOrdonnance}
              className="btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle ordonnance
            </button>
          </div>
        )}
      </div>

      {/* Modal pour le formulaire d'ordonnance */}
      {showOrdonnanceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedOrdonnance ? 'Modifier l\'ordonnance' : 'Nouvelle ordonnance'}
              </h3>
              <button
                onClick={handleBackFromOrdonnanceForm}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Fermer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <OrdonnanceForm
                patientId={patient.id}
                ordonnanceToEdit={selectedOrdonnance}
                onBack={handleBackFromOrdonnanceForm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;

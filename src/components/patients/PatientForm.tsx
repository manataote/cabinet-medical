import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Patient, Ordonnance } from '../../types';
import { ValidationUtils } from '../../utils/validation';
import { v4 as uuidv4 } from 'uuid';
import OrdonnanceList from '../ordonnances/OrdonnanceList';
import OrdonnanceForm from '../ordonnances/OrdonnanceForm';
import PatientNotes from './PatientNotes';

interface PatientFormProps {
  onBack: () => void;
  patient?: Patient;
}

const PatientForm: React.FC<PatientFormProps> = ({ onBack, patient }) => {
  const { addPatient, updatePatient, addPatientNote, deletePatientNote } = useApp();
  const [errors, setErrors] = useState<string[]>([]);
  const [hasAssure, setHasAssure] = useState(!!patient?.assure);
  const [showOrdonnanceForm, setShowOrdonnanceForm] = useState(false);
  const [selectedOrdonnance, setSelectedOrdonnance] = useState<Ordonnance | undefined>(undefined);

  const [formData, setFormData] = useState<Partial<Patient>>({
    id: patient?.id || uuidv4(),
    numeroFacture: patient?.numeroFacture || ValidationUtils.generateNumeroFacture(),
    nom: patient?.nom || '',
    prenom: patient?.prenom || '',
    dn: patient?.dn || '',
    dateNaissance: patient?.dateNaissance || new Date(),
    adresse: patient?.adresse || '',
    telephone: patient?.telephone || '',
    assure: patient?.assure || {
      nom: '',
      prenom: '',
      dn: '',
      dateNaissance: new Date(),
      adresse: '',
      telephone: '',
    },
  });

  const handleInputChange = (field: string, value: any) => {
    // Validation spéciale pour la date de naissance
    if (field === 'dateNaissance') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        // Date invalide, ne pas mettre à jour
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAssureChange = (field: string, value: any) => {
    // Validation spéciale pour la date de naissance de l'assuré
    if (field === 'dateNaissance') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        // Date invalide, ne pas mettre à jour
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      assure: prev.assure ? {
        ...prev.assure,
        [field]: value
      } : {
        nom: '',
        prenom: '',
        dn: '',
        dateNaissance: new Date(),
        adresse: '',
        telephone: '',
        [field]: value
      }
    }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des dates avant création de l'objet patient
    const dateNaissance = formData.dateNaissance ? new Date(formData.dateNaissance) : new Date();
    const assureDateNaissance = formData.assure?.dateNaissance ? new Date(formData.assure.dateNaissance) : new Date();
    
    const patientData: Patient = {
      id: formData.id!,
      numeroFacture: formData.numeroFacture!,
      nom: formData.nom!,
      prenom: formData.prenom!,
      dn: formData.dn!,
      dateNaissance: isNaN(dateNaissance.getTime()) ? new Date() : dateNaissance,
      adresse: formData.adresse || '',
      telephone: formData.telephone || '',
      assure: hasAssure ? {
        ...formData.assure!,
        dateNaissance: isNaN(assureDateNaissance.getTime()) ? new Date() : assureDateNaissance,
      } : undefined,
    };

    const validation = ValidationUtils.validatePatient(patientData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      console.log('🔄 Début de la sauvegarde du patient:', patientData);
      
      if (patient) {
        console.log('📝 Mise à jour du patient existant...');
        await updatePatient(patientData);
        console.log('✅ Patient mis à jour avec succès');
      } else {
        console.log('➕ Création d\'un nouveau patient...');
        await addPatient(patientData);
        console.log('✅ Nouveau patient créé avec succès');
      }
      
      // Émettre un événement pour signaler qu'un patient a été sauvegardé
      window.dispatchEvent(new CustomEvent('patientSaved'));
      
      console.log('🔙 Retour à la liste des patients');
      onBack();
    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde du patient:', error);
      setErrors([`Erreur lors de la sauvegarde: ${error.message || error}`]);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {patient ? 'Modifier le patient' : 'Nouveau patient'}
          </h1>
          <p className="text-gray-600">
            {patient ? 'Modifier les informations du patient' : 'Ajouter un nouveau patient'}
          </p>
        </div>
        <button onClick={onBack} className="btn-secondary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour
        </button>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="card">
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 mb-2">Erreurs de validation :</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations patient */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informations patient
            </h3>
            
            <div className="form-group">
              <label className="form-label">Prénom *</label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => handleInputChange('prenom', e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">DN (7 chiffres) *</label>
              <input
                type="text"
                value={formData.dn}
                onChange={(e) => handleInputChange('dn', e.target.value)}
                className="input-field"
                pattern="[0-9]{7}"
                maxLength={7}
                placeholder="4972845"
                required
              />
              <p className="form-help">Identifiant CPS (exactement 7 chiffres)</p>
            </div>

            <div className="form-group">
              <label className="form-label">Date de naissance</label>
              <input
                type="date"
                value={formData.dateNaissance ? (() => {
                  const date = new Date(formData.dateNaissance);
                  return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
                })() : ''}
                onChange={(e) => handleInputChange('dateNaissance', new Date(e.target.value))}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Adresse</label>
              <textarea
                value={formData.adresse}
                onChange={(e) => handleInputChange('adresse', e.target.value)}
                className="input-field"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleInputChange('telephone', e.target.value)}
                className="input-field"
                placeholder="01 23 45 67 89"
              />
            </div>
          </div>

          {/* Informations assuré */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-lg font-medium text-gray-900">
                Informations assuré
              </h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hasAssure}
                  onChange={(e) => setHasAssure(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Assuré différent</span>
              </label>
            </div>

            {hasAssure ? (
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Prénom assuré *</label>
                  <input
                    type="text"
                    value={formData.assure?.prenom || ''}
                    onChange={(e) => handleAssureChange('prenom', e.target.value)}
                    className="input-field"
                    required={hasAssure}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nom assuré *</label>
                  <input
                    type="text"
                    value={formData.assure?.nom || ''}
                    onChange={(e) => handleAssureChange('nom', e.target.value)}
                    className="input-field"
                    required={hasAssure}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">DN assuré (7 chiffres) *</label>
                  <input
                    type="text"
                    value={formData.assure?.dn || ''}
                    onChange={(e) => handleAssureChange('dn', e.target.value)}
                    className="input-field"
                    pattern="[0-9]{7}"
                    maxLength={7}
                    placeholder="4972845"
                    required={hasAssure}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date de naissance assuré *</label>
                  <input
                    type="date"
                    value={formData.assure?.dateNaissance ? (() => {
                      const date = new Date(formData.assure.dateNaissance);
                      return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
                    })() : ''}
                    onChange={(e) => handleAssureChange('dateNaissance', new Date(e.target.value))}
                    className="input-field"
                    required={hasAssure}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Adresse assuré</label>
                  <textarea
                    value={formData.assure?.adresse || ''}
                    onChange={(e) => handleAssureChange('adresse', e.target.value)}
                    className="input-field"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Téléphone assuré</label>
                  <input
                    type="tel"
                    value={formData.assure?.telephone || ''}
                    onChange={(e) => handleAssureChange('telephone', e.target.value)}
                    className="input-field"
                    placeholder="01 23 45 67 89"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p>Cochez la case ci-dessus si l'assuré est différent du patient</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-primary"
          >
            {patient ? 'Modifier' : 'Créer'} le patient
          </button>
        </div>
      </form>

      {/* Section Notes du patient */}
      {patient && (
        <PatientNotes
          patientId={patient.id}
          notes={[]} // Les notes sont chargées automatiquement par le composant
          onAddNote={(note) => addPatientNote(patient.id, note)}
          onDeleteNote={(noteId) => deletePatientNote(patient.id, noteId)}
          readOnly={false}
        />
      )}

      {/* Section Ordonnances */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Ordonnances</h3>
          <p className="text-sm text-gray-600">
            {patient ? 'Gérer les ordonnances du patient' : 'Ajouter des ordonnances pour le nouveau patient'}
          </p>
        </div>

        <OrdonnanceList
          patientId={formData.id!}
          onAddOrdonnance={handleAddOrdonnance}
          onEditOrdonnance={handleEditOrdonnance}
        />
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
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <OrdonnanceForm
                patientId={formData.id!}
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

export default PatientForm; 
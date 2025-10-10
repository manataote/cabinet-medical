import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { FactureSemelles, ActeOrthopedique, Patient, Medecin } from '../../types';
import { ValidationUtils } from '../../utils/validation';
import { CalculUtils } from '../../utils/calculs';
import { v4 as uuidv4 } from 'uuid';
import PatientSearchInput from '../patients/PatientSearchInput';
import MedecinSearchInput from '../medecins/MedecinSearchInput';

interface FactureSemellesFormProps {
  onBack: () => void;
  facture?: FactureSemelles;
}

const FactureSemellesForm: React.FC<FactureSemellesFormProps> = ({ onBack, facture }) => {
  const { state, addFactureSemelles, updateFactureSemelles } = useApp();
  const [errors, setErrors] = useState<string[]>([]);
  
  // Fonction utilitaire pour s'assurer qu'une valeur est un objet Date
  const ensureDate = (date: any): Date => {
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    return new Date();
  };

  // Récupérer le patient sélectionné depuis le localStorage si disponible
  const getInitialPatientData = () => {
    if (facture?.patient) {
      return { patient: facture.patient, id: facture.patient.id };
    }
    
    const storedPatient = localStorage.getItem('selectedPatientForFacture');
    if (storedPatient) {
      try {
        const patient = JSON.parse(storedPatient);
        return { patient, id: patient.id };
      } catch (error) {
        console.error('Erreur lors du parsing du patient stocké:', error);
        const defaultPatient = state.patients[0] || {
          id: '',
          numeroFacture: '',
          nom: '',
          prenom: '',
          dn: '',
          dateNaissance: new Date(),
          adresse: '',
          telephone: '',
        };
        return { patient: defaultPatient, id: defaultPatient.id };
      }
    }
    
    const defaultPatient = state.patients[0] || {
      id: '',
      numeroFacture: '',
      nom: '',
      prenom: '',
      dn: '',
      dateNaissance: new Date(),
      adresse: '',
      telephone: '',
    };
    return { patient: defaultPatient, id: defaultPatient.id };
  };

  const initialPatientData = getInitialPatientData();
  const [selectedPatient, setSelectedPatient] = useState<string>(initialPatientData.id);

  // Mettre à jour selectedPatient et nettoyer le localStorage au montage du composant
  React.useEffect(() => {
    if (initialPatientData.id) {
      setSelectedPatient(initialPatientData.id);
      // Nettoyer le localStorage après utilisation
      localStorage.removeItem('selectedPatientForFacture');
    }
  }, [initialPatientData.id]);

  const [formData, setFormData] = useState<Partial<FactureSemelles>>({
    id: facture?.id || uuidv4(),
    numeroFacture: facture?.numeroFacture || ValidationUtils.generateNumeroFacture(),
    patient: initialPatientData.patient,
    actesOrthopediques: facture?.actesOrthopediques || [],
    montantTotal: facture?.montantTotal || 0,
    dateSoins: facture?.dateSoins ? ensureDate(facture.dateSoins) : new Date(),
    medecinPrescripteur: facture?.medecinPrescripteur || undefined,
    datePrescription: facture?.datePrescription ? ensureDate(facture.datePrescription) : new Date(),
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validation en temps réel pour les dates
    if (field === 'datePrescription' || field === 'dateSoins') {
      validateDates();
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient.id);
    
    // Trouver la date de la dernière ordonnance de semelles du patient
    const derniereOrdonnanceSemelles = state.ordonnances
      .filter(ordonnance => 
        ordonnance.patient_id === patient.id && 
        ordonnance.type === 'semelles'
      )
      .sort((a, b) => {
        const dateA = new Date(a.date_ordonnance);
        const dateB = new Date(b.date_ordonnance);
        return dateB.getTime() - dateA.getTime();
      })[0];
    
    // Utiliser la date de la dernière ordonnance de semelles si elle existe, sinon garder la date actuelle
    const nouvelleDatePrescription = derniereOrdonnanceSemelles 
      ? new Date(derniereOrdonnanceSemelles.date_ordonnance)
      : formData.datePrescription || new Date();
    
    setFormData(prev => ({
      ...prev,
      patient,
      datePrescription: nouvelleDatePrescription
    }));
  };

  const handleMedecinSelect = (medecin: Medecin) => {
    setFormData(prev => ({
      ...prev,
      medecinPrescripteur: medecin
    }));
  };
  
  // Fonction de validation des dates
  const validateDates = () => {
    const datePrescription = formData.datePrescription ? ensureDate(formData.datePrescription) : new Date();
    const dateSoins = formData.dateSoins ? ensureDate(formData.dateSoins) : new Date();
    
    if (datePrescription > dateSoins) {
      setErrors(['La date de prescription ne peut pas être postérieure à la date des soins']);
    } else {
      setErrors([]);
    }
  };

  // Fonctions pour gérer les actes orthopédiques
  const addActeOrthopedique = (acteOrthopedique: ActeOrthopedique) => {
    const nouvelActe: ActeOrthopedique = {
      id: acteOrthopedique.id, // ✅ Utiliser l'ID de l'acte existant
      libelleInterne: acteOrthopedique.libelleInterne,
      libelleFacture: acteOrthopedique.libelleFacture,
      codeLPPR: acteOrthopedique.codeLPPR,
      quantite: acteOrthopedique.quantite,
      total: acteOrthopedique.total,
      partCPS: acteOrthopedique.partCPS,
      partPatient: acteOrthopedique.partPatient,
      tarifBase: acteOrthopedique.tarifBase,
      tarifBaseLPPR: acteOrthopedique.tarifBaseLPPR,
      tauxApplique: acteOrthopedique.tauxApplique,
      regime: acteOrthopedique.regime,
      actif: true
    };

    setFormData(prev => ({
      ...prev,
      actesOrthopediques: [...(prev.actesOrthopediques || []), nouvelActe]
    }));
  };

  const removeActeOrthopedique = (acteId: string) => {
    setFormData(prev => ({
      ...prev,
      actesOrthopediques: (prev.actesOrthopediques || []).filter(acte => acte.id !== acteId)
    }));
  };

  const updateActeOrthopedique = (acteId: string, updatedActe: Partial<ActeOrthopedique>) => {
    setFormData(prev => ({
      ...prev,
      actesOrthopediques: (prev.actesOrthopediques || []).map(acte => {
        if (acte.id === acteId) {
          const updated = { ...acte, ...updatedActe };
          
          // Vérifier si on met à jour partCPS ou partPatient
          if (updatedActe.partCPS !== undefined || updatedActe.partPatient !== undefined) {
            const partCPS = updatedActe.partCPS !== undefined ? updatedActe.partCPS : acte.partCPS;
            const partPatient = updatedActe.partPatient !== undefined ? updatedActe.partPatient : acte.partPatient;
            const total = partCPS + partPatient;
            
            // Mettre à jour le total automatiquement
            updated.total = total;
          }
          
          return updated;
        }
        return acte;
      })
    }));
  };

  // Calculer le montant total
  const calculerMontantTotal = () => {
    return (formData.actesOrthopediques || []).reduce((total, acte) => total + acte.total, 0);
  };


  // Fonctions pour gérer les actes orthopédiques (déjà définies plus haut)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialiser les erreurs
    setErrors([]);
    
    // Validation des champs obligatoires
    if (!formData.patient || !formData.patient.id || formData.patient.id.trim() === '' || (formData.actesOrthopediques?.length || 0) === 0) {
      setErrors(['Veuillez sélectionner un patient et ajouter au moins un acte orthopédique']);
      return;
    }
    
    // Validation de la date de prescription vs date des soins
    const datePrescription = formData.datePrescription ? ensureDate(formData.datePrescription) : new Date();
    const dateSoins = formData.dateSoins ? ensureDate(formData.dateSoins) : new Date();
    
    if (datePrescription > dateSoins) {
      setErrors(['La date de prescription ne peut pas être postérieure à la date des soins']);
      return;
    }

    try {
      const montantTotal = calculerMontantTotal();
      const factureData: FactureSemelles = {
        id: formData.id!,
        numeroFacture: formData.numeroFacture!,
        patient: formData.patient,
        actesOrthopediques: formData.actesOrthopediques || [],
        montantTotal: montantTotal,
        dateSoins: formData.dateSoins || new Date(),
        medecinPrescripteur: formData.medecinPrescripteur || undefined,
        datePrescription: formData.datePrescription || new Date()
      };

      if (facture) {
        await updateFactureSemelles(factureData);
      } else {
        await addFactureSemelles(factureData);
      }
      
      onBack();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la facture semelles:', error);
      setErrors([`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`]);
    }
  };

  const montantTotal = calculerMontantTotal();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {facture ? 'Modifier la facture semelles' : 'Nouvelle facture semelles'}
          </h1>
          <p className="text-gray-600">
            {facture ? 'Modifier les informations de la facture' : 'Créer une nouvelle facture pour semelles orthopédiques'}
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 mb-2">Erreurs de validation :</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Informations de base */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Informations de base</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Patient *</label>
              <PatientSearchInput
                onPatientSelect={handlePatientSelect}
                placeholder="Rechercher un patient..."
                className="w-full"
              />
              {formData.patient && (formData.patient as Patient).id && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm font-medium text-blue-900">
                    Patient sélectionné : {formData.patient.prenom} {formData.patient.nom}
                  </div>
                  <div className="text-xs text-blue-700">
                    DN: {(formData.patient as Patient).dn || 'Non renseigné'} • {(formData.patient as Patient).dateNaissance ? new Date((formData.patient as Patient).dateNaissance).toLocaleDateString('fr-FR') : 'Date inconnue'}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">N° Facture</label>
              <input
                type="text"
                value={formData.numeroFacture}
                onChange={(e) => handleInputChange('numeroFacture', e.target.value)}
                className="input-field"
                readOnly
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date des soins</label>
              <input
                type="date"
                value={ensureDate(formData.dateSoins).toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('dateSoins', new Date(e.target.value))}
                className={`input-field ${errors.some(error => error.includes('date de prescription')) ? 'border-red-500' : ''}`}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Médecin prescripteur</label>
              <MedecinSearchInput
                onMedecinSelect={handleMedecinSelect}
                placeholder="Rechercher un médecin..."
                className="w-full"
              />
              {formData.medecinPrescripteur && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm font-medium text-blue-900">
                    Médecin sélectionné : Dr. {formData.medecinPrescripteur.prenom} {formData.medecinPrescripteur.nom}
                  </div>
                  <div className="text-xs text-blue-700">
                    {formData.medecinPrescripteur.specialite && `Spécialité: ${formData.medecinPrescripteur.specialite}`}
                    {formData.medecinPrescripteur.identificationPrescripteur && ` • ID: ${formData.medecinPrescripteur.identificationPrescripteur}`}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Date de prescription</label>
              <input
                type="date"
                value={ensureDate(formData.datePrescription).toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('datePrescription', new Date(e.target.value))}
                className={`input-field ${errors.some(error => error.includes('date de prescription')) ? 'border-red-500' : ''}`}
              />
              {selectedPatient && formData.patient && (
                <p className="text-xs text-blue-600 mt-1">
                  💡 Date automatiquement remplie depuis la dernière ordonnance de semelles du patient
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actes orthopédiques */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title">Actes orthopédiques</h3>
              <div className="flex space-x-2">
                <select
                  value=""
                  onChange={(e) => {
                    const acteOrthopedique = state.actesOrthopediques.find(t => t.id === e.target.value);
                    if (acteOrthopedique) {
                      addActeOrthopedique(acteOrthopedique);
                    }
                  }}
                  className="input-field"
                >
                  <option value="">Sélectionner un acte</option>
                  {state.actesOrthopediques
                    .filter(acte => acte.actif)
                    .map(acte => (
                      <option key={acte.id} value={acte.id}>
                        {acte.libelleInterne}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
          
          {(formData.actesOrthopediques?.length || 0) === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun acte orthopédique ajouté. Sélectionnez un acte dans la liste déroulante pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.actesOrthopediques?.map((acte, index) => (
                <div key={acte.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">{acte.libelleInterne}</h4>
                    <button
                      type="button"
                      onClick={() => removeActeOrthopedique(acte.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label className="form-label">Libellé facture</label>
                      <input
                        type="text"
                        value={acte.libelleFacture}
                        onChange={(e) => updateActeOrthopedique(acte.id, { libelleFacture: e.target.value })}
                        className="input-field"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Code LPPR</label>
                      <input
                        type="text"
                        value={acte.codeLPPR}
                        onChange={(e) => updateActeOrthopedique(acte.id, { codeLPPR: e.target.value })}
                        className="input-field"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Quantité</label>
                      <input
                        type="number"
                        value={acte.quantite}
                        onChange={(e) => updateActeOrthopedique(acte.id, { quantite: Number(e.target.value) })}
                        className="input-field"
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tarif base LPPR</label>
                      <input
                        type="number"
                        value={acte.tarifBaseLPPR}
                        onChange={(e) => updateActeOrthopedique(acte.id, { tarifBaseLPPR: Number(e.target.value) || 0 })}
                        className="input-field"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Taux appliqué (%)</label>
                      <select
                        value={acte.tauxApplique}
                        onChange={(e) => updateActeOrthopedique(acte.id, { tauxApplique: Number(e.target.value) })}
                        className="input-field"
                      >
                        <option value={70}>70%</option>
                        <option value={100}>100%</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Régime</label>
                      <select
                        value={acte.regime}
                        onChange={(e) => updateActeOrthopedique(acte.id, { regime: e.target.value as any })}
                        className="input-field"
                      >
                        <option value="maladie">Maladie</option>
                        <option value="longue-maladie">Longue Maladie</option>
                        <option value="maternite">Maternité</option>
                        <option value="arret-travail">Arrêt de travail</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Total</label>
                      <input
                        type="number"
                        value={acte.total}
                        onChange={(e) => updateActeOrthopedique(acte.id, { total: Number(e.target.value) || 0 })}
                        className="input-field"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Part CPS</label>
                      <input
                        type="number"
                        value={acte.partCPS}
                        onChange={(e) => updateActeOrthopedique(acte.id, { partCPS: Number(e.target.value) || 0 })}
                        className="input-field"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Part Patient</label>
                      <input
                        type="number"
                        value={acte.partPatient}
                        onChange={(e) => updateActeOrthopedique(acte.id, { partPatient: Number(e.target.value) || 0 })}
                        className="input-field"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Validation des montants */}
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between">
                        <span>Part CPS + Part Patient:</span>
                        <span className="font-medium">{CalculUtils.formaterMontant(acte.partCPS + acte.partPatient)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{CalculUtils.formaterMontant(acte.total)}</span>
                      </div>
                      {Math.abs((acte.partCPS + acte.partPatient) - acte.total) > 0.01 && (
                        <div className="text-red-600 text-xs mt-1">
                          ⚠️ Les montants ne correspondent pas
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totaux */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Totaux</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="form-group">
              <label className="form-label">Montant total</label>
              <input
                type="text"
                value={CalculUtils.formaterMontant(montantTotal)}
                className="input-field font-bold text-primary-600 text-lg"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
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
            {facture ? 'Modifier' : 'Créer'} la facture
          </button>
        </div>
      </form>
    </div>
  );
};

export default FactureSemellesForm; 
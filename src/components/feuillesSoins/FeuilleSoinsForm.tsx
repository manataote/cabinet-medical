import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { FeuilleSoins, Acte, ActeTemplate, ActeSoins, Patient, Medecin } from '../../types';
import { ValidationUtils } from '../../utils/validation';
import { CalculUtils } from '../../utils/calculs';
import { v4 as uuidv4 } from 'uuid';
import PatientSearchInput from '../patients/PatientSearchInput';
import MedecinSearchInput from '../medecins/MedecinSearchInput';

interface FeuilleSoinsFormProps {
  onBack: () => void;
  feuille?: FeuilleSoins;
}

const FeuilleSoinsForm: React.FC<FeuilleSoinsFormProps> = ({ onBack, feuille }) => {
  const { state, addFeuilleSoins, updateFeuilleSoins, formaterMontant } = useApp();
  const [errors, setErrors] = useState<string[]>([]);
  const [editingActeIndex, setEditingActeIndex] = useState<number | null>(null);

  // Fonction pour obtenir un résumé concis d'un acte
  const getActeResume = (acte: Acte) => {
    console.log('🔍 getActeResume appelé pour:', { 
      acteId: acte.id, 
      acteLettreCle: acte.lettreCle,
      acteCoefficient: acte.coefficient 
    });
    
    // Trouver le template correspondant pour obtenir le libellé et tarif
    let libelle = acte.lettreCle;
    let tarif: number | undefined;
    
    // Chercher dans les actes de soins par ID (plus précis que par code)
    const acteSoinsTemplate = state.actesSoins?.find(t => t.id === acte.id);
    if (acteSoinsTemplate) {
      console.log('✅ Acte soins trouvé par ID:', { 
        templateId: acteSoinsTemplate.id, 
        templateCode: acteSoinsTemplate.code, 
        templateLibelle: acteSoinsTemplate.libelle,
        templateTarif: acteSoinsTemplate.tarif 
      });
      libelle = acteSoinsTemplate.libelle;
      tarif = acteSoinsTemplate.tarif;
    } else {
      // Fallback vers l'ancien système par ID
      const template = state.acteTemplates.find(t => t.id === acte.id);
      if (template) {
        console.log('✅ Template ancien système trouvé par ID:', { 
          templateId: template.id, 
          templateCode: template.lettreCle, 
          templateLibelle: template.libelle,
          templateTarif: template.tarif 
        });
        libelle = template.libelle;
        tarif = template.tarif;
      } else {
        console.warn('⚠️ Aucun template trouvé pour l\'acte par ID:', { 
          acteId: acte.id, 
          lettreCle: acte.lettreCle,
          actesSoinsDisponibles: state.actesSoins?.map(a => ({ id: a.id, code: a.code }))
        });
      }
    }
    
    const montantCalcule = tarif ? CalculUtils.calculerMontantActe(
      acte, 
      state.configuration.calculs?.multiplicateurIK || 0.35, 
      state.configuration.calculs?.tarifIFD || 2.0,
      tarif,
      state.configuration.calculs?.majorationNuit || 0.0,
      state.configuration.calculs?.majorationDimanche || 0.0
    ) : 0;

    const dateFormatee = new Date(acte.date).toLocaleDateString('fr-FR');
    const details = [
      `Coeff: ${acte.coefficient}`,
      acte.ifd ? 'IFD' : '',
      acte.ik ? `IK: ${acte.ik}km` : '',
      acte.majorationDimanche ? 'Dim' : '',
      acte.majorationNuit ? 'Nuit' : ''
    ].filter(Boolean).join(' • ');

    return {
      libelle,
      dateFormatee,
      details,
      montant: formaterMontant(montantCalcule)
    };
  };
  
  // Récupérer le patient sélectionné depuis le localStorage si disponible
  const getInitialPatientData = () => {
    if (feuille?.patient) {
      return { patient: feuille.patient, id: feuille.patient_id };
    }
    
    const storedPatient = localStorage.getItem('selectedPatientForFeuille');
    if (storedPatient) {
      try {
        const patient = JSON.parse(storedPatient);
        return { patient, id: patient.id };
      } catch (error) {
        console.error('Erreur lors du parsing du patient stocké:', error);
        return { patient: undefined, id: '' };
      }
    }
    
    return { patient: undefined, id: '' };
  };

  const initialPatientData = getInitialPatientData();
  const [selectedPatient, setSelectedPatient] = useState<string>(initialPatientData.id);

  // Mettre à jour selectedPatient et nettoyer le localStorage au montage du composant
  React.useEffect(() => {
    if (initialPatientData.id) {
      setSelectedPatient(initialPatientData.id);
      // Nettoyer le localStorage après utilisation
      localStorage.removeItem('selectedPatientForFeuille');
    }
  }, [initialPatientData.id]);

  // Debug: Logger les actes disponibles
  React.useEffect(() => {
    console.log('🔍 Actes disponibles dans FeuilleSoinsForm:', {
      actesSoins: state.actesSoins?.length || 0,
      actesSoinsSample: state.actesSoins?.slice(0, 3).map(a => ({ id: a.id, code: a.code, isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(a.id) }))
    });
  }, [state.actesSoins]);

  const [formData, setFormData] = useState<Partial<FeuilleSoins>>({
    id: feuille?.id || uuidv4(),
    numeroFeuilleSoins: feuille?.numeroFeuilleSoins || ValidationUtils.generateNumeroFeuilleSoins(),
    patient: initialPatientData.patient,
    patient_id: initialPatientData.id || feuille?.patient_id || '', // Ajouter patient_id
    assure: feuille?.assure || undefined,
    parcoursSoins: feuille?.parcoursSoins || false,
    accordPrealable: feuille?.accordPrealable || '',
    medecinPrescripteur: feuille?.medecinPrescripteur || '',
    datePrescription: feuille?.datePrescription || new Date(),
    conditions: feuille?.conditions || {
      longueMaladie: false,
      atmp: false,
      numeroAtmp: '',
      maternite: false,
      urgence: false,
      autresDerogations: false,
      descriptionAutresDerogations: ''
    },
    numeroPanierSoins: feuille?.numeroPanierSoins || '',
    rsr: feuille?.rsr || '',
    actes: feuille?.actes || [],
    montantTotal: feuille?.montantTotal || 0,
    montantPaye: feuille?.montantPaye || 0,
    montantTiersPayant: feuille?.montantTiersPayant || 0,
    modeleUtilise: feuille?.modeleUtilise || 'default'
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validation en temps réel pour la date de prescription
    if (field === 'datePrescription') {
      validateActesDates();
    }
  };
  
  // Fonction de validation des dates des actes (synchrone pour la soumission)
  const validateActesDatesSync = (): string[] => {
    if (!formData.actes || formData.actes.length === 0) {
      return [];
    }
    
    const datePrescription = formData.datePrescription ? new Date(formData.datePrescription) : new Date();
    const actesInvalides: string[] = [];
    
    formData.actes.forEach((acte, index) => {
      const dateActe = new Date(acte.date);
      if (dateActe < datePrescription) {
        actesInvalides.push(`Acte ${index + 1}`);
      }
    });
    
    if (actesInvalides.length > 0) {
      return [`Les actes suivants ont une date antérieure à la date de prescription: ${actesInvalides.join(', ')}`];
    }
    
    return [];
  };
  
  // Fonction de validation des dates des actes (asynchrone pour l'affichage en temps réel)
  const validateActesDates = () => {
    const validationErrors = validateActesDatesSync();
    setErrors(validationErrors);
  };

  const handleConditionChange = (field: string, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions ? {
        ...prev.conditions,
        [field]: value
      } : {
        longueMaladie: false,
        atmp: false,
        numeroAtmp: '',
        maternite: false,
        urgence: false,
        autresDerogations: false,
        descriptionAutresDerogations: '',
        [field]: value
      }
    }));
  };

  const handlePatientSelect = (patient: Patient) => {
    console.log('🔍 handlePatientSelect appelé avec:', patient);
    setSelectedPatient(patient.id);
    
    // Trouver la date de la dernière ordonnance de soins du patient
    const derniereOrdonnanceSoins = state.ordonnances
      .filter(ordonnance => 
        ordonnance.patient_id === patient.id && 
        (ordonnance.type === 'soins' || !ordonnance.type) // Inclure les ordonnances sans type (anciennes)
      )
      .sort((a, b) => {
        const dateA = new Date(a.date_ordonnance);
        const dateB = new Date(b.date_ordonnance);
        return dateB.getTime() - dateA.getTime();
      })[0];
    
    // Utiliser la date de la dernière ordonnance de soins si elle existe, sinon garder la date actuelle
    const nouvelleDatePrescription = derniereOrdonnanceSoins 
      ? new Date(derniereOrdonnanceSoins.date_ordonnance)
      : formData.datePrescription || new Date();
    
    setFormData(prev => ({
      ...prev,
      patient,
      patient_id: patient.id,
      datePrescription: nouvelleDatePrescription
    }));
  };

  const handleMedecinSelect = (medecin: Medecin) => {
    setFormData(prev => ({
      ...prev,
      medecinPrescripteur: medecin.id
    }));
  };

  const addActe = (template?: ActeTemplate) => {
    const newActe: Acte = {
      id: `acte_${Date.now()}`,
      patientId: selectedPatient || '',
      date: new Date(),
      lettreCle: template?.lettreCle || '',
      coefficient: template?.coefficient || 1,
      ifd: false,
      ik: undefined,
      majorationDimanche: false,
      majorationNuit: false,
      montant: template ? template.tarif : 0,
      // devise supprimée - Application forcée en XPF
      medecinPrescripteur: formData.medecinPrescripteur || '',
    };

    setFormData(prev => ({
      ...prev,
      actes: [...(prev.actes || []), newActe]
    }));
  };

  const addActeFromTemplate = (template: ActeSoins) => {
    console.log('🔍 Ajout d\'acte depuis template:', { 
      templateId: template.id, 
      templateCode: template.code,
      templateLibelle: template.libelle,
      templateCoefficient: template.coefficient,
      templateTarif: template.tarif,
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(template.id)
    });
    
    const newActe: Acte = {
      id: template.id, // Utiliser l'ID réel de l'acte de la base de données
      patientId: selectedPatient || '',
      date: new Date(),
      lettreCle: template.code,
      coefficient: template.coefficient,
      ifd: false,
      ik: undefined,
      majorationDimanche: false,
      majorationNuit: false,
      montant: template.tarif, // Le montant est le tarif, sans multiplier par le coefficient
      medecinPrescripteur: formData.medecinPrescripteur || '',
    };

    console.log('✅ Nouvel acte créé:', { 
      newActeId: newActe.id, 
      newActeLettreCle: newActe.lettreCle,
      newActeCoefficient: newActe.coefficient,
      newActeMontant: newActe.montant
    });

    setFormData(prev => ({
      ...prev,
      actes: [...(prev.actes || []), newActe]
    }));
  };

  const updateActe = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      actes: prev.actes?.map((acte, i) => {
        if (i === index) {
          const updatedActe = { ...acte, [field]: value };

          // Recalculer le montant de base si le coefficient change
          if (field === 'coefficient') {
            // Chercher dans les actes de soins
            const acteSoinsTemplate = state.actesSoins?.find(t => t.code === acte.lettreCle);
            if (acteSoinsTemplate) {
              updatedActe.montant = acteSoinsTemplate.tarif; // Le montant est le tarif, sans multiplier par le coefficient
            } else {
              // Chercher dans les actes orthopédiques
              const acteOrthoTemplate = state.actesOrthopediques?.find(t => t.codeLPPR === acte.lettreCle);
              if (acteOrthoTemplate) {
                updatedActe.montant = acteOrthoTemplate.total;
              } else {
                // Fallback vers l'ancien système si nécessaire
                const template = state.acteTemplates.find(t => t.lettreCle === acte.lettreCle);
                if (template) {
                  updatedActe.montant = template.tarif; // Le montant est le tarif, sans multiplier par le coefficient
                }
              }
            }
          }

          return updatedActe;
        }
        return acte;
      })
    }));
    
    // Validation en temps réel pour les dates des actes
    if (field === 'date') {
      setTimeout(() => validateActesDates(), 0);
    }
  };

  const removeActe = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actes: prev.actes?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialiser les erreurs
    setErrors([]);
    
    if (!formData.patient || !formData.actes || formData.actes.length === 0) {
      setErrors(['Veuillez sélectionner un patient et ajouter au moins un acte']);
      return;
    }

    if (!formData.id) {
      setErrors(['Erreur: ID de feuille manquant']);
      return;
    }

    // Debug des données du formulaire
    console.log('🔍 Debug validation feuille de soins:', {
      'formData.patient_id': formData.patient_id,
      'formData.patient': formData.patient,
      'formData.medecinPrescripteur': formData.medecinPrescripteur,
      'formData.id': formData.id
    });

    // Validation des champs requis
    if (!formData.patient_id) {
      console.error('❌ Patient ID manquant:', formData.patient_id);
      setErrors(['Erreur: Aucun patient sélectionné']);
      return;
    }

    if (!formData.medecinPrescripteur) {
      setErrors(['Erreur: Aucun médecin prescripteur sélectionné']);
      return;
    }
    
    // Validation des dates des actes
    const validationErrors = validateActesDatesSync();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Calculer les montants finaux
    const montantTotalFinal = montantTotalCalcule;
    const montantPayeFinal = Number(formData.montantPaye) || 0;
    const montantTiersPayantFinal = Math.max(0, montantTotalFinal - montantPayeFinal);

    const feuilleData: FeuilleSoins = {
      id: formData.id,
      numero_feuille: formData.numeroFeuilleSoins!,
      numeroFeuilleSoins: formData.numeroFeuilleSoins!,
      date_soins: formData.datePrescription!,
      medecin_prescripteur: formData.medecinPrescripteur!,
      medecinPrescripteur: formData.medecinPrescripteur!,
      date_prescription: formData.datePrescription!,
      datePrescription: formData.datePrescription!,
      montant_total: montantTotalFinal,
      montantTotal: montantTotalFinal,
      cabinet_id: '', // Sera défini par AppContext
      patient_id: formData.patient_id,
      patient: formData.patient,
      assure: formData.assure,
      parcoursSoins: formData.parcoursSoins!,
      accordPrealable: formData.accordPrealable,
      conditions: formData.conditions!,
      is_parcours_soins: formData.parcoursSoins!,
      is_longue_maladie: formData.conditions?.longueMaladie || false,
      is_atmp: formData.conditions?.atmp || false,
      is_maternite: formData.conditions?.maternite || false,
      is_urgence: formData.conditions?.urgence || false,
      is_autres_derogations: formData.conditions?.autresDerogations || false,
      dap: formData.accordPrealable,
      numeroPanierSoins: formData.numeroPanierSoins,
      panier_soins: formData.numeroPanierSoins,
      rsr: formData.rsr,
      actes: formData.actes,
      montantPaye: montantPayeFinal,
      montantTiersPayant: montantTiersPayantFinal,
      modeleUtilise: formData.modeleUtilise!,
    };

    const validation = ValidationUtils.validateFeuilleSoins(feuilleData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      if (feuille) {
        await updateFeuilleSoins(feuilleData);
        console.log('Feuille de soins mise à jour avec succès');
      } else {
        await addFeuilleSoins(feuilleData);
        console.log('Nouvelle feuille de soins créée avec succès');
      }
      
      onBack();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de la sauvegarde';
      setErrors([`Erreur lors de la sauvegarde: ${errorMessage}`]);
    }
  };

  const montantTotalCalcule = (() => {
    if (!formData.actes || formData.actes.length === 0) return 0;
    
    // Utiliser le montant déjà calculé et stocké dans chaque acte
    return formData.actes.reduce((total, acte) => {
      return total + (acte.montant || 0);
    }, 0);
  })();
  
  // Devise forcée en XPF
  // const deviseTotaux = 'XPF';

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {feuille ? 'Modifier la feuille de soins' : 'Nouvelle feuille de soins'}
          </h1>
          <p className="text-gray-600">
            {feuille ? 'Modifier les informations de la feuille de soins' : 'Créer une nouvelle feuille de soins CPS'}
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
              <label className="form-label">Numéro de la feuille de soins</label>
              <input
                type="text"
                value={formData.numeroFeuilleSoins}
                onChange={(e) => handleInputChange('numeroFeuilleSoins', e.target.value)}
                className="input-field"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Numéro automatiquement généré
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Médecin prescripteur *</label>
              <MedecinSearchInput
                onMedecinSelect={handleMedecinSelect}
                placeholder="Rechercher un médecin..."
                className="w-full"
              />
              {formData.medecinPrescripteur && (() => {
                const selectedMedecin = state.medecins.find(m => m.id === formData.medecinPrescripteur);
                return selectedMedecin ? (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-sm font-medium text-blue-900">
                      Médecin sélectionné : Dr. {selectedMedecin.prenom} {selectedMedecin.nom}
                    </div>
                    <div className="text-xs text-blue-700">
                      {selectedMedecin.specialite && `Spécialité: ${selectedMedecin.specialite}`}
                      {selectedMedecin.identificationPrescripteur && ` • ID: ${selectedMedecin.identificationPrescripteur}`}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            <div className="form-group">
              <label className="form-label">Date de prescription *</label>
              <input
                type="date"
                value={formData.datePrescription ? new Date(formData.datePrescription).toISOString().split('T')[0] : ''}
                onChange={(e) => handleInputChange('datePrescription', new Date(e.target.value))}
                className={`input-field ${errors.some(error => error.includes('date antérieure')) ? 'border-red-500' : ''}`}
                required
              />
              {selectedPatient && formData.patient && (
                <p className="text-xs text-blue-600 mt-1">
                  💡 Date automatiquement remplie depuis la dernière ordonnance de soins du patient
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Accord préalable</label>
              <input
                type="text"
                value={formData.accordPrealable}
                onChange={(e) => handleInputChange('accordPrealable', e.target.value)}
                className="input-field"
                maxLength={8}
                placeholder="8 chiffres"
              />
            </div>

            <div className="form-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.parcoursSoins}
                  onChange={(e) => handleInputChange('parcoursSoins', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Parcours de soins</span>
              </label>
            </div>
          </div>
        </div>

        {/* Conditions spéciales */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Conditions spéciales</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.conditions?.longueMaladie}
                  onChange={(e) => handleConditionChange('longueMaladie', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Longue maladie</span>
              </label>
            </div>

            <div className="form-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.conditions?.atmp}
                  onChange={(e) => handleConditionChange('atmp', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">AT/MP</span>
              </label>
            </div>

            {formData.conditions?.atmp && (
              <div className="form-group">
                <label className="form-label">Numéro AT/MP</label>
                <input
                  type="text"
                  value={formData.conditions.numeroAtmp}
                  onChange={(e) => handleConditionChange('numeroAtmp', e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            <div className="form-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.conditions?.maternite}
                  onChange={(e) => handleConditionChange('maternite', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Maternité</span>
              </label>
            </div>

            <div className="form-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.conditions?.urgence}
                  onChange={(e) => handleConditionChange('urgence', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Urgence</span>
              </label>
            </div>

            <div className="form-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.conditions?.autresDerogations}
                  onChange={(e) => handleConditionChange('autresDerogations', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Autres dérogations</span>
              </label>
            </div>

            {formData.conditions?.autresDerogations && (
              <div className="form-group">
                <label className="form-label">Description autres dérogations</label>
                <input
                  type="text"
                  value={formData.conditions.descriptionAutresDerogations}
                  onChange={(e) => handleConditionChange('descriptionAutresDerogations', e.target.value)}
                  className="input-field"
                  placeholder="Décrire les autres dérogations..."
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">N° panier de soins</label>
              <input
                type="text"
                value={formData.numeroPanierSoins}
                onChange={(e) => handleInputChange('numeroPanierSoins', e.target.value)}
                className="input-field"
                placeholder="Numéro du panier de soins..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">RSR</label>
              <input
                type="text"
                value={formData.rsr}
                onChange={(e) => handleInputChange('rsr', e.target.value)}
                className="input-field"
                placeholder="RSR..."
              />
            </div>
          </div>
        </div>

        {/* Actes */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title">Actes (max 16)</h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => addActe()}
                  disabled={(formData.actes?.length || 0) >= 16}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Acte vide
                </button>
              </div>
            </div>
          </div>

          {/* Sélection d'actes de soins disponibles */}
          {state.actesSoins?.filter(t => t.actif).length > 0 && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Actes de soins configurés</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {state.actesSoins
                  .filter(template => template.actif)
                  .map((template) => (
                    <button
                      key={`soins-${template.id}`}
                      type="button"
                      onClick={() => addActeFromTemplate(template)}
                      disabled={(formData.actes?.length || 0) >= 16}
                      className="p-2 text-left border border-gray-200 rounded text-sm hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-gray-900">{template.libelle}</div>
                      <div className="text-xs text-gray-600">{template.code} - {template.coefficient}</div>
                      <div className="text-xs text-gray-500">{formaterMontant(template.tarif)}</div>
                    </button>
                  ))}
              </div>
            </div>
          )}
          
          {formData.actes?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun acte ajouté. Cliquez sur "Ajouter un acte" pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {formData.actes?.map((acte, index) => {
                const resume = getActeResume(acte);
                const isEditing = editingActeIndex === index;
                
                return (
                  <div key={index}>
                    {!isEditing ? (
                      // Affichage concis
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-900">
                              {index + 1}. {resume.libelle}
                            </span>
                            <span className="text-sm text-gray-600">
                              {resume.dateFormatee}
                            </span>
                            <span className="text-xs text-gray-500">
                              {resume.details}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-green-600">
                            {resume.montant}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingActeIndex(index)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Modifier l'acte"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeActe(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Supprimer l'acte"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Formulaire de modification détaillé
                      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Modifier l'acte {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => setEditingActeIndex(null)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                              type="date"
                              value={new Date(acte.date).toISOString().split('T')[0]}
                              onChange={(e) => updateActe(index, 'date', new Date(e.target.value))}
                              className={`input-field ${errors.some(error => error.includes(`Acte ${index + 1}`)) ? 'border-red-500' : ''}`}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Lettre clé</label>
                            <input
                              type="text"
                              value={acte.lettreCle}
                              onChange={(e) => updateActe(index, 'lettreCle', e.target.value)}
                              className="input-field"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Coefficient</label>
                            <input
                              type="number"
                              value={acte.coefficient}
                              onChange={(e) => updateActe(index, 'coefficient', Number(e.target.value) || 0)}
                              className="input-field"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </div>

                          <div className="form-group">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={acte.ifd}
                                onChange={(e) => updateActe(index, 'ifd', e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">IFD</span>
                            </label>
                          </div>

                          <div className="form-group">
                            <label className="form-label">IK (km)</label>
                            <input
                              type="number"
                              value={acte.ik || ''}
                              onChange={(e) => updateActe(index, 'ik', e.target.value ? Number(e.target.value) : undefined)}
                              className="input-field"
                              placeholder="0"
                            />
                          </div>

                          <div className="form-group">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={acte.majorationDimanche}
                                onChange={(e) => updateActe(index, 'majorationDimanche', e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Majoration dimanche</span>
                            </label>
                          </div>

                          <div className="form-group">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={acte.majorationNuit}
                                onChange={(e) => updateActe(index, 'majorationNuit', e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Majoration nuit</span>
                            </label>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Montant calculé</label>
                            <input
                              type="text"
                              value={resume.montant}
                              className="input-field"
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Totaux */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Totaux</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-group">
              <label className="form-label">Montant total</label>
              <input
                type="text"
                value={formaterMontant(montantTotalCalcule)}
                className="input-field font-semibold"
                readOnly
              />
            </div>

            <div className="form-group">
              <label className="form-label">Montant payé par l'assuré</label>
              <input
                type="text"
                value={formData.montantPaye || ''}
                onChange={(e) => handleInputChange('montantPaye', e.target.value)}
                className="input-field"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Montant du tiers payant</label>
              <input
                type="text"
                value={(() => {
                  const montantPaye = Number(formData.montantPaye) || 0;
                  const tiersPayant = Math.max(0, montantTotalCalcule - montantPaye);
                  return formaterMontant(tiersPayant);
                })()}
                className="input-field"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Calculé automatiquement : Total - Montant payé
              </p>
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
            {feuille ? 'Modifier' : 'Créer'} la feuille de soins
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeuilleSoinsForm; 
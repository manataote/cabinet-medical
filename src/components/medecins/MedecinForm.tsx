import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Medecin } from '../../types';

interface MedecinFormProps {
  onBack: () => void;
  medecinToEdit?: Medecin;
}

const MedecinForm: React.FC<MedecinFormProps> = ({ onBack, medecinToEdit }) => {
  const { addMedecin, updateMedecin } = useApp();
  const [formData, setFormData] = useState<Partial<Medecin>>({
    nom: '',
    prenom: '',
    specialite: '',
    numeroRPPS: '',
    identificationPrescripteur: '',
    adresse: '',
    telephone: '',
    email: '',
    actif: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialiser le formulaire avec les données d'édition
  useEffect(() => {
    if (medecinToEdit) {
      setFormData(medecinToEdit);
    }
  }, [medecinToEdit]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom?.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData.prenom?.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }

    if (!formData.identificationPrescripteur?.trim()) {
      newErrors.identificationPrescripteur = 'L\'identification du prescripteur est requise';
    }

    if (formData.numeroRPPS && !/^\d{11}$/.test(formData.numeroRPPS)) {
      newErrors.numeroRPPS = 'Le numéro RPPS doit contenir 11 chiffres';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const medecinData: Medecin = {
      id: medecinToEdit?.id || `medecin_${Date.now()}`,
      nom: formData.nom!,
      prenom: formData.prenom!,
      specialite: formData.specialite,
      numeroRPPS: formData.numeroRPPS,
      identificationPrescripteur: formData.identificationPrescripteur!,
      adresse: formData.adresse,
      telephone: formData.telephone,
      email: formData.email,
      actif: formData.actif!,
    };

    if (medecinToEdit) {
      updateMedecin(medecinData);
    } else {
      addMedecin(medecinData);
    }

    onBack();
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {medecinToEdit ? 'Modifier le médecin' : 'Nouveau médecin'}
          </h1>
          <p className="text-gray-600">
            {medecinToEdit ? 'Modifier les informations du médecin' : 'Ajouter un nouveau médecin prescripteur'}
          </p>
        </div>
        <button onClick={onBack} className="btn-secondary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations personnelles */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Nom *</label>
                <input
                  type="text"
                  value={formData.nom || ''}
                  onChange={(e) => handleInputChange('nom', e.target.value)}
                  className={`form-input ${errors.nom ? 'border-red-500' : ''}`}
                  placeholder="Dupont"
                />
                {errors.nom && (
                  <p className="text-red-500 text-sm mt-1">{errors.nom}</p>
                )}
              </div>

              <div>
                <label className="form-label">Prénom *</label>
                <input
                  type="text"
                  value={formData.prenom || ''}
                  onChange={(e) => handleInputChange('prenom', e.target.value)}
                  className={`form-input ${errors.prenom ? 'border-red-500' : ''}`}
                  placeholder="Jean"
                />
                {errors.prenom && (
                  <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>
                )}
              </div>

              <div>
                <label className="form-label">Spécialité</label>
                <input
                  type="text"
                  value={formData.specialite || ''}
                  onChange={(e) => handleInputChange('specialite', e.target.value)}
                  className="form-input"
                  placeholder="Médecine générale"
                />
              </div>

              <div>
                <label className="form-label">Numéro RPPS</label>
                <input
                  type="text"
                  value={formData.numeroRPPS || ''}
                  onChange={(e) => handleInputChange('numeroRPPS', e.target.value)}
                  className={`form-input ${errors.numeroRPPS ? 'border-red-500' : ''}`}
                  placeholder="12345678901"
                  maxLength={11}
                />
                {errors.numeroRPPS && (
                  <p className="text-red-500 text-sm mt-1">{errors.numeroRPPS}</p>
                )}
              </div>

              <div>
                <label className="form-label">Identification du prescripteur *</label>
                <input
                  type="text"
                  value={formData.identificationPrescripteur || ''}
                  onChange={(e) => handleInputChange('identificationPrescripteur', e.target.value)}
                  className={`form-input ${errors.identificationPrescripteur ? 'border-red-500' : ''}`}
                  placeholder="DP001"
                  maxLength={10}
                />
                {errors.identificationPrescripteur && (
                  <p className="text-red-500 text-sm mt-1">{errors.identificationPrescripteur}</p>
                )}
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coordonnées</h3>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Adresse</label>
                <textarea
                  value={formData.adresse || ''}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                  className="form-input"
                  rows={3}
                  placeholder="123 Rue de la Santé, 75001 Paris"
                />
              </div>

              <div>
                <label className="form-label">Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone || ''}
                  onChange={(e) => handleInputChange('telephone', e.target.value)}
                  className="form-input"
                  placeholder="01 23 45 67 89"
                />
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="jean.dupont@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.actif}
                    onChange={(e) => handleInputChange('actif', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Médecin actif</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onBack} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {medecinToEdit ? 'Mettre à jour' : 'Créer le médecin'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedecinForm; 
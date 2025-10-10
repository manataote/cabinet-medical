import { StorageManager } from './storage';
import { ActeSoins, ActeOrthopedique, Medecin, Patient } from '../types';

export const initTestData = () => {
  console.log('Initialisation des données de test...');

  // Créer un médecin de test
  const testMedecin: Medecin = {
    id: 'medecin_test_1',
    nom: 'Martin',
    prenom: 'Jean',
    specialite: 'Médecine générale',
    numeroRPPS: '12345678901',
    identificationPrescripteur: 'MR001',
    adresse: '123 Rue de la Santé, 75001 Paris',
    telephone: '01 23 45 67 89',
    email: 'jean.martin@example.com',
    actif: true,
  };

  // Créer un patient de test
  const testPatient: Patient = {
    id: 'patient_test_1',
    numeroFacture: 'F001',
    nom: 'Dupont',
    prenom: 'Marie',
    dn: '1234567',
    dateNaissance: new Date('1985-03-15'),
    adresse: '456 Avenue des Patients, 75002 Paris',
    telephone: '01 98 76 54 32',
    dateCreation: new Date(),
    notes: [],
  };

  // Créer un acte de soins de test
  const testActeSoins: ActeSoins = {
    id: 'acte_soins_test_1',
    code: 'AMP',
    libelle: 'Acte médical personnalisé',
    tarif: 4830,
    coefficient: 1,
    actif: true,
  };

  // Créer un acte orthopédique de test
  const testActeOrthopedique: ActeOrthopedique = {
    id: 'acte_ortho_test_1',
    libelleInterne: 'Semelles orthopédiques',
    libelleFacture: '1 paire ADULTE TP',
    codeLPPR: 'LPPR001',
    quantite: 1,
    tarifBase: 12000,
    tarifBaseLPPR: 12000,
    tauxApplique: 100,
    regime: 'maladie',
    total: 12000,
    partCPS: 12000,
    partPatient: 0,
    actif: true,
  };

  // Sauvegarder les données
  try {
    StorageManager.saveMedecins([testMedecin]);
    StorageManager.savePatients([testPatient]);
    StorageManager.saveActesSoins([testActeSoins]);
    StorageManager.saveActesOrthopediques([testActeOrthopedique]);
    
    console.log('✅ Données de test créées avec succès');
    console.log('- 1 médecin créé');
    console.log('- 1 patient créé');
    console.log('- 1 acte de soins créé');
    console.log('- 1 acte orthopédique créé');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error);
    return false;
  }
};

// Fonction pour nettoyer les données de test
export const clearTestData = () => {
  console.log('Nettoyage des données de test...');
  StorageManager.clearAllData();
  console.log('✅ Données nettoyées');
};

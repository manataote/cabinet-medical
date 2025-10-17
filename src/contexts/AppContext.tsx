import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { 
  Patient, 
  Prestation, 
  FeuilleSoins, 
  FactureSemelles, 
  Bordereau, 
  ModeleDocument, 
  Medecin,
  Acte,
  ActeTemplate,
  ActeSoins,
  ActeOrthopedique,
  Ordonnance,
  TodoItem,
  Configuration,
  AppState
} from '../types';
import { StorageManager } from '../utils/storage';
import { CalculUtils } from '../utils/calculs';
import { supabase } from '../config/supabase';
// import { ValidationUtils } from '../utils/validation';
import { PatientsService } from '../services/patientsService';
import { TodosService } from '../services/todosService';
import { log } from '../utils/logger';
import { MedecinsService } from '../services/medecinsService';
import { ActesService } from '../services/actesService';
import { ActesSoinsService } from '../services/actesSoinsService';
import { ActesOrthopediquesService } from '../services/actesOrthopediquesService';
import { OrdonnancesService } from '../services/ordonnancesService';
import { FeuillesSoinsService } from '../services/feuillesSoinsService';
import { FeuillesSoinsActesService } from '../services/feuillesSoinsActesService';
import { FacturesSemellesService } from '../services/facturesSemellesService';
import { FacturesSemellesActesService } from '../services/facturesSemellesActesService';
import { BordereauxService } from '../services/bordereauxService';
import { CleanupUtils } from '../utils/cleanupLocalStorage';
import { CabinetService } from '../services/cabinetService';
import { UserService } from '../services/userService';
import * as Formatters from '../utils/formatters';

// Actions
type AppAction =
  | { type: 'LOAD_APP_STATE'; payload: AppState }
  | { type: 'SET_PATIENTS'; payload: Patient[] }
  | { type: 'SET_PATIENTS_COUNT'; payload: number }
  | { type: 'ADD_PATIENT'; payload: Patient }
  | { type: 'UPDATE_PATIENT'; payload: Patient }
  | { type: 'DELETE_PATIENT'; payload: string }
  | { type: 'SET_PRESTATIONS'; payload: Prestation[] }
  | { type: 'ADD_PRESTATION'; payload: Prestation }
  | { type: 'UPDATE_PRESTATION'; payload: Prestation }
  | { type: 'DELETE_PRESTATION'; payload: string }
  | { type: 'SET_FEUILLES_SOINS'; payload: FeuilleSoins[] }
  | { type: 'ADD_FEUILLE_SOINS'; payload: FeuilleSoins }
  | { type: 'UPDATE_FEUILLE_SOINS'; payload: FeuilleSoins }
  | { type: 'DELETE_FEUILLE_SOINS'; payload: string }
  | { type: 'SET_FACTURES_SEMELLES'; payload: FactureSemelles[] }
  | { type: 'ADD_FACTURE_SEMELLES'; payload: FactureSemelles }
  | { type: 'UPDATE_FACTURE_SEMELLES'; payload: FactureSemelles }
  | { type: 'DELETE_FACTURE_SEMELLES'; payload: string }
  | { type: 'SET_BORDEREAUX'; payload: Bordereau[] }
  | { type: 'ADD_BORDEREAU'; payload: Bordereau }
  | { type: 'UPDATE_BORDEREAU'; payload: Bordereau }
  | { type: 'DELETE_BORDEREAU'; payload: string }
  | { type: 'SET_MODELES'; payload: ModeleDocument[] }
  | { type: 'ADD_MODELE'; payload: ModeleDocument }
  | { type: 'UPDATE_MODELE'; payload: ModeleDocument }
  | { type: 'DELETE_MODELE'; payload: string }
  | { type: 'SET_MEDECINS'; payload: Medecin[] }
  | { type: 'ADD_MEDECIN'; payload: Medecin }
  | { type: 'UPDATE_MEDECIN'; payload: Medecin }
  | { type: 'DELETE_MEDECIN'; payload: string }
  | { type: 'SET_ACTES'; payload: Acte[] }
  | { type: 'ADD_ACTE'; payload: Acte }
  | { type: 'UPDATE_ACTE'; payload: Acte }
  | { type: 'DELETE_ACTE'; payload: string }
  | { type: 'SET_TODOS'; payload: TodoItem[] }
  | { type: 'ADD_TODO'; payload: TodoItem }
  | { type: 'UPDATE_TODO'; payload: { id: string; updates: Partial<TodoItem> } }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'SET_ACTE_TEMPLATES'; payload: ActeTemplate[] }
  | { type: 'ADD_ACTE_TEMPLATE'; payload: ActeTemplate }
  | { type: 'UPDATE_ACTE_TEMPLATE'; payload: ActeTemplate }
  | { type: 'DELETE_ACTE_TEMPLATE'; payload: string }
  | { type: 'SET_ACTES_SOINS'; payload: ActeSoins[] }
  | { type: 'ADD_ACTE_SOINS'; payload: ActeSoins }
  | { type: 'UPDATE_ACTE_SOINS'; payload: ActeSoins }
  | { type: 'DELETE_ACTE_SOINS'; payload: string }
  | { type: 'SET_ACTES_ORTHOPEDIQUES'; payload: ActeOrthopedique[] }
  | { type: 'ADD_ACTE_ORTHOPEDIQUE'; payload: ActeOrthopedique }
  | { type: 'UPDATE_ACTE_ORTHOPEDIQUE'; payload: ActeOrthopedique }
  | { type: 'DELETE_ACTE_ORTHOPEDIQUE'; payload: string }
  | { type: 'SET_ORDONNANCES'; payload: Ordonnance[] }
  | { type: 'ADD_ORDONNANCE'; payload: Ordonnance }
  | { type: 'UPDATE_ORDONNANCE'; payload: Ordonnance }
  | { type: 'DELETE_ORDONNANCE'; payload: string }
  | { type: 'SET_FEUILLES_SOINS'; payload: FeuilleSoins[] }
  | { type: 'ADD_FEUILLE_SOINS'; payload: FeuilleSoins }
  | { type: 'UPDATE_FEUILLE_SOINS'; payload: FeuilleSoins }
  | { type: 'DELETE_FEUILLE_SOINS'; payload: string }
  | { type: 'UPDATE_CONFIGURATION'; payload: Configuration }
  | { type: 'SET_SELECTED_PATIENT'; payload: Patient | undefined }
  | { type: 'SET_SELECTED_MODELE'; payload: ModeleDocument | undefined }
  | { type: 'UPDATE_USER_INFO'; payload: any };

// État initial
const initialState: AppState = {
  patients: [],
  patientsCount: 0,
  prestations: [],
  feuillesSoins: [],
  facturesSemelles: [],
  bordereaux: [],
  modeles: [],
  medecins: [],
  actes: [],
  acteTemplates: [],
  actesSoins: [],
  actesOrthopediques: [],
  ordonnances: [],
  todos: [],
  configuration: {
    apparence: {
      echelleAffichage: 1.0,
      theme: 'light'
    },
    calculs: {
      multiplicateurIK: 0.5,
      tarifIFD: 1.25,
      majorationNuit: 1.25,
      majorationDimanche: 1.25
    }
  },
  selectedPatient: undefined,
  selectedModele: undefined,
  cabinetInfo: undefined,
  userInfo: undefined
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOAD_APP_STATE':
      return action.payload;
    case 'SET_PATIENTS':
      return { ...state, patients: action.payload, patientsCount: action.payload.length };
    case 'SET_PATIENTS_COUNT':
      return { ...state, patientsCount: action.payload };
    case 'ADD_PATIENT':
      return { ...state, patients: [...state.patients, action.payload], patientsCount: state.patientsCount + 1 };
    case 'UPDATE_PATIENT':
      return { ...state, patients: state.patients.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PATIENT':
      return { ...state, patients: state.patients.filter(p => p.id !== action.payload), patientsCount: state.patientsCount - 1 };
    case 'SET_PRESTATIONS':
      return { ...state, prestations: action.payload };
    case 'ADD_PRESTATION':
      return { ...state, prestations: [...state.prestations, action.payload] };
    case 'UPDATE_PRESTATION':
      return { ...state, prestations: state.prestations.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PRESTATION':
      return { ...state, prestations: state.prestations.filter(p => p.id !== action.payload) };
    case 'SET_FEUILLES_SOINS':
      return { ...state, feuillesSoins: action.payload };
    case 'ADD_FEUILLE_SOINS':
      return { ...state, feuillesSoins: [...state.feuillesSoins, action.payload] };
    case 'UPDATE_FEUILLE_SOINS':
      return { ...state, feuillesSoins: state.feuillesSoins.map(f => f.id === action.payload.id ? action.payload : f) };
    case 'DELETE_FEUILLE_SOINS':
      return { ...state, feuillesSoins: state.feuillesSoins.filter(f => f.id !== action.payload) };
    case 'SET_FACTURES_SEMELLES':
      return { ...state, facturesSemelles: action.payload };
    case 'ADD_FACTURE_SEMELLES':
      return { ...state, facturesSemelles: [...state.facturesSemelles, action.payload] };
    case 'UPDATE_FACTURE_SEMELLES':
      return { ...state, facturesSemelles: state.facturesSemelles.map(f => f.id === action.payload.id ? action.payload : f) };
    case 'DELETE_FACTURE_SEMELLES':
      return { ...state, facturesSemelles: state.facturesSemelles.filter(f => f.id !== action.payload) };
    case 'SET_BORDEREAUX':
      return { ...state, bordereaux: action.payload };
    case 'ADD_BORDEREAU':
      return { ...state, bordereaux: [...state.bordereaux, action.payload] };
    case 'UPDATE_BORDEREAU':
      return { ...state, bordereaux: state.bordereaux.map(b => b.id === action.payload.id ? action.payload : b) };
    case 'DELETE_BORDEREAU':
      return { ...state, bordereaux: state.bordereaux.filter(b => b.id !== action.payload) };
    case 'SET_MODELES':
      return { ...state, modeles: action.payload };
    case 'ADD_MODELE':
      return { ...state, modeles: [...state.modeles, action.payload] };
    case 'UPDATE_MODELE':
      return { ...state, modeles: state.modeles.map(m => m.id === action.payload.id ? action.payload : m) };
    case 'DELETE_MODELE':
      return { ...state, modeles: state.modeles.filter(m => m.id !== action.payload) };
    case 'SET_MEDECINS':
      return { ...state, medecins: action.payload };
    case 'ADD_MEDECIN':
      return { ...state, medecins: [...state.medecins, action.payload] };
    case 'UPDATE_MEDECIN':
      return { ...state, medecins: state.medecins.map(m => m.id === action.payload.id ? action.payload : m) };
    case 'DELETE_MEDECIN':
      return { ...state, medecins: state.medecins.filter(m => m.id !== action.payload) };
    case 'SET_ACTES':
      return { ...state, actes: action.payload };
    case 'ADD_ACTE':
      return { ...state, actes: [...state.actes, action.payload] };
    case 'UPDATE_ACTE':
      return { ...state, actes: state.actes.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ACTE':
      return { ...state, actes: state.actes.filter(a => a.id !== action.payload) };
    case 'SET_TODOS':
      return { ...state, todos: action.payload };
    case 'ADD_TODO':
      return { ...state, todos: [...state.todos, action.payload] };
    case 'UPDATE_TODO':
      return { 
        ...state, 
        todos: state.todos.map(t => 
          t.id === action.payload.id 
            ? { ...t, ...action.payload.updates } 
            : t
        ) 
      };
    case 'DELETE_TODO':
      return { ...state, todos: state.todos.filter(t => t.id !== action.payload) };
    case 'SET_ACTE_TEMPLATES':
      return { ...state, acteTemplates: action.payload };
    case 'ADD_ACTE_TEMPLATE':
      return { ...state, acteTemplates: [...state.acteTemplates, action.payload] };
    case 'UPDATE_ACTE_TEMPLATE':
      return { ...state, acteTemplates: state.acteTemplates.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ACTE_TEMPLATE':
      return { ...state, acteTemplates: state.acteTemplates.filter(a => a.id !== action.payload) };
    case 'SET_ACTES_SOINS':
      return { ...state, actesSoins: action.payload };
    case 'ADD_ACTE_SOINS':
      return { ...state, actesSoins: [...state.actesSoins, action.payload] };
    case 'UPDATE_ACTE_SOINS':
      return { ...state, actesSoins: state.actesSoins.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ACTE_SOINS':
      return { ...state, actesSoins: state.actesSoins.filter(a => a.id !== action.payload) };
    case 'SET_ACTES_ORTHOPEDIQUES':
      return { ...state, actesOrthopediques: action.payload };
    case 'ADD_ACTE_ORTHOPEDIQUE':
      return { ...state, actesOrthopediques: [...state.actesOrthopediques, action.payload] };
    case 'UPDATE_ACTE_ORTHOPEDIQUE':
      return { ...state, actesOrthopediques: state.actesOrthopediques.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ACTE_ORTHOPEDIQUE':
      return { ...state, actesOrthopediques: state.actesOrthopediques.filter(a => a.id !== action.payload) };
    case 'SET_ORDONNANCES':
      return { ...state, ordonnances: action.payload };
    case 'ADD_ORDONNANCE':
      return { ...state, ordonnances: [...state.ordonnances, action.payload] };
    case 'UPDATE_ORDONNANCE':
      return { ...state, ordonnances: state.ordonnances.map(o => o.id === action.payload.id ? action.payload : o) };
    case 'DELETE_ORDONNANCE':
      return { ...state, ordonnances: state.ordonnances.filter(o => o.id !== action.payload) };
    case 'SET_FEUILLES_SOINS':
      return { ...state, feuillesSoins: action.payload };
    case 'ADD_FEUILLE_SOINS':
      return { ...state, feuillesSoins: [...state.feuillesSoins, action.payload] };
    case 'UPDATE_FEUILLE_SOINS':
      return { ...state, feuillesSoins: state.feuillesSoins.map(f => f.id === action.payload.id ? action.payload : f) };
    case 'DELETE_FEUILLE_SOINS':
      return { ...state, feuillesSoins: state.feuillesSoins.filter(f => f.id !== action.payload) };
    case 'UPDATE_CONFIGURATION':
      return { ...state, configuration: action.payload };
    case 'SET_SELECTED_PATIENT':
      return { ...state, selectedPatient: action.payload };
    case 'SET_SELECTED_MODELE':
      return { ...state, selectedModele: action.payload };
    case 'UPDATE_USER_INFO':
      return { ...state, userInfo: action.payload };
    default:
      return state;
  }
};

// Interface du contexte
interface AppContextType extends AppState {
  // État
  state: AppState;
  isLoading: boolean;
  // Chargement initial
  loadInitialData: () => Promise<void>;
  // Patients
  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  deletePatient: (patientId: string) => void;
  refreshPatients: () => Promise<void>;
  // Prestations
  addPrestation: (prestation: Prestation) => void;
  updatePrestation: (prestation: Prestation) => void;
  deletePrestation: (prestationId: string) => void;
  // Feuilles de soins
  addFeuilleSoins: (feuille: FeuilleSoins) => Promise<void>;
  updateFeuilleSoins: (feuille: FeuilleSoins) => Promise<void>;
  deleteFeuilleSoins: (feuilleId: string) => Promise<void>;
  // Factures semelles
  addFactureSemelles: (facture: FactureSemelles) => Promise<void>;
  updateFactureSemelles: (facture: FactureSemelles) => Promise<void>;
  deleteFactureSemelles: (factureId: string) => Promise<void>;
  loadFacturesSemelles: () => Promise<void>;
  // Bordereaux
  addBordereau: (bordereau: Bordereau) => Promise<void>;
  updateBordereau: (bordereau: Bordereau) => Promise<void>;
  deleteBordereau: (bordereauId: string) => Promise<void>;
  loadBordereaux: () => Promise<void>;
  // Modèles
  addModele: (modele: ModeleDocument) => void;
  updateModele: (modele: ModeleDocument) => void;
  deleteModele: (modeleId: string) => void;
  // Médecins
  addMedecin: (medecin: Medecin) => void;
  updateMedecin: (medecin: Medecin) => void;
  deleteMedecin: (medecinId: string) => void;
  // Actes
  addActe: (acte: Acte) => void;
  updateActe: (acte: Acte) => void;
  deleteActe: (acteId: string) => void;
  // Templates d'actes
  addActeTemplate: (template: ActeTemplate) => void;
  updateActeTemplate: (template: ActeTemplate) => void;
  deleteActeTemplate: (templateId: string) => void;
  // Actes de soins
  addActeSoins: (acte: ActeSoins) => void;
  updateActeSoins: (acte: ActeSoins) => void;
  deleteActeSoins: (acteId: string) => void;
  // Actes orthopédiques
  addActeOrthopedique: (acte: ActeOrthopedique) => void;
  updateActeOrthopedique: (acte: ActeOrthopedique) => void;
  deleteActeOrthopedique: (acteId: string) => void;
  // Ordonnances
  addOrdonnance: (ordonnance: Omit<Ordonnance, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateOrdonnance: (ordonnanceId: string, updates: Partial<Ordonnance>) => Promise<void>;
  deleteOrdonnance: (ordonnanceId: string) => Promise<void>;
  // Configuration
  updateConfiguration: (config: Configuration) => void;
  updateUserInfo: (userInfo: any) => void;
  // Utilitaires
  formaterMontant: (montant: number) => string;
  formatDate: (date: Date | string | null | undefined) => string;
  formatNumber: (value: number | string | null | undefined, decimals?: number) => string;
  formatCurrency: (amount: number | string | null | undefined) => string;
  parseDate: (dateString: string) => Date | null;
  parseNumber: (numberString: string) => number | null;
  setSelectedPatient: (patient: Patient | undefined) => void;
  setSelectedModele: (modele: ModeleDocument | undefined) => void;
  clearAllData: () => void;
  exportData: () => void;
  importData: (data: any) => void;
  // Fonctions manquantes
  addPatientNote: (patientId: string, note: any) => void;
  deletePatientNote: (patientId: string, noteId: string) => void;
  mergePatients: (mergedPatient: Patient, patientsToRemove: Patient[], selectedOrdonnances: string[], selectedFeuillesSoins: string[]) => Promise<void>;
  // Todos
  loadTodos: () => Promise<void>;
  loadOrdonnances: () => Promise<void>;
  loadFeuillesSoins: () => Promise<void>;
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'completedAt'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  dispatch: any;
}

// Création du contexte
const AppContext = createContext<AppContextType | undefined>(undefined);

// Props du provider
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);

  // Chargement initial des données - maintenant géré par App.tsx

  // Sauvegarde automatique désactivée - toutes les données sont dans Supabase

  // Fonctions pour les patients
  const addPatient = async (patient: Patient) => {
    try {
      const newPatient = await PatientsService.createPatient(patient);
      dispatch({ type: 'ADD_PATIENT', payload: newPatient });
    } catch (error) {
      console.error('Erreur lors de la création du patient:', error);
      throw error;
    }
  };

  const updatePatient = async (patient: Patient) => {
    try {
      const updatedPatient = await PatientsService.updatePatient(patient);
      dispatch({ type: 'UPDATE_PATIENT', payload: updatedPatient });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du patient:', error);
      throw error;
    }
  };

  const deletePatient = async (patientId: string) => {
    try {
      await PatientsService.deletePatient(patientId);
      dispatch({ type: 'DELETE_PATIENT', payload: patientId });
    } catch (error) {
      console.error('Erreur lors de la suppression du patient:', error);
      throw error;
    }
  };

  const refreshPatients = async () => {
    try {
      console.log('🔄 Rechargement des patients depuis Supabase...');
      const patients = await PatientsService.getPatients();
      dispatch({ type: 'SET_PATIENTS', payload: patients });
      console.log(`✅ ${patients.length} patients rechargés depuis Supabase`);
    } catch (error) {
      console.error('Erreur lors du rechargement des patients:', error);
      throw error;
    }
  };

  // Fonctions pour les prestations
  const addPrestation = (prestation: Prestation) => {
    dispatch({ type: 'ADD_PRESTATION', payload: prestation });
    const prestations = [...state.prestations, prestation];
    StorageManager.savePrestations(prestations);
  };

  const updatePrestation = (prestation: Prestation) => {
    dispatch({ type: 'UPDATE_PRESTATION', payload: prestation });
    const prestations = state.prestations.map(p => p.id === prestation.id ? prestation : p);
    StorageManager.savePrestations(prestations);
  };

  const deletePrestation = (prestationId: string) => {
    dispatch({ type: 'DELETE_PRESTATION', payload: prestationId });
    const prestations = state.prestations.filter(p => p.id !== prestationId);
    StorageManager.savePrestations(prestations);
  };

  // Fonctions pour les feuilles de soins
  const addFeuilleSoins = async (feuille: FeuilleSoins) => {
    try {
      // Récupérer l'utilisateur connecté pour obtenir le cabinet_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer les informations du cabinet depuis la table users
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('cabinet_id')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData?.cabinet_id) {
        throw new Error('Cabinet ID manquant');
      }

      const feuilleAvecTotaux = CalculUtils.recalculerTotauxFeuille(feuille);
      
      // Validation des champs requis
      if (!feuilleAvecTotaux.patient_id) {
        throw new Error('Patient ID manquant');
      }
      
      if (!feuilleAvecTotaux.medecinPrescripteur) {
        throw new Error('Médecin prescripteur manquant');
      }
      
      // Préparer les données pour Supabase
      const feuilleData = {
        ...feuilleAvecTotaux,
        numero_feuille: feuilleAvecTotaux.numeroFeuilleSoins,
        date_soins: feuilleAvecTotaux.date_soins,
        medecin_prescripteur: feuilleAvecTotaux.medecinPrescripteur,
        date_prescription: feuilleAvecTotaux.datePrescription,
        montant_total: feuilleAvecTotaux.montantTotal,
        cabinet_id: userData.cabinet_id,
        patient_id: feuilleAvecTotaux.patient_id,
        dap: feuilleAvecTotaux.accordPrealable,
        is_parcours_soins: feuilleAvecTotaux.parcoursSoins,
        is_longue_maladie: feuilleAvecTotaux.conditions?.longueMaladie || false,
        is_atmp: feuilleAvecTotaux.conditions?.atmp || false,
        is_maternite: feuilleAvecTotaux.conditions?.maternite || false,
        is_urgence: feuilleAvecTotaux.conditions?.urgence || false,
        is_autres_derogations: feuilleAvecTotaux.conditions?.autresDerogations || false,
        autres_derogations: feuilleAvecTotaux.conditions?.descriptionAutresDerogations || null,
        numero_atmp: feuilleAvecTotaux.conditions?.numeroAtmp ? parseInt(feuilleAvecTotaux.conditions.numeroAtmp) || null : null,
        panier_soins: feuilleAvecTotaux.numeroPanierSoins,
        rsr: feuilleAvecTotaux.rsr,
        // Important : inclure les actes pour la liaison
        actes: feuilleAvecTotaux.actes || [],
      };

      console.log('🔍 Debug actes dans feuilleData:', {
        nbActes: feuilleData.actes?.length || 0,
        actes: feuilleData.actes?.map(a => ({ id: a.id, lettreCle: a.lettreCle }))
      });

      const newFeuille = await FeuillesSoinsService.createFeuilleSoins(feuilleData);
      if (newFeuille) {
        // Charger les actes pour la nouvelle feuille et recalculer les montants
        try {
          const actes = await FeuillesSoinsActesService.getActesByFeuille(newFeuille.id);
          const feuilleAvecActes = {
            ...newFeuille,
            actes: actes
          };
          
          // Recalculer les montants avec les actes chargés
          const feuilleComplete = CalculUtils.recalculerTotauxFeuille(feuilleAvecActes);
          dispatch({ type: 'ADD_FEUILLE_SOINS', payload: feuilleComplete });
          log.info('Feuille de soins créée avec succès', { feuilleId: newFeuille.id, actesCount: actes.length });
        } catch (error) {
          console.error('Erreur lors du chargement des actes de la nouvelle feuille:', error);
          const feuilleAvecActes = {
            ...newFeuille,
            actes: []
          };
          
          // Recalculer les montants même sans actes
          const feuilleComplete = CalculUtils.recalculerTotauxFeuille(feuilleAvecActes);
          dispatch({ type: 'ADD_FEUILLE_SOINS', payload: feuilleComplete });
          log.info('Feuille de soins créée avec succès (sans actes)', { feuilleId: newFeuille.id });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création de la feuille de soins:', error);
      log.error('Erreur lors de la création de la feuille de soins', { error: (error as Error).message });
      throw error;
    }
  };

  const updateFeuilleSoins = async (feuille: FeuilleSoins) => {
    try {
      const feuilleAvecTotaux = CalculUtils.recalculerTotauxFeuille(feuille);
      
      // Préparer les données pour Supabase
      const updateData = {
        numero_feuille: feuilleAvecTotaux.numeroFeuilleSoins,
        date_soins: feuilleAvecTotaux.date_soins,
        medecin_prescripteur: feuilleAvecTotaux.medecinPrescripteur,
        date_prescription: feuilleAvecTotaux.datePrescription,
        montant_total: feuilleAvecTotaux.montantTotal,
        patient_id: feuilleAvecTotaux.patient_id || '',
        dap: feuilleAvecTotaux.accordPrealable,
        is_parcours_soins: feuilleAvecTotaux.parcoursSoins,
        is_longue_maladie: feuilleAvecTotaux.conditions?.longueMaladie || false,
        is_atmp: feuilleAvecTotaux.conditions?.atmp || false,
        is_maternite: feuilleAvecTotaux.conditions?.maternite || false,
        is_urgence: feuilleAvecTotaux.conditions?.urgence || false,
        is_autres_derogations: feuilleAvecTotaux.conditions?.autresDerogations || false,
        autres_derogations: feuilleAvecTotaux.conditions?.descriptionAutresDerogations || null,
        numero_atmp: feuilleAvecTotaux.conditions?.numeroAtmp ? parseInt(feuilleAvecTotaux.conditions.numeroAtmp) || null : null,
        panier_soins: feuilleAvecTotaux.numeroPanierSoins,
        rsr: feuilleAvecTotaux.rsr,
      };

      const updatedFeuille = await FeuillesSoinsService.updateFeuilleSoins(feuille.id, updateData);
      if (updatedFeuille) {
        // Charger les actes pour la feuille mise à jour et recalculer les montants
        try {
          const actes = await FeuillesSoinsActesService.getActesByFeuille(feuille.id);
          const feuilleAvecActes = {
            ...updatedFeuille,
            actes: actes
          };
          
          // Recalculer les montants avec les actes chargés
          const feuilleComplete = CalculUtils.recalculerTotauxFeuille(feuilleAvecActes);
          dispatch({ type: 'UPDATE_FEUILLE_SOINS', payload: feuilleComplete });
          log.info('Feuille de soins mise à jour avec succès', { feuilleId: feuille.id, actesCount: actes.length });
        } catch (error) {
          console.error('Erreur lors du chargement des actes de la feuille mise à jour:', error);
          const feuilleAvecActes = {
            ...updatedFeuille,
            actes: []
          };
          
          // Recalculer les montants même sans actes
          const feuilleComplete = CalculUtils.recalculerTotauxFeuille(feuilleAvecActes);
          dispatch({ type: 'UPDATE_FEUILLE_SOINS', payload: feuilleComplete });
          log.info('Feuille de soins mise à jour avec succès (sans actes)', { feuilleId: feuille.id });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la feuille de soins:', error);
      log.error('Erreur lors de la mise à jour de la feuille de soins', { error: (error as Error).message });
      throw error;
    }
  };

  const deleteFeuilleSoins = async (feuilleId: string) => {
    try {
      const success = await FeuillesSoinsService.deleteFeuilleSoins(feuilleId);
      if (success) {
        dispatch({ type: 'DELETE_FEUILLE_SOINS', payload: feuilleId });
        log.info('Feuille de soins supprimée avec succès', { feuilleId });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la feuille de soins:', error);
      log.error('Erreur lors de la suppression de la feuille de soins', { error: (error as Error).message });
      throw error;
    }
  };

  const loadFeuillesSoins = async () => {
    try {
      // Récupérer l'utilisateur connecté pour obtenir le cabinet_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        log.warning('Utilisateur non connecté pour charger les feuilles de soins');
        return;
      }

      // Récupérer les informations du cabinet depuis la table users
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('cabinet_id')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData?.cabinet_id) {
        log.warning('Cabinet ID manquant pour charger les feuilles de soins');
        return;
      }

      const feuillesSoins = await FeuillesSoinsService.getFeuillesSoins(userData.cabinet_id);
      
      // Charger les actes pour chaque feuille de soins et recalculer les montants
      const feuillesAvecActes = await Promise.all(
        feuillesSoins.map(async (feuille) => {
          try {
            const actes = await FeuillesSoinsActesService.getActesByFeuille(feuille.id);
            const feuilleAvecActes = {
              ...feuille,
              actes: actes
            };
            
            // Recalculer les montants avec les actes chargés
            return CalculUtils.recalculerTotauxFeuille(feuilleAvecActes);
          } catch (error) {
            console.error(`Erreur lors du chargement des actes pour la feuille ${feuille.id}:`, error);
            const feuilleAvecActes = {
              ...feuille,
              actes: []
            };
            
            // Recalculer les montants même sans actes
            return CalculUtils.recalculerTotauxFeuille(feuilleAvecActes);
          }
        })
      );
      
      dispatch({ type: 'SET_FEUILLES_SOINS', payload: feuillesAvecActes });
      log.info('Feuilles de soins chargées', { count: feuillesAvecActes.length });
    } catch (error) {
      console.error('Erreur lors du chargement des feuilles de soins:', error);
      log.error('Erreur lors du chargement des feuilles de soins', { error: (error as Error).message });
    }
  };

  const loadFacturesSemelles = async () => {
    try {
      // Récupérer l'utilisateur connecté pour obtenir le cabinet_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        log.warning('Utilisateur non connecté pour charger les factures semelles');
        return;
      }

      // Récupérer les informations du cabinet depuis la table users
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('cabinet_id')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData?.cabinet_id) {
        log.warning('Cabinet ID manquant pour charger les factures semelles');
        return;
      }

      const facturesSemelles = await FacturesSemellesService.getFacturesSemelles(userData.cabinet_id);
      dispatch({ type: 'SET_FACTURES_SEMELLES', payload: facturesSemelles });
      log.info('Factures semelles rechargées', { count: facturesSemelles.length });
    } catch (error) {
      console.error('Erreur lors du chargement des factures semelles:', error);
      log.error('Erreur lors du chargement des factures semelles', { error: (error as Error).message });
    }
  };

  const loadBordereaux = async () => {
    try {
      // Récupérer l'utilisateur connecté pour obtenir le cabinet_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        log.warning('Utilisateur non connecté pour charger les bordereaux');
        return;
      }

      // Récupérer les informations du cabinet depuis la table users
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('cabinet_id')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData?.cabinet_id) {
        log.warning('Cabinet ID manquant pour charger les bordereaux');
        return;
      }

      const bordereaux = await BordereauxService.getBordereaux(userData.cabinet_id);
      dispatch({ type: 'SET_BORDEREAUX', payload: bordereaux });
      log.info('Bordereaux rechargés', { count: bordereaux.length });
      console.log('🔍 Bordereaux rechargés:', bordereaux);
    } catch (error) {
      console.error('Erreur lors du chargement des bordereaux:', error);
      log.error('Erreur lors du chargement des bordereaux', { error: (error as Error).message });
    }
  };

  // Fonctions pour les factures semelles
  const addFactureSemelles = async (facture: FactureSemelles) => {
    try {
      const factureAvecTotaux = CalculUtils.recalculerTotauxFacture(facture);
      
      // Récupérer l'utilisateur connecté pour obtenir le cabinet_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer les informations du cabinet depuis la table users
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('cabinet_id')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData?.cabinet_id) {
        throw new Error('Cabinet ID manquant');
      }

      // Préparer les données pour Supabase
      const factureData = {
        ...factureAvecTotaux,
        cabinet_id: userData.cabinet_id,
        patient_id: factureAvecTotaux.patient.id,
        medecin_id: factureAvecTotaux.medecinPrescripteur?.id,
        date_facture: factureAvecTotaux.dateSoins,
        montant_total: factureAvecTotaux.montantTotal
      };

      const nouvelleFacture = await FacturesSemellesService.createFactureSemelles(factureData);
      
      // Ajouter les actes orthopédiques si présents
      if (factureAvecTotaux.actesOrthopediques.length > 0) {
        await FacturesSemellesActesService.updateActesOrthopediquesForFacture(
          nouvelleFacture.id, 
          factureAvecTotaux.actesOrthopediques
        );
      }

      // Récupérer la facture complète avec ses actes orthopédiques
      const factureComplete = await FacturesSemellesService.getFactureSemellesById(nouvelleFacture.id);
      if (!factureComplete) {
        throw new Error('Erreur lors de la récupération de la facture créée');
      }

      dispatch({ type: 'ADD_FACTURE_SEMELLES', payload: factureComplete });
      log.info('Facture semelles ajoutée avec succès', { id: nouvelleFacture.id });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la facture semelles:', error);
      log.error('Erreur lors de l\'ajout de la facture semelles', { error: (error as Error).message });
      throw error;
    }
  };

  const updateFactureSemelles = async (facture: FactureSemelles) => {
    try {
      const factureAvecTotaux = CalculUtils.recalculerTotauxFacture(facture);
      
      // Préparer les données pour Supabase
      const updateData = {
        ...factureAvecTotaux,
        patient_id: factureAvecTotaux.patient.id,
        medecin_id: factureAvecTotaux.medecinPrescripteur?.id,
        date_facture: factureAvecTotaux.dateSoins,
        montant_total: factureAvecTotaux.montantTotal
      };

      const factureMiseAJour = await FacturesSemellesService.updateFactureSemelles(facture.id, updateData);
      
      // Mettre à jour les actes orthopédiques
      await FacturesSemellesActesService.updateActesOrthopediquesForFacture(
        facture.id, 
        factureAvecTotaux.actesOrthopediques
      );

      // Récupérer la facture complète avec ses actes orthopédiques
      const factureComplete = await FacturesSemellesService.getFactureSemellesById(facture.id);
      if (!factureComplete) {
        throw new Error('Erreur lors de la récupération de la facture mise à jour');
      }

      dispatch({ type: 'UPDATE_FACTURE_SEMELLES', payload: factureComplete });
      log.info('Facture semelles mise à jour avec succès', { id: facture.id });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la facture semelles:', error);
      log.error('Erreur lors de la mise à jour de la facture semelles', { error: (error as Error).message });
      throw error;
    }
  };

  const deleteFactureSemelles = async (factureId: string) => {
    try {
      await FacturesSemellesService.deleteFactureSemelles(factureId);
      dispatch({ type: 'DELETE_FACTURE_SEMELLES', payload: factureId });
      log.info('Facture semelles supprimée avec succès', { factureId });
    } catch (error) {
      console.error('Erreur lors de la suppression de la facture semelles:', error);
      log.error('Erreur lors de la suppression de la facture semelles', { error: (error as Error).message });
      throw error;
    }
  };

  // Fonctions pour les bordereaux
  const addBordereau = async (bordereau: Bordereau) => {
    try {
      // Récupérer le cabinet_id de l'utilisateur connecté
      const user = supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const userData = await supabase
        .from('users')
        .select('cabinet_id')
        .eq('id', (await user).data.user?.id)
        .single();

      if (!userData.data?.cabinet_id) {
        throw new Error('Cabinet non trouvé pour cet utilisateur');
      }

      // Ajouter le cabinet_id au bordereau
      const bordereauWithCabinet = {
        ...bordereau,
        cabinetId: userData.data.cabinet_id
      };

      const newBordereau = await BordereauxService.createBordereau(bordereauWithCabinet);
      console.log('🔍 Bordereau créé par le service:', newBordereau);
      dispatch({ type: 'ADD_BORDEREAU', payload: newBordereau });
      log.info('Bordereau créé avec succès', { id: newBordereau.id });
      
      // Recharger les bordereaux pour avoir les données complètes (feuilles de soins, factures semelles, etc.)
      await loadBordereaux();
      console.log('🔍 Bordereaux rechargés après création');
    } catch (error) {
      console.error('Erreur lors de la création du bordereau:', error);
      log.error('Erreur lors de la création du bordereau', { error: (error as Error).message });
      throw error;
    }
  };

  const updateBordereau = async (bordereau: Bordereau) => {
    try {
      // Récupérer le cabinet_id de l'utilisateur connecté
      const user = supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const userData = await supabase
        .from('users')
        .select('cabinet_id')
        .eq('id', (await user).data.user?.id)
        .single();

      if (!userData.data?.cabinet_id) {
        throw new Error('Cabinet non trouvé pour cet utilisateur');
      }

      // Ajouter le cabinet_id au bordereau
      const bordereauWithCabinet = {
        ...bordereau,
        cabinetId: userData.data.cabinet_id
      };

      const updatedBordereau = await BordereauxService.updateBordereau(bordereau.id, bordereauWithCabinet);
      dispatch({ type: 'UPDATE_BORDEREAU', payload: updatedBordereau });
      log.info('Bordereau mis à jour avec succès', { id: bordereau.id });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du bordereau:', error);
      log.error('Erreur lors de la mise à jour du bordereau', { error: (error as Error).message });
      throw error;
    }
  };

  const deleteBordereau = async (bordereauId: string) => {
    try {
      const success = await BordereauxService.deleteBordereau(bordereauId);
      if (success) {
        dispatch({ type: 'DELETE_BORDEREAU', payload: bordereauId });
        log.info('Bordereau supprimé avec succès', { bordereauId });
        
        // Recharger les bordereaux, feuilles de soins et factures semelles pour s'assurer que l'état est synchronisé
        await loadBordereaux();
        await loadFeuillesSoins();
        await loadFacturesSemelles();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du bordereau:', error);
      log.error('Erreur lors de la suppression du bordereau', { error: (error as Error).message });
      throw error;
    }
  };

  // Fonctions pour les modèles
  const addModele = (modele: ModeleDocument) => {
    dispatch({ type: 'ADD_MODELE', payload: modele });
    const modeles = [...state.modeles, modele];
    StorageManager.saveModeles(modeles);
  };

  const updateModele = (modele: ModeleDocument) => {
    dispatch({ type: 'UPDATE_MODELE', payload: modele });
    const modeles = state.modeles.map(m => m.id === modele.id ? modele : m);
    StorageManager.saveModeles(modeles);
  };

  const deleteModele = (modeleId: string) => {
    dispatch({ type: 'DELETE_MODELE', payload: modeleId });
    const modeles = state.modeles.filter(m => m.id !== modeleId);
    StorageManager.saveModeles(modeles);
  };

  // Fonctions pour les médecins
  const addMedecin = async (medecin: Medecin) => {
    try {
      const newMedecin = await MedecinsService.createMedecin(medecin);
      dispatch({ type: 'ADD_MEDECIN', payload: newMedecin });
    } catch (error) {
      console.error('Erreur lors de la création du médecin:', error);
      throw error;
    }
  };

  const updateMedecin = async (medecin: Medecin) => {
    try {
      const updatedMedecin = await MedecinsService.updateMedecin(medecin);
      dispatch({ type: 'UPDATE_MEDECIN', payload: updatedMedecin });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du médecin:', error);
      throw error;
    }
  };

  const deleteMedecin = async (medecinId: string) => {
    try {
      await MedecinsService.deleteMedecin(medecinId);
      dispatch({ type: 'DELETE_MEDECIN', payload: medecinId });
    } catch (error) {
      console.error('Erreur lors de la suppression du médecin:', error);
      throw error;
    }
  };

  // Fonctions pour les actes
  const addActe = (acte: Acte) => {
    dispatch({ type: 'ADD_ACTE', payload: acte });
    const actes = [...state.actes, acte];
    StorageManager.saveActes(actes);
  };

  const updateActe = (acte: Acte) => {
    dispatch({ type: 'UPDATE_ACTE', payload: acte });
    const actes = state.actes.map(a => a.id === acte.id ? acte : a);
    StorageManager.saveActes(actes);
  };

  const deleteActe = (acteId: string) => {
    dispatch({ type: 'DELETE_ACTE', payload: acteId });
    const actes = state.actes.filter(a => a.id !== acteId);
    StorageManager.saveActes(actes);
  };

  // Fonctions pour les templates d'actes
  const addActeTemplate = async (template: ActeTemplate) => {
    try {
      const newTemplate = await ActesService.createActeTemplate(template);
      dispatch({ type: 'ADD_ACTE_TEMPLATE', payload: newTemplate });
    } catch (error) {
      console.error('Erreur lors de la création du template d\'acte:', error);
      throw error;
    }
  };

  const updateActeTemplate = async (template: ActeTemplate) => {
    try {
      const updatedTemplate = await ActesService.updateActeTemplate(template);
      dispatch({ type: 'UPDATE_ACTE_TEMPLATE', payload: updatedTemplate });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du template d\'acte:', error);
      throw error;
    }
  };

  const deleteActeTemplate = async (templateId: string) => {
    try {
      await ActesService.deleteActeTemplate(templateId);
      dispatch({ type: 'DELETE_ACTE_TEMPLATE', payload: templateId });
    } catch (error) {
      console.error('Erreur lors de la suppression du template d\'acte:', error);
      throw error;
    }
  };

  // Fonctions pour les actes de soins
  const addActeSoins = async (acte: ActeSoins) => {
    try {
      const cabinetId = state.userInfo?.cabinet_id || state.cabinetInfo?.id;
      const newActe = await ActesSoinsService.createActeSoins(acte, cabinetId);
      dispatch({ type: 'ADD_ACTE_SOINS', payload: newActe });
    } catch (error) {
      console.error('Erreur lors de la création de l\'acte de soins:', error);
      throw error;
    }
  };

  const updateActeSoins = async (acte: ActeSoins) => {
    try {
      const updatedActe = await ActesSoinsService.updateActeSoins(acte);
      dispatch({ type: 'UPDATE_ACTE_SOINS', payload: updatedActe });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'acte de soins:', error);
      throw error;
    }
  };

  const deleteActeSoins = async (acteId: string) => {
    try {
      await ActesSoinsService.deleteActeSoins(acteId);
      dispatch({ type: 'DELETE_ACTE_SOINS', payload: acteId });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'acte de soins:', error);
      throw error;
    }
  };

  // Fonctions pour les actes orthopédiques
  const addActeOrthopedique = async (acte: ActeOrthopedique) => {
    try {
      const cabinetId = state.userInfo?.cabinet_id || state.cabinetInfo?.id;
      const newActe = await ActesOrthopediquesService.createActeOrthopedique(acte, cabinetId);
      dispatch({ type: 'ADD_ACTE_ORTHOPEDIQUE', payload: newActe });
    } catch (error) {
      console.error('Erreur lors de la création de l\'acte orthopédique:', error);
      throw error;
    }
  };

  const updateActeOrthopedique = async (acte: ActeOrthopedique) => {
    try {
      const updatedActe = await ActesOrthopediquesService.updateActeOrthopedique(acte);
      dispatch({ type: 'UPDATE_ACTE_ORTHOPEDIQUE', payload: updatedActe });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'acte orthopédique:', error);
      throw error;
    }
  };

  const deleteActeOrthopedique = async (acteId: string) => {
    try {
      await ActesOrthopediquesService.deleteActeOrthopedique(acteId);
      dispatch({ type: 'DELETE_ACTE_ORTHOPEDIQUE', payload: acteId });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'acte orthopédique:', error);
      throw error;
    }
  };

  // Fonctions pour les ordonnances
  const addOrdonnance = async (ordonnance: Omit<Ordonnance, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newOrdonnance = await OrdonnancesService.createOrdonnance(ordonnance);
      if (newOrdonnance) {
        dispatch({ type: 'ADD_ORDONNANCE', payload: newOrdonnance });
        log.info('Ordonnance créée avec succès', { ordonnanceId: newOrdonnance.id });
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'ordonnance:', error);
      log.error('Erreur lors de la création de l\'ordonnance', { error: (error as Error).message });
    }
  };

  const updateOrdonnance = async (ordonnanceId: string, updates: Partial<Ordonnance>) => {
    try {
      const updatedOrdonnance = await OrdonnancesService.updateOrdonnance(ordonnanceId, updates);
      if (updatedOrdonnance) {
        dispatch({ type: 'UPDATE_ORDONNANCE', payload: updatedOrdonnance });
        log.info('Ordonnance mise à jour avec succès', { ordonnanceId });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'ordonnance:', error);
      log.error('Erreur lors de la mise à jour de l\'ordonnance', { error: (error as Error).message });
    }
  };

  const deleteOrdonnance = async (ordonnanceId: string) => {
    try {
      const success = await OrdonnancesService.deleteOrdonnance(ordonnanceId);
      if (success) {
        dispatch({ type: 'DELETE_ORDONNANCE', payload: ordonnanceId });
        log.info('Ordonnance supprimée avec succès', { ordonnanceId });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'ordonnance:', error);
      log.error('Erreur lors de la suppression de l\'ordonnance', { error: (error as Error).message });
    }
  };

  // Fonction pour la configuration
  const updateConfiguration = (config: Configuration) => {
    dispatch({ type: 'UPDATE_CONFIGURATION', payload: config });
    StorageManager.saveConfiguration(config);
  };

  const updateUserInfo = (userInfo: any) => {
    dispatch({ type: 'UPDATE_USER_INFO', payload: userInfo });
  };

  // Fonctions utilitaires
  const formaterMontant = (montant: number): string => {
    return CalculUtils.formaterMontant(montant);
  };

  // Fonctions de formatage qui respectent les préférences de l'utilisateur
  const formatDate = (date: Date | string | null | undefined): string => {
    const format = state.userInfo?.config_formats?.formatDate || 'DD/MM/YYYY';
    return Formatters.formatDate(date, format);
  };

  const formatNumber = (value: number | string | null | undefined, decimals: number = 2): string => {
    const format = state.userInfo?.config_formats?.formatNombre || 'Virgule (1,234.56)';
    return Formatters.formatNumber(value, format, decimals);
  };

  const formatCurrency = (amount: number | string | null | undefined): string => {
    const format = state.userInfo?.config_formats?.formatNombre || 'Virgule (1,234.56)';
    return Formatters.formatCurrency(amount, format);
  };

  const parseDate = (dateString: string): Date | null => {
    const format = state.userInfo?.config_formats?.formatDate || 'DD/MM/YYYY';
    return Formatters.parseDate(dateString, format);
  };

  const parseNumber = (numberString: string): number | null => {
    const format = state.userInfo?.config_formats?.formatNombre || 'Virgule (1,234.56)';
    return Formatters.parseNumber(numberString, format);
  };

  const setSelectedPatient = (patient: Patient | undefined) => {
    dispatch({ type: 'SET_SELECTED_PATIENT', payload: patient });
  };

  const setSelectedModele = (modele: ModeleDocument | undefined) => {
    dispatch({ type: 'SET_SELECTED_MODELE', payload: modele });
  };

  const clearAllData = () => {
    StorageManager.clearAllData();
    dispatch({ type: 'LOAD_APP_STATE', payload: initialState });
  };

  const exportData = () => {
    const data = StorageManager.getAppState();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cabinet-medical-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (data: any) => {
    StorageManager.saveAppState(data);
    dispatch({ type: 'LOAD_APP_STATE', payload: data });
  };

  // Fonctions manquantes
  const addPatientNote = async (patientId: string, note: any) => {
    try {
      // Récupérer l'utilisateur connecté depuis Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', userError);
        return;
      }

      // Récupérer les informations de l'utilisateur depuis la table users
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('cabinet_id')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData) {
        console.error('Erreur lors de la récupération des données utilisateur:', userDataError);
        return;
      }

      // Créer la note dans la table patient_notes
      const { data: noteData, error: noteError } = await supabase
        .from('patient_notes')
        .insert({
          patient_id: patientId,
          contenu: note.content,
          paramed_id: user.id,
          cabinet_id: userData.cabinet_id
        })
        .select()
        .single();

      if (noteError) {
        console.error('Erreur lors de la création de la note:', noteError);
        return;
      }

      console.log('Note créée avec succès:', noteData);

      // Les notes sont maintenant gérées directement par le composant PatientNotes
      // Pas besoin de mettre à jour l'état global

    } catch (error) {
      console.error('Erreur lors de l\'ajout de la note:', error);
    }
  };

  const deletePatientNote = async (patientId: string, noteId: string) => {
    try {
      // Supprimer la note de la table patient_notes
      const { error: deleteError } = await supabase
        .from('patient_notes')
        .delete()
        .eq('id', noteId);

      if (deleteError) {
        console.error('Erreur lors de la suppression de la note:', deleteError);
        return;
      }

      console.log('Note supprimée avec succès');

      // Les notes sont maintenant gérées directement par le composant PatientNotes
      // Pas besoin de mettre à jour l'état global

    } catch (error) {
      console.error('Erreur lors de la suppression de la note:', error);
    }
  };

  const mergePatients = async (
    mergedPatient: Patient,
    patientsToRemove: Patient[],
    selectedOrdonnances: string[],
    selectedFeuillesSoins: string[]
  ) => {
    try {
      // Collecter tous les IDs des patients à fusionner (patient conservé + doublons)
      const patientIds = [mergedPatient.id, ...patientsToRemove.map(p => p.id)];
      
      console.log('🔄 Fusion des patients:', {
        patientConserve: mergedPatient.id,
        doublons: patientsToRemove.map(p => p.id),
        totalPatients: patientIds.length
      });

      // Appeler le service pour fusionner dans Supabase
      const updatedPatient = await PatientsService.mergePatients(patientIds, mergedPatient);
      
      // Mettre à jour le state local
      // Supprimer les doublons
      patientsToRemove.forEach(patient => {
        dispatch({ type: 'DELETE_PATIENT', payload: patient.id });
      });
      
      // Mettre à jour le patient conservé
      dispatch({ type: 'UPDATE_PATIENT', payload: updatedPatient });
      
      // Recharger les feuilles de soins et ordonnances pour avoir les références mises à jour
      await loadFeuillesSoins();
      await loadOrdonnances();
      
      // Recharger les patients pour mettre à jour la détection des doublons
      await refreshPatients();
      
      console.log('✅ Fusion terminée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de la fusion des patients:', error);
      throw error;
    }
  };

  // Fonctions pour gérer les todos
  const loadTodos = async () => {
    try {
      // Récupérer l'utilisateur connecté pour obtenir le cabinet_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', userError);
        return;
      }

      // Récupérer les informations de l'utilisateur depuis la table users
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('cabinet_id')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData) {
        console.error('Erreur lors de la récupération des données utilisateur:', userDataError);
        return;
      }

      const todos = await TodosService.loadTodos(userData.cabinet_id);
      dispatch({ type: 'SET_TODOS', payload: todos });
    } catch (error) {
      log.error('Erreur lors du chargement des todos:', error);
    }
  };

  const loadOrdonnances = async () => {
    try {
      // Récupérer l'utilisateur connecté pour obtenir le cabinet_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', userError);
        return;
      }

      // Récupérer les informations de l'utilisateur depuis la table users
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('cabinet_id')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData) {
        console.error('Erreur lors de la récupération des données utilisateur:', userDataError);
        return;
      }

      const ordonnances = await OrdonnancesService.getOrdonnances(userData.cabinet_id);
      dispatch({ type: 'SET_ORDONNANCES', payload: ordonnances });
    } catch (error) {
      log.error('Erreur lors du chargement des ordonnances:', error);
    }
  };

  const addTodo = async (todo: Omit<TodoItem, 'id' | 'createdAt' | 'completedAt'>) => {
    try {
      // Récupérer l'utilisateur connecté pour obtenir le cabinet_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', userError);
        return;
      }

      // Récupérer les informations de l'utilisateur depuis la table users
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('cabinet_id')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData) {
        console.error('Erreur lors de la récupération des données utilisateur:', userDataError);
        return;
      }

      console.log('🔄 Création de la tâche todo:', todo);
      const newTodo = await TodosService.createTodo(todo, userData.cabinet_id);
      console.log('📝 Résultat de la création:', newTodo);
      if (newTodo) {
        dispatch({ type: 'ADD_TODO', payload: newTodo });
        console.log('✅ Tâche ajoutée au state');
      } else {
        console.error('❌ Échec de la création de la tâche');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la tâche:', error);
    }
  };

  const updateTodo = async (id: string, updates: Partial<TodoItem>) => {
    try {
      const updatedTodo = await TodosService.updateTodo(id, updates);
      if (updatedTodo) {
        dispatch({ type: 'UPDATE_TODO', payload: { id, updates } });
      } else {
        log.error('Échec de la mise à jour de la tâche');
      }
    } catch (error) {
      log.error('Erreur lors de la mise à jour de la tâche:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const success = await TodosService.deleteTodo(id);
      if (success) {
        dispatch({ type: 'DELETE_TODO', payload: id });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la tâche:', error);
    }
  };

  // Fonction loadInitialData
  const loadInitialData = async () => {
    if (isLoading) {
      console.log('⏸️ Chargement déjà en cours, ignoré');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🔄 Chargement des données depuis Supabase...');
      
      // Test de connexion Supabase
      try {
        const { error: testError } = await supabase
          .from('patients')
          .select('count')
          .limit(1);
        
        if (testError) {
          console.error('❌ Erreur de connexion Supabase:', testError);
        } else {
          console.log('✅ Connexion Supabase OK');
        }
      } catch (supabaseError) {
        console.error('❌ Impossible de se connecter à Supabase:', supabaseError);
      }
      
      // Fonction utilitaire pour ajouter un timeout aux requêtes
      const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          )
        ]);
      };
      
      // Récupérer l'utilisateur connecté pour obtenir le cabinet_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        log.warning('Utilisateur non connecté pour charger les données');
        return;
      }

      // Récupérer les informations du cabinet depuis la table users
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('cabinet_id')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData?.cabinet_id) {
        log.warning('Cabinet ID manquant pour charger les données');
        return;
      }

      // Charger les données de base en parallèle avec timeout (count des patients seulement, pas tous les patients)
      const [patientsCount, medecins, actesSoins, actesOrthopediques, feuillesSoins, facturesSemelles, bordereaux, todos, ordonnances, cabinetInfo, userInfo] = await Promise.allSettled([
        withTimeout(PatientsService.getPatientsCount()),
        withTimeout(MedecinsService.getMedecins()),
        withTimeout(ActesSoinsService.getActesSoins(userData.cabinet_id)), // Passer le cabinet_id
        withTimeout(ActesOrthopediquesService.getActesOrthopediques(userData.cabinet_id)), // Passer le cabinet_id
        withTimeout(FeuillesSoinsService.getFeuillesSoins(userData.cabinet_id)),
        withTimeout(FacturesSemellesService.getFacturesSemelles(userData.cabinet_id)),
        withTimeout(BordereauxService.getBordereaux(userData.cabinet_id)),
        withTimeout(TodosService.loadTodos(userData.cabinet_id)),
        withTimeout(OrdonnancesService.getOrdonnances(userData.cabinet_id)),
        withTimeout(CabinetService.getCabinetById(userData.cabinet_id)),
        withTimeout(UserService.getUserInfo(user.id))
      ]);

      // Traiter les résultats avec gestion d'erreur
      const patientsData: Patient[] = []; // Patients chargés à la demande (page patients)
      const patientsCountData = patientsCount.status === 'fulfilled' ? (patientsCount as any).value : 0;
      const medecinsData = medecins.status === 'fulfilled' ? (medecins as any).value : [];
      const actesSoinsData = actesSoins.status === 'fulfilled' ? (actesSoins as any).value : [];
      const actesOrthopediquesData = actesOrthopediques.status === 'fulfilled' ? (actesOrthopediques as any).value : [];
      const feuillesSoinsData = feuillesSoins.status === 'fulfilled' ? (feuillesSoins as any).value : [];
      const facturesSemellesData = facturesSemelles.status === 'fulfilled' ? (facturesSemelles as any).value : [];
      const bordereauxData = bordereaux.status === 'fulfilled' ? (bordereaux as any).value : [];
      const todosData = todos.status === 'fulfilled' ? (todos as any).value : [];
      const ordonnancesData = ordonnances.status === 'fulfilled' ? (ordonnances as any).value : [];
      const cabinetData = cabinetInfo.status === 'fulfilled' ? (cabinetInfo as any).value : null;
      const userDataInfo = userInfo.status === 'fulfilled' ? (userInfo as any).value : null;

      console.log(`✅ ${patientsCountData} patients (count), ${medecinsData.length} médecins, ${actesSoinsData.length} actes soins, ${actesOrthopediquesData.length} actes orthopédiques, ${feuillesSoinsData.length} feuilles de soins, ${facturesSemellesData.length} factures semelles, ${bordereauxData.length} bordereaux, ${todosData.length} todos, ${ordonnancesData.length} ordonnances chargés`);
      
      // Charger tous les actes de feuilles de soins en une seule requête
      let feuillesAvecActes = feuillesSoinsData;
      if (feuillesSoinsData.length > 0) {
        try {
          const feuilleIds = feuillesSoinsData.map((f: any) => f.id);
          const tousActes = await FeuillesSoinsActesService.getActesByFeuilles(feuilleIds);
          
          // Grouper les actes par feuille
          const actesParFeuille = tousActes.reduce((acc: any, acte: any) => {
            if (!acc[acte.feuille_soins_id]) acc[acte.feuille_soins_id] = [];
            acc[acte.feuille_soins_id].push(acte);
            return acc;
          }, {} as Record<string, any[]>);

          // Assigner les actes et recalculer les montants
          feuillesAvecActes = feuillesSoinsData.map((feuille: any) => {
            const actes = actesParFeuille[feuille.id] || [];
            const feuilleAvecActes = { ...feuille, actes };
            return CalculUtils.recalculerTotauxFeuille(feuilleAvecActes);
          });
        } catch (error) {
          console.error('Erreur lors du chargement des actes de feuilles de soins:', error);
          // En cas d'erreur, utiliser les feuilles sans actes
          feuillesAvecActes = feuillesSoinsData.map((feuille: any) => {
            const feuilleAvecActes = { ...feuille, actes: [] };
            return CalculUtils.recalculerTotauxFeuille(feuilleAvecActes);
          });
        }
      }

      // Nettoyer les anciennes données du localStorage
      CleanupUtils.cleanupFeuillesSoins();
      CleanupUtils.cleanupFacturesSemelles();
      
      // Charger tous les actes orthopédiques des factures en une seule requête
      let facturesAvecActes = facturesSemellesData;
      if (facturesSemellesData.length > 0) {
        try {
          const factureIds = facturesSemellesData.map((f: any) => f.id);
          const tousActesOrthopediques = await FacturesSemellesActesService.getActesOrthopediquesByFactures(factureIds);
          
          // Grouper les actes par facture
          const actesParFacture = tousActesOrthopediques.reduce((acc: any, acte: any) => {
            if (!acc[acte.facture_semelles_id]) acc[acte.facture_semelles_id] = [];
            acc[acte.facture_semelles_id].push(acte);
            return acc;
          }, {} as Record<string, any[]>);

          // Assigner les actes aux factures
          facturesAvecActes = facturesSemellesData.map((facture: any) => ({
            ...facture,
            actesOrthopediques: actesParFacture[facture.id] || []
          }));
        } catch (error) {
          console.error('Erreur lors du chargement des actes orthopédiques:', error);
          // En cas d'erreur, utiliser les factures sans actes
          facturesAvecActes = facturesSemellesData.map((facture: any) => ({
            ...facture,
            actesOrthopediques: []
          }));
        }
      }
      
      // Créer l'état complet avec uniquement les données de Supabase
      const stateWithDefaults = {
        ...initialState, // Utiliser l'état initial comme base
        patients: patientsData, // Patients chargés à la demande
        patientsCount: patientsCountData, // Nombre de patients chargé
        medecins: medecinsData, // Utiliser les médecins de Supabase
        actes: [], // Table actes supprimée - utiliser actesSoins et actesOrthopediques
        acteTemplates: [], // Pas de table templates séparée - utiliser actesSoins et actesOrthopediques
        actesSoins: actesSoinsData, // Utiliser les actes de soins de Supabase
        actesOrthopediques: actesOrthopediquesData, // Utiliser les actes orthopédiques de Supabase
        feuillesSoins: feuillesAvecActes, // Utiliser les feuilles de soins de Supabase avec actes
        facturesSemelles: facturesAvecActes, // Utiliser les factures semelles de Supabase
        bordereaux: bordereauxData, // Utiliser les bordereaux de Supabase
        todos: todosData, // Utiliser les todos de Supabase
        ordonnances: ordonnancesData, // Utiliser les ordonnances de Supabase
        cabinetInfo: cabinetData, // Informations du cabinet
        userInfo: userDataInfo, // Informations de l'utilisateur
        configuration: {
          ...initialState.configuration,
          // Charger les configurations depuis la BDD si disponibles
          calculs: userDataInfo?.config_calculs || initialState.configuration.calculs,
          positionnement: userDataInfo?.config_positionnements_pdf || initialState.configuration.positionnement,
        },
        // devises supprimées - Application forcée en XPF
      };
      
      dispatch({ type: 'LOAD_APP_STATE', payload: stateWithDefaults });
      console.log('✅ Application initialisée avec succès', {
        patients: 'chargés à la demande',
        medecins: medecinsData.length,
        feuillesSoins: feuillesAvecActes.length,
        facturesSemelles: facturesAvecActes.length,
        bordereaux: bordereauxData.length,
        todos: todosData.length,
        ordonnances: ordonnancesData.length,
        cabinetInfo: cabinetData ? 'chargé' : 'non chargé',
        userInfo: userDataInfo ? 'chargé' : 'non chargé'
      });
      
      
      // Les données sont déjà chargées, pas besoin de les recharger
      console.log('✅ Toutes les données sont chargées avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      // En cas d'erreur, utiliser l'état initial vide
      console.log('🔄 Fallback vers état initial vide...');
      
      dispatch({ type: 'LOAD_APP_STATE', payload: initialState });
    } finally {
      setIsLoading(false);
    }
  };

  // Valeur du contexte
  const value: AppContextType = {
    ...state,
    state,
    isLoading,
    loadInitialData,
    addPatient,
    updatePatient,
    deletePatient,
    refreshPatients,
    addPrestation,
    updatePrestation,
    deletePrestation,
    addFeuilleSoins,
    updateFeuilleSoins,
    deleteFeuilleSoins,
    addFactureSemelles,
    updateFactureSemelles,
    deleteFactureSemelles,
    loadFacturesSemelles,
    addBordereau,
    updateBordereau,
    deleteBordereau,
    loadBordereaux,
    addModele,
    updateModele,
    deleteModele,
    addMedecin,
    updateMedecin,
    deleteMedecin,
    addActe,
    updateActe,
    deleteActe,
    addActeTemplate,
    updateActeTemplate,
    deleteActeTemplate,
    addActeSoins,
    updateActeSoins,
    deleteActeSoins,
    addActeOrthopedique,
    updateActeOrthopedique,
    deleteActeOrthopedique,
    addOrdonnance,
    updateOrdonnance,
    deleteOrdonnance,
    updateConfiguration,
    updateUserInfo,
    formaterMontant,
    formatDate,
    formatNumber,
    formatCurrency,
    parseDate,
    parseNumber,
    setSelectedPatient,
    setSelectedModele,
    clearAllData,
    exportData,
    importData,
    addPatientNote,
    deletePatientNote,
    mergePatients,
    loadTodos,
    loadOrdonnances,
    loadFeuillesSoins,
    addTodo,
    updateTodo,
    deleteTodo,
    dispatch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp doit être utilisé à l\'intérieur d\'un AppProvider');
  }
  return context;
};
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { UserService, UserProfile } from '../services/userService';
import { PatientsService } from '../services/patientsService';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import PatientList from './patients/PatientList';
import PatientForm from './patients/PatientForm';
import PatientDetails from './patients/PatientDetails';
import FeuilleSoinsList from './feuillesSoins/FeuilleSoinsList';
import FeuilleSoinsForm from './feuillesSoins/FeuilleSoinsForm';
import FactureSemellesList from './factures/FactureSemellesList';
import FactureSemellesForm from './factures/FactureSemellesForm';
import BordereauList from './bordereaux/BordereauList';
import BordereauForm from './bordereaux/BordereauForm';
import MedecinList from './medecins/MedecinList';
import MedecinForm from './medecins/MedecinForm';
import { ActesSepares } from './actes/ActesSepares';
import { ActesMigration } from './admin/ActesMigration';
import DataMigrationComponent from './admin/DataMigration';
import DuplicatesCleanupComponent from './admin/DuplicatesCleanup';
import InitTestData from './admin/InitTestData';
import FixPatientData from './admin/FixPatientData';

import Settings from './Settings';
import { Medecin, Patient, FeuilleSoins, Bordereau, FactureSemelles } from '../types';
import { CurrentView } from '../types/navigation';

const Layout: React.FC = () => {
  const [currentView, setCurrentView] = useState<CurrentView>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedMedecin, setSelectedMedecin] = useState<Medecin | undefined>(undefined);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(undefined);
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined);
  const [selectedFeuille, setSelectedFeuille] = useState<FeuilleSoins | undefined>(undefined);
  const [selectedBordereau, setSelectedBordereau] = useState<Bordereau | undefined>(undefined);
  const [selectedFacture, setSelectedFacture] = useState<FactureSemelles | undefined>(undefined);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { state } = useApp();
  const { user, signOut, forceSignOut, loading: authLoading } = useAuth();
  const [patientsCount, setPatientsCount] = useState<number | null>(null);

  // Fonction de navigation qui gère les IDs
  const handleNavigation = (view: CurrentView, id?: string) => {
    if (id && (view === 'patient-details' || view === 'patient-form')) {
      setSelectedPatientId(id);
    }
    setCurrentView(view);
  };

  // Charger le profil utilisateur complet
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        const profile = await UserService.getUserProfile(user.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    };

    loadUserProfile();
  }, [user]);

  // Charger le nombre total de patients au démarrage (sans charger la liste)
  useEffect(() => {
    const loadCount = async () => {
      try {
        const count = await PatientsService.getPatientsCount();
        setPatientsCount(count);
      } catch (e) {
        console.error('Erreur lors du chargement du nombre de patients:', e);
        setPatientsCount(null);
      }
    };
    loadCount();
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigation} />;
      case 'patients':
        return <PatientList 
          onEditPatient={(patient) => {
            setSelectedPatient(patient);
            setCurrentView('patient-form');
          }}
          onNavigate={(view, patientId) => {
            if (patientId) {
              setSelectedPatientId(patientId);
            }
            setCurrentView(view);
          }}
        />;
      case 'patient-form':
        return <PatientForm 
          onBack={() => {
            setSelectedPatient(undefined);
            setCurrentView('patients');
          }} 
          patient={selectedPatient}
        />;
      case 'patient-details':
        return <PatientDetails 
          onBack={() => {
            setSelectedPatientId(undefined);
            setCurrentView('patients');
          }}
          onEdit={(patient) => {
            // Le patient est maintenant passé en paramètre depuis PatientDetails
            setSelectedPatient(patient);
            setCurrentView('patient-form');
          }}
          patient_id={selectedPatientId || ''}
        />;
      case 'feuilles-soins':
        return <FeuilleSoinsList onEditFeuille={(feuille) => {
          setSelectedFeuille(feuille);
          setCurrentView('feuille-soins-form');
        }} />;
      case 'feuille-soins-form':
        return <FeuilleSoinsForm 
          onBack={() => {
            setSelectedFeuille(undefined);
            setCurrentView('feuilles-soins');
          }} 
          feuille={selectedFeuille}
        />;
      case 'factures-semelles':
        return <FactureSemellesList 
          onNavigate={setCurrentView}
          onEditFacture={(facture) => {
            setSelectedFacture(facture);
            setCurrentView('facture-semelles-form');
          }}
        />;
      case 'facture-semelles-form':
        return <FactureSemellesForm 
          onBack={() => {
            setSelectedFacture(undefined);
            setCurrentView('factures-semelles');
          }} 
          facture={selectedFacture}
        />;
      case 'bordereaux':
        return <BordereauList onEditBordereau={(bordereau) => {
          setSelectedBordereau(bordereau);
          setCurrentView('bordereau-form');
        }} />;
      case 'bordereau-form':
        return <BordereauForm 
          onBack={() => {
            setSelectedBordereau(undefined);
            setCurrentView('bordereaux');
          }} 
          bordereauToEdit={selectedBordereau}
        />;
      case 'medecins':
        return <MedecinList onEditMedecin={(medecin) => {
          setSelectedMedecin(medecin);
          setCurrentView('medecin-form');
        }} />;
      case 'medecin-form':
        return <MedecinForm 
          onBack={() => setCurrentView('medecins')} 
          medecinToEdit={selectedMedecin}
        />;

      case 'actes':
        return <ActesSepares onBack={() => setCurrentView('dashboard')} />;
      case 'actes-migration':
        return <ActesMigration />;
      case 'data-migration':
        return <DataMigrationComponent />;
      case 'cleanup-duplicates':
        return <DuplicatesCleanupComponent />;
      case 'init-test-data':
        return <InitTestData />;
      case 'fix-patient-data':
        return <FixPatientData />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={handleNavigation} />;
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Tableau de bord';
      case 'patients':
        return 'Gestion des patients';
      case 'patient-form':
        return selectedPatient ? 'Modifier le patient' : 'Nouveau patient';
      case 'feuilles-soins':
        return 'Feuilles de soins';
      case 'feuille-soins-form':
        return selectedFeuille ? 'Modifier la feuille de soins' : 'Nouvelle feuille de soins';
      case 'factures-semelles':
        return 'Factures semelles orthopédiques';
      case 'facture-semelles-form':
        return 'Nouvelle facture semelles';
      case 'bordereaux':
        return 'Bordereaux de remise';
      case 'bordereau-form':
        return selectedBordereau ? 'Modifier le bordereau' : 'Nouveau bordereau';
      case 'medecins':
        return 'Médecins prescripteurs';
      case 'medecin-form':
        return selectedMedecin ? 'Modifier le médecin' : 'Nouveau médecin';
      case 'data-migration':
        return 'Migration des données';
      case 'cleanup-duplicates':
        return 'Nettoyage des doublons';
      case 'init-test-data':
        return 'Données de test';
      case 'fix-patient-data':
        return 'Correction données patients';
      case 'settings':
        return 'Paramètres';
      default:
        return 'Cabinet Médical';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={setCurrentView}
        currentView={currentView}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Statistiques rapides */}
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>{patientsCount ?? state.patients.length} patients</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>{state.feuillesSoins.length} feuilles</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>{state.facturesSemelles.length} factures</span>
                </div>
              </div>

              {/* Informations utilisateur */}
              {user && userProfile && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {UserService.getDisplayName(userProfile)}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {UserService.getInitials(userProfile)}
                    </span>
                  </div>
                </div>
              )}

              {/* Bouton paramètres */}
              <button
                onClick={() => setCurrentView('settings')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                title="Paramètres"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Bouton de déconnexion */}
              <button
                onClick={async () => {
                  try {
                    await signOut();
                  } catch (error) {
                    console.error('Erreur lors de la déconnexion:', error);
                    // En cas d'erreur, forcer la déconnexion après 3 secondes
                    setTimeout(() => {
                      console.log('Déconnexion forcée après timeout');
                      forceSignOut();
                    }, 3000);
                  }
                }}
                disabled={authLoading}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  authLoading 
                    ? 'bg-gray-100 cursor-not-allowed' 
                    : 'hover:bg-red-50'
                }`}
                title={authLoading ? "Déconnexion en cours..." : "Déconnexion"}
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 
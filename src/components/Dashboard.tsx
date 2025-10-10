import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { detectDuplicates, DuplicateStats } from '../utils/duplicates';
import TodoList from './todos/TodoList';
import OrdonnancesExpirantes from './dashboard/OrdonnancesExpirantes';
import { useToast } from '../hooks/useToast';
import ToastContainer from './common/ToastContainer';

import { CurrentView } from '../types/navigation';

interface DashboardProps {
  onNavigate: (view: CurrentView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { state, loadOrdonnances, refreshPatients } = useApp();
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const loadingPatients = useRef(false);
  const [duplicateStats, setDuplicateStats] = useState<DuplicateStats>({ totalDuplicates: 0, highConfidence: 0, mediumConfidence: 0, lowConfidence: 0, groups: [] });
  const { toasts, removeToast } = useToast();

  // Charger les ordonnances et les patients au montage du composant (une seule fois)
  useEffect(() => {
    const loadData = async () => {
      // Charger les ordonnances
      loadOrdonnances();
      
      // Charger les patients seulement si pas déjà chargés et pas en cours de chargement
      if (state.patients.length === 0 && !loadingPatients.current && !patientsLoaded) {
        loadingPatients.current = true;
        try {
          await refreshPatients();
          setPatientsLoaded(true);
        } catch (error) {
          console.error('Erreur lors du chargement des patients:', error);
        } finally {
          loadingPatients.current = false;
        }
      } else if (state.patients.length > 0) {
        setPatientsLoaded(true);
      }
    };

    loadData();
  }, []); // Dépendances vides = exécution une seule fois au montage

  // Calculer les doublons une seule fois quand les patients sont chargés
  // et les recalculer si le nombre de patients change (après fusion par exemple)
  useEffect(() => {
    if (patientsLoaded && state.patients.length > 0) {
      console.log('🔍 Calcul des doublons pour', state.patients.length, 'patients');
      const stats = detectDuplicates(state.patients);
      setDuplicateStats(stats);
    }
  }, [patientsLoaded, state.patients.length]); // Se déclenche quand les patients sont chargés ou quand le nombre change


  // Fonction pour calculer le pourcentage d'évolution
  const calculerPourcentageEvolution = (actuel: number, precedent: number): string => {
    if (precedent === 0) {
      return actuel > 0 ? '+100%' : '0%';
    }
    const evolution = ((actuel - precedent) / precedent) * 100;
    const signe = evolution > 0 ? '+' : '';
    return `${signe}${Math.round(evolution)}%`;
  };

  // Calcul des statistiques
  const totalPatients = state.patientsCount; // Utiliser le count qui est chargé au démarrage
  const totalFeuillesSoins = state.feuillesSoins.length;
  const totalFacturesSemelles = state.facturesSemelles.length;
  const totalBordereaux = state.bordereaux.length;
  
  // Calcul des dates avec memoization
  const { debutMoisActuel, debutMoisPrecedent, finMoisPrecedent } = useMemo(() => {
    const maintenant = new Date();
    return {
      debutMoisActuel: new Date(maintenant.getFullYear(), maintenant.getMonth(), 1),
      debutMoisPrecedent: new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1),
      finMoisPrecedent: new Date(maintenant.getFullYear(), maintenant.getMonth(), 0, 23, 59, 59)
    };
  }, []);

  // Patients avec memoization
  const { nouveauxPatientsCeMois, nouveauxPatientsMoisPrecedent, pourcentagePatientsEvolution } = useMemo(() => {
    const nouveaux = state.patients.filter(patient => {
      if (!patient.dateCreation) return false;
      const dateCreation = new Date(patient.dateCreation);
      return dateCreation >= debutMoisActuel;
    }).length;

    const precedent = state.patients.filter(patient => {
      if (!patient.dateCreation) return false;
      const dateCreation = new Date(patient.dateCreation);
      return dateCreation >= debutMoisPrecedent && dateCreation <= finMoisPrecedent;
    }).length;

    return {
      nouveauxPatientsCeMois: nouveaux,
      nouveauxPatientsMoisPrecedent: precedent,
      pourcentagePatientsEvolution: calculerPourcentageEvolution(nouveaux, precedent)
    };
  }, [state.patients, debutMoisActuel, debutMoisPrecedent, finMoisPrecedent]);

  // Feuilles de soins avec memoization
  const { feuillesCeMois, feuillesMoisPrecedent, pourcentageFeuillesEvolution } = useMemo(() => {
    const cemois = state.feuillesSoins.filter(feuille => {
      const dateFeuille = new Date(feuille.date_soins || feuille.actes[0]?.date || feuille.datePrescription);
      return dateFeuille >= debutMoisActuel;
    }).length;

    const precedent = state.feuillesSoins.filter(feuille => {
      const dateFeuille = new Date(feuille.date_soins || feuille.actes[0]?.date || feuille.datePrescription);
      return dateFeuille >= debutMoisPrecedent && dateFeuille <= finMoisPrecedent;
    }).length;

    return {
      feuillesCeMois: cemois,
      feuillesMoisPrecedent: precedent,
      pourcentageFeuillesEvolution: calculerPourcentageEvolution(cemois, precedent)
    };
  }, [state.feuillesSoins, debutMoisActuel, debutMoisPrecedent, finMoisPrecedent]);

  // Factures semelles avec memoization
  const { facturesCeMois, facturesMoisPrecedent, pourcentageFacturesEvolution } = useMemo(() => {
    const cemois = state.facturesSemelles.filter(facture => {
      const dateFacture = new Date(facture.dateSoins || facture.date_facture);
      return dateFacture >= debutMoisActuel;
    }).length;

    const precedent = state.facturesSemelles.filter(facture => {
      const dateFacture = new Date(facture.dateSoins || facture.date_facture);
      return dateFacture >= debutMoisPrecedent && dateFacture <= finMoisPrecedent;
    }).length;

    return {
      facturesCeMois: cemois,
      facturesMoisPrecedent: precedent,
      pourcentageFacturesEvolution: calculerPourcentageEvolution(cemois, precedent)
    };
  }, [state.facturesSemelles, debutMoisActuel, debutMoisPrecedent, finMoisPrecedent]);

  // Bordereaux avec memoization
  const { bordereauxCeMois, bordereauxMoisPrecedent, pourcentageBordereauxEvolution } = useMemo(() => {
    const cemois = state.bordereaux.filter(bordereau => {
      const dateBordereau = new Date(bordereau.date);
      return dateBordereau >= debutMoisActuel;
    }).length;

    const precedent = state.bordereaux.filter(bordereau => {
      const dateBordereau = new Date(bordereau.date);
      return dateBordereau >= debutMoisPrecedent && dateBordereau <= finMoisPrecedent;
    }).length;

    return {
      bordereauxCeMois: cemois,
      bordereauxMoisPrecedent: precedent,
      pourcentageBordereauxEvolution: calculerPourcentageEvolution(cemois, precedent)
    };
  }, [state.bordereaux, debutMoisActuel, debutMoisPrecedent, finMoisPrecedent]);

  const statsCards = [
    {
      title: 'Patients',
      value: totalPatients,
      subtitle: `${nouveauxPatientsCeMois} nouveau${nouveauxPatientsCeMois > 1 ? 'x' : ''} ce mois`,
      change: pourcentagePatientsEvolution,
      changeType: pourcentagePatientsEvolution.startsWith('+') ? 'increase' : pourcentagePatientsEvolution.startsWith('-') ? 'decrease' : 'neutral',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'bg-blue-500',
    },
    {
      title: 'Feuilles de soins',
      value: feuillesCeMois,
      subtitle: 'ce mois',
      change: pourcentageFeuillesEvolution,
      changeType: pourcentageFeuillesEvolution.startsWith('+') ? 'increase' : pourcentageFeuillesEvolution.startsWith('-') ? 'decrease' : 'neutral',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-green-500',
    },
    {
      title: 'Factures semelles',
      value: facturesCeMois,
      subtitle: 'ce mois',
      change: pourcentageFacturesEvolution,
      changeType: pourcentageFacturesEvolution.startsWith('+') ? 'increase' : pourcentageFacturesEvolution.startsWith('-') ? 'decrease' : 'neutral',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-purple-500',
    },
    {
      title: 'Bordereaux',
      value: bordereauxCeMois,
      subtitle: 'ce mois',
      change: pourcentageBordereauxEvolution,
      changeType: pourcentageBordereauxEvolution.startsWith('+') ? 'increase' : pourcentageBordereauxEvolution.startsWith('-') ? 'decrease' : 'neutral',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'bg-orange-500',
    },
  ];


  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">Vue d'ensemble de votre cabinet médical</p>
      </div>

      {/* Alerte des doublons */}
      {duplicateStats.totalDuplicates > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                {duplicateStats.totalDuplicates} doublon(s) détecté(s) dans vos patients
              </h3>
              <p className="text-xs text-yellow-700 mt-1">
                {duplicateStats.highConfidence} haute confiance, {duplicateStats.mediumConfidence} moyenne confiance
              </p>
            </div>
            <button
              onClick={() => onNavigate('patients')}
              className="text-sm text-yellow-800 hover:text-yellow-900 underline font-medium"
            >
              Gérer les doublons
            </button>
          </div>
        </div>
      )}

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-600">
                  {card.subtitle}{' '}
                  <span className={`${
                    card.changeType === 'increase' ? 'text-green-600' : 
                    card.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    ({card.change})
                  </span>
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.color} text-white`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Todo List */}
      <TodoList maxItems={5} />

      {/* Alertes ordonnances expirantes */}
      <OrdonnancesExpirantes onNavigate={onNavigate} />

      {/* Conteneur de toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default Dashboard; 
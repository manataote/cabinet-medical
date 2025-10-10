import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Patient } from '../../types';
import { CurrentView } from '../../types/navigation';
import { exportPatientsToExcel } from '../../utils/importExport';
import { detectDuplicates, getPatientReferences, DuplicateGroup, DuplicateStats } from '../../utils/duplicates';
import ImportPatientsModal from './ImportPatientsModal';
import MergePatientsModal from './MergePatientsModal';
import { PatientsService } from '../../services/patientsService';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../common/ToastContainer';

interface PatientListProps {
  onEditPatient: (patient?: Patient) => void;
  onNavigate?: (view: CurrentView, patientId?: string) => void;
}

type SortField = 'nom' | 'prenom' | 'dateNaissance' | 'dateCreation' | 'nombreActes';
type SortDirection = 'asc' | 'desc';

const PatientList: React.FC<PatientListProps> = ({ onEditPatient, onNavigate }) => {
  const { state, deletePatient, mergePatients, refreshPatients, formatDate } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState<DuplicateGroup | null>(null);
  const [sortField, setSortField] = useState<SortField>('nom');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [pagePatients, setPagePatients] = useState<Patient[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const loadingPatients = useRef(false);
  const [duplicateStats, setDuplicateStats] = useState<DuplicateStats>({ totalDuplicates: 0, highConfidence: 0, mediumConfidence: 0, lowConfidence: 0, groups: [] });
  const [isMerging, setIsMerging] = useState(false);
  const { toasts, removeToast, success, error } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Charger tous les patients pour la détection des doublons (une seule fois)
  useEffect(() => {
    const loadPatients = async () => {
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

    loadPatients();
  }, []); // Dépendances vides = une seule fois

  // Calculer les doublons quand les patients sont chargés et quand le nombre change
  useEffect(() => {
    if (patientsLoaded && state.patients.length > 0) {
      console.log('🔍 Recalcul des doublons pour', state.patients.length, 'patients');
      const stats = detectDuplicates(state.patients);
      setDuplicateStats(stats);
    }
  }, [patientsLoaded, state.patients.length]); // Se déclenche quand les patients sont chargés ou quand le nombre change

  // Écouter les événements de sauvegarde de patient
  useEffect(() => {
    const handlePatientSaved = () => {
      console.log('📡 Événement patientSaved reçu, rechargement de la liste...');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('patientSaved', handlePatientSaved);
    return () => window.removeEventListener('patientSaved', handlePatientSaved);
  }, []);

  // Debounce saisie recherche
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Fonction de tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Pré-calcul du nombre d'actes par patient (évite recalcul à chaque ligne)
  const nombreActesByPatient = useMemo(() => {
    const map = new Map<string, number>();
    for (const feuille of state.feuillesSoins) {
      const pid = feuille.patient_id;
      const current = map.get(pid) || 0;
      map.set(pid, current + (feuille.actes?.length || 0));
    }
    return map;
  }, [state.feuillesSoins]);

  // Charger la première page au montage du composant
  useEffect(() => {
    if (pagePatients.length === 0 && !isLoadingPage) {
      setCurrentPage(1);
    }
  }, [pagePatients.length, isLoadingPage]);

  // Tri client uniquement pour le champ nombreActes (les autres sont côté serveur)
  const sortedPagePatients = useMemo(() => {
    const arr = [...pagePatients];
    if (sortField !== 'nombreActes') return arr;
    arr.sort((a, b) => {
      const aValue = nombreActesByPatient.get(a.id) || 0;
      const bValue = nombreActesByPatient.get(b.id) || 0;
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [pagePatients, sortField, sortDirection, nombreActesByPatient]);

  // Réinitialiser la page sur changement de filtres/tri
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, sortField, sortDirection]);

  // Charger une page depuis Supabase (pagination serveur)
  useEffect(() => {
    const loadPage = async () => {
      setIsLoadingPage(true);
      try {
        // Mapping tri: tout serveur sauf nombreActes (tri client sur la page courante)
        const dbOrderBy =
          sortField === 'dateNaissance' ? 'date_naissance' :
          sortField === 'dateCreation' ? 'created_at' :
          sortField === 'prenom' ? 'prenom' :
          'nom';
        const offset = (currentPage - 1) * pageSize;
        // Récupérer limit+1 pour savoir s'il y a une page suivante
        const rows = await PatientsService.getPatientsListMinimal(offset, pageSize + 1, debouncedSearchTerm, dbOrderBy as any, sortDirection === 'asc');
        setHasNextPage(rows.length > pageSize);
        setPagePatients(rows.slice(0, pageSize));
      } catch (e) {
        console.error('Erreur chargement page patients:', e);
        setHasNextPage(false);
        setPagePatients([]);
      } finally {
        setIsLoadingPage(false);
      }
    };
    loadPage();
  }, [currentPage, debouncedSearchTerm, sortField, sortDirection, refreshTrigger]); // Ajout de refreshTrigger

  // duplicateStats est calculé dans un useEffect séparé pour éviter les recalculs multiples

  // Fonction pour récupérer le nombre d'actes pré-calculé
  const getNombreActes = (patientId: string): number => {
    return nombreActesByPatient.get(patientId) || 0;
  };


  const handleDeletePatient = async (patientId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
      try {
        await deletePatient(patientId);
        // Recharger la liste des patients affichée
        setRefreshTrigger(prev => prev + 1);
        success('Patient supprimé avec succès');
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        error('Erreur lors de la suppression du patient');
      }
    }
  };

  const handleExportPatients = () => {
    try {
      exportPatientsToExcel(state.patients, state.medecins, state.ordonnances);
      success('Export des patients réalisé avec succès');
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      error('Erreur lors de l\'export des patients');
    }
  };

  const handleImportComplete = () => {
    // L'import est géré par le modal, on peut juste fermer le modal
    setShowImportModal(false);
    // Recharger la liste des patients et tous les patients pour la détection des doublons
    setRefreshTrigger(prev => prev + 1);
    refreshPatients();
    success('Import des patients terminé avec succès');
  };

  const handleMergePatients = async (mergedPatient: Patient, patientsToRemove: Patient[], selectedOrdonnances: string[], selectedFeuillesSoins: string[]) => {
    setIsMerging(true);
    try {
      // Appeler la fonction de fusion avec tous les paramètres
      await mergePatients(mergedPatient, patientsToRemove, selectedOrdonnances, selectedFeuillesSoins);
      setSelectedDuplicateGroup(null);
      
      // Recharger la liste des patients affichée
      setRefreshTrigger(prev => prev + 1);
      
      // Les doublons seront recalculés automatiquement par le useEffect quand state.patients change
      
      success(`Fusion réussie ! Le patient ${mergedPatient.prenom} ${mergedPatient.nom} a été mis à jour. ${patientsToRemove.length} doublon(s) supprimé(s).`);
    } catch (err) {
      console.error('Erreur lors de la fusion:', err);
      error('Erreur lors de la fusion des patients. Veuillez réessayer.');
    } finally {
      setIsMerging(false);
    }
  };

  // Composant pour l'indicateur de tri
  const SortIndicator: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Fonction pour créer une nouvelle feuille de soins pour un patient
  const handleCreateFeuilleSoins = (patient: Patient) => {
    if (onNavigate) {
      // Stocker le patient sélectionné dans le localStorage pour le récupérer dans le formulaire
      localStorage.setItem('selectedPatientForFeuille', JSON.stringify(patient));
      onNavigate('feuille-soins-form');
    }
  };

  // Fonction pour créer une nouvelle facture de semelles pour un patient
  const handleCreateFactureSemelles = (patient: Patient) => {
    if (onNavigate) {
      // Stocker le patient sélectionné dans le localStorage pour le récupérer dans le formulaire
      localStorage.setItem('selectedPatientForFacture', JSON.stringify(patient));
      onNavigate('facture-semelles-form');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des patients</h1>
          <p className="text-gray-600">Liste de tous les patients du cabinet</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowImportModal(true)} 
            className="btn-secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Importer
          </button>
          <button 
            onClick={handleExportPatients} 
            className="btn-secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter
          </button>
          <button 
            onClick={async () => {
              try {
                await refreshPatients();
                // Recharger la page affichée
                setRefreshTrigger(prev => prev + 1);
                success('Liste des patients actualisée');
              } catch (err) {
                console.error('Erreur lors du rafraîchissement:', err);
                error('Erreur lors de l\'actualisation');
              }
            }}
            className="btn-secondary"
            title="Actualiser la liste depuis Supabase"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
          <button onClick={() => onEditPatient()} className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouveau patient
          </button>
        </div>
      </div>

      {/* Barre de recherche et tri */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Trier par:</label>
          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-') as [SortField, SortDirection];
              setSortField(field);
              setSortDirection(direction);
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="nom-asc">Nom (A-Z)</option>
            <option value="nom-desc">Nom (Z-A)</option>
            <option value="prenom-asc">Prénom (A-Z)</option>
            <option value="prenom-desc">Prénom (Z-A)</option>
            <option value="dateNaissance-asc">Date de naissance (plus ancien)</option>
            <option value="dateNaissance-desc">Date de naissance (plus récent)</option>
            <option value="dateCreation-desc">Ajouté récemment</option>
            <option value="dateCreation-asc">Ajouté en premier</option>
            <option value="nombreActes-desc">Plus d'actes</option>
            <option value="nombreActes-asc">Moins d'actes</option>
            <option value="nombreOrdonnances-desc">Plus d'ordonnances</option>
            <option value="nombreOrdonnances-asc">Moins d'ordonnances</option>
            <option value="derniereOrdonnanceSoins-desc">Dernière ordonnance soins (récent)</option>
            <option value="derniereOrdonnanceSoins-asc">Dernière ordonnance soins (ancien)</option>
            <option value="derniereOrdonnanceSemelles-desc">Dernière ordonnance semelles (récent)</option>
            <option value="derniereOrdonnanceSemelles-asc">Dernière ordonnance semelles (ancien)</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
          Page {currentPage}{hasNextPage ? '' : ''}
        </div>
      </div>

      {/* Section Gestion des doublons */}
      {duplicateStats.totalDuplicates > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  {duplicateStats.totalDuplicates} doublon(s) détecté(s)
                </h3>
                <p className="text-xs text-yellow-700">
                  {duplicateStats.highConfidence} haute confiance, {duplicateStats.mediumConfidence} moyenne confiance
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDuplicates(!showDuplicates)}
              className="text-sm text-yellow-800 hover:text-yellow-900 underline"
            >
              {showDuplicates ? 'Masquer' : 'Voir les doublons'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des doublons */}
      {showDuplicates && duplicateStats.groups.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Gestion des doublons</h3>
          <div className="space-y-4">
            {duplicateStats.groups.map((group) => (
              <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-3 ${
                      group.confidence === 'high' ? 'bg-red-100 text-red-800' :
                      group.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {group.confidence === 'high' ? 'Haute confiance' :
                       group.confidence === 'medium' ? 'Moyenne confiance' : 'Faible confiance'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {group.reason === 'dn' ? 'DN identique' :
                       group.reason === 'name_birth' ? 'Nom + Prénom + Date identiques' : 'DN + Nom identiques'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedDuplicateGroup(group)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Fusionner
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.patients.map((patient) => {
                    const references = getPatientReferences(patient.id, state.feuillesSoins, state.ordonnances);
                    return (
                      <div key={patient.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-gray-900">
                          {patient.prenom} {patient.nom}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          DN: {patient.dn || 'Non renseigné'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Né(e) le: {formatDate(patient.dateNaissance)}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {references.feuillesSoins} feuille(s) de soins • {references.ordonnances} ordonnance(s)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des patients */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th 
                  className="table-header-cell cursor-pointer hover:bg-gray-100 select-none" 
                  style={{width: 'auto', minWidth: '120px'}}
                  onClick={() => handleSort('nom')}
                >
                  <div className="flex items-center justify-between">
                    <span>Nom</span>
                    <SortIndicator field="nom" />
                  </div>
                </th>
                <th 
                  className="table-header-cell cursor-pointer hover:bg-gray-100 select-none" 
                  style={{width: 'auto', minWidth: '120px'}}
                  onClick={() => handleSort('prenom')}
                >
                  <div className="flex items-center justify-between">
                    <span>Prénom</span>
                    <SortIndicator field="prenom" />
                  </div>
                </th>
                <th className="table-header-cell" style={{width: 'auto', minWidth: '80px'}}>DN</th>
                <th 
                  className="table-header-cell cursor-pointer hover:bg-gray-100 select-none" 
                  style={{width: 'auto', minWidth: '140px'}}
                  onClick={() => handleSort('dateNaissance')}
                >
                  <div className="flex items-center justify-between">
                    <span>Date de naissance</span>
                    <SortIndicator field="dateNaissance" />
                  </div>
                </th>
                <th className="table-header-cell" style={{width: 'auto', minWidth: '120px'}}>Téléphone</th>
                <th 
                  className="table-header-cell cursor-pointer hover:bg-gray-100 select-none" 
                  style={{width: 'auto', minWidth: '80px'}}
                  onClick={() => handleSort('nombreActes')}
                >
                  <div className="flex items-center justify-between">
                    <span>Actes</span>
                    <SortIndicator field="nombreActes" />
                  </div>
                </th>
                <th className="table-header-cell" style={{width: 'auto', minWidth: '200px'}}>Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {(!isLoadingPage && sortedPagePatients.length === 0) ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-gray-500 py-8">
                    {searchTerm ? 'Aucun patient trouvé' : 'Aucun patient enregistré'}
                  </td>
                </tr>
              ) : isLoadingPage ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-gray-500 py-8">Chargement...</td>
                </tr>
              ) : (
                sortedPagePatients.map((patient) => (
                  <tr key={patient.id} className="table-row">
                    <td className="table-cell">
                      <div className="font-medium text-gray-900 truncate" title={patient.nom}>
                        {patient.nom}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900 truncate" title={patient.prenom}>
                        {patient.prenom}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-xs">{patient.dn}</span>
                    </td>
                    <td className="table-cell text-xs">
                      {formatDate(patient.dateNaissance)}
                    </td>
                    <td className="table-cell text-xs">{patient.telephone || '-'}</td>
                    <td className="table-cell text-center">
                      <div className="font-medium text-gray-900 text-xs">
                        {getNombreActes(patient.id)}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-1 flex-wrap">
                        <button
                          onClick={() => {
                            if (onNavigate) {
                              onNavigate('patient-details', patient.id);
                            }
                          }}
                          className="text-primary-600 hover:text-primary-900 transition-colors duration-200 p-2 rounded-lg hover:bg-primary-50 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          title="Voir les détails"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onEditPatient(patient)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-2 rounded-lg hover:bg-blue-50 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          title="Modifier le patient"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {onNavigate && (
                          <>
                            <button
                              onClick={() => handleCreateFeuilleSoins(patient)}
                              className="text-green-600 hover:text-green-900 transition-colors duration-200 p-2 rounded-lg hover:bg-green-50 min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Nouvelle feuille de soins"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleCreateFactureSemelles(patient)}
                              className="text-purple-600 hover:text-purple-900 transition-colors duration-200 p-2 rounded-lg hover:bg-purple-50 min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Nouvelle facture de semelles"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                          </button>
                        </>
                        )}
                        <button
                          onClick={() => handleDeletePatient(patient.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200 p-2 rounded-lg hover:bg-red-50 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          title="Supprimer le patient"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-500">
          Page {currentPage}
        </div>
        <div className="space-x-2">
          <button
            className="btn-secondary disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isLoadingPage}
          >
            Précédent
          </button>
          <button
            className="btn-secondary disabled:opacity-50"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!hasNextPage || isLoadingPage}
          >
            Suivant
          </button>
        </div>
      </div>


      {/* Modal d'import */}
      <ImportPatientsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Modal de fusion des patients */}
      {selectedDuplicateGroup && (
        <MergePatientsModal
          isOpen={!!selectedDuplicateGroup}
          onClose={() => !isMerging && setSelectedDuplicateGroup(null)}
          onMerge={(mergedPatient: Patient, patientsToRemove: Patient[], selectedOrdonnances: string[], selectedFeuillesSoins: string[]) => 
            handleMergePatients(mergedPatient, patientsToRemove, selectedOrdonnances, selectedFeuillesSoins)
          }
          duplicateGroup={selectedDuplicateGroup}
          feuillesSoins={state.feuillesSoins}
          ordonnances={state.ordonnances}
          isLoading={isMerging}
        />
      )}

      {/* Conteneur de toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default PatientList; 
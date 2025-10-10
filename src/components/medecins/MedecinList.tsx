import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Medecin } from '../../types';

interface MedecinListProps {
  onEditMedecin: (medecin?: Medecin) => void;
}

type MedecinSortField = 'nom' | 'prenom' | 'specialite' | 'dateCreation' | 'actif';
type MedecinSortDirection = 'asc' | 'desc';

const MedecinList: React.FC<MedecinListProps> = ({ onEditMedecin }) => {
  const { state, deleteMedecin } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<MedecinSortField>('nom');
  const [sortDirection, setSortDirection] = useState<MedecinSortDirection>('asc');

  // Fonction de tri
  const handleSort = (field: MedecinSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Fonction de tri des médecins
  const sortMedecins = (medecins: Medecin[]): Medecin[] => {
    return [...medecins].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'nom':
          aValue = a.nom.toLowerCase();
          bValue = b.nom.toLowerCase();
          break;
        case 'prenom':
          aValue = a.prenom.toLowerCase();
          bValue = b.prenom.toLowerCase();
          break;
        case 'specialite':
          aValue = (a.specialite || '').toLowerCase();
          bValue = (b.specialite || '').toLowerCase();
          break;
        case 'dateCreation':
          aValue = new Date(a.dateCreation || new Date());
          bValue = new Date(b.dateCreation || new Date());
          break;
        case 'actif':
          aValue = a.actif ? 1 : 0;
          bValue = b.actif ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredMedecins = sortMedecins(state.medecins.filter(medecin =>
    medecin.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medecin.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medecin.specialite?.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  const handleDeleteMedecin = (medecinId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) {
      deleteMedecin(medecinId);
    }
  };

  // Composant pour l'indicateur de tri
  const SortIndicator: React.FC<{ field: MedecinSortField }> = ({ field }) => {
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Médecins prescripteurs</h1>
          <p className="text-gray-600">Gestion des médecins prescripteurs</p>
        </div>
        <button onClick={() => onEditMedecin()} className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouveau médecin
        </button>
      </div>

      {/* Barre de recherche et tri */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher un médecin..."
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
              const [field, direction] = e.target.value.split('-') as [MedecinSortField, MedecinSortDirection];
              setSortField(field);
              setSortDirection(direction);
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="nom-asc">Nom (A-Z)</option>
            <option value="nom-desc">Nom (Z-A)</option>
            <option value="prenom-asc">Prénom (A-Z)</option>
            <option value="prenom-desc">Prénom (Z-A)</option>
            <option value="specialite-asc">Spécialité (A-Z)</option>
            <option value="specialite-desc">Spécialité (Z-A)</option>
            <option value="dateCreation-desc">Ajouté récemment</option>
            <option value="dateCreation-asc">Ajouté en premier</option>
            <option value="actif-desc">Actifs en premier</option>
            <option value="actif-asc">Inactifs en premier</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
          {filteredMedecins.length} médecin(s) trouvé(s)
        </div>
      </div>

      {/* Liste des médecins */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th 
                  className="table-header-cell cursor-pointer hover:bg-gray-100 select-none" 
                  onClick={() => handleSort('nom')}
                >
                  <div className="flex items-center justify-between">
                    <span>Nom</span>
                    <SortIndicator field="nom" />
                  </div>
                </th>
                <th 
                  className="table-header-cell cursor-pointer hover:bg-gray-100 select-none" 
                  onClick={() => handleSort('prenom')}
                >
                  <div className="flex items-center justify-between">
                    <span>Prénom</span>
                    <SortIndicator field="prenom" />
                  </div>
                </th>
                <th 
                  className="table-header-cell cursor-pointer hover:bg-gray-100 select-none" 
                  onClick={() => handleSort('specialite')}
                >
                  <div className="flex items-center justify-between">
                    <span>Spécialité</span>
                    <SortIndicator field="specialite" />
                  </div>
                </th>
                <th className="table-header-cell">N° RPPS</th>
                <th className="table-header-cell">Identifiant</th>
                <th className="table-header-cell">Téléphone</th>
                <th className="table-header-cell">Email</th>
                <th 
                  className="table-header-cell cursor-pointer hover:bg-gray-100 select-none" 
                  onClick={() => handleSort('actif')}
                >
                  <div className="flex items-center justify-between">
                    <span>Statut</span>
                    <SortIndicator field="actif" />
                  </div>
                </th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredMedecins.length === 0 ? (
                <tr>
                  <td colSpan={9} className="table-cell text-center text-gray-500 py-8">
                    {searchTerm ? 'Aucun médecin trouvé' : 'Aucun médecin enregistré'}
                  </td>
                </tr>
              ) : (
                filteredMedecins.map((medecin) => (
                  <tr key={medecin.id} className="table-row">
                    <td className="table-cell font-medium">{medecin.nom}</td>
                    <td className="table-cell">{medecin.prenom}</td>
                    <td className="table-cell">
                      {medecin.specialite || '-'}
                    </td>
                    <td className="table-cell font-mono">
                      {medecin.numeroRPPS || '-'}
                    </td>
                    <td className="table-cell font-mono">
                      {medecin.identificationPrescripteur || '-'}
                    </td>
                    <td className="table-cell">
                      {medecin.telephone || '-'}
                    </td>
                    <td className="table-cell">
                      {medecin.email || '-'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${medecin.actif ? 'badge-success' : 'badge-error'}`}>
                        {medecin.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEditMedecin(medecin)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteMedecin(medecin.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
};

export default MedecinList; 
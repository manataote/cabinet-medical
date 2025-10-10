import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { getOrdonnancesExpirantes, formaterJoursRestants, getClasseStatut } from '../../utils/ordonnances';
import { CurrentView } from '../../types/navigation';

interface OrdonnancesExpirantesProps {
  onNavigate?: (view: CurrentView, id?: string) => void;
}

const OrdonnancesExpirantes: React.FC<OrdonnancesExpirantesProps> = ({ onNavigate }) => {
  const { state, deleteOrdonnance } = useApp();
  
  // Calculer les ordonnances expirantes
  const ordonnancesExpirantes = getOrdonnancesExpirantes(state.ordonnances, state.patients);
  
  // Séparer les ordonnances expirées et celles qui vont bientôt expirer
  const ordonnancesExpirees = ordonnancesExpirantes.filter(ord => ord.statut === 'expiree');
  const ordonnancesExpireBientot = ordonnancesExpirantes.filter(ord => ord.statut === 'expire-bientot');
  
  // Limiter le nombre d'alertes affichées pour économiser l'espace
  const maxAlertes = 3;
  const ordonnancesExpireesLimitees = ordonnancesExpirees.slice(0, maxAlertes);
  const ordonnancesExpireBientotLimitees = ordonnancesExpireBientot.slice(0, maxAlertes);

  // Fonction de suppression d'ordonnance
  const handleDeleteOrdonnance = (ordonnanceId: string, patientName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'ordonnance de ${patientName} ?\n\nCette action supprimera définitivement l'ordonnance et l'alerte associée.`)) {
      deleteOrdonnance(ordonnanceId);
    }
  };

  if (ordonnancesExpirantes.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ordonnances de soins
          </h2>
        </div>
        <div className="text-center py-6">
          <div className="text-green-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm">
            Aucune ordonnance de soins n'expire dans les 30 prochains jours
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-title flex items-center">
          <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Alertes ordonnances de soins
        </h2>
        <span className="text-sm text-gray-500">
          {ordonnancesExpirantes.length} alerte{ordonnancesExpirantes.length > 1 ? 's' : ''}
          {ordonnancesExpirantes.length > maxAlertes * 2 && (
            <span className="ml-1 text-orange-600">
              (affiche les {maxAlertes * 2} plus urgentes)
            </span>
          )}
        </span>
      </div>

      <div className="space-y-2">
        {/* Ordonnances expirées */}
        {ordonnancesExpireesLimitees.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-red-600 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Expirées ({ordonnancesExpirees.length})
              {ordonnancesExpirees.length > maxAlertes && (
                <span className="ml-1 text-xs text-gray-500">
                  (affiche les {maxAlertes} plus urgentes)
                </span>
              )}
            </h3>
            <div className="space-y-1">
              {ordonnancesExpireesLimitees.map((item) => (
                <div
                  key={item.ordonnance.id}
                  className={`p-2 rounded-lg border ${getClasseStatut(item.statut)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.patient.prenom} {item.patient.nom}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Ordonnance du {new Date(item.ordonnance.date_ordonnance).toLocaleDateString('fr-FR')}
                        {' • '}
                        Durée: {item.ordonnance.duree_soins} mois
                      </div>
                      <div className="text-sm font-medium mt-1">
                        {formaterJoursRestants(item.joursRestants)}
                      </div>
                    </div>
                    <div className="ml-3 flex items-center space-x-2">
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('patient-details', item.patient.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                          title="Voir le patient"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteOrdonnance(item.ordonnance.id, `${item.patient.prenom} ${item.patient.nom}`)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                        title="Supprimer l'ordonnance"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ordonnances qui vont bientôt expirer */}
        {ordonnancesExpireBientotLimitees.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-orange-600 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Expirent bientôt ({ordonnancesExpireBientot.length})
              {ordonnancesExpireBientot.length > maxAlertes && (
                <span className="ml-1 text-xs text-gray-500">
                  (affiche les {maxAlertes} plus urgentes)
                </span>
              )}
            </h3>
            <div className="space-y-1">
              {ordonnancesExpireBientotLimitees.map((item) => (
                <div
                  key={item.ordonnance.id}
                  className={`p-2 rounded-lg border ${getClasseStatut(item.statut)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.patient.prenom} {item.patient.nom}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Ordonnance du {new Date(item.ordonnance.date_ordonnance).toLocaleDateString('fr-FR')}
                        {' • '}
                        Durée: {item.ordonnance.duree_soins} mois
                      </div>
                      <div className="text-sm font-medium mt-1">
                        {formaterJoursRestants(item.joursRestants)}
                      </div>
                    </div>
                    <div className="ml-3 flex items-center space-x-2">
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('patient-details', item.patient.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                          title="Voir le patient"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteOrdonnance(item.ordonnance.id, `${item.patient.prenom} ${item.patient.nom}`)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                        title="Supprimer l'ordonnance"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lien vers la gestion des patients */}
      {onNavigate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => onNavigate('patients')}
            className="text-sm text-primary-600 hover:text-primary-800 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Voir tous les patients
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdonnancesExpirantes;

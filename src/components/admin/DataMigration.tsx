import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { DataMigration, MigrationResult } from '../../utils/migration';

const DataMigrationComponent: React.FC = () => {
  const { state } = useApp();
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const handleMigration = async () => {
    if (!window.confirm(
      `Êtes-vous sûr de vouloir migrer toutes vos données vers Supabase ?\n\n` +
      `Cela va transférer :\n` +
      `• ${state.patients.length} patients\n` +
      `• ${state.ordonnances.length} ordonnances\n` +
      `• ${state.feuillesSoins.length} feuilles de soins\n` +
      `• ${state.facturesSemelles.length} factures\n` +
      `• ${state.bordereaux.length} bordereaux\n` +
      `• ${state.medecins.length} médecins\n` +
      `• ${state.actes.length} actes\n\n` +
      `Cette opération peut prendre quelques minutes.`
    )) {
      return;
    }

    setIsMigrating(true);
    setResult(null);

    try {
      const migrationResult = await DataMigration.migrateAllData(state);
      setResult(migrationResult);
    } catch (error) {
      setResult({
        success: false,
        patientsCount: 0,
        ordonnancesCount: 0,
        feuillesCount: 0,
        facturesCount: 0,
        bordereauxCount: 0,
        medecinsCount: 0,
        actesCount: 0,
        errors: [`Erreur lors de la migration: ${error}`]
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const getTotalDataCount = () => {
    return state.patients.length + 
           state.ordonnances.length + 
           state.feuillesSoins.length + 
           state.facturesSemelles.length + 
           state.bordereaux.length + 
           state.medecins.length + 
           state.actes.length;
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Migration des données vers Supabase</h2>
      
      <div className="space-y-6">
        {/* Résumé des données */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Données à migrer</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white rounded p-3">
              <div className="font-medium text-gray-900">Patients</div>
              <div className="text-2xl font-bold text-blue-600">{state.patients.length}</div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="font-medium text-gray-900">Ordonnances</div>
              <div className="text-2xl font-bold text-green-600">{state.ordonnances.length}</div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="font-medium text-gray-900">Feuilles de soins</div>
              <div className="text-2xl font-bold text-purple-600">{state.feuillesSoins.length}</div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="font-medium text-gray-900">Factures</div>
              <div className="text-2xl font-bold text-orange-600">{state.facturesSemelles.length}</div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="font-medium text-gray-900">Bordereaux</div>
              <div className="text-2xl font-bold text-indigo-600">{state.bordereaux.length}</div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="font-medium text-gray-900">Médecins</div>
              <div className="text-2xl font-bold text-pink-600">{state.medecins.length}</div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="font-medium text-gray-900">Actes</div>
              <div className="text-2xl font-bold text-teal-600">{state.actes.length}</div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="font-medium text-gray-900">Total</div>
              <div className="text-2xl font-bold text-gray-900">{getTotalDataCount()}</div>
            </div>
          </div>
        </div>

        {/* Bouton de migration */}
        <div className="text-center">
          <button
            onClick={handleMigration}
            disabled={isMigrating || getTotalDataCount() === 0}
            className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
              isMigrating || getTotalDataCount() === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isMigrating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Migration en cours...</span>
              </div>
            ) : (
              '🚀 Démarrer la migration'
            )}
          </button>
          
          {getTotalDataCount() === 0 && (
            <p className="text-sm text-gray-500 mt-2">Aucune donnée à migrer</p>
          )}
        </div>

        {/* Résultats */}
        {result && (
          <div className={`border rounded-lg p-4 ${
            result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center mb-3">
              {result.success ? (
                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <h3 className={`text-lg font-semibold ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.success ? 'Migration réussie !' : 'Migration échouée'}
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div className="bg-white rounded p-3">
                <div className="font-medium text-gray-900">Patients</div>
                <div className="text-xl font-bold text-blue-600">{result.patientsCount}</div>
              </div>
              <div className="bg-white rounded p-3">
                <div className="font-medium text-gray-900">Ordonnances</div>
                <div className="text-xl font-bold text-green-600">{result.ordonnancesCount}</div>
              </div>
              <div className="bg-white rounded p-3">
                <div className="font-medium text-gray-900">Feuilles de soins</div>
                <div className="text-xl font-bold text-purple-600">{result.feuillesCount}</div>
              </div>
              <div className="bg-white rounded p-3">
                <div className="font-medium text-gray-900">Factures</div>
                <div className="text-xl font-bold text-orange-600">{result.facturesCount}</div>
              </div>
              <div className="bg-white rounded p-3">
                <div className="font-medium text-gray-900">Bordereaux</div>
                <div className="text-xl font-bold text-indigo-600">{result.bordereauxCount}</div>
              </div>
              <div className="bg-white rounded p-3">
                <div className="font-medium text-gray-900">Médecins</div>
                <div className="text-xl font-bold text-pink-600">{result.medecinsCount}</div>
              </div>
              <div className="bg-white rounded p-3">
                <div className="font-medium text-gray-900">Actes</div>
                <div className="text-xl font-bold text-teal-600">{result.actesCount}</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-900 mb-2">Erreurs rencontrées :</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.success && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✅ Toutes vos données ont été transférées avec succès vers Supabase ! 
                  Vous pouvez maintenant accéder à vos données depuis n'importe où.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataMigrationComponent;




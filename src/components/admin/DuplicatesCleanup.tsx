import React, { useState, useEffect } from 'react';
import { DuplicatesCleanup, CleanupResult } from '../../utils/cleanupDuplicates';
import { useApp } from '../../contexts/AppContext';

const DuplicatesCleanupComponent: React.FC = () => {
  const { refreshPatients } = useApp();
  const [isCleaning, setIsCleaning] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [stats, setStats] = useState<{ total: number; groups: number; highConfidence: number } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const currentStats = await DuplicatesCleanup.getDuplicateStats();
      setStats(currentStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm(
      `Êtes-vous sûr de vouloir nettoyer les doublons ?\n\n` +
      `Cette opération va supprimer ${stats?.total || 0} doublons identifiés.\n` +
      `Seuls les patients les plus récents seront supprimés, les plus anciens seront conservés.\n\n` +
      `Cette action est irréversible.`
    )) {
      return;
    }

    setIsCleaning(true);
    setResult(null);

    try {
      const cleanupResult = await DuplicatesCleanup.cleanupPatientDuplicates();
      setResult(cleanupResult);
      
      // Recharger les statistiques après le nettoyage
      if (cleanupResult.success) {
        await loadStats();
        // Recharger les patients dans l'application pour mettre à jour l'interface
        await refreshPatients();
      }
    } catch (error) {
      setResult({
        success: false,
        duplicatesRemoved: 0,
        errors: [`Erreur lors du nettoyage: ${error}`]
      });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Nettoyage des doublons de patients</h2>
      
      <div className="space-y-6">
        {/* Statistiques actuelles */}
        {stats && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">Statistiques actuelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Doublons détectés</div>
              </div>
              <div className="bg-white rounded p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.groups}</div>
                <div className="text-sm text-gray-600">Groupes de doublons</div>
              </div>
              <div className="bg-white rounded p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.highConfidence}</div>
                <div className="text-sm text-gray-600">Haute confiance</div>
              </div>
            </div>
          </div>
        )}

        {/* Informations sur le nettoyage */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Comment fonctionne le nettoyage ?</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Les doublons sont identifiés par nom, prénom et date de naissance identiques</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Le patient le plus ancien (premier créé) est conservé</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Les patients plus récents (doublons) sont supprimés</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Cette action est irréversible</span>
            </li>
          </ul>
        </div>

        {/* Boutons d'action */}
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleCleanup}
              disabled={isCleaning || !stats || stats.total === 0}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                isCleaning || !stats || stats.total === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isCleaning ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Nettoyage en cours...</span>
                </div>
              ) : (
                `🧹 Nettoyer ${stats?.total || 0} doublons`
              )}
            </button>
            
            <button
              onClick={() => {
                loadStats();
                refreshPatients();
              }}
              className="px-4 py-3 rounded-lg font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              🔄 Actualiser
            </button>
          </div>
          
          {(!stats || stats.total === 0) && (
            <p className="text-sm text-gray-500">Aucun doublon détecté</p>
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
                {result.success ? 'Nettoyage réussi !' : 'Nettoyage échoué'}
              </h3>
            </div>

            <div className="mb-4">
              <div className="text-2xl font-bold text-green-600">{result.duplicatesRemoved}</div>
              <div className="text-sm text-gray-600">doublons supprimés</div>
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
                <p className="text-green-800 text-sm mb-3">
                  ✅ Le nettoyage a été effectué avec succès ! 
                  Les doublons ont été supprimés et vos données sont maintenant propres.
                </p>
                <p className="text-green-700 text-xs">
                  💡 Les données ont été rechargées automatiquement. 
                  Si vous ne voyez pas les changements, rafraîchissez la page.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DuplicatesCleanupComponent;




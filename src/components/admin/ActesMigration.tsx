import React, { useState } from 'react';
import { ActesMigrationService } from '../../utils/migrateActes';

export const ActesMigration: React.FC = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ soins: number; orthopedique: number } | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ soins: number; orthopedique: number; old: number } | null>(null);

  const handleMigration = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir migrer les actes ? Cette opération peut prendre quelques minutes.')) {
      return;
    }

    setIsMigrating(true);
    try {
      const result = await ActesMigrationService.migrateActes();
      setMigrationResult(result);
      console.log('✅ Migration terminée:', result);
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      alert('Erreur lors de la migration des actes');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleVerification = async () => {
    try {
      const result = await ActesMigrationService.verifyMigration();
      setVerificationResult(result);
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error);
      alert('Erreur lors de la vérification');
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir nettoyer l\'ancienne table actes ? Cette opération est irréversible.')) {
      return;
    }

    try {
      await ActesMigrationService.cleanupOldActes();
      alert('✅ Nettoyage terminé');
      handleVerification(); // Rafraîchir la vérification
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      alert('Erreur lors du nettoyage');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Migration des actes</h1>
        <p className="text-gray-600">Migration des données de l'ancienne table actes vers les nouvelles tables séparées</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions de migration</h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleMigration}
              disabled={isMigrating}
              className={`px-4 py-2 rounded-md font-medium ${
                isMigrating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isMigrating ? 'Migration en cours...' : 'Migrer les actes'}
            </button>
            
            <button
              onClick={handleVerification}
              className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
            >
              Vérifier la migration
            </button>
            
            <button
              onClick={handleCleanup}
              disabled={!migrationResult}
              className={`px-4 py-2 rounded-md font-medium ${
                !migrationResult
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Nettoyer l'ancienne table
            </button>
          </div>
        </div>
      </div>

      {migrationResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Migration réussie</h3>
          <div className="text-green-700">
            <p>✅ {migrationResult.soins} actes de soins migrés</p>
            <p>✅ {migrationResult.orthopedique} actes orthopédiques migrés</p>
          </div>
        </div>
      )}

      {verificationResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">État actuel des tables</h3>
          <div className="text-blue-700 space-y-1">
            <p>📊 Actes de soins: {verificationResult.soins}</p>
            <p>📊 Actes orthopédiques: {verificationResult.orthopedique}</p>
            <p>📊 Ancienne table actes: {verificationResult.old}</p>
          </div>
          
          {verificationResult.old === 0 && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
              <p className="text-green-800 font-medium">✅ Migration complète - Ancienne table vide</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Instructions importantes</h3>
        <div className="text-yellow-700 space-y-2">
          <p>1. <strong>Migrer</strong> : Transfère les données de l'ancienne table vers les nouvelles tables</p>
          <p>2. <strong>Vérifier</strong> : Contrôle l'état des tables après migration</p>
          <p>3. <strong>Nettoyer</strong> : Supprime les données de l'ancienne table (irréversible)</p>
          <p className="font-semibold">⚠️ Assurez-vous que tout fonctionne correctement avant de nettoyer l'ancienne table</p>
        </div>
      </div>
    </div>
  );
};




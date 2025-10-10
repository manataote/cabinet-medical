import React, { useState } from 'react';
import { debugAuth, createTestUser } from '../../utils/debugAuth';

const DebugAuth: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugResults, setDebugResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleDebugAuth = async () => {
    setIsLoading(true);
    setDebugResults([]);
    
    addLog('🔍 Début du diagnostic...');
    
    // Rediriger les logs de console vers notre interface
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      originalLog(...args);
      addLog(args.join(' '));
    };
    
    console.error = (...args) => {
      originalError(...args);
      addLog(`❌ ${args.join(' ')}`);
    };

    try {
      const result = await debugAuth();
      if (result) {
        addLog('✅ Diagnostic terminé avec succès !');
      } else {
        addLog('❌ Diagnostic échoué - voir les erreurs ci-dessus');
      }
    } catch (err) {
      addLog(`❌ Erreur inattendue: ${err}`);
    } finally {
      setIsLoading(false);
      console.log = originalLog;
      console.error = originalError;
    }
  };

  const handleCreateTestUser = async () => {
    setIsLoading(true);
    addLog('🧪 Création d\'un utilisateur de test...');
    
    try {
      const result = await createTestUser();
      if (result) {
        addLog('✅ Utilisateur de test créé avec succès !');
        addLog('📧 Email: test@example.com');
        addLog('🔑 Mot de passe: password123');
      } else {
        addLog('❌ Échec de la création de l\'utilisateur de test');
      }
    } catch (err) {
      addLog(`❌ Erreur: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setDebugResults([]);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🔧 Debug Authentification
      </h2>

      <div className="space-y-4 mb-6">
        <button
          onClick={handleDebugAuth}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Diagnostic en cours...' : '🔍 Diagnostiquer l\'authentification'}
        </button>

        <button
          onClick={handleCreateTestUser}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ml-4"
        >
          {isLoading ? 'Création...' : '🧪 Créer un utilisateur de test'}
        </button>

        <button
          onClick={clearLogs}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium ml-4"
        >
          🗑️ Effacer les logs
        </button>
      </div>

      {debugResults.length > 0 && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          <div className="text-yellow-400 mb-2 font-bold">📋 Logs de diagnostic:</div>
          {debugResults.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Instructions:</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>1. Cliquez sur "Diagnostiquer" pour vérifier la configuration</li>
          <li>2. Si des erreurs apparaissent, vérifiez la connexion Supabase</li>
          <li>3. Utilisez "Créer un utilisateur de test" pour tester l'inscription</li>
          <li>4. Les logs s'affichent en temps réel ci-dessous</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugAuth;


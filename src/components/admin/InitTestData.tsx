import React from 'react';
import { initTestData, clearTestData } from '../../utils/initTestData';
import { testSupabaseConnection } from '../../utils/testSupabase';

const InitTestData: React.FC = () => {
  const handleInitData = () => {
    const success = initTestData();
    if (success) {
      alert('Données de test créées avec succès ! Rechargez la page pour voir les changements.');
      window.location.reload();
    } else {
      alert('Erreur lors de la création des données de test.');
    }
  };

  const handleClearData = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible.')) {
      clearTestData();
      alert('Données supprimées. Rechargez la page.');
      window.location.reload();
    }
  };

  const handleTestSupabase = async () => {
    console.log('🔍 Test de connexion Supabase...');
    const success = await testSupabaseConnection();
    if (success) {
      alert('Test Supabase réussi ! Vérifiez la console pour plus de détails.');
    } else {
      alert('Test Supabase échoué ! Vérifiez la console pour plus de détails.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Gestion des données de test
      </h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Test de connexion Supabase
          </h3>
          <p className="text-green-700 mb-4">
            Teste la connexion à Supabase et vérifie l'accessibilité des tables.
          </p>
          <button
            onClick={handleTestSupabase}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Tester Supabase
          </button>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Initialiser les données de test
          </h3>
          <p className="text-blue-700 mb-4">
            Crée des données de test incluant un médecin, un patient, un acte de soins et un acte orthopédique.
          </p>
          <button
            onClick={handleInitData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer les données de test
          </button>
        </div>

        <div className="p-4 bg-red-50 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Supprimer toutes les données
          </h3>
          <p className="text-red-700 mb-4">
            ⚠️ Cette action supprimera définitivement toutes les données de l'application.
          </p>
          <button
            onClick={handleClearData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Supprimer toutes les données
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitTestData;

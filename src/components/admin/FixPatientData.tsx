import React, { useState } from 'react';
import { fixPatientData, createTestPatientData } from '../../utils/fixPatientData';

const FixPatientData: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleFixData = async () => {
    setIsLoading(true);
    setMessage('Correction en cours...');
    
    try {
      await fixPatientData();
      setMessage('✅ Correction terminée ! Rechargez la page pour voir les changements.');
    } catch (error) {
      setMessage(`❌ Erreur: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTestData = async () => {
    setIsLoading(true);
    setMessage('Création des données de test...');
    
    try {
      await createTestPatientData();
      setMessage('✅ Données de test créées ! Rechargez la page pour voir les changements.');
    } catch (error) {
      setMessage(`❌ Erreur: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">🔧 Correction des données patients</h2>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-800 mb-2">🚨 Problèmes critiques identifiés :</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• <strong>Colonnes manquantes</strong> dans la table Supabase 'patients' :</li>
              <li className="ml-4">- <code>adresse</code> (adresse du patient)</li>
              <li className="ml-4">- <code>dn</code> (Identifiant CPS)</li>
              <li className="ml-4">- <code>numero_facture</code> (numéro de facture)</li>
              <li className="ml-4">- <code>assure_*</code> (tous les champs assuré)</li>
              <li>• Les DN sont au format date de naissance (8 chiffres) au lieu d'identifiants CPS (7 chiffres)</li>
              <li>• Les dates de naissance sont incohérentes entre le tableau et le formulaire</li>
              <li>• Les modifications ne se sauvegardent pas à cause des colonnes manquantes</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">🔧 Solution :</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. <strong>Exécutez le script SQL</strong> dans Supabase pour ajouter la colonne manquante</li>
              <li>2. <strong>Utilisez les boutons ci-dessous</strong> pour corriger les données</li>
            </ol>
            <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
              <strong>Script SQL complet à exécuter :</strong><br/>
              <code className="block mt-1 text-xs">
                -- Ajouter toutes les colonnes manquantes<br/>
                ALTER TABLE patients ADD COLUMN IF NOT EXISTS adresse TEXT;<br/>
                ALTER TABLE patients ADD COLUMN IF NOT EXISTS dn VARCHAR(7);<br/>
                ALTER TABLE patients ADD COLUMN IF NOT EXISTS numero_facture VARCHAR(255);<br/>
                ALTER TABLE patients ADD COLUMN IF NOT EXISTS assure_nom VARCHAR(255);<br/>
                ALTER TABLE patients ADD COLUMN IF NOT EXISTS assure_prenom VARCHAR(255);<br/>
                ALTER TABLE patients ADD COLUMN IF NOT EXISTS assure_dn VARCHAR(7);<br/>
                ALTER TABLE patients ADD COLUMN IF NOT EXISTS assure_date_naissance DATE;<br/>
                ALTER TABLE patients ADD COLUMN IF NOT EXISTS assure_adresse TEXT;<br/>
                ALTER TABLE patients ADD COLUMN IF NOT EXISTS assure_telephone VARCHAR(50);
              </code>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleFixData}
              disabled={isLoading}
              className="btn btn-warning"
            >
              {isLoading ? 'Correction...' : '🔧 Corriger les données existantes'}
            </button>

            <button
              onClick={handleCreateTestData}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Création...' : '🧪 Créer des données de test correctes'}
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-lg ${
              message.includes('✅') ? 'bg-green-50 text-green-700' : 
              message.includes('❌') ? 'bg-red-50 text-red-700' : 
              'bg-blue-50 text-blue-700'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-3">📋 Instructions</h3>
        <ol className="text-sm space-y-2 text-gray-700">
          <li>1. <strong>🚨 URGENT</strong> : Allez dans Supabase → SQL Editor et exécutez le script SQL complet ci-dessus</li>
          <li>2. <strong>Corriger les données existantes</strong> : Vide tous les DN incorrects pour permettre la saisie manuelle</li>
          <li>3. <strong>Créer des données de test</strong> : Crée un patient test (Soraya ABBES) avec les bonnes données</li>
          <li>4. <strong>Recharger la page</strong> : Actualisez pour voir les changements</li>
          <li>5. <strong>Tester la modification</strong> : Modifiez le DN et vérifiez qu'il se sauvegarde</li>
          <li>6. <strong>Tester l'assuré différent</strong> : Cochez "Assuré différent" et vérifiez que les champs se sauvegardent</li>
        </ol>
      </div>
    </div>
  );
};

export default FixPatientData;

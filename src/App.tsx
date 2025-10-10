import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import './index.css';

// Composant qui utilise le contexte App
const AppWithContext: React.FC = () => {
  const { state } = useApp();
  const scale = state.configuration.apparence?.echelleAffichage || 1.0;

  return (
    <div 
      style={{ 
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${100 / scale}%`,
        height: `${100 / scale}%`
      }}
    >
      <Layout />
    </div>
  );
};

// Composant qui gère l'authentification et le chargement des données
const AuthContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { loadInitialData, isLoading: dataLoading } = useApp();
  const [dataLoaded, setDataLoaded] = useState(false);

  // Charger les données une fois que l'utilisateur est connecté
  useEffect(() => {
    if (user && !dataLoaded && !dataLoading) {
      console.log('🔄 Début du chargement des données Supabase...');
      loadInitialData().then(() => {
        console.log('✅ Données Supabase chargées avec succès');
        setDataLoaded(true);
      }).catch((error: any) => {
        console.error('❌ Erreur lors du chargement des données:', error);
        setDataLoaded(true); // Marquer comme chargé même en cas d'erreur
      });
    }
  }, [user, dataLoaded, dataLoading, loadInitialData]);

  // Afficher un loader pendant le chargement de l'authentification ou des données
  if (authLoading || (user && !dataLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Vérification de l\'authentification...' : 'Chargement des données...'}
          </p>
          {user && dataLoading && (
            <p className="mt-2 text-sm text-gray-500">
              Récupération des données...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, afficher la page d'accueil
  if (!user) {
    return <HomePage />;
  }

  // Si l'utilisateur est connecté et les données sont chargées, afficher l'application
  return <AppWithContext />;
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AuthContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;

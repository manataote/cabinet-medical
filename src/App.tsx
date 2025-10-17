import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserService } from './services/userService';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import CabinetSelection from './components/CabinetSelection';
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
  const [hasCabinet, setHasCabinet] = useState<boolean | null>(null);
  const [checkingCabinet, setCheckingCabinet] = useState(true);
  const [cabinetChecked, setCabinetChecked] = useState(false);
  const dataLoadingStarted = useRef(false); // Pour éviter les chargements multiples

  // Vérifier si l'utilisateur a un cabinet assigné (une seule fois)
  useEffect(() => {
    const checkUserCabinet = async () => {
      if (user && !cabinetChecked) {
        setCheckingCabinet(true);
        const hasAssignedCabinet = await UserService.checkUserHasCabinet(user.id);
        setHasCabinet(hasAssignedCabinet);
        setCheckingCabinet(false);
        setCabinetChecked(true);
      } else if (!user) {
        setHasCabinet(null);
        setCheckingCabinet(false);
        setCabinetChecked(false);
        dataLoadingStarted.current = false;
      }
    };

    checkUserCabinet();
    // Utiliser user?.id au lieu de user pour éviter les re-renders lors du rafraîchissement du token
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, cabinetChecked]);

  // Charger les données une fois que l'utilisateur est connecté ET a un cabinet
  useEffect(() => {
    if (user && hasCabinet && !dataLoaded && !dataLoading && !dataLoadingStarted.current) {
      console.log('🔄 Début du chargement des données Supabase...');
      dataLoadingStarted.current = true; // Marquer comme commencé
      loadInitialData().then(() => {
        console.log('✅ Données Supabase chargées avec succès');
        setDataLoaded(true);
      }).catch((error: any) => {
        console.error('❌ Erreur lors du chargement des données:', error);
        setDataLoaded(true); // Marquer comme chargé même en cas d'erreur
      });
    }
    // Utiliser user?.id au lieu de user pour éviter les re-renders lors du rafraîchissement du token
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hasCabinet, dataLoaded, dataLoading]);

  // Callback après sélection du cabinet
  const handleCabinetSelected = () => {
    setHasCabinet(true);
    setDataLoaded(false); // Forcer le rechargement des données avec le nouveau cabinet
    setCabinetChecked(true);
    dataLoadingStarted.current = false; // Permettre le rechargement après sélection
  };

  // Afficher un loader pendant le chargement de l'authentification ou de la vérification du cabinet
  if (authLoading || checkingCabinet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Vérification de l\'authentification...' : 'Vérification du profil...'}
          </p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, afficher la page d'accueil
  if (!user) {
    return <HomePage />;
  }

  // Si l'utilisateur est connecté mais n'a pas de cabinet, afficher la sélection de cabinet
  if (hasCabinet === false) {
    return <CabinetSelection onCabinetSelected={handleCabinetSelected} />;
  }

  // Afficher un loader pendant le chargement des données
  if (user && hasCabinet && !dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
          {dataLoading && (
            <p className="mt-2 text-sm text-gray-500">
              Récupération des données...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Si l'utilisateur est connecté, a un cabinet et les données sont chargées, afficher l'application
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

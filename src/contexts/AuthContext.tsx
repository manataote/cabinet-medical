import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'admin' | 'medecin' | 'secretaire', nom?: string, prenom?: string) => Promise<void>;
  signOut: () => Promise<void>;
  forceSignOut: () => void;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier la session au chargement
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erreur Supabase:', error);
          setError('Erreur de connexion Supabase');
          setUser(null);
        } else if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de la session:', err);
        setError('Erreur lors de la vérification de la session');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setError(null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setError(null);
          // Nettoyer les données locales lors de la déconnexion
          localStorage.removeItem('selectedPatientForFeuille');
        } else if (event === 'TOKEN_REFRESHED') {
          // Mettre à jour l'utilisateur si nécessaire
          if (session?.user) {
            setUser(session.user);
          }
        }
        
        // Ne pas forcer setLoading(false) ici pour éviter les conflits
        // avec les opérations de connexion/déconnexion
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // L'utilisateur sera mis à jour via onAuthStateChange
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: 'admin' | 'medecin' | 'secretaire', nom?: string, prenom?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Créer l'enregistrement utilisateur dans la base de données SANS cabinet_id
        // L'utilisateur devra choisir son cabinet à la première connexion
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            nom: nom || '',
            prenom: prenom || '',
            role,
            cabinet_id: null, // Pas de cabinet assigné à l'inscription
          });

        if (insertError) {
          console.error('Erreur lors de la création du profil utilisateur:', insertError);
          throw insertError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      // Nettoyer les données locales si nécessaire
      localStorage.removeItem('selectedPatientForFeuille');
      
      // Créer un timeout pour éviter un chargement infini
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout de déconnexion')), 10000); // 10 secondes
      });

      // Appeler signOut avec timeout
      const signOutPromise = supabase.auth.signOut();
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('Erreur lors de la déconnexion Supabase:', error);
        // Même en cas d'erreur, on force la déconnexion locale
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(null);
    } catch (err: any) {
      console.error('Erreur lors de la déconnexion:', err);
      // En cas d'erreur ou de timeout, on force la déconnexion locale
      setUser(null);
      setError(err.message || 'Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };

  const forceSignOut = () => {
    // Déconnexion forcée sans appel à Supabase
    console.log('Déconnexion forcée');
    setUser(null);
    setLoading(false);
    setError(null);
    
    // Nettoyer les données locales
    localStorage.removeItem('selectedPatientForFeuille');
    
    // Rediriger vers la page de connexion
    window.location.href = '/';
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réinitialisation du mot de passe');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    forceSignOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

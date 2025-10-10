import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './supabase-config';

// Configuration Supabase avec options explicites
const supabaseUrl = SUPABASE_CONFIG.url;
const supabaseAnonKey = SUPABASE_CONFIG.anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Désactiver les logs de debug pour éviter le spam
    debug: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'cabinet-medical-app'
    }
  },
  // Configuration de timeout pour les requêtes
  db: {
    schema: 'public'
  }
});

// Types pour la base de données
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'medecin' | 'secretaire';
          cabinet_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: 'admin' | 'medecin' | 'secretaire';
          cabinet_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'medecin' | 'secretaire';
          cabinet_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      cabinets: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      patients: {
        Row: {
          id: string;
          nom: string;
          prenom: string;
          date_naissance: string;
          telephone: string;
          cabinet_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          prenom: string;
          date_naissance: string;
          telephone: string;
          cabinet_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          prenom?: string;
          date_naissance?: string;
          telephone?: string;
          cabinet_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Types d'authentification
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'medecin' | 'secretaire';
  cabinet_id: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Approche hybride : Supabase pour l'auth, fetch direct pour l'API

const SUPABASE_URL = 'https://qxcoqqwedvqhsxhkkuda.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU';

// Fonction pour obtenir le token d'authentification
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const { supabase } = await import('../config/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Erreur récupération token:', error);
    return null;
  }
};

// Fonction générique pour les appels API avec fetch direct
export const supabaseFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: any; error: any }> => {
  try {
    const token = await getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      ...options.headers,
    };
    
    // Ajouter le token d'auth si disponible
    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: {
          message: `HTTP ${response.status}: ${response.statusText}`,
          code: response.status,
          details: errorData
        }
      };
    }
    
    const data = await response.json().catch(() => null);
    return { data, error: null };
    
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'Erreur réseau',
        code: 'NETWORK_ERROR'
      }
    };
  }
};

// Fonctions spécifiques pour les tables
export const hybridSupabase = {
  // Authentification (utilise le client Supabase)
  auth: {
    signIn: async (email: string, password: string) => {
      try {
        const { supabase } = await import('../config/supabase');
        return await supabase.auth.signInWithPassword({ email, password });
      } catch (error) {
        return { data: null, error };
      }
    },
    
    signOut: async () => {
      try {
        const { supabase } = await import('../config/supabase');
        return await supabase.auth.signOut();
      } catch (error) {
        return { data: null, error };
      }
    },
    
    getSession: async () => {
      try {
        const { supabase } = await import('../config/supabase');
        return await supabase.auth.getSession();
      } catch (error) {
        return { data: { session: null }, error };
      }
    },
    
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      try {
        const supabasePromise = import('../config/supabase');
        return supabasePromise.then((client: any) => client.supabase.auth.onAuthStateChange(callback));
      } catch (error) {
        console.error('Erreur onAuthStateChange:', error);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    }
  },
  
  // Tables (utilise fetch direct)
  from: (table: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: any) => ({
        limit: (count: number) => supabaseFetch(`/${table}?select=${columns}&${column}=eq.${value}&limit=${count}`),
        execute: () => supabaseFetch(`/${table}?select=${columns}&${column}=eq.${value}`)
      }),
      limit: (count: number) => ({
        execute: () => supabaseFetch(`/${table}?select=${columns}&limit=${count}`)
      }),
      execute: () => supabaseFetch(`/${table}?select=${columns}`)
    }),
    
    insert: (data: any) => ({
      execute: () => supabaseFetch(`/${table}`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    }),
    
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        execute: () => supabaseFetch(`/${table}?${column}=eq.${value}`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        })
      })
    }),
    
    delete: () => ({
      eq: (column: string, value: any) => ({
        execute: () => supabaseFetch(`/${table}?${column}=eq.${value}`, {
          method: 'DELETE'
        })
      })
    })
  })
};

// Test de l'approche hybride
export const testHybridApproach = async () => {
  const results: string[] = [];
  
  try {
    results.push('🔍 === TEST APPROCHE HYBRIDE ===');
    
    // Test 1: Authentification avec Supabase
    results.push('1️⃣ Test auth avec Supabase...');
    try {
      const authResult = await hybridSupabase.auth.signIn('admin@cabinet.local', 'test');
      
      if (authResult.error) {
        results.push(`❌ Erreur auth: ${(authResult.error as any).message || 'Erreur inconnue'}`);
      } else if (authResult.data?.user) {
        results.push('✅ Auth hybride fonctionne !');
        results.push(`📧 Utilisateur: ${authResult.data.user.email}`);
      }
    } catch (err: any) {
      results.push(`❌ Erreur auth: ${err.message}`);
    }
    
    // Test 2: Appels API avec fetch direct
    results.push('2️⃣ Test API avec fetch direct...');
    try {
      const apiResult = await hybridSupabase.from('cabinets').select().limit(1).execute();
      
      if (apiResult.error) {
        results.push(`❌ Erreur API: ${apiResult.error.message}`);
      } else {
        results.push(`✅ API hybride fonctionne ! (${apiResult.data?.length || 0} enregistrements)`);
      }
    } catch (err: any) {
      results.push(`❌ Erreur API: ${err.message}`);
    }
    
    // Test 3: Test de session
    results.push('3️⃣ Test session...');
    try {
      const sessionResult = await hybridSupabase.auth.getSession();
      
      if (sessionResult.error) {
        results.push(`❌ Erreur session: ${(sessionResult.error as any).message || 'Erreur inconnue'}`);
      } else if (sessionResult.data?.session) {
        results.push('✅ Session hybride active !');
      } else {
        results.push('ℹ️ Aucune session active');
      }
    } catch (err: any) {
      results.push(`❌ Erreur session: ${err.message}`);
    }
    
    results.push('🏁 === TEST HYBRIDE TERMINÉ ===');
    
  } catch (err: any) {
    results.push(`❌ Erreur générale: ${err.message}`);
  }
  
  return results;
};

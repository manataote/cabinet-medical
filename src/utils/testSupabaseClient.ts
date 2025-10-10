export const testSupabaseClient = async () => {
  const results: string[] = [];
  
  try {
    results.push('🔍 === TEST CLIENT SUPABASE ===');
    
    // Test 1: Import et initialisation du client
    results.push('1️⃣ Test import client Supabase...');
    try {
      const { supabase } = await import('../config/supabase');
      results.push('✅ Client Supabase importé');
      
      // Vérifier la configuration
      results.push('2️⃣ Vérification configuration...');
      const url = (supabase as any).supabaseUrl;
      const key = (supabase as any).supabaseKey;
      
      if (url) {
        results.push(`📋 URL: ${url}`);
      } else {
        results.push('❌ URL non trouvée');
      }
      
      if (key) {
        results.push(`📋 Clé: ${key.substring(0, 20)}...`);
      } else {
        results.push('❌ Clé non trouvée');
      }
      
    } catch (err: any) {
      results.push(`❌ Erreur import: ${err.message}`);
      return results;
    }
    
    // Test 2: Test direct avec le client
    results.push('3️⃣ Test direct avec le client...');
    try {
      const { supabase } = await import('../config/supabase');
      
      // Test avec timeout court
      const testPromise = supabase
        .from('cabinets')
        .select('id')
        .limit(1);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout client 3s')), 3000)
      );
      
      const { data, error } = await Promise.race([testPromise, timeoutPromise]) as any;
      
      if (error) {
        results.push(`❌ Erreur client: ${error.message}`);
        results.push(`📋 Code: ${error.code || 'N/A'}`);
      } else {
        results.push(`✅ Client fonctionne (${data?.length || 0} enregistrements)`);
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        results.push(`⏰ Timeout client après 3 secondes`);
        results.push('💡 PROBLÈME: Le client Supabase ne répond pas');
        results.push('💡 SOLUTION: Problème de configuration du client');
      } else {
        results.push(`❌ Erreur client: ${err.message}`);
      }
    }
    
    // Test 3: Test avec fetch direct (comparaison)
    results.push('4️⃣ Test avec fetch direct (comparaison)...');
    try {
      const fetchTest = await Promise.race([
        fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co/rest/v1/cabinets?select=id&limit=1', {
          method: 'GET',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU',
            'Accept': 'application/json'
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout fetch')), 3000))
      ]);
      
      results.push(`📊 Fetch Status: ${(fetchTest as Response).status}`);
      if ((fetchTest as Response).status === 200) {
        results.push('✅ Fetch direct fonctionne');
        results.push('💡 CONCLUSION: Le problème vient du client Supabase, pas de l\'API');
      } else {
        results.push(`❌ Fetch direct KO: ${(fetchTest as Response).status}`);
      }
    } catch (err: any) {
      results.push(`❌ Fetch direct KO: ${err.message}`);
    }
    
    // Test 4: Test d'authentification avec le client
    results.push('5️⃣ Test auth avec le client...');
    try {
      const { supabase } = await import('../config/supabase');
      
      const authPromise = supabase.auth.signInWithPassword({
        email: 'admin@cabinet.local',
        password: 'test',
      });
      
      const authTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout auth client 5s')), 5000)
      );
      
      const { data, error } = await Promise.race([authPromise, authTimeout]) as any;
      
      if (error) {
        results.push(`❌ Erreur auth client: ${error.message}`);
        results.push(`📋 Code: ${error.code || 'N/A'}`);
      } else if (data.user) {
        results.push('✅ Auth client fonctionne !');
        results.push(`📧 Utilisateur: ${data.user.email}`);
        results.push('🎉 Connexion réussie !');
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        results.push(`⏰ Timeout auth client après 5 secondes`);
        results.push('💡 PROBLÈME: Le client auth ne répond pas');
      } else {
        results.push(`❌ Erreur auth client: ${err.message}`);
      }
    }
    
    // Test 5: Vérifier la version du client
    results.push('6️⃣ Vérification version client...');
    try {
      const { supabase } = await import('../config/supabase');
      const version = (supabase as any).version || 'Inconnue';
      results.push(`📋 Version client: ${version}`);
      
      // Vérifier les méthodes disponibles
      const methods = Object.getOwnPropertyNames(supabase).filter(name => 
        typeof (supabase as any)[name] === 'function'
      );
      results.push(`📋 Méthodes disponibles: ${methods.length}`);
      
    } catch (err: any) {
      results.push(`❌ Erreur vérification version: ${err.message}`);
    }
    
    results.push('🏁 === TEST TERMINÉ ===');
    
  } catch (err: any) {
    results.push(`❌ Erreur générale: ${err.message}`);
  }
  
  return results;
};


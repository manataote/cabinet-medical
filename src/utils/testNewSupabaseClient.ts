export const testNewSupabaseClient = async () => {
  const results: string[] = [];
  
  try {
    results.push('🔍 === TEST NOUVEAU CLIENT SUPABASE ===');
    
    // Test 1: Import du nouveau client
    results.push('1️⃣ Import nouveau client...');
    try {
      const { supabase } = await import('../config/supabase');
      results.push('✅ Nouveau client importé');
      
      // Vérifier la configuration
      const url = (supabase as any).supabaseUrl;
      const key = (supabase as any).supabaseKey;
      
      results.push(`📋 URL: ${url}`);
      results.push(`📋 Clé: ${key?.substring(0, 20)}...`);
      
    } catch (err: any) {
      results.push(`❌ Erreur import: ${err.message}`);
      return results;
    }
    
    // Test 2: Test rapide avec timeout court
    results.push('2️⃣ Test rapide nouveau client...');
    try {
      const { supabase } = await import('../config/supabase');
      
      const testPromise = supabase
        .from('cabinets')
        .select('id')
        .limit(1);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout 2s')), 2000)
      );
      
      const { data, error } = await Promise.race([testPromise, timeoutPromise]) as any;
      
      if (error) {
        results.push(`❌ Erreur: ${error.message}`);
      } else {
        results.push(`✅ Nouveau client fonctionne ! (${data?.length || 0} enregistrements)`);
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        results.push(`⏰ Timeout après 2 secondes`);
        results.push('💡 Le nouveau client a encore des problèmes');
      } else {
        results.push(`❌ Erreur: ${err.message}`);
      }
    }
    
    // Test 3: Test d'authentification
    results.push('3️⃣ Test auth nouveau client...');
    try {
      const { supabase } = await import('../config/supabase');
      
      const authPromise = supabase.auth.signInWithPassword({
        email: 'admin@cabinet.local',
        password: 'test',
      });
      
      const authTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout auth 3s')), 3000)
      );
      
      const { data, error } = await Promise.race([authPromise, authTimeout]) as any;
      
      if (error) {
        results.push(`❌ Erreur auth: ${error.message}`);
        results.push(`📋 Code: ${error.code || 'N/A'}`);
      } else if (data.user) {
        results.push('✅ Auth nouveau client fonctionne !');
        results.push(`📧 Utilisateur: ${data.user.email}`);
        results.push('🎉 CONNEXION RÉUSSIE !');
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        results.push(`⏰ Timeout auth après 3 secondes`);
      } else {
        results.push(`❌ Erreur auth: ${err.message}`);
      }
    }
    
    // Test 4: Vérifier les méthodes disponibles
    results.push('4️⃣ Vérification méthodes...');
    try {
      const { supabase } = await import('../config/supabase');
      
      const methods = Object.getOwnPropertyNames(supabase).filter(name => 
        typeof (supabase as any)[name] === 'function'
      );
      
      results.push(`📋 Méthodes disponibles: ${methods.length}`);
      if (methods.length > 10) {
        results.push('✅ Client bien configuré');
      } else {
        results.push('❌ Client mal configuré');
      }
      
      // Vérifier les propriétés importantes
      const hasAuth = 'auth' in supabase;
      const hasFrom = 'from' in supabase;
      
      results.push(`📋 Auth disponible: ${hasAuth ? '✅' : '❌'}`);
      results.push(`📋 From disponible: ${hasFrom ? '✅' : '❌'}`);
      
    } catch (err: any) {
      results.push(`❌ Erreur vérification: ${err.message}`);
    }
    
    results.push('🏁 === TEST TERMINÉ ===');
    
  } catch (err: any) {
    results.push(`❌ Erreur générale: ${err.message}`);
  }
  
  return results;
};


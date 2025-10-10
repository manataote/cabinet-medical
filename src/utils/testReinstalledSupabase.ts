export const testReinstalledSupabase = async () => {
  const results: string[] = [];
  
  try {
    results.push('🔍 === TEST SUPABASE RÉINSTALLÉ ===');
    
    // Test 1: Import du client réinstallé
    results.push('1️⃣ Test import client réinstallé...');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      results.push('✅ Import createClient OK');
      
      // Créer un client avec la configuration
      const supabaseUrl = 'https://qxcoqqwedvqhsxhkkuda.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      results.push('✅ Client créé avec succès');
      
      // Vérifier les propriétés
      const hasAuth = 'auth' in supabase;
      const hasFrom = 'from' in supabase;
      const hasRpc = 'rpc' in supabase;
      
      results.push(`📋 Auth: ${hasAuth ? '✅' : '❌'}`);
      results.push(`📋 From: ${hasFrom ? '✅' : '❌'}`);
      results.push(`📋 RPC: ${hasRpc ? '✅' : '❌'}`);
      
      if (hasAuth && hasFrom && hasRpc) {
        results.push('✅ Client bien configuré');
      } else {
        results.push('❌ Client mal configuré');
      }
      
    } catch (err: any) {
      results.push(`❌ Erreur import: ${err.message}`);
      return results;
    }
    
    // Test 2: Test rapide avec le client réinstallé
    results.push('2️⃣ Test rapide client réinstallé...');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(
        'https://qxcoqqwedvqhsxhkkuda.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU'
      );
      
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
        results.push(`📋 Code: ${error.code || 'N/A'}`);
      } else {
        results.push(`✅ Client réinstallé fonctionne ! (${data?.length || 0} enregistrements)`);
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        results.push(`⏰ Timeout après 2 secondes`);
        results.push('💡 Le client réinstallé a encore des problèmes');
      } else {
        results.push(`❌ Erreur: ${err.message}`);
      }
    }
    
    // Test 3: Test d'authentification
    results.push('3️⃣ Test auth client réinstallé...');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(
        'https://qxcoqqwedvqhsxhkkuda.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU'
      );
      
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
        
        if (error.message.includes('Invalid login credentials')) {
          results.push('💡 SOLUTION: Vérifiez les identifiants');
        } else if (error.message.includes('Email not confirmed')) {
          results.push('💡 SOLUTION: Vérifiez votre email');
        }
      } else if (data.user) {
        results.push('✅ Auth client réinstallé fonctionne !');
        results.push(`📧 Utilisateur: ${data.user.email}`);
        results.push('🎉 CONNEXION RÉUSSIE !');
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        results.push(`⏰ Timeout auth après 3 secondes`);
        results.push('💡 Le client auth a encore des problèmes');
      } else {
        results.push(`❌ Erreur auth: ${err.message}`);
      }
    }
    
    // Test 4: Vérifier la version
    results.push('4️⃣ Vérification version...');
    try {
      const packageInfo = await import('@supabase/supabase-js/package.json');
      results.push(`📋 Version: ${packageInfo.version || 'Inconnue'}`);
    } catch (err: any) {
      results.push(`❌ Erreur version: ${err.message}`);
    }
    
    results.push('🏁 === TEST TERMINÉ ===');
    
  } catch (err: any) {
    results.push(`❌ Erreur générale: ${err.message}`);
  }
  
  return results;
};


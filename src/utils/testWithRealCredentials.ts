export const testWithRealCredentials = async () => {
  const results: string[] = [];
  
  try {
    results.push('🔍 === TEST AVEC IDENTIFIANTS RÉELS ===');
    
    // Import dynamique avec timeout
    results.push('1️⃣ Import client Supabase...');
    const importPromise = import('../config/supabase');
    const importTimeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout import')), 3000)
    );
    
    const { supabase } = await Promise.race([importPromise, importTimeout]) as { supabase: any };
    results.push('✅ Client Supabase importé');
    
    // Test 1: Connexion avec les vrais identifiants
    results.push('2️⃣ Test connexion avec admin@cabinet.local...');
    try {
      const loginPromise = supabase.auth.signInWithPassword({
        email: 'admin@cabinet.local',
        password: 'test',
      });
      
      const loginTimeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout connexion 10s')), 10000)
      );
      
      const { data, error } = await Promise.race([loginPromise, loginTimeout]) as any;
      
      if (error) {
        results.push(`❌ Erreur connexion: ${error.message}`);
        results.push(`📋 Code: ${error.code || 'N/A'}`);
        
        // Analyser le type d'erreur
        if (error.message.includes('Invalid login credentials')) {
          results.push('💡 PROBLÈME: Identifiants incorrects');
          results.push('💡 SOLUTION: Vérifiez email/mot de passe');
        } else if (error.message.includes('Email not confirmed')) {
          results.push('💡 PROBLÈME: Email non confirmé');
          results.push('💡 SOLUTION: Vérifiez votre boîte email');
        } else if (error.message.includes('Too many requests')) {
          results.push('💡 PROBLÈME: Trop de tentatives');
          results.push('💡 SOLUTION: Attendez quelques minutes');
        }
      } else if (data.user) {
        results.push('✅ Connexion réussie !');
        results.push(`📧 Utilisateur: ${data.user.email}`);
        results.push(`🆔 ID: ${data.user.id}`);
        results.push('🎉 Vous pouvez maintenant utiliser l\'application !');
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        results.push(`⏰ Timeout connexion après 10 secondes`);
        results.push('💡 PROBLÈME: Supabase ne répond pas');
        results.push('💡 SOLUTION: Vérifiez la connexion internet');
      } else {
        results.push(`❌ Erreur connexion: ${err.message}`);
      }
    }
    
    // Test 2: Test d'accès aux tables après connexion
    results.push('3️⃣ Test accès tables après connexion...');
    try {
      const tablesPromise = supabase
        .from('cabinets')
        .select('*')
        .limit(1);
      
      const tablesTimeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout tables 5s')), 5000)
      );
      
      const { data, error } = await Promise.race([tablesPromise, tablesTimeout]) as any;
      
      if (error) {
        results.push(`❌ Erreur tables: ${error.message}`);
        results.push(`📋 Code: ${error.code || 'N/A'}`);
      } else {
        results.push(`✅ Tables accessibles (${data?.length || 0} enregistrements)`);
        if (data && data.length > 0) {
          results.push(`📋 Premier cabinet: ${data[0].name}`);
        }
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        results.push(`⏰ Timeout tables après 5 secondes`);
      } else {
        results.push(`❌ Erreur tables: ${err.message}`);
      }
    }
    
    // Test 3: Test de session
    results.push('4️⃣ Test session...');
    try {
      const sessionPromise = supabase.auth.getSession();
      const sessionTimeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout session 3s')), 3000)
      );
      
      const { data: { session }, error } = await Promise.race([sessionPromise, sessionTimeout]) as any;
      
      if (error) {
        results.push(`❌ Erreur session: ${error.message}`);
      } else if (session) {
        results.push(`✅ Session active: ${session.user.email}`);
      } else {
        results.push('ℹ️ Aucune session active');
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        results.push(`⏰ Timeout session après 3 secondes`);
      } else {
        results.push(`❌ Erreur session: ${err.message}`);
      }
    }
    
    results.push('🏁 === TEST TERMINÉ ===');
    
  } catch (err: any) {
    if (err.message.includes('Timeout')) {
      results.push(`⏰ Timeout général: ${err.message}`);
      results.push('💡 PROBLÈME: Supabase ne répond pas du tout');
      results.push('💡 SOLUTION: Vérifiez l\'URL et la clé API');
    } else {
      results.push(`❌ Erreur générale: ${err.message}`);
    }
  }
  
  return results;
};


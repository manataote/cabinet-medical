export const diagnoseTablePermissionsSimple = async () => {
  const results: string[] = [];
  
  try {
    results.push('🔍 === DIAGNOSTIC PERMISSIONS SIMPLE ===');
    
    // Import dynamique avec timeout
    results.push('1️⃣ Import client Supabase...');
    const importPromise = import('../config/supabase');
    const importTimeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout import')), 3000)
    );
    
    const { supabase } = await Promise.race([importPromise, importTimeout]) as { supabase: any };
    results.push('✅ Client Supabase importé');
    
    // Test 1: Test simple d'accès à la table cabinets
    results.push('2️⃣ Test accès table cabinets...');
    try {
      const testPromise = supabase
        .from('cabinets')
        .select('id')
        .limit(1);
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout 5s')), 5000)
      );
      
      const { data, error } = await Promise.race([testPromise, timeoutPromise]) as any;
      
      if (error) {
        results.push(`❌ Erreur cabinets: ${error.message}`);
        results.push(`📋 Code: ${error.code || 'N/A'}`);
        
        // Analyser le type d'erreur
        if (error.message.includes('schema cache')) {
          results.push('💡 PROBLÈME: Table non trouvée dans le cache du schéma');
          results.push('💡 SOLUTION: Vérifiez que la table existe dans le schéma public');
        } else if (error.message.includes('permission')) {
          results.push('💡 PROBLÈME: Permissions insuffisantes');
          results.push('💡 SOLUTION: Vérifiez les politiques RLS');
        } else if (error.message.includes('RLS')) {
          results.push('💡 PROBLÈME: Row Level Security bloque l\'accès');
          results.push('💡 SOLUTION: Désactivez RLS ou créez des politiques');
        }
      } else {
        results.push(`✅ Table cabinets accessible (${data?.length || 0} enregistrements)`);
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        results.push(`⏰ Timeout après 5 secondes`);
        results.push('💡 PROBLÈME: Supabase ne répond pas');
        results.push('💡 SOLUTION: Vérifiez la connexion réseau');
      } else {
        results.push(`❌ Erreur cabinets: ${err.message}`);
      }
    }
    
    // Test 2: Test d'authentification simple
    results.push('3️⃣ Test authentification...');
    try {
      const authPromise = supabase.auth.signUp({
        email: 'test-simple@example.com',
        password: 'password123',
      });
      
      const authTimeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout auth 5s')), 5000)
      );
      
      const { data, error } = await Promise.race([authPromise, authTimeout]) as any;
      
      if (error) {
        if (error.message.includes('already registered')) {
          results.push('✅ Auth fonctionne (utilisateur existe déjà)');
          results.push('📧 Email: test-simple@example.com');
          results.push('🔑 Mot de passe: password123');
          results.push('🎉 Vous pouvez vous connecter !');
        } else {
          results.push(`❌ Erreur auth: ${error.message}`);
        }
      } else if (data.user) {
        results.push('✅ Utilisateur créé avec succès');
        results.push('📧 Email: test-simple@example.com');
        results.push('🔑 Mot de passe: password123');
        results.push('🎉 Vous pouvez vous connecter !');
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        results.push(`⏰ Timeout auth après 5 secondes`);
        results.push('💡 PROBLÈME: Service auth ne répond pas');
      } else {
        results.push(`❌ Erreur auth: ${err.message}`);
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
        results.push(`✅ Utilisateur connecté: ${session.user.email}`);
      } else {
        results.push('ℹ️ Aucun utilisateur connecté (anonyme)');
      }
    } catch (err: any) {
      if (err.message.includes('Timeout')) {
        results.push(`⏰ Timeout session après 3 secondes`);
      } else {
        results.push(`❌ Erreur session: ${err.message}`);
      }
    }
    
    results.push('🏁 === DIAGNOSTIC TERMINÉ ===');
    
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

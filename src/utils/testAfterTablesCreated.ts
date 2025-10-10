export const testAfterTablesCreated = async () => {
  const results: string[] = [];
  
  try {
    results.push('🎉 === TEST APRÈS CRÉATION TABLES ===');
    
    // Import dynamique
    const { supabase } = await import('../config/supabase');
    
    // Test 1: Vérifier la table cabinets
    results.push('1️⃣ Test table cabinets...');
    try {
      const { data, error } = await supabase
        .from('cabinets')
        .select('*')
        .limit(1);
      
      if (error) {
        results.push(`❌ Erreur cabinets: ${error.message}`);
      } else {
        results.push(`✅ Table cabinets accessible (${data?.length || 0} enregistrements)`);
        if (data && data.length > 0) {
          results.push(`📋 Cabinet trouvé: ${data[0].name}`);
        }
      }
    } catch (err: any) {
      results.push(`❌ Erreur cabinets: ${err.message}`);
    }
    
    // Test 2: Vérifier la table users
    results.push('2️⃣ Test table users...');
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (error) {
        results.push(`❌ Erreur users: ${error.message}`);
      } else {
        results.push(`✅ Table users accessible (${data?.length || 0} enregistrements)`);
      }
    } catch (err: any) {
      results.push(`❌ Erreur users: ${err.message}`);
    }
    
    // Test 3: Test d'authentification
    results.push('3️⃣ Test authentification...');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      
      if (error) {
        results.push(`✅ Auth fonctionne (erreur attendue): ${error.message}`);
      } else {
        results.push('⚠️ Auth inattendu réussi');
      }
    } catch (err: any) {
      results.push(`❌ Erreur auth: ${err.message}`);
    }
    
    // Test 4: Créer un utilisateur de test si possible
    results.push('4️⃣ Test création utilisateur...');
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'password123',
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          results.push('✅ Utilisateur test existe déjà');
          results.push('📧 Email: test@example.com');
          results.push('🔑 Mot de passe: password123');
          results.push('🎉 Vous pouvez maintenant vous connecter !');
        } else {
          results.push(`❌ Erreur création: ${error.message}`);
        }
      } else if (data.user) {
        results.push('✅ Utilisateur test créé !');
        results.push('📧 Email: test@example.com');
        results.push('🔑 Mot de passe: password123');
        results.push('🎉 Vous pouvez maintenant vous connecter !');
      }
    } catch (err: any) {
      results.push(`❌ Erreur création: ${err.message}`);
    }
    
    results.push('🏁 === TEST TERMINÉ ===');
    
  } catch (err: any) {
    results.push(`❌ Erreur générale: ${err.message}`);
  }
  
  return results;
};


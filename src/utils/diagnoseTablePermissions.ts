export const diagnoseTablePermissions = async () => {
  const results: string[] = [];
  
  try {
    results.push('🔍 === DIAGNOSTIC PERMISSIONS TABLES ===');
    
    // Import dynamique
    const { supabase } = await import('../config/supabase');
    
    // Test 1: Lister toutes les tables disponibles
    results.push('1️⃣ Test listage des tables...');
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (error) {
        results.push(`❌ Erreur listage: ${error.message}`);
      } else {
        results.push(`✅ Tables trouvées: ${data?.length || 0}`);
        if (data && data.length > 0) {
          data.forEach(table => {
            results.push(`📋 - ${table.table_name}`);
          });
        }
      }
    } catch (err: any) {
      results.push(`❌ Erreur listage: ${err.message}`);
    }
    
    // Test 2: Test d'accès direct à la table cabinets
    results.push('2️⃣ Test accès direct table cabinets...');
    try {
      const { data, error } = await supabase
        .from('cabinets')
        .select('*');
      
      if (error) {
        results.push(`❌ Erreur cabinets: ${error.message}`);
        results.push(`📋 Code: ${error.code || 'N/A'}`);
        results.push(`📋 Détails: ${error.details || 'N/A'}`);
        results.push(`📋 Hint: ${error.hint || 'N/A'}`);
      } else {
        results.push(`✅ Table cabinets accessible (${data?.length || 0} enregistrements)`);
        if (data && data.length > 0) {
          results.push(`📋 Premier cabinet: ${data[0].name}`);
        }
      }
    } catch (err: any) {
      results.push(`❌ Erreur cabinets: ${err.message}`);
    }
    
    // Test 3: Test avec RLS désactivé (si possible)
    results.push('3️⃣ Test avec différentes requêtes...');
    try {
      // Test avec select count
      const { data: countData, error: countError } = await supabase
        .from('cabinets')
        .select('id', { count: 'exact' });
      
      if (countError) {
        results.push(`❌ Erreur count: ${countError.message}`);
      } else {
        results.push(`✅ Count OK: ${countData?.length || 0} cabinets`);
      }
    } catch (err: any) {
      results.push(`❌ Erreur count: ${err.message}`);
    }
    
    // Test 4: Test d'insertion (pour vérifier les permissions)
    results.push('4️⃣ Test permissions d\'écriture...');
    try {
      const { data, error } = await supabase
        .from('cabinets')
        .insert({ name: 'Test Cabinet' })
        .select();
      
      if (error) {
        results.push(`❌ Erreur insertion: ${error.message}`);
        results.push(`📋 Code: ${error.code || 'N/A'}`);
      } else {
        results.push('✅ Insertion OK - permissions d\'écriture fonctionnent');
        
        // Nettoyer le test
        if (data && data.length > 0) {
          await supabase
            .from('cabinets')
            .delete()
            .eq('id', data[0].id);
          results.push('🧹 Test nettoyé');
        }
      }
    } catch (err: any) {
      results.push(`❌ Erreur insertion: ${err.message}`);
    }
    
    // Test 5: Vérifier la session utilisateur
    results.push('5️⃣ Test session utilisateur...');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        results.push(`❌ Erreur session: ${error.message}`);
      } else if (session) {
        results.push(`✅ Utilisateur connecté: ${session.user.email}`);
      } else {
        results.push('ℹ️ Aucun utilisateur connecté (anonyme)');
      }
    } catch (err: any) {
      results.push(`❌ Erreur session: ${err.message}`);
    }
    
    // Test 6: Test avec authentification
    results.push('6️⃣ Test avec authentification...');
    try {
      // Essayer de créer un utilisateur temporaire
      const { data, error } = await supabase.auth.signUp({
        email: 'temp-test@example.com',
        password: 'temppassword123',
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          results.push('✅ Auth fonctionne (utilisateur existe déjà)');
          
          // Essayer de se connecter
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'temp-test@example.com',
            password: 'temppassword123',
          });
          
          if (loginError) {
            results.push(`❌ Erreur connexion: ${loginError.message}`);
          } else {
            results.push('✅ Connexion OK');
            
            // Tester l'accès aux tables avec authentification
            const { data: authData, error: authError } = await supabase
              .from('cabinets')
              .select('*');
            
            if (authError) {
              results.push(`❌ Erreur cabinets auth: ${authError.message}`);
            } else {
              results.push(`✅ Cabinets accessible avec auth (${authData?.length || 0})`);
            }
          }
        } else {
          results.push(`❌ Erreur auth: ${error.message}`);
        }
      } else if (data.user) {
        results.push('✅ Utilisateur créé avec succès');
        results.push('📧 Email: temp-test@example.com');
        results.push('🔑 Mot de passe: temppassword123');
      }
    } catch (err: any) {
      results.push(`❌ Erreur auth: ${err.message}`);
    }
    
    results.push('🏁 === DIAGNOSTIC TERMINÉ ===');
    
  } catch (err: any) {
    results.push(`❌ Erreur générale: ${err.message}`);
  }
  
  return results;
};


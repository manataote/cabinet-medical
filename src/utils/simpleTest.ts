export const runSimpleSupabaseTest = async () => {
  const results: string[] = [];
  
  try {
    results.push('🧪 === TEST SIMPLE SUPABASE ===');
    
    // Import dynamique pour éviter les problèmes de blocage
    results.push('1️⃣ Import client Supabase...');
    
    try {
      const { supabase } = await import('../config/supabase');
      results.push('✅ Client Supabase importé');
      
      // Test simple avec timeout court
      results.push('2️⃣ Test connexion simple...');
      
      const testPromise = supabase
        .from('cabinets')
        .select('count')
        .limit(1);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout après 5 secondes')), 5000)
      );
      
      try {
        const { data, error } = await Promise.race([testPromise, timeoutPromise]) as any;
        
        if (error) {
          results.push(`❌ Erreur: ${error.message}`);
          results.push(`📋 Code: ${error.code || 'N/A'}`);
        } else {
          results.push('✅ Connexion Supabase réussie !');
          results.push('🎉 Vous pouvez maintenant vous connecter !');
        }
      } catch (timeoutErr: any) {
        results.push(`⏰ ${timeoutErr.message}`);
        results.push('🔧 Problème de connectivité avec Supabase');
      }
      
    } catch (importErr: any) {
      results.push(`❌ Erreur import: ${importErr.message}`);
    }
    
    results.push('🏁 === TEST TERMINÉ ===');
    
  } catch (err: any) {
    results.push(`❌ Erreur générale: ${err.message}`);
  }
  
  return results;
};

export const createSimpleTestUser = async () => {
  const results: string[] = [];
  
  try {
    results.push('👤 === CRÉATION UTILISATEUR SIMPLE ===');
    
    // Import dynamique
    const { supabase } = await import('../config/supabase');
    
    results.push('1️⃣ Test création utilisateur...');
    
    const createPromise = supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    });
    
    const createTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout création après 10 secondes')), 10000)
    );
    
    try {
      const { data, error } = await Promise.race([createPromise, createTimeoutPromise]) as any;
      
      if (error) {
        if (error.message.includes('already registered')) {
          results.push('✅ Utilisateur existe déjà !');
          results.push('📧 Email: test@example.com');
          results.push('🔑 Mot de passe: password123');
        } else {
          results.push(`❌ Erreur création: ${error.message}`);
        }
      } else if (data.user) {
        results.push('✅ Utilisateur créé avec succès !');
        results.push('📧 Email: test@example.com');
        results.push('🔑 Mot de passe: password123');
        
        // Créer le profil utilisateur
        results.push('2️⃣ Création profil utilisateur...');
        
        // Vérifier/créer le cabinet
        const { data: cabinetData } = await supabase
          .from('cabinets')
          .select('id')
          .eq('name', 'Cabinet Médical')
          .single();
        
        let cabinetId = cabinetData?.id;
        
        if (!cabinetId) {
          const { data: newCabinet } = await supabase
            .from('cabinets')
            .insert({ name: 'Cabinet Médical' })
            .select()
            .single();
          
          cabinetId = newCabinet?.id;
          results.push('✅ Cabinet créé');
        } else {
          results.push('✅ Cabinet existe');
        }
        
        // Créer le profil
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            role: 'medecin',
            cabinet_id: cabinetId,
          });
        
        if (profileError) {
          results.push(`⚠️ Erreur profil: ${profileError.message}`);
        } else {
          results.push('✅ Profil utilisateur créé');
        }
      }
      
    } catch (timeoutErr: any) {
      results.push(`⏰ ${timeoutErr.message}`);
    }
    
    results.push('🏁 === CRÉATION TERMINÉE ===');
    
  } catch (err: any) {
    results.push(`❌ Erreur générale: ${err.message}`);
  }
  
  return results;
};


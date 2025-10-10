export const testApiKeyAndPermissions = async () => {
  const results: string[] = [];
  
  try {
    results.push('🔍 === TEST CLÉ API ET PERMISSIONS ===');
    
    // Test 1: Vérifier la clé API complète
    results.push('1️⃣ Vérification clé API...');
    const fullApiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU';
    
    // Décoder le JWT pour voir les infos
    try {
      const payload = JSON.parse(atob(fullApiKey.split('.')[1]));
      results.push(`✅ Clé décodée avec succès`);
      results.push(`📋 Issuer: ${payload.iss}`);
      results.push(`📋 Ref: ${payload.ref}`);
      results.push(`📋 Role: ${payload.role}`);
      results.push(`📋 IAT: ${new Date(payload.iat * 1000).toLocaleString()}`);
      results.push(`📋 EXP: ${new Date(payload.exp * 1000).toLocaleString()}`);
      
      // Vérifier si la clé est expirée
      const now = Date.now() / 1000;
      if (payload.exp < now) {
        results.push(`❌ CLÉ EXPIRÉE ! Expire le: ${new Date(payload.exp * 1000).toLocaleString()}`);
      } else {
        results.push(`✅ Clé valide jusqu'au: ${new Date(payload.exp * 1000).toLocaleString()}`);
      }
    } catch (err: any) {
      results.push(`❌ Erreur décodage clé: ${err.message}`);
    }
    
    // Test 2: Test API REST avec différentes méthodes
    results.push('2️⃣ Test API REST avec différentes méthodes...');
    
    // Test HEAD
    try {
      const headTest = await Promise.race([
        fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': fullApiKey,
            'Authorization': `Bearer ${fullApiKey}`
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout HEAD')), 5000))
      ]);
      
      results.push(`📊 HEAD Status: ${(headTest as Response).status}`);
      if ((headTest as Response).status === 200) {
        results.push('✅ HEAD OK');
      } else {
        results.push(`❌ HEAD KO: ${(headTest as Response).status}`);
      }
    } catch (err: any) {
      results.push(`❌ HEAD KO: ${err.message}`);
    }
    
    // Test GET
    try {
      const getTest = await Promise.race([
        fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co/rest/v1/', {
          method: 'GET',
          headers: {
            'apikey': fullApiKey,
            'Authorization': `Bearer ${fullApiKey}`,
            'Accept': 'application/json'
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout GET')), 5000))
      ]);
      
      results.push(`📊 GET Status: ${(getTest as Response).status}`);
      if ((getTest as Response).status === 200) {
        results.push('✅ GET OK');
      } else {
        results.push(`❌ GET KO: ${(getTest as Response).status}`);
      }
    } catch (err: any) {
      results.push(`❌ GET KO: ${err.message}`);
    }
    
    // Test 3: Test spécifique sur la table cabinets
    results.push('3️⃣ Test spécifique table cabinets...');
    try {
      const tableTest = await Promise.race([
        fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co/rest/v1/cabinets', {
          method: 'GET',
          headers: {
            'apikey': fullApiKey,
            'Authorization': `Bearer ${fullApiKey}`,
            'Accept': 'application/json'
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout table')), 5000))
      ]);
      
      results.push(`📊 Table Status: ${(tableTest as Response).status}`);
      if ((tableTest as Response).status === 200) {
        results.push('✅ Table cabinets accessible');
      } else if ((tableTest as Response).status === 404) {
        results.push('❌ Table cabinets non trouvée (404)');
        results.push('💡 SOLUTION: Vérifiez que la table existe dans le schema public');
      } else if ((tableTest as Response).status === 401) {
        results.push('❌ Non autorisé (401)');
        results.push('💡 SOLUTION: Vérifiez la clé API et les permissions');
      } else if ((tableTest as Response).status === 403) {
        results.push('❌ Accès refusé (403)');
        results.push('💡 SOLUTION: Vérifiez les politiques RLS');
      } else {
        results.push(`❌ Erreur table: ${(tableTest as Response).status}`);
      }
    } catch (err: any) {
      results.push(`❌ Erreur table: ${err.message}`);
    }
    
    // Test 4: Test Auth API
    results.push('4️⃣ Test Auth API...');
    try {
      const authTest = await Promise.race([
        fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co/auth/v1/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': fullApiKey
          },
          body: JSON.stringify({
            email: 'test-api@example.com',
            password: 'testpassword123'
          })
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout auth')), 5000))
      ]);
      
      results.push(`📊 Auth Status: ${(authTest as Response).status}`);
      if ((authTest as Response).status === 200) {
        results.push('✅ Auth API fonctionne');
      } else if ((authTest as Response).status === 400) {
        results.push('❌ Auth API KO (400)');
        results.push('💡 SOLUTION: Vérifiez la configuration du projet');
      } else {
        results.push(`❌ Auth API KO: ${(authTest as Response).status}`);
      }
    } catch (err: any) {
      results.push(`❌ Auth API KO: ${err.message}`);
    }
    
    // Test 5: Vérifier les schemas exposés
    results.push('5️⃣ Test schemas exposés...');
    try {
      const schemaTest = await Promise.race([
        fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co/rest/v1/?select=*', {
          method: 'GET',
          headers: {
            'apikey': fullApiKey,
            'Authorization': `Bearer ${fullApiKey}`,
            'Accept': 'application/json'
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout schema')), 5000))
      ]);
      
      results.push(`📊 Schema Status: ${(schemaTest as Response).status}`);
      if ((schemaTest as Response).status === 200) {
        results.push('✅ Schema public accessible');
      } else {
        results.push(`❌ Schema public KO: ${(schemaTest as Response).status}`);
      }
    } catch (err: any) {
      results.push(`❌ Schema test KO: ${err.message}`);
    }
    
    results.push('🏁 === TEST TERMINÉ ===');
    
  } catch (err: any) {
    results.push(`❌ Erreur générale: ${err.message}`);
  }
  
  return results;
};


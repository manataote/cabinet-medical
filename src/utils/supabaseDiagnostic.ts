export const diagnoseSupabaseConnection = async () => {
  const results: string[] = [];
  
  try {
    results.push('🔍 === DIAGNOSTIC SUPABASE APPROFONDI ===');
    
    // Test 1: Vérification de l'URL directement
    results.push('1️⃣ Test URL directe...');
    try {
      const response = await fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      results.push('✅ URL répond (no-cors)');
    } catch (err: any) {
      results.push(`❌ URL ne répond pas: ${err.message}`);
    }
    
    // Test 2: Test avec CORS
    results.push('2️⃣ Test avec CORS...');
    try {
      const response = await fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      results.push(`✅ CORS OK - Status: ${response.status}`);
    } catch (err: any) {
      results.push(`❌ CORS KO: ${err.message}`);
    }
    
    // Test 3: Test de l'API REST Supabase
    results.push('3️⃣ Test API REST...');
    try {
      const response = await fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co/rest/v1/', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU'
        },
        cache: 'no-cache'
      });
      
      if (response.ok) {
        results.push(`✅ API REST accessible - Status: ${response.status}`);
      } else {
        results.push(`⚠️ API REST répond mais erreur - Status: ${response.status}`);
        const text = await response.text();
        results.push(`📋 Réponse: ${text.substring(0, 200)}`);
      }
    } catch (err: any) {
      results.push(`❌ API REST KO: ${err.message}`);
    }
    
    // Test 4: Test de l'Auth API
    results.push('4️⃣ Test Auth API...');
    try {
      const response = await fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co/auth/v1/settings', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU'
        },
        cache: 'no-cache'
      });
      
      if (response.ok) {
        results.push(`✅ Auth API accessible - Status: ${response.status}`);
      } else {
        results.push(`⚠️ Auth API erreur - Status: ${response.status}`);
      }
    } catch (err: any) {
      results.push(`❌ Auth API KO: ${err.message}`);
    }
    
    // Test 5: Vérification DNS
    results.push('5️⃣ Test DNS...');
    try {
      // Test avec une requête simple
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        results.push('✅ DNS général fonctionne');
      }
    } catch (err: any) {
      results.push(`❌ DNS général KO: ${err.message}`);
    }
    
    results.push('🏁 === DIAGNOSTIC TERMINÉ ===');
    
  } catch (err: any) {
    results.push(`❌ Erreur générale: ${err.message}`);
  }
  
  return results;
};


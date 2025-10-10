export const deepNetworkDiagnostic = async () => {
  const results: string[] = [];
  
  try {
    results.push('🔍 === DIAGNOSTIC RÉSEAU APPROFONDI ===');
    
    // Test 1: Test DNS
    results.push('1️⃣ Test DNS...');
    try {
      const dnsTest = await Promise.race([
        fetch('https://8.8.8.8', { method: 'HEAD', mode: 'no-cors' }).then(() => '✅ DNS fonctionne'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout DNS')), 5000))
      ]);
      results.push(dnsTest as string);
    } catch (err: any) {
      results.push(`❌ DNS KO: ${err.message}`);
    }
    
    // Test 2: Test HTTPS général
    results.push('2️⃣ Test HTTPS général...');
    try {
      const httpsTest = await Promise.race([
        fetch('https://httpbin.org/status/200', { method: 'HEAD' }).then(response =>
          response.ok ? '✅ HTTPS général OK' : `❌ HTTPS KO: ${response.status}`
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout HTTPS')), 5000))
      ]);
      results.push(httpsTest as string);
    } catch (err: any) {
      results.push(`❌ HTTPS général KO: ${err.message}`);
    }
    
    // Test 3: Test direct vers Supabase (sans CORS)
    results.push('3️⃣ Test direct Supabase (no-cors)...');
    try {
      const supabaseDirect = await Promise.race([
        fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co', { 
          method: 'HEAD', 
          mode: 'no-cors',
          cache: 'no-cache'
        }).then(() => '✅ Supabase accessible (no-cors)'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Supabase direct')), 8000))
      ]);
      results.push(supabaseDirect as string);
    } catch (err: any) {
      results.push(`❌ Supabase direct KO: ${err.message}`);
    }
    
    // Test 4: Test API REST Supabase
    results.push('4️⃣ Test API REST Supabase...');
    try {
      const apiTest = await Promise.race([
        fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY8NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU'
          }
        }).then(response => 
          response.ok ? `✅ API REST OK (${response.status})` : `❌ API REST KO: ${response.status}`
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout API REST')), 10000))
      ]);
      results.push(apiTest as string);
    } catch (err: any) {
      results.push(`❌ API REST KO: ${err.message}`);
    }
    
    // Test 5: Test Auth API Supabase
    results.push('5️⃣ Test Auth API Supabase...');
    try {
      const authTest = await Promise.race([
        fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co/auth/v1/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU'
          },
          body: JSON.stringify({
            email: 'test-network@example.com',
            password: 'testpassword123'
          })
        }).then(response => 
          response.ok ? `✅ Auth API OK (${response.status})` : `❌ Auth API KO: ${response.status}`
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Auth API')), 10000))
      ]);
      results.push(authTest as string);
    } catch (err: any) {
      results.push(`❌ Auth API KO: ${err.message}`);
    }
    
    // Test 6: Test de latence
    results.push('6️⃣ Test de latence...');
    const startTime = Date.now();
    try {
      await Promise.race([
        fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co', { 
          method: 'HEAD', 
          mode: 'no-cors' 
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout latence')), 15000))
      ]);
      const latency = Date.now() - startTime;
      results.push(`✅ Latence: ${latency}ms`);
      
      if (latency > 10000) {
        results.push('⚠️ Latence très élevée (>10s)');
        results.push('💡 SOLUTION: Problème de connexion réseau');
      } else if (latency > 5000) {
        results.push('⚠️ Latence élevée (>5s)');
        results.push('💡 SOLUTION: Connexion lente');
      } else {
        results.push('✅ Latence acceptable');
      }
    } catch (err: any) {
      results.push(`❌ Test latence KO: ${err.message}`);
    }
    
    // Test 7: Vérification de la configuration
    results.push('7️⃣ Vérification configuration...');
    results.push('📋 URL: https://qxcoqqwedvqhsxhkkuda.supabase.co');
    results.push('📋 Clé: eyJhbGciOiJIUzI1NiIs... (tronquée)');
    
    // Test 8: Suggestions
    results.push('8️⃣ Suggestions...');
    results.push('💡 POSSIBLES SOLUTIONS:');
    results.push('• Vérifiez votre connexion internet');
    results.push('• Vérifiez les paramètres proxy/firewall');
    results.push('• Testez depuis un autre réseau');
    results.push('• Vérifiez le statut Supabase (status.supabase.com)');
    results.push('• Essayez de redémarrer votre routeur');
    
    results.push('🏁 === DIAGNOSTIC TERMINÉ ===');
    
  } catch (err: any) {
    results.push(`❌ Erreur générale: ${err.message}`);
  }
  
  return results;
};


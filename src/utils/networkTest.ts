export const testNetworkConnectivity = async () => {
  const results: string[] = [];
  
  try {
    // Test 1: Ping simple vers Google DNS
    results.push('🌐 Test de connectivité réseau...');
    
    const pingPromise = fetch('https://8.8.8.8', { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    }).then(() => '✅ Réseau OK').catch(() => '❌ Réseau KO');
    
    const pingResult = await Promise.race([
      pingPromise,
      new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout réseau')), 5000)
      )
    ]);
    
    results.push(pingResult);
    
    // Test 2: Test HTTPS vers un site fiable
    results.push('🔗 Test HTTPS...');
    
    const httpsPromise = fetch('https://httpbin.org/status/200', {
      method: 'GET',
      cache: 'no-cache'
    }).then(response => 
      response.ok ? '✅ HTTPS OK' : '❌ HTTPS KO'
    ).catch(() => '❌ HTTPS KO');
    
    const httpsResult = await Promise.race([
      httpsPromise,
      new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout HTTPS')), 5000)
      )
    ]);
    
    results.push(httpsResult);
    
    // Test 3: Test spécifique vers Supabase
    results.push('🏗️ Test vers Supabase...');
    
    const supabasePromise = fetch('https://qxcoqqwedvqhsxhkkuda.supabase.co', {
      method: 'HEAD',
      cache: 'no-cache'
    }).then(response => 
      response.ok ? '✅ Supabase accessible' : '❌ Supabase non accessible'
    ).catch(() => '❌ Supabase non accessible');
    
    const supabaseResult = await Promise.race([
      supabasePromise,
      new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout Supabase')), 10000)
      )
    ]);
    
    results.push(supabaseResult);
    
  } catch (err: any) {
    results.push(`❌ Erreur test réseau: ${err.message}`);
  }
  
  return results;
};

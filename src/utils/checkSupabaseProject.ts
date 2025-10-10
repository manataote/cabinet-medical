export const checkSupabaseProjectStatus = async () => {
  const results: string[] = [];
  
  try {
    results.push('🔍 === VÉRIFICATION PROJET SUPABASE ===');
    
    // Vérification 1: URL et format
    results.push('1️⃣ Vérification URL...');
    const url = 'https://qxcoqqwedvqhsxhkkuda.supabase.co';
    results.push(`📋 URL: ${url}`);
    
    // Vérifier le format de l'URL
    if (!url.includes('supabase.co')) {
      results.push('❌ URL ne contient pas "supabase.co"');
      return results;
    }
    
    if (!url.startsWith('https://')) {
      results.push('❌ URL ne commence pas par "https://"');
      return results;
    }
    
    results.push('✅ Format URL correct');
    
    // Vérification 2: Test de ping basique
    results.push('2️⃣ Test ping basique...');
    try {
      const pingResponse = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      results.push('✅ Ping basique OK');
    } catch (err: any) {
      results.push(`❌ Ping basique KO: ${err.message}`);
      return results;
    }
    
    // Vérification 3: Test API REST avec headers
    results.push('3️⃣ Test API REST avec headers...');
    try {
      const apiResponse = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU'
        },
        cache: 'no-cache'
      });
      
      results.push(`📊 Status API: ${apiResponse.status}`);
      results.push(`📊 Status Text: ${apiResponse.statusText}`);
      
      if (apiResponse.ok) {
        results.push('✅ API REST accessible');
      } else {
        results.push(`❌ API REST erreur: ${apiResponse.status}`);
        const text = await apiResponse.text();
        results.push(`📋 Réponse: ${text.substring(0, 200)}`);
      }
    } catch (err: any) {
      results.push(`❌ API REST KO: ${err.message}`);
    }
    
    // Vérification 4: Test de la table cabinets spécifiquement
    results.push('4️⃣ Test table cabinets...');
    try {
      const tableResponse = await fetch(`${url}/rest/v1/cabinets?select=count`, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y29xcXdlZHZxaHN4aGtrdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDk2MTgsImV4cCI6MjA3NDY4NTYxOH0.G-FhlZ2lBOvhcTTYH-FIN_ZLikPAMVAIcvWc-xv_KqU'
        },
        cache: 'no-cache'
      });
      
      results.push(`📊 Status Table: ${tableResponse.status}`);
      
      if (tableResponse.ok) {
        const data = await tableResponse.text();
        results.push('✅ Table cabinets accessible');
        results.push(`📋 Données: ${data.substring(0, 100)}`);
      } else {
        results.push(`❌ Table cabinets erreur: ${tableResponse.status}`);
        const text = await tableResponse.text();
        results.push(`📋 Erreur: ${text.substring(0, 200)}`);
      }
    } catch (err: any) {
      results.push(`❌ Table cabinets KO: ${err.message}`);
    }
    
    // Vérification 5: Suggestions
    results.push('5️⃣ Suggestions...');
    if (results.some(r => r.includes('❌'))) {
      results.push('💡 POSSIBLES SOLUTIONS:');
      results.push('• Vérifiez que le projet Supabase est actif');
      results.push('• Vérifiez que les tables existent');
      results.push('• Vérifiez la clé API publique');
      results.push('• Vérifiez les permissions RLS');
      results.push('• Vérifiez la région du projet');
    } else {
      results.push('✅ Tout semble correct côté Supabase');
    }
    
    results.push('🏁 === VÉRIFICATION TERMINÉE ===');
    
  } catch (err: any) {
    results.push(`❌ Erreur générale: ${err.message}`);
  }
  
  return results;
};


// Utilitaire pour tester la connexion Supabase
import { supabase } from '../config/supabase';
import { SUPABASE_CONFIG } from '../config/supabase-config';

export const testSupabaseConnection = async () => {
  console.log('🔍 Test de connexion Supabase...');
  console.log('🔧 Configuration Supabase:', {
    url: SUPABASE_CONFIG.url,
    anonKey: SUPABASE_CONFIG.anonKey ? `${SUPABASE_CONFIG.anonKey.substring(0, 20)}...` : 'Non défini'
  });
  
  try {
    // Test 1: Connexion de base avec timeout
    console.log('📡 Test de la table patients...');
    
    const testPromise = supabase
      .from('patients')
      .select('count')
      .limit(1);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout après 10 secondes')), 10000)
    );
    
    try {
      const { data: testData, error: testError } = await Promise.race([testPromise, timeoutPromise]) as any;
      
      if (testError) {
        console.error('❌ Erreur de connexion Supabase:', testError);
        console.error('Détails de l\'erreur:', {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        });
        return false;
      } else {
        console.log('✅ Connexion Supabase OK');
        console.log('Données reçues:', testData);
      }
    } catch (timeoutError) {
      console.error('❌ Timeout Supabase:', timeoutError);
      console.error('Supabase ne répond pas dans les 10 secondes');
      return false;
    }

    // Test 2: Vérifier les tables
    const tables = ['patients', 'medecins', 'actes_soins', 'actes_orthopediques'];
    
    for (const table of tables) {
      try {
        console.log(`📋 Test de la table ${table}...`);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ Erreur sur la table ${table}:`, error);
          console.error(`Détails:`, {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        } else {
          console.log(`✅ Table ${table} accessible - ${data.length} enregistrement(s) trouvé(s)`);
        }
      } catch (err) {
        console.error(`❌ Erreur lors du test de la table ${table}:`, err);
      }
    }

    // Test 3: Vérifier le cabinet par défaut
    try {
      const { data: cabinetData, error: cabinetError } = await supabase
        .from('cabinets')
        .select('*')
        .eq('name', 'Cabinet Médical');
      
      if (cabinetError) {
        console.error('❌ Erreur lors de la récupération du cabinet:', cabinetError);
      } else if (cabinetData && cabinetData.length > 0) {
        console.log('✅ Cabinet par défaut trouvé:', cabinetData[0]);
      } else {
        console.log('⚠️ Aucun cabinet par défaut trouvé');
      }
    } catch (err) {
      console.error('❌ Erreur lors du test du cabinet:', err);
    }

    return true;
  } catch (err) {
    console.error('❌ Erreur générale lors du test Supabase:', err);
    return false;
  }
};

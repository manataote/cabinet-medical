import { supabase } from '../config/supabase';

export const debugAuth = async () => {
  console.log('🔍 === DEBUG AUTHENTIFICATION ===');
  
  try {
    // 1. Test de connexion Supabase
    console.log('1️⃣ Test de connexion Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('cabinets')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erreur de connexion Supabase:', connectionError);
      return false;
    }
    console.log('✅ Connexion Supabase OK');

    // 2. Vérifier si le cabinet par défaut existe
    console.log('2️⃣ Vérification du cabinet par défaut...');
    const { data: cabinetData, error: cabinetError } = await supabase
      .from('cabinets')
      .select('*')
      .eq('name', 'Cabinet Médical')
      .single();

    if (cabinetError) {
      console.error('❌ Cabinet par défaut non trouvé:', cabinetError);
      console.log('🔧 Création du cabinet par défaut...');
      
      const { data: newCabinet, error: createError } = await supabase
        .from('cabinets')
        .insert({ name: 'Cabinet Médical' })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur création cabinet:', createError);
        return false;
      }
      
      console.log('✅ Cabinet par défaut créé:', newCabinet);
    } else {
      console.log('✅ Cabinet par défaut trouvé:', cabinetData);
    }

    // 3. Test de session
    console.log('3️⃣ Test de session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erreur session:', sessionError);
    } else {
      console.log('📊 Session actuelle:', session ? 'Connecté' : 'Non connecté');
      if (session?.user) {
        console.log('👤 Utilisateur:', session.user.email);
      }
    }

    // 4. Test de la table users
    console.log('4️⃣ Test de la table users...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (usersError) {
      console.error('❌ Erreur table users:', usersError);
      return false;
    }
    console.log('✅ Table users accessible');

    console.log('✅ === DEBUG TERMINÉ AVEC SUCCÈS ===');
    return true;

  } catch (err) {
    console.error('❌ Erreur générale dans debugAuth:', err);
    return false;
  }
};

// Fonction pour créer un utilisateur de test
export const createTestUser = async () => {
  console.log('🧪 Création d\'un utilisateur de test...');
  
  try {
    // Vérifier que le cabinet existe
    const { data: cabinetData, error: cabinetError } = await supabase
      .from('cabinets')
      .select('id')
      .eq('name', 'Cabinet Médical')
      .single();

    if (cabinetError || !cabinetData) {
      console.error('❌ Cabinet par défaut non trouvé');
      return false;
    }

    // Créer l'utilisateur de test
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    });

    if (error) {
      console.error('❌ Erreur création utilisateur test:', error);
      return false;
    }

    if (data.user) {
      // Créer le profil utilisateur
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          role: 'medecin',
          cabinet_id: cabinetData.id,
        });

      if (insertError) {
        console.error('❌ Erreur création profil test:', insertError);
        return false;
      }

      console.log('✅ Utilisateur de test créé:', data.user.email);
      return true;
    }

    return false;
  } catch (err) {
    console.error('❌ Erreur dans createTestUser:', err);
    return false;
  }
};


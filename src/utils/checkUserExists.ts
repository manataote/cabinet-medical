import { supabase } from '../config/supabase';

export const checkUserExists = async (email: string) => {
  try {
    // Vérifier dans la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows found
      return { exists: false, error: userError.message };
    }

    if (userData) {
      return { exists: true, user: userData };
    } else {
      return { exists: false };
    }

  } catch (err: any) {
    return { exists: false, error: err.message };
  }
};

export const checkAuthUser = async (email: string) => {
  try {
    // Note: On ne peut pas directement interroger auth.users depuis le client
    // Mais on peut essayer de récupérer la session actuelle
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return { exists: false, error: error.message };
    }

    if (session?.user?.email === email) {
      return { exists: true, user: session.user };
    } else {
      return { exists: false };
    }

  } catch (err: any) {
    return { exists: false, error: err.message };
  }
};


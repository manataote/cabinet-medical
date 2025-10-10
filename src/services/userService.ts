import { supabase } from '../config/supabase';

export interface ConfigCalculs {
  multiplicateurIK: number;
  tarifIFD: number;
  majorationNuit: number;
  majorationDimanche: number;
}

export interface ConfigFormats {
  formatDate?: string;
  formatNombre?: string;
}

export interface ConfigPositionnementsPdf {
  [key: string]: { x: number; y: number };
}

export interface UserInfo {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  cabinet_id: string;
  numero_ident?: string;
  config_calculs?: ConfigCalculs;
  config_formats?: ConfigFormats;
  config_positionnements_pdf?: ConfigPositionnementsPdf;
}

export interface UserProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  cabinet_id: string;
}

export class UserService {
  static async getUserInfo(userId: string): Promise<UserInfo | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération des informations utilisateur:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des informations utilisateur:', error);
      return null;
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du profil utilisateur:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil utilisateur:', error);
      return null;
    }
  }

  static async getUserProfiles(userIds: string[]): Promise<Record<string, UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

      if (error) {
        console.error('Erreur lors de la récupération des profils utilisateur:', error);
        return {};
      }

      const profiles: Record<string, UserProfile> = {};
      data?.forEach(user => {
        profiles[user.id] = user;
      });

      return profiles;
    } catch (error) {
      console.error('Erreur lors de la récupération des profils utilisateur:', error);
      return {};
    }
  }

  static getDisplayName(userProfile: UserProfile | null): string {
    if (!userProfile) return 'Utilisateur inconnu';
    
    const nom = userProfile.nom || '';
    const prenom = userProfile.prenom || '';
    
    if (nom && prenom) {
      return `${prenom} ${nom}`;
    } else if (nom) {
      return nom;
    } else if (prenom) {
      return prenom;
    } else {
      return userProfile.email || 'Utilisateur inconnu';
    }
  }

  static getInitials(userProfile: UserProfile | null): string {
    if (!userProfile) return '?';
    
    const nom = userProfile.nom || '';
    const prenom = userProfile.prenom || '';
    
    if (nom && prenom) {
      return `${prenom.charAt(0).toUpperCase()}${nom.charAt(0).toUpperCase()}`;
    } else if (nom) {
      return nom.charAt(0).toUpperCase();
    } else if (prenom) {
      return prenom.charAt(0).toUpperCase();
    } else {
      return userProfile.email?.charAt(0).toUpperCase() || '?';
    }
  }

  static async updateUser(userId: string, updates: Partial<UserInfo>): Promise<UserInfo | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      return null;
    }
  }
}
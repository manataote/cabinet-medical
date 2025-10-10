import { supabase } from '../config/supabase';

export interface Cabinet {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export class CabinetService {
  static async getCabinetById(cabinetId: string): Promise<Cabinet | null> {
    try {
      const { data, error } = await supabase
        .from('cabinets')
        .select('*')
        .eq('id', cabinetId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du cabinet:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du cabinet:', error);
      return null;
    }
  }

  static async updateCabinet(cabinetId: string, updates: Partial<Cabinet>): Promise<Cabinet | null> {
    try {
      const { data, error } = await supabase
        .from('cabinets')
        .update(updates)
        .eq('id', cabinetId)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du cabinet:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du cabinet:', error);
      return null;
    }
  }
}

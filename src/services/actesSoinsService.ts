import { supabase } from '../config/supabase';
import { ActeSoins } from '../types';

export class ActesSoinsService {
  // Récupérer tous les actes de soins (globaux + cabinet)
  static async getActesSoins(cabinetId?: string | null): Promise<ActeSoins[]> {
    let query = supabase
      .from('actes_soins')
      .select('*');

    // Filtrer pour afficher :
    // 1. Les actes globaux (cabinet_id IS NULL)
    // 2. Les actes du cabinet actuel (si cabinetId fourni)
    if (cabinetId) {
      query = query.or(`cabinet_id.is.null,cabinet_id.eq.${cabinetId}`);
    } else {
      // Si pas de cabinetId, afficher seulement les actes globaux
      query = query.is('cabinet_id', null);
    }

    const { data, error } = await query.order('code', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des actes de soins:', error);
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      code: row.code,
      libelle: row.libelle,
      tarif: row.tarif,
      coefficient: row.coefficient,
      actif: row.actif
    }));
  }

  // Créer un nouvel acte de soins
  static async createActeSoins(acte: Omit<ActeSoins, 'id'>, cabinetId?: string | null): Promise<ActeSoins> {

    const { data, error } = await supabase
      .from('actes_soins')
      .insert({
        code: acte.code,
        libelle: acte.libelle,
        tarif: acte.tarif,
        coefficient: acte.coefficient,
        actif: acte.actif,
        cabinet_id: cabinetId || null, // Associer au cabinet ou laisser global (NULL)
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'acte de soins:', error);
      throw error;
    }

    return {
      id: data.id,
      code: data.code,
      libelle: data.libelle,
      tarif: data.tarif,
      coefficient: data.coefficient,
      actif: data.actif
    };
  }

  // Mettre à jour un acte de soins
  static async updateActeSoins(acte: ActeSoins): Promise<ActeSoins> {
    const { data, error } = await supabase
      .from('actes_soins')
      .update({
        code: acte.code,
        libelle: acte.libelle,
        tarif: acte.tarif,
        coefficient: acte.coefficient,
        actif: acte.actif,
        updated_at: new Date().toISOString()
      })
      .eq('id', acte.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'acte de soins:', error);
      throw error;
    }

    return {
      id: data.id,
      code: data.code,
      libelle: data.libelle,
      tarif: data.tarif,
      coefficient: data.coefficient,
      actif: data.actif
    };
  }

  // Supprimer un acte de soins
  static async deleteActeSoins(acteId: string): Promise<void> {
    const { error } = await supabase
      .from('actes_soins')
      .delete()
      .eq('id', acteId);

    if (error) {
      console.error('Erreur lors de la suppression de l\'acte de soins:', error);
      throw error;
    }
  }
}

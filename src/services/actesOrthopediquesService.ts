import { supabase } from '../config/supabase';
import { ActeOrthopedique } from '../types';

export class ActesOrthopediquesService {
  // Récupérer tous les actes orthopédiques (globaux + cabinet)
  static async getActesOrthopediques(cabinetId?: string | null): Promise<ActeOrthopedique[]> {
    let query = supabase
      .from('actes_orthopediques')
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

    const { data, error } = await query.order('code_lppr', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des actes orthopédiques:', error);
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      codeLPPR: row.code_lppr,
      libelleInterne: row.libelle_interne,
      libelleFacture: row.libelle_facture,
      quantite: row.quantite,
      tarifBase: row.tarif_base,
      tarifBaseLPPR: row.tarif_base, // Même valeur que tarifBase
      tauxApplique: row.taux_applique,
      regime: row.regime,
      total: row.total,
      partCPS: row.part_cps,
      partPatient: row.part_patient,
      actif: row.actif
    }));
  }

  // Créer un nouvel acte orthopédique
  static async createActeOrthopedique(acte: Omit<ActeOrthopedique, 'id'>, cabinetId?: string | null): Promise<ActeOrthopedique> {

    const { data, error } = await supabase
      .from('actes_orthopediques')
      .insert({
        code_lppr: acte.codeLPPR,
        libelle_interne: acte.libelleInterne,
        libelle_facture: acte.libelleFacture,
        quantite: acte.quantite,
        tarif_base: acte.tarifBase,
        tarif_base_lppr: acte.tarifBase,
        taux_applique: acte.tauxApplique,
        regime: acte.regime,
        total: acte.total,
        part_cps: acte.partCPS,
        part_patient: acte.partPatient,
        actif: acte.actif,
        cabinet_id: cabinetId || null, // Associer au cabinet ou laisser global (NULL)
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'acte orthopédique:', error);
      throw error;
    }

    return {
      id: data.id,
      codeLPPR: data.code_lppr,
      libelleInterne: data.libelle_interne,
      libelleFacture: data.libelle_facture,
      quantite: data.quantite,
      tarifBase: data.tarif_base,
      tarifBaseLPPR: data.tarif_base,
      tauxApplique: data.taux_applique,
      regime: data.regime,
      total: data.total,
      partCPS: data.part_cps,
      partPatient: data.part_patient,
      actif: data.actif
    };
  }

  // Mettre à jour un acte orthopédique
  static async updateActeOrthopedique(acte: ActeOrthopedique): Promise<ActeOrthopedique> {
    const { data, error } = await supabase
      .from('actes_orthopediques')
      .update({
        code_lppr: acte.codeLPPR,
        libelle_interne: acte.libelleInterne,
        libelle_facture: acte.libelleFacture,
        quantite: acte.quantite,
        tarif_base: acte.tarifBase,
        tarif_base_lppr: acte.tarifBase,
        taux_applique: acte.tauxApplique,
        regime: acte.regime,
        total: acte.total,
        part_cps: acte.partCPS,
        part_patient: acte.partPatient,
        actif: acte.actif,
        updated_at: new Date().toISOString()
      })
      .eq('id', acte.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'acte orthopédique:', error);
      throw error;
    }

    return {
      id: data.id,
      codeLPPR: data.code_lppr,
      libelleInterne: data.libelle_interne,
      libelleFacture: data.libelle_facture,
      quantite: data.quantite,
      tarifBase: data.tarif_base,
      tarifBaseLPPR: data.tarif_base,
      tauxApplique: data.taux_applique,
      regime: data.regime,
      total: data.total,
      partCPS: data.part_cps,
      partPatient: data.part_patient,
      actif: data.actif
    };
  }

  // Supprimer un acte orthopédique
  static async deleteActeOrthopedique(acteId: string): Promise<void> {
    const { error } = await supabase
      .from('actes_orthopediques')
      .delete()
      .eq('id', acteId);

    if (error) {
      console.error('Erreur lors de la suppression de l\'acte orthopédique:', error);
      throw error;
    }
  }
}

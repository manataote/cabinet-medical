import { supabase } from '../config/supabase';

export interface ActeMigration {
  id: string;
  code: string;
  libelle: string;
  libelle_facture?: string;
  tarif: number;
  coefficient: number;
  type: 'soins' | 'orthopedique';
  quantite?: number;
  taux_applique?: number;
  regime?: string;
  total?: number;
  part_cps?: number;
  part_patient?: number;
  tarif_base_lppr?: number;
  actif: boolean;
  cabinet_id: string;
}

export class ActesMigrationService {
  // Récupérer l'UUID du cabinet par défaut
  private static async getDefaultCabinetId(): Promise<string> {
    const { data, error } = await supabase
      .from('cabinets')
      .select('id')
      .eq('name', 'Cabinet Médical')
      .single();

    if (error || !data) {
      console.warn('Cabinet par défaut non trouvé, utilisation d\'un UUID temporaire');
      return '550e8400-e29b-41d4-a716-446655440000';
    }

    return data.id;
  }

  // Migrer les données de l'ancienne table actes vers les nouvelles tables
  static async migrateActes(): Promise<{ soins: number; orthopedique: number }> {
    console.log('🔄 Début de la migration des actes...');
    
    const cabinetId = await this.getDefaultCabinetId();
    
    // Récupérer tous les actes de l'ancienne table
    const { data: actes, error } = await supabase
      .from('actes')
      .select('*')
      .eq('cabinet_id', cabinetId);

    if (error) {
      console.error('❌ Erreur lors de la récupération des actes:', error);
      throw error;
    }

    console.log(`📊 ${actes.length} actes trouvés à migrer`);

    let soinsCount = 0;
    let orthopediqueCount = 0;

    for (const acte of actes) {
      try {
        if (acte.type === 'soins') {
          // Migration vers actes_soins
          const { error: insertError } = await supabase
            .from('actes_soins')
            .insert({
              id: acte.id, // Garder le même ID
              code: acte.code,
              libelle: acte.libelle,
              tarif: acte.tarif,
              coefficient: acte.coefficient,
              actif: acte.actif,
              cabinet_id: acte.cabinet_id,
              created_at: acte.created_at,
              updated_at: acte.updated_at
            });

          if (insertError) {
            console.error(`❌ Erreur migration acte de soins ${acte.id}:`, insertError);
          } else {
            soinsCount++;
            console.log(`✅ Acte de soins migré: ${acte.libelle}`);
          }
        } else if (acte.type === 'orthopedique') {
          // Migration vers actes_orthopediques
          const { error: insertError } = await supabase
            .from('actes_orthopediques')
            .insert({
              id: acte.id, // Garder le même ID
              code_lppr: acte.code,
              libelle_interne: acte.libelle_facture || acte.libelle,
              libelle_facture: acte.libelle,
              quantite: acte.quantite || 1,
              tarif_base: acte.tarif_base_lppr || 0,
              taux_applique: acte.taux_applique || 100,
              regime: acte.regime || 'maladie',
              total: acte.total || 0,
              part_cps: acte.part_cps || 0,
              part_patient: acte.part_patient || 0,
              actif: acte.actif,
              cabinet_id: acte.cabinet_id,
              created_at: acte.created_at,
              updated_at: acte.updated_at
            });

          if (insertError) {
            console.error(`❌ Erreur migration acte orthopédique ${acte.id}:`, insertError);
          } else {
            orthopediqueCount++;
            console.log(`✅ Acte orthopédique migré: ${acte.libelle}`);
          }
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la migration de l'acte ${acte.id}:`, error);
      }
    }

    console.log(`🎉 Migration terminée: ${soinsCount} actes de soins, ${orthopediqueCount} actes orthopédiques`);

    return { soins: soinsCount, orthopedique: orthopediqueCount };
  }

  // Nettoyer l'ancienne table actes après migration
  static async cleanupOldActes(): Promise<void> {
    console.log('🧹 Nettoyage de l\'ancienne table actes...');
    
    const cabinetId = await this.getDefaultCabinetId();
    
    const { error } = await supabase
      .from('actes')
      .delete()
      .eq('cabinet_id', cabinetId);

    if (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      throw error;
    }

    console.log('✅ Ancienne table actes nettoyée');
  }

  // Vérifier la migration
  static async verifyMigration(): Promise<{ soins: number; orthopedique: number; old: number }> {
    const cabinetId = await this.getDefaultCabinetId();
    
    const { data: soins } = await supabase
      .from('actes_soins')
      .select('id')
      .eq('cabinet_id', cabinetId);
    
    const { data: orthopediques } = await supabase
      .from('actes_orthopediques')
      .select('id')
      .eq('cabinet_id', cabinetId);
    
    const { data: oldActes } = await supabase
      .from('actes')
      .select('id')
      .eq('cabinet_id', cabinetId);

    return {
      soins: soins?.length || 0,
      orthopedique: orthopediques?.length || 0,
      old: oldActes?.length || 0
    };
  }
}




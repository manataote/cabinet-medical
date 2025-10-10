import { supabase } from '../config/supabase';
import { ActeOrthopedique } from '../types';
import { log } from '../utils/logger';

export interface FacturesSemellesActeOrthopedique {
  id: string;
  facture_semelles_id: string;
  acte_orthopedique_id: string;
  created_at: string;
  updated_at: string;
}

export class FacturesSemellesActesService {
  /**
   * Ajoute un acte orthopédique à une facture semelles
   */
  static async addActeOrthopediqueToFacture(
    factureSemellesId: string, 
    acteOrthopediqueId: string
  ): Promise<void> {
    try {
      log.info('📝 Ajout d\'un acte orthopédique à la facture semelles...', { 
        factureSemellesId, 
        acteOrthopediqueId 
      });

      const { error } = await supabase
        .from('factures_semelles_actes_orthopediques')
        .insert({
          facture_semelles_id: factureSemellesId,
          acte_orthopedique_id: acteOrthopediqueId
        });

      if (error) {
        log.error('❌ Erreur lors de l\'ajout de l\'acte orthopédique à la facture:', error);
        throw new Error(`Erreur lors de l'ajout de l'acte orthopédique: ${error.message}`);
      }

      log.info('✅ Acte orthopédique ajouté à la facture avec succès');
    } catch (error) {
      log.error('❌ Erreur dans addActeOrthopediqueToFacture:', error);
      throw error;
    }
  }

  /**
   * Supprime un acte orthopédique d'une facture semelles
   */
  static async removeActeOrthopediqueFromFacture(
    factureSemellesId: string, 
    acteOrthopediqueId: string
  ): Promise<void> {
    try {
      log.info('🗑️ Suppression d\'un acte orthopédique de la facture semelles...', { 
        factureSemellesId, 
        acteOrthopediqueId 
      });

      const { error } = await supabase
        .from('factures_semelles_actes_orthopediques')
        .delete()
        .eq('facture_semelles_id', factureSemellesId)
        .eq('acte_orthopedique_id', acteOrthopediqueId);

      if (error) {
        log.error('❌ Erreur lors de la suppression de l\'acte orthopédique de la facture:', error);
        throw new Error(`Erreur lors de la suppression de l'acte orthopédique: ${error.message}`);
      }

      log.info('✅ Acte orthopédique supprimé de la facture avec succès');
    } catch (error) {
      log.error('❌ Erreur dans removeActeOrthopediqueFromFacture:', error);
      throw error;
    }
  }

  /**
   * Met à jour tous les actes orthopédiques d'une facture semelles
   */
  static async updateActesOrthopediquesForFacture(
    factureSemellesId: string, 
    actesOrthopediques: ActeOrthopedique[]
  ): Promise<void> {
    try {
      log.info('📝 Mise à jour des actes orthopédiques de la facture semelles...', { 
        factureSemellesId, 
        actesCount: actesOrthopediques.length 
      });

      // Attendre un délai pour s'assurer que la facture est disponible pour les politiques RLS
      log.info('⏳ Attente de 500ms pour la disponibilité de la facture...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Supprimer tous les actes existants pour cette facture
      const { error: deleteError } = await supabase
        .from('factures_semelles_actes_orthopediques')
        .delete()
        .eq('facture_semelles_id', factureSemellesId);

      if (deleteError) {
        log.error('❌ Erreur lors de la suppression des anciens actes:', deleteError);
        throw new Error(`Erreur lors de la suppression des anciens actes: ${deleteError.message}`);
      }

      // Ajouter les nouveaux actes avec retry en cas d'erreur RLS
      if (actesOrthopediques.length > 0) {
        log.info('🔍 Actes orthopédiques à insérer:', actesOrthopediques.map(a => ({ id: a.id, codeLPPR: a.codeLPPR, libelleFacture: a.libelleFacture })));
        
        const insertData = actesOrthopediques.map(acte => ({
          facture_semelles_id: factureSemellesId,
          acte_orthopedique_id: acte.id
        }));

        // Système de retry pour les erreurs RLS
        let retryCount = 0;
        const maxRetries = 3;
        let insertError: any = null;

        while (retryCount < maxRetries) {
          const { error } = await supabase
            .from('factures_semelles_actes_orthopediques')
            .insert(insertData);

          if (!error) {
            // Succès !
            insertError = null;
            break;
          }

          // Vérifier si c'est une erreur RLS
          if (error.code === '42501' && error.message.includes('row-level security policy')) {
            retryCount++;
            log.warning(`⚠️ Erreur RLS détectée, tentative ${retryCount}/${maxRetries}`, { error: error.message });
            
            if (retryCount < maxRetries) {
              // Attendre plus longtemps entre les tentatives
              const delay = 1000 * retryCount; // 1s, 2s, 3s
              log.info(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              insertError = error;
            }
          } else {
            // Autre type d'erreur, pas de retry
            insertError = error;
            break;
          }
        }

        if (insertError) {
          log.error('❌ Erreur lors de l\'ajout des nouveaux actes après tous les essais:', insertError);
          throw new Error(`Erreur lors de l'ajout des nouveaux actes: ${insertError.message}`);
        }
      }

      log.info('✅ Actes orthopédiques de la facture mis à jour avec succès');
    } catch (error) {
      log.error('❌ Erreur dans updateActesOrthopediquesForFacture:', error);
      throw error;
    }
  }

  /**
   * Récupère les actes orthopédiques de plusieurs factures semelles en une seule requête
   */
  static async getActesOrthopediquesByFactures(factureSemellesIds: string[]): Promise<ActeOrthopedique[]> {
    try {
      if (factureSemellesIds.length === 0) return [];


      const { data, error } = await supabase
        .from('factures_semelles_actes_orthopediques')
        .select(`
          facture_semelles_id,
          actes_orthopediques (
            id,
            code_lppr,
            libelle_interne,
            libelle_facture,
            quantite,
            tarif_base,
            tarif_base_lppr,
            taux_applique,
            regime,
            total,
            part_cps,
            part_patient,
            actif,
            cabinet_id,
            created_at,
            updated_at
          )
        `)
        .in('facture_semelles_id', factureSemellesIds);

      if (error) {
        log.error('❌ Erreur lors de la récupération des actes orthopédiques:', error);
        throw new Error(`Erreur lors de la récupération des actes orthopédiques: ${error.message}`);
      }

      // Convertir les données avec coercition numérique fiable
      const actesOrthopediques: ActeOrthopedique[] = (data || [])
        .filter((item: any) => item.actes_orthopediques)
        .map((item: any) => ({
          ...this.mapDbToActeOrthopedique(item.actes_orthopediques),
          // Conserver l'ID de la facture pour le regroupement côté appelant
          facture_semelles_id: item.facture_semelles_id
        }));

      return actesOrthopediques;

    } catch (error) {
      log.error('❌ Erreur dans getActesOrthopediquesByFactures:', error);
      return [];
    }
  }

  /**
   * Récupère tous les actes orthopédiques d'une facture semelles
   */
  static async getActesOrthopediquesByFacture(factureSemellesId: string): Promise<ActeOrthopedique[]> {
    try {
      log.info('🔍 Récupération des actes orthopédiques de la facture semelles...', { factureSemellesId });

      const { data, error } = await supabase
        .from('factures_semelles_actes_orthopediques')
        .select(`
          actes_orthopediques (
            id,
            code_lppr,
            libelle_interne,
            libelle_facture,
            quantite,
            tarif_base,
            tarif_base_lppr,
            taux_applique,
            regime,
            total,
            part_cps,
            part_patient,
            actif,
            cabinet_id,
            created_at,
            updated_at
          )
        `)
        .eq('facture_semelles_id', factureSemellesId);

      if (error) {
        log.error('❌ Erreur lors de la récupération des actes orthopédiques:', error);
        throw new Error(`Erreur lors de la récupération des actes orthopédiques: ${error.message}`);
      }

      log.info('✅ Actes orthopédiques récupérés avec succès', { count: data?.length || 0 });

      // Convertir les données vers l'interface ActeOrthopedique avec coercition numérique
      return data?.map((item: any) => this.mapDbToActeOrthopedique(item.actes_orthopediques)) || [];
    } catch (error) {
      log.error('❌ Erreur dans getActesOrthopediquesByFacture:', error);
      throw error;
    }
  }

  /**
   * Supprime tous les actes orthopédiques d'une facture semelles
   */
  static async removeAllActesOrthopediquesFromFacture(factureSemellesId: string): Promise<void> {
    try {
      log.info('🗑️ Suppression de tous les actes orthopédiques de la facture semelles...', { factureSemellesId });

      const { error } = await supabase
        .from('factures_semelles_actes_orthopediques')
        .delete()
        .eq('facture_semelles_id', factureSemellesId);

      if (error) {
        log.error('❌ Erreur lors de la suppression de tous les actes orthopédiques:', error);
        throw new Error(`Erreur lors de la suppression de tous les actes orthopédiques: ${error.message}`);
      }

      log.info('✅ Tous les actes orthopédiques supprimés de la facture avec succès');
    } catch (error) {
      log.error('❌ Erreur dans removeAllActesOrthopediquesFromFacture:', error);
      throw error;
    }
  }

  /**
   * Convertit les données de la base vers l'interface ActeOrthopedique
   */
  private static mapDbToActeOrthopedique(data: any): ActeOrthopedique {
    return {
      id: data.id,
      codeLPPR: data.code_lppr,
      libelleInterne: data.libelle_interne,
      libelleFacture: data.libelle_facture,
      quantite: Number(data.quantite || 0),
      tarifBase: Number(data.tarif_base || 0),
      tarifBaseLPPR: Number(data.tarif_base_lppr || data.tarif_base || 0),
      tauxApplique: Number(data.taux_applique || 0),
      regime: data.regime,
      total: Number(data.total || 0),
      partCPS: Number(data.part_cps || 0),
      partPatient: Number(data.part_patient || 0),
      actif: data.actif !== undefined ? data.actif : true
    };
  }
}

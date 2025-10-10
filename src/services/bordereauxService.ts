import { supabase } from '../config/supabase';
import { Bordereau, TypeBordereau } from '../types';
import { log } from '../utils/logger';
import { FeuillesSoinsActesService } from './feuillesSoinsActesService';
import { CalculUtils } from '../utils/calculs';
import { FacturesSemellesService } from './facturesSemellesService';

export class BordereauxService {
  /**
   * Récupérer tous les bordereaux d'un cabinet
   */
  static async getBordereaux(cabinetId: string): Promise<Bordereau[]> {
    try {

      const { data, error } = await supabase
        .from('bordereaux')
        .select(`
          *,
          feuilles_soins:feuilles_soins!bordereau_id (
            id,
            numero_feuille,
            montant_total,
            patient_id,
            patients (
              id,
              nom,
              prenom
            )
          ),
          factures_semelles:factures_semelles!bordereau_id (
            id,
            numero_facture,
            montant_total,
            patient_id,
            patients (
              id,
              nom,
              prenom
            )
          )
        `)
        .eq('cabinet_id', cabinetId)
        .order('created_at', { ascending: false });

      if (error) {
        log.error('❌ Erreur lors de la récupération des bordereaux', { error: error.message });
        throw new Error(`Erreur lors de la récupération des bordereaux: ${error.message}`);
      }

      const bordereaux = (data || []).map(this.mapDbToBordereau);
      
      // Charger les actes pour chaque feuille de soins dans chaque bordereau
      const bordereauxAvecActes = await Promise.all(
        bordereaux.map(async (bordereau) => {
          const feuillesAvecActes = await Promise.all(
            bordereau.feuillesSoins.map(async (feuille) => {
              try {
                const actes = await FeuillesSoinsActesService.getActesByFeuille(feuille.id);
                const feuilleAvecActes = {
                  ...feuille,
                  actes: actes
                };
                
                // Recalculer les montants avec les actes chargés
                return CalculUtils.recalculerTotauxFeuille(feuilleAvecActes);
              } catch (error) {
                log.error(`Erreur lors du chargement des actes pour la feuille ${feuille.id}:`, error);
                const feuilleAvecActes = {
                  ...feuille,
                  actes: []
                };
                
                // Recalculer les montants même sans actes
                return CalculUtils.recalculerTotauxFeuille(feuilleAvecActes);
              }
            })
          );
          
          // Charger les actes orthopédiques pour chaque facture semelle
          const facturesAvecActes = await Promise.all(
            (bordereau.facturesSemelles || []).map(async (facture) => {
              try {
                const { FacturesSemellesActesService } = await import('./facturesSemellesActesService');
                const actesOrthopediques = await FacturesSemellesActesService.getActesOrthopediquesByFacture(facture.id);
                return {
                  ...facture,
                  actesOrthopediques: actesOrthopediques
                };
              } catch (error) {
                log.error(`Erreur lors du chargement des actes orthopédiques pour la facture ${facture.id}:`, error);
                return {
                  ...facture,
                  actesOrthopediques: []
                };
              }
            })
          );
          
          return {
            ...bordereau,
            feuillesSoins: feuillesAvecActes,
            facturesSemelles: facturesAvecActes
          };
        })
      );
      
      return bordereauxAvecActes;
    } catch (error) {
      log.error('❌ Erreur dans getBordereaux', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Récupérer un bordereau par son ID
   */
  static async getBordereauById(id: string): Promise<Bordereau | null> {
    try {
      log.info('🔍 Récupération du bordereau...', { id });

      const { data, error } = await supabase
        .from('bordereaux')
        .select(`
          *,
          feuilles_soins:feuilles_soins!bordereau_id (
            id,
            numero_feuille,
            montant_total,
            patient_id,
            patients (
              id,
              nom,
              prenom
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Bordereau non trouvé
        }
        log.error('❌ Erreur lors de la récupération du bordereau', { error: error.message });
        throw new Error(`Erreur lors de la récupération du bordereau: ${error.message}`);
      }

      const bordereau = this.mapDbToBordereau(data);
      
      // Charger les actes pour chaque feuille de soins
      const feuillesAvecActes = await Promise.all(
        bordereau.feuillesSoins.map(async (feuille) => {
          try {
            const actes = await FeuillesSoinsActesService.getActesByFeuille(feuille.id);
            const feuilleAvecActes = {
              ...feuille,
              actes: actes
            };
            
            // Recalculer les montants avec les actes chargés
            return CalculUtils.recalculerTotauxFeuille(feuilleAvecActes);
          } catch (error) {
            log.error(`Erreur lors du chargement des actes pour la feuille ${feuille.id}:`, error);
            const feuilleAvecActes = {
              ...feuille,
              actes: []
            };
            
            // Recalculer les montants même sans actes
            return CalculUtils.recalculerTotauxFeuille(feuilleAvecActes);
          }
        })
      );
      
      const bordereauAvecActes = {
        ...bordereau,
        feuillesSoins: feuillesAvecActes
      };
      
      log.info('✅ Bordereau récupéré avec succès', { id });
      return bordereauAvecActes;
    } catch (error) {
      log.error('❌ Erreur dans getBordereauById', { error: (error as Error).message });
      throw error;
    }
  }


  /**
   * Mettre à jour un bordereau
   */
  static async updateBordereau(id: string, bordereauData: Bordereau): Promise<Bordereau> {
    try {
      log.info('📝 Mise à jour du bordereau...', { id });

      const dbData = this.mapBordereauToDb(bordereauData);

      const { error } = await supabase
        .from('bordereaux')
        .update(dbData)
        .eq('id', id);

      if (error) {
        log.error('❌ Erreur lors de la mise à jour du bordereau', { error: error.message });
        throw new Error(`Erreur lors de la mise à jour du bordereau: ${error.message}`);
      }

      // Désassocier toutes les feuilles de soins actuelles
      const { error: clearFeuillesError } = await supabase
        .from('feuilles_soins')
        .update({ bordereau_id: null })
        .eq('bordereau_id', id);

      if (clearFeuillesError) {
        log.error('❌ Erreur lors de la désassociation des feuilles de soins', { error: clearFeuillesError.message });
        throw new Error(`Erreur lors de la désassociation des feuilles de soins: ${clearFeuillesError.message}`);
      }

      // Réassocier les nouvelles feuilles de soins
      if (bordereauData.feuillesSoins.length > 0) {
        const feuilleIds = bordereauData.feuillesSoins.map(f => f.id);
        const { error: updateError } = await supabase
          .from('feuilles_soins')
          .update({ bordereau_id: id })
          .in('id', feuilleIds);

        if (updateError) {
          log.error('❌ Erreur lors de la réassociation des feuilles de soins', { error: updateError.message });
          throw new Error(`Erreur lors de la réassociation des feuilles de soins: ${updateError.message}`);
        }
      }


      // Récupérer le bordereau complet avec ses relations
      const bordereauComplet = await this.getBordereauById(id);
      if (!bordereauComplet) {
        throw new Error('Erreur lors de la récupération du bordereau mis à jour');
      }

      log.info('✅ Bordereau mis à jour avec succès', { id });
      return bordereauComplet;
    } catch (error) {
      log.error('❌ Erreur dans updateBordereau', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Supprimer un bordereau
   */
  static async deleteBordereau(id: string): Promise<boolean> {
    try {
      log.info('🗑️ Suppression du bordereau...', { id });

      // Désassocier toutes les feuilles de soins
      const { error: clearFeuillesError } = await supabase
        .from('feuilles_soins')
        .update({ bordereau_id: null })
        .eq('bordereau_id', id);

      if (clearFeuillesError) {
        log.error('❌ Erreur lors de la désassociation des feuilles de soins', { error: clearFeuillesError.message });
        throw new Error(`Erreur lors de la désassociation des feuilles de soins: ${clearFeuillesError.message}`);
      }

      // Désassocier toutes les factures semelles
      const { error: clearFacturesError } = await supabase
        .from('factures_semelles')
        .update({ bordereau_id: null })
        .eq('bordereau_id', id);

      if (clearFacturesError) {
        log.error('❌ Erreur lors de la désassociation des factures semelles', { error: clearFacturesError.message });
        throw new Error(`Erreur lors de la désassociation des factures semelles: ${clearFacturesError.message}`);
      }


      // Supprimer le bordereau
      const { error } = await supabase
        .from('bordereaux')
        .delete()
        .eq('id', id);

      if (error) {
        log.error('❌ Erreur lors de la suppression du bordereau', { error: error.message });
        throw new Error(`Erreur lors de la suppression du bordereau: ${error.message}`);
      }

      log.info('✅ Bordereau supprimé avec succès', { id });
      return true;
    } catch (error) {
      log.error('❌ Erreur dans deleteBordereau', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Récupérer les feuilles de soins non assignées à un bordereau
   */
  static async getFeuillesSoinsDisponibles(cabinetId: string): Promise<any[]> {
    try {
      log.info('🔍 Récupération des feuilles de soins disponibles...', { cabinetId });

      const { data, error } = await supabase
        .from('feuilles_soins')
        .select(`
          *,
          patients (
            id,
            nom,
            prenom
          )
        `)
        .eq('cabinet_id', cabinetId)
        .is('bordereau_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        log.error('❌ Erreur lors de la récupération des feuilles de soins disponibles', { error: error.message });
        throw new Error(`Erreur lors de la récupération des feuilles de soins disponibles: ${error.message}`);
      }

      log.info('✅ Feuilles de soins disponibles récupérées', { count: data?.length || 0 });
      return data || [];
    } catch (error) {
      log.error('❌ Erreur dans getFeuillesSoinsDisponibles', { error: (error as Error).message });
      throw error;
    }
  }


  /**
   * Mapper les données de la base vers l'interface Bordereau
   */
  private static mapDbToBordereau(data: any): Bordereau {
    return {
      id: data.id,
      numeroBordereau: data.numero_bordereau,
      date: data.date,
      type: data.type as TypeBordereau,
      montantTotal: data.montant_total,
      modeleUtilise: data.modele_utilise,
      cabinetId: data.cabinet_id,
      feuillesSoins: (data.feuilles_soins || []).map((feuille: any) => ({
          id: feuille.id,
          numero_feuille: feuille.numero_feuille,
          montantTotal: feuille.montant_total,
          patient_id: feuille.patient_id,
        patient: feuille.patients ? {
          id: feuille.patients.id,
          nom: feuille.patients.nom,
          prenom: feuille.patients.prenom
        } : undefined,
        // Propriétés par défaut pour la compatibilité
        actes: [],
        dateSoins: new Date(),
        datePrescription: new Date(),
        medecinPrescripteur: '',
        cabinet_id: data.cabinet_id,
        dap: undefined,
        is_parcours_soins: false,
        is_longue_maladie: false,
        is_atmp: false,
        is_maternite: false,
        is_urgence: false,
        is_autres_derogations: false,
        panier_soins: undefined,
        rsr: undefined,
        autres_derogations: undefined,
        numero_atmp: undefined,
        created_at: new Date(),
        updated_at: new Date()
      })),
      facturesSemelles: (data.factures_semelles || []).map((facture: any) => ({
        id: facture.id,
        numeroFacture: facture.numero_facture,
        montantTotal: facture.montant_total,
        patient_id: facture.patient_id,
        patient: facture.patients ? {
          id: facture.patients.id,
          nom: facture.patients.nom,
          prenom: facture.patients.prenom
        } : undefined,
        // Propriétés par défaut pour la compatibilité
        dateSoins: new Date(),
        datePrescription: new Date(),
        medecinPrescripteur: undefined,
        cabinet_id: data.cabinet_id,
        actesOrthopediques: [],
        created_at: new Date(),
        updated_at: new Date()
      }))
    };
  }

  /**
   * Créer un nouveau bordereau et mettre à jour les factures semelles associées
   */
  static async createBordereau(bordereau: Bordereau): Promise<Bordereau> {
    try {
      // Créer le bordereau
      const { data, error } = await supabase
        .from('bordereaux')
        .insert([this.mapBordereauToDb(bordereau)])
        .select()
        .single();

      if (error) {
        log.error('❌ Erreur lors de la création du bordereau', { error: error.message });
        throw new Error(`Erreur lors de la création du bordereau: ${error.message}`);
      }

      const nouveauBordereau = this.mapDbToBordereau(data);

      // Mettre à jour les feuilles de soins avec l'ID du bordereau
      if (bordereau.feuillesSoins && bordereau.feuillesSoins.length > 0) {
        const feuilleIds = bordereau.feuillesSoins.map(f => f.id);
        const { error: updateError } = await supabase
          .from('feuilles_soins')
          .update({ bordereau_id: nouveauBordereau.id })
          .in('id', feuilleIds);

        if (updateError) {
          log.error('❌ Erreur lors de l\'association des feuilles de soins', { error: updateError.message });
        } else {
          log.info('✅ Feuilles de soins mises à jour', { bordereauId: nouveauBordereau.id, feuilleCount: feuilleIds.length });
        }
      }

      // Mettre à jour les factures semelles avec l'ID du bordereau
      if (bordereau.facturesSemelles && bordereau.facturesSemelles.length > 0) {
        log.info('🔍 Mise à jour des factures semelles', { 
          bordereauId: nouveauBordereau.id, 
          facturesCount: bordereau.facturesSemelles.length 
        });
        
        await Promise.all(
          bordereau.facturesSemelles.map(async (facture) => {
            try {
              log.info('📝 Mise à jour de la facture semelle', { 
                factureId: facture.id, 
                bordereauId: nouveauBordereau.id 
              });
              
              await FacturesSemellesService.updateFactureSemelles(facture.id, {
                bordereau_id: nouveauBordereau.id
              });
              
              log.info('✅ Facture semelle mise à jour avec succès', { 
                factureId: facture.id, 
                bordereauId: nouveauBordereau.id 
              });
            } catch (error) {
              log.error('❌ Erreur lors de la mise à jour de la facture semelle', { 
                factureId: facture.id, 
                bordereauId: nouveauBordereau.id,
                error: (error as Error).message 
              });
            }
          })
        );
      }

      log.info('✅ Bordereau créé avec succès', { id: nouveauBordereau.id });
      return nouveauBordereau;
    } catch (error) {
      log.error('❌ Erreur dans createBordereau', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Mapper l'interface Bordereau vers les données de la base
   */
  private static mapBordereauToDb(bordereau: Bordereau): any {
    return {
      id: bordereau.id,
      numero_bordereau: bordereau.numeroBordereau,
      date: bordereau.date,
      type: bordereau.type,
      montant_total: bordereau.montantTotal,
      modele_utilise: bordereau.modeleUtilise,
      cabinet_id: bordereau.cabinetId
    };
  }
}

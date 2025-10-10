import { supabase } from '../config/supabase';
import { log } from '../utils/logger';
import { Acte } from '../types';

export interface FeuilleSoinsActeSoins {
  id: string;
  feuille_soins_id: string;
  acte_soins_id: string;
  nombre_actes: number; // Quantité d'actes identiques
  created_at?: Date;
  updated_at?: Date;
}

export class FeuillesSoinsActesService {
  /**
   * Ajouter un acte soins à une feuille de soins avec une quantité
   */
  static async addActeSoinsToFeuille(feuilleSoinsId: string, acteSoinsId: string, nombreActes: number = 1): Promise<FeuilleSoinsActeSoins | null> {
    try {
      console.log('🔗 Ajout de l\'acte soins à la feuille de soins:', { feuilleSoinsId, acteSoinsId, nombreActes });

      // Vérifier d'abord que l'acte soins existe
      const { data: acteSoinsCheck, error: checkError } = await supabase
        .from('actes_soins')
        .select('id, code')
        .eq('id', acteSoinsId)
        .single();

      if (checkError || !acteSoinsCheck) {
        console.error('❌ Acte soins non trouvé:', acteSoinsId, checkError);
        return null;
      }

      console.log('✅ Acte soins trouvé:', acteSoinsCheck);

      const { data, error } = await supabase
        .from('feuilles_soins_actes_soins')
        .insert({
          feuille_soins_id: feuilleSoinsId,
          acte_soins_id: acteSoinsId,
          nombre_actes: nombreActes
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de l\'ajout de l\'acte soins:', error);
        console.error('Détails de l\'erreur:', { message: error.message, details: error.details, hint: error.hint });
        throw new Error(`Erreur lors de l'ajout: ${error.message}`);
      }

      console.log('✅ Acte soins ajouté à la feuille avec succès:', data.id, `(x${nombreActes})`);
      return {
        ...data,
        nombre_actes: data.nombre_actes,
        created_at: data.created_at ? new Date(data.created_at) : undefined,
        updated_at: data.updated_at ? new Date(data.updated_at) : undefined
      } as FeuilleSoinsActeSoins;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'acte soins:', error);
      log.error('Erreur lors de l\'ajout de l\'acte soins:', error);
      return null;
    }
  }

  /**
   * Récupérer les actes de plusieurs feuilles de soins en une seule requête
   * Déplie les actes selon leur quantité (nombre_actes)
   */
  static async getActesByFeuilles(feuilleSoinsIds: string[]): Promise<Acte[]> {
    try {
      if (feuilleSoinsIds.length === 0) return [];


      // Récupérer tous les actes soins pour toutes les feuilles avec leur quantité
      const { data: actesSoinsData, error: actesSoinsError } = await supabase
        .from('feuilles_soins_actes_soins')
        .select(`
          feuille_soins_id,
          acte_soins_id,
          nombre_actes,
          actes_soins!inner(*)
        `)
        .in('feuille_soins_id', feuilleSoinsIds) as any;

      if (actesSoinsError) {
        console.error('❌ Erreur lors de la récupération des actes soins:', actesSoinsError);
        throw new Error(`Erreur lors de la récupération des actes soins: ${actesSoinsError.message}`);
      }

      // Convertir les actes soins et les déplier selon leur quantité
      const actesSoins: Acte[] = [];
      
      (actesSoinsData || []).forEach((item: any) => {
        const acteTemplate = {
          id: item.actes_soins.id,
          patientId: '', // Sera rempli par le contexte
          date: new Date(),
          lettreCle: item.actes_soins.code,
          coefficient: item.actes_soins.coefficient,
          ifd: false,
          ik: undefined,
          majorationDimanche: false,
          majorationNuit: false,
          montant: item.actes_soins.tarif || 0,
          medecinPrescripteur: '', // Sera rempli par le contexte
          feuille_soins_id: item.feuille_soins_id
        };
        
        // Déplier l'acte selon sa quantité
        const nombreActes = item.nombre_actes || 1;
        for (let i = 0; i < nombreActes; i++) {
          actesSoins.push({ ...acteTemplate });
        }
      });

      return actesSoins;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des actes soins:', error);
      return [];
    }
  }

  /**
   * Récupérer tous les actes soins d'une feuille de soins
   * Déplie les actes selon leur quantité (nombre_actes)
   */
  static async getActesByFeuille(feuilleSoinsId: string): Promise<Acte[]> {
    try {
      console.log('🔍 Récupération des actes soins pour la feuille de soins:', feuilleSoinsId);

      // Récupérer les actes soins avec leur quantité
      const { data: actesSoinsData, error: actesSoinsError } = await supabase
        .from('feuilles_soins_actes_soins')
        .select(`
          acte_soins_id,
          nombre_actes,
          actes_soins!inner(*)
        `)
        .eq('feuille_soins_id', feuilleSoinsId) as any;

      if (actesSoinsError) {
        console.error('❌ Erreur lors de la récupération des actes soins:', actesSoinsError);
        throw new Error(`Erreur lors de la récupération des actes soins: ${actesSoinsError.message}`);
      }

      // Convertir les actes soins et les déplier selon leur quantité
      const actesSoins: Acte[] = [];
      
      (actesSoinsData || []).forEach((item: any) => {
        const acteTemplate = {
          id: item.actes_soins.id,
          patientId: '', // Sera rempli par le contexte
          date: new Date(),
          lettreCle: item.actes_soins.code,
          coefficient: item.actes_soins.coefficient,
          ifd: false,
          ik: undefined,
          majorationDimanche: false,
          majorationNuit: false,
          montant: item.actes_soins.tarif || 0, // Utiliser le tarif de l'acte
          medecinPrescripteur: '' // Sera rempli par le contexte
        };
        
        // Déplier l'acte selon sa quantité
        const nombreActes = item.nombre_actes || 1;
        for (let i = 0; i < nombreActes; i++) {
          actesSoins.push({ ...acteTemplate });
        }
      });

      console.log(`✅ ${actesSoins.length} actes soins récupérés pour la feuille de soins (dépliés)`);
      
      return actesSoins;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des actes:', error);
      log.error('Erreur lors de la récupération des actes:', error);
      return [];
    }
  }

  /**
   * Supprimer un acte soins d'une feuille de soins
   */
  static async removeActeSoinsFromFeuille(feuilleSoinsId: string, acteSoinsId: string): Promise<boolean> {
    try {
      console.log('🗑️ Suppression de l\'acte soins de la feuille de soins:', { feuilleSoinsId, acteSoinsId });

      const { error } = await supabase
        .from('feuilles_soins_actes_soins')
        .delete()
        .eq('feuille_soins_id', feuilleSoinsId)
        .eq('acte_soins_id', acteSoinsId);

      if (error) {
        console.error('❌ Erreur lors de la suppression de l\'acte soins:', error);
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }

      console.log('✅ Acte soins supprimé de la feuille avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'acte soins:', error);
      log.error('Erreur lors de la suppression de l\'acte soins:', error);
      return false;
    }
  }

  /**
   * Supprimer tous les actes d'une feuille de soins
   */
  static async removeAllActesFromFeuille(feuilleSoinsId: string): Promise<boolean> {
    try {
      console.log('🗑️ Suppression de tous les actes de la feuille de soins:', feuilleSoinsId);

      const { error } = await supabase
        .from('feuilles_soins_actes_soins')
        .delete()
        .eq('feuille_soins_id', feuilleSoinsId);

      if (error) {
        console.error('❌ Erreur lors de la suppression de tous les actes soins:', error);
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }

      console.log('✅ Tous les actes soins supprimés de la feuille avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de tous les actes soins:', error);
      log.error('Erreur lors de la suppression de tous les actes soins:', error);
      return false;
    }
  }

  /**
   * Mettre à jour tous les actes d'une feuille de soins
   * Supprime les anciens et ajoute les nouveaux (groupés par acte identique)
   */
  static async updateActesForFeuille(feuilleSoinsId: string, actes: Acte[]): Promise<boolean> {
    try {
      console.log('🔄 Mise à jour des actes de la feuille de soins:', { feuilleSoinsId, nbActes: actes.length });

      // 1. Supprimer tous les actes existants
      const removeSuccess = await this.removeAllActesFromFeuille(feuilleSoinsId);
      if (!removeSuccess) {
        throw new Error('Échec de la suppression des anciens actes');
      }

      // 2. Grouper les actes identiques par ID et compter les occurrences
      const actesGroupes = new Map<string, { acte: Acte; count: number }>();
      
      for (const acte of actes) {
        const existing = actesGroupes.get(acte.id);
        if (existing) {
          existing.count++;
        } else {
          actesGroupes.set(acte.id, { acte, count: 1 });
        }
      }

      console.log(`📊 Actes groupés: ${actesGroupes.size} acte(s) unique(s) sur ${actes.length} total`);

      // 3. Ajouter tous les actes groupés avec leur quantité
      for (const [acteId, { acte, count }] of Array.from(actesGroupes.entries())) {
        console.log('🔍 Traitement de l\'acte:', { 
          id: acte.id, 
          lettreCle: acte.lettreCle,
          count: count,
          type: typeof acte.id 
        });

        // Vérifier que l'acte existe dans actes_soins
        const { data: acteSoinsData, error: acteSoinsError } = await supabase
          .from('actes_soins')
          .select('id')
          .eq('id', acte.id)
          .single();

        if (acteSoinsData && !acteSoinsError) {
          console.log(`✅ Acte détecté comme acte soins: ${acte.id} (x${count})`);
          const success = await this.addActeSoinsToFeuille(feuilleSoinsId, acte.id, count);
          if (!success) {
            console.error('❌ Échec de l\'ajout comme acte soins:', acte.id);
          }
        } else {
          console.error('❌ Acte non trouvé dans actes_soins:', acte.id, acte.lettreCle);
          console.error('Erreur actes soins:', acteSoinsError);
        }
      }

      console.log('✅ Actes mis à jour avec succès pour la feuille:', feuilleSoinsId);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des actes:', error);
      log.error('Erreur lors de la mise à jour des actes:', error);
      return false;
    }
  }

  /**
   * Récupérer toutes les feuilles de soins qui utilisent un acte soins
   */
  static async getFeuillesByActeSoins(acteSoinsId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('feuilles_soins_actes_soins')
        .select('feuille_soins_id')
        .eq('acte_soins_id', acteSoinsId);

      if (error) {
        console.error('❌ Erreur lors de la récupération des feuilles (actes soins):', error);
        throw new Error(`Erreur lors de la récupération: ${error.message}`);
      }

      return data.map(item => item.feuille_soins_id);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des feuilles (actes soins):', error);
      log.error('Erreur lors de la récupération des feuilles (actes soins):', error);
      return [];
    }
  }
}
import { supabase } from '../config/supabase';
import { FeuilleSoins } from '../types';
import { log } from '../utils/logger';
import { FeuillesSoinsActesService } from './feuillesSoinsActesService';

export class FeuillesSoinsService {
  static async getFeuillesSoins(cabinetId: string): Promise<FeuilleSoins[]> {
    try {
      const { data, error } = await supabase
        .from('feuilles_soins')
        .select(`
          *,
          patient:patient_id(nom, prenom, date_naissance),
          medecin:medecin_prescripteur(nom, prenom)
        `)
        .eq('cabinet_id', cabinetId)
        .order('date_soins', { ascending: false });

      if (error) throw error;

      return data.map(fs => ({
        ...fs,
        dateSoins: new Date(fs.date_soins),
        datePrescription: new Date(fs.date_prescription),
        // Mapper la date de naissance du patient
        patient: fs.patient ? {
          ...fs.patient,
          dateNaissance: fs.patient.date_naissance ? new Date(fs.patient.date_naissance) : undefined
        } : undefined,
        // Les actes seront chargés séparément car ils ne sont pas dans la table principale
        actes: [],
        // Propriétés de compatibilité
        numeroFeuilleSoins: fs.numero_feuille,
        parcoursSoins: fs.is_parcours_soins,
        medecinPrescripteur: fs.medecin_prescripteur,
        conditions: {
          longueMaladie: fs.is_longue_maladie,
          atmp: fs.is_atmp,
          numeroAtmp: undefined,
          maternite: fs.is_maternite,
          urgence: fs.is_urgence,
          autresDerogations: fs.is_autres_derogations,
          descriptionAutresDerogations: undefined,
        },
        numeroPanierSoins: fs.panier_soins,
        montantTotal: fs.montant_total,
        montantPaye: 0, // Calculé côté client
        montantTiersPayant: 0, // Calculé côté client
        modeleUtilise: 'default', // Géré côté client
        assure: undefined,
        accordPrealable: undefined,
        bordereau_id: fs.bordereau_id,
      })) as FeuilleSoins[];
    } catch (error) {
      log.error('Erreur lors du chargement des feuilles de soins:', error);
      return [];
    }
  }

  static async createFeuilleSoins(feuilleSoins: Omit<FeuilleSoins, 'id' | 'created_at' | 'updated_at'>): Promise<FeuilleSoins | null> {
    try {
      console.log('📝 Création de la feuille de soins avec les données:', {
        numero_feuille: feuilleSoins.numero_feuille,
        patient_id: feuilleSoins.patient_id,
        medecin_prescripteur: feuilleSoins.medecin_prescripteur,
        cabinet_id: feuilleSoins.cabinet_id,
        date_soins: feuilleSoins.date_soins,
        dap: feuilleSoins.dap,
        is_atmp: feuilleSoins.is_atmp
      });

      // Validation des UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!feuilleSoins.patient_id || !uuidRegex.test(feuilleSoins.patient_id)) {
        throw new Error(`Patient ID invalide: ${feuilleSoins.patient_id}`);
      }
      
      if (!feuilleSoins.medecin_prescripteur || !uuidRegex.test(feuilleSoins.medecin_prescripteur)) {
        throw new Error(`Médecin prescripteur invalide: ${feuilleSoins.medecin_prescripteur}`);
      }
      
      if (!feuilleSoins.cabinet_id || !uuidRegex.test(feuilleSoins.cabinet_id)) {
        throw new Error(`Cabinet ID invalide: ${feuilleSoins.cabinet_id}`);
      }

      // Validation du DAP (indépendant d'ATMP)
      if (feuilleSoins.dap && feuilleSoins.dap.trim() !== '') {
        // Vérifier que le DAP contient exactement 8 chiffres
        const dapDigits = feuilleSoins.dap.replace(/\D/g, ''); // Garder seulement les chiffres
        if (dapDigits.length !== 8) {
          throw new Error(`DAP doit contenir exactement 8 chiffres (actuel: ${dapDigits.length} chiffres)`);
        }
      }

      const { data, error } = await supabase
        .from('feuilles_soins')
        .insert({
          numero_feuille: feuilleSoins.numero_feuille,
          date_soins: feuilleSoins.date_soins,
          medecin_prescripteur: feuilleSoins.medecin_prescripteur,
          date_prescription: feuilleSoins.date_prescription,
          montant_total: feuilleSoins.montant_total,
          cabinet_id: feuilleSoins.cabinet_id,
          patient_id: feuilleSoins.patient_id,
          dap: feuilleSoins.dap && feuilleSoins.dap.trim() !== '' ? feuilleSoins.dap : null,
          is_parcours_soins: feuilleSoins.is_parcours_soins,
          is_longue_maladie: feuilleSoins.is_longue_maladie,
          is_atmp: feuilleSoins.is_atmp,
          is_maternite: feuilleSoins.is_maternite,
          is_urgence: feuilleSoins.is_urgence,
          is_autres_derogations: feuilleSoins.is_autres_derogations,
          autres_derogations: feuilleSoins.autres_derogations || null,
          numero_atmp: feuilleSoins.numero_atmp || null,
          panier_soins: feuilleSoins.panier_soins,
          rsr: feuilleSoins.rsr,
          bordereau_id: feuilleSoins.bordereau_id || null,
        })
        .select(`
          *,
          patient:patient_id(nom, prenom, date_naissance),
          medecin:medecin_prescripteur(nom, prenom)
        `)
        .single();

      if (error) {
        console.error('❌ Erreur Supabase lors de la création de la feuille de soins:', error);
        
        // Messages d'erreur plus spécifiques
        if (error.message.includes('invalid input syntax for type uuid')) {
          throw new Error(`Erreur UUID: Un des champs (patient_id, medecin_prescripteur, cabinet_id) contient une valeur invalide`);
        } else if (error.message.includes('foreign key constraint')) {
          throw new Error(`Erreur de référence: Le patient ou le médecin sélectionné n'existe pas`);
        } else if (error.message.includes('not-null constraint')) {
          throw new Error(`Erreur de validation: Un champ obligatoire est manquant`);
        } else {
          throw new Error(`Erreur lors de la création: ${error.message}`);
        }
      }

      // Gérer les actes dans les tables de liaison
      if (feuilleSoins.actes && feuilleSoins.actes.length > 0) {
        console.log('🔗 Gestion des actes pour la feuille de soins:', data.id);
        const actesSuccess = await FeuillesSoinsActesService.updateActesForFeuille(data.id, feuilleSoins.actes);
        if (!actesSuccess) {
          console.warn('⚠️ Erreur lors de la gestion des actes, mais la feuille de soins est créée');
        }
      }

      const result = {
        ...data,
        dateSoins: new Date(data.date_soins),
        datePrescription: new Date(data.date_prescription),
        // Mapper la date de naissance du patient
        patient: data.patient ? {
          ...data.patient,
          dateNaissance: data.patient.date_naissance ? new Date(data.patient.date_naissance) : undefined
        } : undefined,
        actes: feuilleSoins.actes || [], // Garder les actes complets
        // Propriétés de compatibilité
        numeroFeuilleSoins: data.numero_feuille,
        parcoursSoins: data.is_parcours_soins,
        medecinPrescripteur: data.medecin_prescripteur,
        conditions: {
          longueMaladie: data.is_longue_maladie,
          atmp: data.is_atmp,
          numeroAtmp: data.dap,
          maternite: data.is_maternite,
          urgence: data.is_urgence,
          autresDerogations: data.is_autres_derogations,
          descriptionAutresDerogations: undefined,
        },
        numeroPanierSoins: data.panier_soins,
        montantTotal: data.montant_total,
        montantPaye: 0,
        montantTiersPayant: 0,
        modeleUtilise: 'default',
        assure: undefined,
        accordPrealable: undefined,
        bordereau_id: data.bordereau_id,
      } as FeuilleSoins;

      console.log('✅ Feuille de soins créée avec succès:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la création de la feuille de soins:', error);
      log.error('Erreur lors de la création de la feuille de soins:', error);
      
      // Améliorer le message d'erreur
      if (error instanceof Error) {
        throw new Error(`Erreur lors de la création de la feuille de soins: ${error.message}`);
      } else {
        throw new Error('Erreur inconnue lors de la création de la feuille de soins');
      }
    }
  }

  static async updateFeuilleSoins(id: string, updates: Partial<FeuilleSoins>): Promise<FeuilleSoins | null> {
    try {
      const updateData: any = {};
      
      if (updates.numero_feuille !== undefined) updateData.numero_feuille = updates.numero_feuille;
      if (updates.date_soins !== undefined) updateData.date_soins = updates.date_soins;
      if (updates.medecin_prescripteur !== undefined) updateData.medecin_prescripteur = updates.medecin_prescripteur;
      if (updates.date_prescription !== undefined) updateData.date_prescription = updates.date_prescription;
      if (updates.montant_total !== undefined) updateData.montant_total = updates.montant_total;
      if (updates.patient_id !== undefined) updateData.patient_id = updates.patient_id;
      if (updates.dap !== undefined) {
        updateData.dap = updates.dap && updates.dap.trim() !== '' ? updates.dap : null;
      }
      if (updates.is_parcours_soins !== undefined) updateData.is_parcours_soins = updates.is_parcours_soins;
      if (updates.is_longue_maladie !== undefined) updateData.is_longue_maladie = updates.is_longue_maladie;
      if (updates.is_atmp !== undefined) updateData.is_atmp = updates.is_atmp;
      if (updates.is_maternite !== undefined) updateData.is_maternite = updates.is_maternite;
      if (updates.is_urgence !== undefined) updateData.is_urgence = updates.is_urgence;
      if (updates.is_autres_derogations !== undefined) updateData.is_autres_derogations = updates.is_autres_derogations;
      if (updates.autres_derogations !== undefined) updateData.autres_derogations = updates.autres_derogations || null;
      if (updates.numero_atmp !== undefined) updateData.numero_atmp = updates.numero_atmp || null;
      if (updates.panier_soins !== undefined) updateData.panier_soins = updates.panier_soins;
      if (updates.rsr !== undefined) updateData.rsr = updates.rsr;
      if (updates.bordereau_id !== undefined) updateData.bordereau_id = updates.bordereau_id;

      const { data, error } = await supabase
        .from('feuilles_soins')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          patient:patient_id(nom, prenom, date_naissance),
          medecin:medecin_prescripteur(nom, prenom)
        `)
        .single();

      if (error) throw error;

      // Gérer les actes si ils sont mis à jour
      if (updates.actes !== undefined) {
        console.log('🔗 Mise à jour des actes pour la feuille de soins:', id);
        const actesSuccess = await FeuillesSoinsActesService.updateActesForFeuille(id, updates.actes);
        if (!actesSuccess) {
          console.warn('⚠️ Erreur lors de la mise à jour des actes, mais la feuille de soins est mise à jour');
        }
      }

      return {
        ...data,
        dateSoins: new Date(data.date_soins),
        datePrescription: new Date(data.date_prescription),
        // Mapper la date de naissance du patient
        patient: data.patient ? {
          ...data.patient,
          dateNaissance: data.patient.date_naissance ? new Date(data.patient.date_naissance) : undefined
        } : undefined,
        actes: updates.actes || [], // Garder les actes mis à jour
        // Propriétés de compatibilité
        numeroFeuilleSoins: data.numero_feuille,
        parcoursSoins: data.is_parcours_soins,
        medecinPrescripteur: data.medecin_prescripteur,
        conditions: {
          longueMaladie: data.is_longue_maladie,
          atmp: data.is_atmp,
          numeroAtmp: data.dap,
          maternite: data.is_maternite,
          urgence: data.is_urgence,
          autresDerogations: data.is_autres_derogations,
          descriptionAutresDerogations: undefined,
        },
        numeroPanierSoins: data.panier_soins,
        montantTotal: data.montant_total,
        montantPaye: 0,
        montantTiersPayant: 0,
        modeleUtilise: 'default',
        assure: undefined,
        accordPrealable: undefined,
        bordereau_id: data.bordereau_id,
      } as FeuilleSoins;
    } catch (error) {
      log.error('Erreur lors de la mise à jour de la feuille de soins:', error);
      throw error;
    }
  }

  static async deleteFeuilleSoins(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('feuilles_soins')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      log.error('Erreur lors de la suppression de la feuille de soins:', error);
      throw error;
    }
  }

  static async getFeuilleSoinsById(id: string): Promise<FeuilleSoins | null> {
    try {
      const { data, error } = await supabase
        .from('feuilles_soins')
        .select(`
          *,
          patient:patient_id(nom, prenom, date_naissance),
          medecin:medecin_prescripteur(nom, prenom)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        dateSoins: new Date(data.date_soins),
        datePrescription: new Date(data.date_prescription),
        // Mapper la date de naissance du patient
        patient: data.patient ? {
          ...data.patient,
          dateNaissance: data.patient.date_naissance ? new Date(data.patient.date_naissance) : undefined
        } : undefined,
        actes: [], // Les actes seront gérés séparément
        // Propriétés de compatibilité
        numeroFeuilleSoins: data.numero_feuille,
        parcoursSoins: data.is_parcours_soins,
        medecinPrescripteur: data.medecin_prescripteur,
        conditions: {
          longueMaladie: data.is_longue_maladie,
          atmp: data.is_atmp,
          numeroAtmp: data.dap,
          maternite: data.is_maternite,
          urgence: data.is_urgence,
          autresDerogations: data.is_autres_derogations,
          descriptionAutresDerogations: undefined,
        },
        numeroPanierSoins: data.panier_soins,
        montantTotal: data.montant_total,
        montantPaye: 0,
        montantTiersPayant: 0,
        modeleUtilise: 'default',
        assure: undefined,
        accordPrealable: undefined,
        bordereau_id: data.bordereau_id,
      } as FeuilleSoins;
    } catch (error) {
      log.error('Erreur lors du chargement de la feuille de soins:', error);
      return null;
    }
  }
}

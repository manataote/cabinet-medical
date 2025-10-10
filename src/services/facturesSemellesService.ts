import { supabase } from '../config/supabase';
import { FactureSemelles } from '../types';
import { log } from '../utils/logger';

export class FacturesSemellesService {
  /**
   * Récupère toutes les factures semelles pour un cabinet
   */
  static async getFacturesSemelles(cabinetId: string): Promise<FactureSemelles[]> {
    try {

      const { data, error } = await supabase
        .from('factures_semelles')
        .select(`
          *,
          patients:patient_id (
            id,
            numero_facture,
            nom,
            prenom,
            dn,
            date_naissance,
            adresse,
            telephone,
            assure_nom,
            assure_prenom,
            assure_dn,
            assure_date_naissance,
            assure_adresse,
            assure_telephone
          ),
          medecins:medecin_id (
            id,
            nom,
            prenom,
            specialite,
            numero_rpps,
            identification_prescripteur,
            adresse,
            telephone,
            email,
            actif
          )
        `)
        .eq('cabinet_id', cabinetId)
        .order('created_at', { ascending: false });

      if (error) {
        log.error('❌ Erreur lors de la récupération des factures semelles:', error);
        throw new Error(`Erreur lors de la récupération des factures semelles: ${error.message}`);
      }


      // Convertir les données de la base vers le format de l'interface
      const facturesMapped = data?.map(this.mapDbToFactureSemelles) || [];
      
      return facturesMapped;
    } catch (error) {
      log.error('❌ Erreur dans getFacturesSemelles:', error);
      throw error;
    }
  }

  /**
   * Récupère une facture semelles par son ID
   */
  static async getFactureSemellesById(id: string): Promise<FactureSemelles | null> {
    try {
      log.info('🔍 Récupération de la facture semelles...', { id });

      const { data, error } = await supabase
        .from('factures_semelles')
        .select(`
          *,
          patients:patient_id (
            id,
            numero_facture,
            nom,
            prenom,
            dn,
            date_naissance,
            adresse,
            telephone,
            assure_nom,
            assure_prenom,
            assure_dn,
            assure_date_naissance,
            assure_adresse,
            assure_telephone
          ),
          medecins:medecin_id (
            id,
            nom,
            prenom,
            specialite,
            numero_rpps,
            identification_prescripteur,
            adresse,
            telephone,
            email,
            actif
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          log.info('ℹ️ Facture semelles non trouvée', { id });
          return null;
        }
        log.error('❌ Erreur lors de la récupération de la facture semelles:', error);
        throw new Error(`Erreur lors de la récupération de la facture semelles: ${error.message}`);
      }

      log.info('✅ Facture semelles récupérée avec succès', { id });

      const facture = this.mapDbToFactureSemelles(data);
      
      // Charger les actes orthopédiques associés
      try {
        const { FacturesSemellesActesService } = await import('./facturesSemellesActesService');
        const actesOrthopediques = await FacturesSemellesActesService.getActesOrthopediquesByFacture(id);
        facture.actesOrthopediques = actesOrthopediques;
        log.info('✅ Actes orthopédiques chargés pour la facture', { factureId: id, actesCount: actesOrthopediques.length });
      } catch (error) {
        log.warning('⚠️ Erreur lors du chargement des actes orthopédiques', { factureId: id, error: (error as Error).message });
        facture.actesOrthopediques = [];
      }

      return facture;
    } catch (error) {
      log.error('❌ Erreur dans getFactureSemellesById:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle facture semelles
   */
  static async createFactureSemelles(facture: Omit<FactureSemelles, 'id' | 'created_at' | 'updated_at'>): Promise<FactureSemelles> {
    try {
      // Validation des données requises
      if (!facture.patient?.id || facture.patient.id.trim() === '') {
        throw new Error('Patient ID manquant ou invalide');
      }

      log.info('📝 Création de la facture semelles...', { 
        numeroFacture: facture.numeroFacture,
        patientId: facture.patient.id,
        montantTotal: facture.montantTotal
      });

      // Convertir vers le format de la base de données
      const factureData = this.mapFactureSemellesToDb(facture);

      const { data, error } = await supabase
        .from('factures_semelles')
        .insert(factureData)
        .select()
        .single();

      if (error) {
        log.error('❌ Erreur lors de la création de la facture semelles:', error);
        throw new Error(`Erreur lors de la création de la facture semelles: ${error.message}`);
      }

      log.info('✅ Facture semelles créée avec succès', { id: data.id });

      // Récupérer la facture complète avec les relations
      const factureComplete = await this.getFactureSemellesById(data.id);
      if (!factureComplete) {
        throw new Error('Erreur lors de la récupération de la facture créée');
      }

      return factureComplete;
    } catch (error) {
      log.error('❌ Erreur dans createFactureSemelles:', error);
      throw error;
    }
  }

  /**
   * Met à jour une facture semelles existante
   */
  static async updateFactureSemelles(id: string, facture: Partial<FactureSemelles>): Promise<FactureSemelles> {
    try {
      log.info('📝 Mise à jour de la facture semelles...', { id });

      // Convertir vers le format de la base de données
      const updateData = this.mapFactureSemellesToDb(facture, true);

      const { data, error } = await supabase
        .from('factures_semelles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        log.error('❌ Erreur lors de la mise à jour de la facture semelles:', error);
        throw new Error(`Erreur lors de la mise à jour de la facture semelles: ${error.message}`);
      }

      log.info('✅ Facture semelles mise à jour avec succès', { id });

      // Récupérer la facture complète avec les relations
      const factureComplete = await this.getFactureSemellesById(id);
      if (!factureComplete) {
        throw new Error('Erreur lors de la récupération de la facture mise à jour');
      }

      return factureComplete;
    } catch (error) {
      log.error('❌ Erreur dans updateFactureSemelles:', error);
      throw error;
    }
  }

  /**
   * Supprime une facture semelles
   */
  static async deleteFactureSemelles(id: string): Promise<void> {
    try {
      log.info('🗑️ Suppression de la facture semelles...', { id });

      const { error } = await supabase
        .from('factures_semelles')
        .delete()
        .eq('id', id);

      if (error) {
        log.error('❌ Erreur lors de la suppression de la facture semelles:', error);
        throw new Error(`Erreur lors de la suppression de la facture semelles: ${error.message}`);
      }

      log.info('✅ Facture semelles supprimée avec succès', { id });
    } catch (error) {
      log.error('❌ Erreur dans deleteFactureSemelles:', error);
      throw error;
    }
  }

  /**
   * Convertit les données de la base vers l'interface FactureSemelles
   */
  private static mapDbToFactureSemelles(data: any): FactureSemelles {
    return {
      id: data.id,
      numeroFacture: data.numero_facture,
      patient: {
        id: data.patients.id,
        numeroFacture: data.patients.numero_facture,
        nom: data.patients.nom,
        prenom: data.patients.prenom,
        dn: data.patients.dn,
        dateNaissance: new Date(data.patients.date_naissance),
        adresse: data.patients.adresse || '',
        telephone: data.patients.telephone || '',
        assure: data.patients.assure_nom ? {
          nom: data.patients.assure_nom,
          prenom: data.patients.assure_prenom,
          dn: data.patients.assure_dn,
          dateNaissance: new Date(data.patients.assure_date_naissance),
          adresse: data.patients.assure_adresse || '',
          telephone: data.patients.assure_telephone || ''
        } : undefined
      },
      dateSoins: new Date(data.date_facture), // date_facture correspond à dateSoins
      medecinPrescripteur: data.medecins ? {
        id: data.medecins.id,
        nom: data.medecins.nom,
        prenom: data.medecins.prenom,
        specialite: data.medecins.specialite,
        numeroRPPS: data.medecins.numero_rpps,
        identificationPrescripteur: data.medecins.identification_prescripteur,
        adresse: data.medecins.adresse,
        telephone: data.medecins.telephone,
        email: data.medecins.email,
        actif: data.medecins.actif
      } : undefined,
      datePrescription: new Date(data.date_facture), // Utilise la même date pour l'instant
      actesOrthopediques: [], // Sera rempli par FacturesSemellesActesService
      montantTotal: data.montant_total,
      // Champs pour compatibilité avec la base de données Supabase
      patient_id: data.patient_id,
      medecin_id: data.medecin_id,
      date_facture: new Date(data.date_facture),
      montant_total: data.montant_total,
      cabinet_id: data.cabinet_id,
      bordereau_id: data.bordereau_id,
      created_at: new Date(data.created_at || ''),
      updated_at: new Date(data.updated_at || '')
    };
  }

  /**
   * Convertit l'interface FactureSemelles vers le format de la base de données
   */
  private static mapFactureSemellesToDb(facture: Partial<FactureSemelles>, isUpdate: boolean = false): any {
    const data: any = {};

    if (facture.numeroFacture !== undefined) {
      data.numero_facture = facture.numeroFacture;
    }
    if (facture.patient?.id !== undefined) {
      data.patient_id = facture.patient.id;
    }
    if (facture.medecinPrescripteur && typeof facture.medecinPrescripteur === 'object') {
      data.medecin_id = facture.medecinPrescripteur.id;
    }
    if (facture.dateSoins !== undefined) {
      data.date_facture = facture.dateSoins instanceof Date ? facture.dateSoins.toISOString().split('T')[0] : facture.dateSoins;
    }
    if (facture.montantTotal !== undefined) {
      data.montant_total = facture.montantTotal;
    }
    if (facture.cabinet_id !== undefined) {
      data.cabinet_id = facture.cabinet_id;
    }
    if (facture.bordereau_id !== undefined) {
      data.bordereau_id = facture.bordereau_id;
    }

    return data;
  }
}

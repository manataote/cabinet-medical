import { supabase } from '../config/supabase';
import { Patient, Ordonnance, FeuilleSoins, FactureSemelles, Bordereau, Medecin, ActeTemplate } from '../types';

// Fonction pour générer un UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

export interface MigrationResult {
  success: boolean;
  patientsCount: number;
  ordonnancesCount: number;
  feuillesCount: number;
  facturesCount: number;
  bordereauxCount: number;
  medecinsCount: number;
  actesCount: number;
  errors: string[];
}

export class DataMigration {
  private static async getCabinetId(): Promise<string> {
    const { data: cabinetData, error: cabinetError } = await supabase
      .from('cabinets')
      .select('id')
      .eq('name', 'Cabinet Médical')
      .single();

    if (cabinetError || !cabinetData) {
      throw new Error('Impossible de trouver le cabinet par défaut');
    }

    return cabinetData.id;
  }

  static async migratePatients(patients: Patient[]): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    try {
      const cabinetId = await this.getCabinetId();

      // Préparer les données pour Supabase
      const patientsData = patients.map(patient => ({
        id: generateUUID(), // Nouvel UUID pour Supabase
        nom: patient.nom,
        prenom: patient.prenom,
        date_naissance: patient.dateNaissance,
        telephone: patient.telephone || null,
        cabinet_id: cabinetId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insérer par lots de 100 pour éviter les limites
      const batchSize = 100;
      for (let i = 0; i < patientsData.length; i += batchSize) {
        const batch = patientsData.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('patients')
          .insert(batch);

        if (error) {
          errors.push(`Erreur lors de l'insertion des patients (lot ${Math.floor(i/batchSize) + 1}): ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      return {
        success: errors.length === 0,
        count: successCount,
        errors
      };
    } catch (error) {
      errors.push(`Erreur générale lors de la migration des patients: ${error}`);
      return {
        success: false,
        count: successCount,
        errors
      };
    }
  }

  static async migrateOrdonnances(ordonnances: Ordonnance[]): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    try {
      const cabinetId = await this.getCabinetId();

      // Préparer les données pour Supabase
      const ordonnancesData = ordonnances.map(ordonnance => ({
        id: generateUUID(), // Nouvel UUID pour Supabase
        patient_id: null, // Sera mis à jour après migration des patients
        type: ordonnance.type,
        date_ordonnance: ordonnance.date_ordonnance,
        duree_soins: ordonnance.duree_soins || null,
        quantite: ordonnance.quantite || null,
        medecin_prescripteur_id: null, // Sera mis à jour après migration des médecins
        fichier_url: ordonnance.fichier_url || null,
        nom_fichier_url: ordonnance.nom_fichier || null,
        type_fichier_url: ordonnance.type_fichier || null,
        taille_fichier_url: ordonnance.taille_fichier || null,
        date_import: ordonnance.date_import,
        cabinet_id: cabinetId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insérer par lots
      const batchSize = 100;
      for (let i = 0; i < ordonnancesData.length; i += batchSize) {
        const batch = ordonnancesData.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('ordonnances')
          .insert(batch);

        if (error) {
          errors.push(`Erreur lors de l'insertion des ordonnances (lot ${Math.floor(i/batchSize) + 1}): ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      return {
        success: errors.length === 0,
        count: successCount,
        errors
      };
    } catch (error) {
      errors.push(`Erreur générale lors de la migration des ordonnances: ${error}`);
      return {
        success: false,
        count: successCount,
        errors
      };
    }
  }

  static async migrateFeuillesSoins(feuilles: FeuilleSoins[]): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    try {
      const cabinetId = await this.getCabinetId();

      // Préparer les données pour Supabase
      const feuillesData = feuilles.map(feuille => ({
        id: generateUUID(), // Nouvel UUID pour Supabase
        patient_id: null, // Sera mis à jour après migration des patients
        medecin_id: null, // Pas de médecin ID dans FeuilleSoins
        date_prescription: feuille.datePrescription,
        cabinet_id: cabinetId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insérer par lots
      const batchSize = 100;
      for (let i = 0; i < feuillesData.length; i += batchSize) {
        const batch = feuillesData.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('feuilles_soins')
          .insert(batch);

        if (error) {
          errors.push(`Erreur lors de l'insertion des feuilles de soins (lot ${Math.floor(i/batchSize) + 1}): ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      return {
        success: errors.length === 0,
        count: successCount,
        errors
      };
    } catch (error) {
      errors.push(`Erreur générale lors de la migration des feuilles de soins: ${error}`);
      return {
        success: false,
        count: successCount,
        errors
      };
    }
  }

  static async migrateFactures(factures: FactureSemelles[]): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    try {
      const cabinetId = await this.getCabinetId();

      // Préparer les données pour Supabase
      const facturesData = factures.map(facture => ({
        id: generateUUID(), // Nouvel UUID pour Supabase
        numero_facture: facture.numeroFacture,
        patient_id: null, // Sera mis à jour après migration des patients
        date_facture: facture.dateSoins,
        montant_total: facture.montantTotal,
        cabinet_id: cabinetId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insérer par lots
      const batchSize = 100;
      for (let i = 0; i < facturesData.length; i += batchSize) {
        const batch = facturesData.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('factures_semelles')
          .insert(batch);

        if (error) {
          errors.push(`Erreur lors de l'insertion des factures (lot ${Math.floor(i/batchSize) + 1}): ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      return {
        success: errors.length === 0,
        count: successCount,
        errors
      };
    } catch (error) {
      errors.push(`Erreur générale lors de la migration des factures: ${error}`);
      return {
        success: false,
        count: successCount,
        errors
      };
    }
  }

  static async migrateBordereaux(bordereaux: Bordereau[]): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    try {
      const cabinetId = await this.getCabinetId();

      // Préparer les données pour Supabase
      const bordereauxData = bordereaux.map(bordereau => ({
        id: generateUUID(), // Nouvel UUID pour Supabase
        numero_bordereau: bordereau.numeroBordereau,
        date_bordereau: bordereau.date,
        montant_total: bordereau.montantTotal,
        cabinet_id: cabinetId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insérer par lots
      const batchSize = 100;
      for (let i = 0; i < bordereauxData.length; i += batchSize) {
        const batch = bordereauxData.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('bordereaux')
          .insert(batch);

        if (error) {
          errors.push(`Erreur lors de l'insertion des bordereaux (lot ${Math.floor(i/batchSize) + 1}): ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      return {
        success: errors.length === 0,
        count: successCount,
        errors
      };
    } catch (error) {
      errors.push(`Erreur générale lors de la migration des bordereaux: ${error}`);
      return {
        success: false,
        count: successCount,
        errors
      };
    }
  }

  static async migrateMedecins(medecins: Medecin[]): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    try {
      const cabinetId = await this.getCabinetId();

      // Préparer les données pour Supabase
      const medecinsData = medecins.map(medecin => ({
        id: generateUUID(), // Nouvel UUID pour Supabase
        nom: medecin.nom,
        prenom: medecin.prenom,
        specialite: medecin.specialite || null,
        numero_ordre: medecin.numeroRPPS || null,
        cabinet_id: cabinetId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insérer par lots
      const batchSize = 100;
      for (let i = 0; i < medecinsData.length; i += batchSize) {
        const batch = medecinsData.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('medecins')
          .insert(batch);

        if (error) {
          errors.push(`Erreur lors de l'insertion des médecins (lot ${Math.floor(i/batchSize) + 1}): ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      return {
        success: errors.length === 0,
        count: successCount,
        errors
      };
    } catch (error) {
      errors.push(`Erreur générale lors de la migration des médecins: ${error}`);
      return {
        success: false,
        count: successCount,
        errors
      };
    }
  }

  static async migrateActes(actes: ActeTemplate[]): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    try {
      const cabinetId = await this.getCabinetId();

      // Préparer les données pour Supabase
      const actesData = actes.map(acte => ({
        id: generateUUID(), // Nouvel UUID pour Supabase
        code: acte.lettreCle,
        libelle: acte.libelle,
        tarif: acte.tarif,
        cabinet_id: cabinetId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insérer par lots
      const batchSize = 100;
      for (let i = 0; i < actesData.length; i += batchSize) {
        const batch = actesData.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('actes')
          .insert(batch);

        if (error) {
          errors.push(`Erreur lors de l'insertion des actes (lot ${Math.floor(i/batchSize) + 1}): ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      return {
        success: errors.length === 0,
        count: successCount,
        errors
      };
    } catch (error) {
      errors.push(`Erreur générale lors de la migration des actes: ${error}`);
      return {
        success: false,
        count: successCount,
        errors
      };
    }
  }

  static async migrateAllData(state: any): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      patientsCount: 0,
      ordonnancesCount: 0,
      feuillesCount: 0,
      facturesCount: 0,
      bordereauxCount: 0,
      medecinsCount: 0,
      actesCount: 0,
      errors: []
    };

    try {
      console.log('🚀 Début de la migration des données vers Supabase...');

      // Migrer les médecins d'abord (références)
      if (state.medecins && state.medecins.length > 0) {
        console.log(`📋 Migration de ${state.medecins.length} médecins...`);
        const medecinsResult = await this.migrateMedecins(state.medecins);
        result.medecinsCount = medecinsResult.count;
        result.errors.push(...medecinsResult.errors);
      }

      // Migrer les actes
      if (state.actes && state.actes.length > 0) {
        console.log(`📋 Migration de ${state.actes.length} actes...`);
        const actesResult = await this.migrateActes(state.actes);
        result.actesCount = actesResult.count;
        result.errors.push(...actesResult.errors);
      }

      // Migrer les patients
      if (state.patients && state.patients.length > 0) {
        console.log(`👥 Migration de ${state.patients.length} patients...`);
        const patientsResult = await this.migratePatients(state.patients);
        result.patientsCount = patientsResult.count;
        result.errors.push(...patientsResult.errors);
      }

      // Migrer les ordonnances
      if (state.ordonnances && state.ordonnances.length > 0) {
        console.log(`📄 Migration de ${state.ordonnances.length} ordonnances...`);
        const ordonnancesResult = await this.migrateOrdonnances(state.ordonnances);
        result.ordonnancesCount = ordonnancesResult.count;
        result.errors.push(...ordonnancesResult.errors);
      }

      // Migrer les feuilles de soins
      if (state.feuillesSoins && state.feuillesSoins.length > 0) {
        console.log(`📋 Migration de ${state.feuillesSoins.length} feuilles de soins...`);
        const feuillesResult = await this.migrateFeuillesSoins(state.feuillesSoins);
        result.feuillesCount = feuillesResult.count;
        result.errors.push(...feuillesResult.errors);
      }

      // Migrer les factures
      if (state.facturesSemelles && state.facturesSemelles.length > 0) {
        console.log(`💰 Migration de ${state.facturesSemelles.length} factures...`);
        const facturesResult = await this.migrateFactures(state.facturesSemelles);
        result.facturesCount = facturesResult.count;
        result.errors.push(...facturesResult.errors);
      }

      // Migrer les bordereaux
      if (state.bordereaux && state.bordereaux.length > 0) {
        console.log(`📊 Migration de ${state.bordereaux.length} bordereaux...`);
        const bordereauxResult = await this.migrateBordereaux(state.bordereaux);
        result.bordereauxCount = bordereauxResult.count;
        result.errors.push(...bordereauxResult.errors);
      }

      result.success = result.errors.length === 0;
      
      if (result.success) {
        console.log('✅ Migration terminée avec succès !');
      } else {
        console.log('⚠️ Migration terminée avec des erreurs:', result.errors);
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Erreur générale lors de la migration: ${error}`);
      console.error('❌ Erreur lors de la migration:', error);
      return result;
    }
  }
}

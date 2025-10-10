import { supabase } from '../config/supabase';
import { Acte, ActeTemplate } from '../types';

export class ActesService {
  // Récupérer l'UUID du cabinet par défaut depuis Supabase
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

  // ===== ACTES INDIVIDUELS =====

  // Récupérer tous les actes individuels (dans les feuilles de soins)
  static async getActes(): Promise<Acte[]> {
    const cabinetId = await this.getDefaultCabinetId();

    const { data, error } = await supabase
      .from('actes')
      .select('*')
      .eq('cabinet_id', cabinetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des actes:', error);
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      patientId: row.patient_id || '',
      date: row.created_at ? new Date(row.created_at) : new Date(),
      lettreCle: row.code || '',
      coefficient: row.coefficient || 0,
      ifd: row.ifd || false,
      ik: row.ik || undefined,
      majorationDimanche: row.majoration_dimanche || false,
      majorationNuit: row.majoration_nuit || false,
      montant: row.montant || 0,
      medecinPrescripteur: row.medecin_prescripteur || '',
      commentaire: row.commentaire || undefined
    }));
  }

  // Récupérer les actes d'un patient spécifique
  static async getActesByPatient(patientId: string): Promise<Acte[]> {
    const { data, error } = await supabase
      .from('actes')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des actes du patient:', error);
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      patientId: row.patient_id || '',
      date: row.created_at ? new Date(row.created_at) : new Date(),
      lettreCle: row.code || '',
      coefficient: row.coefficient || 0,
      ifd: row.ifd || false,
      ik: row.ik || undefined,
      majorationDimanche: row.majoration_dimanche || false,
      majorationNuit: row.majoration_nuit || false,
      montant: row.montant || 0,
      medecinPrescripteur: row.medecin_prescripteur || '',
      commentaire: row.commentaire || undefined
    }));
  }

  // Créer un nouvel acte
  static async createActe(acte: Omit<Acte, 'id'>): Promise<Acte> {
    const cabinetId = await this.getDefaultCabinetId();

    const { data, error } = await supabase
      .from('actes')
      .insert({
        patient_id: acte.patientId,
        code: acte.lettreCle,
        coefficient: acte.coefficient,
        ifd: acte.ifd,
        ik: acte.ik,
        majoration_dimanche: acte.majorationDimanche,
        majoration_nuit: acte.majorationNuit,
        montant: acte.montant,
        medecin_prescripteur: acte.medecinPrescripteur,
        commentaire: acte.commentaire,
        cabinet_id: cabinetId
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'acte:', error);
      throw error;
    }

    return {
      id: data.id,
      patientId: data.patient_id,
      date: data.created_at ? new Date(data.created_at) : new Date(),
      lettreCle: data.code || '',
      coefficient: data.coefficient || 0,
      ifd: data.ifd || false,
      ik: data.ik || undefined,
      majorationDimanche: data.majoration_dimanche || false,
      majorationNuit: data.majoration_nuit || false,
      montant: data.montant || 0,
      medecinPrescripteur: data.medecin_prescripteur || '',
      commentaire: data.commentaire || undefined
    };
  }

  // Mettre à jour un acte
  static async updateActe(acte: Acte): Promise<Acte> {
    const { data, error } = await supabase
      .from('actes')
      .update({
        patient_id: acte.patientId,
        code: acte.lettreCle,
        coefficient: acte.coefficient,
        ifd: acte.ifd,
        ik: acte.ik,
        majoration_dimanche: acte.majorationDimanche,
        majoration_nuit: acte.majorationNuit,
        montant: acte.montant,
        medecin_prescripteur: acte.medecinPrescripteur,
        commentaire: acte.commentaire,
        updated_at: new Date().toISOString()
      })
      .eq('id', acte.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'acte:', error);
      throw error;
    }

    return {
      id: data.id,
      patientId: data.patient_id,
      date: data.created_at ? new Date(data.created_at) : new Date(),
      lettreCle: data.code || '',
      coefficient: data.coefficient || 0,
      ifd: data.ifd || false,
      ik: data.ik || undefined,
      majorationDimanche: data.majoration_dimanche || false,
      majorationNuit: data.majoration_nuit || false,
      montant: data.montant || 0,
      medecinPrescripteur: data.medecin_prescripteur || '',
      commentaire: data.commentaire || undefined
    };
  }

  // Supprimer un acte
  static async deleteActe(acteId: string): Promise<void> {
    const { error } = await supabase
      .from('actes')
      .delete()
      .eq('id', acteId);

    if (error) {
      console.error('Erreur lors de la suppression de l\'acte:', error);
      throw error;
    }
  }

  // ===== TEMPLATES D'ACTES =====

  // Récupérer tous les templates d'actes
  static async getActeTemplates(): Promise<ActeTemplate[]> {
    const cabinetId = await this.getDefaultCabinetId();

    const { data, error } = await supabase
      .from('actes')
      .select('*')
      .eq('cabinet_id', cabinetId)
      .order('code', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des templates d\'actes:', error);
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      lettreCle: row.type === 'soins' ? row.code || '' : undefined,
      coefficient: row.coefficient || 0,
      // Mapping des libellés selon le type d'acte
      libelle: row.libelle || '',
      tarif: row.tarif || 0,
      type: row.type || 'soins',
      actif: row.actif !== undefined ? row.actif : true,
      // Champs spécifiques aux actes orthopédiques
      codeLPPR: row.type === 'orthopedique' ? row.code || '' : undefined,
      libelleFacture: row.type === 'orthopedique' ? row.libelle_facture || '' : undefined,
      quantite: row.quantite || undefined,
      total: row.total || undefined,
      partCPS: row.part_cps || undefined,
      partPatient: row.part_patient || undefined,
      tarifBaseLPPR: row.tarif_base_lppr || undefined,
      tauxApplique: row.taux_applique || undefined,
      regime: row.regime || undefined
    }));
  }

  // Créer un nouveau template d'acte
  static async createActeTemplate(template: Omit<ActeTemplate, 'id'>): Promise<ActeTemplate> {
    const cabinetId = await this.getDefaultCabinetId();

    // Déterminer la valeur du code selon le type d'acte
    const codeValue = template.type === 'soins' ? template.lettreCle : template.codeLPPR;
    
    // Mapping des libellés selon le type d'acte
    const libelleValue = template.type === 'soins' ? template.libelle : template.libelle;
    const libelleFactureValue = template.type === 'orthopedique' ? template.libelleFacture : null;
    
    const { data, error } = await supabase
      .from('actes')
      .insert({
        code: codeValue,
        libelle: libelleValue,
        tarif: template.tarif,
        coefficient: template.coefficient,
        type: template.type,
        actif: template.actif,
        // Champs spécifiques aux actes orthopédiques
        quantite: template.type === 'orthopedique' ? template.quantite : null,
        taux_applique: template.type === 'orthopedique' ? template.tauxApplique : null,
        regime: template.type === 'orthopedique' ? template.regime : null,
        total: template.type === 'orthopedique' ? template.total : null,
        part_cps: template.type === 'orthopedique' ? template.partCPS : null,
        part_patient: template.type === 'orthopedique' ? template.partPatient : null,
        libelle_facture: libelleFactureValue,
        cabinet_id: cabinetId
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du template d\'acte:', error);
      throw error;
    }

    return {
      id: data.id,
      lettreCle: data.type === 'soins' ? data.code || '' : undefined,
      coefficient: data.coefficient || 0,
      // Mapping des libellés selon le type d'acte
      libelle: data.libelle || '',
      tarif: data.tarif || 0,
      type: data.type || 'soins',
      actif: data.actif !== undefined ? data.actif : true,
      // Champs spécifiques aux actes orthopédiques
      codeLPPR: data.type === 'orthopedique' ? data.code || '' : undefined,
      libelleFacture: data.type === 'orthopedique' ? data.libelle_facture || '' : undefined,
      quantite: data.quantite || undefined,
      total: data.total || undefined,
      partCPS: data.part_cps || undefined,
      partPatient: data.part_patient || undefined,
      tarifBaseLPPR: data.tarif_base_lppr || undefined,
      tauxApplique: data.taux_applique || undefined,
      regime: data.regime || undefined
    };
  }

  // Mettre à jour un template d'acte
  static async updateActeTemplate(template: ActeTemplate): Promise<ActeTemplate> {
    try {

      // Déterminer la valeur du code selon le type d'acte
      const codeValue = template.type === 'soins' ? template.lettreCle : template.codeLPPR;
      
      // Mapping des libellés selon le type d'acte
      const libelleValue = template.type === 'soins' ? template.libelle : template.libelle;
      const libelleFactureValue = template.type === 'orthopedique' ? template.libelleFacture : null;
      
      const { data, error } = await supabase
        .from('actes')
        .update({
          code: codeValue,
          libelle: libelleValue,
          tarif: template.tarif,
          coefficient: template.coefficient,
          type: template.type,
          actif: template.actif,
          // Champs spécifiques aux actes orthopédiques
          quantite: template.type === 'orthopedique' ? template.quantite : null,
          taux_applique: template.type === 'orthopedique' ? template.tauxApplique : null,
          regime: template.type === 'orthopedique' ? template.regime : null,
          total: template.type === 'orthopedique' ? template.total : null,
          part_cps: template.type === 'orthopedique' ? template.partCPS : null,
          part_patient: template.type === 'orthopedique' ? template.partPatient : null,
          libelle_facture: libelleFactureValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour du template d\'acte:', error);
        throw error;
      }

      console.log('✅ Template d\'acte mis à jour avec succès:', data);

      return {
        id: data.id,
        lettreCle: data.code || '',
        coefficient: data.coefficient || 0,
        libelle: data.libelle || '',
        tarif: data.tarif || 0,
        type: data.type || 'soins',
        actif: data.actif !== undefined ? data.actif : true
      };
    } catch (error) {
      console.error('❌ Erreur complète lors de la mise à jour:', error);
      throw error;
    }
  }

  // Supprimer un template d'acte
  static async deleteActeTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('actes')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Erreur lors de la suppression du template d\'acte:', error);
      throw error;
    }
  }
}
